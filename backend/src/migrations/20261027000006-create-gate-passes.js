'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const exists = await queryInterface.describeTable('gate_passes').catch(() => null);
    if (exists) return;
    await queryInterface.createTable('gate_passes', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      pass_no: { type: Sequelize.STRING(32), allowNull: false, unique: true },
      school_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'schools', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'
      },
      branch_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'branches', key: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE'
      },
      student_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'students', key: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE'
      },
      reason: { type: Sequelize.STRING(40), allowNull: false },
      note: { type: Sequelize.STRING(500), allowNull: true },
      leaving_at: { type: Sequelize.DATE, allowNull: false },
      expected_return_at: { type: Sequelize.DATE, allowNull: true },
      collector_name: { type: Sequelize.STRING(120), allowNull: false },
      collector_relation: { type: Sequelize.STRING(60), allowNull: false },
      collector_phone: { type: Sequelize.STRING(24), allowNull: false },
      collector_id_type: { type: Sequelize.STRING(40), allowNull: false },
      collector_id_last4: { type: Sequelize.STRING(4), allowNull: false },
      gate_name: { type: Sequelize.STRING(80), allowNull: false, defaultValue: 'Main Gate' },
      internal_notes: { type: Sequelize.STRING(500), allowNull: true },
      status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'pending' },
      created_by: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE'
      },
      approved_by: {
        type: Sequelize.UUID, allowNull: true,
        references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE'
      },
      approved_at: { type: Sequelize.DATE, allowNull: true },
      decided_by: {
        type: Sequelize.UUID, allowNull: true,
        references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE'
      },
      decision_note: { type: Sequelize.STRING(500), allowNull: true },
      out_by: {
        type: Sequelize.UUID, allowNull: true,
        references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE'
      },
      actual_out_at: { type: Sequelize.DATE, allowNull: true },
      returned_by: {
        type: Sequelize.UUID, allowNull: true,
        references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE'
      },
      returned_at: { type: Sequelize.DATE, allowNull: true },
      cancelled_by: {
        type: Sequelize.UUID, allowNull: true,
        references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE'
      },
      cancelled_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
    await queryInterface.addIndex('gate_passes', ['school_id', 'branch_id', 'status']);
    await queryInterface.addIndex('gate_passes', ['student_id', 'status']);
    await queryInterface.addIndex('gate_passes', ['leaving_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('gate_passes');
  }
};
