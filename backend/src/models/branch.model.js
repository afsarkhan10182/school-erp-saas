const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/logger');
const { ModuleConfig } = require('~/utils/moduleConfig');

const Branch = sequelize.define('Branch', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Branch name is required' },
      len: {
        args: [2, 100],
        msg: 'Branch name must be between 2 and 100 characters',
      },
    },
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Branch code is required' },
      isAlphanumeric: { msg: 'Branch code must be alphanumeric' },
      len: {
        args: [2, 20],
        msg: 'Branch code must be between 2 and 20 characters',
      },
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Email is required' },
      isEmail: { msg: 'Please provide a valid email' },
    },
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
    allowNull: false,
    validate: {
      notEmpty: { msg: 'City is required' },
    },
  },
  state: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'State is required' },
    },
  },
  country: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'India',
  },
  postal_code: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  principal_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  principal_email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: { msg: 'Please provide a valid email' },
    },
  },
  principal_phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'INR',
  },
  currency_symbol: {
    type: DataTypes.STRING(5),
    allowNull: false,
    defaultValue: '₹',
  },
  is_main_branch: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
    allowNull: false,
    defaultValue: 'active',
  },
  settings: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    // This will store additional fields like currency, logos, etc.
  },
  school_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'schools',
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
  // Receipt customization fields
  receipt_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Custom name to display on receipts for this branch',
    validate: {
      len: {
        args: [0, 100],
        msg: 'Receipt name must be between 0 and 100 characters'
      }
    }
  },
  receipt_logo: {
    type: DataTypes.STRING(500), // Optimized for URL storage
    allowNull: true,
    comment: 'Custom logo URL to display on receipts for this branch',
    validate: {
      isUrl: {
        msg: 'Receipt logo must be a valid URL'
      },
      len: {
        args: [0, 500],
        msg: 'Receipt logo URL must be between 0 and 500 characters'
      }
    }
  },
  receipt_address: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Custom address to display on receipts for this branch'
  },
  receipt_contact: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Custom contact to display on receipts for this branch',
    validate: {
      len: {
        args: [0, 100],
        msg: 'Receipt contact must be between 0 and 100 characters'
      }
    }
  },
}, {
  tableName: 'branches',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['school_id'] },
    { 
      fields: ['school_id', 'code'],
      unique: true,
      name: 'unique_branch_code_per_school'
    },
    { fields: ['status'] },
  ],
  hooks: {
    beforeCreate: async (branch) => {
      // Check subscription limits
      const School = require('./school.model');
      const SubscriptionPlan = require('./subscription-plan.model');
      const school = await School.findByPk(branch.school_id);
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
          const maxBranches = plan.max_branches || plan.maxBranches || 1;
          if (maxBranches !== -1) {
            const Branch = require('./branch.model');
            const branchCount = await Branch.count({ 
              where: { 
                school_id: branch.school_id,
                status: 'active'
              } 
            });
            
            if (branchCount >= maxBranches) {
              throw new Error(`Branch limit reached. Maximum ${maxBranches} branches allowed in your current plan. Please upgrade to add more branches.`);
            }
          }
        }
      }
      
      // Initialize settings with default values
      if (!branch.settings) {
        branch.settings = {};
      }
      
      // Set currency and currency_symbol in settings if not already set
      if (!branch.settings.currency) {
        branch.settings.currency = branch.currency || 'INR';
      }
      if (!branch.settings.currency_symbol) {
        branch.settings.currency_symbol = branch.currency_symbol || '₹';
      }
      
      // Set other default settings if not present
      if (!branch.settings.system_logo) {
        branch.settings.system_logo = null;
      }
      if (!branch.settings.text_logo) {
        branch.settings.text_logo = null;
      }
      if (!branch.settings.printing_logo) {
        branch.settings.printing_logo = null;
      }
      if (!branch.settings.report_card_design) {
        branch.settings.report_card_design = null;
      }
    },
    afterCreate: async (branch) => {
      logger.info(`New branch created: ${branch.name} (${branch.id})`);
    },
    afterUpdate: async (branch) => {
      logger.info(`Branch updated: ${branch.name} (${branch.id})`);
    },
  },
});

Branch.associate = (models) => {
  Branch.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  Branch.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdBy' });
  Branch.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedBy' });
  Branch.hasMany(models.User, { foreignKey: 'branch_id', as: 'users' });
  Branch.hasMany(models.FeeInvoice, { foreignKey: 'branch_id', as: 'feeInvoices' });
};

module.exports = Branch;
