'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('homeworks');
    if (!columns.academic_year) {
      await queryInterface.addColumn('homeworks', 'academic_year', {
        type: Sequelize.STRING(20),
        allowNull: true
      });
    }
  },

  async down(queryInterface) {
    const columns = await queryInterface.describeTable('homeworks');
    if (columns.academic_year) await queryInterface.removeColumn('homeworks', 'academic_year');
  }
};
