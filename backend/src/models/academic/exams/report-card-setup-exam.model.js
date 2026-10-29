const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const ReportCardSetupExam = sequelize.define(
  'ReportCardSetupExam',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    setup_id: { type: DataTypes.UUID, allowNull: false },
    exam_id: { type: DataTypes.UUID, allowNull: false },
    weightage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: { min: 0.01, max: 100 }
    },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
  },
  {
    tableName: 'report_card_setup_exams',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['setup_id', 'sort_order'] },
      { fields: ['exam_id'] },
      { fields: ['setup_id', 'exam_id'], unique: true, name: 'unique_exam_per_report_card_setup' }
    ]
  }
);

ReportCardSetupExam.associate = models => {
  ReportCardSetupExam.belongsTo(models.ReportCardSetup, { foreignKey: 'setup_id', as: 'setup' });
  ReportCardSetupExam.belongsTo(models.Exam, { foreignKey: 'exam_id', as: 'exam' });
};

module.exports = ReportCardSetupExam;
