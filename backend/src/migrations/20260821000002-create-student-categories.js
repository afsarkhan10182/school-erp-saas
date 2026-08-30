'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const exists = await queryInterface.describeTable('student_categories').catch(() => null);

    if (!exists) {
      await queryInterface.createTable('student_categories', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: { type: Sequelize.STRING(100), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      school_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'schools', key: 'id' }
      },
      branch_id: { type: Sequelize.UUID, allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
      });
    }

    const studentCols = await queryInterface.describeTable('students').catch(() => null);
    if (studentCols && !studentCols.category_id) {
      await queryInterface.addColumn('students', 'category_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'student_categories', key: 'id' }
      });
      await queryInterface.addIndex('students', ['category_id']);
    }
  },

  async down(queryInterface) {
    const studentCols = await queryInterface.describeTable('students').catch(() => null);
    if (studentCols?.category_id) await queryInterface.removeColumn('students', 'category_id');
    await queryInterface.dropTable('student_categories');
  }
};
