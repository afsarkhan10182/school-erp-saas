const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const GatePass = sequelize.define(
  'GatePass',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    pass_no: { type: DataTypes.STRING(32), allowNull: false, unique: true },
    school_id: { type: DataTypes.UUID, allowNull: false },
    branch_id: { type: DataTypes.UUID, allowNull: false },
    student_id: { type: DataTypes.UUID, allowNull: false },
    reason: { type: DataTypes.STRING(40), allowNull: false },
    note: { type: DataTypes.STRING(500), allowNull: true },
    leaving_at: { type: DataTypes.DATE, allowNull: false },
    expected_return_at: { type: DataTypes.DATE, allowNull: true },
    collector_name: { type: DataTypes.STRING(120), allowNull: false },
    collector_relation: { type: DataTypes.STRING(60), allowNull: false },
    collector_phone: { type: DataTypes.STRING(24), allowNull: false },
    collector_id_type: { type: DataTypes.STRING(40), allowNull: false },
    collector_id_last4: { type: DataTypes.STRING(4), allowNull: false },
    gate_name: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'Main Gate' },
    internal_notes: { type: DataTypes.STRING(500), allowNull: true },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [['pending', 'approved', 'rejected', 'out', 'returned', 'cancelled']] }
    },
    created_by: { type: DataTypes.UUID, allowNull: false },
    approved_by: { type: DataTypes.UUID, allowNull: true },
    approved_at: { type: DataTypes.DATE, allowNull: true },
    decided_by: { type: DataTypes.UUID, allowNull: true },
    decision_note: { type: DataTypes.STRING(500), allowNull: true },
    out_by: { type: DataTypes.UUID, allowNull: true },
    actual_out_at: { type: DataTypes.DATE, allowNull: true },
    returned_by: { type: DataTypes.UUID, allowNull: true },
    returned_at: { type: DataTypes.DATE, allowNull: true },
    cancelled_by: { type: DataTypes.UUID, allowNull: true },
    cancelled_at: { type: DataTypes.DATE, allowNull: true }
  },
  {
    tableName: 'gate_passes',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['school_id', 'branch_id', 'status'] },
      { fields: ['student_id', 'status'] },
      { fields: ['leaving_at'] }
    ]
  }
);

GatePass.associate = models => {
  GatePass.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  GatePass.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  GatePass.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
  for (const [field, as] of [
    ['created_by', 'creator'],
    ['approved_by', 'approver'],
    ['decided_by', 'decider'],
    ['out_by', 'checked_out_by'],
    ['returned_by', 'returned_by_user'],
    ['cancelled_by', 'canceller']
  ]) {
    GatePass.belongsTo(models.User, { foreignKey: field, as });
  }
};

module.exports = GatePass;
