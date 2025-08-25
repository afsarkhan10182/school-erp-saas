'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get all payments with incorrect receipt numbers (those starting with INV-110-)
    const payments = await queryInterface.sequelize.query(
      `SELECT p.id, p.receipt_number, p.invoice_id, i.class_name, fs.class_id, c.code as class_code
       FROM fee_payments p
       LEFT JOIN fee_invoices i ON p.invoice_id = i.id
       LEFT JOIN fee_structures fs ON i.fee_structure_id = fs.id
       LEFT JOIN classes c ON fs.class_id = c.id
       WHERE p.receipt_number LIKE 'INV-110-%'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    console.log(`Found ${payments.length} payments with incorrect receipt numbers`);

    // Update each payment's receipt number
    for (const payment of payments) {
      try {
        // Extract the sequential number from the old receipt number
        const oldReceiptNumber = payment.receipt_number;
        const sequentialNumber = oldReceiptNumber.replace('INV-110-', '');
        
        // Get the correct class code
        let classCode = payment.class_code;
        if (!classCode && payment.class_name) {
          // Fallback: extract from class name
          classCode = payment.class_name.replace(/^Class\s+/i, '').trim().replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        }
        if (!classCode) {
          classCode = 'GEN';
        }
        
        // Generate new receipt number
        const newReceiptNumber = `INV-${classCode}-${sequentialNumber}`;
        
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
        
        console.log(`Updated payment ${payment.id}: ${oldReceiptNumber} → ${newReceiptNumber}`);
      } catch (error) {
        console.error(`Error updating payment ${payment.id}:`, error.message);
      }
    }

    console.log('Migration completed');
  },

  down: async (queryInterface, Sequelize) => {
    // Revert the changes by updating receipt numbers back to INV-110- format
    const payments = await queryInterface.sequelize.query(
      `SELECT id, receipt_number FROM fee_payments WHERE receipt_number LIKE 'INV-C11-%'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    for (const payment of payments) {
      const newReceiptNumber = payment.receipt_number.replace('INV-C11-', 'INV-110-');
      
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
    }
  }
};
