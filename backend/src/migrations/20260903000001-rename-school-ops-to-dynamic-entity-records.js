'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const legacyExists = await queryInterface.describeTable('school_ops_records').catch(() => null);
    if (legacyExists) {
      await queryInterface.renameTable('school_ops_records', 'dynamic_entity_records');
    }
  },

  async down(queryInterface, Sequelize) {
    const currentExists = await queryInterface.describeTable('dynamic_entity_records').catch(() => null);
    if (currentExists) {
      await queryInterface.renameTable('dynamic_entity_records', 'school_ops_records');
    }
  }
};
