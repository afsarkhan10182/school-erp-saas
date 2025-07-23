'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // First, drop the existing foreign key constraints for invoice_id
    // We need to drop them because they might be preventing the column change
    try {
      await queryInterface.removeConstraint('fee_payments', 'fee_payments_invoice_id_fkey');
    } catch (error) {
      console.log('Constraint fee_payments_invoice_id_fkey not found, skipping...');
    }
    
    try {
      await queryInterface.removeConstraint('fee_payments', 'fee_payments_invoice_id_fkey1');
    } catch (error) {
      console.log('Constraint fee_payments_invoice_id_fkey1 not found, skipping...');
    }
    
    try {
      await queryInterface.removeConstraint('fee_payments', 'fee_payments_invoice_id_fkey2');
    } catch (error) {
      console.log('Constraint fee_payments_invoice_id_fkey2 not found, skipping...');
    }
    
    try {
      await queryInterface.removeConstraint('fee_payments', 'fee_payments_invoice_id_fkey3');
    } catch (error) {
      console.log('Constraint fee_payments_invoice_id_fkey3 not found, skipping...');
    }

    // Now make invoice_id nullable
    await queryInterface.changeColumn('fee_payments', 'invoice_id', {
      type: Sequelize.UUID,
      allowNull: true,
    });

    // Add back the proper foreign key constraint only if it doesn't exist
    try {
      await queryInterface.addConstraint('fee_payments', {
        fields: ['invoice_id'],
        type: 'foreign key',
        name: 'fee_payments_invoice_id_fkey',
        references: {
          table: 'fee_invoices',
          field: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
    } catch (error) {
      console.log('Constraint fee_payments_invoice_id_fkey already exists, skipping...');
    }
  },

  async down (queryInterface, Sequelize) {
    // Remove the foreign key constraint
    try {
      await queryInterface.removeConstraint('fee_payments', 'fee_payments_invoice_id_fkey');
    } catch (error) {
      console.log('Constraint fee_payments_invoice_id_fkey not found, skipping...');
    }

    // Make invoice_id non-nullable again
    await queryInterface.changeColumn('fee_payments', 'invoice_id', {
      type: Sequelize.UUID,
      allowNull: false,
    });

    // Add back the constraint
    await queryInterface.addConstraint('fee_payments', {
      fields: ['invoice_id'],
      type: 'foreign key',
      name: 'fee_payments_invoice_id_fkey',
      references: {
        table: 'fee_invoices',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  }
};
