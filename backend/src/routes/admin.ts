import express from 'express';
import { authenticate, authorizeAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param } from 'express-validator';
import { 
  getDashboardData,
  getAllUsers,
  updateUser,
  updateUserPoints,
  initSystemData,
  createMatchup,
  inviteUser,
  deleteUser,
  updateUserPrediction
} from '../controllers/admin.controller';
import { getConfig, updateConfig } from '../controllers/config.controller';

const router = express.Router();

// Middleware: All routes require authentication and admin authorization
router.use(authenticate as unknown as express.RequestHandler);
router.use(authorizeAdmin as unknown as express.RequestHandler);

// Get admin dashboard data
router.get('/dashboard', getDashboardData as unknown as express.RequestHandler);

// Get all users
router.get('/users', getAllUsers as unknown as express.RequestHandler);

// Update user
router.put('/users/:id', 
  validateRequest as unknown as express.RequestHandler,
  updateUser as unknown as express.RequestHandler
);

// Initialize system data
router.post(
  '/init',
  [
    body('season')
      .isString()
      .notEmpty()
      .withMessage('Season is required (e.g., "2024-2025")'),
    validateRequest as unknown as express.RequestHandler,
  ],
  initSystemData as unknown as express.RequestHandler,
);

// Get pool configuration
router.get('/config', getConfig as unknown as express.RequestHandler);

// Update pool configuration
router.put(
  '/config',
  [
    body('season').isString().notEmpty().withMessage('Season is required'),
    body('allowLatePredictions').isBoolean().withMessage('allowLatePredictions must be a boolean'),
    body('pointsForCorrectWinner').isInt({ min: 0, max: 10 }).withMessage('pointsForCorrectWinner must be an integer between 0 and 10'),
    body('pointsForCorrectGames').isInt({ min: 0, max: 10 }).withMessage('pointsForCorrectGames must be an integer between 0 and 10'),
    body('pointsForFinalistTeam').isInt({ min: 0, max: 10 }).withMessage('pointsForFinalistTeam must be an integer between 0 and 10'),
    body('pointsForChampion').isInt({ min: 0, max: 10 }).withMessage('pointsForChampion must be an integer between 0 and 10'),
    body('pointsForChampionGames').isInt({ min: 0, max: 10 }).withMessage('pointsForChampionGames must be an integer between 0 and 10'),
    validateRequest as unknown as express.RequestHandler,
  ],
  updateConfig as unknown as express.RequestHandler,
);

// Create a matchup between teams
router.post(
  '/matchups',
  [
    body('roundId').isInt().withMessage('Round ID must be an integer'),
    body('homeTeamId').optional().isInt().withMessage('Home team ID must be an integer'),
    body('awayTeamId').optional().isInt().withMessage('Away team ID must be an integer'),
    // Home team details (required if homeTeamId is not provided)
    body('homeTeamName').optional().isString().notEmpty().withMessage('Home team name is required if ID is not provided'),
    body('homeTeamShortName').optional().isString().notEmpty().withMessage('Home team short name is required if ID is not provided'),
    body('homeTeamConference').optional().isIn(['Eastern', 'Western']).withMessage('Home team conference must be either Eastern or Western'),
    body('homeTeamDivision').optional().isIn(['Atlantic', 'Metropolitan', 'Central', 'Pacific']).withMessage('Home team division must be one of: Atlantic, Metropolitan, Central, Pacific'),
    body('homeTeamLogoUrl').optional().isString(),
    // Away team details (required if awayTeamId is not provided)
    body('awayTeamName').optional().isString().notEmpty().withMessage('Away team name is required if ID is not provided'),
    body('awayTeamShortName').optional().isString().notEmpty().withMessage('Away team short name is required if ID is not provided'),
    body('awayTeamConference').optional().isIn(['Eastern', 'Western']).withMessage('Away team conference must be either Eastern or Western'),
    body('awayTeamDivision').optional().isIn(['Atlantic', 'Metropolitan', 'Central', 'Pacific']).withMessage('Away team division must be one of: Atlantic, Metropolitan, Central, Pacific'),
    body('awayTeamLogoUrl').optional().isString(),
    validateRequest as unknown as express.RequestHandler,
  ],
  createMatchup as unknown as express.RequestHandler,
);

// Invite a new user
router.post(
  '/users/invite',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('name').isString().notEmpty().withMessage('Name is required'),
    validateRequest as unknown as express.RequestHandler,
  ],
  inviteUser as unknown as express.RequestHandler,
);

// Delete user
router.delete(
  '/users/:id',
  [
    param('id').isInt().withMessage('User ID must be an integer'),
    validateRequest as unknown as express.RequestHandler,
  ],
  deleteUser as unknown as express.RequestHandler,
);

// Update user points
router.patch('/users/:id/points', updateUserPoints as unknown as express.RequestHandler);

// Update user prediction
router.patch(
  '/users/:userId/predictions/:seriesId',
  [
    param('userId').isInt().withMessage('User ID must be an integer'),
    param('seriesId').isInt().withMessage('Series ID must be an integer'),
    body('predictedWinnerId').isInt().withMessage('Predicted winner ID must be an integer'),
    body('predictedGames').isInt({ min: 4, max: 7 }).withMessage('Predicted games must be between 4 and 7'),
    body('points').isInt().withMessage('Points must be an integer'),
    validateRequest as unknown as express.RequestHandler,
  ],
  updateUserPrediction as unknown as express.RequestHandler,
);

export default router;
