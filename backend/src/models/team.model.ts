import { Model, DataTypes, Optional, Association } from 'sequelize';
import { sequelize } from '../config/database';
import { Series } from './series.model';

export interface TeamAttributes {
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

export type TeamCreationAttributes = Optional<TeamAttributes, 'id'>;

export class Team extends Model<TeamAttributes, TeamCreationAttributes> {
  declare id: number;
  declare name: string;
  declare shortName: string;
  declare logoUrl: string;
  declare conference: string;
  declare division: string;
  declare active: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  declare static associations: {
    SeriesHome: Association<Team, Series>;
    SeriesAway: Association<Team, Series>;
    SeriesWinner: Association<Team, Series>;
  };
}

Team.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    shortName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    logoUrl: {
      type: DataTypes.STRING,
      allowNull: false,
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
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'Team',
    tableName: 'teams',
  }
);

export const setupTeamAssociations = () => {
  Team.hasMany(Series, {
    foreignKey: 'homeTeamId',
    as: 'SeriesHome',
  });

  Team.hasMany(Series, {
    foreignKey: 'awayTeamId',
    as: 'SeriesAway',
  });

  Team.hasMany(Series, {
    foreignKey: 'winningTeamId',
    as: 'SeriesWinner',
  });
}; 