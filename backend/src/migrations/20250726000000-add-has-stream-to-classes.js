'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔄 Starting migration: Add has_stream field to classes table');
    
    try {
      // Add has_stream column to classes table
      console.log('📝 Adding has_stream column to classes table...');
      await queryInterface.addColumn('classes', 'has_stream', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Indicates if this class has streams (e.g., Class 11, 12)'
      });

      // Add index for has_stream field
      console.log('📝 Adding index for has_stream field...');
      await queryInterface.addIndex('classes', ['has_stream'], {
        name: 'classes_has_stream_idx'
      });

      console.log('✅ Migration completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Rolling back migration: Remove has_stream field from classes table');
    
    try {
      // Remove index
      console.log('📝 Removing has_stream index...');
      await queryInterface.removeIndex('classes', 'classes_has_stream_idx');

      // Remove has_stream column
      console.log('📝 Removing has_stream column...');
      await queryInterface.removeColumn('classes', 'has_stream');

      console.log('✅ Rollback completed successfully');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
}; 