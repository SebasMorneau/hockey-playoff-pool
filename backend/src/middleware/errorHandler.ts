import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Custom error class for application errors
export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler middleware
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // If headers are already sent, delegate to Express's default error handler
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // Log unexpected errors
  logger.error('Unexpected error:', err);

  // Return generic error for non-operational errors
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong',
  });
};
