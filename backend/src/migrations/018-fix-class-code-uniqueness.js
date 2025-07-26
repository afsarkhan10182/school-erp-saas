'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('🔧 Starting migration 018: Fix class code uniqueness per branch...');
      
      // Step 1: Remove the old school-wide unique constraint on code
      console.log('📝 Removing old school-wide code constraint...');
      try {
        await queryInterface.removeIndex('classes', ['school_id', 'code']);
        console.log('✅ Removed old school-wide code constraint');
      } catch (error) {
        console.log('⚠️ Old constraint not found or already removed:', error.message);
      }
      
      // Step 2: Add new branch-specific unique constraint for code
      console.log('📝 Adding new branch-specific code constraint...');
      await queryInterface.addConstraint('classes', {
        fields: ['school_id', 'branch_id', 'code'],
        type: 'unique',
        name: 'classes_school_branch_code_unique',
      });
      console.log('✅ Added new branch-specific code constraint');
      
      // Step 3: Add new branch-specific unique constraint for name (if not already exists)
      console.log('📝 Adding branch-specific name constraint...');
      try {
        await queryInterface.addConstraint('classes', {
          fields: ['school_id', 'branch_id', 'name'],
          type: 'unique',
          name: 'classes_school_branch_name_unique',
        });
        console.log('✅ Added branch-specific name constraint');
      } catch (error) {
        console.log('⚠️ Name constraint already exists:', error.message);
      }
      
      console.log('✅ Migration 018 completed: Fixed class code uniqueness per branch');
      
    } catch (error) {
      console.error('❌ Migration 018 failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      console.log('🔧 Rolling back migration 018...');
      
      // Remove the new branch-specific constraints
      try {
        await queryInterface.removeConstraint('classes', 'classes_school_branch_code_unique');
        console.log('✅ Removed branch-specific code constraint');
      } catch (error) {
        console.log('⚠️ Code constraint not found:', error.message);
      }
      
      try {
        await queryInterface.removeConstraint('classes', 'classes_school_branch_name_unique');
        console.log('✅ Removed branch-specific name constraint');
      } catch (error) {
        console.log('⚠️ Name constraint not found:', error.message);
      }
      
      // Restore the old school-wide constraint
      await queryInterface.addIndex('classes', ['school_id', 'code'], { unique: true });
      console.log('✅ Restored school-wide code constraint');
      
      console.log('✅ Migration 018 rollback completed');
      
    } catch (error) {
      console.error('❌ Migration 018 rollback failed:', error);
      throw error;
    }
  }
}; 