const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/shared/logger');

const ExamSchedule = sequelize.define(
  'ExamSchedule',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    exam_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'exams', key: 'id' }
    },
    class_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'classes', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    section_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'sections', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    subject_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'subjects', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    exam_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Exam date is required' }
      }
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: { args: [1], msg: 'Duration must be at least 1 minute' }
      },
      comment: 'Duration in minutes - auto-calculated from start/end time or entered directly'
    },
    exam_hall_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'exam_halls', key: 'id' }
    },
    invigilator_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      comment: 'Teacher assigned as invigilator'
    },
    additional_invigilators: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of additional invigilator user IDs for large exams'
    },
    status_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'exam_statuses', key: 'id' }
    },
    seating_arrangement: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JSON containing seating plan if needed'
    },
    special_instructions: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Day-specific instructions (e.g., "Bring calculator")'
    },
    is_rescheduled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    rescheduled_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    original_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Original date if rescheduled'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    // Mark Distribution Fields
    theory_marks: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'Theory marks must be at least 0' }
      }
    },
    practical_marks: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'Practical marks must be at least 0' }
      }
    },
    viva_marks: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'Viva marks must be at least 0' }
      }
    },
    assignment_marks: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'Assignment marks must be at least 0' }
      }
    },
    total_marks: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: { args: [1], msg: 'Total marks must be at least 1' }
      }
    },
    pass_marks: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: { args: [0], msg: 'Pass marks must be at least 0' }
      }
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'branches', key: 'id' }
    },
    school_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'schools', key: 'id' }
    },
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
    tableName: 'exam_schedules',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_exam_schedules_exam_id',
        fields: ['exam_id']
      },
      {
        name: 'idx_exam_schedules_branch_id',
        fields: ['branch_id']
      },
      {
        name: 'idx_exam_schedules_school_id',
        fields: ['school_id']
      },
      {
        name: 'idx_exam_schedules_exam_date',
        fields: ['exam_date']
      },
      {
        name: 'idx_exam_schedules_status_id',
        fields: ['status_id']
      },
      {
        name: 'idx_exam_schedules_exam_hall_id',
        fields: ['exam_hall_id']
      },
      {
        name: 'idx_exam_schedules_invigilator_id',
        fields: ['invigilator_id']
      },
      {
        name: 'idx_exam_schedules_is_active',
        fields: ['is_active']
      },
      {
        name: 'idx_exam_schedules_class_id',
        fields: ['class_id']
      },
      {
        name: 'idx_exam_schedules_section_id',
        fields: ['section_id']
      },
      {
        name: 'idx_exam_schedules_subject_id',
        fields: ['subject_id']
      },
      {
        name: 'idx_exam_schedules_unique_schedule',
        fields: ['exam_id', 'branch_id', 'exam_date'],
        unique: true
      }
    ]
  }
);

// Associations
ExamSchedule.associate = models => {
  ExamSchedule.belongsTo(models.Exam, {
    foreignKey: 'exam_id',
    as: 'exam'
  });

  ExamSchedule.belongsTo(models.ExamHall, {
    foreignKey: 'exam_hall_id',
    as: 'examHall'
  });

  ExamSchedule.belongsTo(models.User, {
    foreignKey: 'invigilator_id',
    as: 'invigilator'
  });

  ExamSchedule.belongsTo(models.ExamStatus, {
    foreignKey: 'status_id',
    as: 'status'
  });

  ExamSchedule.belongsTo(models.Branch, {
    foreignKey: 'branch_id',
    as: 'branch'
  });

  ExamSchedule.belongsTo(models.School, {
    foreignKey: 'school_id',
    as: 'school'
  });

  ExamSchedule.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator'
  });

  ExamSchedule.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updater'
  });

  ExamSchedule.belongsTo(models.Class, {
    foreignKey: 'class_id',
    as: 'class'
  });

  ExamSchedule.belongsTo(models.Section, {
    foreignKey: 'section_id',
    as: 'section'
  });

  ExamSchedule.belongsTo(models.Subject, {
    foreignKey: 'subject_id',
    as: 'subject'
  });
};

module.exports = ExamSchedule;
