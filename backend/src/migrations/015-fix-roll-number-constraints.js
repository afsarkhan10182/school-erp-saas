'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove the incorrect roll number constraint (school-wide)
    try {
      await queryInterface.removeIndex('students', ['school_id', 'roll_number']);
      console.log('✅ Removed incorrect school-wide roll number constraint');
    } catch (error) {
      console.log('⚠️ Roll number constraint not found or already removed:', error.message);
    }

    // Add the correct roll number constraint (branch + class + section specific)
    await queryInterface.addIndex('students', ['branch_id', 'class_id', 'section_id', 'roll_number'], { 
      unique: true,
      name: 'students_branch_class_section_roll_unique'
    });
    console.log('✅ Added correct branch+class+section roll number constraint');

    // Add additional indexes for better performance
    await queryInterface.addIndex('students', ['branch_id', 'class_id', 'section_id']);
    console.log('✅ Added performance index for branch+class+section queries');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the correct constraint
    try {
      await queryInterface.removeIndex('students', 'students_branch_class_section_roll_unique');
      console.log('✅ Removed branch+class+section roll number constraint');
    } catch (error) {
      console.log('⚠️ Constraint not found:', error.message);
    }

    // Remove the performance index
    try {
      await queryInterface.removeIndex('students', ['branch_id', 'class_id', 'section_id']);
      console.log('✅ Removed performance index');
    } catch (error) {
      console.log('⚠️ Performance index not found:', error.message);
    }

    // Restore the original incorrect constraint
    await queryInterface.addIndex('students', ['school_id', 'roll_number'], { unique: true });
    console.log('✅ Restored original school-wide roll number constraint');
  }
}; 