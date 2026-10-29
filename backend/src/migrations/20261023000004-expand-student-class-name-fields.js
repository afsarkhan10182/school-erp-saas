'use strict';

const fields = ['admission_class', 'current_class'];

module.exports = {
  async up(queryInterface, Sequelize) {
    for (const field of fields) {
      await queryInterface.changeColumn('students', field, {
        type: Sequelize.STRING(50),
        allowNull: false
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const [rows] = await queryInterface.sequelize.query(`
      SELECT COUNT(*)::int AS count
      FROM students
      WHERE char_length(admission_class) > 20
         OR char_length(current_class) > 20
    `);
    if (Number(rows[0]?.count) > 0) {
      throw new Error('Cannot shrink student class-name fields while values exceed 20 characters');
    }

    for (const field of fields) {
      await queryInterface.changeColumn('students', field, {
        type: Sequelize.STRING(20),
        allowNull: false
      });
    }
  }
};
