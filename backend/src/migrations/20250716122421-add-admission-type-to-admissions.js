'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('admissions', 'admission_type', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'new',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('admissions', 'admission_type');
  }
};
