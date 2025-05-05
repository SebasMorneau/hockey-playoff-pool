import { Request, Response, NextFunction } from 'express';
import { Series, Team, Round, Prediction } from '../models';
import { Op } from 'sequelize';
import { calculateSeriesPoints } from './predictions.controller';

// Get all series with teams and rounds
export const getAllSeries = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const series = await Series.findAll({
      include: [
        { model: Team, as: 'HomeTeam' },
        { model: Team, as: 'AwayTeam' },
        { model: Team, as: 'WinningTeam' },
        { model: Round, as: 'Round' },
      ],
      order: [
        [{ model: Round, as: 'Round' }, 'number', 'DESC'], // Higher round numbers first
        ['completed', 'ASC'], // Active series first
        ['createdAt', 'DESC'], // Newer series first within each group
      ],
    });
    res.json(series);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching series', error });
  }
};

// Get series by ID
export const getSeriesById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const series = await Series.findByPk(req.params.id, {
      include: [
        { model: Team, as: 'HomeTeam' },
        { model: Team, as: 'AwayTeam' },
        { model: Team, as: 'WinningTeam' },
        { model: Round, as: 'Round' },
        { model: Prediction, as: 'Predictions' },
      ],
    });
    if (!series) {
      return res.status(404).json({ message: 'Series not found' });
    }
    res.json(series);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching series', error });
  }
};

// Get all series for a specific round
export const getSeriesByRound = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const series = await Series.findAll({
      where: { roundId: req.params.roundId },
      include: [
        { model: Team, as: 'HomeTeam' },
        { model: Team, as: 'AwayTeam' },
        { model: Team, as: 'WinningTeam' },
      ],
      order: [['createdAt', 'ASC']],
    });
    res.json(series);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching series', error });
  }
};

// Admin: Create a new series
export const createSeries = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { roundId, homeTeamId, awayTeamId, startDate } = req.body;

    // Validate teams exist
    const [homeTeam, awayTeam] = await Promise.all([
      Team.findByPk(homeTeamId),
      Team.findByPk(awayTeamId),
    ]);

    if (!homeTeam || !awayTeam) {
      return res.status(400).json({ message: 'One or both teams not found' });
    }

    // Check for existing series with same teams in the same round
    const existingSeries = await Series.findOne({
      where: {
        roundId,
        [Op.or]: [
          { homeTeamId, awayTeamId },
          { homeTeamId: awayTeamId, awayTeamId: homeTeamId },
        ],
      },
    });

    if (existingSeries) {
      return res.status(400).json({ message: 'Series already exists between these teams in this round' });
    }

    const series = await Series.create({
      roundId,
      homeTeamId,
      awayTeamId,
      homeTeamWins: 0,
      awayTeamWins: 0,
      gamesPlayed: 0,
      completed: false,
      startDate: startDate ? new Date(startDate) : undefined,
    });

    res.status(201).json(series);
  } catch (error) {
    res.status(500).json({ message: 'Error creating series', error });
  }
};

// Admin: Update series results
export const updateSeriesResults = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { homeTeamWins, awayTeamWins, gamesPlayed, startDate, endDate, completed: requestCompleted } = req.body;

    const series = await Series.findByPk(id);
    if (!series) {
      return res.status(404).json({ message: 'Series not found' });
    }

    // Validate wins
    if (homeTeamWins > 4 || awayTeamWins > 4) {
      return res.status(400).json({ message: 'Team cannot have more than 4 wins' });
    }

    if (homeTeamWins + awayTeamWins !== gamesPlayed) {
      return res.status(400).json({ message: 'Total games played must equal sum of wins' });
    }

    // Determine winning team
    let winningTeamId: number | undefined = undefined;
    let completed = requestCompleted || false;

    // If one team has 4 wins, the series must be completed and we set the winning team
    if (homeTeamWins === 4) {
      winningTeamId = series.homeTeamId;
      completed = true;
    } else if (awayTeamWins === 4) {
      winningTeamId = series.awayTeamId;
      completed = true;
    }

    await series.update({
      homeTeamWins,
      awayTeamWins,
      gamesPlayed,
      winningTeamId,
      completed,
      startDate: startDate || series.startDate,
      endDate: completed ? endDate : undefined,
    });

    // Calculate points if series is completed
    if (completed) {
      await calculateSeriesPoints(series.id);
    }

    res.json(series);
  } catch (error) {
    res.status(500).json({ message: 'Error updating series results', error });
  }
};

// Admin: Delete a series
export const deleteSeries = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const series = await Series.findByPk(req.params.id);
    if (!series) {
      return res.status(404).json({ message: 'Series not found' });
    }

    // Check if series has predictions
    const predictions = await Prediction.findAll({
      where: { seriesId: req.params.id },
    });

    if (predictions.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete series with existing predictions',
        predictionCount: predictions.length,
      });
    }

    await series.destroy();
    res.json({ message: 'Series deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting series', error });
  }
};
