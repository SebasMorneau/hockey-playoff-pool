'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    console.log('Starting migration...');
    await sleep(1000);

    // Delete existing tables in correct order
    console.log('Deleting existing tables...');
    try {
      await queryInterface.dropTable('stanley_cup_predictions');
      console.log('Deleted stanley_cup_predictions table');
    } catch (error) {
      console.log('No stanley_cup_predictions table to delete');
    }
    await sleep(1000);

    try {
      await queryInterface.dropTable('predictions');
      console.log('Deleted predictions table');
    } catch (error) {
      console.log('No predictions table to delete');
    }
    await sleep(1000);

    try {
      await queryInterface.dropTable('series');
      console.log('Deleted series table');
    } catch (error) {
      console.log('No series table to delete');
    }
    await sleep(1000);

    try {
      await queryInterface.dropTable('rounds');
      console.log('Deleted rounds table');
    } catch (error) {
      console.log('No rounds table to delete');
    }
    await sleep(1000);

    try {
      await queryInterface.dropTable('teams');
      console.log('Deleted teams table');
    } catch (error) {
      console.log('No teams table to delete');
    }
    await sleep(1000);

    try {
      await queryInterface.dropTable('users');
      console.log('Deleted users table');
    } catch (error) {
      console.log('No users table to delete');
    }
    await sleep(1000);

    // Create users table
    console.log('Creating users table...');
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      isAdmin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      magicLinkToken: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      magicLinkExpiry: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      lastLogin: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    }).catch(error => {
      if (error.name === 'SequelizeUniqueConstraintError') {
        console.log('Users table already exists, skipping...');
      } else {
        throw error;
      }
    });
    await sleep(1000);

    // Create teams table
    console.log('Creating teams table...');
    await queryInterface.createTable('teams', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      shortName: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      conference: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      division: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      logoUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    }).catch(error => {
      if (error.name === 'SequelizeUniqueConstraintError') {
        console.log('Teams table already exists, skipping...');
      } else {
        throw error;
      }
    });
    await sleep(1000);

    // Create rounds table
    console.log('Creating rounds table...');
    await queryInterface.createTable('rounds', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      season: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    }).catch(error => {
      if (error.name === 'SequelizeUniqueConstraintError') {
        console.log('Rounds table already exists, skipping...');
      } else {
        throw error;
      }
    });
    await sleep(1000);

    // Create series table
    console.log('Creating series table...');
    await queryInterface.createTable('series', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      roundId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'rounds',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      homeTeamId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      awayTeamId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      winningTeamId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'teams',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      homeTeamWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      awayTeamWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      gamesPlayed: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      completed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    }).catch(error => {
      if (error.name === 'SequelizeUniqueConstraintError') {
        console.log('Series table already exists, skipping...');
      } else {
        throw error;
      }
    });
    await sleep(1000);

    // Create predictions table
    console.log('Creating predictions table...');
    await queryInterface.createTable('predictions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      seriesId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'series',
          key: 'id',
        },
      },
      predictedWinnerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'id',
        },
      },
      predictedGames: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      points: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    }).catch(error => {
      if (error.name === 'SequelizeUniqueConstraintError') {
        console.log('Predictions table already exists, skipping...');
      } else {
        throw error;
      }
    });
    await sleep(1000);

    // Create stanley_cup_predictions table
    console.log('Creating stanley cup predictions table...');
    await queryInterface.createTable('stanley_cup_predictions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      season: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      eastTeamId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'id',
        },
      },
      westTeamId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'id',
        },
      },
      winningTeamId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'id',
        },
      },
      gamesPlayed: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      points: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    }).catch(error => {
      if (error.name === 'SequelizeUniqueConstraintError') {
        console.log('Stanley cup predictions table already exists, skipping...');
      } else {
        throw error;
      }
    });
    await sleep(1000);

    // Insert teams
    console.log('Inserting teams...');
    const teams = [
      // Western Conference
      {
        name: 'Winnipeg Jets',
        shortName: 'WPG',
        conference: 'Western',
        division: 'Central',
        logoUrl: '/logos/winnipeg.png',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'St. Louis Blues',
        shortName: 'STL',
        conference: 'Western',
        division: 'Central',
        logoUrl: '/logos/st-louis.png',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Dallas Stars',
        shortName: 'DAL',
        conference: 'Western',
        division: 'Central',
        logoUrl: '/logos/dallas.png',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Colorado Avalanche',
        shortName: 'COL',
        conference: 'Western',
        division: 'Central',
        logoUrl: '/logos/colorado.png',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Vegas Golden Knights',
        shortName: 'VGK',
        conference: 'Western',
        division: 'Pacific',
        logoUrl: '/logos/vegas.png',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Minnesota Wild',
        shortName: 'MIN',
        conference: 'Western',
        division: 'Central',
        logoUrl: '/logos/minessota.png',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Los Angeles Kings',
        shortName: 'LAK',
        conference: 'Western',
        division: 'Pacific',
        logoUrl: '/logos/los-angeles.png',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Edmonton Oilers',
        shortName: 'EDM',
        conference: 'Western',
        division: 'Pacific',
        logoUrl: '/logos/edmonton.png',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Eastern Conference
      {
        name: 'Washington Capitals',
        shortName: 'WSH',
        conference: 'Eastern',
        division: 'Metropolitan',
        logoUrl: '/logos/washington.png',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Montreal Canadiens',
        shortName: 'MTL',
        conference: 'Eastern',
        division: 'Atlantic',
        logoUrl: '/logos/montreal.png',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Toronto Maple Leafs',
        shortName: 'TOR',
        conference: 'Eastern',
        division: 'Atlantic',
        logoUrl: '/logos/toronto.png',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Ottawa Senators',
        shortName: 'OTT',
        conference: 'Eastern',
        division: 'Atlantic',
        logoUrl: '/logos/ottawa.png',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Florida Panthers',
        shortName: 'FLA',
        conference: 'Eastern',
        division: 'Atlantic',
        logoUrl: '/logos/florida.png',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Tampa Bay Lightning',
        shortName: 'TBL',
        conference: 'Eastern',
        division: 'Atlantic',
        logoUrl: '/logos/tampa-bay.png',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Carolina Hurricanes',
        shortName: 'CAR',
        conference: 'Eastern',
        division: 'Metropolitan',
        logoUrl: '/logos/caroline.png',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'New Jersey Devils',
        shortName: 'NJD',
        conference: 'Eastern',
        division: 'Metropolitan',
        logoUrl: '/logos/new-jersey.png',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    try {
      await queryInterface.bulkInsert('teams', teams);
      console.log('Teams inserted successfully');
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        console.log('Teams already exist, skipping...');
      } else {
        throw error;
      }
    }
    await sleep(1000);

    // Create initial playoff rounds for 2024-2025 season
    console.log('Creating playoff rounds...');
    const rounds = [
      {
        name: 'First Round',
        number: 1,
        season: '2024-2025',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Second Round',
        number: 2,
        season: '2024-2025',
        active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Conference Finals',
        number: 3,
        season: '2024-2025',
        active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Stanley Cup Final',
        number: 4,
        season: '2024-2025',
        active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    try {
      await queryInterface.bulkInsert('rounds', rounds);
      console.log('Rounds inserted successfully');
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        console.log('Rounds already exist, skipping...');
      } else {
        throw error;
      }
    }
    await sleep(1000);

    // Get the first round ID for seeding initial series
    console.log('Getting first round ID...');
    const firstRoundResult = await queryInterface.sequelize.query(
      `SELECT id FROM rounds WHERE name = 'First Round' AND season = '2024-2025'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (!firstRoundResult || firstRoundResult.length === 0) {
      throw new Error('First round not found');
    }
    const firstRoundId = firstRoundResult[0].id;
    await sleep(1000);

    // Get team IDs
    const teamList = await queryInterface.sequelize.query(
      'SELECT id, "shortName" FROM teams',
      {
        type: queryInterface.sequelize.QueryTypes.SELECT,
      }
    );

    const teamMap = teamList.reduce((acc, team) => {
      acc[team.shortName] = team.id;
      return acc;
    }, {});

    // First round series
    const series = [
      {
        roundId: firstRoundId,
        homeTeamId: teamMap['DAL'],
        awayTeamId: teamMap['COL'],
        homeTeamWins: 0,
        awayTeamWins: 0,
        gamesPlayed: 0,
        completed: false,
        startDate: new Date('2024-04-19'),
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        roundId: firstRoundId,
        homeTeamId: teamMap['LAK'],
        awayTeamId: teamMap['EDM'],
        homeTeamWins: 0,
        awayTeamWins: 0,
        gamesPlayed: 0,
        completed: false,
        startDate: new Date('2024-04-20'),
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        roundId: firstRoundId,
        homeTeamId: teamMap['FLA'],
        awayTeamId: teamMap['TBL'],
        homeTeamWins: 0,
        awayTeamWins: 0,
        gamesPlayed: 0,
        completed: false,
        startDate: new Date('2024-04-20'),
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        roundId: firstRoundId,
        homeTeamId: teamMap['MTL'],
        awayTeamId: teamMap['WSH'],
        homeTeamWins: 0,
        awayTeamWins: 0,
        gamesPlayed: 0,
        completed: false,
        startDate: new Date('2024-04-21'),
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        roundId: firstRoundId,
        homeTeamId: teamMap['NJD'],
        awayTeamId: teamMap['CAR'],
        homeTeamWins: 0,
        awayTeamWins: 0,
        gamesPlayed: 0,
        completed: false,
        startDate: new Date('2024-04-21'),
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        roundId: firstRoundId,
        homeTeamId: teamMap['TOR'],
        awayTeamId: teamMap['OTT'],
        homeTeamWins: 0,
        awayTeamWins: 0,
        gamesPlayed: 0,
        completed: false,
        startDate: new Date('2024-04-22'),
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        roundId: firstRoundId,
        homeTeamId: teamMap['VGK'],
        awayTeamId: teamMap['MIN'],
        homeTeamWins: 0,
        awayTeamWins: 0,
        gamesPlayed: 0,
        completed: false,
        startDate: new Date('2024-04-22'),
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        roundId: firstRoundId,
        homeTeamId: teamMap['WPG'],
        awayTeamId: teamMap['STL'],
        homeTeamWins: 0,
        awayTeamWins: 0,
        gamesPlayed: 0,
        completed: false,
        startDate: new Date('2024-04-23'),
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await queryInterface.bulkInsert('series', series);
    console.log('Series inserted successfully');

    // Add users
    console.log('Adding users...');
    const users = [
      {
        email: 'ericchalut89@gmail.com',
        name: 'Eric Chalut',
        isAdmin: false,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'elipicard27@gmail.com',
        name: 'Elizabeth Picard',
        isAdmin: false,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'bourgalex27@gmail.com',
        name: 'Alexandre Bourgeois',
        isAdmin: false,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'max.lepine@outlook.com',
        name: 'Maxime Lépine',
        isAdmin: false,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'johabsjo@hotmail.com',
        name: 'Jonathan Picard',
        isAdmin: false,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'mathieu.gravel.2@gmail.com',
        name: 'Mathieu Gravel',
        isAdmin: false,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'smbenbouchta@gmail.com',
        name: 'Sidi Moh Ben Bouchta',
        isAdmin: false,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'morneausebastien@gmail.com',
        name: 'Sebastien Morneau',
        isAdmin: true,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    try {
      await queryInterface.bulkInsert('users', users);
      console.log('Users inserted successfully');
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        console.log('Users already exist, skipping...');
      } else {
        throw error;
      }
    }
    await sleep(1000);

    // Get user IDs
    console.log('Getting user IDs...');
    const userIds = {};
    for (const user of users) {
      const result = await queryInterface.sequelize.query(
        `SELECT id FROM users WHERE email = :email`,
        {
          replacements: { email: user.email },
          type: Sequelize.QueryTypes.SELECT,
        }
      );
      if (!result[0]) {
        throw new Error(`User with email ${user.email} not found`);
      }
      userIds[user.email] = result[0].id;
    }
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

    // Helper function to create a prediction
    async function createPrediction(userId, seriesId, predictedWinnerShortName, predictedGames) {
      console.log(`Creating prediction for user ${userId}, series ${seriesId}...`);
      const predictedWinnerId = await getTeamIdByShortName(predictedWinnerShortName);
      
      try {
        await queryInterface.bulkInsert('predictions', [{
          userId,
          seriesId,
          predictedWinnerId,
          predictedGames,
          points: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }]);
      } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
          console.log(`Prediction already exists for user ${userId} and series ${seriesId}, skipping...`);
        } else {
          throw error;
        }
      }
      await sleep(100);
    }

    // Helper function to create a Stanley Cup prediction
    async function createStanleyCupPrediction(userId, eastTeamShortName, westTeamShortName, winningTeamShortName, gamesPlayed) {
      console.log(`Creating Stanley Cup prediction for user ${userId}...`);
      const eastTeamId = await getTeamIdByShortName(eastTeamShortName);
      const westTeamId = await getTeamIdByShortName(westTeamShortName);
      const winningTeamId = await getTeamIdByShortName(winningTeamShortName);
      
      try {
        await queryInterface.bulkInsert('stanley_cup_predictions', [{
          userId,
          season: '2024-2025',
          eastTeamId,
          westTeamId,
          winningTeamId,
          gamesPlayed,
          points: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }]);
      } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
          console.log(`Stanley Cup prediction already exists for user ${userId}, skipping...`);
        } else {
          throw error;
        }
      }
      await sleep(100);
    }

    // Add predictions for each user
    console.log('Adding predictions for users...');
    // 1. Eric Chalut's predictions
    const ericId = userIds['ericchalut89@gmail.com'];
    await createPrediction(ericId, await getSeriesIdByTeamNames('DAL', 'COL'), 'DAL', 6);
    await createPrediction(ericId, await getSeriesIdByTeamNames('LAK', 'EDM'), 'EDM', 5);
    await createPrediction(ericId, await getSeriesIdByTeamNames('FLA', 'TBL'), 'TBL', 6);
    await createPrediction(ericId, await getSeriesIdByTeamNames('MTL', 'WSH'), 'WSH', 5);
    await createPrediction(ericId, await getSeriesIdByTeamNames('NJD', 'CAR'), 'CAR', 5);
    await createPrediction(ericId, await getSeriesIdByTeamNames('TOR', 'OTT'), 'TOR', 5);
    await createPrediction(ericId, await getSeriesIdByTeamNames('VGK', 'MIN'), 'VGK', 6);
    await createPrediction(ericId, await getSeriesIdByTeamNames('WPG', 'STL'), 'WPG', 6);
    await createStanleyCupPrediction(ericId, 'CAR', 'DAL', 'DAL', 7);

    // 2. Elizabeth Picard's predictions
    const elizabethId = userIds['elipicard27@gmail.com'];
    await createPrediction(elizabethId, await getSeriesIdByTeamNames('DAL', 'COL'), 'DAL', 6);
    await createPrediction(elizabethId, await getSeriesIdByTeamNames('LAK', 'EDM'), 'EDM', 7);
    await createPrediction(elizabethId, await getSeriesIdByTeamNames('FLA', 'TBL'), 'FLA', 6);
    await createPrediction(elizabethId, await getSeriesIdByTeamNames('MTL', 'WSH'), 'MTL', 7);
    await createPrediction(elizabethId, await getSeriesIdByTeamNames('NJD', 'CAR'), 'CAR', 6);
    await createPrediction(elizabethId, await getSeriesIdByTeamNames('TOR', 'OTT'), 'TOR', 6);
    await createPrediction(elizabethId, await getSeriesIdByTeamNames('VGK', 'MIN'), 'VGK', 7);
    await createPrediction(elizabethId, await getSeriesIdByTeamNames('WPG', 'STL'), 'WPG', 5);
    await createStanleyCupPrediction(elizabethId, 'FLA', 'DAL', 'DAL', 6);

    // 3. Alexandre Bourgeois's predictions
    const alexId = userIds['bourgalex27@gmail.com'];
    await createPrediction(alexId, await getSeriesIdByTeamNames('DAL', 'COL'), 'COL', 6);
    await createPrediction(alexId, await getSeriesIdByTeamNames('LAK', 'EDM'), 'EDM', 5);
    await createPrediction(alexId, await getSeriesIdByTeamNames('FLA', 'TBL'), 'FLA', 6);
    await createPrediction(alexId, await getSeriesIdByTeamNames('MTL', 'WSH'), 'WSH', 6);
    await createPrediction(alexId, await getSeriesIdByTeamNames('NJD', 'CAR'), 'CAR', 7);
    await createPrediction(alexId, await getSeriesIdByTeamNames('TOR', 'OTT'), 'TOR', 6);
    await createPrediction(alexId, await getSeriesIdByTeamNames('VGK', 'MIN'), 'MIN', 7);
    await createPrediction(alexId, await getSeriesIdByTeamNames('WPG', 'STL'), 'WPG', 6);
    await createStanleyCupPrediction(alexId, 'FLA', 'COL', 'COL', 6);

    // 4. Maxime Lépine's predictions
    const maxId = userIds['max.lepine@outlook.com'];
    await createPrediction(maxId, await getSeriesIdByTeamNames('DAL', 'COL'), 'DAL', 7);
    await createPrediction(maxId, await getSeriesIdByTeamNames('LAK', 'EDM'), 'LAK', 7);
    await createPrediction(maxId, await getSeriesIdByTeamNames('FLA', 'TBL'), 'FLA', 6);
    await createPrediction(maxId, await getSeriesIdByTeamNames('MTL', 'WSH'), 'WSH', 4);
    await createPrediction(maxId, await getSeriesIdByTeamNames('NJD', 'CAR'), 'CAR', 6);
    await createPrediction(maxId, await getSeriesIdByTeamNames('TOR', 'OTT'), 'TOR', 6);
    await createPrediction(maxId, await getSeriesIdByTeamNames('VGK', 'MIN'), 'VGK', 5);
    await createPrediction(maxId, await getSeriesIdByTeamNames('WPG', 'STL'), 'WPG', 7);
    await createStanleyCupPrediction(maxId, 'TOR', 'DAL', 'DAL', 6);

    // 5. Jonathan Picard's predictions
    const jonathanId = userIds['johabsjo@hotmail.com'];
    await createPrediction(jonathanId, await getSeriesIdByTeamNames('DAL', 'COL'), 'COL', 6);
    await createPrediction(jonathanId, await getSeriesIdByTeamNames('LAK', 'EDM'), 'LAK', 6);
    await createPrediction(jonathanId, await getSeriesIdByTeamNames('FLA', 'TBL'), 'TBL', 6);
    await createPrediction(jonathanId, await getSeriesIdByTeamNames('MTL', 'WSH'), 'WSH', 5);
    await createPrediction(jonathanId, await getSeriesIdByTeamNames('NJD', 'CAR'), 'CAR', 6);
    await createPrediction(jonathanId, await getSeriesIdByTeamNames('TOR', 'OTT'), 'TOR', 5);
    await createPrediction(jonathanId, await getSeriesIdByTeamNames('VGK', 'MIN'), 'VGK', 6);
    await createPrediction(jonathanId, await getSeriesIdByTeamNames('WPG', 'STL'), 'STL', 7);
    await createStanleyCupPrediction(jonathanId, 'TBL', 'COL', 'COL', 6);

    // 6. Mathieu Gravel's predictions
    const mathieuId = userIds['mathieu.gravel.2@gmail.com'];
    await createPrediction(mathieuId, await getSeriesIdByTeamNames('DAL', 'COL'), 'DAL', 5);
    await createPrediction(mathieuId, await getSeriesIdByTeamNames('LAK', 'EDM'), 'EDM', 6);
    await createPrediction(mathieuId, await getSeriesIdByTeamNames('FLA', 'TBL'), 'FLA', 7);
    await createPrediction(mathieuId, await getSeriesIdByTeamNames('MTL', 'WSH'), 'MTL', 6);
    await createPrediction(mathieuId, await getSeriesIdByTeamNames('NJD', 'CAR'), 'CAR', 7);
    await createPrediction(mathieuId, await getSeriesIdByTeamNames('TOR', 'OTT'), 'TOR', 4);
    await createPrediction(mathieuId, await getSeriesIdByTeamNames('VGK', 'MIN'), 'VGK', 6);
    await createPrediction(mathieuId, await getSeriesIdByTeamNames('WPG', 'STL'), 'WPG', 5);
    await createStanleyCupPrediction(mathieuId, 'FLA', 'DAL', 'DAL', 7);

    // 7. Sidi Moh Ben Bouchta's predictions
    const mohId = userIds['smbenbouchta@gmail.com'];
    await createPrediction(mohId, await getSeriesIdByTeamNames('DAL', 'COL'), 'DAL', 7);
    await createPrediction(mohId, await getSeriesIdByTeamNames('LAK', 'EDM'), 'EDM', 4);
    await createPrediction(mohId, await getSeriesIdByTeamNames('FLA', 'TBL'), 'FLA', 6);
    await createPrediction(mohId, await getSeriesIdByTeamNames('MTL', 'WSH'), 'WSH', 4);
    await createPrediction(mohId, await getSeriesIdByTeamNames('NJD', 'CAR'), 'CAR', 7);
    await createPrediction(mohId, await getSeriesIdByTeamNames('TOR', 'OTT'), 'TOR', 6);
    await createPrediction(mohId, await getSeriesIdByTeamNames('VGK', 'MIN'), 'MIN', 7);
    await createPrediction(mohId, await getSeriesIdByTeamNames('WPG', 'STL'), 'WPG', 7);
    await createStanleyCupPrediction(mohId, 'CAR', 'EDM', 'EDM', 6);

    // 8. Sebastien Morneau's predictions
    const sebastienId = userIds['morneausebastien@gmail.com'];
    await createPrediction(sebastienId, await getSeriesIdByTeamNames('DAL', 'COL'), 'DAL', 5);
    await createPrediction(sebastienId, await getSeriesIdByTeamNames('LAK', 'EDM'), 'LAK', 7);
    await createPrediction(sebastienId, await getSeriesIdByTeamNames('FLA', 'TBL'), 'FLA', 5);
    await createPrediction(sebastienId, await getSeriesIdByTeamNames('MTL', 'WSH'), 'WSH', 4);
    await createPrediction(sebastienId, await getSeriesIdByTeamNames('NJD', 'CAR'), 'CAR', 5);
    await createPrediction(sebastienId, await getSeriesIdByTeamNames('TOR', 'OTT'), 'TOR', 6);
    await createPrediction(sebastienId, await getSeriesIdByTeamNames('VGK', 'MIN'), 'VGK', 6);
    await createPrediction(sebastienId, await getSeriesIdByTeamNames('WPG', 'STL'), 'WPG', 5);
    await createStanleyCupPrediction(sebastienId, 'CAR', 'DAL', 'DAL', 5);

    console.log('Migration completed successfully!');
  },

  async down(queryInterface, Sequelize) {
    console.log('Rolling back migration...');
    await queryInterface.dropTable('stanley_cup_predictions');
    await queryInterface.dropTable('predictions');
    await queryInterface.dropTable('series');
    await queryInterface.dropTable('rounds');
    await queryInterface.dropTable('teams');
    await queryInterface.dropTable('users');
    console.log('Rollback completed successfully!');
  }
}; 