const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { logger } = require('../utils/logger');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  admission_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Admission number is required' },
    },
  },
  roll_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'First name is required' },
    },
  },
  last_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Last name is required' },
    },
  },
  middle_name: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  date_of_birth: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Date of birth is required' },
      isDate: { msg: 'Please provide a valid date' },
    },
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Gender is required' },
    },
  },
  blood_group: {
    type: DataTypes.STRING(5),
    allowNull: true,
  },
  religion: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  caste: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  category: {
    type: DataTypes.ENUM('general', 'obc', 'sc', 'st', 'other'),
    allowNull: true,
  },
  nationality: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Indian',
  },
  mother_tongue: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: { msg: 'Please provide a valid email' },
    },
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  emergency_contact: {
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
  admission_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  admission_class: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Admission class is required' },
    },
  },
  current_class: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Current class is required' },
    },
  },
  section: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  class_id: {
    type: DataTypes.UUID,
    allowNull: true,
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
  academic_year: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Academic year is required' },
    },
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'transferred', 'graduated', 'dropped'),
    allowNull: false,
    defaultValue: 'active',
  },
  photo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  documents: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  medical_info: {
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
  user_id: {
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
  tableName: 'students',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['school_id', 'admission_number'], unique: true },
    { fields: ['branch_id', 'class_id', 'section_id', 'roll_number'], unique: true },
    { fields: ['school_id'] },
    { fields: ['branch_id'] },
    { fields: ['status'] },
    { fields: ['academic_year'] },
    { fields: ['current_class'] },
    { fields: ['admission_date'] },
    { fields: ['class_id'] },
    { fields: ['section_id'] },
    { fields: ['class_id', 'section_id'] },
    { fields: ['branch_id', 'class_id', 'section_id'] },
  ],
  hooks: {
    beforeCreate: async (student) => {
      // Generate admission number if not provided
      if (!student.admission_number) {
        const year = new Date().getFullYear();
        const count = await Student.count({ where: { school_id: student.school_id } });
        student.admission_number = `${year}${String(count + 1).padStart(4, '0')}`;
      }
    },
    afterCreate: async (student) => {
      logger.info(`New student created: ${student.first_name} ${student.last_name} (${student.admission_number})`);
    },
  },
});

// Define associations
Student.associate = (models) => {
  // Student belongs to School
  Student.belongsTo(models.School, {
    foreignKey: 'school_id',
    as: 'school',
  });

  // Student belongs to Branch
  Student.belongsTo(models.Branch, {
    foreignKey: 'branch_id',
    as: 'branch',
  });

  // Student belongs to User (for login account)
  Student.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user',
  });

  // Student belongs to User (created_by)
  Student.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'createdBy',
  });

  // Student belongs to User (updated_by)
  Student.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updatedBy',
  });

  // Student belongs to Class
  Student.belongsTo(models.Class, {
    foreignKey: 'class_id',
    as: 'class',
  });

  // Student belongs to Section
  Student.belongsTo(models.Section, {
    foreignKey: 'section_id',
    as: 'sectionInfo',
  });

  // Student has many Parents through StudentParent
  Student.belongsToMany(models.Parent, {
    through: models.StudentParent,
    foreignKey: 'student_id',
    otherKey: 'parent_id',
    as: 'parents',
  });

  // Student has many FeeInvoices
  // Temporarily disabled due to database schema mismatch
  // Student.hasMany(models.FeeInvoice, {
  //   foreignKey: 'student_id',
  //   as: 'feeInvoices',
  // });

  // Student has many Admissions
  Student.hasMany(models.Admission, {
    foreignKey: 'student_id',
    as: 'admissions',
  });
};

module.exports = Student;
