'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });
    
    // Add index for better query performance
    await queryInterface.addIndex('users', ['deleted_at']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('users', ['deleted_at']);
    await queryInterface.removeColumn('users', 'deleted_at');
  }
};
