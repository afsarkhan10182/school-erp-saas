'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Create terms table
      await queryInterface.createTable(
        'terms',
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
          },
          name: {
            type: Sequelize.STRING(100),
            allowNull: false,
            validate: {
              notEmpty: { msg: 'Term name is required' }
            }
          },
          code: {
            type: Sequelize.STRING(20),
            allowNull: false,
            validate: {
              notEmpty: { msg: 'Term code is required' }
            }
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          start_date: {
            type: Sequelize.DATEONLY,
            allowNull: false
          },
          end_date: {
            type: Sequelize.DATEONLY,
            allowNull: false
          },
          academic_year: {
            type: Sequelize.STRING(10),
            allowNull: false
          },
          is_active: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true
          },
          school_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'schools', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          branch_id: {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: 'branches', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          created_by: {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          updated_by: {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
          }
        },
        { transaction }
      );

      // Add indexes for better performance
      await queryInterface.addIndex('terms', ['school_id'], { transaction });
      await queryInterface.addIndex('terms', ['branch_id'], { transaction });
      await queryInterface.addIndex('terms', ['academic_year'], { transaction });
      await queryInterface.addIndex('terms', ['is_active'], { transaction });
      await queryInterface.addIndex('terms', ['start_date', 'end_date'], { transaction });
      await queryInterface.addIndex('terms', ['school_id', 'branch_id', 'academic_year', 'code'], {
        unique: true,
        name: 'unique_term_per_school_branch_year',
        transaction
      });

      await transaction.commit();
      console.log('✅ Terms table created successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Terms table creation failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Remove indexes
      await queryInterface.removeIndex(
        'terms',
        ['school_id', 'branch_id', 'academic_year', 'code'],
        { transaction }
      );
      await queryInterface.removeIndex('terms', ['start_date', 'end_date'], { transaction });
      await queryInterface.removeIndex('terms', ['is_active'], { transaction });
      await queryInterface.removeIndex('terms', ['academic_year'], { transaction });
      await queryInterface.removeIndex('terms', ['branch_id'], { transaction });
      await queryInterface.removeIndex('terms', ['school_id'], { transaction });

      // Drop terms table
      await queryInterface.dropTable('terms', { transaction });

      await transaction.commit();
      console.log('✅ Terms table dropped successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Terms table drop failed:', error);
      throw error;
    }
  }
};
