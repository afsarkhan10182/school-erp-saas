const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const RoomType = sequelize.define(
  'RoomType',
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
    type_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: { msg: 'Type name is required' } }
    },
    description: {
      type: DataTypes.TEXT
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    tableName: 'room_types',
    timestamps: true,
    underscored: true
  }
);

RoomType.associate = models => {
  RoomType.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  RoomType.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  RoomType.hasMany(models.HostelRoom, { foreignKey: 'room_type_id', as: 'rooms' });
};

module.exports = RoomType;
