const { logger } = require('./logger');
const RedisUtils = require('./redis-utils');

class MonitoringService {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      slowRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      databaseQueries: 0,
      redisOperations: 0
    };
    this.startTime = Date.now();
  }

  // Track request metrics
  trackRequest(duration, statusCode, path) {
    this.metrics.requests++;
    
    if (statusCode >= 400) {
      this.metrics.errors++;
    }
    
    if (duration > 1000) { // 1 second
      this.metrics.slowRequests++;
      logger.warn('Slow request detected', {
        path,
        duration: `${duration}ms`,
        statusCode
      });
    }
  }

  // Track cache performance
  trackCacheHit() {
    this.metrics.cacheHits++;
  }

  trackCacheMiss() {
    this.metrics.cacheMisses++;
  }

  // Track database operations
  trackDatabaseQuery() {
    this.metrics.databaseQueries++;
  }

  // Track Redis operations
  trackRedisOperation() {
    this.metrics.redisOperations++;
  }

  // Get current metrics
  getMetrics() {
    const uptime = Date.now() - this.startTime;
    const errorRate = this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests) * 100 : 0;
    const cacheHitRate = (this.metrics.cacheHits + this.metrics.cacheMisses) > 0 
      ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100 
      : 0;

    return {
      ...this.metrics,
      uptime: `${Math.floor(uptime / 1000)}s`,
      errorRate: `${errorRate.toFixed(2)}%`,
      cacheHitRate: `${cacheHitRate.toFixed(2)}%`,
      requestsPerSecond: this.metrics.requests / (uptime / 1000)
    };
  }

  // Health check with detailed metrics
  async getHealthStatus() {
    const metrics = this.getMetrics();
    const redisHealth = await this.checkRedisHealth();
    const memoryUsage = process.memoryUsage();

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: metrics.uptime,
      metrics,
      redis: redisHealth,
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024)
      }
    };
  }

  // Check Redis health with detailed metrics
  async checkRedisHealth() {
    try {
      const startTime = Date.now();
      const isAvailable = await RedisUtils.exists('health_check');
      const responseTime = Date.now() - startTime;

      return {
        status: isAvailable ? 'healthy' : 'degraded',
        responseTime: `${responseTime}ms`,
        available: isAvailable
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        available: false
      };
    }
  }

  // Reset metrics (useful for testing)
  resetMetrics() {
    this.metrics = {
      requests: 0,
      errors: 0,
      slowRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      databaseQueries: 0,
      redisOperations: 0
    };
    this.startTime = Date.now();
  }
}

// Export singleton instance
module.exports = new MonitoringService(); 