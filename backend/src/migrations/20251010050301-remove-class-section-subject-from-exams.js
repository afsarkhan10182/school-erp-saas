'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove class_id, section_id, and subject_id columns from exams table
    await queryInterface.removeColumn('exams', 'class_id');
    await queryInterface.removeColumn('exams', 'section_id');
    await queryInterface.removeColumn('exams', 'subject_id');
  },

  async down(queryInterface, Sequelize) {
    // Add back the columns if migration needs to be reverted
    await queryInterface.addColumn('exams', 'class_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'classes', key: 'id' }
    });
    await queryInterface.addColumn('exams', 'section_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'sections', key: 'id' }
    });
    await queryInterface.addColumn('exams', 'subject_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'subjects', key: 'id' }
    });
  }
};
