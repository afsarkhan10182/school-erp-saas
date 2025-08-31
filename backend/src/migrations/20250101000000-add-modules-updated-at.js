'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('schools', 'modules_updated_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
      comment: 'Timestamp when modules were last updated by super admin'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('schools', 'modules_updated_at');
  }
};
