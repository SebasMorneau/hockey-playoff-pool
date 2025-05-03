import { Request, Response, NextFunction } from 'express';
import { StanleyCupPrediction, Team, User, StanleyCupPredictionCreationAttributes } from '../models';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';

// Submit Stanley Cup prediction
export const submitStanleyCupPrediction = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user.userId;
    const { season, eastTeamId, westTeamId, winningTeamId, gamesPlayed } =
      req.body;

    // Validate input
    if (
      !season ||
      !eastTeamId ||
      !westTeamId ||
      !winningTeamId ||
      !gamesPlayed
    ) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if games is between 4 and 7
    if (gamesPlayed < 4 || gamesPlayed > 7) {
      return res
        .status(400)
        .json({ message: 'Games played must be between 4 and 7' });
    }

    // Get teams to check if they exist and are in the right conference
    const eastTeam = await Team.findOne({
      where: { id: eastTeamId, conference: 'Eastern' },
    });

    const westTeam = await Team.findOne({
      where: { id: westTeamId, conference: 'Western' },
    });

    // Validate teams
    if (!eastTeam) {
      return res
        .status(400)
        .json({ message: 'East team not found or not in Eastern conference' });
    }

    if (!westTeam) {
      return res
        .status(400)
        .json({ message: 'West team not found or not in Western conference' });
    }

    // Validate winning team
    if (winningTeamId !== eastTeamId && winningTeamId !== westTeamId) {
      return res
        .status(400)
        .json({ message: 'Winning team must be either the East or West team' });
    }

    // Check if submission deadline has passed
    // Hardcode a deadline for the current year's stanley cup prediction
    const currentYear = new Date().getFullYear();
    const submissionDeadline = new Date(`${currentYear}-04-15T00:00:00Z`);

    if (new Date() > submissionDeadline) {
      return res
        .status(403)
        .json({ message: 'Submission deadline has passed' });
    }

    // Create or update prediction
    const [prediction, created] = await StanleyCupPrediction.findOrCreate({
      where: {
        userId,
        season,
      },
      defaults: {
        userId,
        season,
        eastTeamId,
        westTeamId,
        winningTeamId,
        gamesPlayed,
        points: 0,
      } as StanleyCupPredictionCreationAttributes,
    });

    if (!created) {
      // Update existing prediction
      await prediction.update({
        eastTeamId,
        westTeamId,
        winningTeamId,
        gamesPlayed,
      });
    }

    return res.status(201).json({
      message: created
        ? 'Prediction submitted successfully'
        : 'Prediction updated successfully',
      prediction: {
        id: prediction.id,
        season: prediction.season,
        eastTeamId: prediction.eastTeamId,
        westTeamId: prediction.westTeamId,
        winningTeamId: prediction.winningTeamId,
        gamesPlayed: prediction.gamesPlayed,
      },
    });
  } catch (error) {
    logger.error('Error submitting Stanley Cup prediction:', error);
    next(error);
  }
};

// Get current user's Stanley Cup prediction
export const getUserStanleyCupPrediction = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user.userId;
    const { season } = req.query;

    if (!season) {
      return res.status(400).json({ message: 'Season parameter is required' });
    }

    const prediction = await StanleyCupPrediction.findOne({
      where: {
        userId,
        season: season as string,
      },
      include: [
        { model: Team, as: 'EastTeam' },
        { model: Team, as: 'WestTeam' },
        { model: Team, as: 'Champion' },
      ],
    });

    if (!prediction) {
      return res.status(404).json({ message: 'Prediction not found' });
    }

    return res.status(200).json({ prediction });
  } catch (error) {
    logger.error('Error getting Stanley Cup prediction:', error);
    next(error);
  }
};

