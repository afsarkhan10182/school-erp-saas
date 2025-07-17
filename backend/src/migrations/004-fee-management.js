'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create ENUM types first
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_fee_types_category" AS ENUM ('academic', 'transport', 'hostel', 'library', 'exam', 'sports', 'other');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_fee_structures_installment_type" AS ENUM ('one_time', 'monthly', 'quarterly', 'half_yearly', 'yearly');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_fee_structures_discount_type" AS ENUM ('fixed', 'percentage');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

  

    // 2. Fee Types Table
    await queryInterface.createTable('fee_types', {
      id: { 
        type: Sequelize.UUID, 
        defaultValue: Sequelize.literal('uuid_generate_v4()'), 
        primaryKey: true 
      },
      name: { 
        type: Sequelize.STRING(100), 
        allowNull: false 
      },
      code: { 
        type: Sequelize.STRING(20), 
        allowNull: false 
      },
      category: { 
        type: Sequelize.ENUM('academic', 'transport', 'hostel', 'library', 'exam', 'sports', 'other'), 
        allowNull: true, 
        defaultValue: 'other' 
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
      due_date_days: { 
        type: Sequelize.INTEGER, 
        allowNull: true, 
        defaultValue: 30 
      },
      tax_applicable: { 
        type: Sequelize.BOOLEAN, 
        allowNull: false, 
        defaultValue: false 
      },
      tax_percentage: { 
        type: Sequelize.DECIMAL(5, 2), 
        allowNull: false, 
        defaultValue: 0.00 
      },
      school_id: { 
        type: Sequelize.UUID, 
        allowNull: false 
      },
      branch_id: { 
        type: Sequelize.UUID, 
        allowNull: true 
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

    // 3. Fee Structures Table
    await queryInterface.createTable('fee_structures', {
      id: { 
        type: Sequelize.UUID, 
        defaultValue: Sequelize.literal('uuid_generate_v4()'), 
        primaryKey: true 
      },
      name: { 
        type: Sequelize.STRING(100), 
        allowNull: false 
      },
      academic_year: { 
        type: Sequelize.STRING(10), 
        allowNull: false 
      },
      class_name: { 
        type: Sequelize.STRING(20), 
        allowNull: false 
      },
      section: { 
        type: Sequelize.STRING(10), 
        allowNull: true 
      },
      fee_type_id: { 
        type: Sequelize.UUID, 
        allowNull: false 
      },
      amount: { 
        type: Sequelize.DECIMAL(10, 2), 
        allowNull: false 
      },
      installment_type: { 
        type: Sequelize.ENUM('one_time', 'monthly', 'quarterly', 'half_yearly', 'yearly'), 
        allowNull: false, 
        defaultValue: 'one_time' 
      },
      installment_count: { 
        type: Sequelize.INTEGER, 
        allowNull: false, 
        defaultValue: 1 
      },
      due_month: { 
        type: Sequelize.INTEGER, 
        allowNull: true 
      },
      due_day: { 
        type: Sequelize.INTEGER, 
        allowNull: false, 
        defaultValue: 10 
      },
      discount_applicable: { 
        type: Sequelize.BOOLEAN, 
        allowNull: false, 
        defaultValue: false 
      },
      discount_amount: { 
        type: Sequelize.DECIMAL(10, 2), 
        allowNull: false, 
        defaultValue: 0.00 
      },
      discount_type: { 
        type: Sequelize.ENUM('fixed', 'percentage'), 
        allowNull: false, 
        defaultValue: 'fixed' 
      },
      is_active: { 
        type: Sequelize.BOOLEAN, 
        allowNull: false, 
        defaultValue: true 
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      school_id: { 
        type: Sequelize.UUID, 
        allowNull: false 
      },
      branch_id: { 
        type: Sequelize.UUID, 
        allowNull: true 
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

    // Add Foreign Key Constraints
    await queryInterface.addConstraint('fee_types', {
      fields: ['school_id'],
      type: 'foreign key',
      name: 'fee_types_school_id_fkey',
      references: { table: 'schools', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('fee_types', {
      fields: ['branch_id'],
      type: 'foreign key',
      name: 'fee_types_branch_id_fkey',
      references: { table: 'branches', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('fee_types', {
      fields: ['created_by'],
      type: 'foreign key',
      name: 'fee_types_created_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('fee_types', {
      fields: ['updated_by'],
      type: 'foreign key',
      name: 'fee_types_updated_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('fee_structures', {
      fields: ['fee_type_id'],
      type: 'foreign key',
      name: 'fee_structures_fee_type_id_fkey',
      references: { table: 'fee_types', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('fee_structures', {
      fields: ['school_id'],
      type: 'foreign key',
      name: 'fee_structures_school_id_fkey',
      references: { table: 'schools', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('fee_structures', {
      fields: ['branch_id'],
      type: 'foreign key',
      name: 'fee_structures_branch_id_fkey',
      references: { table: 'branches', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('fee_structures', {
      fields: ['created_by'],
      type: 'foreign key',
      name: 'fee_structures_created_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('fee_structures', {
      fields: ['updated_by'],
      type: 'foreign key',
      name: 'fee_structures_updated_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    // Add Indexes
    await queryInterface.addIndex('fee_types', ['school_id', 'code'], { unique: true });
    await queryInterface.addIndex('fee_types', ['school_id']);
    await queryInterface.addIndex('fee_types', ['branch_id']);
    await queryInterface.addIndex('fee_types', ['category']);
    await queryInterface.addIndex('fee_types', ['is_active']);

    await queryInterface.addIndex('fee_structures', [
      'school_id', 'academic_year', 'class_name', 'section', 'fee_type_id'
    ], { 
      unique: true, 
      name: 'unique_fee_structure_per_class_section' 
    });
    await queryInterface.addIndex('fee_structures', ['school_id']);
    await queryInterface.addIndex('fee_structures', ['branch_id']);
    await queryInterface.addIndex('fee_structures', ['academic_year']);
    await queryInterface.addIndex('fee_structures', ['class_name']);
    await queryInterface.addIndex('fee_structures', ['fee_type_id']);
    await queryInterface.addIndex('fee_structures', ['is_active']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables first
    await queryInterface.dropTable('fee_structures');
    await queryInterface.dropTable('fee_types');
    
    // Drop ENUM types
    
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_fee_structures_discount_type";
    `);
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_fee_structures_installment_type";
    `);
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_fee_types_category";
    `);
  }
}; 