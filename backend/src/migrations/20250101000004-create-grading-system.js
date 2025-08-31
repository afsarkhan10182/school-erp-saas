'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create grading_systems table
    await queryInterface.createTable('grading_systems', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
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
      grade_type: {
        type: Sequelize.ENUM('letter', 'number', 'percentage', 'custom'),
        allowNull: false,
        defaultValue: 'letter',
      },
      passing_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 35.00,
      },
      max_grade_points: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
        defaultValue: 4.00,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      is_default: {
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

    // Create grade_scales table
    await queryInterface.createTable('grade_scales', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      grading_system_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'grading_systems', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      grade: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      min_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },
      max_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },
      grade_points: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
      },
      description: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      is_passing: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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

    // Add indexes for grading_systems
    await queryInterface.addIndex('grading_systems', ['school_id']);
    await queryInterface.addIndex('grading_systems', ['is_active']);
    await queryInterface.addIndex('grading_systems', ['is_default']);
    await queryInterface.addIndex('grading_systems', ['code']);
    await queryInterface.addIndex('grading_systems', ['code', 'school_id'], { unique: true });

    // Add indexes for grade_scales
    await queryInterface.addIndex('grade_scales', ['grading_system_id']);
    await queryInterface.addIndex('grade_scales', ['grade']);
    await queryInterface.addIndex('grade_scales', ['sort_order']);
    await queryInterface.addIndex('grade_scales', ['is_passing']);
    await queryInterface.addIndex('grade_scales', ['grading_system_id', 'grade'], { unique: true });

    // Insert default grading system
    await queryInterface.bulkInsert('grading_systems', [
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Standard Letter Grading',
        code: 'STANDARD_LETTER',
        description: 'Standard A+ to F letter grading system',
        grade_type: 'letter',
        passing_percentage: 35.00,
        max_grade_points: 4.00,
        is_active: true,
        is_default: true,
        school_id: null, // Global
        created_at: new Date(),
        updated_at: new Date(),
      }
    ]);

    // Get the default grading system ID
    const [gradingSystems] = await queryInterface.sequelize.query(
      "SELECT id FROM grading_systems WHERE code = 'STANDARD_LETTER'"
    );
    
    if (gradingSystems.length > 0) {
      const gradingSystemId = gradingSystems[0].id;
      
      // Insert default grade scales
      await queryInterface.bulkInsert('grade_scales', [
        {
          id: Sequelize.literal('uuid_generate_v4()'),
          grading_system_id: gradingSystemId,
          grade: 'A+',
          min_percentage: 90.00,
          max_percentage: 100.00,
          grade_points: 4.00,
          description: 'Outstanding',
          is_passing: true,
          sort_order: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: Sequelize.literal('uuid_generate_v4()'),
          grading_system_id: gradingSystemId,
          grade: 'A',
          min_percentage: 80.00,
          max_percentage: 89.99,
          grade_points: 3.75,
          description: 'Excellent',
          is_passing: true,
          sort_order: 2,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: Sequelize.literal('uuid_generate_v4()'),
          grading_system_id: gradingSystemId,
          grade: 'B+',
          min_percentage: 70.00,
          max_percentage: 79.99,
          grade_points: 3.50,
          description: 'Very Good',
          is_passing: true,
          sort_order: 3,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: Sequelize.literal('uuid_generate_v4()'),
          grading_system_id: gradingSystemId,
          grade: 'B',
          min_percentage: 60.00,
          max_percentage: 69.99,
          grade_points: 3.25,
          description: 'Good',
          is_passing: true,
          sort_order: 4,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: Sequelize.literal('uuid_generate_v4()'),
          grading_system_id: gradingSystemId,
          grade: 'C+',
          min_percentage: 50.00,
          max_percentage: 59.99,
          grade_points: 3.00,
          description: 'Above Average',
          is_passing: true,
          sort_order: 5,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: Sequelize.literal('uuid_generate_v4()'),
          grading_system_id: gradingSystemId,
          grade: 'C',
          min_percentage: 40.00,
          max_percentage: 49.99,
          grade_points: 2.75,
          description: 'Average',
          is_passing: true,
          sort_order: 6,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: Sequelize.literal('uuid_generate_v4()'),
          grading_system_id: gradingSystemId,
          grade: 'D',
          min_percentage: 35.00,
          max_percentage: 39.99,
          grade_points: 2.50,
          description: 'Below Average',
          is_passing: true,
          sort_order: 7,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: Sequelize.literal('uuid_generate_v4()'),
          grading_system_id: gradingSystemId,
          grade: 'F',
          min_percentage: 0.00,
          max_percentage: 34.99,
          grade_points: 0.00,
          description: 'Fail',
          is_passing: false,
          sort_order: 8,
          created_at: new Date(),
          updated_at: new Date(),
        }
      ]);
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('grade_scales', ['grading_system_id', 'grade']);
    await queryInterface.removeIndex('grade_scales', ['is_passing']);
    await queryInterface.removeIndex('grade_scales', ['sort_order']);
    await queryInterface.removeIndex('grade_scales', ['grade']);
    await queryInterface.removeIndex('grade_scales', ['grading_system_id']);

    await queryInterface.removeIndex('grading_systems', ['code', 'school_id']);
    await queryInterface.removeIndex('grading_systems', ['code']);
    await queryInterface.removeIndex('grading_systems', ['is_default']);
    await queryInterface.removeIndex('grading_systems', ['is_active']);
    await queryInterface.removeIndex('grading_systems', ['school_id']);

    // Drop tables
    await queryInterface.dropTable('grade_scales');
    await queryInterface.dropTable('grading_systems');
  }
};
