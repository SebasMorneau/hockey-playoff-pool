import { Sequelize, DataTypes, Model, ModelAttributes, CreationOptional, Optional } from 'sequelize';
import dotenv from 'dotenv';
import { Config } from './config';
import { setupUserAssociations } from './user.model';
import { setupTeamAssociations } from './team.model';
import { setupRoundAssociations } from './round.model';
import { setupSeriesAssociations } from './series.model';
import { setupPredictionAssociations } from './prediction.model';
import { sequelize } from '../config/database';

dotenv.config();

// Define User model attributes interface
interface UserAttributes {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  active?: boolean;
  magicLinkToken?: string;
  magicLinkExpiry?: Date;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define User creation attributes to make id optional on creation
type UserCreationAttributes = Optional<UserAttributes, 'id'>;

// Define User model class
class User extends Model<UserAttributes, UserCreationAttributes> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare email: string;
  declare isAdmin: boolean;
  declare active: boolean;
  declare magicLinkToken?: string;
  declare magicLinkExpiry?: Date;
  declare lastLogin?: Date;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;

  // Associations
  declare readonly Predictions?: Prediction[];
}

// Define User model attributes
const userAttributes: ModelAttributes<User> = {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    get() {
      const rawValue = this.getDataValue('isAdmin') as boolean | number;
      return rawValue === 1 || rawValue === true;
    }
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  magicLinkToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  magicLinkExpiry: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lastLogin: {
    type: DataTypes.DATE,
  },
};

// Initialize User model
User.init(userAttributes, {
  sequelize,
  tableName: 'users',
  timestamps: true,
});

// Define Team model attributes interface
interface TeamAttributes {
  id: number;
  name: string;
  shortName: string;
  logoUrl: string;
  conference: string;
  division: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define Team creation attributes to make id optional on creation
export type TeamCreationAttributes = Optional<TeamAttributes, 'id'>;

// Define Team model class
class Team extends Model<TeamAttributes, TeamCreationAttributes> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare shortName: string;
  declare logoUrl: string;
  declare conference: string;
  declare division: string;
  declare active: boolean;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;

  // Associations
  declare readonly SeriesHome?: Series[];
  declare readonly SeriesAway?: Series[];
  declare readonly SeriesWinner?: Series[];
}

// Define Team model attributes
const teamAttributes: ModelAttributes<Team> = {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  shortName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  logoUrl: {
    type: DataTypes.STRING,
  },
  conference: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  division: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
};

// Initialize Team model
Team.init(teamAttributes, {
  sequelize,
  tableName: 'teams',
  timestamps: true,
});

// Define Round model attributes interface
export interface RoundAttributes {
  id: number;
  name: string;
  number: number;
  season: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define Round creation attributes
export type RoundCreationAttributes = Optional<RoundAttributes, 'id'>;

// Define Round model class
class Round extends Model<RoundAttributes, RoundCreationAttributes> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare number: number;
  declare season: string;
  declare active: boolean;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;

  // Associations
  declare readonly Series?: Series[];
}

// Define Round model attributes
const roundAttributes: ModelAttributes<Round> = {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  number: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  season: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
};

// Initialize Round model
Round.init(roundAttributes, {
  sequelize,
  tableName: 'rounds',
  timestamps: true,
});

// Define Series model attributes interface
export interface SeriesAttributes {
  id: number;
  roundId: number;
  homeTeamId: number;
  awayTeamId: number;
  winningTeamId?: number;
  homeTeamWins: number;
  awayTeamWins: number;
  gamesPlayed: number;
  completed: boolean;
  startDate?: Date;
  endDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define Series creation attributes
export type SeriesCreationAttributes = Optional<SeriesAttributes, 'id'>;

// Define Series model class
class Series extends Model<SeriesAttributes, SeriesCreationAttributes> {
  declare id: CreationOptional<number>;
  declare roundId: number;
  declare homeTeamId: number;
  declare awayTeamId: number;
  declare winningTeamId?: number;
  declare homeTeamWins: number;
  declare awayTeamWins: number;
  declare gamesPlayed: number;
  declare completed: boolean;
  declare startDate?: Date;
  declare endDate?: Date;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;

  // Associations
  declare readonly Round?: Round;
  declare readonly HomeTeam?: Team;
  declare readonly AwayTeam?: Team;
  declare readonly WinningTeam?: Team;
  declare readonly Predictions?: Prediction[];
}

// Define Series model attributes
const seriesAttributes: ModelAttributes<Series> = {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  roundId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'rounds',
      key: 'id',
    },
  },
  homeTeamId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'teams',
      key: 'id',
    },
  },
  awayTeamId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'teams',
      key: 'id',
    },
  },
  winningTeamId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'teams',
      key: 'id',
    },
  },
  homeTeamWins: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  awayTeamWins: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  gamesPlayed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
};

