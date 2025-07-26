'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Update the status enum to include new values
    await queryInterface.changeColumn('schools', 'status', {
      type: Sequelize.ENUM('trial', 'active', 'expired', 'lifetime', 'suspended'),
      allowNull: false,
      defaultValue: 'trial'
    });

    // Update existing schools with 'inactive' status to 'suspended'
    await queryInterface.sequelize.query(`
      UPDATE schools 
      SET status = 'suspended' 
      WHERE status = 'inactive'
    `);

    // Update schools with expired subscriptions to 'expired' status
    await queryInterface.sequelize.query(`
      UPDATE schools 
      SET status = 'expired' 
      WHERE status IN ('trial', 'active') 
      AND subscription_end_date IS NOT NULL 
      AND subscription_end_date < NOW()
    `);

    // Update schools with lifetime plans to 'lifetime' status
    await queryInterface.sequelize.query(`
      UPDATE schools 
      SET status = 'lifetime' 
      WHERE subscription_plan = 'LIFETIME'
    `);
  },

  async down(queryInterface, Sequelize) {
    // Revert back to original enum values
    await queryInterface.changeColumn('schools', 'status', {
      type: Sequelize.ENUM('active', 'inactive', 'suspended', 'trial'),
      allowNull: false,
      defaultValue: 'trial'
    });

    // Revert status changes
    await queryInterface.sequelize.query(`
      UPDATE schools 
      SET status = 'inactive' 
      WHERE status = 'suspended'
    `);

    await queryInterface.sequelize.query(`
      UPDATE schools 
      SET status = 'active' 
      WHERE status IN ('expired', 'lifetime')
    `);
  }
}; 