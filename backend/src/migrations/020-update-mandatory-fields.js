'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Update students table
    await queryInterface.changeColumn('students', 'last_name', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });

    // Update existing null category values to 'general' before making it not null
    await queryInterface.sequelize.query(
      "UPDATE students SET category = 'general' WHERE category IS NULL"
    );

    await queryInterface.changeColumn('students', 'category', {
      type: Sequelize.ENUM('general', 'obc', 'sc', 'st', 'other'),
      allowNull: false,
    });

    // Update parents table - handle existing null values first
    await queryInterface.sequelize.query(
      "UPDATE parents SET guardian_name = 'Not specified' WHERE guardian_name IS NULL"
    );
    await queryInterface.sequelize.query(
      "UPDATE parents SET guardian_phone = 'Not specified' WHERE guardian_phone IS NULL"
    );
    await queryInterface.sequelize.query(
      "UPDATE parents SET guardian_email = 'not.specified@example.com' WHERE guardian_email IS NULL"
    );
    await queryInterface.sequelize.query(
      "UPDATE parents SET guardian_relation = 'guardian' WHERE guardian_relation IS NULL"
    );
    await queryInterface.sequelize.query(
      "UPDATE parents SET address = 'Not specified' WHERE address IS NULL"
    );

    await queryInterface.changeColumn('parents', 'guardian_name', {
      type: Sequelize.STRING(100),
      allowNull: false,
    });

    await queryInterface.changeColumn('parents', 'guardian_phone', {
      type: Sequelize.STRING(20),
      allowNull: false,
    });

    await queryInterface.changeColumn('parents', 'guardian_email', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.changeColumn('parents', 'guardian_relation', {
      type: Sequelize.STRING(50),
      allowNull: false,
    });

    await queryInterface.changeColumn('parents', 'address', {
      type: Sequelize.TEXT,
      allowNull: false,
    });

    // Add new guardian fields
    await queryInterface.addColumn('parents', 'guardian_occupation', {
      type: Sequelize.STRING(100),
      allowNull: false,
      defaultValue: 'Not specified',
    });

    await queryInterface.addColumn('parents', 'guardian_income', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    });

    await queryInterface.addColumn('parents', 'guardian_education', {
      type: Sequelize.STRING(100),
      allowNull: false,
      defaultValue: 'Not specified',
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert students table changes
    await queryInterface.changeColumn('students', 'last_name', {
      type: Sequelize.STRING(50),
      allowNull: false,
    });

    await queryInterface.changeColumn('students', 'category', {
      type: Sequelize.ENUM('general', 'obc', 'sc', 'st', 'other'),
      allowNull: true,
    });

    // Revert parents table changes
    await queryInterface.changeColumn('parents', 'guardian_name', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.changeColumn('parents', 'guardian_phone', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });

    await queryInterface.changeColumn('parents', 'guardian_email', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.changeColumn('parents', 'guardian_relation', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });

    await queryInterface.changeColumn('parents', 'address', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Remove new guardian fields
    await queryInterface.removeColumn('parents', 'guardian_occupation');
    await queryInterface.removeColumn('parents', 'guardian_income');
    await queryInterface.removeColumn('parents', 'guardian_education');
  }
}; 