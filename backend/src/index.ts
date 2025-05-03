import express from 'express'
import helmet from 'helmet';
import morgan from 'morgan';
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
import { logger } from './utils/logger';
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

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
}));

app.use(compression());
app.use(morgan('combined'));
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
          logger.error(`Erreur lors de l'envoi du fichier image: ${filename}`, err);
          res.status(500).json({ message: 'Erreur lors de la fourniture du fichier image' });
        }
      });
    } else {
      logger.warn(`Image non trouvée au chemin: ${imagePath}`);
      res.status(404).json({ message: `Image non trouvée: ${filename}` });
    }
  } catch (error) {
    logger.error(`Erreur lors du traitement de la demande d'image: ${filename}`, error);
    res.status(500).json({ message: 'Erreur interne du serveur lors du traitement de la demande d\'image' });
  }
});

app.get('/logos/:filename', (req, res) => {
  const filename = req.params.filename;
  const logoPath = path.join(PUBLIC_DIR, 'logos', filename);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  
  try {
    logger.info(`Tentative de fourniture du logo: ${filename} depuis le chemin: ${logoPath}`);
    
    if (fs.existsSync(logoPath)) {
      res.sendFile(logoPath, (err) => {
        if (err) {
          logger.error(`Erreur lors de l'envoi du fichier logo: ${filename}`, err);
          res.status(500).json({ message: 'Erreur lors de la fourniture du fichier logo' });
        }
      });
    } else {
      logger.warn(`Logo non trouvé au chemin: ${logoPath}`);
      res.status(404).json({ 
        message: 'Logo non trouvé',
        requestedPath: logoPath,
        publicDir: PUBLIC_DIR
      });
    }
  } catch (error: any) {
    logger.error(`Erreur lors du traitement de la demande de logo pour ${filename} au chemin ${logoPath}`, error);
    res.status(500).json({ 
      message: 'Erreur interne du serveur lors du traitement de la demande de logo',
      error: error.message || 'Erreur inconnue',
      requestedPath: logoPath,
      publicDir: PUBLIC_DIR
    });
  }
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/cors-test', (req, res) => {
  res.status(200).json({ 
    message: 'CORS fonctionne', 
    headers: req.headers,
    timestamp: new Date().toISOString() 
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/teams', authenticate, teamRoutes);
app.use('/api/rounds', authenticate, roundRoutes);
app.use('/api/series', authenticate, seriesRoutes);
app.use('/api/predictions', authenticate, predictionRoutes);
app.use('/api/stanley-cup', stanleyCupRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/proxy-image', proxyRoutes);

app.use(errorHandler);

const startServer = async () => {
  try {
    await sequelize.sync({ force: false });
    logger.info('Base de données synchronisée avec succès');

    app.listen(port, () => {
      logger.info(`Serveur en cours d'exécution sur le port ${port}`);
    });
  } catch (error) {
    logger.error('Échec du démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();

process.on('SIGTERM', () => {
  logger.info('SIGTERM reçu, arrêt gracieux');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT reçu, arrêt gracieux');
  process.exit(0);
});

export default app;