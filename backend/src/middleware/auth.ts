import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

// JWT Secret from environment
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

// Type for user data stored in JWT
interface JwtUser {
  userId: number;
  email: string;
  isAdmin: boolean;
}

// Authentication middleware
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtUser;

    // Attach user to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      isAdmin: Boolean(decoded.isAdmin),
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Admin authorization middleware
export const authorizeAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user || !req.user.isAdmin) {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }
  next();
};