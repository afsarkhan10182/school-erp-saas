'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable('library_import_batches', {
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
        allowNull: false,
        references: { model: 'branches', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
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
      completed_at: { type: DataTypes.DATE, allowNull: true },
      undo_ready: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      undone_at: { type: DataTypes.DATE, allowNull: true },
      undone_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      undo_details: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    });
    await queryInterface.createTable('library_import_batch_rows', {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      batch_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'library_import_batches', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      book_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'library_books', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    });
    await queryInterface.addIndex('library_import_batches', ['school_id', 'created_at']);
    await queryInterface.addIndex('library_import_batches', ['branch_id', 'created_at']);
    await queryInterface.addIndex('library_import_batch_rows', ['batch_id']);
    await queryInterface.addIndex('library_import_batch_rows', ['book_id']);
  },

  async down(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      'SELECT COUNT(*)::int AS count FROM library_import_batches'
    );
    if (rows[0].count > 0) {
      throw new Error('Cannot remove library import history while batch records exist');
    }
    await queryInterface.dropTable('library_import_batch_rows');
    await queryInterface.dropTable('library_import_batches');
  }
};
