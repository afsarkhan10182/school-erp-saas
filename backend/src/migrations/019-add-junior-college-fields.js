'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add aadhaar_number if it doesn't exist (it might already be there)
    try {
      await queryInterface.addColumn('students', 'aadhaar_number', {
        type: Sequelize.STRING(12),
        allowNull: true,
        validate: {
          len: { args: [12, 12], msg: 'Aadhaar number must be exactly 12 digits' },
          isNumeric: { msg: 'Aadhaar number must contain only digits' },
        },
      });
    } catch (error) {
      // Column might already exist, continue
      console.log('aadhaar_number column might already exist');
    }

    // Add stream selection
    await queryInterface.addColumn('students', 'admission_sought_in', {
      type: Sequelize.ENUM('arts', 'commerce', 'science'),
      allowNull: true
    });

    // Add previous exam details
    await queryInterface.addColumn('students', 'previous_exam_details', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: []
    });

    // Add index for stream selection
    await queryInterface.addIndex('students', ['admission_sought_in']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('students', ['admission_sought_in']);
    await queryInterface.removeColumn('students', 'previous_exam_details');
    await queryInterface.removeColumn('students', 'admission_sought_in');
    // Note: Not removing aadhaar_number as it might be used elsewhere
  }
}; 