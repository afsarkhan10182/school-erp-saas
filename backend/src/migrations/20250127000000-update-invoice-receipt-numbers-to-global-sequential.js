'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { sequelize } = require('../config/database');
    
    try {
      // Get all schools
      const schools = await queryInterface.sequelize.query(
        'SELECT id FROM schools',
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      for (const school of schools) {
        console.log(`Processing school: ${school.id}`);
        
        // Update invoice numbers for this school
        await queryInterface.sequelize.query(`
          WITH numbered_invoices AS (
            SELECT 
              id,
              invoice_number,
              ROW_NUMBER() OVER (ORDER BY created_at, id) as new_number
            FROM fee_invoices 
            WHERE school_id = :school_id
            ORDER BY created_at, id
          )
          UPDATE fee_invoices 
          SET invoice_number = 'INV-' || SUBSTRING(invoice_number FROM 'INV-([A-Z0-9]+)-[0-9]+') || '-' || numbered_invoices.new_number
          FROM numbered_invoices
          WHERE fee_invoices.id = numbered_invoices.id
        `, {
          replacements: { school_id: school.id },
          type: Sequelize.QueryTypes.UPDATE
        });
        
        // Update receipt numbers for this school
        await queryInterface.sequelize.query(`
          WITH numbered_receipts AS (
            SELECT 
              id,
              receipt_number,
              ROW_NUMBER() OVER (ORDER BY created_at, id) as new_number
            FROM fee_payments 
            WHERE school_id = :school_id AND receipt_number IS NOT NULL
            ORDER BY created_at, id
          )
          UPDATE fee_payments 
          SET receipt_number = 'RCP-' || SUBSTRING(receipt_number FROM 'RCP-([A-Z0-9]+)-[0-9]+') || '-' || numbered_receipts.new_number
          FROM numbered_receipts
          WHERE fee_payments.id = numbered_receipts.id
        `, {
          replacements: { school_id: school.id },
          type: Sequelize.QueryTypes.UPDATE
        });
        
        console.log(`Completed processing school: ${school.id}`);
      }
      
      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Note: This migration cannot be safely reversed as it would require
    // knowing the original per-class-code numbering which we don't store
    console.log('This migration cannot be safely reversed');
  }
};
