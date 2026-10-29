'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('exam_subject_marks', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      exam_schedule_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'exam_schedules', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      student_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'students', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      school_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'schools', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'branches', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      theory_marks_obtained: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      practical_marks_obtained: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      viva_marks_obtained: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      assignment_marks_obtained: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      marks_obtained: { type: Sequelize.DECIMAL(7, 2), allowNull: false, defaultValue: 0 },
      is_absent: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
    await queryInterface.addIndex('exam_subject_marks', ['exam_schedule_id', 'student_id'], {
      unique: true,
      name: 'idx_exam_subject_marks_schedule_student'
    });
    await queryInterface.addIndex('exam_subject_marks', ['school_id', 'branch_id', 'student_id'], {
      name: 'idx_exam_subject_marks_scope_student'
    });
  },

  async down(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      'SELECT COUNT(*)::int AS count FROM exam_subject_marks'
    );
    if (rows[0].count > 0) {
      throw new Error('Cannot remove exam subject marks while student marks exist');
    }
    await queryInterface.dropTable('exam_subject_marks');
  }
};
