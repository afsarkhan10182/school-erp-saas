const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const ReportCardSetup = sequelize.define(
  'ReportCardSetup',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(255), allowNull: false, validate: { notEmpty: true } },
    template_id: { type: DataTypes.UUID, allowNull: false },
    orientation: {
      type: DataTypes.ENUM('portrait', 'landscape'),
      allowNull: false,
      defaultValue: 'portrait'
    },
    is_published: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    school_id: { type: DataTypes.UUID, allowNull: false },
    branch_id: { type: DataTypes.UUID, allowNull: false },
    created_by: { type: DataTypes.UUID, allowNull: true },
    updated_by: { type: DataTypes.UUID, allowNull: true }
  },
  {
    tableName: 'report_card_setups',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['school_id', 'branch_id'] },
      { fields: ['template_id'] },
      { fields: ['is_published'] },
      {
        fields: ['school_id', 'branch_id', 'name'],
        unique: true,
        name: 'unique_report_card_setup_name_per_branch'
      }
    ]
  }
);

ReportCardSetup.associate = models => {
  ReportCardSetup.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  ReportCardSetup.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  ReportCardSetup.belongsTo(models.ReportTemplate, { foreignKey: 'template_id', as: 'template' });
  ReportCardSetup.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdBy' });
  ReportCardSetup.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedBy' });
  ReportCardSetup.hasMany(models.ReportCardSetupExam, {
    foreignKey: 'setup_id',
    as: 'examEntries',
    onDelete: 'CASCADE'
  });
  ReportCardSetup.belongsToMany(models.Exam, {
    through: models.ReportCardSetupExam,
    foreignKey: 'setup_id',
    otherKey: 'exam_id',
    as: 'exams'
  });
};

module.exports = ReportCardSetup;
