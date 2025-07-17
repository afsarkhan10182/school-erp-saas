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
    allowNull: true,
    references: {
      model: 'students',
      key: 'id',
    },
  },
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  middle_name: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  date_of_birth: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  gender: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  postal_code: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  country: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'India',
  },
  applied_class: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  academic_year: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  admission_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'new',
    validate: {
      isIn: [['new', 'transfer', 'readmission']],
    },
  },
  application_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending',
  },
  documents: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
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
    { fields: ['academic_year'] },
    { fields: ['school_id'] },
    { fields: ['branch_id'] },
    { fields: ['status'] },
    { fields: ['application_date'] },
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

  // Note: academic_year, class_id, and section_id are stored as strings in this table
  // For relationships, we would need to join based on string values or create separate lookup tables

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
