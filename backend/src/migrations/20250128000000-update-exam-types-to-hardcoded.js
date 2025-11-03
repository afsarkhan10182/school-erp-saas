'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // First, add the new type_id column
    // Using SMALLINT instead of TINYINT for PostgreSQL compatibility
    await queryInterface.addColumn('exams', 'type_id', {
      type: Sequelize.SMALLINT,
      allowNull: true, // Allow null initially for data migration
      comment: '1=marks,2=grade,3=both'
    });

    // Migrate existing data from exam_type_id to type_id
    // This is a simplified migration - in production you'd want more sophisticated mapping
    await queryInterface.sequelize.query(`
      UPDATE exams 
      SET type_id = 1 
      WHERE exam_type_id IS NOT NULL
    `);

    // Make type_id NOT NULL after data migration
    await queryInterface.changeColumn('exams', 'type_id', {
      type: Sequelize.SMALLINT,
      allowNull: false,
      comment: '1=marks,2=grade,3=both'
    });

    // Remove the old exam_type_id column
    await queryInterface.removeColumn('exams', 'exam_type_id');

    // Add index for the new type_id column
    await queryInterface.addIndex('exams', ['type_id'], {
      name: 'idx_exams_type_id'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove the new type_id column
    await queryInterface.removeColumn('exams', 'type_id');

    // Add back the old exam_type_id column (as UUID)
    await queryInterface.addColumn('exams', 'exam_type_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'exam_types', key: 'id' }
    });

    // Add back the old index
    await queryInterface.addIndex('exams', ['exam_type_id'], {
      name: 'idx_exams_exam_type_id'
    });
  }
};
