const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler, notFoundHandler, gracefulShutdown } = require('./middleware/errorHandler');
const { swaggerSpec, swaggerUi } = require('./config/swagger');
const { testConnection } = require('./config/database');
const { connectRedis, isRedisEnabled } = require('./config/redis');
const { logger } = require('./utils/logger');
const routes = require('./routes');

// Load environment variables
require('dotenv').config();

class App {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 8000;
    this.apiPrefix = process.env.API_PREFIX || '/api';
    this.server = null;

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  async initializeDatabase() {
    try {
      await testConnection();
      logger.info('Database connected successfully');
      
      // Try to connect Redis, but don't fail if it doesn't work
      if (isRedisEnabled()) {
        try {
          await connectRedis();
          logger.info('Redis connected successfully');
        } catch (redisError) {
          logger.warn('Redis connection failed, continuing without Redis:', redisError.message);
          logger.info('Application will run with reduced functionality (no caching)');
        }
      } else {
        logger.info('Redis is disabled, application will run without Redis');
      }
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      process.exit(1);
    }
  }

  initializeMiddlewares() {
    // Security headers
    this.app.use(helmet());

    // CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    }));

    // Request logging
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    }

    // Body parser for JSON with size limits
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req, res, buf) => {
        // Only verify JSON if there's actually content to parse
        if (buf && buf.length > 0) {
          try {
            JSON.parse(buf);
          } catch (e) {
            throw new Error('Invalid JSON');
          }
        }
      }
    }));
    
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb' 
    }));

    // Cookie parser for auth tokens
    this.app.use(require('cookie-parser')());

    // Static files
    this.app.use('/uploads', express.static('uploads'));
  }

  initializeRoutes() {
    // Health check
    this.app.get(`${this.apiPrefix}/health`, (req, res) => {
      console.log('Health route hit');
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // API routes
    this.app.use(this.apiPrefix, routes);

    // API documentation
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // 404 handler - must be before error handler
    this.app.use(notFoundHandler);
  }

  initializeErrorHandling() {
    // Global error handler - must be last
    this.app.use(errorHandler);
  }

  async start() {
    try {
      console.log('Before initializeDatabase');
      await this.initializeDatabase();    console.log('After initializeDatabase, before app.listen');

      
      this.server = this.app.listen(this.port, () => {
        logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${this.port}`);
        logger.info(`API Documentation available at http://localhost:${this.port}/api-docs`);
        logger.info(`Health check available at http://localhost:${this.port}${this.apiPrefix}/health`);
        logger.info('Rate limiting completely disabled for all environments');
      });

      // Setup graceful shutdown
      const shutdown = gracefulShutdown(this.server);
      process.on('SIGTERM', shutdown);
      process.on('SIGINT', shutdown);

      // Handle unhandled promise rejections
      process.on('unhandledRejection', (err) => {
        logger.error('Unhandled Rejection:', err);
        if (this.server) {
          this.server.close(() => {
            logger.error('Server closed due to unhandled rejection');
            process.exit(1);
          });
        } else {
          process.exit(1);
        }
      });

      // Handle uncaught exceptions
      process.on('uncaughtException', (err) => {
        logger.error('Uncaught Exception:', err);
        if (this.server) {
          this.server.close(() => {
            logger.error('Server closed due to uncaught exception');
            process.exit(1);
          });
        } else {
          process.exit(1);
        }
      });

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  // Method to gracefully stop the server
  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          logger.info('Server stopped gracefully');
          resolve();
        });
      });
    }
  }
}

// Start the server
if (require.main === module) {
  const app = new App();
  app.start();
}

module.exports = { App };
