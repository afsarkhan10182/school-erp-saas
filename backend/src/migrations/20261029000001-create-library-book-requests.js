'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('library_book_requests', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      book_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'library_books', key: 'id' },
        onDelete: 'CASCADE'
      },
      student_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'students', key: 'id' },
        onDelete: 'CASCADE'
      },
      requested_by_user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'fulfilled', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
      },
      decision_note: { type: Sequelize.STRING(500), allowNull: true },
      decided_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL'
      },
      decided_at: { type: Sequelize.DATE, allowNull: true },
      library_issue_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'library_issues', key: 'id' },
        onDelete: 'SET NULL'
      },
      school_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'schools', key: 'id' },
        onDelete: 'CASCADE'
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'branches', key: 'id' },
        onDelete: 'SET NULL'
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
    await queryInterface.addIndex('library_book_requests', ['school_id', 'branch_id', 'status']);
    await queryInterface.addIndex('library_book_requests', ['student_id', 'created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('library_book_requests');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_library_book_requests_status";'
    );
  }
};
