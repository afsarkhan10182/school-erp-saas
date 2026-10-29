'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const meetingsExists = await queryInterface
      .describeTable('parent_teacher_meetings')
      .catch(() => null);
    if (!meetingsExists) {
      await queryInterface.createTable('parent_teacher_meetings', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        school_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'schools', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        branch_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'branches', key: 'id' },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE'
        },
        class_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'classes', key: 'id' },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE'
        },
        section_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'sections', key: 'id' },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE'
        },
        title: { type: Sequelize.STRING(160), allowNull: false },
        agenda: { type: Sequelize.TEXT, allowNull: true },
        meeting_date: { type: Sequelize.DATEONLY, allowNull: false },
        start_time: { type: Sequelize.STRING(5), allowNull: false },
        end_time: { type: Sequelize.STRING(5), allowNull: false },
        mode: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'in_person' },
        venue: { type: Sequelize.STRING(200), allowNull: true },
        online_url: { type: Sequelize.STRING(1000), allowNull: true },
        status: {
          type: Sequelize.ENUM('scheduled', 'completed', 'cancelled'),
          allowNull: false,
          defaultValue: 'scheduled'
        },
        created_by: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE'
        },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
      });
      await queryInterface.addIndex('parent_teacher_meetings', [
        'school_id',
        'branch_id',
        'meeting_date'
      ]);
      await queryInterface.addIndex('parent_teacher_meetings', ['class_id', 'section_id']);
    }

    const attendeesExists = await queryInterface
      .describeTable('parent_teacher_meeting_students')
      .catch(() => null);
    if (!attendeesExists) {
      await queryInterface.createTable('parent_teacher_meeting_students', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        meeting_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'parent_teacher_meetings', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        student_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'students', key: 'id' },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE'
        },
        attendance_status: {
          type: Sequelize.ENUM('pending', 'present', 'absent', 'rescheduled'),
          allowNull: false,
          defaultValue: 'pending'
        },
        teacher_remarks: { type: Sequelize.TEXT, allowNull: true },
        parent_rating: { type: Sequelize.SMALLINT, allowNull: true },
        parent_feedback: { type: Sequelize.TEXT, allowNull: true },
        parent_responded_at: { type: Sequelize.DATE, allowNull: true },
        feedback_parent_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'parents', key: 'id' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        },
        recorded_by: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
      });
      await queryInterface.addConstraint('parent_teacher_meeting_students', {
        fields: ['meeting_id', 'student_id'],
        type: 'unique',
        name: 'unique_ptm_meeting_student'
      });
      await queryInterface.addIndex('parent_teacher_meeting_students', ['student_id']);
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('parent_teacher_meeting_students');
    await queryInterface.dropTable('parent_teacher_meetings');
  }
};
