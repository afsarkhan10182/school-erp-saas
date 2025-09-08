const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/logger');

const Timetable = sequelize.define('Timetable', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Timetable name is required' },
      len: {
        args: [2, 100],
        msg: 'Timetable name must be between 2 and 100 characters',
      },
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  academic_year: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Academic year is required' },
    },
  },
  class_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'classes', key: 'id' },
  },
  section_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'sections', key: 'id' },
  },
  school_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'schools', key: 'id' },
  },
  branch_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'branches', key: 'id' },
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether this is the default timetable for the class/section'
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
  tableName: 'timetables',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['school_id'] },
    { fields: ['branch_id'] },
    { fields: ['class_id'] },
    { fields: ['section_id'] },
    { fields: ['academic_year'] },
    { fields: ['is_active'] },
    { fields: ['is_default'] },
    { 
      fields: ['school_id', 'class_id', 'section_id', 'academic_year'],
      unique: true,
      name: 'unique_timetable_per_class_section_year'
    },
  ],
  hooks: {
    beforeCreate: async (timetable) => {
      // If this is set as default, unset other defaults for the same class/section
      if (timetable.is_default) {
        await Timetable.update(
          { is_default: false },
          {
            where: {
              school_id: timetable.school_id,
              class_id: timetable.class_id,
              section_id: timetable.section_id,
              academic_year: timetable.academic_year,
              is_default: true
            }
          }
        );
      }
    },
    beforeUpdate: async (timetable) => {
      // If this is being set as default, unset other defaults for the same class/section
      if (timetable.changed('is_default') && timetable.is_default) {
        await Timetable.update(
          { is_default: false },
          {
            where: {
              school_id: timetable.school_id,
              class_id: timetable.class_id,
              section_id: timetable.section_id,
              academic_year: timetable.academic_year,
              is_default: true,
              id: { [sequelize.Sequelize.Op.ne]: timetable.id }
            }
          }
        );
      }
    },
    afterCreate: async (timetable) => {
      logger.info(`Timetable created: ${timetable.name} (${timetable.id})`);
    },
    afterUpdate: async (timetable) => {
      logger.info(`Timetable updated: ${timetable.name} (${timetable.id})`);
    },
  },
});

// Define associations
Timetable.associate = (models) => {
  Timetable.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  Timetable.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  Timetable.belongsTo(models.Class, { foreignKey: 'class_id', as: 'class' });
  Timetable.belongsTo(models.Section, { foreignKey: 'section_id', as: 'section' });
  Timetable.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdBy' });
  Timetable.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedBy' });
  Timetable.hasMany(models.TimetableSlot, { foreignKey: 'timetable_id', as: 'slots' });
};

module.exports = Timetable;
