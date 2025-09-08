const helmet = require('helmet');
const hpp = require('hpp');
const cors = require('cors');
const config = require('~/config/config');

/**
 * Security middleware that sets various HTTP headers
 * Uses helmet for setting security headers
 * Implements CORS, HPP protection, and other security measures
 */
const securityMiddleware = [
  // Set security HTTP headers
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        fontSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https:'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for now, enable if needed
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-site' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    xssFilter: true,
  }),

  // Enable CORS
  cors({
    origin: config.cors.origin,
    methods: config.cors.methods,
    allowedHeaders: config.cors.allowedHeaders,
    credentials: config.cors.credentials,
    maxAge: 600, // 10 minutes
  }),

  // Prevent HTTP Parameter Pollution
  hpp({
    whitelist: [
      'page',
      'limit',
      'sort',
      'fields',
      'search',
      'filter',
      'populate',
    ],
  }),

  // Prevent XSS attacks
  (req, res, next) => {
    // Remove X-Powered-By header
    res.removeHeader('X-Powered-By');
    
    // Set X-Content-Type-Options header
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Set X-Frame-Options header
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Set X-XSS-Protection header
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Set Referrer-Policy header
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Set Permissions-Policy header
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    );
    
    next();
  },
];

module.exports = securityMiddleware;
