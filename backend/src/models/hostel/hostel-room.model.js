const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const HostelRoom = sequelize.define(
  'HostelRoom',
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
    hostel_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'hostels', key: 'id' }
    },
    room_type_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'room_types', key: 'id' }
    },
    room_number: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: { msg: 'Room number is required' } }
    },
    number_of_beds: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    cost_per_bed: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    tableName: 'hostel_rooms',
    timestamps: true,
    underscored: true
  }
);

HostelRoom.associate = models => {
  HostelRoom.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  HostelRoom.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  HostelRoom.belongsTo(models.Hostel, { foreignKey: 'hostel_id', as: 'hostel' });
  HostelRoom.belongsTo(models.RoomType, { foreignKey: 'room_type_id', as: 'roomType' });
  HostelRoom.hasMany(models.HostelAllocation, { foreignKey: 'room_id', as: 'allocations' });
};

module.exports = HostelRoom;
