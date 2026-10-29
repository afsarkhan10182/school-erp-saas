const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const SettingsChangeLog = sequelize.define(
  'SettingsChangeLog',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    school_id: { type: DataTypes.UUID, allowNull: false },
    actor_id: { type: DataTypes.UUID, allowNull: true },
    undo_of_id: { type: DataTypes.UUID, allowNull: true },
    category: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'system_preferences' },
    changes: { type: DataTypes.JSONB, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  { tableName: 'settings_change_logs', timestamps: false, underscored: true }
);

SettingsChangeLog.associate = models => {
  SettingsChangeLog.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  SettingsChangeLog.belongsTo(models.User, { foreignKey: 'actor_id', as: 'actor' });
  SettingsChangeLog.belongsTo(models.SettingsChangeLog, { foreignKey: 'undo_of_id', as: 'undoOf' });
};

module.exports = SettingsChangeLog;
