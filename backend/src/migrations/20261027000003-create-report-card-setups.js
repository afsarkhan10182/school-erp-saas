'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'report_card_setups',
        {
          id: { type: Sequelize.UUID, primaryKey: true, allowNull: false, defaultValue: Sequelize.UUIDV4 },
          name: { type: Sequelize.STRING(255), allowNull: false },
          template_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'report_templates', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT'
          },
          orientation: {
            type: Sequelize.ENUM('portrait', 'landscape'),
            allowNull: false,
            defaultValue: 'portrait'
          },
          is_published: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
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
        },
        { transaction }
      );
      await queryInterface.createTable(
        'report_card_setup_exams',
        {
          id: { type: Sequelize.UUID, primaryKey: true, allowNull: false, defaultValue: Sequelize.UUIDV4 },
          setup_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'report_card_setups', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          exam_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'exams', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT'
          },
          weightage: { type: Sequelize.DECIMAL(5, 2), allowNull: false },
          sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
        },
        { transaction }
      );
      await queryInterface.addConstraint('report_card_setup_exams', {
        fields: ['weightage'],
        type: 'check',
        name: 'report_card_setup_exam_weightage_range',
        where: Sequelize.literal('weightage > 0 AND weightage <= 100'),
        transaction
      });
      await queryInterface.addIndex('report_card_setups', ['school_id', 'branch_id'], { transaction });
      await queryInterface.addIndex('report_card_setups', ['template_id'], { transaction });
      await queryInterface.addIndex('report_card_setups', ['is_published'], { transaction });
      await queryInterface.addIndex('report_card_setups', ['school_id', 'branch_id', 'name'], {
        unique: true,
        name: 'unique_report_card_setup_name_per_branch',
        transaction
      });
      await queryInterface.addIndex('report_card_setup_exams', ['setup_id', 'sort_order'], { transaction });
      await queryInterface.addIndex('report_card_setup_exams', ['exam_id'], { transaction });
      await queryInterface.addIndex('report_card_setup_exams', ['setup_id', 'exam_id'], {
        unique: true,
        name: 'unique_exam_per_report_card_setup',
        transaction
      });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      'SELECT COUNT(*)::int AS count FROM report_card_setups'
    );
    if (rows[0].count > 0) {
      throw new Error('Cannot remove report-card setup records while configurations exist');
    }
    await queryInterface.dropTable('report_card_setup_exams');
    await queryInterface.dropTable('report_card_setups');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_report_card_setups_orientation"');
  }
};
