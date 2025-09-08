const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('~/config/config');
const ApiError = require('~/utils/ApiError');
const httpStatus = require('http-status');
const { resolveUploadsPath } = require('~/utils/pathHelper');

// Ensure upload directory exists
const uploadDir = config.uploads?.dir || './uploads';
const resolvedUploadDir = uploadDir.startsWith('./') ? resolveUploadsPath() : uploadDir;

// Safely create upload directory with error handling
try {
  if (!fs.existsSync(resolvedUploadDir)) {
    fs.mkdirSync(resolvedUploadDir, { recursive: true });
  }
} catch (error) {
  console.warn(`Warning: Could not create upload directory at ${resolvedUploadDir}:`, error.message);
  console.warn('Upload functionality may not work properly. Please ensure the directory exists and has proper permissions.');
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subDir = 'documents';
    if (file.fieldname === 'schoolLogo' || file.fieldname === 'receiptLogo' || file.fieldname === 'branchLogos') {
      subDir = 'logos';
    } else if (file.fieldname === 'profile_image' || file.fieldname === 'student_profile_picture' || file.fieldname === 'guardian_picture') {
      subDir = 'profile-images';
    }
    
    const fullPath = path.join(resolvedUploadDir, subDir);
    
    try {
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    } catch (error) {
      console.warn(`Warning: Could not create upload subdirectory at ${fullPath}:`, error.message);
    }
    
    cb(null, fullPath);
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
    'text/csv',
    'application/csv',
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

// Middleware for handling CSV file upload in memory
const uploadCSV = (fieldName) => (req, res, next) => {
  const csvUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['text/csv', 'application/csv'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new ApiError(
            httpStatus.BAD_REQUEST,
            'Invalid file type. Only CSV files are allowed.'
          ),
          false
        );
      }
    },
    limits: {
      fileSize: config.uploads?.maxFileSize || 5 * 1024 * 1024, // 5MB default
    },
  });

  csvUpload.single(fieldName)(req, res, (err) => {
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
  uploadCSV,
  uploadMultiple,
  uploadFields,
};
