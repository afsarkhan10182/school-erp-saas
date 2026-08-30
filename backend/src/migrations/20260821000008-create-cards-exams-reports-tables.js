'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const tables = await queryInterface.showAllTables();
      const names = tables.map(t => (typeof t === 'string' ? t : t.tableName || t.name));

      if (!names.includes('card_templates')) {
        await queryInterface.createTable(
          'card_templates',
          {
            id: {
              type: Sequelize.UUID,
              defaultValue: Sequelize.UUIDV4,
              primaryKey: true
            },
            name: { type: Sequelize.STRING(120), allowNull: false },
            kind: {
              type: Sequelize.STRING(20),
              allowNull: false,
              defaultValue: 'id'
            },
            user_type: {
              type: Sequelize.STRING(20),
              allowNull: false,
              defaultValue: 'student'
            },
            layout_width: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 86 },
            layout_height: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 54 },
            background_color: { type: Sequelize.STRING(40), allowNull: true, defaultValue: '#4f46e5' },
            fields_json: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
            html_template: { type: Sequelize.TEXT, allowNull: true },
            is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
            school_id: {
              type: Sequelize.UUID,
              allowNull: false,
              references: { model: 'schools', key: 'id' }
            },
            branch_id: { type: Sequelize.UUID, allowNull: true },
            created_by: { type: Sequelize.UUID, allowNull: true },
            updated_by: { type: Sequelize.UUID, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
          },
          { transaction }
        );
      }

      if (!names.includes('online_exams')) {
        await queryInterface.createTable(
          'online_exams',
          {
            id: {
              type: Sequelize.UUID,
              defaultValue: Sequelize.UUIDV4,
              primaryKey: true
            },
            title: { type: Sequelize.STRING(255), allowNull: false },
            description: { type: Sequelize.TEXT, allowNull: true },
            exam_id: { type: Sequelize.UUID, allowNull: true },
            class_id: { type: Sequelize.UUID, allowNull: true },
            subject_id: { type: Sequelize.UUID, allowNull: true },
            duration_minutes: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 60 },
            pass_marks: { type: Sequelize.DECIMAL(8, 2), allowNull: false, defaultValue: 0 },
            total_marks: { type: Sequelize.DECIMAL(8, 2), allowNull: false, defaultValue: 0 },
            start_at: { type: Sequelize.DATE, allowNull: true },
            end_at: { type: Sequelize.DATE, allowNull: true },
            status: {
              type: Sequelize.STRING(40),
              allowNull: false,
              defaultValue: 'draft'
            },
            school_id: {
              type: Sequelize.UUID,
              allowNull: false,
              references: { model: 'schools', key: 'id' }
            },
            branch_id: { type: Sequelize.UUID, allowNull: true },
            created_by: { type: Sequelize.UUID, allowNull: true },
            updated_by: { type: Sequelize.UUID, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
          },
          { transaction }
        );
      }

      if (!names.includes('online_exam_questions')) {
        await queryInterface.createTable(
          'online_exam_questions',
          {
            id: {
              type: Sequelize.UUID,
              defaultValue: Sequelize.UUIDV4,
              primaryKey: true
            },
            online_exam_id: {
              type: Sequelize.UUID,
              allowNull: false,
              references: { model: 'online_exams', key: 'id' },
              onDelete: 'CASCADE'
            },
            question_text: { type: Sequelize.TEXT, allowNull: false },
            options_json: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
            correct_option: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
            marks: { type: Sequelize.DECIMAL(8, 2), allowNull: false, defaultValue: 1 },
            sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
            school_id: { type: Sequelize.UUID, allowNull: false },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
          },
          { transaction }
        );
      }

      if (!names.includes('online_exam_attempts')) {
        await queryInterface.createTable(
          'online_exam_attempts',
          {
            id: {
              type: Sequelize.UUID,
              defaultValue: Sequelize.UUIDV4,
              primaryKey: true
            },
            online_exam_id: {
              type: Sequelize.UUID,
              allowNull: false,
              references: { model: 'online_exams', key: 'id' },
              onDelete: 'CASCADE'
            },
            student_id: {
              type: Sequelize.UUID,
              allowNull: false,
              references: { model: 'students', key: 'id' }
            },
            answers_json: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
            score: { type: Sequelize.DECIMAL(8, 2), allowNull: false, defaultValue: 0 },
            status: {
              type: Sequelize.STRING(40),
              allowNull: false,
              defaultValue: 'submitted'
            },
            school_id: { type: Sequelize.UUID, allowNull: false },
            submitted_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
          },
          { transaction }
        );
      }

      if (!names.includes('exam_seatings')) {
        await queryInterface.createTable(
          'exam_seatings',
          {
            id: {
              type: Sequelize.UUID,
              defaultValue: Sequelize.UUIDV4,
              primaryKey: true
            },
            exam_id: { type: Sequelize.UUID, allowNull: false },
            exam_hall_id: { type: Sequelize.UUID, allowNull: false },
            class_id: { type: Sequelize.UUID, allowNull: true },
            section_id: { type: Sequelize.UUID, allowNull: true },
            students_per_bench: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 2 },
            plan_json: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
            status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'active' },
            school_id: { type: Sequelize.UUID, allowNull: false },
            branch_id: { type: Sequelize.UUID, allowNull: true },
            created_by: { type: Sequelize.UUID, allowNull: true },
            updated_by: { type: Sequelize.UUID, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
          },
          { transaction }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('online_exam_attempts');
    await queryInterface.dropTable('online_exam_questions');
    await queryInterface.dropTable('online_exams');
    await queryInterface.dropTable('exam_seatings');
    await queryInterface.dropTable('card_templates');
  }
};
