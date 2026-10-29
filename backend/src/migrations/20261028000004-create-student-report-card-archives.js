'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('student_report_card_archives', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false, defaultValue: Sequelize.UUIDV4 },
      student_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'students', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      exam_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'exams', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      setup_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'report_card_setups', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
      title: { type: Sequelize.STRING(255), allowNull: false },
      academic_year: { type: Sequelize.STRING(20), allowNull: true },
      file_name: { type: Sequelize.STRING(80), allowNull: false, unique: true },
      storage_year: { type: Sequelize.INTEGER, allowNull: false },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
    await queryInterface.addConstraint('student_report_card_archives', {
      fields: ['exam_id', 'setup_id'],
      type: 'check',
      name: 'student_report_card_archive_source_check',
      where: Sequelize.literal('(exam_id IS NOT NULL) <> (setup_id IS NOT NULL)')
    });
    await queryInterface.addIndex('student_report_card_archives', ['school_id', 'branch_id', 'student_id', 'created_at'], {
      name: 'idx_student_report_card_archives_student'
    });
  },

  async down(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      'SELECT COUNT(*)::int AS count FROM student_report_card_archives'
    );
    if (rows[0].count > 0) {
      throw new Error('Cannot remove student report-card archives while saved cards exist');
    }
    await queryInterface.dropTable('student_report_card_archives');
  }
};
