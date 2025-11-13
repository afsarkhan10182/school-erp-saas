const express = require('express');
const path = require('path');
const fs = require('fs');
const { resolveUploadsPath } = require('~/utils/shared/pathHelper');
const {
  getSchoolFilePath,
  getSchoolFilePathWithArchive,
  getSchoolCodeFromId,
  getSchoolUploadStats,
  cleanupSchoolUploads
} = require('~/utils/shared/storage');
const { logger } = require('~/utils/shared/logger');
const ApiError = require('~/utils/shared/ApiError');
const httpStatus = require('http-status');
const { verifyToken } = require('~/middleware/core/auth');

const router = express.Router();

/**
 * Serve files from school-specific upload directories (with year)
 * Route: /uploads/schools/:schoolCode/:type/:year/:filename
 */
router.get('/schools/:schoolCode/:type/:year/:filename', verifyToken, async (req, res, next) => {
  try {
    const { schoolCode, type, year, filename } = req.params;
    const userSchoolId = req.user?.school_id;

    // Get user's school code for security check
    let userSchoolCode = null;
    if (userSchoolId) {
      userSchoolCode = await getSchoolCodeFromId(userSchoolId);
    }

    // Security check: Ensure user can only access files from their school
    if (userSchoolCode && userSchoolCode !== schoolCode) {
      return next(
        new ApiError(
          httpStatus.FORBIDDEN,
          'Access denied: You can only access files from your school'
        )
      );
    }

    // Validate upload type
    const allowedTypes = ['documents', 'logos', 'profile-images', 'id-cards', 'certificates', 'report-cards'];
    if (!allowedTypes.includes(type)) {
      return next(new ApiError(httpStatus.BAD_REQUEST, 'Invalid upload type'));
    }

    // Construct file path with archive fallback
    const filePath = getSchoolFilePathWithArchive(schoolCode, type, filename, year);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return next(new ApiError(httpStatus.NOT_FOUND, 'File not found'));
    }

    // Get file stats
    const stats = fs.statSync(filePath);

    // Set appropriate headers
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Last-Modified', stats.mtime.toUTCString());
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    // Set content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain'
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);

    fileStream.on('error', error => {
      logger.error(`Error streaming file ${filePath}:`, error);
      if (!res.headersSent) {
        next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error reading file'));
      }
    });

    fileStream.pipe(res);
  } catch (error) {
    logger.error('Error serving file:', error);
    next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error serving file'));
  }
});

/**
 * Serve files from school-specific upload directories (without year)
 * Route: /uploads/schools/:schoolCode/:type/:filename
 */
router.get('/schools/:schoolCode/:type/:filename', verifyToken, async (req, res, next) => {
  try {
    const { schoolCode, type, filename } = req.params;
    const userSchoolId = req.user?.school_id;

    // Get user's school code for security check
    let userSchoolCode = null;
    if (userSchoolId) {
      userSchoolCode = await getSchoolCodeFromId(userSchoolId);
    }

    // Security check: Ensure user can only access files from their school
    if (userSchoolCode && userSchoolCode !== schoolCode) {
      return next(
        new ApiError(
          httpStatus.FORBIDDEN,
          'Access denied: You can only access files from your school'
        )
      );
    }

    // Validate upload type
    const allowedTypes = ['documents', 'logos', 'profile-images', 'id-cards', 'certificates', 'report-cards'];
    if (!allowedTypes.includes(type)) {
      return next(new ApiError(httpStatus.BAD_REQUEST, 'Invalid upload type'));
    }

    // Construct file path with archive fallback (without year)
    const filePath = getSchoolFilePathWithArchive(schoolCode, type, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return next(new ApiError(httpStatus.NOT_FOUND, 'File not found'));
    }

    // Get file stats
    const stats = fs.statSync(filePath);

    // Set appropriate headers
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Last-Modified', stats.mtime.toUTCString());
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    // Set content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain'
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);

    fileStream.on('error', error => {
      logger.error(`Error streaming file ${filePath}:`, error);
      if (!res.headersSent) {
        next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error reading file'));
      }
    });

    fileStream.pipe(res);
  } catch (error) {
    logger.error('Error serving file:', error);
    next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error serving file'));
  }
});

/**
 * Serve files with legacy flat structure (for backward compatibility)
 * Route: /uploads/:type/:filename
 */
router.get('/:type/:filename', verifyToken, async (req, res, next) => {
  try {
    const { type, filename } = req.params;
    const userSchoolId = req.user?.school_id;

    // Validate upload type
    const allowedTypes = ['documents', 'logos', 'profile-images', 'id-cards', 'certificates', 'report-cards'];
    if (!allowedTypes.includes(type)) {
      return next(new ApiError(httpStatus.BAD_REQUEST, 'Invalid upload type'));
    }

    // Construct legacy file path
    const filePath = resolveUploadsPath(type, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return next(new ApiError(httpStatus.NOT_FOUND, 'File not found'));
    }

    // Get file stats
    const stats = fs.statSync(filePath);

    // Set appropriate headers
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Last-Modified', stats.mtime.toUTCString());
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Set content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain'
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);

    fileStream.on('error', error => {
      logger.error(`Error streaming file ${filePath}:`, error);
      if (!res.headersSent) {
        next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error reading file'));
      }
    });

    fileStream.pipe(res);
  } catch (error) {
    logger.error('Error serving legacy file:', error);
    next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error serving file'));
  }
});

/**
 * Get upload statistics for a school (admin only)
 */
router.get('/stats/:schoolCode', verifyToken, async (req, res, next) => {
  try {
    const { schoolCode } = req.params;
    const userSchoolId = req.user?.school_id;
    const isSuperAdmin = req.user?.role === 'super_admin';

    // Get user's school code for security check
    let userSchoolCode = null;
    if (userSchoolId) {
      userSchoolCode = await getSchoolCodeFromId(userSchoolId);
    }

    // Security check: Only super admin or school admin can access stats
    if (!isSuperAdmin && userSchoolCode !== schoolCode) {
      return next(
        new ApiError(
          httpStatus.FORBIDDEN,
          'Access denied: You can only access stats for your school'
        )
      );
    }

    const stats = getSchoolUploadStats(schoolCode);

    res.json({
      success: true,
      data: {
        schoolCode,
        stats
      }
    });
  } catch (error) {
    logger.error('Error getting upload stats:', error);
    next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error getting upload statistics'));
  }
});

/**
 * Clean up uploads for a school (super admin only)
 */
router.delete('/cleanup/:schoolCode', verifyToken, async (req, res, next) => {
  try {
    const { schoolCode } = req.params;
    const isSuperAdmin = req.user?.role === 'super_admin';

    // Security check: Only super admin can cleanup uploads
    if (!isSuperAdmin) {
      return next(
        new ApiError(httpStatus.FORBIDDEN, 'Access denied: Only super admin can cleanup uploads')
      );
    }

    const success = await cleanupSchoolUploads(schoolCode);

    if (success) {
      res.json({
        success: true,
        message: `Uploads cleaned up for school ${schoolCode}`
      });
    } else {
      res.json({
        success: false,
        message: `Failed to cleanup uploads for school ${schoolCode}`
      });
    }
  } catch (error) {
    logger.error('Error cleaning up uploads:', error);
    next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error cleaning up uploads'));
  }
});

module.exports = router;
