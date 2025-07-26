'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add stream_id column to students table
    await queryInterface.addColumn('students', 'stream_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'streams',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // Add index for better performance
    await queryInterface.addIndex('students', ['stream_id'], {
      name: 'students_stream_id_idx'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove index first
    await queryInterface.removeIndex('students', 'students_stream_id_idx');
    
    // Remove stream_id column
    await queryInterface.removeColumn('students', 'stream_id');
  }
};
