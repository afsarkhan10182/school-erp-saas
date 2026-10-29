const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const SyllabusUnit = sequelize.define(
  'SyllabusUnit',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    school_id: { type: DataTypes.UUID, allowNull: false },
    branch_id: { type: DataTypes.UUID, allowNull: false },
    class_id: { type: DataTypes.UUID, allowNull: false },
    subject_id: { type: DataTypes.UUID, allowNull: false },
    parent_id: { type: DataTypes.UUID, allowNull: true },
    title: { type: DataTypes.STRING(180), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    created_by: { type: DataTypes.UUID, allowNull: false }
  },
  { tableName: 'syllabus_units', timestamps: true, underscored: true }
);

SyllabusUnit.associate = models => {
  SyllabusUnit.belongsTo(models.SyllabusUnit, { foreignKey: 'parent_id', as: 'parent' });
};

module.exports = SyllabusUnit;
