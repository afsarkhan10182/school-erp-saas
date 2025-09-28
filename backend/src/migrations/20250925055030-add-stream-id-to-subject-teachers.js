'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add stream_id column to subject_teachers table
    await queryInterface.addColumn('subject_teachers', 'stream_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'streams',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Optional stream for subject teacher assignment'
    });

    // Add index for stream_id
    await queryInterface.addIndex('subject_teachers', ['stream_id']);

    // Drop the old unique constraint
    await queryInterface.removeIndex('subject_teachers', 'unique_subject_teacher_assignment');

    // Add new unique constraint that includes stream_id
    await queryInterface.addIndex('subject_teachers', {
      fields: ['subject_id', 'teacher_id', 'class_id', 'section_id', 'stream_id', 'academic_year'],
      unique: true,
      name: 'unique_subject_teacher_assignment'
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop the new unique constraint
    await queryInterface.removeIndex('subject_teachers', 'unique_subject_teacher_assignment');

    // Add back the old unique constraint
    await queryInterface.addIndex('subject_teachers', {
      fields: ['subject_id', 'teacher_id', 'class_id', 'section_id', 'academic_year'],
      unique: true,
      name: 'unique_subject_teacher_assignment'
    });

    // Remove stream_id index
    await queryInterface.removeIndex('subject_teachers', ['stream_id']);

    // Remove stream_id column
    await queryInterface.removeColumn('subject_teachers', 'stream_id');
  }
};
