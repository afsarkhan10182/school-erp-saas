'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Add term_id to exams table
      await queryInterface.addColumn(
        'exams',
        'term_id',
        {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'terms', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        { transaction }
      );

      // 2. Add mark distribution fields to exam_schedules
      await queryInterface.addColumn(
        'exam_schedules',
        'theory_marks',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 0
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'exam_schedules',
        'practical_marks',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 0
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'exam_schedules',
        'viva_marks',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 0
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'exam_schedules',
        'assignment_marks',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 0
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'exam_schedules',
        'total_marks',
        {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'exam_schedules',
        'pass_marks',
        {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        { transaction }
      );

      // 3. Add component marks to exam_results
      await queryInterface.addColumn(
        'exam_results',
        'theory_marks_obtained',
        {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'exam_results',
        'practical_marks_obtained',
        {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'exam_results',
        'viva_marks_obtained',
        {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'exam_results',
        'assignment_marks_obtained',
        {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true
        },
        { transaction }
      );

      // 4. Add publication control to exams
      await queryInterface.addColumn(
        'exams',
        'publish_status',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'exams',
        'result_status',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        { transaction }
      );

      // 5. Add indexes for better performance
      await queryInterface.addIndex('exams', ['term_id'], { transaction });
      await queryInterface.addIndex('exam_schedules', ['total_marks', 'pass_marks'], {
        transaction
      });
      await queryInterface.addIndex(
        'exam_results',
        ['theory_marks_obtained', 'practical_marks_obtained'],
        { transaction }
      );

      await transaction.commit();
      console.log('✅ Phase 1 database changes completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Phase 1 database changes failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Remove indexes
      await queryInterface.removeIndex(
        'exam_results',
        ['theory_marks_obtained', 'practical_marks_obtained'],
        { transaction }
      );
      await queryInterface.removeIndex('exam_schedules', ['total_marks', 'pass_marks'], {
        transaction
      });
      await queryInterface.removeIndex('exams', ['term_id'], { transaction });

      // Remove publication control columns
      await queryInterface.removeColumn('exams', 'result_status', { transaction });
      await queryInterface.removeColumn('exams', 'publish_status', { transaction });

      // Remove component marks from exam_results
      await queryInterface.removeColumn('exam_results', 'assignment_marks_obtained', {
        transaction
      });
      await queryInterface.removeColumn('exam_results', 'viva_marks_obtained', { transaction });
      await queryInterface.removeColumn('exam_results', 'practical_marks_obtained', {
        transaction
      });
      await queryInterface.removeColumn('exam_results', 'theory_marks_obtained', { transaction });

      // Remove mark distribution from exam_schedules
      await queryInterface.removeColumn('exam_schedules', 'pass_marks', { transaction });
      await queryInterface.removeColumn('exam_schedules', 'total_marks', { transaction });
      await queryInterface.removeColumn('exam_schedules', 'assignment_marks', { transaction });
      await queryInterface.removeColumn('exam_schedules', 'viva_marks', { transaction });
      await queryInterface.removeColumn('exam_schedules', 'practical_marks', { transaction });
      await queryInterface.removeColumn('exam_schedules', 'theory_marks', { transaction });

      // Remove term_id from exams
      await queryInterface.removeColumn('exams', 'term_id', { transaction });

      await transaction.commit();
      console.log('✅ Phase 1 database rollback completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Phase 1 database rollback failed:', error);
      throw error;
    }
  }
};
