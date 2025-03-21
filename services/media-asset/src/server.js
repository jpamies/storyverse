const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const winston = require('winston');
const multer = require('multer');
const sharp = require('sharp');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const promClient = require('prom-client');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'media-asset' },
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

const uploadCounter = new promClient.Counter({
  name: 'media_uploads_total',
  help: 'Total number of media uploads',
  labelNames: ['media_type']
});
register.registerMetric(uploadCounter);

const downloadCounter = new promClient.Counter({
  name: 'media_downloads_total',
  help: 'Total number of media downloads',
  labelNames: ['media_type']
});
register.registerMetric(downloadCounter);

const processingErrorCounter = new promClient.Counter({
  name: 'media_processing_errors_total',
  help: 'Total number of media processing errors',
  labelNames: ['error_type']
});
register.registerMetric(processingErrorCounter);

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const S3_BUCKET = process.env.S3_BUCKET || 'storyverse-media';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and audio files
    if (file.mimetype.startsWith('image/') || 
        file.mimetype.startsWith('audio/') ||
        file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Upload image endpoint
app.post('/api/upload/image', upload.single('image'), async (req, res) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  
  try {
    if (!req.file) {
      processingErrorCounter.inc({ error_type: 'missing_file' });
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const storyId = req.body.storyId || 'general';
    const pageNumber = req.body.pageNumber || '0';
    const quality = parseInt(req.body.quality) || 80;
    
    // Process image with sharp
    const processedImagePath = path.join(
      path.dirname(req.file.path),
      `processed_${path.basename(req.file.path)}`
    );
    
    await sharp(req.file.path)
      .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality })
      .toFile(processedImagePath);
    
    // Upload to S3
    const s3Key = `stories/${storyId}/images/page_${pageNumber}_${path.basename(processedImagePath)}`;
    
    const fileContent = fs.readFileSync(processedImagePath);
    
    const params = {
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: fileContent,
      ContentType: 'image/jpeg'
    };
    
    const s3Response = await s3.upload(params).promise();
    
    // Clean up local files
    fs.unlinkSync(req.file.path);
    fs.unlinkSync(processedImagePath);
    
    uploadCounter.inc({ media_type: 'image' });
    
    end({ method: 'POST', route: '/api/upload/image', status_code: 200 });
    
    res.status(200).json({
      url: s3Response.Location,
      key: s3Response.Key,
      storyId,
      pageNumber
    });
    
  } catch (error) {
    logger.error('Error uploading image:', error);
    processingErrorCounter.inc({ error_type: 'processing_error' });
    
    // Clean up local file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    end({ method: 'POST', route: '/api/upload/image', status_code: 500 });
    res.status(500).json({ error: error.message });
  }
});

// Upload audio endpoint
app.post('/api/upload/audio', upload.single('audio'), async (req, res) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  
  try {
    if (!req.file) {
      processingErrorCounter.inc({ error_type: 'missing_file' });
      return res.status(400).json({ error: 'No audio file provided' });
    }
    
    const storyId = req.body.storyId || 'general';
    const pageNumber = req.body.pageNumber || '0';
    
    // Upload to S3
    const s3Key = `stories/${storyId}/audio/page_${pageNumber}_${path.basename(req.file.path)}`;
    
    const fileContent = fs.readFileSync(req.file.path);
    
    const params = {
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: fileContent,
      ContentType: req.file.mimetype
    };
    
    const s3Response = await s3.upload(params).promise();
    
    // Clean up local file
    fs.unlinkSync(req.file.path);
    
    uploadCounter.inc({ media_type: 'audio' });
    
    end({ method: 'POST', route: '/api/upload/audio', status_code: 200 });
    
    res.status(200).json({
      url: s3Response.Location,
      key: s3Response.Key,
      storyId,
      pageNumber
    });
    
  } catch (error) {
    logger.error('Error uploading audio:', error);
    processingErrorCounter.inc({ error_type: 'processing_error' });
    
    // Clean up local file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    end({ method: 'POST', route: '/api/upload/audio', status_code: 500 });
    res.status(500).json({ error: error.message });
  }
});

