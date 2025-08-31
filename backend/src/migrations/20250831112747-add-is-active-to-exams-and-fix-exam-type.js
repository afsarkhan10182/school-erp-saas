'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add is_active column
    await queryInterface.addColumn('exams', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    // Add exam_type_id column
    await queryInterface.addColumn('exams', 'exam_type_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'exam_types',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add index for exam_type_id
    await queryInterface.addIndex('exams', ['exam_type_id']);

    // Add index for is_active
    await queryInterface.addIndex('exams', ['is_active']);

    // Remove the old exam_type enum column (if it exists)
    try {
      await queryInterface.removeColumn('exams', 'exam_type');
    } catch (error) {
      // Column might not exist, ignore error
      console.log('exam_type column does not exist, skipping removal');
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove is_active column
    await queryInterface.removeColumn('exams', 'is_active');

    // Remove exam_type_id column
    await queryInterface.removeColumn('exams', 'exam_type_id');

    // Add back the old exam_type enum column
    await queryInterface.addColumn('exams', 'exam_type', {
      type: Sequelize.ENUM('unit_test', 'mid_term', 'final', 'semester', 'annual', 'mock_test'),
      allowNull: false,
      defaultValue: 'unit_test'
    });
  }
};
