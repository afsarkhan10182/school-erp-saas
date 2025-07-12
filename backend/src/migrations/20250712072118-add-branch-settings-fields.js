'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Update existing branches to have proper settings structure
    await queryInterface.sequelize.query(`
      UPDATE branches 
      SET settings = COALESCE(settings, '{}'::jsonb) || '{
        "currency": "INR",
        "currency_symbol": "₹",
        "system_logo": null,
        "text_logo": null,
        "printing_logo": null,
        "report_card_design": null
      }'::jsonb
      WHERE settings IS NULL OR settings = '{}'::jsonb;
    `);

    // Update existing schools to have proper settings structure
    await queryInterface.sequelize.query(`
      UPDATE schools 
      SET settings = COALESCE(settings, '{}'::jsonb) || '{
        "currency_symbol": "₹",
        "system_logo": null,
        "text_logo": null,
        "printing_logo": null,
        "report_card_design": null
      }'::jsonb
      WHERE settings IS NULL OR settings = '{}'::jsonb;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the added settings fields (this would reset to empty settings)
    await queryInterface.sequelize.query(`
      UPDATE branches 
      SET settings = '{}'::jsonb;
    `);

    await queryInterface.sequelize.query(`
      UPDATE schools 
      SET settings = '{}'::jsonb;
    `);
  }
};
