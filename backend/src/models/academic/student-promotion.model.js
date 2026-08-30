const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const StudentPromotion = sequelize.define(
  'StudentPromotion',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    student_id: { type: DataTypes.UUID, allowNull: false },
    from_class_id: { type: DataTypes.UUID, allowNull: true },
    from_section_id: { type: DataTypes.UUID, allowNull: true },
    to_class_id: { type: DataTypes.UUID, allowNull: true },
    to_section_id: { type: DataTypes.UUID, allowNull: true },
    from_academic_year: { type: DataTypes.STRING(20), allowNull: true },
    to_academic_year: { type: DataTypes.STRING(20), allowNull: true },
    action: {
      type: DataTypes.ENUM('promote', 'repeat'),
      allowNull: false,
      defaultValue: 'promote'
    },
    school_id: { type: DataTypes.UUID, allowNull: false },
    branch_id: { type: DataTypes.UUID, allowNull: true },
    created_by: { type: DataTypes.UUID, allowNull: true }
  },
  {
    tableName: 'student_promotions',
    timestamps: true,
    underscored: true
  }
);

StudentPromotion.associate = models => {
  StudentPromotion.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
  StudentPromotion.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
};

module.exports = StudentPromotion;
