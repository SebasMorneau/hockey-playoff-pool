import { Request, Response, NextFunction } from 'express';
import { Config } from '../models/config';
import { logger } from '../utils/logger';

// Get pool configuration
export const getConfig = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get the latest config
    const config = await Config.findOne({
      order: [['updatedAt', 'DESC']],
    });

    if (!config) {
      // Create default config if none exists
      const defaultConfig = await Config.create({
        season: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        allowLatePredictions: false,
        // Regular series points
        pointsForCorrectWinner: 1,
        pointsForCorrectGames: 2,
        // Stanley Cup points
        pointsForFinalistTeam: 1,
        pointsForChampion: 1,
        pointsForChampionGames: 2,
      });

      return res.status(200).json({ config: defaultConfig });
    }

    return res.status(200).json({ config });
  } catch (error) {
    logger.error('Error getting pool configuration:', error);
    next(error);
  }
};

// Update pool configuration
export const updateConfig = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    logger.info('Received config update request with body:', req.body);
    
    const {
      season,
      allowLatePredictions,
      // Regular series points
      pointsForCorrectWinner,
      pointsForCorrectGames,
      // Stanley Cup points
      pointsForFinalistTeam,
      pointsForChampion,
      pointsForChampionGames,
    } = req.body;

    // Validate required fields
    if (!season) {
      logger.warn('Season is required but was not provided');
      return res.status(400).json({ message: 'Season is required' });
    }

    // Get the latest config
    let config = await Config.findOne({
      order: [['updatedAt', 'DESC']],
    });

    logger.info('Found existing config:', config?.toJSON());

    if (!config) {
      // Create new config if none exists
      logger.info('No existing config found, creating new config');
      config = await Config.create({
        season,
        allowLatePredictions,
        pointsForCorrectWinner,
        pointsForCorrectGames,
        pointsForFinalistTeam,
        pointsForChampion,
        pointsForChampionGames,
      });
      logger.info('Created new config:', config.toJSON());
    } else {
      // Update existing config
      logger.info('Updating existing config with values:', {
        season,
        allowLatePredictions,
        pointsForCorrectWinner,
        pointsForCorrectGames,
        pointsForFinalistTeam,
        pointsForChampion,
        pointsForChampionGames,
      });
      
      await config.update({
        season,
        allowLatePredictions,
        pointsForCorrectWinner,
        pointsForCorrectGames,
        pointsForFinalistTeam,
        pointsForChampion,
        pointsForChampionGames,
      });
      
      logger.info('Config updated successfully:', config.toJSON());
    }

    return res.status(200).json({
      message: 'Pool configuration updated successfully',
      config,
    });
  } catch (error) {
    logger.error('Error updating pool configuration:', error);
    next(error);
  }
}; 