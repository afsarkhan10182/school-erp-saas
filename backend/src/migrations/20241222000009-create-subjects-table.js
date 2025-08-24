'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('subjects', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      code: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      category: {
        type: Sequelize.ENUM('core', 'elective', 'extra_curricular', 'language', 'science', 'arts', 'commerce'),
        allowNull: false,
        defaultValue: 'core',
      },
      credit_hours: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 1,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      class_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'classes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
        onDelete: 'SET NULL'
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
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes
    await queryInterface.addIndex('subjects', ['school_id']);
    await queryInterface.addIndex('subjects', ['branch_id']);
    await queryInterface.addIndex('subjects', ['class_id']);
    await queryInterface.addIndex('subjects', ['is_active']);
    await queryInterface.addIndex('subjects', ['category']);
    await queryInterface.addIndex('subjects', ['school_id', 'branch_id', 'code'], {
      unique: true,
      name: 'subjects_school_branch_code_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('subjects');
  }
};
