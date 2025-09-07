const { logger } = require('../../utils/logger');
const ApiError = require('../../utils/ApiError');
const fs = require('fs');
const path = require('path');
const { resolveUploadsPath } = require('../../utils/pathHelper');

// Helper function to archive old logo files (move to archive folder instead of deleting)
const archiveOldLogoFile = (filename) => {
  if (!filename) return;
  try {
    const logoPath = path.join(resolveUploadsPath('logos'), filename);
    const archiveDir = path.join(resolveUploadsPath('logos'), 'archive');
    
    // Create archive directory if it doesn't exist
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }
    
    if (fs.existsSync(logoPath)) {
      const archivePath = path.join(archiveDir, filename);
      
      // If file already exists in archive, add timestamp to avoid conflicts
      if (fs.existsSync(archivePath)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const nameWithoutExt = path.parse(filename).name;
        const ext = path.parse(filename).ext;
        const newFilename = `${nameWithoutExt}_${timestamp}${ext}`;
        const newArchivePath = path.join(archiveDir, newFilename);
        fs.renameSync(logoPath, newArchivePath);
        logger.info(`Archived old logo file: ${filename} -> ${newFilename}`);
      } else {
        fs.renameSync(logoPath, archivePath);
        logger.info(`Archived old logo file: ${filename}`);
      }
    }
  } catch (error) {
    logger.warn(`Failed to archive old logo file ${filename}:`, error.message);
  }
};

// Helper function to clean up orphaned logo files
const cleanupOrphanedLogos = async () => {
  try {
    const { School, Branch } = require('../../models');
    
    // Get all schools and their logo filenames
    const schools = await School.findAll({
      attributes: ['receipt_settings']
    });
    
    // Get all branches and their logo filenames
    const branches = await Branch.findAll({
      attributes: ['receipt_logo']
    });
    
    // Collect all valid logo filenames
    const validLogos = new Set();
    
    schools.forEach(school => {
      const settings = school.receipt_settings || {};
      if (settings.schoolLogo) validLogos.add(settings.schoolLogo);
      if (settings.receiptLogo) validLogos.add(settings.receiptLogo);
    });
    
    branches.forEach(branch => {
      if (branch.receipt_logo) validLogos.add(branch.receipt_logo);
    });
    
    // Get all files in logos directory (excluding archive folder)
    const logosDir = resolveUploadsPath('logos');
    if (fs.existsSync(logosDir)) {
      const files = fs.readdirSync(logosDir).filter(file => {
        const filePath = path.join(logosDir, file);
        return fs.statSync(filePath).isFile(); // Only process files, not directories
      });
      
      // Archive orphaned files instead of deleting them
      files.forEach(file => {
        if (!validLogos.has(file)) {
          const filePath = path.join(logosDir, file);
          try {
            archiveOldLogoFile(file);
            logger.info(`Archived orphaned logo file: ${file}`);
          } catch (error) {
            logger.warn(`Failed to archive orphaned logo file ${file}:`, error.message);
          }
        }
      });
    }
  } catch (error) {
    logger.error('Error cleaning up orphaned logos:', error);
  }
};

/**
 * Get receipt settings for a school
 */
const getReceiptSettings = async (req, res, next) => {
  try {
    const { School, Branch } = require('../../models');
    
    // Get school ID from context or user
    const schoolId = req.schoolId || req.user?.school_id;
    
    if (!schoolId) {
      throw new ApiError(400, 'School context is required');
    }
    
    // Get school configuration
    const school = await School.findByPk(schoolId, {
      attributes: [
        'id', 'name', 'code', 'logo', 'address', 'phone', 'email', 'website',
        'receipt_settings'
      ]
    });

    if (!school) {
      throw new ApiError(404, 'School not found');
    }

    // Get all branches for this school
    const branches = await Branch.findAll({
      where: { school_id: schoolId },
      attributes: [
        'id', 'name', 'code', 'address', 'phone', 'email',
        'receipt_name', 'receipt_logo', 'receipt_address', 'receipt_contact'
      ],
      order: [['name', 'ASC']]
    });

    // Parse receipt settings from school
    let receiptSettings = {
      schoolName: school.name,
      schoolLogo: school.logo || '',
      receiptLogo: '',
      trustName: 'HAJI OMAR MOOSA EDUCATIONAL TRUST',
      defaultReceiptTitle: 'Fee Receipt',
      showSchoolLogo: true,
      showReceiptLogo: true,
      showSchoolAddress: true,
      showSchoolContact: true,
      showBranchInfo: true,
      receiptFooter: '',
      branchSpecificSettings: []
    };

    // If school has custom receipt settings, merge them with defaults
    if (school.receipt_settings && Object.keys(school.receipt_settings).length > 0) {
      receiptSettings = { ...receiptSettings, ...school.receipt_settings };
    }

    // Map branches to include receipt-specific fields
    const branchesWithReceiptSettings = branches.map(branch => ({
      id: branch.id,
      name: branch.name,
      code: branch.code,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
      receiptName: branch.receipt_name || `${branch.name} Receipt`,
      receiptLogo: branch.receipt_logo || '',
      receiptAddress: branch.receipt_address || branch.address || '',
      receiptContact: branch.receipt_contact || branch.phone || ''
    }));

    return res.status(200).json({
      success: true,
      message: 'Receipt settings retrieved successfully',
      data: {
        receiptSettings,
        branches: branchesWithReceiptSettings
      }
    });

  } catch (error) {
    logger.error('Error getting receipt settings:', error);
    return next(error);
  }
};

