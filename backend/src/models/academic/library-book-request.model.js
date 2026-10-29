const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const LibraryBookRequest = sequelize.define(
  'LibraryBookRequest',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    book_id: { type: DataTypes.UUID, allowNull: false },
    student_id: { type: DataTypes.UUID, allowNull: false },
    requested_by_user_id: { type: DataTypes.UUID, allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'fulfilled', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    },
    decision_note: { type: DataTypes.STRING(500), allowNull: true },
    decided_by: { type: DataTypes.UUID, allowNull: true },
    decided_at: { type: DataTypes.DATE, allowNull: true },
    library_issue_id: { type: DataTypes.UUID, allowNull: true },
    school_id: { type: DataTypes.UUID, allowNull: false },
    branch_id: { type: DataTypes.UUID, allowNull: true }
  },
  { tableName: 'library_book_requests', timestamps: true, underscored: true }
);

LibraryBookRequest.associate = models => {
  LibraryBookRequest.belongsTo(models.LibraryBook, { foreignKey: 'book_id', as: 'book' });
  LibraryBookRequest.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
  LibraryBookRequest.belongsTo(models.User, {
    foreignKey: 'requested_by_user_id',
    as: 'requester'
  });
  LibraryBookRequest.belongsTo(models.User, { foreignKey: 'decided_by', as: 'decider' });
  LibraryBookRequest.belongsTo(models.LibraryIssue, {
    foreignKey: 'library_issue_id',
    as: 'issue'
  });
};

module.exports = LibraryBookRequest;
