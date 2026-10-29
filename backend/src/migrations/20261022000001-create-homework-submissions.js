'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const exists = await queryInterface.describeTable('homework_submissions').catch(() => null);
    if (exists) return;

    await queryInterface.createTable('homework_submissions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      homework_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'homeworks', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      student_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'students', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      school_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'schools', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'branches', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      submission_text: { type: Sequelize.TEXT, allowNull: false },
      submitted_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      marks: { type: Sequelize.DECIMAL(8, 2), allowNull: true },
      remarks: { type: Sequelize.TEXT, allowNull: true },
      evaluated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      evaluated_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
    await queryInterface.addConstraint('homework_submissions', {
      fields: ['homework_id', 'student_id'],
      type: 'unique',
      name: 'unique_homework_student_submission'
    });
    await queryInterface.addIndex('homework_submissions', ['school_id', 'branch_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('homework_submissions');
  }
};
