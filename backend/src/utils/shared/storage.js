const path = require('path');
const fs = require('fs');
const { resolveUploadsPath } = require('./pathHelper');
const { logger } = require('./logger');
const School = require('../../models/administration/school.model');

/**
 * Storage utility for multi-tenant file management
 * Implements school-specific folder structure for SaaS isolation
 */

/**
 * Get school code from school ID
 * @param {string} schoolId - School ID
 * @returns {Promise<string>} School code
 */
async function getSchoolCodeFromId(schoolId) {
  try {
    const school = await School.findByPk(schoolId, {
      attributes: ['code']
    });

    if (!school) {
      throw new Error(`School not found with ID: ${schoolId}`);
    }

    return school.code;
  } catch (error) {
    logger.error(`Failed to get school code for ID ${schoolId}:`, error);
    throw error;
  }
}

/**
 * Get school-specific upload path
 * @param {string} schoolCode - School code (e.g., 'DPS', 'SMHS')
 * @param {string} type - Upload type (documents, logos, profile-images, id-cards)
 * @param {string} year - Optional year for partitioning (YYYY format)
 * @returns {string} Full path to school-specific upload directory
 */
function getSchoolUploadPath(schoolCode, type, year = null) {
  if (!schoolCode) {
    throw new Error('School code is required for upload path');
  }

  const segments = ['schools', schoolCode, type];

  // Add year partitioning if provided
  if (year) {
    segments.splice(-1, 0, year);
  }

  return resolveUploadsPath(...segments);
}

/**
 * Get school-specific file path with filename
 * @param {string} schoolCode - School code
 * @param {string} type - Upload type
 * @param {string} filename - File name
 * @param {string} year - Optional year for partitioning
 * @returns {string} Full file path
 */
function getSchoolFilePath(schoolCode, type, filename, year = null) {
  const dirPath = getSchoolUploadPath(schoolCode, type, year);
  return path.join(dirPath, filename);
}

/**
 * Get file path (logos are never deleted, so no archive fallback needed)
 * @param {string} schoolCode - School code
 * @param {string} type - Upload type
 * @param {string} filename - File name
 * @param {string} year - Optional year for partitioning
 * @returns {string} Full file path
 */
function getSchoolFilePathWithArchive(schoolCode, type, filename, year = null) {
  // Since we never delete logos, just return the current path
  return getSchoolFilePath(schoolCode, type, filename, year);
}

/**
 * Ensure school upload directory exists
 * @param {string} schoolCode - School code
 * @param {string} type - Upload type
 * @param {string} year - Optional year for partitioning
 * @returns {string} Directory path
 */
function ensureSchoolUploadDir(schoolCode, type, year = null) {
  const dirPath = getSchoolUploadPath(schoolCode, type, year);

  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.info(`Created upload directory: ${dirPath}`);
    }
    return dirPath;
  } catch (error) {
    logger.error(`Failed to create upload directory ${dirPath}:`, error);
    throw new Error(`Failed to create upload directory: ${error.message}`);
  }
}

/**
 * Generate unique filename with timestamp and random suffix
 * @param {string} originalName - Original filename
 * @param {string} prefix - Optional prefix for the filename
 * @returns {string} Unique filename
 */
function generateUniqueFilename(originalName, prefix = '') {
  const ext = path.extname(originalName).toLowerCase();
  const timestamp = Date.now();
  const randomSuffix = Math.round(Math.random() * 1e9);
  const baseName = prefix
    ? `${prefix}-${timestamp}-${randomSuffix}`
    : `${timestamp}-${randomSuffix}`;
  return `${baseName}${ext}`;
}

/**
 * Get current year for partitioning
 * @returns {string} Current year in YYYY format
 */
function getCurrentYear() {
  return new Date().getFullYear().toString();
}

/**
 * Move file from old flat structure to school-specific structure
 * @param {string} oldPath - Old file path
 * @param {string} schoolCode - School code
 * @param {string} type - Upload type
 * @param {string} newFilename - New filename (optional)
 * @returns {string} New file path
 */
function migrateFileToSchoolStructure(oldPath, schoolCode, type, newFilename = null) {
  try {
    if (!fs.existsSync(oldPath)) {
      throw new Error(`Source file does not exist: ${oldPath}`);
    }

    const filename = newFilename || path.basename(oldPath);
    const newPath = getSchoolFilePath(schoolCode, type, filename);

    // Ensure target directory exists
    ensureSchoolUploadDir(schoolCode, type);

    // Move file
    fs.renameSync(oldPath, newPath);
    logger.info(`Migrated file from ${oldPath} to ${newPath}`);

    return newPath;
  } catch (error) {
    logger.error(`Failed to migrate file ${oldPath}:`, error);
    throw error;
  }
}

