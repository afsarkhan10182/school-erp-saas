'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔄 Starting migration: Add streams table and modify sections table');
    
    try {
      // Step 1: Create streams table
      console.log('📝 Creating streams table...');
      await queryInterface.createTable('streams', {
        id: { 
          type: Sequelize.UUID, 
          defaultValue: Sequelize.literal('uuid_generate_v4()'), 
          primaryKey: true 
        },
        name: { 
          type: Sequelize.STRING(100), 
          allowNull: false,
          comment: 'Stream name e.g., Science IT, Commerce General'
        },
        code: { 
          type: Sequelize.STRING(20), 
          allowNull: false,
          comment: 'Stream code e.g., SCI-IT, COM-GEN'
        },
        description: { 
          type: Sequelize.TEXT, 
          allowNull: true 
        },
        is_active: { 
          type: Sequelize.BOOLEAN, 
          allowNull: false, 
          defaultValue: true 
        },
        sort_order: { 
          type: Sequelize.INTEGER, 
          allowNull: false, 
          defaultValue: 0 
        },
        school_id: { 
          type: Sequelize.UUID, 
          allowNull: false 
        },
        branch_id: { 
          type: Sequelize.UUID, 
          allowNull: false 
        },
        class_id: { 
          type: Sequelize.UUID, 
          allowNull: false,
          comment: 'Links to classes 11 or 12 only'
        },
        created_by: { 
          type: Sequelize.UUID, 
          allowNull: true 
        },
        updated_by: { 
          type: Sequelize.UUID, 
          allowNull: true 
        },
        created_at: { 
          type: Sequelize.DATE, 
          defaultValue: Sequelize.literal('NOW()') 
        },
        updated_at: { 
          type: Sequelize.DATE, 
          defaultValue: Sequelize.literal('NOW()') 
        },
      });

      // Step 2: Add stream_id column to sections table (nullable)
      console.log('📝 Adding stream_id column to sections table...');
      await queryInterface.addColumn('sections', 'stream_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'streams',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        comment: 'Links to stream for higher classes (11, 12). NULL for lower classes.'
      });

      // Step 3: Add foreign key constraints for streams table
      console.log('🔧 Adding foreign key constraints for streams table...');
      await queryInterface.addConstraint('streams', {
        fields: ['school_id'],
        type: 'foreign key',
        name: 'streams_school_id_fkey',
        references: { table: 'schools', field: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });

      await queryInterface.addConstraint('streams', {
        fields: ['branch_id'],
        type: 'foreign key',
        name: 'streams_branch_id_fkey',
        references: { table: 'branches', field: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });

      await queryInterface.addConstraint('streams', {
        fields: ['class_id'],
        type: 'foreign key',
        name: 'streams_class_id_fkey',
        references: { table: 'classes', field: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });

      await queryInterface.addConstraint('streams', {
        fields: ['created_by'],
        type: 'foreign key',
        name: 'streams_created_by_fkey',
        references: { table: 'users', field: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });

      await queryInterface.addConstraint('streams', {
        fields: ['updated_by'],
        type: 'foreign key',
        name: 'streams_updated_by_fkey',
        references: { table: 'users', field: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });

      // Step 4: Add foreign key constraint for sections.stream_id
      console.log('🔧 Adding foreign key constraint for sections.stream_id...');
      await queryInterface.addConstraint('sections', {
        fields: ['stream_id'],
        type: 'foreign key',
        name: 'sections_stream_id_fkey',
        references: { table: 'streams', field: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });

      // Step 5: Add indexes for better performance
      console.log('🔧 Adding indexes for streams table...');
      await queryInterface.addIndex('streams', ['school_id', 'branch_id', 'class_id'], { 
        name: 'streams_school_branch_class_idx' 
      });
      await queryInterface.addIndex('streams', ['class_id'], { 
        name: 'streams_class_id_idx' 
      });
      await queryInterface.addIndex('streams', ['is_active'], { 
        name: 'streams_is_active_idx' 
      });
      await queryInterface.addIndex('streams', ['sort_order'], { 
        name: 'streams_sort_order_idx' 
      });
      await queryInterface.addIndex('streams', ['school_id', 'branch_id', 'name'], { 
        unique: true, 
        name: 'streams_school_branch_name_unique' 
      });

      // Step 6: Add index for sections.stream_id
      console.log('🔧 Adding index for sections.stream_id...');
      await queryInterface.addIndex('sections', ['stream_id'], { 
        name: 'sections_stream_id_idx' 
      });

      // Step 7: Update unique constraint for sections to include stream_id
      console.log('🔧 Updating sections unique constraint...');
      try {
        // Remove old constraint first
        await queryInterface.removeConstraint('sections', 'sections_class_name_unique');
        console.log('✅ Removed old sections unique constraint');
      } catch (error) {
        console.log('ℹ️ Old sections unique constraint does not exist, skipping...');
      }

      // Add new constraint: sections are unique within a class OR within a stream
      await queryInterface.addConstraint('sections', {
        fields: ['class_id', 'name'],
        type: 'unique',
        name: 'sections_class_name_unique',
        where: {
          stream_id: null // Only for sections without streams (lower classes)
        }
      });

      await queryInterface.addConstraint('sections', {
        fields: ['stream_id', 'name'],
        type: 'unique',
        name: 'sections_stream_name_unique',
        where: {
          stream_id: { [Sequelize.Op.ne]: null } // Only for sections with streams (higher classes)
        }
      });

      console.log('✅ Migration completed: Streams table created and sections table modified');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Rolling back migration: Remove streams table and revert sections table');
    
    try {
      // Step 1: Remove foreign key constraint from sections.stream_id
      console.log('🔧 Removing foreign key constraint from sections.stream_id...');
      try {
        await queryInterface.removeConstraint('sections', 'sections_stream_id_fkey');
      } catch (error) {
        console.log('ℹ️ sections_stream_id_fkey constraint does not exist, skipping...');
      }

      // Step 2: Remove indexes
      console.log('🔧 Removing indexes...');
      try {
        await queryInterface.removeIndex('sections', 'sections_stream_id_idx');
      } catch (error) {
        console.log('ℹ️ sections_stream_id_idx index does not exist, skipping...');
      }

      try {
        await queryInterface.removeIndex('streams', 'streams_school_branch_class_idx');
        await queryInterface.removeIndex('streams', 'streams_class_id_idx');
        await queryInterface.removeIndex('streams', 'streams_is_active_idx');
        await queryInterface.removeIndex('streams', 'streams_sort_order_idx');
        await queryInterface.removeIndex('streams', 'streams_school_branch_name_unique');
      } catch (error) {
        console.log('ℹ️ Some streams indexes do not exist, skipping...');
      }

      // Step 3: Remove unique constraints
      console.log('🔧 Removing unique constraints...');
      try {
        await queryInterface.removeConstraint('sections', 'sections_stream_name_unique');
        await queryInterface.removeConstraint('sections', 'sections_class_name_unique');
      } catch (error) {
        console.log('ℹ️ Some sections unique constraints do not exist, skipping...');
      }

      // Step 4: Remove stream_id column from sections
      console.log('🔧 Removing stream_id column from sections table...');
      await queryInterface.removeColumn('sections', 'stream_id');

      // Step 5: Remove foreign key constraints from streams
      console.log('🔧 Removing foreign key constraints from streams table...');
      try {
        await queryInterface.removeConstraint('streams', 'streams_updated_by_fkey');
        await queryInterface.removeConstraint('streams', 'streams_created_by_fkey');
        await queryInterface.removeConstraint('streams', 'streams_class_id_fkey');
        await queryInterface.removeConstraint('streams', 'streams_branch_id_fkey');
        await queryInterface.removeConstraint('streams', 'streams_school_id_fkey');
      } catch (error) {
        console.log('ℹ️ Some streams foreign key constraints do not exist, skipping...');
      }

      // Step 6: Drop streams table
      console.log('🔧 Dropping streams table...');
      await queryInterface.dropTable('streams');

      // Step 7: Restore original sections unique constraint
      console.log('🔧 Restoring original sections unique constraint...');
      await queryInterface.addConstraint('sections', {
        fields: ['class_id', 'name'],
        type: 'unique',
        name: 'sections_class_name_unique',
      });

      console.log('✅ Rollback completed: Streams table removed and sections table reverted');
      
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
}; 