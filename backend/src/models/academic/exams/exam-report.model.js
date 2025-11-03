const { DataTypes } = require('sequelize');

const ExamReport = sequelize => {
  const ExamReport = sequelize.define(
    'ExamReport',
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
      report_type: {
        type: DataTypes.ENUM(
          'class_wise',
          'subject_wise',
          'student_wise',
          'position_wise',
          'summary',
          'detailed'
        ),
        allowNull: false,
        comment: 'Type of exam report'
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Report title'
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Report description'
      },
      template_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'report_templates', key: 'id' }
      },
      filters: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Applied filters for the report'
      },
      config: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Report configuration settings'
      },
      file_path: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'Path to generated report file'
      },
      file_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Generated report file name'
      },
      file_size: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'File size in bytes'
      },
      mime_type: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'MIME type of the file'
      },
      status: {
        type: DataTypes.ENUM('pending', 'generating', 'completed', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Report generation status'
      },
      generated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the report was generated'
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the report file expires'
      },
      download_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Number of times report was downloaded'
      },
      is_public: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether report is publicly accessible'
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
      tableName: 'exam_reports',
      timestamps: true,
      paranoid: false,
      indexes: [
        {
          name: 'idx_exam_reports_exam_id',
          fields: ['exam_id']
        },
        {
          name: 'idx_exam_reports_report_type',
          fields: ['report_type']
        },
        {
          name: 'idx_exam_reports_status',
          fields: ['status']
        },
        {
          name: 'idx_exam_reports_school_id',
          fields: ['school_id']
        },
        {
          name: 'idx_exam_reports_branch_id',
          fields: ['branch_id']
        },
        {
          name: 'idx_exam_reports_created_at',
          fields: ['created_at']
        }
      ]
    }
  );

  // Associations
  ExamReport.associate = models => {
    ExamReport.belongsTo(models.Exam, {
      foreignKey: 'exam_id',
      as: 'exam'
    });

    ExamReport.belongsTo(models.ReportTemplate, {
      foreignKey: 'template_id',
      as: 'template'
    });

    ExamReport.belongsTo(models.School, {
      foreignKey: 'school_id',
      as: 'school'
    });

    ExamReport.belongsTo(models.Branch, {
      foreignKey: 'branch_id',
      as: 'branch'
    });

    ExamReport.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'createdBy'
    });

    ExamReport.belongsTo(models.User, {
      foreignKey: 'updated_by',
      as: 'updatedBy'
    });
  };

  return ExamReport;
};

module.exports = ExamReport;
