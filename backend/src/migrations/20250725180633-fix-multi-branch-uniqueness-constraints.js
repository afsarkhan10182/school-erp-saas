'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    console.log('🔧 Starting migration: Fix multi-branch uniqueness constraints...');
    
    try {
      // 1. Fix Students Table - Change admission_number uniqueness from school_id to branch_id
      console.log('📝 Fixing students admission_number uniqueness...');
      try {
        await queryInterface.removeIndex('students', ['school_id', 'admission_number']);
        console.log('✅ Removed old school-wide admission_number constraint');
      } catch (error) {
        console.log('⚠️ Old constraint not found:', error.message);
      }
      
      await queryInterface.addIndex('students', ['school_id', 'branch_id', 'admission_number'], {
        unique: true,
        name: 'students_school_branch_admission_number_unique'
      });
      console.log('✅ Added school+branch-specific admission_number constraint');
      
      // 2. Fix Fee Types Table - Change code uniqueness to school_id + branch_id
      console.log('📝 Fixing fee_types code uniqueness...');
      try {
        await queryInterface.removeIndex('fee_types', ['school_id', 'code']);
        console.log('✅ Removed old school-wide fee_types code constraint');
      } catch (error) {
        console.log('⚠️ Old constraint not found:', error.message);
      }
      
      await queryInterface.addIndex('fee_types', ['school_id', 'branch_id', 'code'], {
        unique: true,
        name: 'fee_types_school_branch_code_unique'
      });
      console.log('✅ Added school+branch-specific fee_types code constraint');
      
      // 3. Add branch_id index to fee_types for performance
      try {
        await queryInterface.addIndex('fee_types', ['branch_id']);
        console.log('✅ Added branch_id index to fee_types');
      } catch (error) {
        console.log('⚠️ Branch_id index already exists:', error.message);
      }
      
      // 4. Fix Fee Invoices Table - Change invoice_number uniqueness from school_id to branch_id
      console.log('📝 Fixing fee_invoices invoice_number uniqueness...');
      try {
        await queryInterface.removeIndex('fee_invoices', ['school_id', 'invoice_number']);
        console.log('✅ Removed old school-wide invoice_number constraint');
      } catch (error) {
        console.log('⚠️ Old constraint not found:', error.message);
      }
      
      await queryInterface.addIndex('fee_invoices', ['school_id', 'branch_id', 'invoice_number'], {
        unique: true,
        name: 'fee_invoices_school_branch_invoice_number_unique'
      });
      console.log('✅ Added school+branch-specific invoice_number constraint');
      
      // 5. Fix Parents Table - Change email/phone uniqueness from school_id to branch_id
      console.log('📝 Fixing parents email/phone uniqueness...');
      try {
        await queryInterface.removeIndex('parents', ['school_id', 'father_phone']);
        await queryInterface.removeIndex('parents', ['school_id', 'mother_phone']);
        await queryInterface.removeIndex('parents', ['school_id', 'guardian_phone']);
        console.log('✅ Removed old school-wide parent phone constraints');
      } catch (error) {
        console.log('⚠️ Old constraints not found:', error.message);
      }
      
      await queryInterface.addIndex('parents', ['school_id', 'branch_id', 'father_phone'], {
        unique: true,
        name: 'parents_school_branch_father_phone_unique'
      });
      await queryInterface.addIndex('parents', ['school_id', 'branch_id', 'mother_phone'], {
        unique: true,
        name: 'parents_school_branch_mother_phone_unique'
      });
      await queryInterface.addIndex('parents', ['school_id', 'branch_id', 'guardian_phone'], {
        unique: true,
        name: 'parents_school_branch_guardian_phone_unique'
      });
      console.log('✅ Added school+branch-specific parent phone constraints');
      
      // 6. Fix Users Table - Change email uniqueness from school_id to branch_id (for branch-specific users)
      console.log('📝 Fixing users email uniqueness for branch-specific users...');
      try {
        await queryInterface.removeIndex('users', ['email']);
        console.log('✅ Removed old global email constraint');
      } catch (error) {
        console.log('⚠️ Old constraint not found:', error.message);
      }
      
      // Add school+branch-specific email constraint for branch_admin and school_admin roles
      await queryInterface.addIndex('users', ['school_id', 'branch_id', 'email'], {
        unique: true,
        name: 'users_school_branch_email_unique'
      });
      console.log('✅ Added school+branch-specific email constraint');
      
      // 7. Add branch_id index to users for performance
      try {
        await queryInterface.addIndex('users', ['branch_id']);
        console.log('✅ Added branch_id index to users');
      } catch (error) {
        console.log('⚠️ Branch_id index already exists:', error.message);
      }
      
      console.log('✅ Migration completed: Fixed all multi-branch uniqueness constraints');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  async down (queryInterface, Sequelize) {
    console.log('🔄 Rolling back multi-branch uniqueness constraints...');
    
    try {
      // 1. Restore Students Table
      try {
        await queryInterface.removeIndex('students', 'students_school_branch_admission_number_unique');
        await queryInterface.addIndex('students', ['school_id', 'admission_number'], { unique: true });
        console.log('✅ Restored school-wide admission_number constraint');
      } catch (error) {
        console.log('⚠️ Error restoring students constraint:', error.message);
      }
      
      // 2. Restore Fee Types Table
      try {
        await queryInterface.removeIndex('fee_types', 'fee_types_school_branch_code_unique');
        await queryInterface.addIndex('fee_types', ['school_id', 'code'], { unique: true });
        console.log('✅ Restored school-wide fee_types code constraint');
      } catch (error) {
        console.log('⚠️ Error restoring fee_types constraint:', error.message);
      }
      
      // 3. Restore Fee Invoices Table
      try {
        await queryInterface.removeIndex('fee_invoices', 'fee_invoices_school_branch_invoice_number_unique');
        await queryInterface.addIndex('fee_invoices', ['school_id', 'invoice_number'], { unique: true });
        console.log('✅ Restored school-wide invoice_number constraint');
      } catch (error) {
        console.log('⚠️ Error restoring fee_invoices constraint:', error.message);
      }
      
      // 4. Restore Parents Table
      try {
        await queryInterface.removeIndex('parents', 'parents_school_branch_father_phone_unique');
        await queryInterface.removeIndex('parents', 'parents_school_branch_mother_phone_unique');
        await queryInterface.removeIndex('parents', 'parents_school_branch_guardian_phone_unique');
        await queryInterface.addIndex('parents', ['school_id', 'father_phone'], { unique: true });
        await queryInterface.addIndex('parents', ['school_id', 'mother_phone'], { unique: true });
        await queryInterface.addIndex('parents', ['school_id', 'guardian_phone'], { unique: true });
        console.log('✅ Restored school-wide parent phone constraints');
      } catch (error) {
        console.log('⚠️ Error restoring parents constraints:', error.message);
      }
      
      // 5. Restore Users Table
      try {
        await queryInterface.removeIndex('users', 'users_school_branch_email_unique');
        await queryInterface.addIndex('users', ['email'], { unique: true });
        console.log('✅ Restored global email constraint');
      } catch (error) {
        console.log('⚠️ Error restoring users constraint:', error.message);
      }
      
      console.log('✅ Rollback completed: Restored all original constraints');
      
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};
