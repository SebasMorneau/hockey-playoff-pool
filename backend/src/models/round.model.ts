import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Series } from './series.model';

export interface RoundAttributes {
  id: number;
  name: string;
  number: number;
  season: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type RoundCreationAttributes = Optional<RoundAttributes, 'id'>;

export class Round extends Model<RoundAttributes, RoundCreationAttributes> {
  declare id: number;
  declare name: string;
  declare number: number;
  declare season: string;
  declare active: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  declare Series?: Series[];
}

Round.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'Round',
    tableName: 'rounds',
  }
);

export const setupRoundAssociations = () => {
  Round.hasMany(Series, {
    foreignKey: 'roundId',
    as: 'Series',
  });
}; 