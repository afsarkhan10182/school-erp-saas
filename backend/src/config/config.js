// backend/src/config/config.js
require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

const config = {
  app: {
    env,
    port: process.env.PORT || 8000,
    apiPrefix: process.env.API_PREFIX || '/api'
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'school_erp',
    dialect: 'postgres'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret',
    accessExpirationMinutes: process.env.JWT_ACCESS_EXPIRATION_MINUTES || 60 * 24, // 24 hours
    refreshExpirationDays: process.env.JWT_REFRESH_EXPIRATION_DAYS || 7 // 7 days
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
};

module.exports = config;