// Get all Stanley Cup predictions
export const getAllStanleyCupPredictions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { season } = req.query;

    if (!season) {
      return res.status(400).json({ message: 'Season parameter is required' });
    }

    // Check if submission deadline has passed
    const currentYear = new Date().getFullYear();
    const submissionDeadline = new Date(`${currentYear}-04-15T00:00:00Z`);

    if (new Date() <= submissionDeadline) {
      // If deadline hasn't passed, only return user's own prediction
      const userId = req.user.userId;
      const userPrediction = await StanleyCupPrediction.findOne({
        where: {
          userId,
          season: season as string,
        },
        include: [
          { model: User, attributes: ['id', 'name'] },
          { model: Team, as: 'EastTeam' },
          { model: Team, as: 'WestTeam' },
          { model: Team, as: 'Champion' },
        ],
      });

      return res.status(200).json({
        predictions: userPrediction ? [userPrediction] : [],
        submissionOpen: true,
      });
    }

    // If deadline has passed, return all predictions
    const predictions = await StanleyCupPrediction.findAll({
      where: {
        season: season as string,
      },
      include: [
        { model: User, attributes: ['id', 'name'] },
        { model: Team, as: 'EastTeam' },
        { model: Team, as: 'WestTeam' },
        { model: Team, as: 'Champion' },
      ],
      order: [['points', 'DESC']],
    });

    return res.status(200).json({
      predictions,
      submissionOpen: false,
    });
  } catch (error) {
    logger.error('Error getting all Stanley Cup predictions:', error);
    next(error);
  }
};

// Admin: Set actual Stanley Cup results and calculate points
export const setStanleyCupResults = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { season, eastTeamId, westTeamId, winningTeamId, gamesPlayed } =
      req.body;

    // Validate input
    if (
      !season ||
      !eastTeamId ||
      !westTeamId ||
      !winningTeamId ||
      !gamesPlayed
    ) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if games is between 4 and 7
    if (gamesPlayed < 4 || gamesPlayed > 7) {
      return res
        .status(400)
        .json({ message: 'Games played must be between 4 and 7' });
    }

    // Get teams to check if they exist and are in the right conference
    const eastTeam = await Team.findOne({
      where: { id: eastTeamId, conference: 'Eastern' },
    });

    const westTeam = await Team.findOne({
      where: { id: westTeamId, conference: 'Western' },
    });

    // Validate teams
    if (!eastTeam) {
      return res
        .status(400)
        .json({ message: 'East team not found or not in Eastern conference' });
    }

    if (!westTeam) {
      return res
        .status(400)
        .json({ message: 'West team not found or not in Western conference' });
    }

    // Validate winning team
    if (winningTeamId !== eastTeamId && winningTeamId !== westTeamId) {
      return res
        .status(400)
        .json({ message: 'Winning team must be either the East or West team' });
    }

    // Get all predictions for this season
    const predictions = await StanleyCupPrediction.findAll({
      where: { season },
    });

    // Calculate points for each prediction
    for (const prediction of predictions) {
      let points = 0;

      // Check if east team is correct (2 points)
      if (prediction.eastTeamId === eastTeamId) {
        points += 2;
      }

      // Check if west team is correct (2 points)
      if (prediction.westTeamId === westTeamId) {
        points += 2;
      }

      // Check if cup winner is correct (6 points)
      if (prediction.winningTeamId === winningTeamId) {
        points += 6;
      }

      // Bonus for correct games (3 points)
      if (
        prediction.gamesPlayed === gamesPlayed &&
        prediction.winningTeamId === winningTeamId
      ) {
        points += 3;
      }

      // Update prediction with points
      await prediction.update({ points });
    }

    // Store results in database (you may want to create a separate model for this)
    // For simplicity, we'll just return a success message here
    return res.status(200).json({
      message: 'Stanley Cup results set and points calculated successfully',
      results: {
        season,
        eastTeam: eastTeam.name,
        westTeam: westTeam.name,
        champion: winningTeamId === eastTeamId ? eastTeam.name : westTeam.name,
        gamesPlayed,
      },
    });
  } catch (error) {
    logger.error('Error setting Stanley Cup results:', error);
    next(error);
  }
};
