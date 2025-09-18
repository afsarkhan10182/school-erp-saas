'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('class_teachers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      class_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'classes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      section_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'sections', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      teacher_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      academic_year: {
        type: Sequelize.STRING(10),
        allowNull: false
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
        onDelete: 'CASCADE'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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
      }
    });

    // Add indexes
    await queryInterface.addIndex('class_teachers', ['class_id']);
    await queryInterface.addIndex('class_teachers', ['section_id']);
    await queryInterface.addIndex('class_teachers', ['teacher_id']);
    await queryInterface.addIndex('class_teachers', ['academic_year']);
    await queryInterface.addIndex('class_teachers', ['school_id']);
    await queryInterface.addIndex('class_teachers', ['branch_id']);
    await queryInterface.addIndex('class_teachers', ['is_active']);

    // Add unique constraint
    await queryInterface.addIndex(
      'class_teachers',
      ['class_id', 'section_id', 'academic_year', 'school_id', 'branch_id'],
      {
        unique: true,
        name: 'unique_class_teacher'
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('class_teachers');
  }
};
