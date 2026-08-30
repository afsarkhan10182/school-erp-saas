'use strict';

const columns = {
  publisher: Sequelize => ({ type: Sequelize.STRING(255), allowNull: true }),
  edition: Sequelize => ({ type: Sequelize.STRING(100), allowNull: true }),
  purchase_date: Sequelize => ({ type: Sequelize.DATEONLY, allowNull: true }),
  purchase_price: Sequelize => ({ type: Sequelize.DECIMAL(10, 2), allowNull: true }),
  sale_price: Sequelize => ({ type: Sequelize.DECIMAL(10, 2), allowNull: true }),
  cover_image: Sequelize => ({ type: Sequelize.STRING(255), allowNull: true })
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('library_books').catch(() => null);
    if (!table) return;
    for (const [name, definition] of Object.entries(columns)) {
      if (!table[name]) await queryInterface.addColumn('library_books', name, definition(Sequelize));
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('library_books').catch(() => null);
    if (!table) return;
    for (const name of Object.keys(columns).reverse()) {
      if (table[name]) await queryInterface.removeColumn('library_books', name);
    }
  }
};
