const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/logger');

const SchoolSetting = sequelize.define(
  'SchoolSetting',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    school_id: {
      type: DataTypes.UUID,
      allowNull: false,
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
    tableName: 'school_settings',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['school_id'] },
      { fields: ['key'] },
      { fields: ['school_id', 'key'], unique: true },
      { fields: ['type'] }
    ],
    hooks: {
      afterCreate: async setting => {
        logger.info(`School setting created: ${setting.school_id} - ${setting.key}`);
      },
      afterUpdate: async setting => {
        logger.info(`School setting updated: ${setting.school_id} - ${setting.key}`);
      }
    }
  }
);

SchoolSetting.associate = models => {
  SchoolSetting.belongsTo(models.School, {
    foreignKey: 'school_id',
    as: 'school'
  });
  SchoolSetting.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator'
  });
  SchoolSetting.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updater'
  });
};

module.exports = SchoolSetting;
