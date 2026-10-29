const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const HomeworkSubmission = sequelize.define(
  'HomeworkSubmission',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    homework_id: { type: DataTypes.UUID, allowNull: false },
    student_id: { type: DataTypes.UUID, allowNull: false },
    school_id: { type: DataTypes.UUID, allowNull: false },
    branch_id: { type: DataTypes.UUID, allowNull: true },
    submission_text: { type: DataTypes.TEXT, allowNull: false },
    submitted_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    marks: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
    remarks: { type: DataTypes.TEXT, allowNull: true },
    evaluated_by: { type: DataTypes.UUID, allowNull: true },
    evaluated_at: { type: DataTypes.DATE, allowNull: true }
  },
  {
    tableName: 'homework_submissions',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['homework_id', 'student_id'], name: 'unique_homework_student_submission' },
      { fields: ['school_id', 'branch_id'] }
    ]
  }
);

HomeworkSubmission.associate = models => {
  HomeworkSubmission.belongsTo(models.Homework, { foreignKey: 'homework_id', as: 'homework' });
  HomeworkSubmission.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
  HomeworkSubmission.belongsTo(models.User, { foreignKey: 'evaluated_by', as: 'evaluator' });
};

module.exports = HomeworkSubmission;
