'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('account_categories', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      school_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'schools', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      branch_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'branches', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      name: { type: Sequelize.STRING, allowNull: false },
      type: { type: Sequelize.STRING, allowNull: false }, // 'income', 'expense'
      description: { type: Sequelize.TEXT },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.createTable('school_transactions', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      school_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'schools', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      branch_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'branches', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      category_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'account_categories', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      name: { type: Sequelize.STRING, allowNull: false },
      type: { type: Sequelize.STRING, allowNull: false }, // 'income', 'expense'
      amount: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      reference_number: { type: Sequelize.STRING },
      payment_method: { type: Sequelize.STRING },
      description: { type: Sequelize.TEXT },
      attachment: { type: Sequelize.STRING },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('school_transactions');
    await queryInterface.dropTable('account_categories');
  }
};
