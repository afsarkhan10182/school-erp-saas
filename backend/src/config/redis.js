const { createClient } = require('redis');
const config = require('./config');
const { logger } = require('../utils/logger');

let redisClient = null;
let redisConnectionAttempts = 0;
const MAX_RECONNECTION_ATTEMPTS = 5;

const isRedisEnabled = () => {
  // Check if Redis is explicitly disabled
  if (process.env.REDIS_ENABLED === 'false' || process.env.REDIS_ENABLED === '0') {
    return false;
  }
  
  // Check if Redis configuration exists
  return config.redis && config.redis.enabled !== false;
};

const connectRedis = async () => {
  if (!isRedisEnabled()) {
    logger.info('Redis is disabled by configuration. Application will run without Redis.');
    return null;
  }

  try {
    const redisUrl = `redis://${config.redis.host}:${config.redis.port}`;
    logger.info(`Attempting to connect to Redis at ${redisUrl}`);
    
    redisClient = createClient({
      url: redisUrl,
      ...(config.redis.password && { password: config.redis.password }),
      socket: {
        connectTimeout: 5000, // 5 seconds
        lazyConnect: true,
        reconnectStrategy: (retries) => {
          if (retries > MAX_RECONNECTION_ATTEMPTS) {
            logger.warn('Max Redis reconnection attempts reached. Continuing without Redis.');
            return false; // Stop trying to reconnect
          }
          const delay = Math.min(retries * 1000, 10000); // Exponential backoff, max 10s
          logger.warn(`Redis reconnection attempt ${retries} in ${delay}ms`);
          return delay;
        }
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err.message);
      // Don't throw error, just log it
    });

    redisClient.on('connect', () => {
      logger.info('Successfully connected to Redis');
      redisConnectionAttempts = 0; // Reset connection attempts on successful connection
    });

    redisClient.on('ready', () => {
      logger.info('Redis client is ready');
    });

    redisClient.on('end', () => {
      logger.warn('Redis connection ended');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    redisConnectionAttempts++;
    logger.error(`Failed to connect to Redis (attempt ${redisConnectionAttempts}):`, error.message);
    
    if (redisConnectionAttempts >= MAX_RECONNECTION_ATTEMPTS) {
      logger.warn('Max Redis connection attempts reached. Application will continue without Redis.');
      return null;
    }
    
    // Don't throw error, just return null
    return null;
  }
};

const getRedisClient = () => {
  if (!isRedisEnabled()) {
    return null;
  }
  
  if (!redisClient || !redisClient.isOpen) {
    return null;
  }
  
  return redisClient;
};

const isRedisAvailable = () => {
  const client = getRedisClient();
  return client !== null && client.isOpen;
};

// Graceful shutdown
const shutdownRedis = async () => {
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.quit();
      logger.info('Redis connection closed gracefully');
    }
  } catch (error) {
    logger.error('Error closing Redis connection:', error.message);
  }
};

// Health check for Redis
const checkRedisHealth = async () => {
  try {
    const client = getRedisClient();
    if (!client) {
      return { status: 'disabled', message: 'Redis is disabled or not connected' };
    }
    
    const startTime = Date.now();
    await client.ping();
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
      message: 'Redis is responding'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      message: 'Redis is not responding'
    };
  }
};

// Cleanup on process termination
process.on('SIGINT', shutdownRedis);
process.on('SIGTERM', shutdownRedis);

module.exports = {
  connectRedis,
  getRedisClient,
  shutdownRedis,
  isRedisEnabled,
  isRedisAvailable,
  checkRedisHealth,
};
