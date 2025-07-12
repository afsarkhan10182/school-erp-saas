const { getRedisClient } = require('../config/redis');
const { logger } = require('../utils/logger');
const RedisUtils = require('../utils/redis-utils');

/**
 * Redis-based session management middleware
 * @param {number} ttl - Session TTL in seconds (default: 24 hours)
 * @returns {Function} Express middleware
 */
const sessionMiddleware = (ttl = 86400) => {
  return async (req, res, next) => {
    try {
      // Skip for non-authenticated routes
      if (!req.user) {
        return next();
      }

      const userId = req.user.id;
      const sessionKey = `session:${userId}`;
      
      // Get or create session
      let session = await RedisUtils.get(sessionKey);
      
      if (!session) {
        // Create new session
        session = {
          userId,
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          data: {}
        };
      } else {
        // Update last activity
        session.lastActivity = new Date().toISOString();
        session.ip = req.ip;
        session.userAgent = req.get('User-Agent');
      }

      // Store session in Redis
      await RedisUtils.set(sessionKey, session, ttl);
      
      // Add session to request
      req.session = session;
      
      next();
    } catch (error) {
      logger.error('Session middleware error:', error);
      // Continue without session if Redis fails
      next();
    }
  };
};

/**
 * Get active sessions for a user
 * @param {string} userId - User ID
 * @returns {Array} Active sessions
 */
const getUserSessions = async (userId) => {
  try {
    const sessionKey = `session:${userId}`;
    const session = await RedisUtils.get(sessionKey);
    return session ? [session] : [];
  } catch (error) {
    logger.error('Error getting user sessions:', error);
    return [];
  }
};

/**
 * Invalidate all sessions for a user
 * @param {string} userId - User ID
 */
const invalidateUserSessions = async (userId) => {
  try {
    const sessionKey = `session:${userId}`;
    await RedisUtils.del(sessionKey);
    logger.info(`Invalidated all sessions for user: ${userId}`);
  } catch (error) {
    logger.error('Error invalidating user sessions:', error);
  }
};

/**
 * Get all active sessions (admin only)
 * @returns {Array} All active sessions
 */
const getAllSessions = async () => {
  try {
    const sessionKeys = await RedisUtils.keys('session:*');
    const sessions = [];
    
    for (const key of sessionKeys) {
      const session = await RedisUtils.get(key);
      if (session) {
        sessions.push(session);
      }
    }
    
    return sessions;
  } catch (error) {
    logger.error('Error getting all sessions:', error);
    return [];
  }
};

/**
 * Clean up expired sessions
 */
const cleanupExpiredSessions = async () => {
  try {
    const sessionKeys = await RedisUtils.keys('session:*');
    let cleanedCount = 0;
    
    for (const key of sessionKeys) {
      const session = await RedisUtils.get(key);
      if (session) {
        const lastActivity = new Date(session.lastActivity);
        const now = new Date();
        const hoursSinceActivity = (now - lastActivity) / (1000 * 60 * 60);
        
        // Remove sessions inactive for more than 24 hours
        if (hoursSinceActivity > 24) {
          await RedisUtils.del(key);
          cleanedCount++;
        }
      }
    }
    
    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} expired sessions`);
    }
  } catch (error) {
    logger.error('Error cleaning up expired sessions:', error);
  }
};

module.exports = {
  sessionMiddleware,
  getUserSessions,
  invalidateUserSessions,
  getAllSessions,
  cleanupExpiredSessions
}; 