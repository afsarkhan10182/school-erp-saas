const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/logger');
const GradingService = require('~/services/academic/grading.service');

const ExamResult = sequelize.define('ExamResult', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  marks_obtained: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Marks cannot be negative' },
    },
  },
  percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Percentage cannot be negative' },
      max: { args: [100], msg: 'Percentage cannot exceed 100' },
    },
  },
  grade: {
    type: DataTypes.STRING(2),
    allowNull: true,
  },
  grade_points: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    comment: 'GPA grade points (0.00 to 4.00)',
  },
  rank: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Class rank in this exam',
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  is_absent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  exam_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'exams', key: 'id' },
  },
  student_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'students', key: 'id' },
  },
  school_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'schools', key: 'id' },
  },
  branch_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'branches', key: 'id' },
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
  updated_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
}, {
  tableName: 'exam_results',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['school_id'] },
    { fields: ['branch_id'] },
    { fields: ['exam_id'] },
    { fields: ['student_id'] },
    { fields: ['grade'] },
    { fields: ['rank'] },
    { fields: ['exam_id', 'student_id'], unique: true },
  ],
  hooks: {
    beforeSave: async (result) => {
      try {
        // Auto-calculate percentage if not provided
        if (result.marks_obtained && !result.percentage) {
          const exam = await sequelize.models.Exam.findByPk(result.exam_id);
          if (exam && exam.max_marks > 0) {
            result.percentage = (result.marks_obtained / exam.max_marks) * 100;
          }
        }
        
        // Auto-calculate grade and grade points using database-driven system
        if (result.percentage && !result.grade) {
          // Get school_id from exam
          const exam = await sequelize.models.Exam.findByPk(result.exam_id);
          if (exam && exam.school_id) {
            const gradeInfo = await GradingService.calculateGrade(result.percentage, exam.school_id);
            result.grade = gradeInfo.grade;
            result.grade_points = gradeInfo.grade_points;
          }
        }
      } catch (error) {
        logger.error('Error in ExamResult beforeSave hook:', error);
        // Don't throw error to prevent blocking the save operation
      }
    },
    afterCreate: async (result) => {
      logger.info(`Exam result created for student ${result.student_id} in exam ${result.exam_id}`);
    },
  },
});

// Database-driven grading system is now used via GradingService

ExamResult.associate = (models) => {
  ExamResult.belongsTo(models.Exam, { foreignKey: 'exam_id', as: 'exam' });
  ExamResult.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
  ExamResult.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  ExamResult.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  ExamResult.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdBy' });
  ExamResult.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedBy' });
};

module.exports = ExamResult;
