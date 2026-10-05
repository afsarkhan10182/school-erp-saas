const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const VehicleRoute = sequelize.define(
  'VehicleRoute',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    vehicle_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'vehicles',
        key: 'id'
      }
    },
    route_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'transport_routes',
        key: 'id'
      }
    }
  },
  {
    tableName: 'vehicle_routes',
    timestamps: true,
    underscored: true
  }
);

VehicleRoute.associate = models => {
  VehicleRoute.belongsTo(models.Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });
  VehicleRoute.belongsTo(models.TransportRoute, { foreignKey: 'route_id', as: 'route' });
};

module.exports = VehicleRoute;
