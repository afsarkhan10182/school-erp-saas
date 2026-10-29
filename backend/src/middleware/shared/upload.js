const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('~/config/config');
const ApiError = require('~/utils/shared/ApiError');
const httpStatus = require('http-status');
const { resolveUploadsPath } = require('~/utils/shared/pathHelper');
const {
  getSchoolCodeFromId,
  getSchoolUploadPath,
  ensureSchoolUploadDir,
  generateUniqueFilename,
  getCurrentYear
} = require('~/utils/shared/storage');

// Ensure upload directory exists
const uploadDir = config.uploads?.dir || './uploads';
const resolvedUploadDir = uploadDir.startsWith('./') ? resolveUploadsPath() : uploadDir;

// Safely create upload directory with error handling
try {
  if (!fs.existsSync(resolvedUploadDir)) {
    fs.mkdirSync(resolvedUploadDir, { recursive: true });
  }
} catch (error) {
  console.warn(
    `Warning: Could not create upload directory at ${resolvedUploadDir}:`,
    error.message
  );
  console.warn(
    'Upload functionality may not work properly. Please ensure the directory exists and has proper permissions.'
  );
}

// Configure storage with school-specific paths
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      // Get school ID from request (should be set by auth middleware)
      const schoolId = req.schoolId || req.user?.school_id || req.school_id;

      if (!schoolId) {
        return cb(new Error('School ID is required for file uploads'), null);
      }

      // Get school code from school ID
      const schoolCode = await getSchoolCodeFromId(schoolId);

      // Determine upload type based on field name
      let uploadType = 'documents'; // Default to documents
      if (
        file.fieldname === 'schoolLogo' ||
        file.fieldname === 'receiptLogo' ||
        file.fieldname === 'branchLogos'
      ) {
        uploadType = 'logos';
      } else if (
        file.fieldname === 'profile_image' ||
        file.fieldname === 'student_profile_picture' ||
        file.fieldname === 'guardian_picture'
      ) {
        uploadType = 'profile-images';
      } else if (file.fieldname === 'id_card' || file.fieldname === 'student_id_card') {
        uploadType = 'id-cards';
      } else if (
        file.fieldname === 'logo_image' ||
        file.fieldname === 'signature_image' ||
        file.fieldname === 'background_image'
      ) {
        uploadType = 'certificates'; // Certificate template images go to certificates folder
      } else if (file.fieldname === 'report_card_design') {
        uploadType = 'report-cards'; // Report card design images go to report-cards folder
      }

      // Get current year for partitioning (optional)
      const year = getCurrentYear();

      req.uploadMetadata = { schoolCode, type: uploadType, year };

      // Ensure school-specific directory exists
      const fullPath = ensureSchoolUploadDir(schoolCode, uploadType, year);

      cb(null, fullPath);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    try {
      const filename = generateUniqueFilename(file.originalname, file.fieldname);
      cb(null, filename);
    } catch (error) {
      cb(error, null);
    }
  }
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
    'application/csv'
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
    fileSize: config.uploads?.maxFileSize || 5 * 1024 * 1024 // 5MB default
  }
});

// Middleware for handling single file upload
const uploadSingle = fieldName => (req, res, next) => {
  upload.single(fieldName)(req, res, err => {
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
const uploadCSV = (
  fieldName,
  { spreadsheets = false, maxFileSize = config.uploads?.maxFileSize || 5 * 1024 * 1024 } = {}
) => (req, res, next) => {
  const csvUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['text/csv', 'application/csv'];
      if (spreadsheets) {
        allowedTypes.push(
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/octet-stream'
        );
      }
      const extension = path.extname(file.originalname).toLowerCase();
      const allowedExtensions = spreadsheets ? ['.csv', '.xls', '.xlsx'] : ['.csv'];
      if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(extension)) {
        cb(null, true);
      } else {
        cb(
          new ApiError(
            httpStatus.BAD_REQUEST,
            `Invalid file type. Only ${allowedExtensions.join(', ')} files are allowed.`
          ),
          false
        );
      }
    },
    limits: {
      fileSize: maxFileSize
    }
  });

  csvUpload.single(fieldName)(req, res, err => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(
          new ApiError(
            httpStatus.BAD_REQUEST,
            `File too large. Max size is ${maxFileSize} bytes.`
          )
        );
      }
      return next(new ApiError(httpStatus.BAD_REQUEST, err.message));
    }
    next();
  });
};

// Middleware for handling multiple file uploads
const uploadMultiple =
  (fields, maxFiles = 10) =>
  (req, res, next) => {
    upload.fields(fields)(req, res, err => {
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
            new ApiError(httpStatus.BAD_REQUEST, `Maximum ${maxFiles} files are allowed in total.`)
          );
        }
        if (err.code === 'LIMIT_FIELD_COUNT') {
          return next(new ApiError(httpStatus.BAD_REQUEST, `Too many fields in the form.`));
        }
        if (err.code === 'LIMIT_PART_COUNT') {
          return next(new ApiError(httpStatus.BAD_REQUEST, `Too many parts in the form.`));
        }
        return next(new ApiError(httpStatus.BAD_REQUEST, err.message));
      }
      next();
    });
  };

// Middleware for handling multiple fields with files
const uploadFields = fields => (req, res, next) => {
  upload.fields(fields)(req, res, err => {
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
  uploadFields
};
