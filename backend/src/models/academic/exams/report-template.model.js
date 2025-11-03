const { DataTypes } = require('sequelize');

const ReportTemplate = sequelize => {
  const ReportTemplate = sequelize.define(
    'ReportTemplate',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Template name'
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Template code'
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Template description'
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
        comment: 'Type of report this template is for'
      },
      template_content: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'HTML template content'
      },
      css_styles: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'CSS styles for the template'
      },
      header_template: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Header template content'
      },
      footer_template: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Footer template content'
      },
      config: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Template configuration settings'
      },
      is_default: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether this is the default template for its type'
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether template is active'
      },
      school_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'schools', key: 'id' },
        comment: 'Null for global templates, specific school for school-specific templates'
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
      tableName: 'report_templates',
      timestamps: true,
      paranoid: false,
      indexes: [
        {
          name: 'idx_report_templates_code',
          fields: ['code'],
          unique: true
        },
        {
          name: 'idx_report_templates_report_type',
          fields: ['report_type']
        },
        {
          name: 'idx_report_templates_school_id',
          fields: ['school_id']
        },
        {
          name: 'idx_report_templates_is_active',
          fields: ['is_active']
        }
      ]
    }
  );

  // Associations
  ReportTemplate.associate = models => {
    ReportTemplate.belongsTo(models.School, {
      foreignKey: 'school_id',
      as: 'school'
    });

    ReportTemplate.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'createdBy'
    });

    ReportTemplate.belongsTo(models.User, {
      foreignKey: 'updated_by',
      as: 'updatedBy'
    });

    ReportTemplate.hasMany(models.ExamReport, {
      foreignKey: 'template_id',
      as: 'examReports'
    });
  };

  return ReportTemplate;
};

module.exports = ReportTemplate;
