'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('exams', 'exam_status_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'exam_statuses',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('exams', 'exam_status_id');
  }
};
