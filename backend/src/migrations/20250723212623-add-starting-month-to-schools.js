'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('schools', 'starting_month', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 6, // June (default for most Indian schools)
      comment: 'Month when academic year starts (1=January, 6=June, etc.)'
    });

    await queryInterface.addColumn('schools', 'academic_year_start', {
      type: Sequelize.ENUM('calendar', 'academic'),
      allowNull: false,
      defaultValue: 'academic',
      comment: 'calendar: Jan-Dec, academic: June-May or custom starting month'
    });

    // Add validation constraint
    await queryInterface.addConstraint('schools', {
      fields: ['starting_month'],
      type: 'check',
      name: 'check_starting_month_range',
      where: {
        starting_month: {
          [Sequelize.Op.between]: [1, 12]
        }
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('schools', 'check_starting_month_range');
    await queryInterface.removeColumn('schools', 'academic_year_start');
    await queryInterface.removeColumn('schools', 'starting_month');
  }
};
