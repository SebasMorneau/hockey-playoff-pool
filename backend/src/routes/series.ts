import express from 'express';
import {
  getAllSeries,
  getSeriesById,
  getSeriesByRound,
  createSeries,
  updateSeriesResults,
  deleteSeries,
} from '../controllers/series.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param } from 'express-validator';

const router = express.Router();

// Middleware: All routes require authentication
router.use(authenticate as unknown as express.RequestHandler);

// Get all series
router.get('/', getAllSeries as unknown as express.RequestHandler);

// Get series by ID
router.get(
  '/:id',
  [
    param('id').isInt().withMessage('Series ID must be an integer'),
    validateRequest as unknown as express.RequestHandler,
  ],
  getSeriesById as unknown as express.RequestHandler,
);

// Get series by round
router.get(
  '/round/:roundId',
  [
    param('roundId').isInt().withMessage('Round ID must be an integer'),
    validateRequest as unknown as express.RequestHandler,
  ],
  getSeriesByRound as unknown as express.RequestHandler,
);

// Admin routes - require admin authorization
router.use(authorizeAdmin as unknown as express.RequestHandler);

// Create a new series
router.post(
  '/',
  [
    body('roundId').isInt().withMessage('Round ID must be an integer'),
    body('homeTeamId').isInt().withMessage('Home team ID must be an integer'),
    body('awayTeamId').isInt().withMessage('Away team ID must be an integer'),
    body('startDate').isISO8601().withMessage('Start date must be a valid date'),
    validateRequest as unknown as express.RequestHandler,
  ],
  createSeries as unknown as express.RequestHandler,
);

// Update series results
router.put(
  '/:id',
  [
    param('id').isInt().withMessage('Series ID must be an integer'),
    body('homeTeamWins')
      .isInt({ min: 0, max: 4 })
      .withMessage('Home team wins must be between 0 and 4'),
    body('awayTeamWins')
      .isInt({ min: 0, max: 4 })
      .withMessage('Away team wins must be between 0 and 4'),
    body('completed').isBoolean().withMessage('Completed must be a boolean'),
    body('winningTeamId')
      .optional({ nullable: true })
      .isInt()
      .withMessage('Winning team ID must be an integer'),
    body('startDate')
      .optional({ nullable: true })
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    body('endDate')
      .optional({ nullable: true })
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
    validateRequest as unknown as express.RequestHandler,
  ],
  updateSeriesResults as unknown as express.RequestHandler,
);

// Delete a series
router.delete(
  '/:id',
  [
    param('id').isInt().withMessage('Series ID must be an integer'),
    validateRequest as unknown as express.RequestHandler,
  ],
  deleteSeries as unknown as express.RequestHandler,
);

export default router;
