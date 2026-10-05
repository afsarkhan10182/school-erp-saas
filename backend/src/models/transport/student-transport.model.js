const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const StudentTransport = sequelize.define(
  'StudentTransport',
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
    student_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'students',
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
    },
    vehicle_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'vehicles',
        key: 'id'
      }
    },
    pickup_point: {
      type: DataTypes.STRING
    },
    month: {
      type: DataTypes.STRING
    }
  },
  {
    tableName: 'student_transports',
    timestamps: true,
    underscored: true
  }
);

StudentTransport.associate = models => {
  StudentTransport.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  StudentTransport.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  StudentTransport.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
  StudentTransport.belongsTo(models.TransportRoute, { foreignKey: 'route_id', as: 'route' });
  StudentTransport.belongsTo(models.Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });
};

module.exports = StudentTransport;
