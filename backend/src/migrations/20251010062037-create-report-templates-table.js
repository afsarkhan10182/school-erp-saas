'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('report_templates', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      report_type: {
        type: Sequelize.ENUM(
          'class_wise',
          'subject_wise',
          'student_wise',
          'position_wise',
          'summary',
          'detailed'
        ),
        allowNull: false
      },
      template_content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      css_styles: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      header_template: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      footer_template: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      config: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      school_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'schools', key: 'id' }
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
    await queryInterface.addIndex('report_templates', ['code'], { unique: true });
    await queryInterface.addIndex('report_templates', ['report_type']);
    await queryInterface.addIndex('report_templates', ['school_id']);
    await queryInterface.addIndex('report_templates', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('report_templates');
  }
};
