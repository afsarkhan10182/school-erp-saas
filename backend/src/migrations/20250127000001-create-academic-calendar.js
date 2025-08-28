'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('academic_calendars', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      day_type: {
        type: Sequelize.ENUM('working', 'holiday', 'weekend', 'exam', 'event'),
        allowNull: false,
        defaultValue: 'working',
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
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
    await queryInterface.addIndex('academic_calendars', ['school_id']);
    await queryInterface.addIndex('academic_calendars', ['branch_id']);
    await queryInterface.addIndex('academic_calendars', ['academic_year']);
    await queryInterface.addIndex('academic_calendars', ['date']);
    await queryInterface.addIndex('academic_calendars', ['day_type']);
    await queryInterface.addIndex('academic_calendars', ['school_id', 'branch_id', 'date'], {
      unique: true,
      name: 'academic_calendars_school_branch_date_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('academic_calendars');
  }
};
