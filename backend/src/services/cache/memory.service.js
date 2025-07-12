const { logger } = require('../../utils/logger');

class MemoryService {
  constructor() {
    this.cache = new Map();
    this.ttlMap = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: 0
    };
    
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  async get(key) {
    try {
      // Check if key exists and is not expired
      if (!this.cache.has(key)) {
        this.stats.misses++;
        return null;
      }

      const entry = this.cache.get(key);
      const now = Date.now();

      // Check if entry has expired
      if (entry.expiresAt && now > entry.expiresAt) {
        this.cache.delete(key);
        this.ttlMap.delete(key);
        this.stats.misses++;
        this.stats.size = this.cache.size;
        return null;
      }

      this.stats.hits++;
      return entry.value;
    } catch (error) {
      logger.error('Memory cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    try {
      const now = Date.now();
      const expiresAt = ttl > 0 ? now + (ttl * 1000) : null;

      const entry = {
        value,
        expiresAt,
        createdAt: now,
        ttl
      };

      // If key already exists, update stats
      if (!this.cache.has(key)) {
        this.stats.size++;
      }

      this.cache.set(key, entry);
      
      if (expiresAt) {
        this.ttlMap.set(key, expiresAt);
      }

      this.stats.sets++;
      
      logger.debug(`Memory cache set: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      logger.error('Memory cache set error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      const existed = this.cache.has(key);
      
      if (existed) {
        this.cache.delete(key);
        this.ttlMap.delete(key);
        this.stats.size = this.cache.size;
        this.stats.deletes++;
        logger.debug(`Memory cache deleted: ${key}`);
      }
      
      return existed;
    } catch (error) {
      logger.error('Memory cache delete error:', error);
      return false;
    }
  }

  async exists(key) {
    try {
      if (!this.cache.has(key)) {
        return false;
      }

      const entry = this.cache.get(key);
      const now = Date.now();

      // Check if entry has expired
      if (entry.expiresAt && now > entry.expiresAt) {
        this.cache.delete(key);
        this.ttlMap.delete(key);
        this.stats.size = this.cache.size;
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Memory cache exists error:', error);
      return false;
    }
  }

  async clear(pattern = '*') {
    try {
      let deletedCount = 0;
      
      if (pattern === '*') {
        // Clear all entries
        deletedCount = this.cache.size;
        this.cache.clear();
        this.ttlMap.clear();
        this.stats.size = 0;
      } else {
        // Clear entries matching pattern (simple string matching)
        const keysToDelete = [];
        
        for (const key of this.cache.keys()) {
          if (key.includes(pattern.replace('*', ''))) {
            keysToDelete.push(key);
          }
        }
        
        for (const key of keysToDelete) {
          this.cache.delete(key);
          this.ttlMap.delete(key);
          deletedCount++;
        }
        
        this.stats.size = this.cache.size;
      }
      
      logger.info(`Memory cache cleared ${deletedCount} entries for pattern: ${pattern}`);
      return deletedCount;
    } catch (error) {
      logger.error('Memory cache clear error:', error);
      return 0;
    }
  }

  cleanup() {
    try {
      const now = Date.now();
      let cleanedCount = 0;
      
      for (const [key, entry] of this.cache.entries()) {
        if (entry.expiresAt && now > entry.expiresAt) {
          this.cache.delete(key);
          this.ttlMap.delete(key);
          cleanedCount++;
        }
      }
      
      this.stats.size = this.cache.size;
      
      if (cleanedCount > 0) {
        logger.debug(`Memory cache cleanup: removed ${cleanedCount} expired entries`);
      }
    } catch (error) {
      logger.error('Memory cache cleanup error:', error);
    }
  }

  getStats() {
    return {
      ...this.stats,
      hitRate: this.stats.hits + this.stats.misses > 0 
        ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2) + '%'
        : '0%',
      memoryUsage: this.getMemoryUsage(),
      entries: this.cache.size,
      ttlEntries: this.ttlMap.size
    };
  }

  getMemoryUsage() {
    try {
      const usage = process.memoryUsage();
      return {
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + ' MB',
        external: Math.round(usage.external / 1024 / 1024) + ' MB',
        rss: Math.round(usage.rss / 1024 / 1024) + ' MB'
      };
    } catch (error) {
      return { error: 'Unable to get memory usage' };
    }
  }

  // Health check method
  async healthCheck() {
    try {
      // Test basic operations
      const testKey = 'health_check_' + Date.now();
      const testValue = { test: true, timestamp: Date.now() };
      
      await this.set(testKey, testValue, 60);
      const retrieved = await this.get(testKey);
      await this.del(testKey);
      
      if (retrieved && retrieved.test === true) {
        return {
          status: 'healthy',
          message: 'Memory cache is working correctly'
        };
      } else {
        return {
          status: 'unhealthy',
          message: 'Memory cache test failed'
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Memory cache health check failed',
        error: error.message
      };
    }
  }

  // Cleanup on process exit
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
    this.ttlMap.clear();
    logger.info('Memory cache destroyed');
  }
}

// Handle process exit
process.on('SIGINT', () => {
  if (global.memoryCacheService) {
    global.memoryCacheService.destroy();
  }
});

process.on('SIGTERM', () => {
  if (global.memoryCacheService) {
    global.memoryCacheService.destroy();
  }
});

module.exports = MemoryService; 