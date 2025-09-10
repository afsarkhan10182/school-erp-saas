const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('~/utils/logger');
const { resolveUploadsPath } = require('~/utils/pathHelper');
const {
  getSchoolCodeFromId,
  getSchoolUploadPath,
  ensureSchoolUploadDir,
  generateUniqueFilename,
  getCurrentYear,
  getFileUrlPath
} = require('~/utils/storage');

// Configure multer for school-specific file uploads
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      // Get school ID from request
      const schoolId = req.user?.school_id || req.school_id;

      if (!schoolId) {
        return cb(new Error('School ID is required for document uploads'), null);
      }

      // Get school code from school ID
      const schoolCode = await getSchoolCodeFromId(schoolId);

      // Ensure school-specific documents directory exists
      const year = getCurrentYear();
      const uploadDir = ensureSchoolUploadDir(schoolCode, 'documents', year);

      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: function (req, file, cb) {
    try {
      const filename = generateUniqueFilename(file.originalname, 'document');
      cb(null, filename);
    } catch (error) {
      cb(error, null);
    }
  }
});

const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, images, and Word documents are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * Upload student documents
 */
const uploadStudentDocuments = async (req, res) => {
  try {
    const { student_id, document_type } = req.body;

    if (!student_id || !document_type) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and document type are required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Get school ID and code for file URL generation
    const schoolId = req.user?.school_id || req.school_id;
    const schoolCode = await getSchoolCodeFromId(schoolId);
    const year = getCurrentYear();

    // Generate file URL path for serving
    const fileUrlPath = getFileUrlPath(schoolCode, 'documents', req.file.filename, year);

    // Document metadata
    const documentData = {
      id: uuidv4(),
      student_id,
      document_type,
      file_name: req.file.originalname,
      file_path: req.file.path,
      file_url_path: fileUrlPath, // Add URL path for serving
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      uploaded_at: new Date(),
      uploaded_by: req.user.id,
      school_id: schoolId // Add school ID for tenant isolation
    };

    // Here you would typically save to database
    // For now, we'll return the document info

    logger.info(
      `Document uploaded successfully: ${documentData.file_name} for student ${student_id}`
    );

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        document_id: documentData.id,
        file_name: documentData.file_name,
        document_type: documentData.document_type,
        file_size: documentData.file_size,
        uploaded_at: documentData.uploaded_at
      }
    });
  } catch (error) {
    logger.error('Error uploading document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message
    });
  }
};

/**
 * Get student documents
 */
const getStudentDocuments = async (req, res) => {
  try {
    const { student_id } = req.params;

    if (!student_id) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    // Here you would typically fetch from database
    // For now, we'll return mock data
    const documents = [
      {
        id: uuidv4(),
        student_id,
        document_type: 'birth_certificate',
        file_name: 'birth_certificate.pdf',
        file_size: 1024000,
        uploaded_at: new Date(),
        status: 'verified'
      },
      {
        id: uuidv4(),
        student_id,
        document_type: 'transfer_certificate',
        file_name: 'transfer_certificate.pdf',
        file_size: 2048000,
        uploaded_at: new Date(),
        status: 'pending'
      }
    ];

    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    logger.error('Error fetching student documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents',
      error: error.message
    });
  }
};

/**
 * Delete student document
 */
const deleteStudentDocument = async (req, res) => {
  try {
    const { document_id } = req.params;

    if (!document_id) {
      return res.status(400).json({
        success: false,
        message: 'Document ID is required'
      });
    }

    // Here you would typically delete from database and filesystem
    // For now, we'll just return success

    logger.info(`Document deleted: ${document_id}`);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: error.message
    });
  }
};

/**
 * Verify student document
 */
const verifyStudentDocument = async (req, res) => {
  try {
    const { document_id } = req.params;
    const { status, remarks } = req.body;

    if (!document_id || !status) {
      return res.status(400).json({
        success: false,
        message: 'Document ID and status are required'
      });
    }

    // Here you would typically update the document status in database

    logger.info(`Document ${document_id} status updated to: ${status}`);

    res.json({
      success: true,
      message: 'Document verification status updated',
      data: {
        document_id,
        status,
        remarks,
        verified_by: req.user.id,
        verified_at: new Date()
      }
    });
  } catch (error) {
    logger.error('Error verifying document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify document',
      error: error.message
    });
  }
};

module.exports = {
  upload,
  uploadStudentDocuments,
  getStudentDocuments,
  deleteStudentDocument,
  verifyStudentDocument
};
