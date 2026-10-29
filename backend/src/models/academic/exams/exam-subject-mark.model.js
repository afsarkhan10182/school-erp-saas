const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const ExamSubjectMark = sequelize.define(
  'ExamSubjectMark',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    exam_schedule_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'exam_schedules', key: 'id' }
    },
    student_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'students', key: 'id' }
    },
    school_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'schools', key: 'id' }
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'branches', key: 'id' }
    },
    theory_marks_obtained: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    practical_marks_obtained: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    viva_marks_obtained: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    assignment_marks_obtained: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    marks_obtained: { type: DataTypes.DECIMAL(7, 2), allowNull: false, defaultValue: 0 },
    is_absent: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    }
  },
  {
    tableName: 'exam_subject_marks',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_exam_subject_marks_schedule_student',
        fields: ['exam_schedule_id', 'student_id'],
        unique: true
      },
      { name: 'idx_exam_subject_marks_scope_student', fields: ['school_id', 'branch_id', 'student_id'] }
    ]
  }
);

ExamSubjectMark.associate = models => {
  ExamSubjectMark.belongsTo(models.ExamSchedule, { foreignKey: 'exam_schedule_id', as: 'schedule' });
  ExamSubjectMark.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
  ExamSubjectMark.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  ExamSubjectMark.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  ExamSubjectMark.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdBy' });
  ExamSubjectMark.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedBy' });
};

module.exports = ExamSubjectMark;
