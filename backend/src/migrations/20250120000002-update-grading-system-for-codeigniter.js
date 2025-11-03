'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('📝 Updating grading_systems table for  specification...');

      // Add new fields for  specification
      await queryInterface.addColumn(
        'grading_systems',
        'branch_id',
        {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'branches', key: 'id' }
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'grading_systems',
        'grade_point',
        {
          type: Sequelize.DECIMAL(3, 2),
          allowNull: true,
          defaultValue: 4.0
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'grading_systems',
        'min_percentage',
        {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
          defaultValue: 0.0
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'grading_systems',
        'max_percentage',
        {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
          defaultValue: 100.0
        },
        { transaction }
      );

      // Make existing fields optional for backward compatibility
      await queryInterface.changeColumn(
        'grading_systems',
        'code',
        {
          type: Sequelize.STRING(20),
          allowNull: true,
          unique: false
        },
        { transaction }
      );

      await queryInterface.changeColumn(
        'grading_systems',
        'grade_type',
        {
          type: Sequelize.ENUM('letter', 'number', 'percentage', 'custom'),
          allowNull: true,
          defaultValue: null
        },
        { transaction }
      );

      await queryInterface.changeColumn(
        'grading_systems',
        'passing_percentage',
        {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
          defaultValue: null
        },
        { transaction }
      );

      await queryInterface.changeColumn(
        'grading_systems',
        'max_grade_points',
        {
          type: Sequelize.DECIMAL(3, 2),
          allowNull: true,
          defaultValue: null
        },
        { transaction }
      );

      // Add indexes for new fields
      await queryInterface.addIndex('grading_systems', ['branch_id'], {
        name: 'idx_grading_systems_branch_id',
        transaction
      });

      await transaction.commit();
      console.log('✅ Migration completed: Updated grading_systems table for  specification');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Remove new fields
      await queryInterface.removeColumn('grading_systems', 'branch_id', { transaction });
      await queryInterface.removeColumn('grading_systems', 'grade_point', { transaction });
      await queryInterface.removeColumn('grading_systems', 'min_percentage', { transaction });
      await queryInterface.removeColumn('grading_systems', 'max_percentage', { transaction });

      // Restore original field constraints
      await queryInterface.changeColumn(
        'grading_systems',
        'code',
        {
          type: Sequelize.STRING(20),
          allowNull: false,
          unique: true
        },
        { transaction }
      );

      await queryInterface.changeColumn(
        'grading_systems',
        'grade_type',
        {
          type: Sequelize.ENUM('letter', 'number', 'percentage', 'custom'),
          allowNull: false,
          defaultValue: 'letter'
        },
        { transaction }
      );

      await queryInterface.changeColumn(
        'grading_systems',
        'passing_percentage',
        {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: 35.0
        },
        { transaction }
      );

      await queryInterface.changeColumn(
        'grading_systems',
        'max_grade_points',
        {
          type: Sequelize.DECIMAL(3, 2),
          allowNull: false,
          defaultValue: 4.0
        },
        { transaction }
      );

      await transaction.commit();
      console.log('✅ Rollback completed: Restored grading_systems table to original state');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};
