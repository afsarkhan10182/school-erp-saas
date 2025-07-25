'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Remove old unique constraints
    await queryInterface.removeIndex('sections', 'sections_class_id_name_unique');
    await queryInterface.removeIndex('sections', 'sections_stream_id_name_unique');
    
    // Add new unique constraint that includes class_id, branch_id, and stream_id
    // Note: The actual DB constraint uses COALESCE(stream_id, '00000000-0000-0000-0000-000000000000') to handle NULL values
    // This is handled manually in the database due to Sequelize limitations with COALESCE in indexes
    await queryInterface.addIndex('sections', ['class_id', 'branch_id', 'stream_id', 'name'], {
      unique: true,
      name: 'sections_class_branch_stream_name_unique'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove new unique constraint
    await queryInterface.removeIndex('sections', 'sections_class_branch_stream_name_unique');
    
    // Restore old unique constraints
    await queryInterface.addIndex('sections', ['class_id', 'name'], {
      unique: true,
      where: { stream_id: null },
      name: 'sections_class_id_name_unique'
    });
    
    await queryInterface.addIndex('sections', ['stream_id', 'name'], {
      unique: true,
      where: { stream_id: { [Sequelize.Op.ne]: null } },
      name: 'sections_stream_id_name_unique'
    });
  }
};
