const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const AcademicCalendar = sequelize.define(
  'AcademicCalendar',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    day_type: {
      type: DataTypes.ENUM('working', 'holiday', 'weekend', 'exam', 'event'),
      allowNull: false,
      defaultValue: 'working'
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    academic_year: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    school_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'schools', key: 'id' }
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: false,
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
    tableName: 'academic_calendars',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['school_id'] },
      { fields: ['branch_id'] },
      { fields: ['academic_year'] },
      { fields: ['date'] },
      { fields: ['day_type'] },
      { fields: ['school_id', 'branch_id', 'date'], unique: true }
    ]
  }
);

AcademicCalendar.associate = models => {
  AcademicCalendar.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  AcademicCalendar.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  AcademicCalendar.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdBy' });
  AcademicCalendar.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedBy' });
};

module.exports = AcademicCalendar;
