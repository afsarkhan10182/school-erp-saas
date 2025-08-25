'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get all payments where receipt_number is different from invoice_number
    const payments = await queryInterface.sequelize.query(
      `SELECT p.id, p.receipt_number, p.invoice_id, i.invoice_number
       FROM fee_payments p
       LEFT JOIN fee_invoices i ON p.invoice_id = i.id
       WHERE p.receipt_number != i.invoice_number
       AND i.invoice_number IS NOT NULL`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    console.log(`Found ${payments.length} payments with mismatched receipt numbers`);

    // Update each payment's receipt number to match the invoice number
    for (const payment of payments) {
      try {
        // Update the payment to use the invoice number as receipt number
        await queryInterface.sequelize.query(
          `UPDATE fee_payments SET receipt_number = :invoiceNumber WHERE id = :paymentId`,
          {
            replacements: {
              invoiceNumber: payment.invoice_number,
              paymentId: payment.id
            },
            type: Sequelize.QueryTypes.UPDATE
          }
        );
        
        console.log(`Updated payment ${payment.id}: ${payment.receipt_number} → ${payment.invoice_number}`);
      } catch (error) {
        console.error(`Error updating payment ${payment.id}:`, error.message);
      }
    }

    console.log('Migration completed - all receipt numbers now match their invoice numbers');
  },

  down: async (queryInterface, Sequelize) => {
    // This migration cannot be safely reverted since we don't have the original receipt numbers
    console.log('This migration cannot be safely reverted');
  }
};
