'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Update type_id column to SMALLINT (PostgreSQL equivalent of TINYINT)
    await queryInterface.changeColumn('exams', 'type_id', {
      type: Sequelize.SMALLINT,
      allowNull: false,
      comment: '1=marks,2=grade,3=both'
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert back to INTEGER
    await queryInterface.changeColumn('exams', 'type_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: 'Hardcoded exam type: 1=Marks, 2=Grade, 3=Marks & Grade'
    });
  }
};
