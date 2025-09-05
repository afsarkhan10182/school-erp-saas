'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check which columns already exist and only add missing ones
    const tableDescription = await queryInterface.describeTable('fee_invoices');
    
    // Add entity_name if it doesn't exist
    if (!tableDescription.entity_name) {
      await queryInterface.addColumn('fee_invoices', 'entity_name', {
        type: Sequelize.STRING(200),
        allowNull: true,
        comment: 'Name of the entity (for non-database entities or display purposes)'
      });
    }

    // Add entity_details if it doesn't exist
    if (!tableDescription.entity_details) {
      await queryInterface.addColumn('fee_invoices', 'entity_details', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Additional entity details (contact info, class info, etc.)'
      });
    }

    // Update entity_type enum to include 'parent' if it doesn't exist
    try {
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_fee_invoices_entity_type" ADD VALUE IF NOT EXISTS 'parent';
      `);
    } catch (error) {
      // Enum value might already exist, ignore error
      console.log('Entity type enum update skipped (value may already exist)');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove new columns
    const tableDescription = await queryInterface.describeTable('fee_invoices');
    
    if (tableDescription.entity_name) {
      await queryInterface.removeColumn('fee_invoices', 'entity_name');
    }
    if (tableDescription.entity_details) {
      await queryInterface.removeColumn('fee_invoices', 'entity_details');
    }

    // Note: We don't remove the 'parent' enum value as it's not easily reversible
    // and doesn't cause any issues if left in place
  }
};
