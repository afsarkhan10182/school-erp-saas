'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('fee_invoices', 'stream_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'streams',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('fee_invoices', 'stream_id');
  }
};