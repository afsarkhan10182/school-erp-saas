/* eslint-disable */
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('attendance_sessions', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('uuid_generate_v4()') },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      attendance_type: { type: Sequelize.ENUM('daily', 'period'), allowNull: false, defaultValue: 'daily' },
      period_number: { type: Sequelize.INTEGER, allowNull: true },
      academic_year: { type: Sequelize.STRING(10), allowNull: true },
      remarks: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.ENUM('draft', 'published'), allowNull: false, defaultValue: 'draft' },
      class_id: { type: Sequelize.UUID, allowNull: false },
      section_id: { type: Sequelize.UUID, allowNull: true },
      stream_id: { type: Sequelize.UUID, allowNull: true },
      school_id: { type: Sequelize.UUID, allowNull: false },
      branch_id: { type: Sequelize.UUID, allowNull: false },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.addIndex('attendance_sessions', ['school_id']);
    await queryInterface.addIndex('attendance_sessions', ['branch_id']);
    await queryInterface.addIndex('attendance_sessions', ['class_id']);
    await queryInterface.addIndex('attendance_sessions', ['section_id']);
    await queryInterface.addIndex('attendance_sessions', ['date']);
    await queryInterface.addIndex('attendance_sessions', ['attendance_type']);
    await queryInterface.addIndex('attendance_sessions', ['status']);
    await queryInterface.addConstraint('attendance_sessions', {
      fields: ['school_id', 'branch_id', 'class_id', 'section_id', 'date', 'period_number'],
      type: 'unique',
      name: 'attendance_sessions_unique_per_class_section_date_period'
    });

    await queryInterface.createTable('attendance_records', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('uuid_generate_v4()') },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      status: { type: Sequelize.ENUM('present', 'absent', 'late', 'excused'), allowNull: false },
      remarks: { type: Sequelize.TEXT, allowNull: true },
      session_id: { type: Sequelize.UUID, allowNull: false },
      student_id: { type: Sequelize.UUID, allowNull: false },
      class_id: { type: Sequelize.UUID, allowNull: false },
      section_id: { type: Sequelize.UUID, allowNull: true },
      stream_id: { type: Sequelize.UUID, allowNull: true },
      school_id: { type: Sequelize.UUID, allowNull: false },
      branch_id: { type: Sequelize.UUID, allowNull: false },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.addIndex('attendance_records', ['school_id']);
    await queryInterface.addIndex('attendance_records', ['branch_id']);
    await queryInterface.addIndex('attendance_records', ['class_id']);
    await queryInterface.addIndex('attendance_records', ['section_id']);
    await queryInterface.addIndex('attendance_records', ['student_id']);
    await queryInterface.addIndex('attendance_records', ['date']);
    await queryInterface.addIndex('attendance_records', ['status']);
    await queryInterface.addConstraint('attendance_records', {
      fields: ['session_id', 'student_id'],
      type: 'unique',
      name: 'attendance_records_unique_per_session_student'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('attendance_records', 'attendance_records_unique_per_session_student');
    await queryInterface.dropTable('attendance_records');
    await queryInterface.removeConstraint('attendance_sessions', 'attendance_sessions_unique_per_class_section_date_period');
    await queryInterface.dropTable('attendance_sessions');
  }
};


