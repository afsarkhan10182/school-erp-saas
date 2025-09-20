const { logger } = require('~/utils/shared/logger');
const ApiError = require('~/utils/shared/ApiError');

/**
 * Get fee settings for a school
 */
const getFeeSettings = async (req, res, next) => {
  try {
    const { School } = require('~/models');

    // Get school ID from context or user
    const schoolId = req.schoolId || req.user?.school_id;

    if (!schoolId) {
      throw new ApiError(400, 'School context is required');
    }

    // Get school configuration
    const school = await School.findByPk(schoolId, {
      attributes: ['id', 'name', 'code', 'currency', 'timezone', 'date_format', 'fee_settings']
    });

    if (!school) {
      throw new ApiError(404, 'School not found');
    }

    // Default fee settings
    let feeSettings = {
      defaultCurrency: school.currency || 'INR',
      currencySymbol: school.currency === 'INR' ? '₹' : '$',
      academicYearStartMonth: 6, // Default to June
      defaultPaymentDueDays: 15,
      defaultPaymentModel: 'monthly',
      defaultInstallmentsCount: 4,
      defaultMonthlyMonths: 12,
      lateFeePercentage: 5.0,
      paymentMethods: {
        cash: true,
        bank_transfer: true,
        cheque: true,
        online: false
      },
      paymentValidation: {
        requireTransactionId: false,
        allowPartialPayments: true,
        autoGenerateReceipts: true
      },
      defaultCategories: {
        tuition: 'Tuition Fees',
        transportation: 'Transportation Fees',
        library: 'Library Fees',
        laboratory: 'Laboratory Fees'
      },
      feeTypeOptions: {
        oneTime: 'One-time',
        recurring: 'Recurring',
        variable: 'Variable',
        optional: 'Optional'
      },
      invoiceSettings: {
        prefix: 'INV',
        receiptPrefix: 'RCP',
        autoGenerateNumbers: true,
        dueDateCalculation: 'fixed_days'
      }
    };

    // If school has custom fee settings, merge them with defaults
    if (school.fee_settings && Object.keys(school.fee_settings).length > 0) {
      feeSettings = { ...feeSettings, ...school.fee_settings };
    }

    return res.status(200).json({
      success: true,
      message: 'Fee settings retrieved successfully',
      data: {
        feeSettings
      }
    });
  } catch (error) {
    logger.error('Error getting fee settings:', error);
    return next(error);
  }
};

/**
 * Update fee settings for a school
 */
const updateFeeSettings = async (req, res, next) => {
  try {
    const { School } = require('~/models');
    const { feeSettings } = req.body;

    if (!feeSettings) {
      throw new ApiError(400, 'Fee settings are required');
    }

    // Update school fee settings
    const schoolId = req.schoolId || req.user?.school_id;

    if (!schoolId) {
      throw new ApiError(400, 'School context is required');
    }

    const school = await School.findByPk(schoolId);
    if (!school) {
      throw new ApiError(404, 'School not found');
    }

    // Validate and sanitize fee settings
    const updatedFeeSettings = {
      defaultCurrency: feeSettings.defaultCurrency || 'INR',
      currencySymbol: feeSettings.currencySymbol || '₹',
      academicYearStartMonth: parseInt(feeSettings.academicYearStartMonth) || 6,
      defaultPaymentDueDays: parseInt(feeSettings.defaultPaymentDueDays) || 15,
      defaultPaymentModel: feeSettings.defaultPaymentModel || 'monthly',
      defaultInstallmentsCount: parseInt(feeSettings.defaultInstallmentsCount) || 4,
      defaultMonthlyMonths: parseInt(feeSettings.defaultMonthlyMonths) || 12,
      lateFeePercentage: parseFloat(feeSettings.lateFeePercentage) || 5.0,
      paymentMethods: {
        cash: feeSettings.paymentMethods?.cash !== false,
        bank_transfer: feeSettings.paymentMethods?.bank_transfer !== false,
        cheque: feeSettings.paymentMethods?.cheque !== false,
        online: feeSettings.paymentMethods?.online === true
      },
      paymentValidation: {
        requireTransactionId: feeSettings.paymentValidation?.requireTransactionId === true,
        allowPartialPayments: feeSettings.paymentValidation?.allowPartialPayments !== false,
        autoGenerateReceipts: feeSettings.paymentValidation?.autoGenerateReceipts !== false
      },
      defaultCategories: {
        tuition: feeSettings.defaultCategories?.tuition || 'Tuition Fees',
        transportation: feeSettings.defaultCategories?.transportation || 'Transportation Fees',
        library: feeSettings.defaultCategories?.library || 'Library Fees',
        laboratory: feeSettings.defaultCategories?.laboratory || 'Laboratory Fees'
      },
      feeTypeOptions: {
        oneTime: feeSettings.feeTypeOptions?.oneTime || 'One-time',
        recurring: feeSettings.feeTypeOptions?.recurring || 'Recurring',
        variable: feeSettings.feeTypeOptions?.variable || 'Variable',
        optional: feeSettings.feeTypeOptions?.optional || 'Optional'
      },
      invoiceSettings: {
        prefix: feeSettings.invoiceSettings?.prefix || 'INV',
        receiptPrefix: feeSettings.invoiceSettings?.receiptPrefix || 'RCP',
        autoGenerateNumbers: feeSettings.invoiceSettings?.autoGenerateNumbers !== false,
        dueDateCalculation: feeSettings.invoiceSettings?.dueDateCalculation || 'fixed_days'
      }
    };

    // Update school with new fee settings
    await school.update({
      fee_settings: updatedFeeSettings, // JSONB/JSON fields are automatically serialized
      currency: updatedFeeSettings.defaultCurrency
    });

    logger.info(`Fee settings updated for school ${schoolId}`);

    return res.status(200).json({
      success: true,
      message: 'Fee settings updated successfully',
      data: {
        feeSettings: updatedFeeSettings
      }
    });
  } catch (error) {
    logger.error('Error updating fee settings:', error);
    return next(error);
  }
};

module.exports = {
  getFeeSettings,
  updateFeeSettings
};
