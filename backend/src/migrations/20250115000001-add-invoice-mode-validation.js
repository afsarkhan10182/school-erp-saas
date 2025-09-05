'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add invoice_mode validation to school fee_settings
    // This migration ensures all schools have the invoice_mode setting with proper validation
    await queryInterface.sequelize.query(`
      UPDATE schools 
      SET fee_settings = COALESCE(fee_settings, '{}'::jsonb) || 
          '{"invoiceMode": "class_based"}'::jsonb
      WHERE fee_settings->>'invoiceMode' IS NULL
    `);

    // Add a comment to document the invoice mode options
    await queryInterface.sequelize.query(`
      COMMENT ON COLUMN schools.fee_settings IS 'Fee configuration settings including invoiceMode: "class_based" (default) or "flexible"'
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove invoice_mode from school fee_settings
    await queryInterface.sequelize.query(`
      UPDATE schools 
      SET fee_settings = fee_settings - 'invoiceMode'
      WHERE fee_settings ? 'invoiceMode'
    `);

    // Remove the comment
    await queryInterface.sequelize.query(`
      COMMENT ON COLUMN schools.fee_settings IS 'Custom fee configuration settings for the school'
    `);
  }
};
