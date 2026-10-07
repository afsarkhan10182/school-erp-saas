const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const AlumniEvent = sequelize.define(
  'AlumniEvent',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    school_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    event_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    venue: {
      type: DataTypes.STRING
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'upcoming'
    }
  },
  {
    tableName: 'alumni_events',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

AlumniEvent.associate = models => {
  AlumniEvent.belongsTo(models.School, {
    foreignKey: 'school_id',
    as: 'school'
  });
  AlumniEvent.belongsTo(models.Branch, {
    foreignKey: 'branch_id',
    as: 'branch'
  });
};

module.exports = AlumniEvent;
