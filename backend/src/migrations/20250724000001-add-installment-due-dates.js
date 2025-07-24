'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add installment_due_dates column
    await queryInterface.addColumn('fee_structures', 'installment_due_dates', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of due dates for multiple installments'
    });

    // Add index for better performance
    try {
      await queryInterface.addIndex('fee_structures', ['installment_due_dates'], {
        using: 'GIN',
        name: 'idx_fee_structures_installment_due_dates'
      });
    } catch (error) {
      // Index might already exist, ignore the error
      console.log('Index might already exist, continuing...');
    }

    console.log('Migration completed: Added installment_due_dates column to fee_structures table');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the index first
    try {
      await queryInterface.removeIndex('fee_structures', 'idx_fee_structures_installment_due_dates');
    } catch (error) {
      // Index might not exist, ignore the error
      console.log('Index might not exist, continuing...');
    }

    // Remove the installment_due_dates column
    await queryInterface.removeColumn('fee_structures', 'installment_due_dates');

    console.log('Migration rolled back: Removed installment_due_dates column from fee_structures table');
  }
}; 