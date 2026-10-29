'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('audit_events', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false, defaultValue: Sequelize.UUIDV4 },
      school_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'schools', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'branches', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      actor_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      actor_role: { type: Sequelize.STRING(40), allowNull: true },
      action: { type: Sequelize.STRING(24), allowNull: false },
      entity_name: { type: Sequelize.STRING(120), allowNull: false },
      record_id: { type: Sequelize.STRING(128), allowNull: true },
      changes: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      request_method: { type: Sequelize.STRING(10), allowNull: true },
      request_path: { type: Sequelize.STRING(512), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
    await queryInterface.addIndex('audit_events', ['school_id', 'created_at']);
    await queryInterface.addIndex('audit_events', ['branch_id', 'created_at']);
    await queryInterface.addIndex('audit_events', ['actor_id', 'created_at']);
    await queryInterface.addIndex('audit_events', ['entity_name', 'created_at']);
    await queryInterface.addIndex('audit_events', ['action', 'created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('audit_events');
  }
};
