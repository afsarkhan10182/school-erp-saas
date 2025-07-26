'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('fee_structures', 'stream_ids', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of stream IDs that this fee structure applies to (for classes 11 & 12)'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('fee_structures', 'stream_ids');
  }
};
