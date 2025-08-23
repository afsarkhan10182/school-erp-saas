'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('attendance_sessions', 'subject_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'subjects',
        key: 'id'
      }
    });

    await queryInterface.addIndex('attendance_sessions', ['subject_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('attendance_sessions', ['subject_id']);
    await queryInterface.removeColumn('attendance_sessions', 'subject_id');
  }
};