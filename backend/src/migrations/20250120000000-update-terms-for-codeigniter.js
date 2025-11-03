'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Update terms table to make fields optional for
    await queryInterface.changeColumn('terms', 'code', {
      type: Sequelize.STRING(20),
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.changeColumn('terms', 'start_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.changeColumn('terms', 'end_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.changeColumn('terms', 'academic_year', {
      type: Sequelize.STRING(10),
      allowNull: true,
      defaultValue: null
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert changes if needed
    await queryInterface.changeColumn('terms', 'code', {
      type: Sequelize.STRING(20),
      allowNull: false
    });

    await queryInterface.changeColumn('terms', 'start_date', {
      type: Sequelize.DATEONLY,
      allowNull: false
    });

    await queryInterface.changeColumn('terms', 'end_date', {
      type: Sequelize.DATEONLY,
      allowNull: false
    });

    await queryInterface.changeColumn('terms', 'academic_year', {
      type: Sequelize.STRING(10),
      allowNull: false
    });
  }
};
