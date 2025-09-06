const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const SubjectGroupSubject = sequelize.define('SubjectGroupSubject', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  subject_group_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'subject_groups', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  subject_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'subjects', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Order of subjects within the group',
  },
  is_required: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether this subject is required in the group',
  },
  weightage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 100.00,
    comment: 'Weightage of this subject in the group (percentage)',
  },
}, {
  tableName: 'subject_group_subjects',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['subject_group_id'] },
    { fields: ['subject_id'] },
    { fields: ['sort_order'] },
    { 
      fields: ['subject_group_id', 'subject_id'],
      unique: true,
      name: 'unique_subject_group_subject'
    },
  ],
});

module.exports = SubjectGroupSubject;
