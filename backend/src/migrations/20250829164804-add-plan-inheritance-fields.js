'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('subscription_plans', 'parent_plan_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'subscription_plans',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'If this is a custom plan based on another plan'
    });

    await queryInterface.addColumn('subscription_plans', 'is_custom', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this is a custom plan for specific school'
    });

    await queryInterface.addColumn('subscription_plans', 'school_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'schools',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'School this custom plan is created for'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('subscription_plans', 'school_id');
    await queryInterface.removeColumn('subscription_plans', 'is_custom');
    await queryInterface.removeColumn('subscription_plans', 'parent_plan_id');
  }
};
