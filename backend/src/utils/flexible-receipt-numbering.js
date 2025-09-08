const { sequelize } = require('~/config/database');
const { logger } = require('./logger');

/**
 * Generate receipt numbers based on school's invoice mode
 * @param {Object} school - School object with settings
 * @param {Object} context - Context for receipt generation
 * @returns {Object} - Receipt number object
 */
const generateFlexibleReceiptNumber = async (school, context = {}) => {
  const { school_id, entity_type, entity_id, class_code, invoice_type } = context;
  
  // Get school's invoice mode from settings
  const invoiceMode = school.settings?.invoice_mode || 'class_based';
  
  let prefix = 'RCP';
  let sequenceKey = 'general';
  
  switch (invoiceMode) {
    case 'class_based':
      // Use class code for class-based schools
      if (class_code) {
        prefix = `RCP-${class_code}`;
        sequenceKey = `class_${class_code}`;
      } else {
        prefix = 'RCP-CLS';
        sequenceKey = 'class_general';
      }
      break;
      
    case 'student_based':
      // Use student-based numbering
      if (entity_type === 'student') {
        prefix = 'RCP-STU';
        sequenceKey = 'student_based';
      } else {
        prefix = 'RCP-GEN';
        sequenceKey = 'general';
      }
      break;
      
    case 'generic':
      // Use invoice type for generic mode
      if (invoice_type) {
        const typeCode = invoice_type.toUpperCase().substring(0, 3);
        prefix = `RCP-${typeCode}`;
        sequenceKey = `type_${invoice_type}`;
      } else {
        prefix = 'RCP-GEN';
        sequenceKey = 'generic';
      }
      break;
      
    default:
      prefix = 'RCP-GEN';
      sequenceKey = 'general';
  }
  
  // Get the next sequence number
  const result = await sequelize.query(
    `SELECT MAX(CAST(SUBSTRING(receipt_number FROM '${prefix}-([0-9]+)$') AS INTEGER)) as max_number
     FROM fee_payments 
     WHERE school_id = :school_id 
     AND receipt_number LIKE '${prefix}-%'`,
    { 
      type: sequelize.QueryTypes.SELECT,
      replacements: { school_id }
    }
  );
  
  const maxNumber = result[0].max_number || 0;
  const nextId = maxNumber + 1;
  
  const receiptNumber = `${prefix}-${nextId}`;
  
  logger.info('Generated flexible receipt number:', {
    invoiceMode,
    receiptNumber,
    sequenceKey,
    school_id,
    context
  });
  
  return { 
    receipt_number: receiptNumber,
    invoice_mode: invoiceMode,
    sequence_key: sequenceKey
  };
};

/**
 * Generate invoice numbers based on school's invoice mode
 * @param {Object} school - School object with settings
 * @param {Object} context - Context for invoice generation
 * @returns {Object} - Invoice number object
 */
const generateFlexibleInvoiceNumber = async (school, context = {}) => {
  const { school_id, entity_type, entity_id, class_code, invoice_type } = context;
  
  // Get school's invoice mode from settings
  const invoiceMode = school.settings?.invoice_mode || 'class_based';
  
  let prefix = 'INV';
  let sequenceKey = 'general';
  
  switch (invoiceMode) {
    case 'class_based':
      // Use class code for class-based schools
      if (class_code) {
        prefix = `INV-${class_code}`;
        sequenceKey = `class_${class_code}`;
      } else {
        prefix = 'INV-CLS';
        sequenceKey = 'class_general';
      }
      break;
      
    case 'student_based':
      // Use student-based numbering
      if (entity_type === 'student') {
        prefix = 'INV-STU';
        sequenceKey = 'student_based';
      } else {
        prefix = 'INV-GEN';
        sequenceKey = 'general';
      }
      break;
      
    case 'generic':
      // Use invoice type for generic mode
      if (invoice_type) {
        const typeCode = invoice_type.toUpperCase().substring(0, 3);
        prefix = `INV-${typeCode}`;
        sequenceKey = `type_${invoice_type}`;
      } else {
        prefix = 'INV-GEN';
        sequenceKey = 'generic';
      }
      break;
      
    default:
      prefix = 'INV-GEN';
      sequenceKey = 'general';
  }
  
  // Get the next sequence number
  const result = await sequelize.query(
    `SELECT MAX(CAST(SUBSTRING(invoice_number FROM '${prefix}-([0-9]+)$') AS INTEGER)) as max_number
     FROM fee_invoices 
     WHERE school_id = :school_id 
     AND invoice_number LIKE '${prefix}-%'`,
    { 
      type: sequelize.QueryTypes.SELECT,
      replacements: { school_id }
    }
  );
  
  const maxNumber = result[0].max_number || 0;
  const nextId = maxNumber + 1;
  
  const invoiceNumber = `${prefix}-${nextId}`;
  
  logger.info('Generated flexible invoice number:', {
    invoiceMode,
    invoiceNumber,
    sequenceKey,
    school_id,
    context
  });
  
  return { 
    invoice_number: invoiceNumber,
    invoice_mode: invoiceMode,
    sequence_key: sequenceKey
  };
};

module.exports = {
  generateFlexibleReceiptNumber,
  generateFlexibleInvoiceNumber
};
