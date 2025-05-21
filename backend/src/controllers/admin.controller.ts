import { Request, Response, NextFunction } from 'express';
import { User, Team, Round, Series, Prediction } from '../models';
import { seedTeams } from './teams.controller';
import { seedRounds } from './rounds.controller';
import { logger } from '../utils/logger';
import { sendMagicLink, getEmailStats } from '../utils/email';
import { v4 as uuidv4 } from 'uuid';
import { Sequelize } from 'sequelize';

// Get admin dashboard data
export const getDashboardData = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get counts
    const userCount = await User.count();
    const teamCount = await Team.count();
    const roundCount = await Round.count();
    const seriesCount = await Series.count();

    // Get latest users
    const latestUsers = await User.findAll({
      attributes: ['id', 'name', 'email', 'lastLogin', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    // Get active rounds
    const activeRounds = await Round.findAll({
      where: { active: true },
      order: [['number', 'ASC']],
    });

    return res.status(200).json({
      counts: {
        users: userCount,
        teams: teamCount,
        rounds: roundCount,
        series: seriesCount,
      },
      latestUsers,
      activeRounds,
    });
  } catch (error) {
    logger.error('Error getting admin dashboard data:', error);
    next(error);
  }
};

// Get all users for admin
export const getAllUsers = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const users = await User.findAll({
      attributes: [
        'id',
        'name',
        'email',
        'isAdmin',
        'lastLogin',
        'createdAt',
        [Sequelize.fn('SUM', Sequelize.col('Predictions.points')), 'points'],
      ],
      include: [
        {
          model: Prediction,
          as: 'Predictions',
          attributes: [],
          required: false,
        },
      ],
      group: ['User.id', 'User.name', 'User.email', 'User.isAdmin', 'User.lastLogin', 'User.createdAt'],
      order: [['name', 'ASC']],
    });

    // Format the response to include points
    const formattedUsers = users.map((user: any) => ({
      id: user.get('id'),
      name: user.get('name'),
      email: user.get('email'),
      isAdmin: user.get('isAdmin'),
      lastLogin: user.get('lastLogin'),
      createdAt: user.get('createdAt'),
      points: parseInt(user.getDataValue('points')) || 0,
    }));

    return res.status(200).json({ users: formattedUsers });
  } catch (error) {
    logger.error('Error getting all users:', error);
    next(error);
  }
};

// Update user (admin only)
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { name, isAdmin } = req.body;

    // Find the user
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the user
    await user.update({
      name,
      isAdmin,
    });

    return res.status(200).json({
      message: 'User updated successfully',
      user: {
        id: user.get('id'),
        name: user.get('name'),
        email: user.get('email'),
        isAdmin: user.get('isAdmin'),
        lastLogin: user.get('lastLogin'),
        createdAt: user.get('createdAt'),
      },
    });
  } catch (error) {
    logger.error('Error updating user:', error);
    next(error);
  }
};

// Update user points (admin only)
export const updateUserPoints = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { points } = req.body;

    // Find the user
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update points in all user's predictions
    await Prediction.update(
      { points },
      { where: { userId: id } }
    );

    return res.status(200).json({
      message: 'User points updated successfully',
      user: {
        id: user.get('id'),
        name: user.get('name'),
        email: user.get('email'),
        isAdmin: user.get('isAdmin'),
        lastLogin: user.get('lastLogin'),
        createdAt: user.get('createdAt'),
      },
    });
  } catch (error) {
    logger.error('Error updating user points:', error);
    next(error);
  }
};

// Initialize system data
export const initSystemData = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { season } = req.body;

    if (!season) {
      return res
        .status(400)
        .json({ message: 'Season is required (e.g., "2024-2025")' });
    }

    // Seed teams
    await seedTeams();

    // Seed rounds for the specified season
    await seedRounds(season);

    return res.status(200).json({
      message: 'System data initialized successfully',
      season,
    });
  } catch (error) {
    logger.error('Error initializing system data:', error);
    next(error);
  }
};

