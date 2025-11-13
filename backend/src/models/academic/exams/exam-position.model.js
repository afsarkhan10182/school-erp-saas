const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const ExamPosition = sequelize.define(
  'ExamPosition',
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
      student_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'students', key: 'id' }
      },
      position: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Student position/rank in the exam'
      },
      total_marks: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Total marks obtained by student'
      },
      percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        comment: 'Percentage obtained by student'
      },
      grade: {
        type: DataTypes.STRING(10),
        allowNull: true,
        comment: 'Grade obtained by student'
      },
      class_position: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Position within the class'
      },
      section_position: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Position within the section'
      },
      subject_position: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Position within the subject'
      },
      is_passed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether student passed the exam'
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Additional remarks about the position'
      },
      teacher_comment: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Teacher comment on student performance'
      },
      principal_comment: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Principal comment on student performance'
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
      tableName: 'exam_positions',
      timestamps: true,
      underscored: true,
      paranoid: false,
      indexes: [
        {
          name: 'idx_exam_positions_exam_id',
          fields: ['exam_id']
        },
        {
          name: 'idx_exam_positions_student_id',
          fields: ['student_id']
        },
        {
          name: 'idx_exam_positions_position',
          fields: ['position']
        },
        {
          name: 'idx_exam_positions_school_id',
          fields: ['school_id']
        },
        {
          name: 'idx_exam_positions_branch_id',
          fields: ['branch_id']
        },
        {
          name: 'idx_exam_positions_unique',
          fields: ['exam_id', 'student_id'],
          unique: true
        }
      ]
    }
  );

// Associations
ExamPosition.associate = models => {
  ExamPosition.belongsTo(models.Exam, {
    foreignKey: 'exam_id',
    as: 'exam'
  });

  ExamPosition.belongsTo(models.Student, {
    foreignKey: 'student_id',
    as: 'student'
  });

  ExamPosition.belongsTo(models.School, {
    foreignKey: 'school_id',
    as: 'school'
  });

  ExamPosition.belongsTo(models.Branch, {
    foreignKey: 'branch_id',
    as: 'branch'
  });

  ExamPosition.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'createdBy'
  });

  ExamPosition.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updatedBy'
  });
};

module.exports = ExamPosition;
