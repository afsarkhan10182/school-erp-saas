'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add 'deleted' to the student status enum
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_students_status ADD VALUE IF NOT EXISTS 'deleted';
    `);
  },

  async down (queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing enum values easily
    // This would require recreating the enum type
    console.log('Cannot easily remove enum value. Manual intervention required if needed.');
  }
};
