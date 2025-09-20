// src/utils/pathHelper.js
const path = require('path');
const config = require('../../config/config');

// Get project root 4 levels up from utils folder (project root)
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..', '..');

// Get backend root (3 levels up from utils folder)
const BACKEND_ROOT = path.resolve(__dirname, '..', '..', '..');

// Always join paths safely relative to project root
function resolveProjectPath(...segments) {
  return path.join(PROJECT_ROOT, ...segments);
}

// Resolve paths relative to backend root (for uploads, logs, etc.)
function resolveBackendPath(...segments) {
  return path.join(BACKEND_ROOT, ...segments);
}

// Resolve uploads path (config-driven)
function resolveUploadsPath(...segments) {
  const uploadsDir = config.uploads.dir;
  const resolvedDir = uploadsDir.startsWith('./')
    ? path.join(BACKEND_ROOT, uploadsDir.slice(2))
    : uploadsDir;
  return path.join(resolvedDir, ...segments);
}

// Resolve templates path (config-driven)
function resolveTemplatesPath(...segments) {
  const templatesDir = config.templates.dir;
  const resolvedDir = templatesDir.startsWith('./')
    ? path.join(BACKEND_ROOT, templatesDir.slice(2))
    : templatesDir;
  return path.join(resolvedDir, ...segments);
}

module.exports = {
  PROJECT_ROOT,
  BACKEND_ROOT,
  resolveProjectPath,
  resolveBackendPath,
  resolveUploadsPath,
  resolveTemplatesPath
};
