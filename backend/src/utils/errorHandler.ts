import { Request, Response } from 'express';
import { logger } from '../utils/logger';

// Classe d'erreur personnalisée
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Middleware de gestion globale des erreurs
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
) => {
  // Statut et message d'erreur par défaut
  let statusCode = 500;
  let message = 'Erreur Interne du Serveur';

  // Vérifier si l'erreur est notre AppError personnalisée
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Enregistrer les détails de l'erreur
  logger.error(`${statusCode} - ${message}`, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    error: err.stack,
  });

  // Envoyer la réponse d'erreur
  res.status(statusCode).json({
    status: 'error',
    message,
    // Inclure la trace de la pile en développement
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
