'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create exams table
    await queryInterface.createTable('exams', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      exam_type: {
        type: Sequelize.ENUM('unit_test', 'mid_term', 'final', 'semester', 'annual', 'mock_test'),
        allowNull: false,
        defaultValue: 'unit_test',
      },
      weightage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 100.00,
      },
      max_marks: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 100,
      },
      exam_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      end_time: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      duration_minutes: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Duration in minutes if not using start/end time',
      },
      academic_year: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('draft', 'scheduled', 'in_progress', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft',
      },
      instructions: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      class_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'classes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      section_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'sections', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      subject_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'subjects', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      school_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'schools', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'branches', key: 'id' },
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

    // Create exam_results table
    await queryInterface.createTable('exam_results', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      marks_obtained: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },
      percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },
      grade: {
        type: Sequelize.STRING(2),
        allowNull: true,
      },
      grade_points: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
        comment: 'GPA grade points (0.00 to 4.00)',
      },
      rank: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Class rank in this exam',
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_absent: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      exam_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'exams', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      student_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'students', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      school_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'schools', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'branches', key: 'id' },
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

    // Add indexes for performance
    await queryInterface.addIndex('exams', ['school_id']);
    await queryInterface.addIndex('exams', ['branch_id']);
    await queryInterface.addIndex('exams', ['class_id']);
    await queryInterface.addIndex('exams', ['section_id']);
    await queryInterface.addIndex('exams', ['subject_id']);
    await queryInterface.addIndex('exams', ['exam_date']);
    await queryInterface.addIndex('exams', ['exam_type']);
    await queryInterface.addIndex('exams', ['status']);
    await queryInterface.addIndex('exams', ['academic_year']);
    await queryInterface.addIndex('exams', ['school_id', 'branch_id', 'class_id', 'exam_date']);

    await queryInterface.addIndex('exam_results', ['school_id']);
    await queryInterface.addIndex('exam_results', ['branch_id']);
    await queryInterface.addIndex('exam_results', ['exam_id']);
    await queryInterface.addIndex('exam_results', ['student_id']);
    await queryInterface.addIndex('exam_results', ['grade']);
    await queryInterface.addIndex('exam_results', ['rank']);
    await queryInterface.addIndex('exam_results', ['exam_id', 'student_id'], { unique: true });
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order
    await queryInterface.dropTable('exam_results');
    await queryInterface.dropTable('exams');
  }
};
