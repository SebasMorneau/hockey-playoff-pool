import express from 'express';
import {
  getAllRounds,
  getRoundById,
  getRoundsBySeason,
  getCurrentRound,
  createRound,
  updateRound,
  deleteRound,
} from '../controllers/rounds.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = express.Router();

// Middleware: All routes require authentication
router.use(authenticate as unknown as express.RequestHandler);

// Get all rounds
router.get('/', getAllRounds as unknown as express.RequestHandler);

// Get round by ID
router.get(
  '/:id',
  [
    param('id').isInt().withMessage('Round ID must be an integer'),
    validateRequest as unknown as express.RequestHandler,
  ],
  getRoundById as unknown as express.RequestHandler,
);

// Get rounds by season
router.get(
  '/season/:season',
  [
    param('season').isString().notEmpty().withMessage('Season is required'),
    validateRequest as unknown as express.RequestHandler,
  ],
  getRoundsBySeason as unknown as express.RequestHandler,
);

// Get current active round
router.get(
  '/current',
  [
    query('season')
      .isString()
      .notEmpty()
      .withMessage('Season query parameter is required'),
    validateRequest as unknown as express.RequestHandler,
  ],
  getCurrentRound as unknown as express.RequestHandler,
);

// Admin routes - require admin authorization
router.use(authorizeAdmin as unknown as express.RequestHandler);

// Create a new round
router.post(
  '/',
  [
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('number')
      .isInt({ min: 1, max: 4 })
      .withMessage('Number must be between 1 and 4'),
    body('season').isString().notEmpty().withMessage('Season is required'),
    body('matchups').optional().isArray().withMessage('Matchups must be an array'),
    body('matchups.*.homeTeamId').optional().isInt().withMessage('Home team ID must be an integer'),
    body('matchups.*.awayTeamId').optional().isInt().withMessage('Away team ID must be an integer'),
    validateRequest as unknown as express.RequestHandler,
  ],
  createRound as unknown as express.RequestHandler,
);

// Update a round
router.put(
  '/:id',
  [
    param('id').isInt().withMessage('Round ID must be an integer'),
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('active').isBoolean().withMessage('Active must be a boolean'),
    validateRequest as unknown as express.RequestHandler,
  ],
  updateRound as unknown as express.RequestHandler,
);

// Delete a round
router.delete(
  '/:id',
  [
    param('id').isInt().withMessage('Round ID must be an integer'),
    validateRequest as unknown as express.RequestHandler,
  ],
  deleteRound as unknown as express.RequestHandler,
);

export default router;
