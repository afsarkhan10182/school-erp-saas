'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('📝 Populating updated_at fields for existing records...');

      // Update exam_halls table
      await queryInterface.sequelize.query(
        `UPDATE exam_halls SET updated_at = created_at WHERE updated_at IS NULL`,
        { transaction }
      );
      console.log('✅ Updated exam_halls updated_at fields');

      // Update terms table
      await queryInterface.sequelize.query(
        `UPDATE terms SET updated_at = created_at WHERE updated_at IS NULL`,
        { transaction }
      );
      console.log('✅ Updated terms updated_at fields');

      // Update mark_distributions table
      await queryInterface.sequelize.query(
        `UPDATE mark_distributions SET updated_at = created_at WHERE updated_at IS NULL`,
        { transaction }
      );
      console.log('✅ Updated mark_distributions updated_at fields');

      // Update grading_systems table
      await queryInterface.sequelize.query(
        `UPDATE grading_systems SET updated_at = created_at WHERE updated_at IS NULL`,
        { transaction }
      );
      console.log('✅ Updated grading_systems updated_at fields');

      // Update exams table
      await queryInterface.sequelize.query(
        `UPDATE exams SET updated_at = created_at WHERE updated_at IS NULL`,
        { transaction }
      );
      console.log('✅ Updated exams updated_at fields');

      await transaction.commit();
      console.log('✅ Migration completed: Populated updated_at fields for existing records');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // No need to rollback this migration as it only populates missing data
    console.log('📝 No rollback needed for updated_at population migration');
  }
};
