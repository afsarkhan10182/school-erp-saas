'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add invoice_mode to school settings
    await queryInterface.sequelize.query(`
      UPDATE schools 
      SET settings = COALESCE(settings, '{}'::jsonb) || 
          '{"invoice_mode": "class_based"}'::jsonb
      WHERE settings->>'invoice_mode' IS NULL
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove invoice_mode from school settings
    await queryInterface.sequelize.query(`
      UPDATE schools 
      SET settings = settings - 'invoice_mode'
      WHERE settings ? 'invoice_mode'
    `);
  }
};
