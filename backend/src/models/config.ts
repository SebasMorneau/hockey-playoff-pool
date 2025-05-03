import { Model, DataTypes, ModelAttributes, CreationOptional, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// Define Config model attributes interface
export interface ConfigAttributes {
  id: number;
  season: string;
  allowLatePredictions: boolean;
  // Regular series prediction points
  pointsForCorrectWinner: number;      // +1 for correct winner
  pointsForCorrectGames: number;       // +2 for correct games
  // Stanley Cup prediction points
  pointsForFinalistTeam: number;       // +1 per correct finalist team
  pointsForChampion: number;          // +1 for correct champion
  pointsForChampionGames: number;     // +2 if champion wins in predicted games
  createdAt?: Date;
  updatedAt?: Date;
}

// Define Config model creation attributes interface
export type ConfigCreationAttributes = Optional<ConfigAttributes, 'id'>;

// Define Config model class
export class Config extends Model<ConfigAttributes, ConfigCreationAttributes> {
  declare id: CreationOptional<number>;
  declare season: string;
  declare allowLatePredictions: boolean;
  declare pointsForCorrectWinner: number;
  declare pointsForCorrectGames: number;
  declare pointsForFinalistTeam: number;
  declare pointsForChampion: number;
  declare pointsForChampionGames: number;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

// Initialize the model
Config.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    season: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    allowLatePredictions: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    pointsForCorrectWinner: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    pointsForCorrectGames: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2,
    },
    pointsForFinalistTeam: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    pointsForChampion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    pointsForChampionGames: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2,
    },
  },
  {
    sequelize,
    modelName: 'Config',
    tableName: 'configs',
  }
); 