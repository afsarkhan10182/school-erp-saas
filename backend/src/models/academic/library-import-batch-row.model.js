const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const LibraryImportBatchRow = sequelize.define(
  'LibraryImportBatchRow',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    batch_id: { type: DataTypes.UUID, allowNull: false },
    book_id: { type: DataTypes.UUID, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  { tableName: 'library_import_batch_rows', timestamps: false, underscored: true }
);

LibraryImportBatchRow.associate = models => {
  LibraryImportBatchRow.belongsTo(models.LibraryImportBatch, { foreignKey: 'batch_id', as: 'batch' });
  LibraryImportBatchRow.belongsTo(models.LibraryBook, { foreignKey: 'book_id', as: 'book' });
};

module.exports = LibraryImportBatchRow;
