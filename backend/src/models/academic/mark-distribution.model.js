const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/shared/logger');

const MarkDistribution = sequelize.define(
  'MarkDistribution',
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
        notEmpty: { msg: 'Distribution name is required' }
      }
    },
    type: {
      type: DataTypes.ENUM('theory_only', 'practical_only', 'theory_practical', 'comprehensive'),
      allowNull: false,
      defaultValue: 'theory_practical'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    theory_marks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'Theory marks cannot be negative' }
      }
    },
    practical_marks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'Practical marks cannot be negative' }
      }
    },
    viva_marks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'Viva marks cannot be negative' }
      }
    },
    assignment_marks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'Assignment marks cannot be negative' }
      }
    },
    total_marks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: { args: [1], msg: 'Total marks must be at least 1' }
      }
    },
    pass_marks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 35,
      validate: {
        min: { args: [0], msg: 'Pass marks cannot be negative' },
        max: { args: [100], msg: 'Pass marks cannot exceed 100' }
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    school_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'schools', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'branches', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
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
    tableName: 'mark_distributions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
    indexes: [
      {
        fields: ['school_id']
      },
      {
        fields: ['branch_id']
      },
      {
        fields: ['type']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['school_id', 'branch_id']
      }
    ],
    hooks: {
      beforeValidate: markDistribution => {
        // Auto-calculate total marks if not provided
        if (!markDistribution.total_marks) {
          markDistribution.total_marks =
            (markDistribution.theory_marks || 0) +
            (markDistribution.practical_marks || 0) +
            (markDistribution.viva_marks || 0) +
            (markDistribution.assignment_marks || 0);
        }
      }
    }
  }
);

// Associations
MarkDistribution.associate = models => {
  // School association
  MarkDistribution.belongsTo(models.School, {
    foreignKey: 'school_id',
    as: 'school'
  });

  // Branch association
  MarkDistribution.belongsTo(models.Branch, {
    foreignKey: 'branch_id',
    as: 'branch'
  });

  // Creator association
  MarkDistribution.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator'
  });

  // Updater association
  MarkDistribution.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updater'
  });
};

module.exports = MarkDistribution;
