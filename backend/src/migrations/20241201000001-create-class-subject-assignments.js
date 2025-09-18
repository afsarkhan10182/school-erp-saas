'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('class_subject_assignments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      class_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'classes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Class this assignment belongs to'
      },
      subject_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'subjects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Subject assigned to the class'
      },
      section_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'sections',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Optional section for the assignment'
      },
      stream_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'streams',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Optional stream for the assignment'
      },
      academic_year: {
        type: Sequelize.STRING(10),
        allowNull: false,
        comment: 'Academic year for this assignment'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether this assignment is active'
      },
      school_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'schools',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'branches',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    await queryInterface.addIndex('class_subject_assignments', ['class_id']);
    await queryInterface.addIndex('class_subject_assignments', ['subject_id']);
    await queryInterface.addIndex('class_subject_assignments', ['section_id']);
    await queryInterface.addIndex('class_subject_assignments', ['stream_id']);
    await queryInterface.addIndex('class_subject_assignments', ['academic_year']);
    await queryInterface.addIndex('class_subject_assignments', ['school_id']);
    await queryInterface.addIndex('class_subject_assignments', ['branch_id']);
    await queryInterface.addIndex('class_subject_assignments', ['is_active']);

    // Add unique constraint
    await queryInterface.addIndex('class_subject_assignments', {
      fields: ['class_id', 'subject_id', 'section_id', 'stream_id', 'academic_year'],
      unique: true,
      name: 'unique_class_subject_assignment'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('class_subject_assignments');
  }
};
