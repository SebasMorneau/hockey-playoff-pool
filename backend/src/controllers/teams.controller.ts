import { Request, Response, NextFunction } from 'express';
import { Team, TeamCreationAttributes } from '../models';
import { logger } from '../utils/logger';

// Get all teams
export const getAllTeams = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const teams = await Team.findAll({
      order: [['name', 'ASC']],
    });

    return res.status(200).json({ teams });
  } catch (error) {
    logger.error('Error getting all teams:', error);
    next(error);
  }
};

// Get team by ID
export const getTeamById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const team = await Team.findByPk(id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    return res.status(200).json({ team });
  } catch (error) {
    logger.error('Error getting team by ID:', error);
    next(error);
  }
};

// Get teams by conference
export const getTeamsByConference = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { conference } = req.params;

    const teams = await Team.findAll({
      where: { conference },
      order: [
        ['division', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    return res.status(200).json({ teams });
  } catch (error) {
    logger.error('Error getting teams by conference:', error);
    next(error);
  }
};

// Admin: Create a new team
export const createTeam = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, shortName, logoUrl, conference, division } = req.body;

    // Check if team already exists
    const existingTeam = await Team.findOne({
      where: { name },
    });

    if (existingTeam) {
      return res.status(400).json({
        message: 'Team with this name already exists',
      });
    }

    // Create the team
    const team = await Team.create({
      name,
      shortName,
      logoUrl,
      conference,
      division,
      active: true,
    } as TeamCreationAttributes);

    return res.status(201).json({
      message: 'Team created successfully',
      team,
    });
  } catch (error) {
    logger.error('Error creating team:', error);
    next(error);
  }
};

// Admin: Update a team
export const updateTeam = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { name, shortName, logoUrl, conference, division, active } = req.body;

    // Find the team
    const team = await Team.findByPk(id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if name is being changed and if it already exists
    if (name !== team.name) {
      const existingTeam = await Team.findOne({
        where: { name },
      });

      if (existingTeam) {
        return res.status(400).json({
          message: 'Team with this name already exists',
        });
      }
    }

    // Update the team
    await team.update({
      name,
      shortName,
      logoUrl,
      conference,
      division,
      active,
    });

    return res.status(200).json({
      message: 'Team updated successfully',
      team,
    });
  } catch (error) {
    logger.error('Error updating team:', error);
    next(error);
  }
};

// Admin: Delete a team
export const deleteTeam = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    // Find the team
    const team = await Team.findByPk(id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Delete the team
    await team.destroy();

    return res.status(200).json({
      message: 'Team deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting team:', error);
    next(error);
  }
};

// Seed initial NHL teams data
export const seedTeams = async () => {
  try {
    const teamsCount = await Team.count();

    if (teamsCount > 0) {
      logger.info('Teams already seeded, skipping');
      return;
    }

    // NHL teams data
    const nhlTeams: TeamCreationAttributes[] = [
      // Eastern Conference - Atlantic Division
      {
        name: 'Florida Panthers',
        shortName: 'FLA',
        conference: 'Eastern',
        division: 'Atlantic',
        logoUrl: '/logos/FLA.svg',
        active: true,
      },
      {
        name: 'Montreal Canadiens',
        shortName: 'MTL',
        conference: 'Eastern',
        division: 'Atlantic',
        logoUrl: '/logos/MTL.svg',
        active: true,
      },
      {
        name: 'Ottawa Senators',
        shortName: 'OTT',
        conference: 'Eastern',
        division: 'Atlantic',
        logoUrl: '/logos/OTT.svg',
        active: true,
      },
      {
        name: 'Tampa Bay Lightning',
        shortName: 'TBL',
        conference: 'Eastern',
        division: 'Atlantic',
        logoUrl: '/logos/TBL.svg',
        active: true,
      },
      {
        name: 'Toronto Maple Leafs',
        shortName: 'TOR',
        conference: 'Eastern',
        division: 'Atlantic',
        logoUrl: '/logos/TOR.svg',
        active: true,
      },

      // Eastern Conference - Metropolitan Division
      {
        name: 'Carolina Hurricanes',
        shortName: 'CAR',
        conference: 'Eastern',
        division: 'Metropolitan',
        logoUrl: '/logos/CAR.svg',
        active: true,
      },
      {
        name: 'New Jersey Devils',
        shortName: 'NJD',
        conference: 'Eastern',
        division: 'Metropolitan',
        logoUrl: '/logos/NJD.svg',
        active: true,
      },
      {
        name: 'Washington Capitals',
        shortName: 'WSH',
        conference: 'Eastern',
        division: 'Metropolitan',
        logoUrl: '/logos/WSH.svg',
        active: true,
      },

      // Western Conference - Central Division
      {
        name: 'Colorado Avalanche',
        shortName: 'COL',
        conference: 'Western',
        division: 'Central',
        logoUrl: '/logos/COL.svg',
        active: true,
      },
      {
        name: 'Dallas Stars',
        shortName: 'DAL',
        conference: 'Western',
        division: 'Central',
        logoUrl: '/logos/DAL.svg',
        active: true,
      },
      {
        name: 'Minnesota Wild',
        shortName: 'MIN',
        conference: 'Western',
        division: 'Central',
        logoUrl: '/logos/MIN.svg',
        active: true,
      },
      {
        name: 'St. Louis Blues',
        shortName: 'STL',
        conference: 'Western',
        division: 'Central',
        logoUrl: '/logos/STL.svg',
        active: true,
      },
      {
        name: 'Winnipeg Jets',
        shortName: 'WPG',
        conference: 'Western',
        division: 'Central',
        logoUrl: '/logos/WPG.svg',
        active: true,
      },

      // Western Conference - Pacific Division
      {
        name: 'Edmonton Oilers',
        shortName: 'EDM',
        conference: 'Western',
        division: 'Pacific',
        logoUrl: '/logos/EDM.svg',
        active: true,
      },
      {
        name: 'Los Angeles Kings',
        shortName: 'LAK',
        conference: 'Western',
        division: 'Pacific',
        logoUrl: '/logos/LAK.svg',
        active: true,
      },
      {
        name: 'Vegas Golden Knights',
        shortName: 'VGK',
        conference: 'Western',
        division: 'Pacific',
        logoUrl: '/logos/VGK.svg',
        active: true,
      },
    ];

    // Create all teams
    await Team.bulkCreate(nhlTeams);
    logger.info('Teams seeded successfully');
  } catch (error) {
    logger.error('Error seeding teams:', error);
    throw error;
  }
};
