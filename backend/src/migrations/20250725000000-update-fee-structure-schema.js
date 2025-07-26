'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('🔄 Updating fee structure schema for better NULL handling...');

      // Update installment_type to allow NULL and remove default
      await queryInterface.changeColumn('fee_structures', 'installment_type', {
        type: Sequelize.ENUM('one_time', 'multiple'),
        allowNull: true,
        defaultValue: null
      });
      console.log('✅ Updated installment_type to allow NULL');

      // Update due_day to allow NULL and remove default
      await queryInterface.changeColumn('fee_structures', 'due_day', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null
      });
      console.log('✅ Updated due_day to allow NULL');

      // Update due_month to allow NULL (already was, but ensuring consistency)
      await queryInterface.changeColumn('fee_structures', 'due_month', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
      console.log('✅ Updated due_month to allow NULL');

      // Update existing records to use NULL for monthly payments
      await queryInterface.sequelize.query(`
        UPDATE fee_structures 
        SET installment_type = NULL, due_day = NULL, due_month = NULL
        WHERE payment_model = 'monthly'
      `);
      console.log('✅ Updated existing monthly payments to use NULL values');

      // Update existing records to use NULL for installment payments
      await queryInterface.sequelize.query(`
        UPDATE fee_structures 
        SET due_day = NULL, due_month = NULL
        WHERE payment_model = 'installment'
      `);
      console.log('✅ Updated existing installment payments to use NULL values');

      console.log('🎉 Fee structure schema update completed successfully!');

    } catch (error) {
      console.error('❌ Error updating fee structure schema:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      console.log('🔄 Rolling back fee structure schema changes...');

      // Restore installment_type to not allow NULL and set default
      await queryInterface.changeColumn('fee_structures', 'installment_type', {
        type: Sequelize.ENUM('one_time', 'multiple'),
        allowNull: false,
        defaultValue: 'one_time'
      });
      console.log('✅ Restored installment_type to not allow NULL');

      // Restore due_day to not allow NULL and set default
      await queryInterface.changeColumn('fee_structures', 'due_day', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 10
      });
      console.log('✅ Restored due_day to not allow NULL');

      // Update NULL values back to defaults
      await queryInterface.sequelize.query(`
        UPDATE fee_structures 
        SET installment_type = 'one_time', due_day = 10
        WHERE installment_type IS NULL OR due_day IS NULL
      `);
      console.log('✅ Restored NULL values to defaults');

      console.log('🎉 Fee structure schema rollback completed successfully!');

    } catch (error) {
      console.error('❌ Error rolling back fee structure schema:', error);
      throw error;
    }
  }
}; 