'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Make category field optional in students table
    await queryInterface.changeColumn('students', 'category', {
      type: Sequelize.ENUM('general', 'obc', 'sc', 'st', 'other'),
      allowNull: true,
      defaultValue: 'general',
    });
  },

  async down (queryInterface, Sequelize) {
    // Revert category field to required
    await queryInterface.changeColumn('students', 'category', {
      type: Sequelize.ENUM('general', 'obc', 'sc', 'st', 'other'),
      allowNull: false,
      defaultValue: 'general',
    });
  }
};
