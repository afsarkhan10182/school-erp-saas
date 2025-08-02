'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('fee_structures', 'class_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'classes',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Reference to the Class model for proper class code lookup'
    });

    // Add index for better performance
    await queryInterface.addIndex('fee_structures', ['class_id'], {
      name: 'idx_fee_structures_class_id'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('fee_structures', 'idx_fee_structures_class_id');
    await queryInterface.removeColumn('fee_structures', 'class_id');
  }
}; 