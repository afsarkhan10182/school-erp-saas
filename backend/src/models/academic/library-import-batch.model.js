const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const LibraryImportBatch = sequelize.define(
  'LibraryImportBatch',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    school_id: { type: DataTypes.UUID, allowNull: false },
    branch_id: { type: DataTypes.UUID, allowNull: false },
    imported_by: { type: DataTypes.UUID, allowNull: true },
    file_name: { type: DataTypes.STRING(255), allowNull: false },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'in_progress' },
    total_rows: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    successful_rows: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    failed_rows: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    completed_at: { type: DataTypes.DATE, allowNull: true },
    undo_ready: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    undone_at: { type: DataTypes.DATE, allowNull: true },
    undone_by: { type: DataTypes.UUID, allowNull: true },
    undo_details: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} }
  },
  {
    tableName: 'library_import_batches',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['school_id', 'created_at'] },
      { fields: ['branch_id', 'created_at'] }
    ]
  }
);

LibraryImportBatch.associate = models => {
  LibraryImportBatch.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  LibraryImportBatch.belongsTo(models.User, { foreignKey: 'imported_by', as: 'importedBy' });
  LibraryImportBatch.belongsTo(models.User, { foreignKey: 'undone_by', as: 'undoneBy' });
  LibraryImportBatch.hasMany(models.LibraryImportBatchRow, { foreignKey: 'batch_id', as: 'rows' });
};

module.exports = LibraryImportBatch;
