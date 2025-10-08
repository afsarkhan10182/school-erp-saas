'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove unnecessary columns from exam_halls table
    await queryInterface.removeColumn('exam_halls', 'code');
    await queryInterface.removeColumn('exam_halls', 'floor');
    await queryInterface.removeColumn('exam_halls', 'building');
    await queryInterface.removeColumn('exam_halls', 'facilities');
    await queryInterface.removeColumn('exam_halls', 'description');

    // Drop the old unique index on code and branch_id
    await queryInterface.removeIndex('exam_halls', 'idx_exam_halls_code_branch');

    // Add new unique index on name and branch_id
    await queryInterface.addIndex('exam_halls', {
      fields: ['name', 'branch_id'],
      unique: true,
      name: 'idx_exam_halls_name_branch'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Add back the removed columns
    await queryInterface.addColumn('exam_halls', 'code', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'HALL-001'
    });

    await queryInterface.addColumn('exam_halls', 'floor', {
      type: Sequelize.STRING(20),
      allowNull: true
    });

    await queryInterface.addColumn('exam_halls', 'building', {
      type: Sequelize.STRING(50),
      allowNull: true
    });

    await queryInterface.addColumn('exam_halls', 'facilities', {
      type: Sequelize.JSON,
      allowNull: true
    });

    await queryInterface.addColumn('exam_halls', 'description', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Remove the name-based unique index
    await queryInterface.removeIndex('exam_halls', 'idx_exam_halls_name_branch');

    // Add back the code-based unique index
    await queryInterface.addIndex('exam_halls', {
      fields: ['code', 'branch_id'],
      unique: true,
      name: 'idx_exam_halls_code_branch'
    });
  }
};
