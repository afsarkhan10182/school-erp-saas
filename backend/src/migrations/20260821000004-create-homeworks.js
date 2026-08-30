'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const exists = await queryInterface.describeTable('homeworks').catch(() => null);
    if (exists) return;

    await queryInterface.createTable('homeworks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      title: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      due_date: { type: Sequelize.DATEONLY, allowNull: false },
      class_id: { type: Sequelize.UUID, allowNull: false },
      section_id: { type: Sequelize.UUID, allowNull: true },
      subject_id: { type: Sequelize.UUID, allowNull: true },
      attachment_url: { type: Sequelize.STRING, allowNull: true },
      school_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'schools', key: 'id' }
      },
      branch_id: { type: Sequelize.UUID, allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('homeworks');
  }
};
