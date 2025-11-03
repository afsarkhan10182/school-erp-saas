'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove the exam_types table since we're using hardcoded exam types
    // This follows the CodeIgniter pattern where exam types are system constants

    // First, check if the table exists
    const tableExists = await queryInterface
      .showAllTables()
      .then(tables => tables.includes('exam_types'));

    if (tableExists) {
      // Drop the exam_types table
      await queryInterface.dropTable('exam_types');
      console.log('✅ Removed exam_types table - using hardcoded exam types instead');
    } else {
      console.log('ℹ️  exam_types table does not exist - already using hardcoded types');
    }
  },

  async down(queryInterface, Sequelize) {
    // Recreate the exam_types table (if needed for rollback)
    await queryInterface.createTable('exam_types', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      weightage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 100.0
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
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
  }
};
