const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/shared/logger');

const Parent = sequelize.define(
  'Parent',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    father_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    father_phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    father_email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isFatherEmailValid(value) {
          if (value && value.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              throw new Error('Please provide a valid father email');
            }
          }
        }
      }
    },
    father_occupation: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    father_qualification: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    father_income: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      set(value) {
        // Convert empty string to null for DECIMAL field
        if (value === '' || value === undefined) {
          this.setDataValue('father_income', null);
        } else {
          this.setDataValue('father_income', value);
        }
      }
    },
    mother_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    mother_phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    mother_email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isMotherEmailValid(value) {
          if (value && value.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              throw new Error('Please provide a valid mother email');
            }
          }
        }
      }
    },
    mother_occupation: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    mother_qualification: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    mother_income: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      set(value) {
        // Convert empty string to null for DECIMAL field
        if (value === '' || value === undefined) {
          this.setDataValue('mother_income', null);
        } else {
          this.setDataValue('mother_income', value);
        }
      }
    },
    guardian_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Guardian name is required' }
      }
    },
    guardian_phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Guardian phone is required' }
      }
    },
    guardian_email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isGuardianEmailValid(value) {
          if (value && value.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              throw new Error('Please provide a valid guardian email');
            }
          }
        }
      }
    },
    guardian_relation: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Guardian relation is required' }
      }
    },
    guardian_occupation: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    guardian_income: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        isGuardianIncomeValid(value) {
          if (value !== null && value !== undefined && value !== '') {
            const numValue = parseFloat(value);
            if (isNaN(numValue) || numValue < 0) {
              throw new Error('Guardian income must be a valid positive number');
            }
          }
        }
      },
      set(value) {
        // Convert empty string to null for DECIMAL field
        if (value === '' || value === undefined) {
          this.setDataValue('guardian_income', null);
        } else {
          this.setDataValue('guardian_income', value);
        }
      }
    },
    guardian_education: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Address is required' }
      }
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
    emergency_contact: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
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
    tableName: 'parents',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['school_id'] },
      { fields: ['branch_id'] },
      { fields: ['father_phone'] },
      { fields: ['mother_phone'] }
    ],
    hooks: {
      afterCreate: async parent => {
        const contactInfo =
          parent.guardian_name || parent.father_name || parent.mother_name || 'Unknown';
        const phoneInfo =
          parent.guardian_phone || parent.father_phone || parent.mother_phone || 'No phone';
        logger.info(`New parent record created: ${contactInfo} (${phoneInfo})`);
      }
    }
  }
);

// Define associations
Parent.associate = models => {
  // Parent belongs to School
  Parent.belongsTo(models.School, {
    foreignKey: 'school_id',
    as: 'school'
  });

  // Parent belongs to User (portal login)
  Parent.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });

  // Parent belongs to User (created_by)
  Parent.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'createdBy'
  });

  // Parent belongs to User (updated_by)
  Parent.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updatedBy'
  });

  // Parent has many Students through StudentParent
  Parent.belongsToMany(models.Student, {
    through: models.StudentParent,
    foreignKey: 'parent_id',
    otherKey: 'student_id',
    as: 'students'
  });
};

module.exports = Parent;
