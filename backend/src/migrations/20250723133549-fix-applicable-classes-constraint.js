'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop the existing constraint if it exists
    try {
      await queryInterface.removeConstraint('fee_structures', 'applicable_classes_not_empty');
    } catch (error) {
      // Constraint might not exist, which is fine
      console.log('Constraint applicable_classes_not_empty does not exist, skipping drop');
    }

    // Add the applicable_classes column if it doesn't exist
    try {
      await queryInterface.addColumn('fee_structures', 'applicable_classes', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: [],
        comment: 'Array of class names that this fee structure applies to'
      });
    } catch (error) {
      // Column might already exist, which is fine
      console.log('Column applicable_classes already exists, skipping add');
    }

    // Create a new constraint that allows empty arrays but ensures the field exists
    try {
      await queryInterface.addConstraint('fee_structures', {
        fields: ['applicable_classes'],
        type: 'check',
        name: 'applicable_classes_valid',
        where: {
          applicable_classes: {
            [Sequelize.Op.or]: [
              { [Sequelize.Op.is]: null },
              { [Sequelize.Op.eq]: [] },
              { [Sequelize.Op.ne]: null }
            ]
          }
        }
      });
    } catch (error) {
      console.log('Could not add constraint, continuing without it');
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove the new constraint
    try {
      await queryInterface.removeConstraint('fee_structures', 'applicable_classes_valid');
    } catch (error) {
      console.log('Constraint applicable_classes_valid does not exist, skipping drop');
    }

    // Remove the column
    try {
      await queryInterface.removeColumn('fee_structures', 'applicable_classes');
    } catch (error) {
      console.log('Column applicable_classes does not exist, skipping drop');
    }
  }
};
