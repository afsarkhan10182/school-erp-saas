'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add class_id and section_id columns to students table
    await queryInterface.addColumn('students', 'class_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'classes',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addColumn('students', 'section_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'sections',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('students', ['class_id']);
    await queryInterface.addIndex('students', ['section_id']);
    await queryInterface.addIndex('students', ['class_id', 'section_id']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes first
    await queryInterface.removeIndex('students', ['class_id', 'section_id']);
    await queryInterface.removeIndex('students', ['section_id']);
    await queryInterface.removeIndex('students', ['class_id']);

    // Remove columns
    await queryInterface.removeColumn('students', 'section_id');
    await queryInterface.removeColumn('students', 'class_id');
  }
}; 