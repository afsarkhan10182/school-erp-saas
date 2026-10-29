// backend/src/config/config.js
require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

// Critical environment variables that must be present
const requiredEnvs = ['JWT_SECRET'];

// Check for missing environment variables
const missingEnvs = requiredEnvs.filter(key => !process.env[key]);

if (missingEnvs.length > 0) {
  throw new Error(
    `Critical security error: Missing required environment variables: ${missingEnvs.join(', ')}. ` +
      'Please check your .env file.'
  );
}

const redisEnabled = process.env.REDIS_ENABLED !== 'false' && process.env.REDIS_ENABLED !== '0';

const config = {
  app: {
    env,
    port: process.env.PORT && process.env.PORT !== '' ? process.env.PORT : 8000,
    apiPrefix: process.env.API_PREFIX || '/api'
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD, // No default password for security
    name: process.env.DB_NAME || 'school_erp',
    dialect: 'postgres'
  },
  jwt: {
    secret: process.env.JWT_SECRET, // Required, checked above
    accessExpirationMinutes: process.env.JWT_ACCESS_EXPIRATION_MINUTES || 60 * 24, // 24 hours
    refreshExpirationDays: process.env.JWT_REFRESH_EXPIRATION_DAYS || 7 // 7 days
  },
  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
      : ['http://localhost:3000', 'https://school.digitalfuzed.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Type', 'Authorization']
  },
  redis: {
    enabled: redisEnabled,
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD // No default password
  },
  uploads: {
    dir: process.env.UPLOADS_DIR || './uploads',
    privateStudyMaterialsDir: process.env.PRIVATE_STUDY_MATERIALS_DIR || './private-uploads/study-materials',
    privateReportCardsDir: process.env.PRIVATE_REPORT_CARDS_DIR || './private-uploads/report-cards',
    maxFileSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024, // 5MB
    studentImportMaxFileSize: Number(process.env.STUDENT_IMPORT_MAX_FILE_SIZE) || 10 * 1024 * 1024,
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv'
    ]
  },
  templates: {
    dir: process.env.TEMPLATES_DIR || './templates'
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    toFile: process.env.LOG_TO_FILE === 'true',
    file: {
      maxsize: process.env.LOG_FILE_MAXSIZE || 5 * 1024 * 1024, // 5MB
      maxFiles: process.env.LOG_FILE_MAXFILES || 5
    }
  },
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS // No default password
    },
    from: process.env.SMTP_FROM || 'School ERP <noreply@schoolerp.com>'
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  appName: process.env.APP_NAME || 'School ERP',
  supportEmail: process.env.SUPPORT_EMAIL || 'support@schoolerp.com'
};

module.exports = config;
