const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/logger');

const Stream = sequelize.define(
  'Stream',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Stream name is required' },
        len: { args: [1, 100], msg: 'Stream name must be between 1 and 100 characters' }
      }
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Stream code is required' },
        len: { args: [1, 20], msg: 'Stream code must be between 1 and 20 characters' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'Sort order cannot be negative' }
      }
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
      allowNull: false,
      references: {
        model: 'branches',
        key: 'id'
      }
    },
    class_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'classes',
        key: 'id'
      },
      validate: {
        async isHigherClass(value) {
          // This validation will be handled in the controller
          // as we need to check the class name (11, 12)
        }
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
    sequelize,
    modelName: 'Stream',
    tableName: 'streams',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['school_id', 'branch_id', 'class_id', 'name']
      },
      {
        unique: true,
        fields: ['school_id', 'branch_id', 'class_id', 'code']
      }
    ],
    hooks: {
      afterCreate: async stream => {
        logger.info(
          `New stream created: ${stream.name} (${stream.code}) for class ${stream.class_id} in branch ${stream.branch_id}`
        );
      }
    }
  }
);

// Define associations
Stream.associate = models => {
  // Stream belongs to School
  Stream.belongsTo(models.School, {
    foreignKey: 'school_id',
    as: 'school'
  });

  // Stream belongs to Branch
  Stream.belongsTo(models.Branch, {
    foreignKey: 'branch_id',
    as: 'branch'
  });

  // Stream belongs to Class
  Stream.belongsTo(models.Class, {
    foreignKey: 'class_id',
    as: 'class'
  });

  // Stream belongs to User (created_by)
  Stream.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'createdBy'
  });

  // Stream belongs to User (updated_by)
  Stream.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updatedBy'
  });

  // Stream has many Sections
  Stream.hasMany(models.Section, {
    foreignKey: 'stream_id',
    as: 'sections'
  });
};

module.exports = Stream;
