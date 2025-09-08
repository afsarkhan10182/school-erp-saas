const { createClient } = require('redis');
const config = require('~/config/config');
const { logger } = require('~/utils/logger');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxReconnectionAttempts = 5;
  }

  async connect() {
    if (!config.redis.enabled) {
      throw new Error('Redis is disabled in configuration');
    }

    try {
      const redisUrl = `redis://${config.redis.host}:${config.redis.port}`;
      logger.info(`Attempting to connect to Redis at ${redisUrl}`);
      
      this.client = createClient({
        url: redisUrl,
        ...(config.redis.password && { password: config.redis.password }),
        socket: {
          connectTimeout: 5000,
          lazyConnect: true,
          reconnectStrategy: (retries) => {
            if (retries > this.maxReconnectionAttempts) {
              logger.warn('Max Redis reconnection attempts reached');
              return false;
            }
            const delay = Math.min(retries * 1000, 10000);
            logger.warn(`Redis reconnection attempt ${retries} in ${delay}ms`);
            return delay;
          }
        }
      });

      this.client.on('error', (err) => {
        logger.error('Redis Client Error:', err.message);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Successfully connected to Redis');
        this.isConnected = true;
        this.connectionAttempts = 0;
      });

      this.client.on('ready', () => {
        logger.info('Redis client is ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        logger.warn('Redis connection ended');
        this.isConnected = false;
      });

      await this.client.connect();
      return true;
    } catch (error) {
      this.connectionAttempts++;
      logger.error(`Failed to connect to Redis (attempt ${this.connectionAttempts}):`, error.message);
      
      if (this.connectionAttempts >= this.maxReconnectionAttempts) {
        logger.warn('Max Redis connection attempts reached');
        throw error;
      }
      
      throw error;
    }
  }

  async get(key) {
    if (!this.isConnected || !this.client) {
      throw new Error('Redis not connected');
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis get error:', error);
      throw error;
    }
  }

  async set(key, value, ttl = 3600) {
    if (!this.isConnected || !this.client) {
      throw new Error('Redis not connected');
    }

    try {
      const serializedValue = JSON.stringify(value);
      await this.client.set(key, serializedValue, { EX: ttl });
      return true;
    } catch (error) {
      logger.error('Redis set error:', error);
      throw error;
    }
  }

  async del(key) {
    if (!this.isConnected || !this.client) {
      throw new Error('Redis not connected');
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis delete error:', error);
      throw error;
    }
  }

  async exists(key) {
    if (!this.isConnected || !this.client) {
      throw new Error('Redis not connected');
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error:', error);
      throw error;
    }
  }

  async clear(pattern = '*') {
    if (!this.isConnected || !this.client) {
      throw new Error('Redis not connected');
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        logger.info(`Cleared ${keys.length} Redis keys for pattern: ${pattern}`);
      }
      return keys.length;
    } catch (error) {
      logger.error('Redis clear error:', error);
      throw error;
    }
  }

  async ping() {
    if (!this.isConnected || !this.client) {
      throw new Error('Redis not connected');
    }

    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis ping error:', error);
      throw error;
    }
  }

  async getStats() {
    if (!this.isConnected || !this.client) {
      return { error: 'Redis not connected' };
    }

    try {
      const info = await this.client.info();
      const memory = await this.client.memory('USAGE');
      
      return {
        info: info,
        memory: memory,
        connected: this.isConnected
      };
    } catch (error) {
      logger.error('Redis stats error:', error);
      return { error: error.message };
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
        this.isConnected = false;
        logger.info('Redis disconnected gracefully');
      } catch (error) {
        logger.error('Redis disconnect error:', error);
      }
    }
  }
}

module.exports = RedisService; 