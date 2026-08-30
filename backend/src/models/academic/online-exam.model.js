const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const OnlineExam = sequelize.define(
  'OnlineExam',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    exam_id: { type: DataTypes.UUID, allowNull: true },
    class_id: { type: DataTypes.UUID, allowNull: true },
    subject_id: { type: DataTypes.UUID, allowNull: true },
    duration_minutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 60 },
    pass_marks: { type: DataTypes.DECIMAL(8, 2), allowNull: false, defaultValue: 0 },
    total_marks: { type: DataTypes.DECIMAL(8, 2), allowNull: false, defaultValue: 0 },
    start_at: { type: DataTypes.DATE, allowNull: true },
    end_at: { type: DataTypes.DATE, allowNull: true },
    status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'draft' },
    school_id: { type: DataTypes.UUID, allowNull: false },
    branch_id: { type: DataTypes.UUID, allowNull: true },
    created_by: { type: DataTypes.UUID, allowNull: true },
    updated_by: { type: DataTypes.UUID, allowNull: true }
  },
  { tableName: 'online_exams', underscored: true }
);

OnlineExam.associate = models => {
  OnlineExam.hasMany(models.OnlineExamQuestion, {
    foreignKey: 'online_exam_id',
    as: 'questions'
  });
  OnlineExam.hasMany(models.OnlineExamAttempt, {
    foreignKey: 'online_exam_id',
    as: 'attempts'
  });
  if (models.Class) {
    OnlineExam.belongsTo(models.Class, { foreignKey: 'class_id', as: 'class' });
  }
};

module.exports = OnlineExam;
