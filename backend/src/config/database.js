require('dotenv').config();
const path = require('path');

const env = process.env.NODE_ENV || 'development';
const isProduction = env === 'production';

// Default SQLite configuration
const defaultConfig = {
  dialect: 'sqlite',
  storage: process.env.DB_PATH || path.join(__dirname, '../../data/hockey-pool.db'),
  logging: isProduction ? false : console.log,
};

// PostgreSQL configuration if environment variables are set
const postgresConfig = {
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'hockey_playoff_pool',
  logging: isProduction ? false : console.log,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

// Use PostgreSQL if all required environment variables are set, otherwise use SQLite
const usePostgres = process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME;
const config = usePostgres ? postgresConfig : defaultConfig;

module.exports = {
  development: config,
  test: {
    ...config,
    storage: ':memory:',
    logging: false,
  },
  production: {
    ...config,
    logging: false,
  },
}; 