const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const Hostel = sequelize.define(
  'Hostel',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
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
    hostel_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: { msg: 'Hostel name is required' } }
    },
    hostel_type: {
      type: DataTypes.STRING,
      defaultValue: 'Boys'
    },
    address: {
      type: DataTypes.TEXT
    },
    intake: {
      type: DataTypes.INTEGER
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    tableName: 'hostels',
    timestamps: true,
    underscored: true
  }
);

Hostel.associate = models => {
  Hostel.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  Hostel.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  Hostel.hasMany(models.HostelRoom, { foreignKey: 'hostel_id', as: 'rooms' });
  Hostel.hasMany(models.HostelAllocation, { foreignKey: 'hostel_id', as: 'allocations' });
};

module.exports = Hostel;
