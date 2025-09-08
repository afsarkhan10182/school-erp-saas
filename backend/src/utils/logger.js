const winston = require('winston');
const { combine, timestamp, printf, colorize, json } = winston.format;
const path = require('path');
const config = require('~/config/config');
const fs = require('fs');
const { resolveBackendPath } = require('./pathHelper');
// Create logs directory if it doesn't exist
const logDir = resolveBackendPath('logs');
if (!fs.existsSync(logDir)) {
  try {
    fs.mkdirSync(logDir);
  } catch (error) {
    console.warn(`Warning: Could not create log directory at ${logDir}:`, error.message);
  }
}

// Define log format with more details
const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
  const stackTrace = stack ? `\n${stack}` : '';
  return `${timestamp} [${level.toUpperCase()}]: ${message}${metaString}${stackTrace}`;
});

// Configure transports based on environment
const transports = [
  // Always log to console in development, only errors in production
  new winston.transports.Console({
    level: config.env === 'production' ? 'info' : 'debug',
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: config.env !== 'production' }),
      logFormat
    ),
    silent: process.env.NODE_ENV === 'test', // Don't log during tests
  }),
];

// Add file transports if enabled in config
if (config.logging?.toFile) {
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: config.logging.file?.maxsize || 5 * 1024 * 1024, // 5MB
      maxFiles: config.logging.file?.maxFiles || 5,
      format: combine(
        timestamp(),
        winston.format.errors({ stack: true }),
        json()
      ),
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: config.logging.file?.maxsize || 10 * 1024 * 1024, // 10MB
      maxFiles: config.logging.file?.maxFiles || 5,
      format: combine(
        timestamp(),
        winston.format.errors({ stack: true }),
        json()
      ),
    })
  );
}

const logger = winston.createLogger({
  level: config.logging?.level || 'info',
  levels: winston.config.npm.levels,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    json()
  ),
  transports,
  exitOnError: false, // Don't exit on handled exceptions
  silent: process.env.NODE_ENV === 'test', // Don't log during tests
});

// Create a stream for morgan
logger.stream = {
  write: (message) => {
    // Skip logging health checks to reduce noise
    if (!message.includes('GET /health')) {
      logger.info(message.trim());
    }
  },
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // In production, you might want to restart the process
  if (config.env === 'production') {
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to log and continue
  if (config.env === 'production') {
    // Optionally send notification to monitoring service
  }
});

// Log process info
logger.info(`Logger initialized in ${config.env} mode`);

module.exports = { logger };
