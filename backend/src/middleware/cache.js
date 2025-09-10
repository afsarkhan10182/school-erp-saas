const { getRedisClient, isRedisEnabled } = require('~/config/redis');
const { logger } = require('~/utils/logger');
const { safeMiddleware, robustMiddleware } = require('./robust');

/**
 * Redis-based caching middleware
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 * @param {string} prefix - Cache key prefix (default: 'cache')
 * @returns {Function} Express middleware
 */
const cacheMiddleware = (ttl = 300, prefix = 'cache') => {
  const cacheLogic = async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching for authenticated routes that need fresh data
    if (req.user) {
      return next();
    }

    // Skip if Redis is disabled or not connected
    if (!isRedisEnabled() || !getRedisClient()) {
      logger.debug('Redis is disabled or not connected, skipping cache for:', req.originalUrl);
      return next();
    }

    try {
      const redisClient = getRedisClient();
      if (!redisClient) {
        logger.debug('Redis client not available, skipping cache for:', req.originalUrl);
        return next();
      }

      const cacheKey = `${prefix}:${req.originalUrl}`;

      // Try to get cached response
      const cachedResponse = await redisClient.get(cacheKey);

      if (cachedResponse) {
        logger.debug(`Cache hit for: ${req.originalUrl}`);
        try {
          const parsed = JSON.parse(cachedResponse);
          return res.status(parsed.status || 200).json(parsed.data);
        } catch (parseError) {
          logger.warn(
            'Failed to parse cached response, continuing without cache:',
            parseError.message
          );
          // Continue without cache if parsing fails
        }
      }

      // Cache miss - store original send method
      const originalSend = res.json;

      // Override res.json to cache the response
      res.json = function (data) {
        // Restore original method
        res.json = originalSend;

        // Cache the response (non-blocking)
        const responseToCache = {
          status: res.statusCode,
          data: data,
          timestamp: new Date().toISOString()
        };

        // Use set with EX option for newer Redis client (non-blocking)
        // Wrap in try-catch to prevent Redis errors from breaking the response
        try {
          redisClient
            .set(cacheKey, JSON.stringify(responseToCache), { EX: ttl })
            .catch(err => logger.error('Cache storage error:', err));
        } catch (redisError) {
          logger.warn('Redis not available for caching response:', redisError.message);
        }

        // Send the response
        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      logger.warn('Redis cache not available, proceeding without caching:', error.message);
      next();
    }
  };

  // Wrap with safe middleware to prevent server hangs
  return safeMiddleware(cacheLogic, 'Cache Middleware');
};

/**
 * Clear cache for specific patterns
 * @param {string} pattern - Redis key pattern to clear
 */
const clearCache = async (pattern = 'cache:*') => {
  try {
    if (!isRedisEnabled() || !getRedisClient()) {
      logger.debug('Redis is disabled or not connected, skipping clearCache for pattern:', pattern);
      return;
    }
    const redisClient = getRedisClient();
    if (!redisClient) {
      logger.debug('Redis client not available, skipping clearCache for pattern:', pattern);
      return;
    }

    const keys = await redisClient.keys(pattern);

    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info(`Cleared ${keys.length} cache entries for pattern: ${pattern}`);
    }
  } catch (error) {
    logger.warn('Redis cache clearing failed, continuing without cache clearing:', error.message);
    // Don't throw - cache clearing should not break the application
  }
};

/**
 * Clear cache for specific school
 * @param {string} schoolId - School ID to clear cache for
 */
const clearSchoolCache = async schoolId => {
  try {
    await clearCache(`cache:*school*${schoolId}*`);
    await clearCache(`cache:*branch*${schoolId}*`);
  } catch (error) {
    logger.error('Error clearing school cache:', error);
  }
};

/**
 * Clear cache for specific user
 * @param {string} userId - User ID to clear cache for
 */
const clearUserCache = async userId => {
  try {
    await clearCache(`cache:*user*${userId}*`);
  } catch (error) {
    logger.error('Error clearing user cache:', error);
  }
};

/**
 * Cache middleware with circuit breaker
 * Prevents cache failures from breaking the application
 */
const safeCacheMiddleware = (ttl = 300, prefix = 'cache') => {
  return robustMiddleware(cacheMiddleware(ttl, prefix), {
    name: 'Safe Cache Middleware',
    critical: false, // Cache is not critical
    timeout: 5000, // 5 second timeout for cache operations
    fallback: (req, res, next) => {
      // Fallback: continue without caching
      logger.warn('Cache middleware failed, continuing without cache');
      next();
    }
  });
};

module.exports = {
  cacheMiddleware,
  safeCacheMiddleware,
  clearCache,
  clearSchoolCache,
  clearUserCache
};
