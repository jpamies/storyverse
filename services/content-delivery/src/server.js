const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const winston = require('winston');
const AWS = require('aws-sdk');
const redis = require('redis');
const PDFDocument = require('pdfkit');
const archiver = require('archiver');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const promClient = require('prom-client');
const dotenv = require('dotenv');
const http = require('http');

// Load environment variables
dotenv.config();

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'content-delivery' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Initialize Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Initialize Prometheus metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});
register.registerMetric(httpRequestDurationMicroseconds);

const deliveryCounter = new promClient.Counter({
  name: 'content_delivery_total',
  help: 'Total number of content deliveries',
  labelNames: ['format', 'status']
});
register.registerMetric(deliveryCounter);

const cacheHitCounter = new promClient.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits'
});
register.registerMetric(cacheHitCounter);

const cacheMissCounter = new promClient.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses'
});
register.registerMetric(cacheMissCounter);

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const S3_BUCKET = process.env.S3_BUCKET || 'storyverse-media';

// Initialize Redis client for caching
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
let redisClient;

(async () => {
  try {
    redisClient = redis.createClient({
      url: `redis://${REDIS_HOST}:${REDIS_PORT}`
    });
    
    await redisClient.connect();
    logger.info('Connected to Redis');
    
    redisClient.on('error', (err) => {
      logger.error('Redis error:', err);
    });
  } catch (err) {
    logger.error('Redis connection error:', err);
    redisClient = null;
  }
})();

// Create temp directory for file operations
const TEMP_DIR = path.join(__dirname, '../temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Get story content endpoint
app.get('/api/story/:storyId', async (req, res) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  
  try {
    const { storyId } = req.params;
    
    // Check cache first
    if (redisClient) {
      const cachedStory = await redisClient.get(`story:${storyId}`);
      if (cachedStory) {
        cacheHitCounter.inc();
        
        const story = JSON.parse(cachedStory);
        
        end({ method: 'GET', route: '/api/story/:storyId', status_code: 200 });
        return res.status(200).json(story);
      }
    }
    
    cacheMissCounter.inc();
    
    // Fetch story from Story Database service
    const storyDbUrl = process.env.STORY_DB_URL || 'http://story-database:8080';
    
    const storyResponse = await fetchWithTimeout(`${storyDbUrl}/api/stories/${storyId}`);
    
    if (!storyResponse.ok) {
      throw new Error(`Failed to fetch story: ${storyResponse.statusText}`);
    }
    
    const story = await storyResponse.json();
    
    // Cache the story
    if (redisClient) {
      await redisClient.set(`story:${storyId}`, JSON.stringify(story), {
        EX: 3600 // Cache for 1 hour
      });
    }
    
    end({ method: 'GET', route: '/api/story/:storyId', status_code: 200 });
    res.status(200).json(story);
    
  } catch (error) {
    logger.error('Error fetching story:', error);
    
    end({ method: 'GET', route: '/api/story/:storyId', status_code: 500 });
    res.status(500).json({ error: error.message });
  }
});

// Generate PDF endpoint
app.post('/api/story/:storyId/pdf', async (req, res) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  
  try {
    const { storyId } = req.params;
    
    // Fetch story from Story Database service
    const storyDbUrl = process.env.STORY_DB_URL || 'http://story-database:8080';
    
    const storyResponse = await fetchWithTimeout(`${storyDbUrl}/api/stories/${storyId}`);
    
    if (!storyResponse.ok) {
      throw new Error(`Failed to fetch story: ${storyResponse.statusText}`);
    }
    
    const story = await storyResponse.json();
    
    // Create PDF
    const pdfPath = path.join(TEMP_DIR, `${storyId}_${Date.now()}.pdf`);
    
    await generatePDF(story, pdfPath);
    
    // Upload to S3
    const s3Key = `stories/${storyId}/exports/${path.basename(pdfPath)}`;
    
    const fileContent = fs.readFileSync(pdfPath);
    
    const params = {
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: fileContent,
      ContentType: 'application/pdf'
    };
    
    const s3Response = await s3.upload(params).promise();
    
    // Clean up local file
    fs.unlinkSync(pdfPath);
    
    deliveryCounter.inc({ format: 'pdf', status: 'success' });
    
    end({ method: 'POST', route: '/api/story/:storyId/pdf', status_code: 200 });
    
    res.status(200).json({
      url: s3Response.Location,
      key: s3Response.Key
    });
    
  } catch (error) {
    logger.error('Error generating PDF:', error);
    
    deliveryCounter.inc({ format: 'pdf', status: 'error' });
    
    end({ method: 'POST', route: '/api/story/:storyId/pdf', status_code: 500 });
    res.status(500).json({ error: error.message });
  }
});

