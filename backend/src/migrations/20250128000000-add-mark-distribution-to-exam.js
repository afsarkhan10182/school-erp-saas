'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('exams', 'mark_distribution_ids', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of mark distribution IDs associated with this exam'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('exams', 'mark_distribution_ids');
  }
};