// Initialize Series model
Series.init(seriesAttributes, {
  sequelize,
  tableName: 'series',
  timestamps: true,
});

// Define Prediction model attributes interface
export interface PredictionAttributes {
  id: number;
  userId: number;
  seriesId: number;
  predictedWinnerId: number;
  predictedGames: number;
  points?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define Prediction creation attributes
export type PredictionCreationAttributes = Optional<PredictionAttributes, 'id'>;

// Define Prediction model class
class Prediction extends Model<PredictionAttributes, PredictionCreationAttributes> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare seriesId: number;
  declare predictedWinnerId: number;
  declare predictedGames: number;
  declare points?: number;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;

  // Associations
  declare readonly User?: User;
  declare readonly Series?: Series;
  declare readonly PredictedWinner?: Team;
}

// Define Prediction model attributes
const predictionAttributes: ModelAttributes<Prediction> = {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  seriesId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'series',
      key: 'id',
    },
  },
  predictedWinnerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'teams',
      key: 'id',
    },
  },
  predictedGames: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 4,
      max: 7,
    },
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
};

// Initialize Prediction model
Prediction.init(predictionAttributes, {
  sequelize,
  tableName: 'predictions',
  timestamps: true,
});

// Define StanleyCup prediction model attributes interface
export interface StanleyCupPredictionAttributes {
  id: number;
  userId: number;
  season: string;
  eastTeamId: number;
  westTeamId: number;
  winningTeamId: number;
  gamesPlayed: number;
  points?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define StanleyCup prediction creation attributes
export type StanleyCupPredictionCreationAttributes = Optional<StanleyCupPredictionAttributes, 'id'>;

// Define StanleyCupPrediction model class
class StanleyCupPrediction extends Model<StanleyCupPredictionAttributes, StanleyCupPredictionCreationAttributes> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare season: string;
  declare eastTeamId: number;
  declare westTeamId: number;
  declare winningTeamId: number;
  declare gamesPlayed: number;
  declare points?: number;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;

  // Associations
  declare readonly User?: User;
  declare readonly EastTeam?: Team;
  declare readonly WestTeam?: Team;
  declare readonly WinningTeam?: Team;
}

// Define StanleyCupPrediction model attributes
const stanleyCupPredictionAttributes: ModelAttributes<StanleyCupPrediction> = {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  season: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  eastTeamId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'teams',
      key: 'id',
    },
  },
  westTeamId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'teams',
      key: 'id',
    },
  },
  winningTeamId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'teams',
      key: 'id',
    },
  },
  gamesPlayed: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 4,
      max: 7,
    },
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
};

// Initialize StanleyCupPrediction model
StanleyCupPrediction.init(stanleyCupPredictionAttributes, {
  sequelize,
  tableName: 'stanley_cup_predictions',
  timestamps: true,
});

// Initialize associations
const initializeAssociations = () => {
  // User <-> Prediction
  User.hasMany(Prediction, { foreignKey: 'userId', as: 'Predictions' });
  Prediction.belongsTo(User, { foreignKey: 'userId', as: 'User' });

  // Team <-> Series
  Team.hasMany(Series, { foreignKey: 'homeTeamId', as: 'SeriesHome' });
  Team.hasMany(Series, { foreignKey: 'awayTeamId', as: 'SeriesAway' });
  Team.hasMany(Series, { foreignKey: 'winningTeamId', as: 'SeriesWinner' });
  Series.belongsTo(Team, { foreignKey: 'homeTeamId', as: 'HomeTeam' });
  Series.belongsTo(Team, { foreignKey: 'awayTeamId', as: 'AwayTeam' });
  Series.belongsTo(Team, { foreignKey: 'winningTeamId', as: 'WinningTeam' });

  // Round <-> Series
  Round.hasMany(Series, { foreignKey: 'roundId', as: 'Series' });
  Series.belongsTo(Round, { foreignKey: 'roundId', as: 'Round' });

  // Series <-> Prediction
  Series.hasMany(Prediction, { foreignKey: 'seriesId', as: 'Predictions' });
  Prediction.belongsTo(Series, { foreignKey: 'seriesId', as: 'Series' });
  Prediction.belongsTo(Team, { foreignKey: 'predictedWinnerId', as: 'PredictedWinner' });
};

// Initialize associations
initializeAssociations();

// Initialize models
setupUserAssociations();
setupTeamAssociations();
setupRoundAssociations();
setupSeriesAssociations();
setupPredictionAssociations();

// Export all models
export {
  Config,
  User,
  Team,
  Round,
  Series,
  Prediction,
  StanleyCupPrediction,
  sequelize,
};
