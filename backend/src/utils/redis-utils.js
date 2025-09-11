const { getRedisClient, isRedisAvailable } = require('~/config/redis');
const { logger } = require('./logger');

// In-memory cache fallback
const memoryCache = new Map();
const memoryCacheTTL = new Map();

class RedisUtils {
  static async set(key, value, ttl = null) {
    try {
      const redisClient = getRedisClient();
      if (redisClient && isRedisAvailable()) {
        if (ttl) {
          await redisClient.set(key, JSON.stringify(value), { EX: ttl });
        } else {
          await redisClient.set(key, JSON.stringify(value));
        }
        logger.debug(`Redis: Set key ${key}`);
        return true;
      } else {
        // Fallback to memory cache
        memoryCache.set(key, JSON.stringify(value));
        if (ttl) {
          memoryCacheTTL.set(key, Date.now() + ttl * 1000);
        }
        logger.debug(`Memory: Set key ${key}`);
        return true;
      }
    } catch (error) {
      logger.warn(`Failed to set cache key ${key}:`, error.message);
      // Fallback to memory cache
      try {
        memoryCache.set(key, JSON.stringify(value));
        if (ttl) {
          memoryCacheTTL.set(key, Date.now() + ttl * 1000);
        }
        logger.debug(`Memory fallback: Set key ${key}`);
        return true;
      } catch (fallbackError) {
        logger.error(`Failed to set memory cache key ${key}:`, fallbackError.message);
        return false;
      }
    }
  }

  static async get(key) {
    try {
      const redisClient = getRedisClient();
      if (redisClient && isRedisAvailable()) {
        const value = await redisClient.get(key);
        if (value) {
          logger.debug(`Redis: Get key ${key}`);
          return JSON.parse(value);
        }
        return null;
      } else {
        // Fallback to memory cache
        const value = memoryCache.get(key);
        if (value) {
          // Check TTL
          const ttl = memoryCacheTTL.get(key);
          if (ttl && Date.now() > ttl) {
            memoryCache.delete(key);
            memoryCacheTTL.delete(key);
            return null;
          }
          logger.debug(`Memory: Get key ${key}`);
          return JSON.parse(value);
        }
        return null;
      }
    } catch (error) {
      logger.warn(`Failed to get cache key ${key}:`, error.message);
      // Fallback to memory cache
      try {
        const value = memoryCache.get(key);
        if (value) {
          // Check TTL
          const ttl = memoryCacheTTL.get(key);
          if (ttl && Date.now() > ttl) {
            memoryCache.delete(key);
            memoryCacheTTL.delete(key);
            return null;
          }
          logger.debug(`Memory fallback: Get key ${key}`);
          return JSON.parse(value);
        }
        return null;
      } catch (fallbackError) {
        logger.error(`Failed to get memory cache key ${key}:`, fallbackError.message);
        return null;
      }
    }
  }

  static async del(key) {
    try {
      const redisClient = getRedisClient();
      if (redisClient && isRedisAvailable()) {
        await redisClient.del(key);
        logger.debug(`Redis: Delete key ${key}`);
        return true;
      } else {
        // Fallback to memory cache
        memoryCache.delete(key);
        memoryCacheTTL.delete(key);
        logger.debug(`Memory: Delete key ${key}`);
        return true;
      }
    } catch (error) {
      logger.warn(`Failed to delete cache key ${key}:`, error.message);
      // Fallback to memory cache
      try {
        memoryCache.delete(key);
        memoryCacheTTL.delete(key);
        logger.debug(`Memory fallback: Delete key ${key}`);
        return true;
      } catch (fallbackError) {
        logger.error(`Failed to delete memory cache key ${key}:`, fallbackError.message);
        return false;
      }
    }
  }

  static async exists(key) {
    try {
      const redisClient = getRedisClient();
      if (redisClient && isRedisAvailable()) {
        const result = await redisClient.exists(key);
        logger.debug(`Redis: Exists key ${key} = ${result}`);
        return result === 1;
      } else {
        // Fallback to memory cache
        const exists = memoryCache.has(key);
        if (exists) {
          // Check TTL
          const ttl = memoryCacheTTL.get(key);
          if (ttl && Date.now() > ttl) {
            memoryCache.delete(key);
            memoryCacheTTL.delete(key);
            return false;
          }
        }
        logger.debug(`Memory: Exists key ${key} = ${exists}`);
        return exists;
      }
    } catch (error) {
      logger.warn(`Failed to check cache key ${key}:`, error.message);
      // Fallback to memory cache
      try {
        const exists = memoryCache.has(key);
        if (exists) {
          // Check TTL
          const ttl = memoryCacheTTL.get(key);
          if (ttl && Date.now() > ttl) {
            memoryCache.delete(key);
            memoryCacheTTL.delete(key);
            return false;
          }
        }
        logger.debug(`Memory fallback: Exists key ${key} = ${exists}`);
        return exists;
      } catch (fallbackError) {
        logger.error(`Failed to check memory cache key ${key}:`, fallbackError.message);
        return false;
      }
    }
  }

