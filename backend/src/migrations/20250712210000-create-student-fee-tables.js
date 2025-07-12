'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create students table
    await queryInterface.createTable('students', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
      },
      admission_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      roll_number: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      first_name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      middle_name: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      date_of_birth: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      gender: {
        type: Sequelize.ENUM('male', 'female', 'other'),
        allowNull: false,
      },
      blood_group: {
        type: Sequelize.STRING(5),
        allowNull: true,
      },
      religion: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      caste: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      category: {
        type: Sequelize.ENUM('general', 'obc', 'sc', 'st', 'other'),
        allowNull: true,
      },
      nationality: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'Indian',
      },
      mother_tongue: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      emergency_contact: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      city: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      state: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      postal_code: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      country: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'India',
      },
      admission_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_DATE'),
      },
      admission_class: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      current_class: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      section: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      academic_year: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'transferred', 'graduated', 'dropped'),
        allowNull: false,
        defaultValue: 'active',
      },
      photo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      documents: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      medical_info: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      school_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'schools',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'branches',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    // 2. Create parents table
    await queryInterface.createTable('parents', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
      },
      father_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      father_phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      father_email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      father_occupation: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      father_qualification: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      father_income: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      mother_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      mother_phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      mother_email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      mother_occupation: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      mother_qualification: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      mother_income: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      guardian_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      guardian_phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      guardian_email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      guardian_relation: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      guardian_occupation: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      primary_contact: {
        type: Sequelize.ENUM('father', 'mother', 'guardian'),
        allowNull: false,
        defaultValue: 'father',
      },
      primary_phone: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      primary_email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      city: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      state: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      postal_code: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      country: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'India',
      },
      emergency_contact_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      emergency_contact_phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      emergency_contact_relation: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      annual_income: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      income_certificate: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      photo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      documents: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      school_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'schools',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    // 3. Create student_parents table
    await queryInterface.createTable('student_parents', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
      },
      student_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'students',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      parent_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'parents',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      relationship: {
        type: Sequelize.ENUM('father', 'mother', 'guardian', 'other'),
        allowNull: false,
        defaultValue: 'father',
      },
      is_primary: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_fee_payer: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_emergency_contact: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      can_pickup: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      school_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'schools',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    // 4. Create fee_types table
    await queryInterface.createTable('fee_types', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      code: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      category: {
        type: Sequelize.ENUM('academic', 'transport', 'hostel', 'library', 'exam', 'sports', 'other'),
        allowNull: false,
        defaultValue: 'academic',
      },
      is_mandatory: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      is_refundable: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      due_date_days: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 30,
      },
      late_fee_applicable: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      late_fee_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      late_fee_type: {
        type: Sequelize.ENUM('fixed', 'percentage'),
        allowNull: false,
        defaultValue: 'fixed',
      },
      tax_applicable: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      tax_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      school_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'schools',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    // 5. Create fee_structures table
    await queryInterface.createTable('fee_structures', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      academic_year: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      class_name: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      section: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      fee_type_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'fee_types',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      installment_type: {
        type: Sequelize.ENUM('one_time', 'monthly', 'quarterly', 'half_yearly', 'yearly'),
        allowNull: false,
        defaultValue: 'one_time',
      },
      installment_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      due_month: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      due_day: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 10,
      },
      discount_applicable: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      discount_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      discount_type: {
        type: Sequelize.ENUM('fixed', 'percentage'),
        allowNull: false,
        defaultValue: 'fixed',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      school_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'schools',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'branches',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    // 6. Create fee_invoices table
    await queryInterface.createTable('fee_invoices', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
      },
      invoice_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      student_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'students',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      fee_structure_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'fee_structures',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      academic_year: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      invoice_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_DATE'),
      },
      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      discount_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      tax_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      late_fee_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      total_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      paid_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      balance_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      status: {
        type: Sequelize.ENUM('draft', 'sent', 'paid', 'partial_paid', 'overdue', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft',
      },
      payment_terms: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      installment_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      total_installments: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      is_late_fee_applied: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      late_fee_applied_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      last_payment_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      invoice_items: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      school_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'schools',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'branches',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    // Add indexes for better performance
    await queryInterface.addIndex('students', ['school_id', 'admission_number'], { unique: true });
    await queryInterface.addIndex('students', ['school_id', 'roll_number'], { unique: true, where: { roll_number: { [Sequelize.Op.ne]: null } } });
    await queryInterface.addIndex('students', ['school_id']);
    await queryInterface.addIndex('students', ['academic_year']);
    await queryInterface.addIndex('students', ['current_class']);
    await queryInterface.addIndex('students', ['status']);

    await queryInterface.addIndex('parents', ['school_id']);
    await queryInterface.addIndex('parents', ['primary_phone']);
    await queryInterface.addIndex('parents', ['primary_email']);

    await queryInterface.addIndex('student_parents', ['student_id', 'parent_id'], { unique: true });
    await queryInterface.addIndex('student_parents', ['student_id']);
    await queryInterface.addIndex('student_parents', ['parent_id']);

    await queryInterface.addIndex('fee_types', ['school_id', 'code'], { unique: true });
    await queryInterface.addIndex('fee_types', ['school_id']);
    await queryInterface.addIndex('fee_types', ['category']);
    await queryInterface.addIndex('fee_types', ['is_active']);

    await queryInterface.addIndex('fee_structures', ['school_id', 'academic_year', 'class_name', 'fee_type_id'], { unique: true });
    await queryInterface.addIndex('fee_structures', ['school_id']);
    await queryInterface.addIndex('fee_structures', ['academic_year']);
    await queryInterface.addIndex('fee_structures', ['class_name']);
    await queryInterface.addIndex('fee_structures', ['fee_type_id']);

    await queryInterface.addIndex('fee_invoices', ['school_id', 'invoice_number'], { unique: true });
    await queryInterface.addIndex('fee_invoices', ['student_id']);
    await queryInterface.addIndex('fee_invoices', ['fee_structure_id']);
    await queryInterface.addIndex('fee_invoices', ['academic_year']);
    await queryInterface.addIndex('fee_invoices', ['status']);
    await queryInterface.addIndex('fee_invoices', ['due_date']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('fee_invoices');
    await queryInterface.dropTable('fee_structures');
    await queryInterface.dropTable('fee_types');
    await queryInterface.dropTable('student_parents');
    await queryInterface.dropTable('parents');
    await queryInterface.dropTable('students');
  },
};