// Create a matchup between teams
export const createMatchup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { 
      roundId, 
      homeTeamId, 
      awayTeamId,
      // Optional team details if teams don't exist
      homeTeamName,
      homeTeamShortName,
      homeTeamConference,
      homeTeamDivision,
      homeTeamLogoUrl,
      awayTeamName,
      awayTeamShortName,
      awayTeamConference,
      awayTeamDivision,
      awayTeamLogoUrl
    } = req.body;

    // Check if round exists
    let round = await Round.findByPk(roundId);
    if (!round) {
      return res.status(404).json({ message: 'Round not found' });
    }

    // Check if home team exists, create if not
    let homeTeam = await Team.findByPk(homeTeamId);
    if (!homeTeam && homeTeamName) {
      homeTeam = await Team.create({
        name: homeTeamName,
        shortName: homeTeamShortName,
        conference: homeTeamConference,
        division: homeTeamDivision,
        logoUrl: homeTeamLogoUrl,
        active: true,
      });
    } else if (!homeTeam) {
      return res.status(404).json({ message: 'Home team not found and no details provided' });
    }

    // Check if away team exists, create if not
    let awayTeam = await Team.findByPk(awayTeamId);
    if (!awayTeam && awayTeamName) {
      awayTeam = await Team.create({
        name: awayTeamName,
        shortName: awayTeamShortName,
        conference: awayTeamConference,
        division: awayTeamDivision,
        logoUrl: awayTeamLogoUrl,
        active: true,
      });
    } else if (!awayTeam) {
      return res.status(404).json({ message: 'Away team not found and no details provided' });
    }

    // Check if series already exists
    const existingSeries = await Series.findOne({
      where: {
        roundId,
        homeTeamId: homeTeam.get('id') as number,
        awayTeamId: awayTeam.get('id') as number,
      },
    });

    if (existingSeries) {
      return res.status(400).json({ message: 'Series already exists between these teams in this round' });
    }

    // Create the series
    const series = await Series.create({
      roundId,
      homeTeamId: homeTeam.get('id') as number,
      awayTeamId: awayTeam.get('id') as number,
      homeTeamWins: 0,
      awayTeamWins: 0,
      gamesPlayed: 0,
      completed: false,
    } as any); // Type assertion to bypass the type check since we know the database will handle the id

    return res.status(201).json({
      message: 'Matchup created successfully',
      series: {
        ...series.toJSON(),
        HomeTeam: homeTeam,
        AwayTeam: awayTeam,
        Round: round,
      },
    });
  } catch (error) {
    logger.error('Error creating matchup:', error);
    next(error);
  }
};

// Invite a new user
export const inviteUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({ message: 'Email and name are required' });
    }

    // Convert email to lowercase for case-insensitive search
    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create the user
    const user = await User.create({
      email: normalizedEmail,
      name,
      isAdmin: false,
    });

    // Generate token and expiry
    const token = uuidv4();
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 30); // 30 minutes expiry

    // Update user with magic link details
    await user.update({
      magicLinkToken: token,
      magicLinkExpiry: expiryTime,
    });

    // Generate magic link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const magicLink = `${frontendUrl}/auth/verify?token=${token}`;

    // Send invitation email
    await sendMagicLink(normalizedEmail, name, magicLink);
    logger.info(`Invitation sent to ${normalizedEmail}`);

    return res.status(201).json({
      message: 'User invited successfully',
      user: {
        id: user.get('id'),
        email: user.get('email'),
        name: user.get('name'),
        isAdmin: user.get('isAdmin'),
      },
    });
  } catch (error) {
    logger.error('Error inviting user:', error);
    next(error);
  }
};

// Delete user (admin only)
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    // Find the user
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete the user
    await user.destroy();

    return res.status(200).json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting user:', error);
    next(error);
  }
};

// Update user prediction for a series
export const updateUserPrediction = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId, seriesId } = req.params;
    const { predictedWinnerId, predictedGames, points } = req.body;

    // Find the prediction
    const prediction = await Prediction.findOne({
      where: {
        userId,
        seriesId,
      },
      include: [
        { model: Series, as: 'Series' },
        { model: User, as: 'User' },
      ],
    });

    if (!prediction) {
      return res.status(404).json({ message: 'Prediction not found' });
    }

    // Update the prediction with only the provided fields
    const updateData: any = {};
    if (predictedWinnerId !== undefined) updateData.predictedWinnerId = predictedWinnerId;
    if (predictedGames !== undefined) updateData.predictedGames = predictedGames;
    if (points !== undefined) updateData.points = points;

    // Update the prediction
    await prediction.update(updateData);

    // Get the updated prediction with all associations
    const updatedPrediction = await Prediction.findOne({
      where: {
        userId,
        seriesId,
      },
      include: [
        { model: Series, as: 'Series' },
        { model: User, as: 'User' },
        { model: Team, as: 'PredictedWinner' },
      ],
    });

    return res.status(200).json({
      message: 'Prediction updated successfully',
      prediction: updatedPrediction,
    });
  } catch (error) {
    logger.error('Error updating user prediction:', error);
    next(error);
  }
};

