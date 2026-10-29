'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    if (await queryInterface.describeTable('syllabus_units').catch(() => null)) return;
    await queryInterface.createTable('syllabus_units', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      school_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'schools', key: 'id' },
        onDelete: 'CASCADE'
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'branches', key: 'id' },
        onDelete: 'RESTRICT'
      },
      class_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'classes', key: 'id' },
        onDelete: 'RESTRICT'
      },
      subject_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'subjects', key: 'id' },
        onDelete: 'RESTRICT'
      },
      parent_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'syllabus_units', key: 'id' },
        onDelete: 'RESTRICT'
      },
      title: { type: Sequelize.STRING(180), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT'
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
    await queryInterface.addIndex('syllabus_units', [
      'school_id',
      'branch_id',
      'class_id',
      'subject_id'
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('syllabus_units');
  }
};
