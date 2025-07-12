const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const config = require('../config/config');
const { getRedisClient } = require('../config/redis');
const { logger } = require('../utils/logger');

// Try to use Redis for rate limiting, fallback to memory
let store = null;

try {
  const redisClient = getRedisClient();
  store = new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: 'rate_limit:',
  });
  logger.info('Rate limiter using Redis store');
} catch (error) {
  logger.warn('Redis not available for rate limiting, using memory store:', error.message);
  store = null; // Will use default memory store
}

const apiLimiter = rateLimit({
  store,
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    error: 'Too many requests from this IP, please try again later',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
  },
  skip: (req) => config.rateLimit.skipPaths.some(path => req.path.startsWith(path)),
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = apiLimiter;