// Get email system diagnostics
export const getEmailDiagnostics = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get current email statistics
    const emailStats = getEmailStats();
    
    // Calculate success rate
    const successRate = emailStats.totalAttempts > 0 
      ? (emailStats.successCount / emailStats.totalAttempts * 100).toFixed(2) + '%'
      : 'N/A';
    
    // Format last send time
    const lastSendTimeFormatted = emailStats.lastSendTime 
      ? emailStats.lastSendTime.toISOString()
      : 'Never';
    
    // Build diagnostic info
    const diagnosticInfo = {
      stats: {
        ...emailStats,
        successRate,
        lastSendTimeFormatted,
        averageSendTimeMs: emailStats.averageSendTime.toFixed(2)
      },
      config: {
        service: process.env.EMAIL_SERVICE || 'Not configured',
        from: process.env.EMAIL_FROM || 'noreply@emstone.ca',
        enabled: Boolean(
          process.env.EMAIL_SERVICE && 
          process.env.EMAIL_USER && 
          process.env.EMAIL_PASSWORD
        ),
        retryAttempts: Number(process.env.EMAIL_RETRY_ATTEMPTS || '3'),
        retryDelay: Number(process.env.EMAIL_RETRY_DELAY || '1000')
      }
    };
    
    return res.status(200).json(diagnosticInfo);
  } catch (error) {
    logger.error('Error getting email diagnostics:', error);
    next(error);
  }
};

// Test email sending
export const testEmailSending = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }
    
    logger.info(`Admin requested test email to ${email}`);
    
    // Generate a fake magic link for testing
    const testToken = 'test-email-' + Date.now();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const testLink = `${frontendUrl}/test?token=${testToken}`;
    
    // Send test email
    await sendMagicLink(email, 'Test User', testLink);
    
    return res.status(200).json({ 
      message: 'Test email sent successfully',
      stats: getEmailStats()
    });
  } catch (error) {
    logger.error('Error sending test email:', error);
    next(error);
  }
};

// Create user prediction (admin only)
export const createUserPrediction = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId, seriesId, predictedWinnerId, predictedGames } = req.body;

    // Validate input
    if (!userId || !seriesId || !predictedWinnerId || !predictedGames) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if games is between 4 and 7
    if (predictedGames < 4 || predictedGames > 7) {
      return res.status(400).json({ message: 'Predicted games must be between 4 and 7' });
    }

    // Get the series
    const series = await Series.findByPk(seriesId, {
      include: [
        { model: Team, as: 'HomeTeam' },
        { model: Team, as: 'AwayTeam' },
      ],
    });

    if (!series) {
      return res.status(404).json({ message: 'Series not found' });
    }

    // Validate selected team is part of the series
    if (
      predictedWinnerId !== series.homeTeamId &&
      predictedWinnerId !== series.awayTeamId
    ) {
      return res.status(400).json({
        message: 'Predicted winner must be one of the teams in the series',
      });
    }

    // Check if prediction already exists
    const existingPrediction = await Prediction.findOne({
      where: {
        userId,
        seriesId,
      },
    });

    if (existingPrediction) {
      return res.status(400).json({
        message: 'Prediction already exists for this user and series',
      });
    }

    // Create the prediction
    const prediction = await Prediction.create({
      userId,
      seriesId,
      predictedWinnerId,
      predictedGames,
      points: 0,
    });

    // Get the created prediction with all associations
    const createdPrediction = await Prediction.findOne({
      where: {
        id: prediction.id,
      },
      include: [
        { model: Series, as: 'Series' },
        { model: User, as: 'User' },
        { model: Team, as: 'PredictedWinner' },
      ],
    });

    return res.status(201).json({
      message: 'Prediction created successfully',
      prediction: createdPrediction,
    });
  } catch (error) {
    logger.error('Error creating user prediction:', error);
    next(error);
  }
};
