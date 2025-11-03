'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table already exists
    const tableExists = await queryInterface
      .describeTable('certificate_templates')
      .catch(() => null);
    if (tableExists) {
      console.log('Certificate templates table already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('certificate_templates', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      user_type: {
        type: Sequelize.ENUM('student', 'employee'),
        allowNull: false
      },
      page_layout: {
        type: Sequelize.ENUM('portrait', 'landscape'),
        allowNull: false,
        defaultValue: 'portrait'
      },
      qr_code_text: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      user_photo_style: {
        type: Sequelize.ENUM('square', 'round'),
        allowNull: false,
        defaultValue: 'square'
      },
      photo_size: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 100
      },
      top_space: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 20
      },
      bottom_space: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 20
      },
      left_space: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 20
      },
      right_space: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 20
      },
      signature_image: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      logo_image: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      background_image: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'branches',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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

    // Add indexes (with error handling for existing indexes)
    try {
      await queryInterface.addIndex('certificate_templates', ['branch_id']);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }

    try {
      await queryInterface.addIndex('certificate_templates', ['user_type']);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }

    try {
      await queryInterface.addIndex('certificate_templates', ['is_active']);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }

    try {
      await queryInterface.addIndex('certificate_templates', ['created_by']);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('certificate_templates');
  }
};
