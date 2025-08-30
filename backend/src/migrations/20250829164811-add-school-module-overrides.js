'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('schools', 'disabled_modules', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
      comment: 'Modules that are disabled for this school'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('schools', 'disabled_modules');
  }
};
