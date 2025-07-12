// backend/src/config/database.js
const { Sequelize } = require('sequelize');
const config = require('./config');
const { logger } = require('../utils/logger');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config.db;

const sequelize = new Sequelize(
  dbConfig.name,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: 'postgres',
    logging: env === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

// Remove the problematic connectionManager.on code
// and replace it with proper error handling
sequelize
  .authenticate()
  .then(() => {
    logger.info('Database connection has been established successfully.');
  })
  .catch((err) => {
    logger.error('Unable to connect to the database:', err);
    process.exit(1);
  });

// Connect to database function
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    return true;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  sequelize,
  Sequelize,
  testConnection,
  connectDB
};