'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔄 Starting migration: Simplify class-section structure v2');
    
    try {
      // Step 1: Check if there are any classes or sections with NULL branch_id
      const [classesWithNullBranch] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count FROM classes WHERE branch_id IS NULL
      `);
      
      const [sectionsWithNullBranch] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count FROM sections WHERE branch_id IS NULL
      `);
      
      console.log(`📊 Found ${classesWithNullBranch[0].count} classes with NULL branch_id`);
      console.log(`📊 Found ${sectionsWithNullBranch[0].count} sections with NULL branch_id`);
      
      // Step 2: Update classes with NULL branch_id
      if (classesWithNullBranch[0].count > 0) {
        console.log('📝 Updating classes with NULL branch_id...');
        await queryInterface.sequelize.query(`
          UPDATE classes 
          SET branch_id = (
            SELECT id FROM branches 
            WHERE branches.school_id = classes.school_id 
            LIMIT 1
          )
          WHERE branch_id IS NULL
        `);
      }
      
      // Step 3: Update sections with NULL branch_id
      if (sectionsWithNullBranch[0].count > 0) {
        console.log('📝 Updating sections with NULL branch_id...');
        await queryInterface.sequelize.query(`
          UPDATE sections 
          SET branch_id = (
            SELECT classes.branch_id 
            FROM classes 
            WHERE classes.id = sections.class_id
          )
          WHERE branch_id IS NULL
        `);
      }
      
      // Step 4: Verify no NULL values remain
      const [remainingClassesWithNull] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count FROM classes WHERE branch_id IS NULL
      `);
      
      const [remainingSectionsWithNull] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count FROM sections WHERE branch_id IS NULL
      `);
      
      if (remainingClassesWithNull[0].count > 0 || remainingSectionsWithNull[0].count > 0) {
        throw new Error(`Cannot proceed: ${remainingClassesWithNull[0].count} classes and ${remainingSectionsWithNull[0].count} sections still have NULL branch_id`);
      }
      
      console.log('✅ All NULL branch_id values have been resolved');
      
      // Step 5: Remove old constraints if they exist
      console.log('🔧 Removing old constraints...');
      try {
        await queryInterface.removeConstraint('classes', 'classes_school_id_code_key');
        console.log('✅ Removed classes_school_id_code_key constraint');
      } catch (error) {
        console.log('ℹ️ Classes constraint classes_school_id_code_key does not exist, skipping...');
      }
      
      try {
        await queryInterface.removeConstraint('sections', 'sections_class_id_name_key');
        console.log('✅ Removed sections_class_id_name_key constraint');
      } catch (error) {
        console.log('ℹ️ Sections constraint sections_class_id_name_key does not exist, skipping...');
      }
      
      // Step 6: Make branch_id NOT NULL for classes
      console.log('🔧 Making classes.branch_id NOT NULL...');
      await queryInterface.changeColumn('classes', 'branch_id', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'branches',
          key: 'id',
        },
      });
      
      // Step 7: Make branch_id NOT NULL for sections
      console.log('🔧 Making sections.branch_id NOT NULL...');
      await queryInterface.changeColumn('sections', 'branch_id', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'branches',
          key: 'id',
        },
      });
      
      // Step 8: Add new unique constraints
      console.log('🔧 Adding new unique constraints...');
      // Classes: school_id + branch_id + name (allows same name across branches)
      await queryInterface.addConstraint('classes', {
        fields: ['school_id', 'branch_id', 'name'],
        type: 'unique',
        name: 'classes_school_branch_name_unique',
      });
      
      // Sections: class_id + name (sections unique within a class)
      await queryInterface.addConstraint('sections', {
        fields: ['class_id', 'name'],
        type: 'unique',
        name: 'sections_class_name_unique',
      });
      
      console.log('✅ Migration 017 completed: Simplified class-section-branch structure v2');
      
    } catch (error) {
      console.error('❌ Migration 017 failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Rolling back migration: Simplify class-section structure v2');
    
    try {
      // Step 1: Remove new unique constraints
      console.log('🔧 Removing new constraints...');
      try {
        await queryInterface.removeConstraint('classes', 'classes_school_branch_name_unique');
        console.log('✅ Removed classes_school_branch_name_unique constraint');
      } catch (error) {
        console.log('ℹ️ Classes constraint classes_school_branch_name_unique does not exist, skipping...');
      }
      
      try {
        await queryInterface.removeConstraint('sections', 'sections_class_name_unique');
        console.log('✅ Removed sections_class_name_unique constraint');
      } catch (error) {
        console.log('ℹ️ Sections constraint sections_class_name_unique does not exist, skipping...');
      }
      
      // Step 2: Make branch_id nullable again
      console.log('🔧 Making classes.branch_id nullable...');
      await queryInterface.changeColumn('classes', 'branch_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'branches',
          key: 'id',
        },
      });
      
      console.log('🔧 Making sections.branch_id nullable...');
      await queryInterface.changeColumn('sections', 'branch_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'branches',
          key: 'id',
        },
      });
      
      // Step 3: Restore old unique constraints
      console.log('🔧 Restoring old constraints...');
      await queryInterface.addConstraint('classes', {
        fields: ['school_id', 'code'],
        type: 'unique',
        name: 'classes_school_id_code_key',
      });
      
      await queryInterface.addConstraint('sections', {
        fields: ['class_id', 'name'],
        type: 'unique',
        name: 'sections_class_id_name_key',
      });
      
      console.log('✅ Migration 017 rollback completed');
      
    } catch (error) {
      console.error('❌ Migration 017 rollback failed:', error);
      throw error;
    }
  }
}; 