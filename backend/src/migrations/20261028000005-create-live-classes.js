'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await queryInterface.describeTable('live_classes').catch(() => null))) {
      await queryInterface.createTable('live_classes', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        school_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'schools', key: 'id' },
          onDelete: 'CASCADE'
        },
        branch_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'branches', key: 'id' },
          onDelete: 'RESTRICT'
        },
        class_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'classes', key: 'id' },
          onDelete: 'RESTRICT'
        },
        section_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'sections', key: 'id' },
          onDelete: 'RESTRICT'
        },
        subject_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'subjects', key: 'id' },
          onDelete: 'SET NULL'
        },
        teacher_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onDelete: 'RESTRICT'
        },
        title: { type: Sequelize.STRING(180), allowNull: false },
        description: { type: Sequelize.TEXT, allowNull: true },
        scheduled_at: { type: Sequelize.DATE, allowNull: false },
        duration_minutes: { type: Sequelize.SMALLINT, allowNull: false },
        provider: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'external_link' },
        meeting_url: { type: Sequelize.STRING(1000), allowNull: false },
        status: {
          type: Sequelize.ENUM('scheduled', 'cancelled'),
          allowNull: false,
          defaultValue: 'scheduled'
        },
        created_by: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onDelete: 'RESTRICT'
        },
        updated_by: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onDelete: 'SET NULL'
        },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
      });
      await queryInterface.addIndex('live_classes', ['school_id', 'branch_id', 'scheduled_at']);
      await queryInterface.addIndex('live_classes', ['teacher_id', 'scheduled_at']);
    }
    if (!(await queryInterface.describeTable('live_class_attendance').catch(() => null))) {
      await queryInterface.createTable('live_class_attendance', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        live_class_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'live_classes', key: 'id' },
          onDelete: 'CASCADE'
        },
        student_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'students', key: 'id' },
          onDelete: 'RESTRICT'
        },
        status: {
          type: Sequelize.ENUM('present', 'late', 'left_early', 'insufficient', 'absent'),
          allowNull: false,
          defaultValue: 'absent'
        },
        first_joined_at: { type: Sequelize.DATE, allowNull: true },
        last_left_at: { type: Sequelize.DATE, allowNull: true },
        duration_minutes: { type: Sequelize.SMALLINT, allowNull: true },
        remarks: { type: Sequelize.STRING(500), allowNull: true },
        overridden_by: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onDelete: 'SET NULL'
        },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
      });
      await queryInterface.addConstraint('live_class_attendance', {
        fields: ['live_class_id', 'student_id'],
        type: 'unique',
        name: 'unique_live_class_student'
      });
      await queryInterface.addIndex('live_class_attendance', ['student_id']);
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('live_class_attendance');
    await queryInterface.dropTable('live_classes');
  }
};
