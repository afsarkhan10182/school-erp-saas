'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Update the fees module to make it non-core
      await queryInterface.sequelize.query(
        `UPDATE modules 
         SET is_core = false, updated_at = NOW() 
         WHERE code = 'fees'`,
        { transaction }
      );

      // Log the change
      console.log('✅ Fees module changed from core to non-core');

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Revert the fees module back to core
      await queryInterface.sequelize.query(
        `UPDATE modules 
         SET is_core = true, updated_at = NOW() 
         WHERE code = 'fees'`,
        { transaction }
      );

      console.log('✅ Fees module reverted back to core');

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
