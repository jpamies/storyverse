const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const { createProxyMiddleware } = require('http-proxy-middleware');

const { logger } = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');
const authRoutes = require('./routes/auth');
const storyRoutes = require('./routes/story');

// Load environment variables
const PORT = process.env.PORT || 8080;

// Initialize express app
const app = express();

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors()); // CORS support
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies
app.use(compression()); // Compress responses
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } })); // HTTP request logging

// Apply rate limiting
app.use(rateLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stories', storyRoutes);

// Service proxies
app.use('/api/universes', createProxyMiddleware({ 
  target: process.env.UNIVERSE_SERVICE_URL || 'http://universe-management-service:8080',
  changeOrigin: true,
  pathRewrite: {
    '^/api/universes': '/api/universes'
  }
}));

app.use('/api/characters', createProxyMiddleware({ 
  target: process.env.CHARACTER_SERVICE_URL || 'http://character-database-service:8080',
  changeOrigin: true,
  pathRewrite: {
    '^/api/characters': '/api/characters'
  }
}));

app.use('/api/generate/text', createProxyMiddleware({ 
  target: process.env.TEXT_GENERATION_URL || 'http://text-generation-service:8080',
  changeOrigin: true,
  pathRewrite: {
    '^/api/generate/text': '/api/generate'
  }
}));

app.use('/api/generate/image', createProxyMiddleware({ 
  target: process.env.IMAGE_GENERATION_URL || 'http://image-generation-service:8080',
  changeOrigin: true,
  pathRewrite: {
    '^/api/generate/image': '/api/generate'
  }
}));

app.use('/api/generate/audio', createProxyMiddleware({ 
  target: process.env.AUDIO_GENERATION_URL || 'http://audio-narration-service:8080',
  changeOrigin: true,
  pathRewrite: {
    '^/api/generate/audio': '/api/generate'
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`API Gateway listening on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  // Don't exit the process in production
  // process.exit(1);
});

module.exports = app; // For testing
