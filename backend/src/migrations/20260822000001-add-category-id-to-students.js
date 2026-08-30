'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const studentCols = await queryInterface.describeTable('students').catch(() => null);
    if (!studentCols || studentCols.category_id) return;

    await queryInterface.addColumn('students', 'category_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'student_categories', key: 'id' }
    });
    await queryInterface.addIndex('students', ['category_id']);
  },

  async down(queryInterface) {
    const studentCols = await queryInterface.describeTable('students').catch(() => null);
    if (studentCols?.category_id) await queryInterface.removeColumn('students', 'category_id');
  }
};
