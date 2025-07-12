const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { logger } = require('../utils/logger');

const StudentParent = sequelize.define('StudentParent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  student_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'students',
      key: 'id',
    },
  },
  parent_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'parents',
      key: 'id',
    },
  },
  relationship: {
    type: DataTypes.ENUM('father', 'mother', 'guardian', 'other'),
    allowNull: false,
    defaultValue: 'father',
  },
  is_primary: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  is_fee_payer: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  is_emergency_contact: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  can_pickup: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
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
}, {
  tableName: 'student_parents',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['student_id', 'parent_id'], unique: true },
    { fields: ['student_id'] },
    { fields: ['parent_id'] },
    { fields: ['school_id'] },
    { fields: ['relationship'] },
    { fields: ['is_primary'] },
    { fields: ['is_fee_payer'] },
  ],
  hooks: {
    afterCreate: async (studentParent) => {
      logger.info(`Student-Parent relationship created: ${studentParent.student_id} - ${studentParent.parent_id}`);
    },
  },
});

// Define associations
StudentParent.associate = (models) => {
  // StudentParent belongs to Student
  StudentParent.belongsTo(models.Student, {
    foreignKey: 'student_id',
    as: 'student',
  });

  // StudentParent belongs to Parent
  StudentParent.belongsTo(models.Parent, {
    foreignKey: 'parent_id',
    as: 'parent',
  });

  // StudentParent belongs to School
  StudentParent.belongsTo(models.School, {
    foreignKey: 'school_id',
    as: 'school',
  });

  // StudentParent belongs to User (created_by)
  StudentParent.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'createdBy',
  });

  // StudentParent belongs to User (updated_by)
  StudentParent.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updatedBy',
  });
};

module.exports = StudentParent;