  static async expire(key, ttl) {
    try {
      const redisClient = getRedisClient();
      if (redisClient && isRedisAvailable()) {
        await redisClient.expire(key, ttl);
        logger.debug(`Redis: Expire key ${key} for ${ttl}s`);
        return true;
      } else {
        // Fallback to memory cache
        memoryCacheTTL.set(key, Date.now() + ttl * 1000);
        logger.debug(`Memory: Expire key ${key} for ${ttl}s`);
        return true;
      }
    } catch (error) {
      logger.warn(`Failed to expire cache key ${key}:`, error.message);
      // Fallback to memory cache
      try {
        memoryCacheTTL.set(key, Date.now() + ttl * 1000);
        logger.debug(`Memory fallback: Expire key ${key} for ${ttl}s`);
        return true;
      } catch (fallbackError) {
        logger.error(`Failed to expire memory cache key ${key}:`, fallbackError.message);
        return false;
      }
    }
  }

  static async ttl(key) {
    try {
      const redisClient = getRedisClient();
      if (redisClient && isRedisAvailable()) {
        const ttl = await redisClient.ttl(key);
        logger.debug(`Redis: TTL key ${key} = ${ttl}s`);
        return ttl;
      } else {
        // Fallback to memory cache
        const ttl = memoryCacheTTL.get(key);
        if (ttl) {
          const remaining = Math.ceil((ttl - Date.now()) / 1000);
          logger.debug(`Memory: TTL key ${key} = ${remaining}s`);
          return remaining > 0 ? remaining : -1;
        }
        return -1;
      }
    } catch (error) {
      logger.warn(`Failed to get TTL for cache key ${key}:`, error.message);
      // Fallback to memory cache
      try {
        const ttl = memoryCacheTTL.get(key);
        if (ttl) {
          const remaining = Math.ceil((ttl - Date.now()) / 1000);
          logger.debug(`Memory fallback: TTL key ${key} = ${remaining}s`);
          return remaining > 0 ? remaining : -1;
        }
        return -1;
      } catch (fallbackError) {
        logger.error(`Failed to get TTL for memory cache key ${key}:`, fallbackError.message);
        return -1;
      }
    }
  }

  static async incr(key, increment = 1) {
    try {
      const redisClient = getRedisClient();
      if (redisClient && isRedisAvailable()) {
        const result = await redisClient.incrBy(key, increment);
        logger.debug(`Redis: Increment key ${key} by ${increment} = ${result}`);
        return result;
      } else {
        // Fallback to memory cache
        const current = memoryCache.get(key);
        const newValue = (parseInt(current) || 0) + increment;
        memoryCache.set(key, newValue.toString());
        logger.debug(`Memory: Increment key ${key} by ${increment} = ${newValue}`);
        return newValue;
      }
    } catch (error) {
      logger.warn(`Failed to increment cache key ${key}:`, error.message);
      // Fallback to memory cache
      try {
        const current = memoryCache.get(key);
        const newValue = (parseInt(current) || 0) + increment;
        memoryCache.set(key, newValue.toString());
        logger.debug(`Memory fallback: Increment key ${key} by ${increment} = ${newValue}`);
        return newValue;
      } catch (fallbackError) {
        logger.error(`Failed to increment memory cache key ${key}:`, fallbackError.message);
        return 0;
      }
    }
  }

  static async decr(key, decrement = 1) {
    try {
      const redisClient = getRedisClient();
      if (redisClient && isRedisAvailable()) {
        const result = await redisClient.decrBy(key, decrement);
        logger.debug(`Redis: Decrement key ${key} by ${decrement} = ${result}`);
        return result;
      } else {
        // Fallback to memory cache
        const current = memoryCache.get(key);
        const newValue = Math.max(0, (parseInt(current) || 0) - decrement);
        memoryCache.set(key, newValue.toString());
        logger.debug(`Memory: Decrement key ${key} by ${decrement} = ${newValue}`);
        return newValue;
      }
    } catch (error) {
      logger.warn(`Failed to decrement cache key ${key}:`, error.message);
      // Fallback to memory cache
      try {
        const current = memoryCache.get(key);
        const newValue = Math.max(0, (parseInt(current) || 0) - decrement);
        memoryCache.set(key, newValue.toString());
        logger.debug(`Memory fallback: Decrement key ${key} by ${decrement} = ${newValue}`);
        return newValue;
      } catch (fallbackError) {
        logger.error(`Failed to decrement memory cache key ${key}:`, fallbackError.message);
        return 0;
      }
    }
  }

  static async sadd(key, members) {
    try {
      const redisClient = getRedisClient();
      if (redisClient && isRedisAvailable()) {
        const result = await redisClient.sAdd(key, members);
        logger.debug(`Redis: SADD key ${key} with ${members.length} members`);
        return result;
      } else {
        // Fallback to memory cache (simplified set implementation)
        const current = memoryCache.get(key);
        const set = current ? new Set(JSON.parse(current)) : new Set();
        members.forEach(member => set.add(member));
        memoryCache.set(key, JSON.stringify([...set]));
        logger.debug(`Memory: SADD key ${key} with ${members.length} members`);
        return members.length;
      }
    } catch (error) {
      logger.warn(`Failed to SADD cache key ${key}:`, error.message);
      return 0;
    }
  }