// Upload base64 image endpoint
app.post('/api/upload/base64', async (req, res) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  
  try {
    const { image, storyId, pageNumber } = req.body;
    
    if (!image) {
      processingErrorCounter.inc({ error_type: 'missing_data' });
      return res.status(400).json({ error: 'No image data provided' });
    }
    
    // Extract base64 data
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Process image with sharp
    const processedBuffer = await sharp(buffer)
      .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    // Upload to S3
    const s3Key = `stories/${storyId || 'general'}/images/page_${pageNumber || '0'}_${uuidv4()}.jpg`;
    
    const params = {
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: processedBuffer,
      ContentType: 'image/jpeg'
    };
    
    const s3Response = await s3.upload(params).promise();
    
    uploadCounter.inc({ media_type: 'image' });
    
    end({ method: 'POST', route: '/api/upload/base64', status_code: 200 });
    
    res.status(200).json({
      url: s3Response.Location,
      key: s3Response.Key,
      storyId: storyId || 'general',
      pageNumber: pageNumber || '0'
    });
    
  } catch (error) {
    logger.error('Error uploading base64 image:', error);
    processingErrorCounter.inc({ error_type: 'processing_error' });
    
    end({ method: 'POST', route: '/api/upload/base64', status_code: 500 });
    res.status(500).json({ error: error.message });
  }
});

// Get media endpoint
app.get('/api/media/:key', async (req, res) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  
  try {
    const key = req.params.key;
    
    const params = {
      Bucket: S3_BUCKET,
      Key: key
    };
    
    // Get signed URL
    const signedUrl = s3.getSignedUrl('getObject', {
      ...params,
      Expires: 3600 // URL expires in 1 hour
    });
    
    // Determine media type
    let mediaType = 'unknown';
    if (key.includes('/images/')) {
      mediaType = 'image';
    } else if (key.includes('/audio/')) {
      mediaType = 'audio';
    }
    
    downloadCounter.inc({ media_type: mediaType });
    
    end({ method: 'GET', route: '/api/media/:key', status_code: 200 });
    
    res.status(200).json({
      url: signedUrl,
      key: key
    });
    
  } catch (error) {
    logger.error('Error getting media:', error);
    
    end({ method: 'GET', route: '/api/media/:key', status_code: 500 });
    res.status(500).json({ error: error.message });
  }
});

// Delete media endpoint
app.delete('/api/media/:key', async (req, res) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  
  try {
    const key = req.params.key;
    
    const params = {
      Bucket: S3_BUCKET,
      Key: key
    };
    
    await s3.deleteObject(params).promise();
    
    end({ method: 'DELETE', route: '/api/media/:key', status_code: 200 });
    
    res.status(200).json({
      message: 'Media deleted successfully',
      key: key
    });
    
  } catch (error) {
    logger.error('Error deleting media:', error);
    
    end({ method: 'DELETE', route: '/api/media/:key', status_code: 500 });
    res.status(500).json({ error: error.message });
  }
});

// List story media endpoint
app.get('/api/story/:storyId/media', async (req, res) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  
  try {
    const { storyId } = req.params;
    const { type } = req.query; // Optional: 'images' or 'audio'
    
    let prefix = `stories/${storyId}/`;
    if (type === 'images') {
      prefix += 'images/';
    } else if (type === 'audio') {
      prefix += 'audio/';
    }
    
    const params = {
      Bucket: S3_BUCKET,
      Prefix: prefix
    };
    
    const data = await s3.listObjectsV2(params).promise();
    
    const mediaItems = data.Contents.map(item => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified,
      url: s3.getSignedUrl('getObject', {
        Bucket: S3_BUCKET,
        Key: item.Key,
        Expires: 3600 // URL expires in 1 hour
      })
    }));
    
    end({ method: 'GET', route: '/api/story/:storyId/media', status_code: 200 });
    
    res.status(200).json({
      storyId,
      mediaItems
    });
    
  } catch (error) {
    logger.error('Error listing story media:', error);
    
    end({ method: 'GET', route: '/api/story/:storyId/media', status_code: 500 });
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  
  if (err.message === 'Unsupported file type') {
    processingErrorCounter.inc({ error_type: 'unsupported_file_type' });
    return res.status(400).json({ error: 'Unsupported file type' });
  }
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      processingErrorCounter.inc({ error_type: 'file_too_large' });
      return res.status(400).json({ error: 'File too large' });
    }
  }
  
  processingErrorCounter.inc({ error_type: 'server_error' });
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error'
  });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  logger.info(`Media Asset Service listening on port ${PORT}`);
});

module.exports = app;
