'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, update existing installment_type values to match new enum
    await queryInterface.sequelize.query(`
      UPDATE fee_structures 
      SET installment_type = 'one_time' 
      WHERE installment_type IN ('monthly', 'quarterly', 'half_yearly', 'yearly')
    `);

    // Check if due_date column already exists
    const tableDescription = await queryInterface.describeTable('fee_structures');
    if (!tableDescription.due_date) {
      // Add the due_date column
      await queryInterface.addColumn('fee_structures', 'due_date', {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Due date for one-time full fee payments'
      });
    }

    // Check if index already exists
    try {
      await queryInterface.addIndex('fee_structures', ['due_date']);
    } catch (error) {
      // Index might already exist, ignore the error
      console.log('Index might already exist, continuing...');
    }

    // For now, we'll keep the existing enum type and just add the new values
    // The model will handle the validation
    console.log('Migration completed. Note: Enum type change requires manual database update.');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the due_date column
    await queryInterface.removeIndex('fee_structures', ['due_date']);
    await queryInterface.removeColumn('fee_structures', 'due_date');
  }
}; 