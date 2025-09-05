'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add receipt_settings field to schools table with JSONB for PostgreSQL performance
    await queryInterface.addColumn('schools', 'receipt_settings', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {},
      comment: 'Custom receipt settings for the school'
    });

    // Add fee_settings field to schools table with JSONB for PostgreSQL performance
    await queryInterface.addColumn('schools', 'fee_settings', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {},
      comment: 'Custom fee configuration settings for the school'
    });

    // Add receipt customization fields to branches table
    await queryInterface.addColumn('branches', 'receipt_name', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Custom name to display on receipts for this branch'
    });

    // Optimize receipt_logo for URL storage (most URLs are under 500 chars)
    await queryInterface.addColumn('branches', 'receipt_logo', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'Custom logo URL to display on receipts for this branch'
    });

    await queryInterface.addColumn('branches', 'receipt_address', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Custom address to display on receipts for this branch'
    });

    await queryInterface.addColumn('branches', 'receipt_contact', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Custom contact to display on receipts for this branch'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove receipt_settings field from schools table
    await queryInterface.removeColumn('schools', 'receipt_settings');

    // Remove fee_settings field from schools table
    await queryInterface.removeColumn('schools', 'fee_settings');

    // Remove receipt customization fields from branches table
    await queryInterface.removeColumn('branches', 'receipt_name');
    await queryInterface.removeColumn('branches', 'receipt_logo');
    await queryInterface.removeColumn('branches', 'receipt_address');
    await queryInterface.removeColumn('branches', 'receipt_contact');
  }
};
