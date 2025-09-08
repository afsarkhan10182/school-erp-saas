const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/logger');

const Exam = sequelize.define('Exam', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Exam name is required' },
    },
  },
  exam_type_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'exam_types', key: 'id' },
  },
  weightage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 100.00,
    validate: {
      min: { args: [0], msg: 'Weightage must be at least 0' },
      max: { args: [100], msg: 'Weightage cannot exceed 100' },
    },
  },
  max_marks: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 100,
    validate: {
      min: { args: [1], msg: 'Maximum marks must be at least 1' },
    },
  },
  exam_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  duration_minutes: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duration in minutes if not using start/end time',
  },
  academic_year: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  status_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'exam_statuses', key: 'id' },
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  instructions: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  class_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'classes', key: 'id' },
  },
  section_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'sections', key: 'id' },
  },
  subject_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'subjects', key: 'id' },
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
  tableName: 'exams',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_exams_school_id',
      fields: ['school_id'],
    },
    {
      name: 'idx_exams_branch_id',
      fields: ['branch_id'],
    },
    {
      name: 'idx_exams_class_id',
      fields: ['class_id'],
    },
    {
      name: 'idx_exams_exam_type_id',
      fields: ['exam_type_id'],
    },
    {
      name: 'idx_exams_status_id',
      fields: ['status_id'],
    },
    {
      name: 'idx_exams_is_active',
      fields: ['is_active'],
    },
    {
      name: 'idx_exams_academic_year',
      fields: ['academic_year'],
    },
    {
      name: 'idx_exams_exam_date',
      fields: ['exam_date'],
    },
  ],
});

// Associations
Exam.associate = (models) => {
  Exam.belongsTo(models.ExamType, {
    foreignKey: 'exam_type_id',
    as: 'examType',
  });
  
  Exam.belongsTo(models.ExamStatus, {
    foreignKey: 'status_id',
    as: 'examStatus',
  });
  
  Exam.belongsTo(models.Class, {
    foreignKey: 'class_id',
    as: 'class',
  });
  
  Exam.belongsTo(models.Section, {
    foreignKey: 'section_id',
    as: 'section',
  });
  
  Exam.belongsTo(models.Subject, {
    foreignKey: 'subject_id',
    as: 'subject',
  });
  
  Exam.belongsTo(models.School, {
    foreignKey: 'school_id',
    as: 'school',
  });
  
  Exam.belongsTo(models.Branch, {
    foreignKey: 'branch_id',
    as: 'branch',
  });
  
  Exam.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator',
  });
  
  Exam.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updater',
  });
  
  Exam.hasMany(models.ExamResult, {
    foreignKey: 'exam_id',
    as: 'results',
  });
};

module.exports = Exam;
