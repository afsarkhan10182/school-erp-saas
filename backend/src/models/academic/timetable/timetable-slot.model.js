const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');
const { logger } = require('../../../utils/logger');

const TimetableSlot = sequelize.define('TimetableSlot', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  timetable_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'timetables', key: 'id' },
  },
  day_of_week: {
    type: DataTypes.ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Day of week is required' },
    },
  },
  period_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: [1], msg: 'Period number must be at least 1' },
      max: { args: [20], msg: 'Period number cannot exceed 20' },
    },
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Start time is required' },
    },
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'End time is required' },
    },
  },
  subject_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'subjects', key: 'id' },
  },
  teacher_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
  room_number: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  slot_type: {
    type: DataTypes.ENUM('regular', 'break', 'lunch', 'assembly', 'free', 'exam'),
    allowNull: false,
    defaultValue: 'regular',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
  updated_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
}, {
  tableName: 'timetable_slots',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['timetable_id'] },
    { fields: ['day_of_week'] },
    { fields: ['period_number'] },
    { fields: ['subject_id'] },
    { fields: ['teacher_id'] },
    { fields: ['slot_type'] },
    { fields: ['is_active'] },
    { 
      fields: ['timetable_id', 'day_of_week', 'period_number'],
      unique: true,
      name: 'unique_slot_per_timetable_day_period'
    },
  ],
  hooks: {
    beforeCreate: async (slot) => {
      // Validate that end time is after start time
      if (slot.start_time >= slot.end_time) {
        throw new Error('End time must be after start time');
      }
    },
    beforeUpdate: async (slot) => {
      // Validate that end time is after start time
      if (slot.changed('start_time') || slot.changed('end_time')) {
        if (slot.start_time >= slot.end_time) {
          throw new Error('End time must be after start time');
        }
      }
    },
    afterCreate: async (slot) => {
      logger.info(`Timetable slot created: ${slot.day_of_week} Period ${slot.period_number} (${slot.id})`);
    },
    afterUpdate: async (slot) => {
      logger.info(`Timetable slot updated: ${slot.day_of_week} Period ${slot.period_number} (${slot.id})`);
    },
  },
});

// Define associations
TimetableSlot.associate = (models) => {
  TimetableSlot.belongsTo(models.Timetable, { foreignKey: 'timetable_id', as: 'timetable' });
  TimetableSlot.belongsTo(models.Subject, { foreignKey: 'subject_id', as: 'subject' });
  TimetableSlot.belongsTo(models.User, { foreignKey: 'teacher_id', as: 'teacher' });
  TimetableSlot.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdBy' });
  TimetableSlot.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedBy' });
};

module.exports = TimetableSlot;
