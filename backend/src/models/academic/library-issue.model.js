const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const LibraryIssue = sequelize.define(
  'LibraryIssue',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    book_id: { type: DataTypes.UUID, allowNull: false },
    student_id: { type: DataTypes.UUID, allowNull: true },
    user_id: { type: DataTypes.UUID, allowNull: true },
    borrower_type: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'student' },
    borrower_name: { type: DataTypes.STRING(255), allowNull: true },
    issue_date: { type: DataTypes.DATEONLY, allowNull: false },
    due_date: { type: DataTypes.DATEONLY, allowNull: false },
    return_date: { type: DataTypes.DATEONLY, allowNull: true },
    fine_per_day: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    fine_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    status: {
      type: DataTypes.ENUM('issued', 'returned', 'overdue'),
      allowNull: false,
      defaultValue: 'issued'
    },
    school_id: { type: DataTypes.UUID, allowNull: false },
    branch_id: { type: DataTypes.UUID, allowNull: true },
    created_by: { type: DataTypes.UUID, allowNull: true }
  },
  {
    tableName: 'library_issues',
    timestamps: true,
    underscored: true
  }
);

LibraryIssue.associate = models => {
  LibraryIssue.belongsTo(models.LibraryBook, { foreignKey: 'book_id', as: 'book' });
  LibraryIssue.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
  LibraryIssue.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
};

module.exports = LibraryIssue;
