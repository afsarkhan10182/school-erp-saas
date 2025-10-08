'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Make branch_id nullable (optional)
    await queryInterface.changeColumn('exam_halls', 'branch_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'branches', key: 'id' }
    });

    // Drop the old unique index on name and branch_id
    await queryInterface.removeIndex('exam_halls', 'idx_exam_halls_name_branch');

    // Add new unique index on name and school_id
    await queryInterface.addIndex('exam_halls', {
      fields: ['name', 'school_id'],
      unique: true,
      name: 'idx_exam_halls_name_school'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Make branch_id required again
    await queryInterface.changeColumn('exam_halls', 'branch_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'branches', key: 'id' }
    });

    // Remove the school-based unique index
    await queryInterface.removeIndex('exam_halls', 'idx_exam_halls_name_school');

    // Add back the branch-based unique index
    await queryInterface.addIndex('exam_halls', {
      fields: ['name', 'branch_id'],
      unique: true,
      name: 'idx_exam_halls_name_branch'
    });
  }
};
