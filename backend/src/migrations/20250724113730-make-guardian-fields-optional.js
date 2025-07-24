'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Make guardian fields optional in parents table
    await queryInterface.changeColumn('parents', 'guardian_email', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.changeColumn('parents', 'guardian_occupation', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.changeColumn('parents', 'guardian_income', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });

    await queryInterface.changeColumn('parents', 'guardian_education', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    // Revert guardian fields to required
    await queryInterface.changeColumn('parents', 'guardian_email', {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Guardian email is required' },
      },
    });

    await queryInterface.changeColumn('parents', 'guardian_occupation', {
      type: Sequelize.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Guardian occupation is required' },
      },
    });

    await queryInterface.changeColumn('parents', 'guardian_income', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Guardian income is required' },
      },
    });

    await queryInterface.changeColumn('parents', 'guardian_education', {
      type: Sequelize.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Guardian education is required' },
      },
    });
  }
};
