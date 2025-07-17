'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Admissions Table
    await queryInterface.createTable('admissions', {
      id: { 
        type: Sequelize.UUID, 
        defaultValue: Sequelize.literal('uuid_generate_v4()'), 
        primaryKey: true 
      },
      application_number: { 
        type: Sequelize.STRING(50), 
        allowNull: false, 
        unique: true 
      },
      student_id: { 
        type: Sequelize.UUID, 
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
        type: Sequelize.STRING, 
        allowNull: false 
      },
      email: { 
        type: Sequelize.STRING, 
        allowNull: true 
      },
      phone: { 
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
      applied_class: { 
        type: Sequelize.STRING(20), 
        allowNull: false 
      },
      academic_year: { 
        type: Sequelize.STRING(10), 
        allowNull: false 
      },
      admission_type: { 
        type: Sequelize.STRING(20), 
        allowNull: false, 
        defaultValue: 'new' 
      },
      application_date: { 
        type: Sequelize.DATEONLY, 
        allowNull: false, 
        defaultValue: Sequelize.literal('CURRENT_DATE') 
      },
      status: { 
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'waitlisted', 'withdrawn'), 
        allowNull: false, 
        defaultValue: 'pending' 
      },
      documents: { 
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
    await queryInterface.addConstraint('admissions', {
      fields: ['student_id'],
      type: 'foreign key',
      name: 'admissions_student_id_fkey',
      references: { table: 'students', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('admissions', {
      fields: ['school_id'],
      type: 'foreign key',
      name: 'admissions_school_id_fkey',
      references: { table: 'schools', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('admissions', {
      fields: ['branch_id'],
      type: 'foreign key',
      name: 'admissions_branch_id_fkey',
      references: { table: 'branches', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('admissions', {
      fields: ['created_by'],
      type: 'foreign key',
      name: 'admissions_created_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('admissions', {
      fields: ['updated_by'],
      type: 'foreign key',
      name: 'admissions_updated_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    // Add Indexes
    await queryInterface.addIndex('admissions', ['application_number'], { unique: true });
    await queryInterface.addIndex('admissions', ['student_id']);
    await queryInterface.addIndex('admissions', ['school_id']);
    await queryInterface.addIndex('admissions', ['branch_id']);
    await queryInterface.addIndex('admissions', ['academic_year']);
    await queryInterface.addIndex('admissions', ['applied_class']);
    await queryInterface.addIndex('admissions', ['status']);
    await queryInterface.addIndex('admissions', ['application_date']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('admissions');
  }
}; 