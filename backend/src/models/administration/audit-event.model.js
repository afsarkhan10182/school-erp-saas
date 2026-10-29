const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const AuditEvent = sequelize.define(
  'AuditEvent',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    school_id: { type: DataTypes.UUID, allowNull: false },
    branch_id: { type: DataTypes.UUID, allowNull: true },
    actor_id: { type: DataTypes.UUID, allowNull: true },
    actor_role: { type: DataTypes.STRING(40), allowNull: true },
    action: { type: DataTypes.STRING(24), allowNull: false },
    entity_name: { type: DataTypes.STRING(120), allowNull: false },
    record_id: { type: DataTypes.STRING(128), allowNull: true },
    changes: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    request_method: { type: DataTypes.STRING(10), allowNull: true },
    request_path: { type: DataTypes.STRING(512), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  { tableName: 'audit_events', timestamps: false, underscored: true }
);

AuditEvent.associate = models => {
  AuditEvent.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  AuditEvent.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  AuditEvent.belongsTo(models.User, { foreignKey: 'actor_id', as: 'actor' });
};

module.exports = AuditEvent;
