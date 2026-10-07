'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('alumnis', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      school_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'schools', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      branch_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'branches', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      student_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'students', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      name: { type: Sequelize.STRING, allowNull: false },
      passing_year: { type: Sequelize.STRING },
      current_profession: { type: Sequelize.STRING },
      email: { type: Sequelize.STRING },
      phone: { type: Sequelize.STRING },
      address: { type: Sequelize.TEXT },
      photo: { type: Sequelize.STRING },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.createTable('alumni_events', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      school_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'schools', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      branch_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'branches', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      title: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },
      event_date: { type: Sequelize.DATE, allowNull: false },
      venue: { type: Sequelize.STRING },
      status: { type: Sequelize.STRING, defaultValue: 'upcoming' }, // 'upcoming', 'completed'
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('alumni_events');
    await queryInterface.dropTable('alumnis');
  }
};
