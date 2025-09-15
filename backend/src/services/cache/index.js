const RedisService = require('./redis.service');
const MemoryService = require('./memory.service');
const { logger } = require('~/utils/shared/logger');

class CacheService {
  constructor() {
    this.redisService = new RedisService();
    this.memoryService = new MemoryService();
    this.isRedisAvailable = false;
    this.initializeCache();
  }

  async initializeCache() {
    try {
      await this.redisService.connect();
      this.isRedisAvailable = true;
      logger.info('Cache: Redis is available and connected');
    } catch (error) {
      this.isRedisAvailable = false;
      logger.warn('Cache: Redis unavailable, using memory cache only:', error.message);
    }
  }

  async get(key) {
    try {
      if (this.isRedisAvailable) {
        const value = await this.redisService.get(key);
        if (value !== null) {
          logger.debug(`Cache hit (Redis): ${key}`);
          return value;
        }
      }

      // Fallback to memory cache
      const memoryValue = await this.memoryService.get(key);
      if (memoryValue !== null) {
        logger.debug(`Cache hit (Memory): ${key}`);
      }
      return memoryValue;
    } catch (error) {
      logger.error('Cache get error:', error);
      // Final fallback to memory
      return await this.memoryService.get(key);
    }
  }

  async set(key, value, ttl = 3600) {
    try {
      // Set in both Redis and memory for redundancy
      const promises = [this.memoryService.set(key, value, ttl)];

      if (this.isRedisAvailable) {
        promises.push(this.redisService.set(key, value, ttl));
      }

      await Promise.allSettled(promises);
      logger.debug(`Cache set: ${key}`);
    } catch (error) {
      logger.error('Cache set error:', error);
      // Ensure memory cache is set even if Redis fails
      await this.memoryService.set(key, value, ttl);
    }
  }

  async del(key) {
    try {
      const promises = [this.memoryService.del(key)];

      if (this.isRedisAvailable) {
        promises.push(this.redisService.del(key));
      }

      await Promise.allSettled(promises);
      logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  async exists(key) {
    try {
      if (this.isRedisAvailable) {
        return await this.redisService.exists(key);
      }
      return await this.memoryService.exists(key);
    } catch (error) {
      logger.error('Cache exists error:', error);
      return await this.memoryService.exists(key);
    }
  }

  async clear(pattern = '*') {
    try {
      const promises = [this.memoryService.clear(pattern)];

      if (this.isRedisAvailable) {
        promises.push(this.redisService.clear(pattern));
      }

      await Promise.allSettled(promises);
      logger.info(`Cache cleared for pattern: ${pattern}`);
    } catch (error) {
      logger.error('Cache clear error:', error);
    }
  }

  async getStats() {
    const stats = {
      redis: {
        available: this.isRedisAvailable,
        stats: null
      },
      memory: {
        stats: await this.memoryService.getStats()
      }
    };

    if (this.isRedisAvailable) {
      try {
        stats.redis.stats = await this.redisService.getStats();
      } catch (error) {
        logger.error('Failed to get Redis stats:', error);
      }
    }

    return stats;
  }

  // Health check method
  async healthCheck() {
    const health = {
      status: 'healthy',
      redis: {
        status: 'unavailable',
        error: null
      },
      memory: {
        status: 'healthy',
        error: null
      }
    };

    // Check Redis health
    if (this.isRedisAvailable) {
      try {
        await this.redisService.ping();
        health.redis.status = 'healthy';
      } catch (error) {
        health.redis.status = 'unhealthy';
        health.redis.error = error.message;
        this.isRedisAvailable = false;
      }
    }

    // Check memory cache health
    try {
      await this.memoryService.get('health_check');
      health.memory.status = 'healthy';
    } catch (error) {
      health.memory.status = 'unhealthy';
      health.memory.error = error.message;
      health.status = 'unhealthy';
    }

    return health;
  }
}

// Export singleton instance
module.exports = new CacheService();
