'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Students Table
    await queryInterface.createTable('students', {
      id: { 
        type: Sequelize.UUID, 
        defaultValue: Sequelize.literal('uuid_generate_v4()'), 
        primaryKey: true 
      },
      admission_number: { 
        type: Sequelize.STRING(50), 
        allowNull: false 
      },
      roll_number: { 
        type: Sequelize.STRING(50), 
        allowNull: true 
      },
      first_name: { 
        type: Sequelize.STRING(50), 
        allowNull: false 
      },
      last_name: { 
        type: Sequelize.STRING(50), 
        allowNull: false 
      },
      middle_name: { 
        type: Sequelize.STRING(50), 
        allowNull: true 
      },
      date_of_birth: { 
        type: Sequelize.DATEONLY, 
        allowNull: false 
      },
      gender: { 
        type: Sequelize.ENUM('male', 'female', 'other'), 
        allowNull: false 
      },
      blood_group: { 
        type: Sequelize.STRING(5), 
        allowNull: true 
      },
      religion: { 
        type: Sequelize.STRING(50), 
        allowNull: true 
      },
      caste: { 
        type: Sequelize.STRING(50), 
        allowNull: true 
      },
      category: { 
        type: Sequelize.ENUM('general', 'obc', 'sc', 'st', 'other'), 
        allowNull: true 
      },
      nationality: { 
        type: Sequelize.STRING(50), 
        allowNull: false, 
        defaultValue: 'Indian' 
      },
      mother_tongue: { 
        type: Sequelize.STRING(50), 
        allowNull: true 
      },
      email: { 
        type: Sequelize.STRING, 
        allowNull: true 
      },
      phone: { 
        type: Sequelize.STRING(20), 
        allowNull: true 
      },
      emergency_contact: { 
        type: Sequelize.STRING(20), 
        allowNull: true 
      },
      address: { 
        type: Sequelize.TEXT, 
        allowNull: true 
      },
      city: { 
        type: Sequelize.STRING(50), 
        allowNull: true 
      },
      state: { 
        type: Sequelize.STRING(50), 
        allowNull: true 
      },
      postal_code: { 
        type: Sequelize.STRING(20), 
        allowNull: true 
      },
      country: { 
        type: Sequelize.STRING(50), 
        allowNull: false, 
        defaultValue: 'India' 
      },
      admission_date: { 
        type: Sequelize.DATEONLY, 
        allowNull: false, 
        defaultValue: Sequelize.literal('CURRENT_DATE') 
      },
      admission_class: { 
        type: Sequelize.STRING(20), 
        allowNull: false 
      },
      current_class: { 
        type: Sequelize.STRING(20), 
        allowNull: false 
      },
      section: { 
        type: Sequelize.STRING(10), 
        allowNull: true 
      },
      academic_year: { 
        type: Sequelize.STRING(10), 
        allowNull: false 
      },
      status: { 
        type: Sequelize.ENUM('active', 'inactive', 'transferred', 'graduated', 'dropped'), 
        allowNull: false, 
        defaultValue: 'active' 
      },
      photo: { 
        type: Sequelize.STRING, 
        allowNull: true 
      },
      documents: { 
        type: Sequelize.JSONB, 
        allowNull: false, 
        defaultValue: {} 
      },
      medical_info: { 
        type: Sequelize.JSONB, 
        allowNull: false, 
        defaultValue: {} 
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
      user_id: { 
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

    // 2. Parents Table
    await queryInterface.createTable('parents', {
      id: { 
        type: Sequelize.UUID, 
        defaultValue: Sequelize.literal('uuid_generate_v4()'), 
        primaryKey: true 
      },
      father_name: { 
        type: Sequelize.STRING(100), 
        allowNull: true 
      },
      father_phone: { 
        type: Sequelize.STRING(20), 
        allowNull: true 
      },
      father_email: { 
        type: Sequelize.STRING, 
        allowNull: true 
      },
      father_occupation: { 
        type: Sequelize.STRING(100), 
        allowNull: true 
      },
      father_qualification: { 
        type: Sequelize.STRING(100), 
        allowNull: true 
      },
      father_income: { 
        type: Sequelize.DECIMAL(10, 2), 
        allowNull: true 
      },
      mother_name: { 
        type: Sequelize.STRING(100), 
        allowNull: true 
      },
      mother_phone: { 
        type: Sequelize.STRING(20), 
        allowNull: true 
      },
      mother_email: { 
        type: Sequelize.STRING, 
        allowNull: true 
      },
      mother_occupation: { 
        type: Sequelize.STRING(100), 
        allowNull: true 
      },
      mother_qualification: { 
        type: Sequelize.STRING(100), 
        allowNull: true 
      },
      mother_income: { 
        type: Sequelize.DECIMAL(10, 2), 
        allowNull: true 
      },
      guardian_name: { 
        type: Sequelize.STRING(100), 
        allowNull: true 
      },
      guardian_phone: { 
        type: Sequelize.STRING(20), 
        allowNull: true 
      },
      guardian_email: { 
        type: Sequelize.STRING, 
        allowNull: true 
      },
      guardian_relation: { 
        type: Sequelize.STRING(50), 
        allowNull: true 
      },
      guardian_occupation: { 
        type: Sequelize.STRING(100), 
        allowNull: true 
      },
      address: { 
        type: Sequelize.TEXT, 
        allowNull: true 
      },
      city: { 
        type: Sequelize.STRING(50), 
        allowNull: true 
      },
      state: { 
        type: Sequelize.STRING(50), 
        allowNull: true 
      },
      postal_code: { 
        type: Sequelize.STRING(20), 
        allowNull: true 
      },
      country: { 
        type: Sequelize.STRING(50), 
        allowNull: false, 
        defaultValue: 'India' 
      },
      is_primary_contact: { 
        type: Sequelize.BOOLEAN, 
        allowNull: false, 
        defaultValue: false 
      },
      emergency_contact: { 
        type: Sequelize.BOOLEAN, 
        allowNull: false, 
        defaultValue: false 
      },
      income_certificate: { 
        type: Sequelize.STRING, 
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

    // 3. Student-Parent Relationship Table
    await queryInterface.createTable('student_parents', {
      id: { 
        type: Sequelize.UUID, 
        defaultValue: Sequelize.literal('uuid_generate_v4()'), 
        primaryKey: true 
      },
      student_id: { 
        type: Sequelize.UUID, 
        allowNull: false 
      },
      parent_id: { 
        type: Sequelize.UUID, 
        allowNull: false 
      },
      relationship: { 
        type: Sequelize.STRING, 
        allowNull: false, 
        defaultValue: 'father' 
      },
      is_primary: { 
        type: Sequelize.BOOLEAN, 
        allowNull: false, 
        defaultValue: false 
      },
      is_emergency_contact: { 
        type: Sequelize.BOOLEAN, 
        allowNull: false, 
        defaultValue: false 
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
    await queryInterface.addConstraint('students', {
      fields: ['school_id'],
      type: 'foreign key',
      name: 'students_school_id_fkey',
      references: { table: 'schools', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('students', {
      fields: ['branch_id'],
      type: 'foreign key',
      name: 'students_branch_id_fkey',
      references: { table: 'branches', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('students', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'students_user_id_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('students', {
      fields: ['created_by'],
      type: 'foreign key',
      name: 'students_created_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('students', {
      fields: ['updated_by'],
      type: 'foreign key',
      name: 'students_updated_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('parents', {
      fields: ['school_id'],
      type: 'foreign key',
      name: 'parents_school_id_fkey',
      references: { table: 'schools', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('parents', {
      fields: ['branch_id'],
      type: 'foreign key',
      name: 'parents_branch_id_fkey',
      references: { table: 'branches', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('parents', {
      fields: ['created_by'],
      type: 'foreign key',
      name: 'parents_created_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('parents', {
      fields: ['updated_by'],
      type: 'foreign key',
      name: 'parents_updated_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('student_parents', {
      fields: ['student_id'],
      type: 'foreign key',
      name: 'student_parents_student_id_fkey',
      references: { table: 'students', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('student_parents', {
      fields: ['parent_id'],
      type: 'foreign key',
      name: 'student_parents_parent_id_fkey',
      references: { table: 'parents', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // Add Indexes
    await queryInterface.addIndex('students', ['school_id', 'admission_number'], { unique: true });
    await queryInterface.addIndex('students', ['school_id', 'roll_number'], { unique: true });
    await queryInterface.addIndex('students', ['school_id']);
    await queryInterface.addIndex('students', ['branch_id']);
    await queryInterface.addIndex('students', ['status']);
    await queryInterface.addIndex('students', ['academic_year']);
    await queryInterface.addIndex('students', ['current_class']);
    await queryInterface.addIndex('students', ['admission_date']);

    await queryInterface.addIndex('parents', ['school_id']);
    await queryInterface.addIndex('parents', ['branch_id']);
    await queryInterface.addIndex('parents', ['father_phone']);
    await queryInterface.addIndex('parents', ['mother_phone']);
    await queryInterface.addIndex('parents', ['guardian_phone']);

    await queryInterface.addIndex('student_parents', ['student_id', 'parent_id'], { unique: true });
    await queryInterface.addIndex('student_parents', ['student_id']);
    await queryInterface.addIndex('student_parents', ['parent_id']);
    await queryInterface.addIndex('student_parents', ['relationship']);
    await queryInterface.addIndex('student_parents', ['is_primary']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('student_parents');
    await queryInterface.dropTable('parents');
    await queryInterface.dropTable('students');
  }
}; 