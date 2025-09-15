const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/shared/logger');
const { ModuleConfig } = require('~/utils/core/moduleConfig');
const ApiError = require('~/utils/shared/ApiError');

const Student = sequelize.define(
  'Student',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    admission_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Admission number is required' }
      }
    },
    roll_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    first_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'First name is required' }
      }
    },
    last_name: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    middle_name: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    aadhaar_number: {
      type: DataTypes.STRING(12),
      allowNull: true,
      validate: {
        isAadhaarValid(value) {
          if (value && value.trim() !== '') {
            if (!/^\d{12}$/.test(value)) {
              throw new Error('Aadhaar number must be exactly 12 digits');
            }
          }
        }
      }
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Date of birth is required' },
        isDate: { msg: 'Please provide a valid date' }
      }
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Gender is required' }
      }
    },
    blood_group: {
      type: DataTypes.STRING(5),
      allowNull: true
    },
    religion: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    caste: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    category: {
      type: DataTypes.ENUM('general', 'obc', 'sc', 'st', 'other'),
      allowNull: true,
      defaultValue: 'general'
    },
    nationality: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Indian'
    },
    mother_tongue: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmailValid(value) {
          if (value && value.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              throw new Error('Please provide a valid email');
            }
          }
        }
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    emergency_contact: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    state: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    postal_code: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'India'
    },
    admission_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    admission_class: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Admission class is required' }
      }
    },
    current_class: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Current class is required' }
      }
    },
    section: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    class_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'classes',
        key: 'id'
      }
    },
    stream_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'streams',
        key: 'id'
      }
    },
    section_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'sections',
        key: 'id'
      }
    },
    academic_year: {
      type: DataTypes.STRING(10),
      allowNull: true
      // Removed defaultValue to prevent single year format (e.g., "2025")
      // Academic year should always be in format "2025-2026" and set by controller logic
    },
    // Junior College specific fields
    admission_sought_in: {
      type: DataTypes.ENUM('arts', 'commerce', 'science'),
      allowNull: true,
      comment: 'Stream selection (Arts/Commerce/Science)'
    },
    previous_exam_details: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Previous exam details (SSC, FYJC, SYJC, etc.)'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'transferred', 'graduated', 'dropped', 'deleted'),
      allowNull: false,
      defaultValue: 'active'
    },
    photo: {
      type: DataTypes.STRING,
      allowNull: true
    },
    documents: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    medical_info: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    school_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'schools',
        key: 'id'
      }
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'branches',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  },
  {
    tableName: 'students',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['school_id', 'branch_id', 'admission_number'], unique: true },
      {
        fields: ['school_id', 'branch_id', 'class_id', 'section_id', 'stream_id', 'roll_number'],
        unique: true
      },
      { fields: ['school_id'] },
      { fields: ['branch_id'] },
      { fields: ['status'] },
      { fields: ['academic_year'] },
      { fields: ['current_class'] },
      { fields: ['admission_date'] },
      { fields: ['class_id'] },
      { fields: ['section_id'] },
      { fields: ['class_id', 'section_id'] },
      { fields: ['branch_id', 'class_id', 'section_id'] }
    ],
    hooks: {
      beforeCreate: async student => {
        // Check subscription limits
        const School = require('../administration/school.model');
        const SubscriptionPlan = require('../administration/subscription-plan.model');
        const school = await School.findByPk(student.school_id);
        if (school) {
          // Plans and limits must come from DB; in dev, allow a temporary fallback for local testing
          let plan = null;
          if (school.subscription_plan) {
            plan = await SubscriptionPlan.findOne({
              where: { code: school.subscription_plan, is_active: true }
            });
          }

          if (!plan) {
            throw new Error('Invalid subscription plan configuration. Please contact support.');
          }

          if (plan) {
            const maxStudents = plan.max_students || plan.maxStudents || 50;
            if (maxStudents !== -1) {
              const studentCount = await Student.count({
                where: {
                  school_id: student.school_id,
                  status: { [require('sequelize').Op.ne]: 'deleted' }
                }
              });

              if (studentCount >= maxStudents) {
                throw new Error(
                  `Student limit reached. Maximum ${maxStudents} students allowed in your current plan. Please upgrade to add more students.`
                );
              }
            }
          }
        }

        // Generate admission number if not provided
        if (!student.admission_number) {
          const year = new Date().getFullYear();
          const count = await Student.count({ where: { school_id: student.school_id } });
          student.admission_number = `${year}${String(count + 1).padStart(4, '0')}`;
        }
      },
      afterCreate: async student => {
        logger.info(
          `New student created: ${student.first_name} ${student.last_name} (${student.admission_number})`
        );
      }
    }
  }
);

// Define associations
Student.associate = models => {
  // Student belongs to School
  Student.belongsTo(models.School, {
    foreignKey: 'school_id',
    as: 'school'
  });

  // Student belongs to Branch
  Student.belongsTo(models.Branch, {
    foreignKey: 'branch_id',
    as: 'branch'
  });

  // Student belongs to User (for login account)
  Student.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });

  // Student belongs to User (created_by)
  Student.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'createdBy'
  });

  // Student belongs to User (updated_by)
  Student.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updatedBy'
  });

  // Student belongs to Class
  Student.belongsTo(models.Class, {
    foreignKey: 'class_id',
    as: 'class'
  });

  // Student belongs to Stream
  Student.belongsTo(models.Stream, {
    foreignKey: 'stream_id',
    as: 'stream'
  });

  // Student belongs to Section
  Student.belongsTo(models.Section, {
    foreignKey: 'section_id',
    as: 'sectionInfo'
  });

  // Student has many Parents through StudentParent
  Student.belongsToMany(models.Parent, {
    through: models.StudentParent,
    foreignKey: 'student_id',
    otherKey: 'parent_id',
    as: 'parents'
  });

  // Student has many FeeInvoices
  // Temporarily disabled due to database schema mismatch
  // Student.hasMany(models.FeeInvoice, {
  //   foreignKey: 'student_id',
  //   as: 'feeInvoices',
  // });
};

module.exports = Student;
