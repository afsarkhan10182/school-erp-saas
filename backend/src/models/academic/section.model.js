const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/shared/logger');

const Section = sequelize.define(
  'Section',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Section name is required' }
      }
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
      validate: {
        min: { args: [1], msg: 'Capacity must be at least 1' }
      }
    },
    current_strength: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'Current strength cannot be negative' }
      }
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
    class_id: {
      type: DataTypes.UUID,
      allowNull: false,
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
      },
      comment: 'Links to stream for higher classes (11, 12). NULL for lower classes.'
    },
    class_teacher_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
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
      allowNull: false, // Changed from true to false - sections must always have a branch
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
    tableName: 'sections',
    timestamps: true,
    underscored: true,
    indexes: [
      // Note: Unique constraint is handled at database level with COALESCE for NULL stream_id values
      // The actual constraint: CREATE UNIQUE INDEX ON sections (class_id, branch_id, COALESCE(stream_id, '00000000-0000-0000-0000-000000000000'), name)
      { fields: ['class_id'] },
      { fields: ['stream_id'] },
      { fields: ['class_teacher_id'] },
      { fields: ['school_id'] },
      { fields: ['branch_id'] },
      { fields: ['is_active'] },
      { fields: ['sort_order'] }
    ],
    hooks: {
      afterCreate: async section => {
        logger.info(
          `New section created: ${section.name} for class ${section.class_id} in branch ${section.branch_id}`
        );
      }
    }
  }
);

// Define associations
Section.associate = models => {
  // Section belongs to Class
  Section.belongsTo(models.Class, {
    foreignKey: 'class_id',
    as: 'class'
  });

  // Section belongs to Stream (optional - for higher classes)
  Section.belongsTo(models.Stream, {
    foreignKey: 'stream_id',
    as: 'stream'
  });

  // Section belongs to User (class_teacher)
  Section.belongsTo(models.User, {
    foreignKey: 'class_teacher_id',
    as: 'classTeacher'
  });

  // Section belongs to School
  Section.belongsTo(models.School, {
    foreignKey: 'school_id',
    as: 'school'
  });

  // Section belongs to Branch
  Section.belongsTo(models.Branch, {
    foreignKey: 'branch_id',
    as: 'branch'
  });

  // Section belongs to User (created_by)
  Section.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'createdBy'
  });

  // Section belongs to User (updated_by)
  Section.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updatedBy'
  });
};

module.exports = Section;
