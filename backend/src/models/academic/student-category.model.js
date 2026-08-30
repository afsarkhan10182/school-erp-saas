const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const StudentCategory = sequelize.define(
  'StudentCategory',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    school_id: { type: DataTypes.UUID, allowNull: false },
    branch_id: { type: DataTypes.UUID, allowNull: true },
    created_by: { type: DataTypes.UUID, allowNull: true },
    updated_by: { type: DataTypes.UUID, allowNull: true }
  },
  {
    tableName: 'student_categories',
    timestamps: true,
    underscored: true
  }
);

StudentCategory.associate = models => {
  StudentCategory.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
};

module.exports = StudentCategory;
