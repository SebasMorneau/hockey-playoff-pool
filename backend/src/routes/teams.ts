import express from 'express';
import {
  getAllTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
} from '../controllers/teams.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param } from 'express-validator';

const router = express.Router();

// Middleware: All routes require authentication
router.use(authenticate as unknown as express.RequestHandler);

// Get all teams
router.get('/', getAllTeams as unknown as express.RequestHandler);

// Get team by ID
router.get(
  '/:id',
  [
    param('id').isInt().withMessage('Team ID must be an integer'),
    validateRequest as unknown as express.RequestHandler,
  ],
  getTeamById as unknown as express.RequestHandler,
);

// Admin routes - require admin authorization
router.use(authorizeAdmin as unknown as express.RequestHandler);

// Create a new team
router.post(
  '/',
  [
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('shortName').isString().notEmpty().withMessage('Short name is required'),
    body('logoUrl').optional().isString().withMessage('Logo URL must be a string'),
    body('conference').isString().notEmpty().withMessage('Conference is required'),
    body('division').isString().notEmpty().withMessage('Division is required'),
    validateRequest as unknown as express.RequestHandler,
  ],
  createTeam as unknown as express.RequestHandler,
);

// Update a team
router.put(
  '/:id',
  [
    param('id').isInt().withMessage('Team ID must be an integer'),
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('shortName').isString().notEmpty().withMessage('Short name is required'),
    body('logoUrl').optional().isString().withMessage('Logo URL must be a string'),
    body('conference').isString().notEmpty().withMessage('Conference is required'),
    body('division').isString().notEmpty().withMessage('Division is required'),
    body('active').isBoolean().withMessage('Active must be a boolean'),
    validateRequest as unknown as express.RequestHandler,
  ],
  updateTeam as unknown as express.RequestHandler,
);

// Delete a team
router.delete(
  '/:id',
  [
    param('id').isInt().withMessage('Team ID must be an integer'),
    validateRequest as unknown as express.RequestHandler,
  ],
  deleteTeam as unknown as express.RequestHandler,
);

export default router;
