const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const ExamSeating = sequelize.define(
  'ExamSeating',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    exam_id: { type: DataTypes.UUID, allowNull: false },
    exam_hall_id: { type: DataTypes.UUID, allowNull: false },
    class_id: { type: DataTypes.UUID, allowNull: true },
    section_id: { type: DataTypes.UUID, allowNull: true },
    students_per_bench: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 },
    plan_json: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'active' },
    school_id: { type: DataTypes.UUID, allowNull: false },
    branch_id: { type: DataTypes.UUID, allowNull: true },
    created_by: { type: DataTypes.UUID, allowNull: true },
    updated_by: { type: DataTypes.UUID, allowNull: true }
  },
  { tableName: 'exam_seatings', underscored: true }
);

ExamSeating.associate = models => {
  if (models.Exam) ExamSeating.belongsTo(models.Exam, { foreignKey: 'exam_id', as: 'exam' });
  if (models.ExamHall) {
    ExamSeating.belongsTo(models.ExamHall, { foreignKey: 'exam_hall_id', as: 'hall' });
  }
  if (models.Class) ExamSeating.belongsTo(models.Class, { foreignKey: 'class_id', as: 'class' });
};

module.exports = ExamSeating;
