// @ts-nocheck - Disable type checking for this file
import express from 'express';
import {
  requestMagicLink,
  verifyMagicLink,
  getCurrentUser,
  updateProfile,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, query } from 'express-validator';

const router = express.Router();

// Apply routes
router.post(
  '/magic-link',
  [
    body('email').isEmail().withMessage('Valid email is required'),
  ],
  validateRequest,
  requestMagicLink
);

router.get(
  '/verify',
  [
    query('token').isString().notEmpty().withMessage('Token is required'),
  ],
  validateRequest,
  verifyMagicLink
);

router.get('/me', authenticate, getCurrentUser);

router.put(
  '/profile',
  authenticate,
  [
    body('name').isString().notEmpty().withMessage('Name is required'),
  ],
  validateRequest,
  updateProfile
);

export default router;
