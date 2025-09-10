// src/utils/pathHelper.js
const path = require('path');

// Get project root 2 levels up from utils folder (backend root)
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

// Get backend root (2 levels up from utils folder)
const BACKEND_ROOT = path.resolve(__dirname, '..', '..');

// Always join paths safely relative to project root
function resolveProjectPath(...segments) {
  return path.join(PROJECT_ROOT, ...segments);
}

// Resolve paths relative to backend root (for uploads, logs, etc.)
function resolveBackendPath(...segments) {
  return path.join(BACKEND_ROOT, ...segments);
}

// Resolve uploads path (now inside backend)
function resolveUploadsPath(...segments) {
  return path.join(BACKEND_ROOT, 'uploads', ...segments);
}

module.exports = {
  PROJECT_ROOT,
  BACKEND_ROOT,
  resolveProjectPath,
  resolveBackendPath,
  resolveUploadsPath
};
