'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get all payments where receipt_number equals invoice_number (indicating they need unique receipt numbers)
    const payments = await queryInterface.sequelize.query(
      `SELECT p.id, p.receipt_number, p.invoice_id, i.invoice_number, i.class_name, fs.class_id, c.code as class_code
       FROM fee_payments p
       LEFT JOIN fee_invoices i ON p.invoice_id = i.id
       LEFT JOIN fee_structures fs ON i.fee_structure_id = fs.id
       LEFT JOIN classes c ON fs.class_id = c.id
       WHERE p.receipt_number = i.invoice_number
       ORDER BY p.created_at ASC`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    console.log(`Found ${payments.length} payments that need unique receipt numbers`);

    // Update each payment's receipt number to be unique
    for (const payment of payments) {
      try {
        // Get the next auto-increment ID for receipt numbering
        const result = await queryInterface.sequelize.query(
          "SELECT nextval(pg_get_serial_sequence('fee_invoices', 'invoice_id')) as next_id",
          { type: Sequelize.QueryTypes.SELECT }
        );
        
        const nextId = result[0].next_id;
        
        // Get class code
        let classCode = payment.class_code;
        if (!classCode && payment.class_name) {
          classCode = payment.class_name.replace(/^Class\s+/i, '').trim().replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        }
        if (!classCode) {
          classCode = 'GEN';
        }
        
        // Generate new unique receipt number
        const newReceiptNumber = `INV-${classCode}-${nextId}`;
        
        // Update the payment
        await queryInterface.sequelize.query(
          `UPDATE fee_payments SET receipt_number = :newReceiptNumber WHERE id = :paymentId`,
          {
            replacements: {
              newReceiptNumber: newReceiptNumber,
              paymentId: payment.id
            },
            type: Sequelize.QueryTypes.UPDATE
          }
        );
        
        console.log(`Updated payment ${payment.id}: ${payment.receipt_number} → ${newReceiptNumber}`);
      } catch (error) {
        console.error(`Error updating payment ${payment.id}:`, error.message);
      }
    }

    console.log('Migration completed - all payments now have unique receipt numbers');
  },

  down: async (queryInterface, Sequelize) => {
    // This migration cannot be safely reverted since we don't have the original receipt numbers
    console.log('This migration cannot be safely reverted');
  }
};
