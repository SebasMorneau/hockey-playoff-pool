import { Request, Response, NextFunction } from 'express';
import { Round, Series, Team, RoundCreationAttributes, SeriesCreationAttributes } from '../models';
import { logger } from '../utils/logger';

// Get all rounds
export const getAllRounds = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const rounds = await Round.findAll({
      order: [['number', 'ASC']],
    });

    return res.status(200).json({ rounds });
  } catch (error) {
    logger.error('Error getting all rounds:', error);
    next(error);
  }
};

// Get round by ID
export const getRoundById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const round = await Round.findByPk(id, {
      include: [
        {
          model: Series,
          as: 'Series',
        },
      ],
    });

    if (!round) {
      return res.status(404).json({ message: 'Round not found' });
    }

    return res.status(200).json({ round });
  } catch (error) {
    logger.error('Error getting round by ID:', error);
    next(error);
  }
};

// Get rounds by season
export const getRoundsBySeason = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { season } = req.params;

    const rounds = await Round.findAll({
      where: { season },
      order: [['number', 'ASC']],
    });

    return res.status(200).json({ rounds });
  } catch (error) {
    logger.error('Error getting rounds by season:', error);
    next(error);
  }
};

// Get current active round
export const getCurrentRound = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { season } = req.query;

    if (!season) {
      return res
        .status(400)
        .json({ message: 'Season query parameter is required' });
    }

    // Find the current active round
    const currentRound = await Round.findOne({
      where: {
        season: season as string,
        active: true,
      },
    });

    // If no round is active, find the next scheduled round
    if (!currentRound) {
      const nextRound = await Round.findOne({
        where: {
          season: season as string,
          active: true,
        },
        order: [['number', 'ASC']],
      });

      if (nextRound) {
        return res.status(200).json({
          status: 'upcoming',
          round: nextRound,
        });
      }

      // If no upcoming round, find the last completed round
      const lastRound = await Round.findOne({
        where: {
          season: season as string,
          active: true,
        },
        order: [['number', 'DESC']],
      });

      if (lastRound) {
        return res.status(200).json({
          status: 'completed',
          round: lastRound,
        });
      }

      // If no rounds found at all
      return res
        .status(404)
        .json({ message: 'No rounds found for the specified season' });
    }

    // Return the current active round
    return res.status(200).json({
      status: 'active',
      round: currentRound,
    });
  } catch (error) {
    logger.error('Error getting current round:', error);
    next(error);
  }
};

// Admin: Create a new round
export const createRound = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, number, season, matchups } = req.body;
    logger.info('Creating round with data:', { name, number, season, matchups });

    // Check if round already exists for this season
    const existingRound = await Round.findOne({
      where: { number, season },
    });

    if (existingRound) {
      logger.warn('Round already exists:', { number, season });
      return res.status(400).json({
        message: 'Round with this number already exists for this season',
      });
    }

    // Create the round
    const round = await Round.create({
      name,
      number,
      season,
      active: true,
    } as RoundCreationAttributes);
    logger.info('Round created successfully:', { roundId: round.id });

    // Create series for each matchup if provided
    if (matchups && Array.isArray(matchups) && matchups.length > 0) {
      logger.info('Creating matchups:', matchups);
      const seriesPromises = matchups.map(matchup => 
        Series.create({
          roundId: round.id,
          homeTeamId: matchup.homeTeamId,
          awayTeamId: matchup.awayTeamId,
          homeTeamWins: 0,
          awayTeamWins: 0,
          gamesPlayed: 0,
          completed: false,
        } as SeriesCreationAttributes)
      );
      
      const createdSeries = await Promise.all(seriesPromises);
      logger.info('Matchups created successfully:', createdSeries.map(s => s.id));
    }

    // Fetch the created round with its series (if any)
    const createdRound = await Round.findByPk(round.id, {
      include: [
        {
          model: Series,
          as: 'Series',
          include: [
            { model: Team, as: 'HomeTeam' },
            { model: Team, as: 'AwayTeam' }
          ]
        }
      ]
    });
    logger.info('Final round data:', JSON.stringify(createdRound, null, 2));

    return res.status(201).json({
      message: 'Round created successfully',
      round: createdRound,
    });
  } catch (error) {
    logger.error('Error creating round:', error);
    next(error);
  }
};

// Admin: Update a round
export const updateRound = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { name, active } = req.body;

    // Find the round
    const round = await Round.findByPk(id);
    if (!round) {
      return res.status(404).json({ message: 'Round not found' });
    }

    // Update the round
    await round.update({
      name,
      active,
    });

    return res.status(200).json({
      message: 'Round updated successfully',
      round,
    });
  } catch (error) {
    logger.error('Error updating round:', error);
    next(error);
  }
};

// Admin: Delete a round
export const deleteRound = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    // Find the round
    const round = await Round.findByPk(id);
    if (!round) {
      return res.status(404).json({ message: 'Round not found' });
    }

    // Check if round has associated series
    const seriesCount = await Series.count({
      where: { roundId: id },
    });

    if (seriesCount > 0) {
      return res
        .status(400)
        .json({ message: 'Cannot delete round with associated series' });
    }

    // Delete the round
    await round.destroy();

    return res.status(200).json({
      message: 'Round deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting round:', error);
    next(error);
  }
};

// Seed initial rounds for a season
export const seedRounds = async (season: string) => {
  try {
    const roundsCount = await Round.count({ where: { season } });

    if (roundsCount > 0) {
      logger.info('Rounds already seeded for this season, skipping');
      return;
    }

    // Example rounds for NHL playoffs
    const playoffRounds = [
      {
        name: 'First Round',
        number: 1,
        season,
        active: true,
      },
      {
        name: 'Second Round',
        number: 2,
        season,
        active: true,
      },
      {
        name: 'Conference Finals',
        number: 3,
        season,
        active: true,
      },
      {
        name: 'Stanley Cup Final',
        number: 4,
        season,
        active: true,
      },
    ];

    // Create all rounds
    await Round.bulkCreate(playoffRounds);

    logger.info(`Rounds seeded successfully for season ${season}`);
  } catch (error) {
    logger.error('Error seeding rounds:', error);
    throw error;
  }
};
