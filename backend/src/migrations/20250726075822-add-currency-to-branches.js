'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('branches', 'currency', {
      type: Sequelize.STRING(3),
      allowNull: false,
      defaultValue: 'INR'
    });

    await queryInterface.addColumn('branches', 'currency_symbol', {
      type: Sequelize.STRING(5),
      allowNull: false,
      defaultValue: '₹'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('branches', 'currency');
    await queryInterface.removeColumn('branches', 'currency_symbol');
  }
};