  static async smembers(key) {
    try {
      const redisClient = getRedisClient();
      if (redisClient && isRedisAvailable()) {
        const members = await redisClient.sMembers(key);
        logger.debug(`Redis: SMEMBERS key ${key} = ${members.length} members`);
        return members;
      } else {
        // Fallback to memory cache
        const current = memoryCache.get(key);
        if (current) {
          const members = JSON.parse(current);
          logger.debug(`Memory: SMEMBERS key ${key} = ${members.length} members`);
          return members;
        }
        return [];
      }
    } catch (error) {
      logger.warn(`Failed to SMEMBERS cache key ${key}:`, error.message);
      return [];
    }
  }

  static async srem(key, members) {
    try {
      const redisClient = getRedisClient();
      if (redisClient && isRedisAvailable()) {
        const result = await redisClient.sRem(key, members);
        logger.debug(`Redis: SREM key ${key} removed ${result} members`);
        return result;
      } else {
        // Fallback to memory cache
        const current = memoryCache.get(key);
        if (current) {
          const set = new Set(JSON.parse(current));
          let removed = 0;
          members.forEach(member => {
            if (set.delete(member)) removed++;
          });
          memoryCache.set(key, JSON.stringify([...set]));
          logger.debug(`Memory: SREM key ${key} removed ${removed} members`);
          return removed;
        }
        return 0;
      }
    } catch (error) {
      logger.warn(`Failed to SREM cache key ${key}:`, error.message);
      return 0;
    }
  }

  static async sismember(key, member) {
    try {
      const redisClient = getRedisClient();
      if (redisClient && isRedisAvailable()) {
        const result = await redisClient.sIsMember(key, member);
        logger.debug(`Redis: SISMEMBER key ${key} member ${member} = ${result}`);
        return result;
      } else {
        // Fallback to memory cache
        const current = memoryCache.get(key);
        if (current) {
          const set = new Set(JSON.parse(current));
          const result = set.has(member);
          logger.debug(`Memory: SISMEMBER key ${key} member ${member} = ${result}`);
          return result;
        }
        return false;
      }
    } catch (error) {
      logger.warn(`Failed to SISMEMBER cache key ${key}:`, error.message);
      return false;
    }
  }

  static async keys(pattern) {
    try {
      const redisClient = getRedisClient();
      if (redisClient && isRedisAvailable()) {
        const keys = await redisClient.keys(pattern);
        logger.debug(`Redis: KEYS pattern ${pattern} = ${keys.length} keys`);
        return keys;
      } else {
        // Fallback to memory cache (simple pattern matching)
        const keys = [];
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        for (const key of memoryCache.keys()) {
          if (regex.test(key)) {
            keys.push(key);
          }
        }
        logger.debug(`Memory: KEYS pattern ${pattern} = ${keys.length} keys`);
        return keys;
      }
    } catch (error) {
      logger.warn(`Failed to get keys for pattern ${pattern}:`, error.message);
      return [];
    }
  }

  static async info() {
    try {
      const redisClient = getRedisClient();
      if (redisClient && isRedisAvailable()) {
        const info = await redisClient.info();
        const lines = info.split('\r\n');
        const result = {};
        lines.forEach(line => {
          if (line.includes(':')) {
            const [key, value] = line.split(':');
            result[key] = value;
          }
        });
        return result;
      } else {
        // Fallback to memory cache info
        return {
          redis_version: 'memory-cache',
          used_memory_human: `${memoryCache.size} keys`,
          connected_clients: 1,
          uptime_in_seconds: process.uptime()
        };
      }
    } catch (error) {
      logger.warn('Failed to get Redis info:', error.message);
      return {
        redis_version: 'memory-cache',
        used_memory_human: `${memoryCache.size} keys`,
        connected_clients: 1,
        uptime_in_seconds: process.uptime()
      };
    }
  }

  static async memoryUsage() {
    try {
      const redisClient = getRedisClient();
      if (redisClient && isRedisAvailable()) {
        const info = await this.info();
        return {
          used: parseInt(info.used_memory) || 0,
          peak: parseInt(info.used_memory_peak) || 0,
          human: info.used_memory_human || '0B',
          peak_human: info.used_memory_peak_human || '0B'
        };
      } else {
        // Fallback to memory cache usage
        const used = memoryCache.size * 100; // Rough estimate
        return {
          used,
          peak: used,
          human: `${used}B`,
          peak_human: `${used}B`
        };
      }
    } catch (error) {
      logger.warn('Failed to get memory usage:', error.message);
      return {
        used: 0,
        peak: 0,
        human: '0B',
        peak_human: '0B'
      };
    }
  }

  // Clear all memory cache (useful for testing)
  static clearMemoryCache() {
    memoryCache.clear();
    memoryCacheTTL.clear();
    logger.info('Memory cache cleared');
  }

  // Get memory cache stats
  static getMemoryCacheStats() {
    return {
      size: memoryCache.size,
      ttlSize: memoryCacheTTL.size
    };
  }
}

module.exports = RedisUtils;
