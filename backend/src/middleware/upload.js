const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

// Ensure upload directory exists
const uploadDir = config.uploads?.dir || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedTypes = config.uploads?.allowedMimeTypes || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        httpStatus.BAD_REQUEST,
        `Invalid file type. Only ${allowedTypes.join(', ')} are allowed.`
      ),
      false
    );
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.uploads?.maxFileSize || 5 * 1024 * 1024, // 5MB default
  },
});

// Middleware for handling single file upload
const uploadSingle = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(
          new ApiError(
            httpStatus.BAD_REQUEST,
            `File too large. Max size is ${config.uploads?.maxFileSize || 5 * 1024 * 1024} bytes.`
          )
        );
      }
      return next(new ApiError(httpStatus.BAD_REQUEST, err.message));
    }
    next();
  });
};

// Middleware for handling multiple file uploads
const uploadMultiple = (fieldName, maxCount = 5) => (req, res, next) => {
  upload.array(fieldName, maxCount)(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(
          new ApiError(
            httpStatus.BAD_REQUEST,
            `One or more files are too large. Max size is ${config.uploads?.maxFileSize || 5 * 1024 * 1024} bytes.`
          )
        );
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(
          new ApiError(
            httpStatus.BAD_REQUEST,
            `Maximum ${maxCount} files are allowed.`
          )
        );
      }
      return next(new ApiError(httpStatus.BAD_REQUEST, err.message));
    }
    next();
  });
};

// Middleware for handling multiple fields with files
const uploadFields = (fields) => (req, res, next) => {
  upload.fields(fields)(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(
          new ApiError(
            httpStatus.BAD_REQUEST,
            `One or more files are too large. Max size is ${config.uploads?.maxFileSize || 5 * 1024 * 1024} bytes.`
          )
        );
      }
      return next(new ApiError(httpStatus.BAD_REQUEST, err.message));
    }
    next();
  });
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
};
