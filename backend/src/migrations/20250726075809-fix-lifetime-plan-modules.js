'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Update the Lifetime subscription plan to include all modules
    await queryInterface.sequelize.query(`
      UPDATE subscription_plans 
      SET modules = ARRAY['students', 'fees', 'attendance', 'exams', 'library', 'transport', 'hr', 'reports', 'settings']::text[]
      WHERE code = 'LIFETIME'
    `);
  },

  async down (queryInterface, Sequelize) {
    // Revert the Lifetime subscription plan to original modules
    await queryInterface.sequelize.query(`
      UPDATE subscription_plans 
      SET modules = ARRAY['academics', 'attendance', 'fees']::text[]
      WHERE code = 'LIFETIME'
    `);
  }
};
