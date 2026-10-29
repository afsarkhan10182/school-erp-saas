const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const Homework = sequelize.define(
  'Homework',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    due_date: { type: DataTypes.DATEONLY, allowNull: false },
    academic_year: { type: DataTypes.STRING(20), allowNull: true },
    class_id: { type: DataTypes.UUID, allowNull: false },
    section_id: { type: DataTypes.UUID, allowNull: true },
    subject_id: { type: DataTypes.UUID, allowNull: true },
    attachment_url: { type: DataTypes.STRING, allowNull: true },
    school_id: { type: DataTypes.UUID, allowNull: false },
    branch_id: { type: DataTypes.UUID, allowNull: true },
    created_by: { type: DataTypes.UUID, allowNull: true },
    updated_by: { type: DataTypes.UUID, allowNull: true }
  },
  {
    tableName: 'homeworks',
    timestamps: true,
    underscored: true
  }
);

Homework.associate = models => {
  Homework.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  Homework.belongsTo(models.Class, { foreignKey: 'class_id', as: 'class' });
  Homework.belongsTo(models.Section, { foreignKey: 'section_id', as: 'section' });
  Homework.belongsTo(models.Subject, { foreignKey: 'subject_id', as: 'subject' });
  Homework.hasMany(models.HomeworkSubmission, { foreignKey: 'homework_id', as: 'submissions' });
};

module.exports = Homework;
