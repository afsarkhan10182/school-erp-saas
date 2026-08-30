'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const exists = await queryInterface.describeTable('fee_fines').catch(() => null);
    if (exists) return;

    await queryInterface.createTable('fee_fines', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: { type: Sequelize.STRING(100), allowNull: false },
      fine_type: {
        type: Sequelize.ENUM('fixed', 'percentage'),
        allowNull: false,
        defaultValue: 'fixed'
      },
      amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      days_after_due: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      school_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'schools', key: 'id' }
      },
      branch_id: { type: Sequelize.UUID, allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('fee_fines');
  }
};
