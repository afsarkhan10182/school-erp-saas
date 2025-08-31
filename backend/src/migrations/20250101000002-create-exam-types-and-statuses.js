'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create exam_types table
    await queryInterface.createTable('exam_types', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      weightage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 100.00,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      school_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'schools', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create exam_statuses table
    await queryInterface.createTable('exam_statuses', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      color: {
        type: Sequelize.STRING(7),
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      is_system: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      school_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'schools', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes
    await queryInterface.addIndex('exam_types', ['school_id']);
    await queryInterface.addIndex('exam_types', ['is_active']);
    await queryInterface.addIndex('exam_types', ['sort_order']);
    await queryInterface.addIndex('exam_types', ['code']);
    await queryInterface.addIndex('exam_types', ['code', 'school_id'], { unique: true });

    await queryInterface.addIndex('exam_statuses', ['school_id']);
    await queryInterface.addIndex('exam_statuses', ['is_active']);
    await queryInterface.addIndex('exam_statuses', ['sort_order']);
    await queryInterface.addIndex('exam_statuses', ['code']);
    await queryInterface.addIndex('exam_statuses', ['code', 'school_id'], { unique: true });

    // Insert default exam types
    await queryInterface.bulkInsert('exam_types', [
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Unit Test',
        code: 'unit_test',
        description: 'Regular unit tests conducted during the academic year',
        weightage: 100.00,
        is_active: true,
        sort_order: 1,
        school_id: null, // Global
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Mid Term',
        code: 'mid_term',
        description: 'Mid-term examinations',
        weightage: 100.00,
        is_active: true,
        sort_order: 2,
        school_id: null, // Global
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Final',
        code: 'final',
        description: 'Final examinations',
        weightage: 100.00,
        is_active: true,
        sort_order: 3,
        school_id: null, // Global
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Semester',
        code: 'semester',
        description: 'Semester examinations',
        weightage: 100.00,
        is_active: true,
        sort_order: 4,
        school_id: null, // Global
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Annual',
        code: 'annual',
        description: 'Annual examinations',
        weightage: 100.00,
        is_active: true,
        sort_order: 5,
        school_id: null, // Global
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Mock Test',
        code: 'mock_test',
        description: 'Mock test examinations',
        weightage: 100.00,
        is_active: true,
        sort_order: 6,
        school_id: null, // Global
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // Insert default exam statuses
    await queryInterface.bulkInsert('exam_statuses', [
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Draft',
        code: 'draft',
        description: 'Exam is in draft state',
        color: '#6B7280',
        is_active: true,
        sort_order: 1,
        is_system: true,
        school_id: null, // Global
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Scheduled',
        code: 'scheduled',
        description: 'Exam is scheduled',
        color: '#3B82F6',
        is_active: true,
        sort_order: 2,
        is_system: true,
        school_id: null, // Global
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'In Progress',
        code: 'in_progress',
        description: 'Exam is currently in progress',
        color: '#F59E0B',
        is_active: true,
        sort_order: 3,
        is_system: true,
        school_id: null, // Global
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Completed',
        code: 'completed',
        description: 'Exam has been completed',
        color: '#10B981',
        is_active: true,
        sort_order: 4,
        is_system: true,
        school_id: null, // Global
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Cancelled',
        code: 'cancelled',
        description: 'Exam has been cancelled',
        color: '#EF4444',
        is_active: true,
        sort_order: 5,
        is_system: true,
        school_id: null, // Global
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.removeIndex('exam_types', ['code', 'school_id']);
    await queryInterface.removeIndex('exam_types', ['code']);
    await queryInterface.removeIndex('exam_types', ['sort_order']);
    await queryInterface.removeIndex('exam_types', ['is_active']);
    await queryInterface.removeIndex('exam_types', ['school_id']);

    await queryInterface.removeIndex('exam_statuses', ['code', 'school_id']);
    await queryInterface.removeIndex('exam_statuses', ['code']);
    await queryInterface.removeIndex('exam_statuses', ['sort_order']);
    await queryInterface.removeIndex('exam_statuses', ['is_active']);
    await queryInterface.removeIndex('exam_statuses', ['school_id']);

    // Drop tables
    await queryInterface.dropTable('exam_statuses');
    await queryInterface.dropTable('exam_types');
  },
};
