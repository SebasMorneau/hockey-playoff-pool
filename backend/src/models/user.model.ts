import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Prediction } from './prediction.model';

export interface UserAttributes {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  active: boolean;
  magicLinkToken?: string;
  magicLinkExpiry?: Date;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserCreationAttributes = Optional<UserAttributes, 'id' | 'isAdmin' | 'active' | 'magicLinkToken' | 'magicLinkExpiry' | 'lastLogin'>;

export class User extends Model<UserAttributes, UserCreationAttributes> {
  declare id: number;
  declare name: string;
  declare email: string;
  declare isAdmin: boolean;
  declare active: boolean;
  declare magicLinkToken?: string;
  declare magicLinkExpiry?: Date;
  declare lastLogin?: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  declare Predictions?: Prediction[];
}

User.init(
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
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
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
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
  }
);

export const setupUserAssociations = () => {
  User.hasMany(Prediction, {
    foreignKey: 'userId',
    as: 'Predictions',
  });
}; 