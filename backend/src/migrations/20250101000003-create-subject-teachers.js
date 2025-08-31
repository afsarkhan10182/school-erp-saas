'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create subject_teachers table
    await queryInterface.createTable('subject_teachers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      subject_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'subjects', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      teacher_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      class_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'classes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      section_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'sections', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      is_primary: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Primary teacher for this subject-class combination'
      },
      academic_year: {
        type: Sequelize.STRING(10),
        allowNull: false,
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

    // Add indexes
    await queryInterface.addIndex('subject_teachers', ['subject_id']);
    await queryInterface.addIndex('subject_teachers', ['teacher_id']);
    await queryInterface.addIndex('subject_teachers', ['class_id']);
    await queryInterface.addIndex('subject_teachers', ['section_id']);
    await queryInterface.addIndex('subject_teachers', ['academic_year']);
    await queryInterface.addIndex('subject_teachers', ['school_id']);
    await queryInterface.addIndex('subject_teachers', ['branch_id']);
    await queryInterface.addIndex('subject_teachers', ['is_primary']);

    // Add unique constraint
    await queryInterface.addIndex('subject_teachers', 
      ['subject_id', 'teacher_id', 'class_id', 'section_id', 'academic_year'], 
      {
        unique: true,
        name: 'unique_subject_teacher_assignment'
      }
    );
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('subject_teachers', 'unique_subject_teacher_assignment');
    await queryInterface.removeIndex('subject_teachers', ['is_primary']);
    await queryInterface.removeIndex('subject_teachers', ['branch_id']);
    await queryInterface.removeIndex('subject_teachers', ['school_id']);
    await queryInterface.removeIndex('subject_teachers', ['academic_year']);
    await queryInterface.removeIndex('subject_teachers', ['section_id']);
    await queryInterface.removeIndex('subject_teachers', ['class_id']);
    await queryInterface.removeIndex('subject_teachers', ['teacher_id']);
    await queryInterface.removeIndex('subject_teachers', ['subject_id']);

    // Drop table
    await queryInterface.dropTable('subject_teachers');
  }
};
