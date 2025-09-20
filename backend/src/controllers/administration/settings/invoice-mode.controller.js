const { School } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { success, error, asyncHandler } = require('~/utils/shared/apiResponse');
const ApiError = require('~/utils/shared/ApiError');

class InvoiceModeController {
  // Get invoice mode settings
  static getInvoiceModeSettings = asyncHandler(async (req, res) => {
    const schoolId = req.schoolId;

    const school = await School.findByPk(schoolId, {
      attributes: ['id', 'name', 'settings']
    });

    if (!school) {
      throw new ApiError(404, 'School not found');
    }

    const settings = school.settings || {};
    const invoiceMode = settings.invoice_mode || 'class_based';

    // Define available modes and their descriptions
    const availableModes = {
      class_based: {
        name: 'Class-Based Invoices',
        description:
          'Invoices tied to students, classes, and fee structures (traditional school model)',
        requirements: {
          student_id: 'required',
          class_name: 'required',
          fee_structure_id: 'required'
        },
        examples: ['Tuition fees', 'Class-specific charges', 'Academic fees']
      },
      student_based: {
        name: 'Student-Centric Invoices',
        description: 'Invoices tied to students but class/fee structure optional',
        requirements: {
          student_id: 'required',
          class_name: 'optional',
          fee_structure_id: 'optional'
        },
        examples: ['Transport fees', 'Hostel fees', 'Library fees', 'Exam fees']
      },
      generic: {
        name: 'Generic Invoice Mode',
        description: 'Flexible invoices like a general accounting system',
        requirements: {
          student_id: 'optional',
          class_name: 'optional',
          fee_structure_id: 'optional'
        },
        examples: ['Donations', 'Vendor payments', 'Utility bills', 'Maintenance']
      }
    };

    success(res, {
      currentMode: invoiceMode,
      availableModes,
      currentSettings: {
        invoice_mode: invoiceMode,
        receipt_numbering: settings.receipt_numbering || 'class_based',
        invoice_numbering: settings.invoice_numbering || 'class_based'
      }
    });
  });

  // Update invoice mode settings
  static updateInvoiceModeSettings = asyncHandler(async (req, res) => {
    const schoolId = req.schoolId;
    const { invoice_mode, receipt_numbering, invoice_numbering } = req.body;

    // Validate invoice mode
    const validModes = ['class_based', 'student_based', 'generic'];
    if (!validModes.includes(invoice_mode)) {
      throw new ApiError(400, 'Invalid invoice mode. Must be one of: ' + validModes.join(', '));
    }

    const school = await School.findByPk(schoolId);
    if (!school) {
      throw new ApiError(404, 'School not found');
    }

    // Update settings
    const settings = school.settings || {};
    settings.invoice_mode = invoice_mode;
    settings.receipt_numbering = receipt_numbering || invoice_mode;
    settings.invoice_numbering = invoice_numbering || invoice_mode;

    await school.update({
      settings: settings,
      updated_by: req.user.id
    });

    logger.info('Invoice mode settings updated', {
      schoolId,
      invoice_mode,
      updatedBy: req.user.id
    });

    success(res, {
      message: 'Invoice mode settings updated successfully',
      newSettings: {
        invoice_mode,
        receipt_numbering: settings.receipt_numbering,
        invoice_numbering: settings.invoice_numbering
      }
    });
  });

  // Get validation rules for current mode
  static getValidationRules = asyncHandler(async (req, res) => {
    const schoolId = req.schoolId;

    const school = await School.findByPk(schoolId, {
      attributes: ['settings']
    });

    if (!school) {
      throw new ApiError(404, 'School not found');
    }

    const invoiceMode = school.settings?.invoice_mode || 'class_based';

    const validationRules = {
      class_based: {
        required: ['student_id', 'class_name', 'fee_structure_id'],
        optional: ['section', 'academic_year'],
        hidden: []
      },
      student_based: {
        required: ['student_id'],
        optional: ['class_name', 'fee_structure_id', 'section', 'academic_year'],
        hidden: []
      },
      generic: {
        required: ['title', 'total_amount'],
        optional: ['student_id', 'class_name', 'fee_structure_id', 'section', 'academic_year'],
        hidden: []
      }
    };

    success(res, {
      invoice_mode: invoiceMode,
      validation_rules: validationRules[invoiceMode],
      ui_config: {
        show_student_field: invoiceMode !== 'generic',
        show_class_field: invoiceMode === 'class_based',
        show_fee_structure_field: invoiceMode === 'class_based',
        show_invoice_type_field: invoiceMode === 'generic'
      }
    });
  });
}

module.exports = InvoiceModeController;