// Generate ZIP package endpoint (includes all story assets)
app.post('/api/story/:storyId/package', async (req, res) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  
  try {
    const { storyId } = req.params;
    
    // Fetch story from Story Database service
    const storyDbUrl = process.env.STORY_DB_URL || 'http://story-database:8080';
    
    const storyResponse = await fetchWithTimeout(`${storyDbUrl}/api/stories/${storyId}`);
    
    if (!storyResponse.ok) {
      throw new Error(`Failed to fetch story: ${storyResponse.statusText}`);
    }
    
    const story = await storyResponse.json();
    
    // Create temporary directory for package contents
    const packageDir = path.join(TEMP_DIR, `package_${storyId}_${Date.now()}`);
    fs.mkdirSync(packageDir, { recursive: true });
    
    // Create PDF
    const pdfPath = path.join(packageDir, `${story.title || 'story'}.pdf`);
    await generatePDF(story, pdfPath);
    
    // Create JSON file with story data
    const jsonPath = path.join(packageDir, 'story.json');
    fs.writeFileSync(jsonPath, JSON.stringify(story, null, 2));
    
    // Download images
    if (story.content && story.content.pages) {
      const imagesDir = path.join(packageDir, 'images');
      fs.mkdirSync(imagesDir, { recursive: true });
      
      for (const page of story.content.pages) {
        if (page.imageUrl) {
          try {
            const imageName = `page_${page.pageNumber}.jpg`;
            const imagePath = path.join(imagesDir, imageName);
            
            // Download image
            await downloadFile(page.imageUrl, imagePath);
          } catch (err) {
            logger.error(`Error downloading image for page ${page.pageNumber}:`, err);
          }
        }
      }
    }
    
    // Download audio if available
    if (story.mediaOptions && story.mediaOptions.audioUrl) {
      const audioDir = path.join(packageDir, 'audio');
      fs.mkdirSync(audioDir, { recursive: true });
      
      try {
        const audioPath = path.join(audioDir, 'narration.mp3');
        await downloadFile(story.mediaOptions.audioUrl, audioPath);
      } catch (err) {
        logger.error('Error downloading audio:', err);
      }
    }
    
    // Create ZIP file
    const zipPath = path.join(TEMP_DIR, `${storyId}_${Date.now()}.zip`);
    await createZipArchive(packageDir, zipPath);
    
    // Upload to S3
    const s3Key = `stories/${storyId}/exports/${path.basename(zipPath)}`;
    
    const fileContent = fs.readFileSync(zipPath);
    
    const params = {
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: fileContent,
      ContentType: 'application/zip'
    };
    
    const s3Response = await s3.upload(params).promise();
    
    // Clean up local files
    fs.rmSync(packageDir, { recursive: true, force: true });
    fs.unlinkSync(zipPath);
    
    deliveryCounter.inc({ format: 'package', status: 'success' });
    
    end({ method: 'POST', route: '/api/story/:storyId/package', status_code: 200 });
    
    res.status(200).json({
      url: s3Response.Location,
      key: s3Response.Key
    });
    
  } catch (error) {
    logger.error('Error generating package:', error);
    
    deliveryCounter.inc({ format: 'package', status: 'error' });
    
    end({ method: 'POST', route: '/api/story/:storyId/package', status_code: 500 });
    res.status(500).json({ error: error.message });
  }
});

// Generate HTML version endpoint
app.post('/api/story/:storyId/html', async (req, res) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  
  try {
    const { storyId } = req.params;
    
    // Fetch story from Story Database service
    const storyDbUrl = process.env.STORY_DB_URL || 'http://story-database:8080';
    
    const storyResponse = await fetchWithTimeout(`${storyDbUrl}/api/stories/${storyId}`);
    
    if (!storyResponse.ok) {
      throw new Error(`Failed to fetch story: ${storyResponse.statusText}`);
    }
    
    const story = await storyResponse.json();
    
    // Generate HTML content
    const htmlContent = generateHTML(story);
    
    // Create HTML file
    const htmlPath = path.join(TEMP_DIR, `${storyId}_${Date.now()}.html`);
    fs.writeFileSync(htmlPath, htmlContent);
    
    // Upload to S3
    const s3Key = `stories/${storyId}/exports/${path.basename(htmlPath)}`;
    
    const fileContent = fs.readFileSync(htmlPath);
    
    const params = {
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: fileContent,
      ContentType: 'text/html'
    };
    
    const s3Response = await s3.upload(params).promise();
    
    // Clean up local file
    fs.unlinkSync(htmlPath);
    
    deliveryCounter.inc({ format: 'html', status: 'success' });
    
    end({ method: 'POST', route: '/api/story/:storyId/html', status_code: 200 });
    
    res.status(200).json({
      url: s3Response.Location,
      key: s3Response.Key
    });
    
  } catch (error) {
    logger.error('Error generating HTML:', error);
    
    deliveryCounter.inc({ format: 'html', status: 'error' });
    
    end({ method: 'POST', route: '/api/story/:storyId/html', status_code: 500 });
    res.status(500).json({ error: error.message });
  }
});

