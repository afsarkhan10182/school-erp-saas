'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const booksExists = await queryInterface.describeTable('library_books').catch(() => null);
    if (!booksExists) {
      await queryInterface.createTable('library_books', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        title: { type: Sequelize.STRING(255), allowNull: false },
        author: { type: Sequelize.STRING(255), allowNull: true },
        isbn: { type: Sequelize.STRING(50), allowNull: true },
        category: { type: Sequelize.STRING(100), allowNull: true },
        quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        available: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        school_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'schools', key: 'id' }
        },
        branch_id: { type: Sequelize.UUID, allowNull: true },
        created_by: { type: Sequelize.UUID, allowNull: true },
        updated_by: { type: Sequelize.UUID, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
      });
    }

    const issuesExists = await queryInterface.describeTable('library_issues').catch(() => null);
    if (!issuesExists) {
      await queryInterface.createTable('library_issues', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        book_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'library_books', key: 'id' }
        },
        student_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'students', key: 'id' }
        },
        issue_date: { type: Sequelize.DATEONLY, allowNull: false },
        due_date: { type: Sequelize.DATEONLY, allowNull: false },
        return_date: { type: Sequelize.DATEONLY, allowNull: true },
        status: {
          type: Sequelize.ENUM('issued', 'returned', 'overdue'),
          allowNull: false,
          defaultValue: 'issued'
        },
        school_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'schools', key: 'id' }
        },
        branch_id: { type: Sequelize.UUID, allowNull: true },
        created_by: { type: Sequelize.UUID, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('library_issues');
    await queryInterface.dropTable('library_books');
  }
};
