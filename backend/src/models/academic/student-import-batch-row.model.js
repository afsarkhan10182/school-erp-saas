const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const StudentImportBatchRow = sequelize.define(
  'StudentImportBatchRow',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    batch_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'student_import_batches', key: 'id' }
    },
    student_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'students', key: 'id' }
    },
    student_parent_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'student_parents', key: 'id' }
    },
    parent_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'parents', key: 'id' }
    },
    parent_created: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  { tableName: 'student_import_batch_rows', timestamps: false, underscored: true }
);

StudentImportBatchRow.associate = models => {
  StudentImportBatchRow.belongsTo(models.StudentImportBatch, { foreignKey: 'batch_id', as: 'batch' });
  StudentImportBatchRow.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
  StudentImportBatchRow.belongsTo(models.Parent, { foreignKey: 'parent_id', as: 'parent' });
  StudentImportBatchRow.belongsTo(models.StudentParent, {
    foreignKey: 'student_parent_id',
    as: 'studentParent'
  });
};

module.exports = StudentImportBatchRow;
