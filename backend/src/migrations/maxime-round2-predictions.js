'use strict';

/** @type {import('sequelize-cli').Migration} */
/* global setTimeout, console, module */
module.exports = {
  async up(queryInterface, Sequelize) {
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Console styling helpers
    const colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      dim: '\x1b[2m',
      underscore: '\x1b[4m',
      blink: '\x1b[5m',
      reverse: '\x1b[7m',
      hidden: '\x1b[8m',
      
      black: '\x1b[30m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      white: '\x1b[37m',
      
      bgBlack: '\x1b[40m',
      bgRed: '\x1b[41m',
      bgGreen: '\x1b[42m',
      bgYellow: '\x1b[43m',
      bgBlue: '\x1b[44m',
      bgMagenta: '\x1b[45m',
      bgCyan: '\x1b[46m',
      bgWhite: '\x1b[47m'
    };
    
    // Logging functions
    const logger = {
      info: (message) => {
        const timestamp = new Date().toISOString();
        console.log(`${colors.dim}[${timestamp}]${colors.reset} ${colors.blue}INFO${colors.reset}: ${message}`);
      },
      success: (message) => {
        const timestamp = new Date().toISOString();
        console.log(`${colors.dim}[${timestamp}]${colors.reset} ${colors.green}SUCCESS${colors.reset}: ${message}`);
      },
      warn: (message) => {
        const timestamp = new Date().toISOString();
        console.log(`${colors.dim}[${timestamp}]${colors.reset} ${colors.yellow}WARNING${colors.reset}: ${message}`);
      },
      error: (message, error) => {
        const timestamp = new Date().toISOString();
        console.error(`${colors.dim}[${timestamp}]${colors.reset} ${colors.red}ERROR${colors.reset}: ${message}`);
        if (error) {
          console.error(`${colors.dim}[${timestamp}]${colors.reset} ${colors.red}STACK${colors.reset}: ${error.stack || error}`);
        }
      },
      section: (title) => {
        const line = '═'.repeat(100);
        console.log(`\n${colors.cyan}${line}${colors.reset}`);
        console.log(`${colors.cyan}${colors.bright}${title}${colors.reset}`);
        console.log(`${colors.cyan}${line}${colors.reset}\n`);
      },
      subsection: (title) => {
        const line = '─'.repeat(80);
        console.log(`\n${colors.magenta}${line}${colors.reset}`);
        console.log(`${colors.magenta}${title}${colors.reset}`);
        console.log(`${colors.magenta}${line}${colors.reset}\n`);
      },
      operation: (operation) => {
        console.log(`${colors.yellow}▶ ${colors.reset}${operation}`);
      },
      result: (result) => {
        console.log(`  ${colors.green}✓ ${colors.reset}${result}`);
      }
    };
    
    logger.section('MAXIME ROUND 2 PREDICTIONS UPDATE MIGRATION');
    logger.info('Starting migration...');
    await sleep(1000);

    // Helper function to get team ID by short name
    async function getTeamIdByShortName(shortName) {
      logger.operation(`Looking up team ID for: ${colors.cyan}${shortName}${colors.reset}`);
      const result = await queryInterface.sequelize.query(
        `SELECT id FROM teams WHERE "shortName" = :shortName`,
        {
          replacements: { shortName },
          type: Sequelize.QueryTypes.SELECT,
        }
      );
      if (!result[0]) {
        const error = new Error(`Team with short name ${shortName} not found`);
        logger.error(`Team not found: ${shortName}`, error);
        throw error;
      }
      logger.result(`Found team ID: ${result[0].id}`);
      return result[0].id;
    }

    // Helper function to get user ID by email
    async function getUserIdByEmail(email) {
      logger.operation(`Looking up user ID for: ${colors.cyan}${email}${colors.reset}`);
      const result = await queryInterface.sequelize.query(
        `SELECT id FROM users WHERE email = :email`,
        {
          replacements: { email },
          type: Sequelize.QueryTypes.SELECT,
        }
      );
      if (!result[0]) {
        const error = new Error(`User with email ${email} not found`);
        logger.error(`User not found: ${email}`, error);
        throw error;
      }
      logger.result(`Found user ID: ${result[0].id}`);
      return result[0].id;
    }

    // Helper function to get series ID between teams in a specific round
    async function getSeriesIdByTeamsInRound(team1ShortName, team2ShortName, roundNumber) {
      logger.operation(`Looking up series ID for: ${colors.cyan}${team1ShortName}${colors.reset} vs ${colors.cyan}${team2ShortName}${colors.reset} in round ${colors.bright}${roundNumber}${colors.reset}`);
      const team1Id = await getTeamIdByShortName(team1ShortName);
      const team2Id = await getTeamIdByShortName(team2ShortName);
      
      // First get the round ID
      logger.operation(`Looking up round ID for round number: ${roundNumber}`);
      const roundResult = await queryInterface.sequelize.query(
        `SELECT id FROM rounds WHERE number = :roundNumber`,
        {
          replacements: { roundNumber },
          type: Sequelize.QueryTypes.SELECT,
        }
      );
      
      if (!roundResult[0]) {
        const error = new Error(`Round with number ${roundNumber} not found`);
        logger.error(`Round not found: ${roundNumber}`, error);
        throw error;
      }
      logger.result(`Found round ID: ${roundResult[0].id}`);
      
      const roundId = roundResult[0].id;
      
      // Then get the series ID using the round ID and team IDs
      const result = await queryInterface.sequelize.query(
        `SELECT id FROM series 
         WHERE "roundId" = :roundId 
         AND (("homeTeamId" = :team1Id AND "awayTeamId" = :team2Id) 
              OR ("homeTeamId" = :team2Id AND "awayTeamId" = :team1Id))`,
        {
          replacements: { roundId, team1Id, team2Id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );
      
      if (!result[0]) {
        const error = new Error(`Series between ${team1ShortName} and ${team2ShortName} in round ${roundNumber} not found`);
        logger.error(`Series not found: ${team1ShortName} vs ${team2ShortName} in round ${roundNumber}`, error);
        throw error;
      }
      logger.result(`Found series ID: ${result[0].id}`);
      
      return result[0].id;
    }

    // Helper function to create or update a prediction
    async function createOrUpdatePrediction(userId, seriesId, predictedWinnerShortName, predictedGames) {
      logger.operation(`Creating/updating prediction for user ${userId}, series ${seriesId}, winner: ${colors.cyan}${predictedWinnerShortName}${colors.reset} in ${colors.bright}${predictedGames}${colors.reset} games`);
      const predictedWinnerId = await getTeamIdByShortName(predictedWinnerShortName);
      
      // Check if prediction already exists
      const existingPrediction = await queryInterface.sequelize.query(
        `SELECT id FROM predictions WHERE "userId" = :userId AND "seriesId" = :seriesId`,
        {
          replacements: { userId, seriesId },
          type: Sequelize.QueryTypes.SELECT,
        }
      );
      
      if (existingPrediction[0]) {
        // Update existing prediction
        logger.info(`Updating existing prediction ID: ${existingPrediction[0].id}`);
        await queryInterface.sequelize.query(
          `UPDATE predictions 
           SET "predictedWinnerId" = :predictedWinnerId, 
               "predictedGames" = :predictedGames,
               "updatedAt" = CURRENT_TIMESTAMP
           WHERE "userId" = :userId AND "seriesId" = :seriesId`,
          {
            replacements: { 
              userId,
              seriesId,
              predictedWinnerId,
              predictedGames
            },
            type: Sequelize.QueryTypes.UPDATE,
          }
        );
        logger.result(`Updated prediction successfully`);
      } else {
        // Create new prediction
        logger.info('Creating new prediction');
        await queryInterface.sequelize.query(
          `INSERT INTO predictions ("userId", "seriesId", "predictedWinnerId", "predictedGames", "points", "createdAt", "updatedAt")
           VALUES (:userId, :seriesId, :predictedWinnerId, :predictedGames, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          {
            replacements: { 
              userId,
              seriesId,
              predictedWinnerId,
              predictedGames
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        logger.result(`Created new prediction successfully`);
      }
      
      await sleep(100);
    }

    try {
      // Maxime's predictions for round 2
      logger.subsection('MAXIME\'S UPDATED ROUND 2 PREDICTIONS');
      const maximeId = await getUserIdByEmail('max.lepine@outlook.com');
      
      // Maxime: WPG in 6 vs DAL
      await createOrUpdatePrediction(
        maximeId, 
        await getSeriesIdByTeamsInRound('WPG', 'DAL', 2), 
        'WPG', 
        6
      );
      
      // Maxime: VGK in 5 vs EDM
      await createOrUpdatePrediction(
        maximeId, 
        await getSeriesIdByTeamsInRound('VGK', 'EDM', 2), 
        'VGK', 
        5
      );
      
      // Maxime: CAR in 7 vs WAS
      await createOrUpdatePrediction(
        maximeId, 
        await getSeriesIdByTeamsInRound('CAR', 'WSH', 2), 
        'CAR', 
        7
      );
      
      logger.success('Maxime\'s updated round 2 predictions added successfully.');
      
      logger.section('MIGRATION COMPLETED SUCCESSFULLY');
    } catch (error) {
      logger.error('Migration failed', error);
      throw error;
    }
  },
  async down() { 
    // Parameters are required by Sequelize migration specification
    console.log('\x1b[33m%s\x1b[0m', '⚠️ No downgrade actions needed for Maxime\'s round 2 predictions update.');
  }
}; 