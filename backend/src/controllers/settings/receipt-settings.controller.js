const { logger } = require('../../utils/logger');
const ApiError = require('../../utils/ApiError');

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
      defaultReceiptTitle: 'Fee Receipt',
      showSchoolLogo: true,
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

    // Save receipt settings to school
    const updatedReceiptSettings = {
      schoolName: receiptSettings.schoolName || school.name,
      schoolLogo: schoolLogoFile ? schoolLogoFile.filename : (receiptSettings.schoolLogo || ''),
      defaultReceiptTitle: receiptSettings.defaultReceiptTitle || 'Fee Receipt',
      showSchoolLogo: receiptSettings.showSchoolLogo !== false,
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
          // Find if there's a logo file for this branch
          const branchLogoFile = branchLogoFiles.find(file => 
            file.fieldname === `branchLogos` && 
            file.originalname === branchData.receiptLogo
          );
          
          await Branch.update(
            {
              receipt_name: branchData.receiptName || `${branchData.name} Receipt`,
              receipt_logo: branchLogoFile ? branchLogoFile.filename : (branchData.receiptLogo || ''),
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
