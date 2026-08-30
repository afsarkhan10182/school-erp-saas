const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const OnlineExamQuestion = sequelize.define(
  'OnlineExamQuestion',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    online_exam_id: { type: DataTypes.UUID, allowNull: false },
    question_text: { type: DataTypes.TEXT, allowNull: false },
    options_json: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    correct_option: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    marks: { type: DataTypes.DECIMAL(8, 2), allowNull: false, defaultValue: 1 },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    school_id: { type: DataTypes.UUID, allowNull: false }
  },
  { tableName: 'online_exam_questions', underscored: true }
);

OnlineExamQuestion.associate = models => {
  OnlineExamQuestion.belongsTo(models.OnlineExam, {
    foreignKey: 'online_exam_id',
    as: 'exam'
  });
};

module.exports = OnlineExamQuestion;
