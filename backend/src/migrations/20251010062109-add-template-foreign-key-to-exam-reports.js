'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add foreign key constraint for template_id
    await queryInterface.addConstraint('exam_reports', {
      fields: ['template_id'],
      type: 'foreign key',
      name: 'exam_reports_template_id_fkey',
      references: {
        table: 'report_templates',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('exam_reports', 'exam_reports_template_id_fkey');
  }
};
