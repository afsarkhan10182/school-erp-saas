'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Try to drop the existing unique constraint
      await queryInterface.removeConstraint('students', 'students_school_branch_class_section_roll_unique');
    } catch (error) {
      console.log('Constraint not found or already removed, continuing...');
    }
    
    // Drop the new constraint if it exists
    try {
      await queryInterface.removeConstraint('students', 'students_school_branch_class_section_stream_roll_unique');
    } catch (error) {
      console.log('New constraint not found, continuing...');
    }
    
    // Add the new unique constraint that includes stream_id
    await queryInterface.addConstraint('students', {
      fields: ['school_id', 'branch_id', 'class_id', 'section_id', 'stream_id', 'roll_number'],
      type: 'unique',
      name: 'students_school_branch_class_section_stream_roll_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Drop the new constraint
      await queryInterface.removeConstraint('students', 'students_school_branch_class_section_stream_roll_unique');
    } catch (error) {
      console.log('New constraint not found, continuing...');
    }
    
    // Restore the old constraint
    await queryInterface.addConstraint('students', {
      fields: ['school_id', 'branch_id', 'class_id', 'section_id', 'roll_number'],
      type: 'unique',
      name: 'students_school_branch_class_section_roll_unique'
    });
  }
}; 