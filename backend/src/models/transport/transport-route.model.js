const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const TransportRoute = sequelize.define(
  'TransportRoute',
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
    route_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    start_point: {
      type: DataTypes.STRING
    },
    end_point: {
      type: DataTypes.STRING
    },
    fare: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    tableName: 'transport_routes',
    timestamps: true,
    underscored: true
  }
);

TransportRoute.associate = models => {
  TransportRoute.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  TransportRoute.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  
  TransportRoute.hasMany(models.VehicleRoute, { foreignKey: 'route_id', as: 'vehicleRoutes' });
  TransportRoute.hasMany(models.StudentTransport, { foreignKey: 'route_id', as: 'studentTransports' });
};

module.exports = TransportRoute;
