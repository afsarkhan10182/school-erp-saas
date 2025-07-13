const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { logger } = require('../utils/logger');

const Admission = sequelize.define('Admission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  application_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Application number is required' },
    },
  },
  student_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'students',
      key: 'id',
    },
  },
  academic_year_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'academic_years',
      key: 'id',
    },
  },
  class_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'classes',
      key: 'id',
    },
  },
  section_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'sections',
      key: 'id',
    },
  },
  application_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  admission_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'under_review', 'approved', 'rejected', 'admitted', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'medium',
  },
  admission_type: {
    type: DataTypes.ENUM('new', 'transfer', 'readmission'),
    allowNull: false,
    defaultValue: 'new',
  },
  previous_school: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  previous_class: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  transfer_certificate: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  documents_submitted: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  entrance_test_score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  interview_score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  total_score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  fees_paid: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  school_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'schools',
      key: 'id',
    },
  },
  branch_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'branches',
      key: 'id',
    },
  },
  processed_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  updated_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'admissions',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['school_id', 'application_number'], unique: true },
    { fields: ['student_id'] },
    { fields: ['academic_year_id'] },
    { fields: ['class_id'] },
    { fields: ['section_id'] },
    { fields: ['school_id'] },
    { fields: ['branch_id'] },
    { fields: ['status'] },
    { fields: ['admission_type'] },
    { fields: ['application_date'] },
    { fields: ['admission_date'] },
  ],
  hooks: {
    beforeCreate: async (admission) => {
      // Generate application number if not provided
      if (!admission.application_number) {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const count = await Admission.count({ where: { school_id: admission.school_id } });
        admission.application_number = `APP-${year}${month}-${String(count + 1).padStart(4, '0')}`;
      }
    },
    afterCreate: async (admission) => {
      logger.info(`New admission application: ${admission.application_number} for student ${admission.student_id}`);
    },
    afterUpdate: async (admission) => {
      if (admission.changed('status')) {
        logger.info(`Admission ${admission.application_number} status changed to: ${admission.status}`);
      }
    },
  },
});

// Define associations
Admission.associate = (models) => {
  // Admission belongs to Student
  Admission.belongsTo(models.Student, {
    foreignKey: 'student_id',
    as: 'student',
  });

  // Admission belongs to AcademicYear
  Admission.belongsTo(models.AcademicYear, {
    foreignKey: 'academic_year_id',
    as: 'academicYear',
  });

  // Admission belongs to Class
  Admission.belongsTo(models.Class, {
    foreignKey: 'class_id',
    as: 'class',
  });

  // Admission belongs to Section
  Admission.belongsTo(models.Section, {
    foreignKey: 'section_id',
    as: 'section',
  });

  // Admission belongs to School
  Admission.belongsTo(models.School, {
    foreignKey: 'school_id',
    as: 'school',
  });

  // Admission belongs to Branch
  Admission.belongsTo(models.Branch, {
    foreignKey: 'branch_id',
    as: 'branch',
  });

  // Admission belongs to User (processed_by)
  Admission.belongsTo(models.User, {
    foreignKey: 'processed_by',
    as: 'processedBy',
  });

  // Admission belongs to User (created_by)
  Admission.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'createdBy',
  });

  // Admission belongs to User (updated_by)
  Admission.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updatedBy',
  });
};

module.exports = Admission;
