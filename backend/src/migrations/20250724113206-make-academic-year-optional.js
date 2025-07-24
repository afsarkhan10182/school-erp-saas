'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Make academic_year field optional in students table
    await queryInterface.changeColumn('students', 'academic_year', {
      type: Sequelize.STRING(10),
      allowNull: true,
      defaultValue: new Date().getFullYear().toString(),
    });
  },

  async down (queryInterface, Sequelize) {
    // Revert academic_year field to required
    await queryInterface.changeColumn('students', 'academic_year', {
      type: Sequelize.STRING(10),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Academic year is required' },
      },
    });
  }
};
