'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('mark_distributions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('theory_only', 'practical_only', 'theory_practical', 'comprehensive'),
        allowNull: false,
        defaultValue: 'theory_practical'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      theory_marks: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      practical_marks: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      viva_marks: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      assignment_marks: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      total_marks: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      pass_marks: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 35
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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
        }
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
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
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Add indexes
    await queryInterface.addIndex('mark_distributions', ['school_id']);
    await queryInterface.addIndex('mark_distributions', ['branch_id']);
    await queryInterface.addIndex('mark_distributions', ['type']);
    await queryInterface.addIndex('mark_distributions', ['is_active']);
    await queryInterface.addIndex('mark_distributions', ['school_id', 'branch_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('mark_distributions');
  }
};
