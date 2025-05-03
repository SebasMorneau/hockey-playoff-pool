import express, { Request, Response, NextFunction } from 'express';
import { User } from '../models';
import { authenticate } from '../middleware/auth';

// Extend Express Request type to include user
interface RequestUser {
  userId: number;
  email: string;
  isAdmin: boolean;
}

declare module 'express' {
  interface Request {
    user: RequestUser;
  }
}

const router = express.Router();

// Get all users
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await User.findAll({
        attributes: [
          'id',
          'email',
          'name',
          'isAdmin',
          'createdAt',
          'updatedAt',
        ],
      });
      res.json(users);
    } catch (error) {
      next(error);
    }
  },
);

// Get user by ID
router.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await User.findByPk(req.params.id, {
        attributes: [
          'id',
          'email',
          'name',
          'isAdmin',
          'createdAt',
          'updatedAt',
        ],
      });
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      res.json(user);
    } catch (error) {
      next(error);
    }
  },
);

// Update user
router.put(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      // Only allow users to update their own profile unless they're an admin
      if (req.user.userId !== user.id && !req.user.isAdmin) {
        res.status(403).json({ message: 'Not authorized to update this user' });
        return;
      }

      await user.update(req.body);
      res.json({ message: 'User updated successfully' });
    } catch (error) {
      next(error);
    }
  },
);

// Delete user
router.delete(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      // Only allow users to delete their own profile unless they're an admin
      if (req.user.userId !== user.id && !req.user.isAdmin) {
        res.status(403).json({ message: 'Not authorized to delete this user' });
        return;
      }

      await user.destroy();
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
