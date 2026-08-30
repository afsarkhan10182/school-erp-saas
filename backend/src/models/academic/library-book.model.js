const { DataTypes } = require('sequelize');
const { sequelize } = require('~/config/database');

const LibraryBook = sequelize.define(
  'LibraryBook',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: { type: DataTypes.STRING(255), allowNull: false },
    author: { type: DataTypes.STRING(255), allowNull: true },
    publisher: { type: DataTypes.STRING(255), allowNull: true },
    edition: { type: DataTypes.STRING(100), allowNull: true },
    isbn: { type: DataTypes.STRING(50), allowNull: true },
    category: { type: DataTypes.STRING(100), allowNull: true },
    purchase_date: { type: DataTypes.DATEONLY, allowNull: true },
    purchase_price: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    sale_price: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    cover_image: { type: DataTypes.STRING(255), allowNull: true },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    available: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    school_id: { type: DataTypes.UUID, allowNull: false },
    branch_id: { type: DataTypes.UUID, allowNull: true },
    created_by: { type: DataTypes.UUID, allowNull: true },
    updated_by: { type: DataTypes.UUID, allowNull: true }
  },
  {
    tableName: 'library_books',
    timestamps: true,
    underscored: true
  }
);

LibraryBook.associate = models => {
  LibraryBook.belongsTo(models.School, { foreignKey: 'school_id', as: 'school' });
  LibraryBook.hasMany(models.LibraryIssue, { foreignKey: 'book_id', as: 'issues' });
};

module.exports = LibraryBook;
