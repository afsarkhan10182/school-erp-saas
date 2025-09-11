const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/logger');
const { ModuleConfig } = require('~/utils/moduleConfig');

const { ROLES } = require('~/utils/roleManager');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: 'Please provide a valid email' },
        notEmpty: { msg: 'Email is required' }
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Password is required' },
        len: {
          args: [8, 100],
          msg: 'Password must be between 8 and 100 characters'
        }
      }
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
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Last name is required' }
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    profile_image: {
      type: DataTypes.STRING,
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM(Object.values(ROLES)),
      allowNull: false,
      defaultValue: ROLES.STUDENT
    },
    permissions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: []
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_ip: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    two_factor_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    two_factor_secret: {
      type: DataTypes.STRING,
      allowNull: true
    },
    reset_password_token: {
      type: DataTypes.STRING,
      allowNull: true
    },
    reset_password_expires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended', 'pending'),
      allowNull: false,
      defaultValue: 'active'
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    school_id: {
      type: DataTypes.UUID,
      allowNull: true,
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
    tableName: 'users',
    timestamps: true,
    underscored: true,
    paranoid: false, // Disable soft deletes
    indexes: [
      // Note: Unique constraint is handled at database level with school_id + branch_id + email
      // The actual constraint: CREATE UNIQUE INDEX users_school_branch_email_unique ON users (school_id, branch_id, email)
      { fields: ['school_id'] },
      { fields: ['branch_id'] },
      { fields: ['role'] },
      { fields: ['status'] }
    ],
    hooks: {
      beforeCreate: async user => {
        // Check subscription limits for staff users
        if (user.school_id && user.role !== 'super_admin' && user.role !== 'school_admin') {
          const School = require('./school.model');
          const SubscriptionPlan = require('./subscription-plan.model');
          const school = await School.findByPk(user.school_id);
          if (school) {
            // First try to get plan from database
            let plan = null;
            if (school.subscription_plan) {
              plan = await SubscriptionPlan.findOne({
                where: { code: school.subscription_plan, is_active: true }
              });
            }

            // If not found in database, allow dev-only fallback; prod must fail loudly
            if (!plan) {
              throw new Error('Invalid subscription plan configuration. Please contact support.');
            }

            if (plan) {
              const maxStaff = plan.max_staff || plan.maxStaff || 10;
              if (maxStaff !== -1) {
                const User = require('./user.model');
                const userCount = await User.count({
                  where: {
                    school_id: user.school_id,
                    status: 'active',
                    role: { [require('sequelize').Op.notIn]: ['super_admin', 'school_admin'] }
                  }
                });

                if (userCount >= maxStaff) {
                  throw new Error(
                    `Staff limit reached. Maximum ${maxStaff} staff members allowed in your current plan. Please upgrade to add more staff.`
                  );
                }
              }
            }
          }
        }

        if (user.password) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
      beforeUpdate: async user => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
      afterCreate: user => {
        logger.info(`New user created: ${user.email} (${user.role})`);
      }
    }
  }
);

// Instance method to check password
User.prototype.isPasswordMatch = async function (candidatePassword) {
  logger.info('Password comparison - Candidate:', candidatePassword);
  logger.info('Password comparison - Stored hash:', this.password);
  const result = await bcrypt.compare(candidatePassword, this.password);
  logger.info('Password comparison - Result:', result);
  return result;
};

// Instance method to generate JWT token
User.prototype.generateAuthToken = function () {
  const payload = {
    id: this.id,
    email: this.email,
    role: this.role,
    school_id: this.school_id,
    branch_id: this.branch_id
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Static method to find user by credentials
User.findByCredentials = async (email, password) => {
  const user = await User.findOne({
    where: {
      email
    }
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isMatch = await user.isPasswordMatch(password);

  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  return user;
};

// Define associations
User.associate = models => {
  // User belongs to School
  User.belongsTo(models.School, {
    foreignKey: 'school_id',
    as: 'school'
  });

  // User belongs to Branch
  User.belongsTo(models.Branch, {
    foreignKey: 'branch_id',
    as: 'branch'
  });

  // User can be created by another user
  User.belongsTo(User, {
    foreignKey: 'created_by',
    as: 'createdBy'
  });

  // User can be updated by another user
  User.belongsTo(User, {
    foreignKey: 'updated_by',
    as: 'updatedBy'
  });
};

module.exports = User;
module.exports.ROLES = ROLES;
