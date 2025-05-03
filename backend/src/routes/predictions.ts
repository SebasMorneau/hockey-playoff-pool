import express from 'express';
import {
  submitPrediction,
  getUserPredictions,
  getSeriesPredictions,
  getLeaderboard,
  getUnpredictedSeries,
  getAllUsersPredictions,
} from '../controllers/predictions.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param } from 'express-validator';

const router = express.Router();

// Middleware: All routes require authentication
router.use(authenticate as unknown as express.RequestHandler);

// Get series without predictions
router.get('/unpredicted', getUnpredictedSeries as unknown as express.RequestHandler);

// Submit a prediction
router.post(
  '/',
  [
    body('seriesId').isInt().withMessage('Series ID must be an integer'),
    body('predictedWinnerId')
      .isInt()
      .withMessage('Predicted winner ID must be an integer'),
    body('predictedGames')
      .isInt({ min: 4, max: 7 })
      .withMessage('Predicted games must be between 4 and 7'),
    validateRequest as unknown as express.RequestHandler,
  ],
  submitPrediction as unknown as express.RequestHandler,
);

// Get all predictions for current user
router.get('/user', getUserPredictions as unknown as express.RequestHandler);

// Get all predictions for all users
router.get('/all', getAllUsersPredictions as unknown as express.RequestHandler);

// Get all predictions for a specific series
router.get(
  '/series/:seriesId',
  [
    param('seriesId').isInt().withMessage('Series ID must be an integer'),
    validateRequest as unknown as express.RequestHandler,
  ],
  getSeriesPredictions as unknown as express.RequestHandler,
);

// Get leaderboard
router.get('/leaderboard', getLeaderboard as unknown as express.RequestHandler);

export default router;
