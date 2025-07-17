'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add missing columns to parents table
    await queryInterface.addColumn('parents', 'emergency_relation', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });

    // Change emergency_contact from BOOLEAN to STRING(20)
    await queryInterface.changeColumn('parents', 'emergency_contact', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });

    // Add missing columns that exist in the model but not in migration
    await queryInterface.addColumn('parents', 'user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    });

    // Add indexes for new columns
    await queryInterface.addIndex('parents', ['emergency_relation']);
    await queryInterface.addIndex('parents', ['user_id']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('parents', ['emergency_relation']);
    await queryInterface.removeIndex('parents', ['user_id']);

    // Remove columns
    await queryInterface.removeColumn('parents', 'emergency_relation');
    await queryInterface.removeColumn('parents', 'user_id');

    // Revert emergency_contact back to BOOLEAN
    await queryInterface.changeColumn('parents', 'emergency_contact', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  }
}; 