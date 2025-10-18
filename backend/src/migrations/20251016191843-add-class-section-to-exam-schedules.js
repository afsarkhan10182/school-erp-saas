'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('exam_schedules', 'class_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'classes', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    await queryInterface.addColumn('exam_schedules', 'section_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'sections', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    await queryInterface.addColumn('exam_schedules', 'subject_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'subjects', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Add indexes for better performance
    await queryInterface.addIndex('exam_schedules', ['class_id']);
    await queryInterface.addIndex('exam_schedules', ['section_id']);
    await queryInterface.addIndex('exam_schedules', ['subject_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('exam_schedules', ['subject_id']);
    await queryInterface.removeIndex('exam_schedules', ['section_id']);
    await queryInterface.removeIndex('exam_schedules', ['class_id']);

    await queryInterface.removeColumn('exam_schedules', 'subject_id');
    await queryInterface.removeColumn('exam_schedules', 'section_id');
    await queryInterface.removeColumn('exam_schedules', 'class_id');
  }
};
