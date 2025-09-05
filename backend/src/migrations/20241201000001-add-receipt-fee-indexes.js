'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add indexes for better query performance (PostgreSQL specific)
    
    // GIN indexes for JSONB fields in schools table
    await queryInterface.addIndex('schools', ['receipt_settings'], {
      name: 'idx_schools_receipt_settings',
      using: 'GIN', // GIN index for JSONB in PostgreSQL
      comment: 'Index for querying receipt settings efficiently'
    });

    await queryInterface.addIndex('schools', ['fee_settings'], {
      name: 'idx_schools_fee_settings',
      using: 'GIN', // GIN index for JSONB in PostgreSQL
      comment: 'Index for querying fee settings efficiently'
    });

    // Index on branches table for receipt customization fields
    await queryInterface.addIndex('branches', ['receipt_name'], {
      name: 'idx_branches_receipt_name',
      comment: 'Index for querying branches by receipt name'
    });

    await queryInterface.addIndex('branches', ['receipt_logo'], {
      name: 'idx_branches_receipt_logo',
      comment: 'Index for querying branches by receipt logo'
    });

    // Composite index for school_id + receipt customization fields
    await queryInterface.addIndex('branches', ['school_id', 'receipt_name'], {
      name: 'idx_branches_school_receipt_name',
      comment: 'Composite index for efficient school-specific receipt name queries'
    });

    // Index for currency queries (useful for fee settings)
    await queryInterface.addIndex('schools', ['currency'], {
      name: 'idx_schools_currency',
      comment: 'Index for querying schools by currency'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove all added indexes
    await queryInterface.removeIndex('schools', 'idx_schools_receipt_settings');
    await queryInterface.removeIndex('schools', 'idx_schools_fee_settings');
    await queryInterface.removeIndex('branches', 'idx_branches_receipt_name');
    await queryInterface.removeIndex('branches', 'idx_branches_receipt_logo');
    await queryInterface.removeIndex('branches', 'idx_branches_school_receipt_name');
    await queryInterface.removeIndex('schools', 'idx_schools_currency');
  }
};
