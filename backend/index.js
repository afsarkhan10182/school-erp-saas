// This is the main entry point for the application
// It's kept minimal as the main logic is in src/server.js

// Load environment variables
require('dotenv').config();

// Deployment verification log
console.log('🚀 Backend deployed successfully! - ' + new Date().toISOString());

// Start the server
require('./src/server');

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully');
  process.exit(0);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully');
  process.exit(0);
});
