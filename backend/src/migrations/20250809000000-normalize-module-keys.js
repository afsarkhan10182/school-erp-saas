'use strict';

/**
 * Replace legacy module key 'academics' with 'students' in arrays
 */
module.exports = {
  async up(queryInterface) {
    // Update schools.modules
    await queryInterface.sequelize.query(
      "UPDATE schools SET modules = array_replace(modules, 'academics', 'students') WHERE 'academics' = ANY(modules);"
    );

    // Update subscription_plans.modules
    await queryInterface.sequelize.query(
      "UPDATE subscription_plans SET modules = array_replace(modules, 'academics', 'students') WHERE 'academics' = ANY(modules);"
    );
  },

  async down() {
    // No-op: do not revert
  }
};


