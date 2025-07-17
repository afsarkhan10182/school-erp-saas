'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Academic Years Table
    await queryInterface.createTable('academic_years', {
      id: { 
        type: Sequelize.UUID, 
        defaultValue: Sequelize.literal('uuid_generate_v4()'), 
        primaryKey: true 
      },
      name: { 
        type: Sequelize.STRING(50), 
        allowNull: false, 
        unique: true 
      },
      code: { 
        type: Sequelize.STRING(20), 
        allowNull: false, 
        unique: true 
      },
      start_date: { 
        type: Sequelize.DATEONLY, 
        allowNull: false 
      },
      end_date: { 
        type: Sequelize.DATEONLY, 
        allowNull: false 
      },
      is_current: { 
        type: Sequelize.BOOLEAN, 
        allowNull: false, 
        defaultValue: false 
      },
      status: { 
        type: Sequelize.ENUM('active', 'inactive', 'completed'), 
        allowNull: false, 
        defaultValue: 'active' 
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

    // 2. Classes Table
    await queryInterface.createTable('classes', {
      id: { 
        type: Sequelize.UUID, 
        defaultValue: Sequelize.literal('uuid_generate_v4()'), 
        primaryKey: true 
      },
      name: { 
        type: Sequelize.STRING(50), 
        allowNull: false 
      },
      code: { 
        type: Sequelize.STRING(20), 
        allowNull: false 
      },
      numeric_value: { 
        type: Sequelize.INTEGER, 
        allowNull: true 
      },
      description: { 
        type: Sequelize.TEXT, 
        allowNull: true 
      },
      capacity: { 
        type: Sequelize.INTEGER, 
        allowNull: false, 
        defaultValue: 30 
      },
      sort_order: { 
        type: Sequelize.INTEGER, 
        allowNull: false, 
        defaultValue: 0 
      },
      is_active: { 
        type: Sequelize.BOOLEAN, 
        allowNull: false, 
        defaultValue: true 
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

    // 3. Sections Table
    await queryInterface.createTable('sections', {
      id: { 
        type: Sequelize.UUID, 
        defaultValue: Sequelize.literal('uuid_generate_v4()'), 
        primaryKey: true 
      },
      name: { 
        type: Sequelize.STRING(10), 
        allowNull: false 
      },
      capacity: { 
        type: Sequelize.INTEGER, 
        allowNull: false, 
        defaultValue: 30 
      },
      current_strength: { 
        type: Sequelize.INTEGER, 
        allowNull: false, 
        defaultValue: 0 
      },
      is_active: { 
        type: Sequelize.BOOLEAN, 
        allowNull: false, 
        defaultValue: true 
      },
      class_id: { 
        type: Sequelize.UUID, 
        allowNull: false 
      },
      class_teacher_id: { 
        type: Sequelize.UUID, 
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
    await queryInterface.addConstraint('academic_years', {
      fields: ['created_by'],
      type: 'foreign key',
      name: 'academic_years_created_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('academic_years', {
      fields: ['updated_by'],
      type: 'foreign key',
      name: 'academic_years_updated_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('classes', {
      fields: ['school_id'],
      type: 'foreign key',
      name: 'classes_school_id_fkey',
      references: { table: 'schools', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('classes', {
      fields: ['branch_id'],
      type: 'foreign key',
      name: 'classes_branch_id_fkey',
      references: { table: 'branches', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('classes', {
      fields: ['created_by'],
      type: 'foreign key',
      name: 'classes_created_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('classes', {
      fields: ['updated_by'],
      type: 'foreign key',
      name: 'classes_updated_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('sections', {
      fields: ['class_id'],
      type: 'foreign key',
      name: 'sections_class_id_fkey',
      references: { table: 'classes', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('sections', {
      fields: ['class_teacher_id'],
      type: 'foreign key',
      name: 'sections_class_teacher_id_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('sections', {
      fields: ['school_id'],
      type: 'foreign key',
      name: 'sections_school_id_fkey',
      references: { table: 'schools', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('sections', {
      fields: ['branch_id'],
      type: 'foreign key',
      name: 'sections_branch_id_fkey',
      references: { table: 'branches', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('sections', {
      fields: ['created_by'],
      type: 'foreign key',
      name: 'sections_created_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('sections', {
      fields: ['updated_by'],
      type: 'foreign key',
      name: 'sections_updated_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    // Add Indexes
    await queryInterface.addIndex('academic_years', ['name'], { unique: true });
    await queryInterface.addIndex('academic_years', ['code'], { unique: true });
    await queryInterface.addIndex('academic_years', ['is_current']);
    await queryInterface.addIndex('academic_years', ['status']);

    await queryInterface.addIndex('classes', ['school_id', 'code'], { unique: true });
    await queryInterface.addIndex('classes', ['school_id']);
    await queryInterface.addIndex('classes', ['branch_id']);
    await queryInterface.addIndex('classes', ['is_active']);
    await queryInterface.addIndex('classes', ['sort_order']);

    await queryInterface.addIndex('sections', ['class_id', 'name'], { unique: true });
    await queryInterface.addIndex('sections', ['class_id']);
    await queryInterface.addIndex('sections', ['class_teacher_id']);
    await queryInterface.addIndex('sections', ['school_id']);
    await queryInterface.addIndex('sections', ['branch_id']);
    await queryInterface.addIndex('sections', ['is_active']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('sections');
    await queryInterface.dropTable('classes');
    await queryInterface.dropTable('academic_years');
  }
}; 