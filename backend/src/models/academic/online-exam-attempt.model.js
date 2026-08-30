const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const OnlineExamAttempt = sequelize.define(
  'OnlineExamAttempt',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    online_exam_id: { type: DataTypes.UUID, allowNull: false },
    student_id: { type: DataTypes.UUID, allowNull: false },
    answers_json: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    score: { type: DataTypes.DECIMAL(8, 2), allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'submitted' },
    school_id: { type: DataTypes.UUID, allowNull: false },
    submitted_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  { tableName: 'online_exam_attempts', underscored: true }
);

OnlineExamAttempt.associate = models => {
  OnlineExamAttempt.belongsTo(models.OnlineExam, {
    foreignKey: 'online_exam_id',
    as: 'exam'
  });
  OnlineExamAttempt.belongsTo(models.Student, {
    foreignKey: 'student_id',
    as: 'student'
  });
};

module.exports = OnlineExamAttempt;
