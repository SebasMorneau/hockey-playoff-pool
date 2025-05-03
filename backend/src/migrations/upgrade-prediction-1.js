'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    console.log('Starting prediction update migration...');
    await sleep(1000);

    // Helper function to get team ID by short name
    async function getTeamIdByShortName(shortName) {
      const result = await queryInterface.sequelize.query(
        `SELECT id FROM teams WHERE "shortName" = :shortName`,
        {
          replacements: { shortName },
          type: Sequelize.QueryTypes.SELECT,
        }
      );
      if (!result[0]) {
        throw new Error(`Team with short name ${shortName} not found`);
      }
      return result[0].id;
    }

    // Helper function to get user ID by email
    async function getUserIdByEmail(email) {
      const result = await queryInterface.sequelize.query(
        `SELECT id FROM users WHERE email = :email`,
        {
          replacements: { email },
          type: Sequelize.QueryTypes.SELECT,
        }
      );
      if (!result[0]) {
        throw new Error(`User with email ${email} not found`);
      }
      return result[0].id;
    }

    // Helper function to get series ID by team names
    async function getSeriesIdByTeamNames(homeTeamShortName, awayTeamShortName) {
      const homeTeamId = await getTeamIdByShortName(homeTeamShortName);
      const awayTeamId = await getTeamIdByShortName(awayTeamShortName);
      
      const result = await queryInterface.sequelize.query(
        `SELECT id FROM series WHERE ("homeTeamId" = :homeTeamId AND "awayTeamId" = :awayTeamId) OR ("homeTeamId" = :awayTeamId AND "awayTeamId" = :homeTeamId)`,
        {
          replacements: { homeTeamId, awayTeamId },
          type: Sequelize.QueryTypes.SELECT,
        }
      );
      if (!result[0]) {
        throw new Error(`Series with teams ${homeTeamShortName} and ${awayTeamShortName} not found`);
      }
      return result[0].id;
    }

    // Helper function to update a prediction
    async function updatePrediction(userId, seriesId, predictedWinnerShortName, predictedGames) {
      console.log(`Updating prediction for user ${userId}, series ${seriesId}...`);
      const predictedWinnerId = await getTeamIdByShortName(predictedWinnerShortName);
      
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
      
      await sleep(100);
    }

    // Helper function to update a Stanley Cup prediction
    async function updateStanleyCupPrediction(userId, eastTeamShortName, westTeamShortName, winningTeamShortName, gamesPlayed) {
      console.log(`Updating Stanley Cup prediction for user ${userId}...`);
      const eastTeamId = await getTeamIdByShortName(eastTeamShortName);
      const westTeamId = await getTeamIdByShortName(westTeamShortName);
      const winningTeamId = await getTeamIdByShortName(winningTeamShortName);
      
      await queryInterface.sequelize.query(
        `UPDATE stanley_cup_predictions 
         SET "eastTeamId" = :eastTeamId, 
             "westTeamId" = :westTeamId,
             "winningTeamId" = :winningTeamId,
             "gamesPlayed" = :gamesPlayed,
             "updatedAt" = CURRENT_TIMESTAMP
         WHERE "userId" = :userId AND "season" = '2024-2025'`,
        {
          replacements: { 
            userId,
            eastTeamId,
            westTeamId,
            winningTeamId,
            gamesPlayed
          },
          type: Sequelize.QueryTypes.UPDATE,
        }
      );
      
      await sleep(100);
    }

    // Update predictions for each user
    console.log('Updating predictions for users...');

    // 1. Sebastien Morneau's predictions
    const sebastienId = await getUserIdByEmail('morneausebastien@gmail.com');
    await updatePrediction(sebastienId, await getSeriesIdByTeamNames('WPG', 'STL'), 'WPG', 5);
    await updatePrediction(sebastienId, await getSeriesIdByTeamNames('DAL', 'COL'), 'DAL', 5);
    await updatePrediction(sebastienId, await getSeriesIdByTeamNames('VGK', 'MIN'), 'MIN', 7);
    await updatePrediction(sebastienId, await getSeriesIdByTeamNames('LAK', 'EDM'), 'LAK', 7);
    await updatePrediction(sebastienId, await getSeriesIdByTeamNames('TOR', 'OTT'), 'OTT', 6);
    await updatePrediction(sebastienId, await getSeriesIdByTeamNames('FLA', 'TBL'), 'FLA', 5);
    await updatePrediction(sebastienId, await getSeriesIdByTeamNames('MTL', 'WSH'), 'WSH', 4);
    await updatePrediction(sebastienId, await getSeriesIdByTeamNames('NJD', 'CAR'), 'CAR', 5);
    await updateStanleyCupPrediction(sebastienId, 'CAR', 'DAL', 'DAL', 5);

    // 2. Mathieu Gravel's predictions
    const mathieuId = await getUserIdByEmail('mathieu.gravel.2@gmail.com');
    await updatePrediction(mathieuId, await getSeriesIdByTeamNames('WPG', 'STL'), 'WPG', 5);
    await updatePrediction(mathieuId, await getSeriesIdByTeamNames('DAL', 'COL'), 'COL', 7);
    await updatePrediction(mathieuId, await getSeriesIdByTeamNames('VGK', 'MIN'), 'MIN', 6);
    await updatePrediction(mathieuId, await getSeriesIdByTeamNames('LAK', 'EDM'), 'EDM', 6);
    await updatePrediction(mathieuId, await getSeriesIdByTeamNames('TOR', 'OTT'), 'OTT', 4);
    await updatePrediction(mathieuId, await getSeriesIdByTeamNames('FLA', 'TBL'), 'FLA', 7);
    await updatePrediction(mathieuId, await getSeriesIdByTeamNames('MTL', 'WSH'), 'MTL', 6);
    await updatePrediction(mathieuId, await getSeriesIdByTeamNames('NJD', 'CAR'), 'CAR', 7);
    await updateStanleyCupPrediction(mathieuId, 'OTT', 'WPG', 'WPG', 7);

    // 3. Eric Chalut's predictions
    const ericId = await getUserIdByEmail('ericchalut89@gmail.com');
    await updatePrediction(ericId, await getSeriesIdByTeamNames('WPG', 'STL'), 'WPG', 6);
    await updatePrediction(ericId, await getSeriesIdByTeamNames('DAL', 'COL'), 'DAL', 6);
    await updatePrediction(ericId, await getSeriesIdByTeamNames('VGK', 'MIN'), 'VGK', 5);
    await updatePrediction(ericId, await getSeriesIdByTeamNames('LAK', 'EDM'), 'EDM', 5);
    await updatePrediction(ericId, await getSeriesIdByTeamNames('TOR', 'OTT'), 'OTT', 7);
    await updatePrediction(ericId, await getSeriesIdByTeamNames('FLA', 'TBL'), 'TBL', 6);
    await updatePrediction(ericId, await getSeriesIdByTeamNames('MTL', 'WSH'), 'WSH', 5);
    await updatePrediction(ericId, await getSeriesIdByTeamNames('NJD', 'CAR'), 'NJD', 7);
    await updateStanleyCupPrediction(ericId, 'NJD', 'DAL', 'DAL', 7);

    // 4. Elizabeth Picard's predictions
    const elizabethId = await getUserIdByEmail('elipicard27@gmail.com');
    await updatePrediction(elizabethId, await getSeriesIdByTeamNames('WPG', 'STL'), 'WPG', 5);
    await updatePrediction(elizabethId, await getSeriesIdByTeamNames('DAL', 'COL'), 'COL', 6);
    await updatePrediction(elizabethId, await getSeriesIdByTeamNames('VGK', 'MIN'), 'VGK', 5);
    await updatePrediction(elizabethId, await getSeriesIdByTeamNames('LAK', 'EDM'), 'EDM', 7);
    await updatePrediction(elizabethId, await getSeriesIdByTeamNames('TOR', 'OTT'), 'OTT', 7);
    await updatePrediction(elizabethId, await getSeriesIdByTeamNames('FLA', 'TBL'), 'FLA', 6);
    await updatePrediction(elizabethId, await getSeriesIdByTeamNames('MTL', 'WSH'), 'MTL', 7);
    await updatePrediction(elizabethId, await getSeriesIdByTeamNames('NJD', 'CAR'), 'CAR', 6);
    await updateStanleyCupPrediction(elizabethId, 'FLA', 'WPG', 'WPG', 6);

    // 5. Maxime Lépine's predictions
    const maxId = await getUserIdByEmail('max.lepine@outlook.com');
    await updatePrediction(maxId, await getSeriesIdByTeamNames('WPG', 'STL'), 'WPG', 7);
    await updatePrediction(maxId, await getSeriesIdByTeamNames('DAL', 'COL'), 'COL', 5);
    await updatePrediction(maxId, await getSeriesIdByTeamNames('VGK', 'MIN'), 'VGK', 5);
    await updatePrediction(maxId, await getSeriesIdByTeamNames('LAK', 'EDM'), 'LAK', 7);
    await updatePrediction(maxId, await getSeriesIdByTeamNames('TOR', 'OTT'), 'TOR', 6);
    await updatePrediction(maxId, await getSeriesIdByTeamNames('FLA', 'TBL'), 'FLA', 6);
    await updatePrediction(maxId, await getSeriesIdByTeamNames('MTL', 'WSH'), 'MTL', 7);
    await updatePrediction(maxId, await getSeriesIdByTeamNames('NJD', 'CAR'), 'CAR', 6);
    await updateStanleyCupPrediction(maxId, 'TOR', 'WPG', 'WPG', 6);

    // 6. Jonathan Picard's predictions
    const jonathanId = await getUserIdByEmail('johabsjo@hotmail.com');
    await updatePrediction(jonathanId, await getSeriesIdByTeamNames('WPG', 'STL'), 'WPG', 7);
    await updatePrediction(jonathanId, await getSeriesIdByTeamNames('DAL', 'COL'), 'COL', 5);
    await updatePrediction(jonathanId, await getSeriesIdByTeamNames('VGK', 'MIN'), 'VGK', 5);
    await updatePrediction(jonathanId, await getSeriesIdByTeamNames('LAK', 'EDM'), 'LAK', 7);
    await updatePrediction(jonathanId, await getSeriesIdByTeamNames('TOR', 'OTT'), 'TOR', 6);
    await updatePrediction(jonathanId, await getSeriesIdByTeamNames('FLA', 'TBL'), 'FLA', 6);
    await updatePrediction(jonathanId, await getSeriesIdByTeamNames('MTL', 'WSH'), 'MTL', 7);
    await updatePrediction(jonathanId, await getSeriesIdByTeamNames('NJD', 'CAR'), 'CAR', 6);
    await updateStanleyCupPrediction(jonathanId, 'TOR', 'WPG', 'WPG', 6);

    // 7. Alexandre Bourgeois's predictions
    const alexId = await getUserIdByEmail('bourgalex27@gmail.com');
    await updatePrediction(alexId, await getSeriesIdByTeamNames('WPG', 'STL'), 'WPG', 7);
    await updatePrediction(alexId, await getSeriesIdByTeamNames('DAL', 'COL'), 'COL', 7);
    await updatePrediction(alexId, await getSeriesIdByTeamNames('VGK', 'MIN'), 'MIN', 6);
    await updatePrediction(alexId, await getSeriesIdByTeamNames('LAK', 'EDM'), 'EDM', 5);
    await updatePrediction(alexId, await getSeriesIdByTeamNames('TOR', 'OTT'), 'TOR', 6);
    await updatePrediction(alexId, await getSeriesIdByTeamNames('FLA', 'TBL'), 'FLA', 6);
    await updatePrediction(alexId, await getSeriesIdByTeamNames('MTL', 'WSH'), 'MTL', 7);
    await updatePrediction(alexId, await getSeriesIdByTeamNames('NJD', 'CAR'), 'NJD', 7);
    await updateStanleyCupPrediction(alexId, 'FLA', 'COL', 'COL', 6);

    // 8. Sidi Moh Ben Bouchta's predictions
    const mohId = await getUserIdByEmail('smbenbouchta@gmail.com');
    await updatePrediction(mohId, await getSeriesIdByTeamNames('WPG', 'STL'), 'WPG', 7);
    await updatePrediction(mohId, await getSeriesIdByTeamNames('DAL', 'COL'), 'DAL', 4);
    await updatePrediction(mohId, await getSeriesIdByTeamNames('VGK', 'MIN'), 'VGK', 7);
    await updatePrediction(mohId, await getSeriesIdByTeamNames('LAK', 'EDM'), 'EDM', 4);
    await updatePrediction(mohId, await getSeriesIdByTeamNames('TOR', 'OTT'), 'TOR', 6);
    await updatePrediction(mohId, await getSeriesIdByTeamNames('FLA', 'TBL'), 'FLA', 6);
    await updatePrediction(mohId, await getSeriesIdByTeamNames('MTL', 'WSH'), 'MTL', 5);
    await updatePrediction(mohId, await getSeriesIdByTeamNames('NJD', 'CAR'), 'NJD', 7);
    await updateStanleyCupPrediction(mohId, 'MTL', 'EDM', 'EDM', 6);

    console.log('Migration completed successfully!');
  },

  async down(queryInterface, Sequelize) {
    console.log('No rollback operation available for this migration');
  }
};