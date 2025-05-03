import express from 'express';
import {
  submitStanleyCupPrediction,
  getUserStanleyCupPrediction,
  getAllStanleyCupPredictions,
  setStanleyCupResults,
} from '../controllers/stanleyCup.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, query } from 'express-validator';

const router = express.Router();

// Middleware: All routes require authentication
router.use(authenticate as unknown as express.RequestHandler);

// Submit Stanley Cup prediction
router.post(
  '/',
  [
    body('season').isString().notEmpty().withMessage('Season is required'),
    body('eastTeamId').isInt().withMessage('East team ID must be an integer'),
    body('westTeamId').isInt().withMessage('West team ID must be an integer'),
    body('winningTeamId')
      .isInt()
      .withMessage('Winning team ID must be an integer'),
    body('gamesPlayed')
      .isInt({ min: 4, max: 7 })
      .withMessage('Games played must be between 4 and 7'),
    validateRequest as unknown as express.RequestHandler,
  ],
  submitStanleyCupPrediction as unknown as express.RequestHandler,
);

// Get current user's Stanley Cup prediction
router.get(
  '/user',
  [
    query('season')
      .isString()
      .notEmpty()
      .withMessage('Season query parameter is required'),
    validateRequest as unknown as express.RequestHandler,
  ],
  getUserStanleyCupPrediction as unknown as express.RequestHandler,
);

// Get all Stanley Cup predictions
router.get(
  '/',
  [
    query('season')
      .isString()
      .notEmpty()
      .withMessage('Season query parameter is required'),
    validateRequest as unknown as express.RequestHandler,
  ],
  getAllStanleyCupPredictions as unknown as express.RequestHandler,
);

// Admin routes - require admin authorization
router.use(authorizeAdmin as unknown as express.RequestHandler);

// Set Stanley Cup results and calculate points
router.post(
  '/results',
  [
    body('season').isString().notEmpty().withMessage('Season is required'),
    body('eastTeamId').isInt().withMessage('East team ID must be an integer'),
    body('westTeamId').isInt().withMessage('West team ID must be an integer'),
    body('winningTeamId')
      .isInt()
      .withMessage('Winning team ID must be an integer'),
    body('gamesPlayed')
      .isInt({ min: 4, max: 7 })
      .withMessage('Games played must be between 4 and 7'),
    validateRequest as unknown as express.RequestHandler,
  ],
  setStanleyCupResults as unknown as express.RequestHandler,
);

export default router;
