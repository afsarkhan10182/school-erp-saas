const { createClient } = require('redis');
const { logger } = require('../utils/logger');

let redisClient;

const connectRedis = async () => {
  try {
    const redisUrl = `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
    
    redisClient = createClient({
      url: redisUrl,
      ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
      // Attempt to reconnect after a delay
      setTimeout(connectRedis, 5000);
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    // Retry connection after a delay
    setTimeout(connectRedis, 5000);
    throw error;
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client is not connected. Call connectRedis() first.');
  }
  return redisClient;
};

// Graceful shutdown
const shutdownRedis = async () => {
  try {
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis connection closed');
    }
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
  }
};

process.on('SIGINT', shutdownRedis);
process.on('SIGTERM', shutdownRedis);

module.exports = {
  connectRedis,
  getRedisClient,
  shutdownRedis,
};
