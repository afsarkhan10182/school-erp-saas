'use strict';

const INDEX = 'online_exam_attempts_exam_student_unique';

module.exports = {
  async up(queryInterface, Sequelize) {
    const [duplicates] = await queryInterface.sequelize.query(
      'SELECT online_exam_id, student_id FROM online_exam_attempts GROUP BY online_exam_id, student_id HAVING COUNT(*) > 1 LIMIT 1'
    );
    if (duplicates.length) {
      throw new Error('Cannot enforce one online-exam attempt per student: duplicate attempts exist. Review them before rerunning this migration.');
    }
    await queryInterface.changeColumn('online_exam_attempts', 'submitted_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: Sequelize.fn('NOW')
    });
    await queryInterface.addIndex('online_exam_attempts', ['online_exam_id', 'student_id'], {
      name: INDEX,
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    const [inProgress] = await queryInterface.sequelize.query(
      'SELECT id FROM online_exam_attempts WHERE submitted_at IS NULL LIMIT 1'
    );
    if (inProgress.length) {
      throw new Error('Cannot roll back online-exam attempt state while unsubmitted attempts exist. Resolve them before undoing this migration.');
    }
    await queryInterface.removeIndex('online_exam_attempts', INDEX);
    await queryInterface.changeColumn('online_exam_attempts', 'submitted_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    });
  }
};
