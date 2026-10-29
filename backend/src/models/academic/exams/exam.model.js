const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/shared/logger');

const Exam = sequelize.define(
  'Exam',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Exam name is required' }
      }
    },
    type_id: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      validate: {
        isIn: {
          args: [[1, 2, 3]],
          msg: 'Exam type must be 1 (marks), 2 (grade), or 3 (both)'
        }
      }
    },
    weightage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 100.0,
      validate: {
        min: { args: [0], msg: 'Weightage must be at least 0' },
        max: { args: [100], msg: 'Weightage cannot exceed 100' }
      }
    },
    max_marks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      validate: {
        min: { args: [1], msg: 'Maximum marks must be at least 1' }
      }
    },
    academic_year: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    term_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'terms', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    publish_status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    result_status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    mark_distribution_ids: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of mark distribution IDs associated with this exam'
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
    tableName: 'exams',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_exams_school_id',
        fields: ['school_id']
      },
      {
        name: 'idx_exams_branch_id',
        fields: ['branch_id']
      },
      // class_id index removed - field no longer exists
      // {
      //   name: 'idx_exams_class_id',
      //   fields: ['class_id']
      // },
      {
        name: 'idx_exams_type_id',
        fields: ['type_id']
      },
      {
        name: 'idx_exams_is_active',
        fields: ['is_active']
      },
      {
        name: 'idx_exams_academic_year',
        fields: ['academic_year']
      },
      {
        name: 'idx_exams_term_id',
        fields: ['term_id']
      }
    ]
  }
);

// Associations
Exam.associate = models => {
  // Note: Exam type is now hardcoded (1, 2, 3) - no foreign key relationship

  Exam.belongsTo(models.School, {
    foreignKey: 'school_id',
    as: 'school'
  });

  Exam.belongsTo(models.Branch, {
    foreignKey: 'branch_id',
    as: 'branch'
  });

  Exam.belongsTo(models.Term, {
    foreignKey: 'term_id',
    as: 'term'
  });

  Exam.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator'
  });

  Exam.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updater'
  });

  Exam.hasMany(models.ExamResult, {
    foreignKey: 'exam_id',
    as: 'results'
  });

  Exam.hasMany(models.ExamSchedule, {
    foreignKey: 'exam_id',
    as: 'schedules'
  });

  Exam.belongsToMany(models.ReportCardSetup, {
    through: models.ReportCardSetupExam,
    foreignKey: 'exam_id',
    otherKey: 'setup_id',
    as: 'reportCardSetups'
  });
};

module.exports = Exam;
