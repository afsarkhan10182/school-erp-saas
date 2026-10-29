const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const StudentImportBatch = sequelize.define(
  'StudentImportBatch',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    school_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'schools', key: 'id' }
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'branches', key: 'id' }
    },
    imported_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    file_name: { type: DataTypes.STRING(255), allowNull: false },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'in_progress' },
    total_rows: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    successful_rows: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    failed_rows: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    row_errors: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    completed_at: { type: DataTypes.DATE, allowNull: true },
    undo_ready: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    undone_at: { type: DataTypes.DATE, allowNull: true },
    undone_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    undo_details: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} }
  },
  {
    tableName: 'student_import_batches',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['school_id', 'created_at'] },
      { fields: ['branch_id', 'created_at'] }
    ]
  }
);

module.exports = StudentImportBatch;
