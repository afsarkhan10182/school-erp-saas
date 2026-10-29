'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const StudentReportCardArchive = sequelize.define(
  'StudentReportCardArchive',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    student_id: { type: DataTypes.UUID, allowNull: false },
    exam_id: { type: DataTypes.UUID, allowNull: true },
    setup_id: { type: DataTypes.UUID, allowNull: true },
    school_id: { type: DataTypes.UUID, allowNull: false },
    branch_id: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    academic_year: { type: DataTypes.STRING(20), allowNull: true },
    file_name: { type: DataTypes.STRING(80), allowNull: false },
    storage_year: { type: DataTypes.INTEGER, allowNull: false },
    created_by: { type: DataTypes.UUID, allowNull: true }
  },
  { tableName: 'student_report_card_archives', timestamps: true, underscored: true }
);

StudentReportCardArchive.associate = models => {
  StudentReportCardArchive.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
  StudentReportCardArchive.belongsTo(models.Exam, { foreignKey: 'exam_id', as: 'exam' });
  StudentReportCardArchive.belongsTo(models.ReportCardSetup, { foreignKey: 'setup_id', as: 'setup' });
  StudentReportCardArchive.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  StudentReportCardArchive.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  StudentReportCardArchive.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdBy' });
};

module.exports = StudentReportCardArchive;
