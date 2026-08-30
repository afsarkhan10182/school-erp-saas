'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const exists = await queryInterface.describeTable('student_promotions').catch(() => null);
    if (exists) return;

    await queryInterface.createTable('student_promotions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      student_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'students', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      from_class_id: { type: Sequelize.UUID, allowNull: true },
      from_section_id: { type: Sequelize.UUID, allowNull: true },
      to_class_id: { type: Sequelize.UUID, allowNull: true },
      to_section_id: { type: Sequelize.UUID, allowNull: true },
      from_academic_year: { type: Sequelize.STRING(20), allowNull: true },
      to_academic_year: { type: Sequelize.STRING(20), allowNull: true },
      action: {
        type: Sequelize.ENUM('promote', 'repeat'),
        allowNull: false,
        defaultValue: 'promote'
      },
      school_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'schools', key: 'id' }
      },
      branch_id: { type: Sequelize.UUID, allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('student_promotions');
  }
};
