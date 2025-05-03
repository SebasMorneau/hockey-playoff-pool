import { Request, Response, NextFunction } from 'express';
import { Prediction, Series, Team, Round, User, PredictionCreationAttributes } from '../models';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize';

interface SeriesAttributes {
  id: number;
  roundId: number;
  homeTeamId: number;
  awayTeamId: number;
  winningTeamId?: number;
  gamesPlayed: number;
  homeTeamWins: number;
  awayTeamWins: number;
  completed: boolean;
}

interface RoundAttributes {
  id: number;
  name: string;
  number: number;
  season: string;
  active: boolean;
}

interface PredictionAttributes {
  id: number;
  userId: number;
  seriesId: number;
  predictedWinnerId: number;
  predictedGames: number;
  points?: number;
}

// Submit or update series prediction
export const submitPrediction = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user.userId;
    const isAdmin = req.user.isAdmin;
    const { seriesId, predictedWinnerId, predictedGames } = req.body;

    // Validate input
    if (!seriesId || !predictedWinnerId || !predictedGames) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    // Check if games is between 4 and 7
    if (predictedGames < 4 || predictedGames > 7) {
      res
        .status(400)
        .json({ message: 'Predicted games must be between 4 and 7' });
      return;
    }

    // Get the series
    const series = await Series.findByPk(seriesId, {
      include: [
        { model: Team, as: 'HomeTeam' },
        { model: Team, as: 'AwayTeam' },
      ],
    });

    if (!series) {
      res.status(404).json({ message: 'Series not found' });
      return;
    }

    // Validate selected team is part of the series
    if (
      predictedWinnerId !== series.homeTeamId &&
      predictedWinnerId !== series.awayTeamId
    ) {
      res.status(400).json({
        message: 'Predicted winner must be one of the teams in the series',
      });
      return;
    }

    // Check if the series has started and user is not admin
    if (!isAdmin && series.completed) {
      return res.status(400).json({
        message: 'Cannot submit prediction for a completed series',
      });
    }

    // Create or update prediction
    const [prediction, created] = await Prediction.findOrCreate({
      where: {
        userId,
        seriesId,
      },
      defaults: {
        userId,
        seriesId,
        predictedWinnerId,
        predictedGames,
        points: 0,
      } as PredictionCreationAttributes,
    });

    if (!created) {
      // Update existing prediction
      await prediction.update({
        predictedWinnerId,
        predictedGames,
      });
    }

    res.status(201).json({
      message: created
        ? 'Prediction submitted successfully'
        : 'Prediction updated successfully',
      prediction: {
        id: prediction.id,
        seriesId: prediction.seriesId,
        predictedWinnerId: prediction.predictedWinnerId,
        predictedGames: prediction.predictedGames,
      },
    });
  } catch (error) {
    logger.error('Error submitting prediction:', error);
    next(error);
  }
};

// Get all predictions for current user
export const getUserPredictions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user.userId;

    const predictions = await Prediction.findAll({
      where: { userId },
      include: [
        {
          model: Series,
          as: 'Series',
          include: [
            { model: Round, as: 'Round' },
            { model: Team, as: 'HomeTeam' },
            { model: Team, as: 'AwayTeam' },
            { model: Team, as: 'WinningTeam' },
          ],
        },
        { model: Team, as: 'PredictedWinner' },
      ],
      order: [
        [
          { model: Series, as: 'Series' },
          { model: Round, as: 'Round' },
          'number',
          'ASC',
        ],
        [{ model: Series, as: 'Series' }, 'id', 'ASC'],
      ],
    });

    const seriesStarted = predictions[0]?.Series?.completed || false;

    res.status(200).json({ predictions, seriesStarted });
  } catch (error) {
    logger.error('Error getting user predictions:', error);
    next(error);
  }
};

// Get series predictions
export const getSeriesPredictions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { seriesId } = req.params;
    const userId = req.user.userId;

    // Get the series
    const series = await Series.findByPk(seriesId, {
      include: [{ model: Round, as: 'Round' }],
    });

    if (!series) {
      res.status(404).json({ message: 'Series not found' });
      return;
    }

    // We've already checked series exists, so we can safely assert Round exists
    const round = series.Round!;
    if (!round) {
      res.status(500).json({ message: 'Series has no associated round' });
      return;
    }

    // Check if series is completed or has started
    const now = new Date();
    const seriesStarted = series.completed || false;

    if (!series.completed && !seriesStarted) {
      // Only return user's own prediction if series hasn't started
      const userPrediction = await Prediction.findOne({
        where: { userId, seriesId },
        include: [{ model: Team, as: 'PredictedWinner' }],
      });

      res.status(200).json({
        predictions: userPrediction ? [userPrediction] : [],
        roundStarted: false,
        seriesCompleted: false,
      });
      return;
    }

    // If series has started or is completed, return all predictions
    const predictions = await Prediction.findAll({
      where: { seriesId },
      include: [
        { model: User, attributes: ['id', 'name'] },
        { model: Team, as: 'PredictedWinner' },
      ],
      order: [['points', 'DESC']],
    });

    res.status(200).json({
      predictions,
      roundStarted: seriesStarted,
      seriesCompleted: series.completed,
    });
  } catch (error) {
    logger.error('Error getting series predictions:', error);
    next(error);
  }
};

