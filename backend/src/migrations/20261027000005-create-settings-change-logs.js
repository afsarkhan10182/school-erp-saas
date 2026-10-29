'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('settings_change_logs', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false, defaultValue: Sequelize.UUIDV4 },
      school_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'schools', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      actor_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      undo_of_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'settings_change_logs', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      category: { type: Sequelize.STRING(80), allowNull: false, defaultValue: 'system_preferences' },
      changes: { type: Sequelize.JSONB, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
    await queryInterface.addIndex('settings_change_logs', ['school_id', 'created_at']);
    await queryInterface.addIndex('settings_change_logs', ['undo_of_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('settings_change_logs');
  }
};
