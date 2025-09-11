const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/logger');

const ModuleSetting = sequelize.define(
  'ModuleSetting',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    module_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'modules', key: 'id' },
      onDelete: 'CASCADE'
    },
    school_id: {
      type: DataTypes.UUID,
      allowNull: true, // null for global module settings
      references: { model: 'schools', key: 'id' },
      onDelete: 'CASCADE'
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Setting key is required' }
      }
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('string', 'number', 'integer', 'boolean', 'json', 'array'),
      allowNull: false,
      defaultValue: 'string'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_editable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    is_required: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
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
    tableName: 'module_settings',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['module_id'] },
      { fields: ['school_id'] },
      { fields: ['key'] },
      { fields: ['module_id', 'school_id', 'key'], unique: true },
      { fields: ['type'] }
    ],
    hooks: {
      afterCreate: async setting => {
        logger.info(
          `Module setting created: ${setting.module_id} - ${setting.school_id || 'global'} - ${setting.key}`
        );
      },
      afterUpdate: async setting => {
        logger.info(
          `Module setting updated: ${setting.module_id} - ${setting.school_id || 'global'} - ${setting.key}`
        );
      }
    }
  }
);

ModuleSetting.associate = models => {
  ModuleSetting.belongsTo(models.Module, {
    foreignKey: 'module_id',
    as: 'module'
  });
  ModuleSetting.belongsTo(models.School, {
    foreignKey: 'school_id',
    as: 'school'
  });
  ModuleSetting.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator'
  });
  ModuleSetting.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updater'
  });
};

module.exports = ModuleSetting;