// Invalidate cache endpoint
app.post('/api/cache/invalidate/:storyId', async (req, res) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  
  try {
    const { storyId } = req.params;
    
    if (redisClient) {
      await redisClient.del(`story:${storyId}`);
    }
    
    end({ method: 'POST', route: '/api/cache/invalidate/:storyId', status_code: 200 });
    res.status(200).json({ status: 'success' });
    
  } catch (error) {
    logger.error('Error invalidating cache:', error);
    
    end({ method: 'POST', route: '/api/cache/invalidate/:storyId', status_code: 500 });
    res.status(500).json({ error: error.message });
  }
});

// Generate PDF from story data
async function generatePDF(story, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: story.title || 'Custom Story',
          Author: 'StoryVerse',
          Subject: 'Custom children\'s story'
        }
      });
      
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);
      
      // Add title
      doc.fontSize(24).font('Helvetica-Bold').text(story.title || 'Custom Story', {
        align: 'center'
      });
      
      doc.moveDown(2);
      
      // Add child name if available
      if (story.childName) {
        doc.fontSize(14).font('Helvetica-Oblique').text(`A special story for ${story.childName}`, {
          align: 'center'
        });
        doc.moveDown(2);
      }
      
      // Add pages
      if (story.content && story.content.pages) {
        for (const page of story.content.pages) {
          // Add page number
          doc.fontSize(12).font('Helvetica-Bold').text(`Page ${page.pageNumber}`, {
            align: 'center'
          });
          doc.moveDown(0.5);
          
          // Add page text
          doc.fontSize(12).font('Helvetica').text(page.text || '', {
            align: 'left'
          });
          
          doc.moveDown(2);
        }
      } else if (story.content && story.content.text) {
        // If no pages, use full text
        doc.fontSize(12).font('Helvetica').text(story.content.text, {
          align: 'left'
        });
      }
      
      // Add footer
      doc.fontSize(10).font('Helvetica-Oblique').text('Created with StoryVerse', {
        align: 'center'
      });
      
      doc.end();
      
      stream.on('finish', () => {
        resolve(outputPath);
      });
      
      stream.on('error', (err) => {
        reject(err);
      });
      
    } catch (err) {
      reject(err);
    }
  });
}

// Create ZIP archive
async function createZipArchive(sourceDir, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });
      
      output.on('close', () => {
        resolve(outputPath);
      });
      
      archive.on('error', (err) => {
        reject(err);
      });
      
      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
      
    } catch (err) {
      reject(err);
    }
  });
}

// Generate HTML content
function generateHTML(story) {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${story.title || 'Custom Story'}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      text-align: center;
      color: #2c3e50;
    }
    .child-name {
      text-align: center;
      font-style: italic;
      margin-bottom: 30px;
    }
    .page {
      margin-bottom: 30px;
      border-bottom: 1px solid #eee;
      padding-bottom: 20px;
    }
    .page-number {
      font-weight: bold;
      color: #7f8c8d;
    }
    .page-text {
      margin-top: 10px;
    }
    .page-image {
      max-width: 100%;
      margin: 20px 0;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    footer {
      text-align: center;
      margin-top: 50px;
      font-style: italic;
      color: #7f8c8d;
    }
  </style>
</head>
<body>
  <h1>${story.title || 'Custom Story'}</h1>
  ${story.childName ? `<div class="child-name">A special story for ${story.childName}</div>` : ''}
`;

  // Add pages
  if (story.content && story.content.pages) {
    story.content.pages.forEach(page => {
      html += `
  <div class="page">
    <div class="page-number">Page ${page.pageNumber}</div>
    <div class="page-text">${page.text || ''}</div>
    ${page.imageUrl ? `<img class="page-image" src="${page.imageUrl}" alt="Illustration for page ${page.pageNumber}">` : ''}
  </div>`;
    });
  } else if (story.content && story.content.text) {
    // If no pages, use full text
    html += `
  <div class="page">
    <div class="page-text">${story.content.text}</div>
  </div>`;
  }

  // Add footer
  html += `
  <footer>Created with StoryVerse</footer>
</body>
</html>`;

  return html;
}

// Download file from URL
async function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    // Handle S3 URLs
    if (url.includes('amazonaws.com')) {
      const s3Regex = /https:\/\/([^.]+)\.s3\.([^.]+)\.amazonaws\.com\/(.+)/;
      const match = url.match(s3Regex);
      
      if (match) {
        const bucket = match[1];
        const key = match[3];
        
        s3.getObject({
          Bucket: bucket,
          Key: key
        }, (err, data) => {
          if (err) {
            return reject(err);
          }
          
          fs.writeFile(outputPath, data.Body, (err) => {
            if (err) {
              return reject(err);
            }
            resolve(outputPath);
          });
        });
        
        return;
      }
    }
    
    // Handle regular HTTP URLs
    const file = fs.createWriteStream(outputPath);
    
    http.get(url, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(outputPath);
      });
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {});
      reject(err);
    });
  });
}

// Fetch with timeout
async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error(`Request timed out after ${timeout}ms`));
    }, timeout);
    
    const fetch = require('node-fetch');
    fetch(url, {
      ...options,
      signal: controller.signal
    })
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeoutId));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error'
  });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  logger.info(`Content Delivery Service listening on port ${PORT}`);
});

module.exports = app;