/**
 * Get file URL path for serving files
 * @param {string} schoolCode - School code
 * @param {string} type - Upload type
 * @param {string} filename - Filename
 * @param {string} year - Optional year
 * @returns {string} URL path for file serving
 */
function getFileUrlPath(schoolCode, type, filename, year = null) {
  const segments = ['schools', schoolCode, type];

  if (year) {
    segments.splice(-1, 0, year);
  }

  segments.push(filename);
  return path.join(...segments);
}

/**
 * Clean up school upload directory (for school deletion)
 * @param {string} schoolCode - School code
 * @returns {Promise<boolean>} Success status
 */
async function cleanupSchoolUploads(schoolCode) {
  try {
    const schoolDir = resolveUploadsPath('schools', schoolCode);

    if (fs.existsSync(schoolDir)) {
      fs.rmSync(schoolDir, { recursive: true, force: true });
      logger.info(`Cleaned up uploads for school ${schoolCode}`);
      return true;
    }

    return false;
  } catch (error) {
    logger.error(`Failed to cleanup uploads for school ${schoolCode}:`, error);
    return false;
  }
}

/**
 * Get upload statistics for a school
 * @param {string} schoolCode - School code
 * @returns {Object} Upload statistics
 */
function getSchoolUploadStats(schoolCode) {
  try {
    const schoolDir = resolveUploadsPath('schools', schoolCode);

    if (!fs.existsSync(schoolDir)) {
      return { totalFiles: 0, totalSize: 0, byType: {} };
    }

    const stats = { totalFiles: 0, totalSize: 0, byType: {} };

    function scanDirectory(dir) {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
          scanDirectory(itemPath);
        } else {
          stats.totalFiles++;
          stats.totalSize += stat.size;

          const type = path.basename(path.dirname(itemPath));
          if (!stats.byType[type]) {
            stats.byType[type] = { files: 0, size: 0 };
          }
          stats.byType[type].files++;
          stats.byType[type].size += stat.size;
        }
      }
    }

    scanDirectory(schoolDir);
    return stats;
  } catch (error) {
    logger.error(`Failed to get upload stats for school ${schoolCode}:`, error);
    return { totalFiles: 0, totalSize: 0, byType: {} };
  }
}

/**
 * Delete old profile image file
 * @param {Object} entity - Entity object (user, student, etc.) with school information
 * @param {string} oldImageFilename - Old image filename to delete
 * @param {string} imageType - Type of image (default: "profile-images")
 * @returns {Promise<boolean>} Success status
 */
async function deleteOldProfileImage(entity, oldImageFilename, imageType = 'profile-images') {
  try {
    if (!oldImageFilename) {
      return true;
    }

    // Get school code from entity object
    const schoolCode = entity.school?.code || entity.school_code;

    if (!schoolCode) {
      logger.warn(
        `Cannot delete old ${imageType} - school code not available for entity ${entity.id}`
      );
      return false;
    }

    const year = getCurrentYear();
    const oldFilePath = getSchoolFilePath(schoolCode, imageType, oldImageFilename, year);

    // Check if file exists before trying to delete
    try {
      await fs.promises.access(oldFilePath);
      await fs.promises.unlink(oldFilePath);
      logger.info(`Successfully deleted old ${imageType}: ${oldImageFilename}`);
      return true;
    } catch (fileError) {
      if (fileError.code === 'ENOENT') {
        logger.info(`Old ${imageType} file not found (already deleted): ${oldImageFilename}`);
        return true;
      } else {
        logger.error(`Error accessing/deleting old ${imageType} ${oldImageFilename}:`, fileError);
        return false;
      }
    }
  } catch (error) {
    logger.error(`Error deleting old ${imageType} ${oldImageFilename}:`, error);
    return false;
  }
}

module.exports = {
  getSchoolCodeFromId,
  getSchoolUploadPath,
  getSchoolFilePath,
  getSchoolFilePathWithArchive,
  ensureSchoolUploadDir,
  generateUniqueFilename,
  getCurrentYear,
  migrateFileToSchoolStructure,
  getFileUrlPath,
  cleanupSchoolUploads,
  getSchoolUploadStats,
  deleteOldProfileImage
};
