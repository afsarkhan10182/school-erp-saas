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

function resolvePrivateStudyMaterialsPath(...segments) {
  const privateDir = config.uploads.privateStudyMaterialsDir;
  const resolvedDir = privateDir.startsWith('./')
    ? path.join(BACKEND_ROOT, privateDir.slice(2))
    : privateDir;
  const privateRoot = path.resolve(resolvedDir);
  const publicRoot = path.resolve(resolveUploadsPath());
  const relative = path.relative(publicRoot, privateRoot);
  if (!relative || (!relative.startsWith(`..${path.sep}`) && relative !== '..') || path.isAbsolute(relative)) {
    throw new Error('Private study material storage must be outside the public uploads directory');
  }
  return path.join(privateRoot, ...segments);
}

function resolvePrivateReportCardsPath(...segments) {
  const privateDir = config.uploads.privateReportCardsDir;
  const resolvedDir = privateDir.startsWith('./')
    ? path.join(BACKEND_ROOT, privateDir.slice(2))
    : privateDir;
  const privateRoot = path.resolve(resolvedDir);
  const publicRoot = path.resolve(resolveUploadsPath());
  const publicRelative = path.relative(publicRoot, privateRoot);
  if (!publicRelative || (!publicRelative.startsWith(`..${path.sep}`) && publicRelative !== '..') || path.isAbsolute(publicRelative)) {
    throw new Error('Private report-card storage must be outside the public uploads directory');
  }
  const target = path.resolve(privateRoot, ...segments);
  const targetRelative = path.relative(privateRoot, target);
  if (targetRelative.startsWith(`..${path.sep}`) || targetRelative === '..' || path.isAbsolute(targetRelative)) {
    throw new Error('Invalid private report-card path');
  }
  return target;
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
  resolvePrivateStudyMaterialsPath,
  resolvePrivateReportCardsPath,
  resolveTemplatesPath
};
