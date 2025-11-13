'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add teacher_comment and principal_comment columns to exam_positions table
    await queryInterface.addColumn('exam_positions', 'teacher_comment', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Teacher comment on student performance'
    });

    await queryInterface.addColumn('exam_positions', 'principal_comment', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Principal comment on student performance'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the columns if migration is rolled back
    await queryInterface.removeColumn('exam_positions', 'teacher_comment');
    await queryInterface.removeColumn('exam_positions', 'principal_comment');
  }
};

