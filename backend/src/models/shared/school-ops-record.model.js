const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const SchoolOpsRecord = sequelize.define(
  'SchoolOpsRecord',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    entity_type: { type: DataTypes.STRING(80), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'active' },
    reference_no: { type: DataTypes.STRING(80), allowNull: true },
    date_value: { type: DataTypes.DATEONLY, allowNull: true },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    student_id: { type: DataTypes.UUID, allowNull: true },
    user_id: { type: DataTypes.UUID, allowNull: true },
    class_id: { type: DataTypes.UUID, allowNull: true },
    related_id: { type: DataTypes.UUID, allowNull: true },
    payload: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    notes: { type: DataTypes.TEXT, allowNull: true },
    school_id: { type: DataTypes.UUID, allowNull: false },
    branch_id: { type: DataTypes.UUID, allowNull: true },
    created_by: { type: DataTypes.UUID, allowNull: true },
    updated_by: { type: DataTypes.UUID, allowNull: true }
  },
  {
    tableName: 'school_ops_records',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['school_id', 'entity_type'] },
      { fields: ['branch_id'] },
      { fields: ['student_id'] },
      { fields: ['status'] },
      { fields: ['date_value'] }
    ]
  }
);

SchoolOpsRecord.associate = models => {
  SchoolOpsRecord.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  SchoolOpsRecord.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
  SchoolOpsRecord.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  SchoolOpsRecord.belongsTo(models.Class, { foreignKey: 'class_id', as: 'class' });
};

module.exports = SchoolOpsRecord;
