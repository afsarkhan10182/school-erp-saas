'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop the existing unique constraint that prevents multiple fee structures for same fee type
    await queryInterface.removeIndex('fee_structures', 'unique_fee_structure_per_class_section');
    
    // Add a regular index for performance (not unique)
    await queryInterface.addIndex('fee_structures', [
      'school_id', 'academic_year', 'section', 'fee_type_id'
    ], { 
      name: 'idx_fee_structure_lookup' 
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop the new index
    await queryInterface.removeIndex('fee_structures', 'idx_fee_structure_lookup');
    
    // Restore the original unique constraint
    await queryInterface.addIndex('fee_structures', [
      'school_id', 'academic_year', 'class_name', 'section', 'fee_type_id'
    ], { 
      unique: true, 
      name: 'unique_fee_structure_per_class_section' 
    });
  }
}; 