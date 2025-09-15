const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/shared/logger');

const StudentParent = sequelize.define(
  'StudentParent',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    student_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'students',
        key: 'id'
      }
    },
    parent_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'parents',
        key: 'id'
      }
    },
    relationship: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'father'
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_emergency_contact: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    tableName: 'student_parents',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['student_id', 'parent_id'], unique: true },
      { fields: ['student_id'] },
      { fields: ['parent_id'] },
      { fields: ['relationship'] },
      { fields: ['is_primary'] }
    ],
    hooks: {
      afterCreate: async studentParent => {
        logger.info(
          `Student-Parent relationship created: ${studentParent.student_id} - ${studentParent.parent_id}`
        );
      }
    }
  }
);

// Define associations
StudentParent.associate = models => {
  // StudentParent belongs to Student
  StudentParent.belongsTo(models.Student, {
    foreignKey: 'student_id',
    as: 'student'
  });

  // StudentParent belongs to Parent
  StudentParent.belongsTo(models.Parent, {
    foreignKey: 'parent_id',
    as: 'parent'
  });
};

module.exports = StudentParent;