// Calculate points for all predictions of a completed series
export const calculateSeriesPoints = async (
  seriesId: number,
): Promise<void> => {
  try {
    // Get the completed series
    const series = await Series.findByPk(seriesId, {
      include: [
        { model: Team, as: 'HomeTeam' },
        { model: Team, as: 'AwayTeam' },
        { model: Team, as: 'WinningTeam' }
      ]
    });

    if (!series || !series.completed || !series.winningTeamId) {
      throw new AppError('Series is not completed or has no winner', 400);
    }

    const totalGames = series.homeTeamWins + series.awayTeamWins;

    // Get all predictions for this series
    const predictions = await Prediction.findAll({
      where: { seriesId },
      include: [
        { model: User, as: 'User', attributes: ['id', 'name'] },
        { model: Team, as: 'PredictedWinner' }
      ]
    });

    // Calculate points for each prediction
    for (const prediction of predictions) {
      let points = 0;

      // Check if predicted winner is correct
      if (prediction.predictedWinnerId === series.winningTeamId) {
        // Award point for correct winner
        points += 1;

        // Award additional points for correct number of games
        if (prediction.predictedGames === totalGames) {
          points += 2;
        }
      }

      // Update prediction with points
      await prediction.update({ points });
    }

    logger.info(`Points calculated for series ${seriesId}`);
  } catch (error) {
    logger.error('Error calculating series points:', error);
    throw error;
  }
};

// Get overall leaderboard
export const getLeaderboard = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Use a more efficient query with Sequelize
    const leaderboard = await User.findAll({
      attributes: [
        'id',
        'name',
        [Sequelize.fn('SUM', Sequelize.col('Predictions.points')), 'totalPoints'],
      ],
      include: [
        {
          model: Prediction,
          as: 'Predictions',
          attributes: [],
          required: false,
        },
      ],
      group: ['User.id', 'User.name'],
      order: [[Sequelize.literal('totalPoints'), 'DESC']],
    });

    // Format the response
    const formattedLeaderboard = leaderboard.map((user: any) => ({
      userId: user.id,
      name: user.name,
      totalPoints: parseInt(user.getDataValue('totalPoints')) || 0,
    }));

    res.status(200).json({ leaderboard: formattedLeaderboard });
  } catch (error) {
    logger.error('Error getting leaderboard:', error);
    next(error);
  }
};

// Get series without predictions for current user
export const getUnpredictedSeries = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user.userId;
    logger.info('Getting unpredicted series for user:', { userId });

    // Get all active rounds
    const activeRounds = await Round.findAll({
      where: {
        active: true,
      },
      order: [['number', 'ASC']],
      attributes: ['id', 'name', 'season', 'active']
    }) as unknown as (Round & { season: string })[];

    if (activeRounds.length === 0) {
      return res.status(200).json({ series: [] });
    }

    // Get all series from active rounds that haven't been predicted by the user
    const series = await Series.findAll({
      include: [
        {
          model: Round,
          as: 'Round',
          where: {
            active: true,
          },
          attributes: ['id', 'name', 'season', 'active']
        },
        { 
          model: Team, 
          as: 'HomeTeam',
          attributes: ['id', 'name', 'shortName', 'logoUrl']
        },
        { 
          model: Team, 
          as: 'AwayTeam',
          attributes: ['id', 'name', 'shortName', 'logoUrl']
        }
      ],
      where: {
        completed: false,
        // Exclude series that already have predictions from this user
        id: {
          [Op.notIn]: Sequelize.literal(
            `(SELECT "seriesId" FROM "Predictions" WHERE "userId" = ${userId})`
          ),
        },
      },
      attributes: ['id', 'roundId', 'homeTeamId', 'awayTeamId', 'completed', 'homeTeamWins', 'awayTeamWins'],
      order: [
        [{ model: Round, as: 'Round' }, 'number', 'ASC'],
        ['id', 'ASC'],
      ],
    }) as unknown as (Series & SeriesAttributes)[];

    logger.info('Found unpredicted series:', series.map(s => ({
      id: s.id,
      roundName: (s.Round as unknown as { name: string })?.name,
      homeTeam: (s.HomeTeam as unknown as { name: string })?.name,
      awayTeam: (s.AwayTeam as unknown as { name: string })?.name
    })));

    res.status(200).json({ 
      series,
      currentSeason: (activeRounds[0] as unknown as { season: string }).season
    });
  } catch (error) {
    logger.error('Error getting unpredicted series:', error);
    next(error);
  }
};

// Get all users' predictions
export const getAllUsersPredictions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get all series with their predictions
    const allSeries = await Series.findAll({
      include: [
        { 
          model: Round, 
          as: 'Round',
          attributes: ['id', 'name', 'number', 'season', 'active']
        },
        { model: Team, as: 'HomeTeam' },
        { model: Team, as: 'AwayTeam' },
        { model: Team, as: 'WinningTeam' },
        {
          model: Prediction,
          as: 'Predictions',
          include: [
            { 
              model: User,
              as: 'User',
              attributes: ['id', 'name'],
            },
            { 
              model: Team,
              as: 'PredictedWinner',
            }
          ]
        }
      ],
      order: [
        // Sort by round number (higher numbers first)
        [{ model: Round, as: 'Round' }, 'number', 'DESC'],
        // Active series first
        ['completed', 'ASC'],
        // Newer series first
        ['createdAt', 'DESC'],
        // Sort predictions by points within each series
        [{ model: Prediction, as: 'Predictions' }, 'points', 'DESC']
      ]
    });

    // Transform the data to match frontend expectations
    const series = allSeries.map(s => ({
      ...s.get({ plain: true }),
      Predictions: s.Predictions?.map(p => ({
        userId: p.User?.id,
        userName: p.User?.name,
        predictedWinnerId: p.predictedWinnerId,
        predictedGames: p.predictedGames,
        points: p.points || 0,
        completed: s.completed
      })) || []
    }));

    res.status(200).json({ series });
  } catch (error) {
    logger.error('Error getting all users predictions:', error);
    next(error);
  }
};
