require('dotenv').config();
const http = require('http');
const { logger } = require('./utils/logger');
const { App } = require('./app');
const { connectRedis } = require('./config/redis');

// Create HTTP server
const app = new App();
const server = http.createServer(app.app);

// Initialize Redis connection
const initializeRedis = async () => {
  try {
    await connectRedis();
    logger.info('Redis initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Redis:', error);
    // Continue without Redis for now
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
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

// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, async () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`API Documentation: http://localhost:${PORT}/api-docs`);
  
  // Initialize Redis after server starts
  await initializeRedis();
});

// Handle server errors
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? `Pipe ${PORT}` : `Port ${PORT}`;

  // Handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

// Handle process termination
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Export the server for testing
module.exports = server;
