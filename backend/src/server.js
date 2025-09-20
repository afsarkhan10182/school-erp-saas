require('dotenv').config();
require('module-alias/register');
const { logger } = require('./utils/shared/logger');
const { App } = require('./app');

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  logger.error('Uncaught Exception:', error);
  // In production, you might want to gracefully shut down the server
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to gracefully shut down the server
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Start the application
const app = new App();
app.start().catch(err => {
  logger.error('Failed to start app:', err);
  process.exit(1);
});
