'use strict';

const columns = {
  borrower_type: Sequelize => ({ type: Sequelize.STRING(30), allowNull: false, defaultValue: 'student' }),
  borrower_name: Sequelize => ({ type: Sequelize.STRING(255), allowNull: true }),
  user_id: Sequelize => ({ type: Sequelize.UUID, allowNull: true }),
  fine_per_day: Sequelize => ({ type: Sequelize.DECIMAL(10, 2), allowNull: true }),
  fine_amount: Sequelize => ({ type: Sequelize.DECIMAL(10, 2), allowNull: true })
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('library_issues').catch(() => null);
    if (!table) return;
    if (table.student_id?.allowNull === false) {
      await queryInterface.changeColumn('library_issues', 'student_id', { type: Sequelize.UUID, allowNull: true });
    }
    for (const [name, definition] of Object.entries(columns)) {
      if (!table[name]) await queryInterface.addColumn('library_issues', name, definition(Sequelize));
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('library_issues').catch(() => null);
    if (!table) return;
    for (const name of Object.keys(columns).reverse()) {
      if (table[name]) await queryInterface.removeColumn('library_issues', name);
    }
    if (table.student_id) {
      await queryInterface.changeColumn('library_issues', 'student_id', { type: Sequelize.UUID, allowNull: false });
    }
  }
};
