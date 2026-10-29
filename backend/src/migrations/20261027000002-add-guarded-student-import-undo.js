'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    await queryInterface.addColumn('student_import_batches', 'undo_ready', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addColumn('student_import_batches', 'undone_at', {
      type: DataTypes.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('student_import_batches', 'undone_by', {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
    await queryInterface.addColumn('student_import_batches', 'undo_details', {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    });
    await queryInterface.createTable('student_import_batch_rows', {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      batch_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'student_import_batches', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      student_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'students', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      student_parent_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'student_parents', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      parent_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'parents', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      parent_created: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    });
    await queryInterface.addIndex('student_import_batch_rows', ['batch_id']);
    await queryInterface.addIndex('student_import_batch_rows', ['student_id']);
  },

  async down(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      'SELECT COUNT(*)::int AS count FROM student_import_batch_rows'
    );
    if (rows[0].count > 0) {
      throw new Error('Cannot remove student import undo records while batch rows exist');
    }
    await queryInterface.dropTable('student_import_batch_rows');
    await queryInterface.removeColumn('student_import_batches', 'undo_details');
    await queryInterface.removeColumn('student_import_batches', 'undone_by');
    await queryInterface.removeColumn('student_import_batches', 'undone_at');
    await queryInterface.removeColumn('student_import_batches', 'undo_ready');
  }
};
