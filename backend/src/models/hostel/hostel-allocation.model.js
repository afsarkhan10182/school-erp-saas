const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const HostelAllocation = sequelize.define(
  'HostelAllocation',
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
    student_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'students', key: 'id' }
    },
    hostel_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'hostels', key: 'id' }
    },
    room_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'hostel_rooms', key: 'id' }
    },
    month: {
      type: DataTypes.STRING
    }
  },
  {
    tableName: 'hostel_allocations',
    timestamps: true,
    underscored: true
  }
);

HostelAllocation.associate = models => {
  HostelAllocation.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  HostelAllocation.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  HostelAllocation.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
  HostelAllocation.belongsTo(models.Hostel, { foreignKey: 'hostel_id', as: 'hostel' });
  HostelAllocation.belongsTo(models.HostelRoom, { foreignKey: 'room_id', as: 'room' });
};

module.exports = HostelAllocation;
