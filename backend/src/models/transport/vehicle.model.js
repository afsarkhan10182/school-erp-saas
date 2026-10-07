const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const Vehicle = sequelize.define(
  'Vehicle',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
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
      allowNull: false,
      references: {
        model: 'branches',
        key: 'id'
      }
    },
    vehicle_number: {
      type: DataTypes.STRING,
      allowNull: false
    },
    vehicle_model: {
      type: DataTypes.STRING
    },
    driver_name: {
      type: DataTypes.STRING
    },
    driver_license: {
      type: DataTypes.STRING
    },
    driver_contact: {
      type: DataTypes.STRING
    },
    seating_capacity: {
      type: DataTypes.INTEGER
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    tableName: 'vehicles',
    timestamps: true,
    underscored: true
  }
);

Vehicle.associate = models => {
  Vehicle.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  Vehicle.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  
  Vehicle.hasMany(models.VehicleRoute, { foreignKey: 'vehicle_id', as: 'vehicleRoutes' });
  Vehicle.hasMany(models.StudentTransport, { foreignKey: 'vehicle_id', as: 'studentTransports' });
};

module.exports = Vehicle;