/**
 * Update receipt settings for a school
 */
const updateReceiptSettings = async (req, res, next) => {
  try {
    const { School, Branch } = require('../../models');
    const { receiptSettings, branches } = req.body;
    
    // Handle uploaded files
    const uploadedFiles = req.files || {};
    const schoolLogoFile = uploadedFiles.schoolLogo?.[0];
    const receiptLogoFile = uploadedFiles.receiptLogo?.[0];
    const branchLogoFiles = uploadedFiles.branchLogos || [];

    if (!receiptSettings) {
      throw new ApiError(400, 'Receipt settings are required');
    }

    // Update school receipt settings
    const schoolId = req.schoolId || req.user?.school_id;
    
    if (!schoolId) {
      throw new ApiError(400, 'School context is required');
    }
    
    const school = await School.findByPk(schoolId);
    if (!school) {
      throw new ApiError(404, 'School not found');
    }

    // Get current settings to check for old logo files
    const currentSettings = school.receipt_settings || {};
    
    // Archive old logo files if new ones are being uploaded
    if (schoolLogoFile && currentSettings.schoolLogo) {
      archiveOldLogoFile(currentSettings.schoolLogo);
    }
    if (receiptLogoFile && currentSettings.receiptLogo) {
      archiveOldLogoFile(currentSettings.receiptLogo);
    }

    // Save receipt settings to school
    const updatedReceiptSettings = {
      schoolName: receiptSettings.schoolName || school.name,
      schoolLogo: schoolLogoFile ? schoolLogoFile.filename : (receiptSettings.schoolLogo !== undefined ? receiptSettings.schoolLogo : currentSettings.schoolLogo || ''),
      receiptLogo: receiptLogoFile ? receiptLogoFile.filename : (receiptSettings.receiptLogo !== undefined ? receiptSettings.receiptLogo : currentSettings.receiptLogo || ''),
      trustName: receiptSettings.trustName || 'HAJI OMAR MOOSA EDUCATIONAL TRUST',
      defaultReceiptTitle: receiptSettings.defaultReceiptTitle || 'Fee Receipt',
      showSchoolLogo: receiptSettings.showSchoolLogo !== false,
      showReceiptLogo: receiptSettings.showReceiptLogo !== false,
      showSchoolAddress: receiptSettings.showSchoolAddress !== false,
      showSchoolContact: receiptSettings.showSchoolContact !== false,
      showBranchInfo: receiptSettings.showBranchInfo !== false,
      receiptFooter: receiptSettings.receiptFooter || ''
    };

    await school.update({
      receipt_settings: updatedReceiptSettings // JSONB/JSON fields are automatically serialized
    });

    // Update branch-specific receipt settings
    if (branches && Array.isArray(branches)) {
      for (const branchData of branches) {
        if (branchData.id) {
          // Get current branch to check for old logo
          const currentBranch = await Branch.findByPk(branchData.id);
          
          // Find if there's a logo file for this branch
          const branchLogoFile = branchLogoFiles.find(file => 
            file.fieldname === `branchLogos` && 
            file.originalname === branchData.receiptLogo
          );
          
          // Archive old branch logo if new one is being uploaded
          if (branchLogoFile && currentBranch?.receipt_logo) {
            archiveOldLogoFile(currentBranch.receipt_logo);
          }
          
          await Branch.update(
            {
              receipt_name: branchData.receiptName || `${branchData.name} Receipt`,
              receipt_logo: branchLogoFile ? branchLogoFile.filename : (branchData.receiptLogo !== undefined ? branchData.receiptLogo : (currentBranch?.receipt_logo || '')),
              receipt_address: branchData.receiptAddress || branchData.address || '',
              receipt_contact: branchData.receiptContact || branchData.phone || ''
            },
            {
              where: {
                id: branchData.id,
                school_id: schoolId
              }
            }
          );
        }
      }
    }

    // Clean up orphaned logo files
    await cleanupOrphanedLogos();

    logger.info(`Receipt settings updated for school ${schoolId}`);

    return res.status(200).json({
      success: true,
      message: 'Receipt settings updated successfully',
      data: {
        receiptSettings: updatedReceiptSettings
      }
    });

  } catch (error) {
    logger.error('Error updating receipt settings:', error);
    return next(error);
  }
};

module.exports = {
  getReceiptSettings,
  updateReceiptSettings
};
