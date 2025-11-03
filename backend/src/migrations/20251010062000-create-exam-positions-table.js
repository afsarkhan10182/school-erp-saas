'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('exam_positions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      exam_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'exams', key: 'id' },
        onDelete: 'CASCADE'
      },
      student_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'students', key: 'id' },
        onDelete: 'CASCADE'
      },
      position: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      total_marks: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false
      },
      grade: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      class_position: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      section_position: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      subject_position: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      is_passed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      school_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'schools', key: 'id' }
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'branches', key: 'id' }
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' }
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' }
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('exam_positions', ['exam_id']);
    await queryInterface.addIndex('exam_positions', ['student_id']);
    await queryInterface.addIndex('exam_positions', ['position']);
    await queryInterface.addIndex('exam_positions', ['school_id']);
    await queryInterface.addIndex('exam_positions', ['branch_id']);
    await queryInterface.addIndex('exam_positions', ['exam_id', 'student_id'], { unique: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('exam_positions');
  }
};
