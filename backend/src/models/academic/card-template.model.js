const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const CardTemplate = sequelize.define(
  'CardTemplate',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    kind: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'id' },
    user_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'student'
    },
    layout_width: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 86 },
    layout_height: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 54 },
    background_color: { type: DataTypes.STRING(40), allowNull: true, defaultValue: '#4f46e5' },
    fields_json: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    html_template: { type: DataTypes.TEXT, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    school_id: { type: DataTypes.UUID, allowNull: false },
    branch_id: { type: DataTypes.UUID, allowNull: true },
    created_by: { type: DataTypes.UUID, allowNull: true },
    updated_by: { type: DataTypes.UUID, allowNull: true }
  },
  { tableName: 'card_templates', underscored: true }
);

module.exports = CardTemplate;
