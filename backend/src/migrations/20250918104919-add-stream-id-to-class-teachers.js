'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add stream_id column to class_teachers table
    await queryInterface.addColumn('class_teachers', 'stream_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'streams',
        key: 'id'
      },
      comment: 'Stream for class teacher assignment (optional)'
    });

    // Add index for stream_id
    await queryInterface.addIndex('class_teachers', ['stream_id']);

    // Drop the old unique constraint
    await queryInterface.removeIndex('class_teachers', 'unique_class_teacher');

    // Add new unique constraint with stream_id
    await queryInterface.addIndex('class_teachers', {
      fields: ['class_id', 'section_id', 'stream_id', 'academic_year', 'school_id', 'branch_id'],
      unique: true,
      name: 'unique_class_teacher'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove the new unique constraint
    await queryInterface.removeIndex('class_teachers', 'unique_class_teacher');

    // Add back the old unique constraint
    await queryInterface.addIndex('class_teachers', {
      fields: ['class_id', 'section_id', 'academic_year', 'school_id', 'branch_id'],
      unique: true,
      name: 'unique_class_teacher'
    });

    // Remove stream_id index
    await queryInterface.removeIndex('class_teachers', ['stream_id']);

    // Remove stream_id column
    await queryInterface.removeColumn('class_teachers', 'stream_id');
  }
};
