import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models';
import { sendMagicLink } from '../utils/email';
import { logger } from '../utils/logger';
import { Sequelize } from 'sequelize';

// JWT Secret check
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

// Generate a magic link token
const generateMagicLinkToken = (): string => {
  return uuidv4();
};

// Verify magic link and login
export const verifyMagicLink = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'Invalid token' });
    }

    // Find user with this token
    const user = await User.findOne({
      where: {
        magicLinkToken: token,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Token not found' });
    }

    // Check if token is expired
    const now = new Date();
    const magicLinkExpiry = user.get('magicLinkExpiry');
    if (!magicLinkExpiry || magicLinkExpiry < now) {
      return res.status(401).json({ message: 'Token expired' });
    }

    // Clear magic link token
    await user.update({
      magicLinkToken: undefined,
      magicLinkExpiry: undefined,
      lastLogin: new Date(),
    });

    // Generate JWT token
    const jwtToken = jwt.sign(
      {
        userId: user.get('id'),
        email: user.get('email'),
        isAdmin: Boolean(user.get('isAdmin')),
      },
      JWT_SECRET,
      { expiresIn: '90d' },
    );

    return res.status(200).json({
      token: jwtToken,
      user: {
        id: user.get('id'),
        email: user.get('email'),
        name: user.get('name'),
        isAdmin: Boolean(user.get('isAdmin')),
      },
    });
  } catch (error) {
    logger.error('Error verifying magic link:', error);
    next(error);
  }
};

// Request a magic link
export const requestMagicLink = async (
  req: Request,
  res: Response,
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Convert email to lowercase for case-insensitive search
    const normalizedEmail = email.toLowerCase();

    // Check if user exists
    let user = await User.findOne({ where: { email: normalizedEmail } });

    // If user doesn't exist, create a new one
    if (!user) {
      try {
        user = await User.create({
          email: normalizedEmail,
          name: normalizedEmail.split('@')[0], 
          isAdmin: false,
          active: true
        });
      } catch (createError) {
        logger.error('Error creating user:', createError);
        return res.status(500).json({ message: 'Error creating user' });
      }
    }

    if (!user) {
      return res.status(500).json({ message: 'Failed to create or find user' });
    }

    // Generate token and expiry
    const token = generateMagicLinkToken();
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 15); // 15 minutes expiry

    // Update user with magic link details
    try {
      await user.update({
        magicLinkToken: token,
        magicLinkExpiry: expiryTime,
      });
    } catch (updateError) {
      logger.error('Error updating user with magic link:', updateError);
      return res.status(500).json({ message: 'Error generating magic link' });
    }

    // Generate magic link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const magicLink = `${frontendUrl}/auth/verify?token=${token}`;

    try {
      // Send magic link email
      const userEmail = user.get('email') as string;
      const userName = user.get('name') || 'User';
      
      if (!userEmail) {
        throw new Error('User email is undefined');
      }
      
      await sendMagicLink(userEmail, userName as string, magicLink);
      logger.info(`Magic link sent to ${userEmail}`);
      return res.status(200).json({ message: 'Magic link sent successfully' });
    } catch (emailError) {
      // If email sending fails, clear the token
      await user.update({
        magicLinkToken: undefined,
        magicLinkExpiry: undefined,
      });
      logger.error('Error sending magic link email:', emailError);
      return res
        .status(500)
        .json({ message: 'Error sending magic link email' });
    }
  } catch (error) {
    logger.error('Error in requestMagicLink:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get current user profile
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const userId = req.user.userId;

    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'name', 'isAdmin', 'lastLogin', 'createdAt'],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      user: {
        ...user.toJSON(),
        isAdmin: Boolean(user.get('isAdmin')),
      },
    });
  } catch (error) {
    logger.error('Error getting current user:', error);
    next(error);
  }
};

// Update user profile
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const userId = req.user.userId;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ name });

    return res.status(200).json({
      user: {
        id: user.get('id'),
        email: user.get('email'),
        name: user.get('name'),
        isAdmin: user.get('isAdmin'),
      },
    });
  } catch (error) {
    logger.error('Error updating profile:', error);
    next(error);
  }
};
