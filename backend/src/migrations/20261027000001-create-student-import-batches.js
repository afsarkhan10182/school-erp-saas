'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable('student_import_batches', {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      school_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'schools', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      branch_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'branches', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      imported_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      file_name: { type: DataTypes.STRING(255), allowNull: false },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'in_progress' },
      total_rows: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      successful_rows: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      failed_rows: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      row_errors: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      completed_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    });
    await queryInterface.addIndex('student_import_batches', ['school_id', 'created_at']);
    await queryInterface.addIndex('student_import_batches', ['branch_id', 'created_at']);
  },

  async down(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      'SELECT COUNT(*)::int AS count FROM student_import_batches'
    );
    if (rows[0].count > 0) {
      throw new Error('Cannot remove student import history while batch records exist');
    }
    await queryInterface.dropTable('student_import_batches');
  }
};
