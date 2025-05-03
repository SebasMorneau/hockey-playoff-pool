import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Series } from './series.model';
import { Team } from './team.model';
import { User } from './user.model';

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

export type PredictionCreationAttributes = Optional<PredictionAttributes, 'id' | 'points'>;

export class Prediction extends Model<PredictionAttributes, PredictionCreationAttributes> {
  declare id: number;
  declare userId: number;
  declare seriesId: number;
  declare predictedWinnerId: number;
  declare predictedGames: number;
  declare points?: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  declare Series?: Series;
  declare User?: User;
  declare PredictedWinner?: Team;
}

Prediction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    seriesId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    predictedWinnerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'Prediction',
    tableName: 'predictions',
  }
);

export const setupPredictionAssociations = () => {
  Prediction.belongsTo(User, {
    foreignKey: 'userId',
    as: 'User',
  });

  Prediction.belongsTo(Series, {
    foreignKey: 'seriesId',
    as: 'Series',
  });

  Prediction.belongsTo(Team, {
    foreignKey: 'predictedWinnerId',
    as: 'PredictedWinner',
  });
}; 