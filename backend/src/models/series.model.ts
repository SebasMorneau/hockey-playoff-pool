import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Team } from './team.model';
import { Round } from './round.model';
import { Prediction } from './prediction.model';

export interface SeriesAttributes {
  id: number;
  roundId: number;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamWins: number;
  awayTeamWins: number;
  gamesPlayed: number;
  winningTeamId: number | null;
  completed: boolean;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type SeriesCreationAttributes = Optional<SeriesAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class Series extends Model<SeriesAttributes, SeriesCreationAttributes> implements SeriesAttributes {
  public id!: number;
  public roundId!: number;
  public homeTeamId!: number;
  public awayTeamId!: number;
  public homeTeamWins!: number;
  public awayTeamWins!: number;
  public gamesPlayed!: number;
  public winningTeamId!: number | null;
  public completed!: boolean;
  public startDate!: Date | null;
  public endDate!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly HomeTeam?: Team;
  public readonly AwayTeam?: Team;
  public readonly WinningTeam?: Team;
  public readonly Round?: Round;
  public readonly Predictions?: Prediction[];
}

Series.init(
  {
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
    homeTeamWins: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 4,
      },
    },
    awayTeamWins: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 4,
      },
    },
    gamesPlayed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 7,
        isGamesPlayedValid(this: Series, value: number) {
          if (value !== this.homeTeamWins + this.awayTeamWins) {
            throw new Error('Games played must equal sum of wins');
          }
        },
      },
    },
    winningTeamId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'teams',
        key: 'id',
      },
      validate: {
        isWinningTeamValid(this: Series, value: number | null) {
          if (value !== null && value !== this.homeTeamId && value !== this.awayTeamId) {
            throw new Error('Winning team must be one of the teams in the series');
          }
          if (value === this.homeTeamId && this.homeTeamWins < 4) {
            throw new Error('Home team must have 4 wins to be declared winner');
          }
          if (value === this.awayTeamId && this.awayTeamWins < 4) {
            throw new Error('Away team must have 4 wins to be declared winner');
          }
        },
      },
    },
    completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isEndDateValid(this: Series, value: Date | null) {
          if (value !== null && this.startDate !== null && value < this.startDate) {
            throw new Error('End date cannot be before start date');
          }
        },
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'series',
    modelName: 'Series',
  }
);

export const setupSeriesAssociations = () => {
  Series.belongsTo(Round, {
    foreignKey: 'roundId',
    as: 'Round',
  });

  Series.belongsTo(Team, {
    foreignKey: 'homeTeamId',
    as: 'HomeTeam',
  });

  Series.belongsTo(Team, {
    foreignKey: 'awayTeamId',
    as: 'AwayTeam',
  });

  Series.belongsTo(Team, {
    foreignKey: 'winningTeamId',
    as: 'WinningTeam',
  });

  Series.hasMany(Prediction, {
    foreignKey: 'seriesId',
    as: 'Predictions',
  });
};