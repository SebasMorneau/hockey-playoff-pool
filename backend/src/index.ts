import express, { ErrorRequestHandler, RequestHandler } from 'express'
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { sequelize } from './models';
import authRoutes from './routes/auth';
import teamRoutes from './routes/teams';
import roundRoutes from './routes/rounds';
import seriesRoutes from './routes/series';
import predictionRoutes from './routes/predictions';
import stanleyCupRoutes from './routes/stanleyCup';
import userRoutes from './routes/users';
import adminRoutes from './routes/admin';
import proxyRoutes from './routes/proxy';
import { errorHandler } from './middleware/errorHandler';
import { logger, logRequest, logError, apiLogger, createPerformanceTimer } from './utils/logger';
import { authenticate } from './middleware/auth';
import fs from 'fs';

dotenv.config();

const app = express();
const port = process.env.PORT || 3301;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3300',
  'https://playoff-pool.emstone.ca',
  'https://api-playoff-pool.emstone.ca'
];

// Log application startup
logger.info('Starting NHL Playoff Pool API server', {
  environment: process.env.NODE_ENV || 'development',
  port,
  allowedOrigins
});

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use((_req, res, next) => {
  res.removeHeader('Access-Control-Allow-Origin');
  res.removeHeader('Access-Control-Allow-Methods');
  res.removeHeader('Access-Control-Allow-Headers');
  res.removeHeader('Access-Control-Allow-Credentials');
  next();
});

// Apply security and performance middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
}));

app.use(compression());

// Apply custom logging middleware instead of morgan
app.use(logRequest);

// Register error logging middleware
app.use(logError);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PUBLIC_DIR = process.env.NODE_ENV === 'production' ? '/app/public' : path.join(__dirname, '../public');

app.use(express.static(PUBLIC_DIR, {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.png') || filePath.endsWith('.jpg') || filePath.endsWith('.svg')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

app.get('/images/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(PUBLIC_DIR, 'images', filename);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  
  try {
    if (fs.existsSync(imagePath)) {
      res.sendFile(imagePath, (err) => {
        if (err) {
          logger.error(`Error sending image file: ${filename}`, { 
            error: err.message,
            path: imagePath,
            requestId: req.requestId
          });
          res.status(500).json({ message: 'Error providing image file' });
        }
      });
    } else {
      logger.warn(`Image not found at path: ${imagePath}`, { 
        filename,
        path: imagePath,
        requestId: req.requestId
      });
      res.status(404).json({ message: `Image not found: ${filename}` });
    }
  } catch (error) {
    logger.error(`Error processing image request: ${filename}`, {
      error,
      path: imagePath,
      requestId: req.requestId
    });
    res.status(500).json({ message: 'Internal server error processing image request' });
  }
});

app.get('/logos/:filename', (req, res) => {
  const filename = req.params.filename;
  const logoPath = path.join(PUBLIC_DIR, 'logos', filename);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  
  try {
    apiLogger.info(`Attempting to serve logo: ${filename}`, {
      path: logoPath,
      requestId: req.requestId
    });
    
    if (fs.existsSync(logoPath)) {
      res.sendFile(logoPath, (err) => {
        if (err) {
          logger.error(`Error sending logo file: ${filename}`, {
            error: err.message,
            path: logoPath,
            requestId: req.requestId
          });
          res.status(500).json({ message: 'Error providing logo file' });
        }
      });
    } else {
      logger.warn(`Logo not found at path: ${logoPath}`, {
        filename,
        path: logoPath,
        requestId: req.requestId
      });
      res.status(404).json({ 
        message: 'Logo not found',
        requestedPath: logoPath,
        publicDir: PUBLIC_DIR
      });
    }
  } catch (error: any) {
    logger.error(`Error processing logo request for ${filename}`, {
      error: error.message || 'Unknown error',
      path: logoPath,
      publicDir: PUBLIC_DIR,
      requestId: req.requestId
    });
    res.status(500).json({ 
      message: 'Internal server error processing logo request',
      error: error.message || 'Unknown error',
      requestedPath: logoPath,
      publicDir: PUBLIC_DIR
    });
  }
});

app.get('/api/health', (req, res) => {
  apiLogger.info('Health check', { requestId: req.requestId });
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/cors-test', (req, res) => {
  apiLogger.info('CORS test', { 
    headers: req.headers,
    requestId: req.requestId
  });
  res.status(200).json({ 
    message: 'CORS working', 
    headers: req.headers,
    timestamp: new Date().toISOString() 
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', authenticate as RequestHandler, teamRoutes);
app.use('/api/rounds', authenticate as RequestHandler, roundRoutes);
app.use('/api/series', authenticate as RequestHandler, seriesRoutes);
app.use('/api/predictions', authenticate as RequestHandler, predictionRoutes);
app.use('/api/stanley-cup', stanleyCupRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/proxy-image', proxyRoutes);

// Global error handler
app.use(errorHandler as ErrorRequestHandler);

const startServer = async () => {
  try {
    // Create a performance timer for server startup
    const startupTimer = createPerformanceTimer('server_startup');
    
    // Database connection
    const dbTimer = createPerformanceTimer('database_connection');
    await sequelize.sync({ force: false });
    dbTimer.end();
    
    logger.info('Database synchronized successfully');

    // Start server
    app.listen(port, () => {
      const totalStartupTime = startupTimer.end();
      logger.info(`Server running on port ${port}`, { 
        startupTime: `${totalStartupTime.toFixed(2)}ms` 
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', {
      error,
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
};

startServer();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, graceful shutdown');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, graceful shutdown');
  process.exit(0);
});

// Export app for testing
export default app;