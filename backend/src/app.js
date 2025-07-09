const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorHandler');
const { swaggerSpec, swaggerUi } = require('./config/swagger');
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { logger } = require('./utils/logger');
const routes = require('./routes');

// Load environment variables
require('dotenv').config();

class App {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 8000;
    this.apiPrefix = process.env.API_PREFIX || '/api';

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  async initializeDatabase() {
    try {
      await connectDB();
      await connectRedis();
      logger.info('Database and Redis connected successfully');
    } catch (error) {
      logger.error('Failed to connect to database or Redis:', error);
      process.exit(1);
    }
  }

  initializeMiddlewares() {
    // Security headers
    this.app.use(helmet());

    // CORS
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || '*',
      credentials: true,
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later',
    });
    this.app.use(limiter);

    // Request logging
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    }

    // Body parser
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Static files
    this.app.use('/uploads', express.static('uploads'));
  }

  initializeRoutes() {
    // Health check
    this.app.get(`${this.apiPrefix}/health`, (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // API routes
    this.app.use(this.apiPrefix, routes);

    // API documentation
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    });
  }

  initializeErrorHandling() {
    this.app.use(errorHandler);
  }

  async start() {
    await this.initializeDatabase();
    
    this.server = this.app.listen(this.port, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${this.port}`);
      logger.info(`API Documentation available at http://localhost:${this.port}/api-docs`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled Rejection:', err);
      this.server.close(() => process.exit(1));
    });
  }
}

// Start the server
if (require.main === module) {
  const app = new App();
  app.start();
}

module.exports = { App };
