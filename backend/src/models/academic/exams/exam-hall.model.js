const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/shared/logger');

const ExamHall = sequelize.define(
  'ExamHall',
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
        notEmpty: { msg: 'Exam hall name is required' }
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
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    school_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'schools', key: 'id' }
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'branches', key: 'id' }
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
    tableName: 'exam_halls',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_exam_halls_school_id',
        fields: ['school_id']
      },
      {
        name: 'idx_exam_halls_branch_id',
        fields: ['branch_id']
      },
      {
        name: 'idx_exam_halls_is_active',
        fields: ['is_active']
      },
      {
        name: 'idx_exam_halls_name_school',
        fields: ['name', 'school_id'],
        unique: true
      }
    ]
  }
);

// Associations
ExamHall.associate = models => {
  ExamHall.belongsTo(models.School, {
    foreignKey: 'school_id',
    as: 'school'
  });

  ExamHall.belongsTo(models.Branch, {
    foreignKey: 'branch_id',
    as: 'branch'
  });

  ExamHall.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator'
  });

  ExamHall.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updater'
  });

  ExamHall.hasMany(models.ExamSchedule, {
    foreignKey: 'exam_hall_id',
    as: 'schedules'
  });
};

module.exports = ExamHall;
