'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Additional composite indexes for better query performance
    
    // Users table - composite indexes for common queries
    try {
      await queryInterface.addIndex('users', ['school_id', 'role']);
    } catch (error) {
      console.log('Index users_school_id_role already exists, skipping...');
    }
    try {
      await queryInterface.addIndex('users', ['school_id', 'status']);
    } catch (error) {
      console.log('Index users_school_id_status already exists, skipping...');
    }
    try {
      await queryInterface.addIndex('users', ['branch_id', 'role']);
    } catch (error) {
      console.log('Index users_branch_id_role already exists, skipping...');
    }
    
    // Schools table - composite indexes
    try {
      await queryInterface.addIndex('schools', ['status', 'is_active']);
    } catch (error) {
      console.log('Index schools_status_is_active already exists, skipping...');
    }
    try {
      await queryInterface.addIndex('schools', ['subscription_plan', 'status']);
    } catch (error) {
      console.log('Index schools_subscription_plan_status already exists, skipping...');
    }
    
    // Branches table - composite indexes
    try {
      await queryInterface.addIndex('branches', ['school_id', 'status']);
    } catch (error) {
      console.log('Index branches_school_id_status already exists, skipping...');
    }
    try {
      await queryInterface.addIndex('branches', ['school_id', 'is_main_branch']);
    } catch (error) {
      console.log('Index branches_school_id_is_main_branch already exists, skipping...');
    }
    
    // Students table - composite indexes for common queries
    try {
      await queryInterface.addIndex('students', ['school_id', 'academic_year']);
    } catch (error) {
      console.log('Index students_school_id_academic_year already exists, skipping...');
    }
    try {
      await queryInterface.addIndex('students', ['school_id', 'current_class']);
    } catch (error) {
      console.log('Index students_school_id_current_class already exists, skipping...');
    }
    try {
      await queryInterface.addIndex('students', ['school_id', 'status']);
    } catch (error) {
      console.log('Index students_school_id_status already exists, skipping...');
    }
    try {
      await queryInterface.addIndex('students', ['branch_id', 'current_class']);
    } catch (error) {
      console.log('Index students_branch_id_current_class already exists, skipping...');
    }
    try {
      await queryInterface.addIndex('students', ['academic_year', 'current_class', 'section']);
    } catch (error) {
      console.log('Index students_academic_year_current_class_section already exists, skipping...');
    }
    
    // Parents table - composite indexes
    try {
      await queryInterface.addIndex('parents', ['school_id', 'is_primary_contact']);
    } catch (error) {
      console.log('Index parents_school_id_is_primary_contact already exists, skipping...');
    }
    try {
      await queryInterface.addIndex('parents', ['school_id', 'emergency_contact']);
    } catch (error) {
      console.log('Index parents_school_id_emergency_contact already exists, skipping...');
    }
    
    // Fee Types table - composite indexes
    try {
      await queryInterface.addIndex('fee_types', ['school_id', 'category']);
    } catch (error) {
      console.log('Index fee_types_school_id_category already exists, skipping...');
    }
    try {
      await queryInterface.addIndex('fee_types', ['school_id', 'is_active']);
    } catch (error) {
      console.log('Index fee_types_school_id_is_active already exists, skipping...');
    }
    
    // Fee Structures table - composite indexes
    try {
      await queryInterface.addIndex('fee_structures', ['school_id', 'academic_year', 'is_active']);
    } catch (error) {
      console.log('Index fee_structures_school_id_academic_year_is_active already exists, skipping...');
    }
    try {
      await queryInterface.addIndex('fee_structures', ['school_id', 'class_name', 'is_active']);
    } catch (error) {
      console.log('Index fee_structures_school_id_class_name_is_active already exists, skipping...');
    }
    try {
      await queryInterface.addIndex('fee_structures', ['academic_year', 'class_name', 'section']);
    } catch (error) {
      console.log('Index fee_structures_academic_year_class_name_section already exists, skipping...');
    }
    
    // Fee Invoices table - composite indexes for reporting
    try {
      await queryInterface.addIndex('fee_invoices', ['school_id', 'academic_year']);
    } catch (error) {
      console.log('Index fee_invoices_school_id_academic_year already exists, skipping...');
    }
    try {
      await queryInterface.addIndex('fee_invoices', ['school_id', 'status']);
    } catch (error) {
      console.log('Index fee_invoices_school_id_status already exists, skipping...');
    }
    try {
      await queryInterface.addIndex('fee_invoices', ['school_id', 'payment_status']);
    } catch (error) {
      console.log('Index fee_invoices_school_id_payment_status already exists, skipping...');
    }
    try {
      await queryInterface.addIndex('fee_invoices', ['academic_year', 'class_name', 'status']);
    } catch (error) {
      console.log('Index fee_invoices_academic_year_class_name_status already exists, skipping...');
    }
    try {
      await queryInterface.addIndex('fee_invoices', ['due_date', 'status']);
    } catch (error) {
      console.log('Index fee_invoices_due_date_status already exists, skipping...');
    }
    try {
      await queryInterface.addIndex('fee_invoices', ['created_at', 'status']);
    } catch (error) {
      console.log('Index fee_invoices_created_at_status already exists, skipping...');
    }
    
    // Transactions table - composite indexes
    try {
      await queryInterface.addIndex('transactions', ['school_id', 'payment_status']);
    } catch (error) {
      console.log('Index transactions_school_id_payment_status already exists, skipping...');
    }
    try {
      await queryInterface.addIndex('transactions', ['school_id', 'transaction_status']);
    } catch (error) {
      console.log('Index transactions_school_id_transaction_status already exists, skipping...');
    }
    try {
      await queryInterface.addIndex('transactions', ['payment_status', 'created_at']);
    } catch (error) {
      console.log('Index transactions_payment_status_created_at already exists, skipping...');
    }
    

    
    // Academic Years table - composite indexes
    try {
      await queryInterface.addIndex('academic_years', ['is_current', 'status']);
    } catch (error) {
      console.log('Index academic_years_is_current_status already exists, skipping...');
    }
    
    // Classes table - composite indexes
    try {
      await queryInterface.addIndex('classes', ['school_id', 'is_active']);
    } catch (error) {
      console.log('Index classes_school_id_is_active already exists, skipping...');
    }
    try {
      await queryInterface.addIndex('classes', ['school_id', 'sort_order']);
    } catch (error) {
      console.log('Index classes_school_id_sort_order already exists, skipping...');
    }
    
    // Sections table - composite indexes
    try {
      await queryInterface.addIndex('sections', ['class_id', 'is_active']);
    } catch (error) {
      console.log('Index sections_class_id_is_active already exists, skipping...');
    }
    try {
      await queryInterface.addIndex('sections', ['school_id', 'is_active']);
    } catch (error) {
      console.log('Index sections_school_id_is_active already exists, skipping...');
    }
    
    // Subscription Renewal Requests table - composite indexes
    try {
      await queryInterface.addIndex('subscription_renewal_requests', ['school_id', 'status']);
    } catch (error) {
      console.log('Index subscription_renewal_requests_school_id_status already exists, skipping...');
    }
    try {
      await queryInterface.addIndex('subscription_renewal_requests', ['status', 'created_at']);
    } catch (error) {
      console.log('Index subscription_renewal_requests_status_created_at already exists, skipping...');
    }
    
    // Add partial indexes for better performance on filtered queries
    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_users_active_school 
        ON users (school_id, role) 
        WHERE status = 'active';
      `);
    } catch (error) {
      console.log('Partial index idx_users_active_school already exists, skipping...');
    }
    
    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_students_active_school 
        ON students (school_id, current_class) 
        WHERE status = 'active';
      `);
    } catch (error) {
      console.log('Partial index idx_students_active_school already exists, skipping...');
    }
    
    // Note: Removed the problematic partial index with CURRENT_DATE function
    // This can be handled at the application level with proper query optimization
    
    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_fee_structures_active_academic 
        ON fee_structures (school_id, academic_year, class_name) 
        WHERE is_active = true;
      `);
    } catch (error) {
      console.log('Partial index idx_fee_structures_active_academic already exists, skipping...');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Drop partial indexes
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_users_active_school;');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_students_active_school;');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_fee_structures_active_academic;');
    
    // Note: We don't drop the regular indexes here as they might be used by other parts of the application
    // The down migration is mainly for the partial indexes
  }
}; 