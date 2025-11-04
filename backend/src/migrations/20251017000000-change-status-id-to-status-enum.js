'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Add the new status column as ENUM
      await queryInterface.addColumn(
        'exam_schedules',
        'status',
        {
          type: Sequelize.ENUM('scheduled', 'ongoing', 'completed', 'cancelled', 'rescheduled'),
          allowNull: true, // Temporarily allow null for migration
          defaultValue: 'scheduled'
        },
        { transaction }
      );

      // 2. Get the enum type name that Sequelize created
      const [enumResults] = await queryInterface.sequelize.query(
        `
        SELECT t.typname 
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname LIKE '%exam_schedules%status%'
        LIMIT 1;
        `,
        { transaction }
      );

      const enumTypeName = enumResults && enumResults.length > 0 
        ? enumResults[0].typname 
        : 'enum_exam_schedules_status';

      // 3. Migrate data from status_id to status
      // Update all rows to 'scheduled' (since we can't map from status_id without exam_statuses table)
      // Construct the SQL with proper enum type casting
      const updateQuery = `
        UPDATE exam_schedules 
        SET status = 'scheduled'::"${enumTypeName}"
        WHERE status IS NULL;
      `;
      await queryInterface.sequelize.query(updateQuery, { transaction });

      // 4. Make status NOT NULL
      await queryInterface.changeColumn(
        'exam_schedules',
        'status',
        {
          type: Sequelize.ENUM('scheduled', 'ongoing', 'completed', 'cancelled', 'rescheduled'),
          allowNull: false,
          defaultValue: 'scheduled'
        },
        { transaction }
      );

      // 5. Remove the index on status_id
      await queryInterface.removeIndex(
        'exam_schedules',
        'idx_exam_schedules_status_id',
        { transaction }
      ).catch(() => {
        // Index might not exist, ignore error
      });

      // 6. Remove the foreign key constraint
      await queryInterface.removeConstraint(
        'exam_schedules',
        'exam_schedules_status_id_fkey',
        { transaction }
      ).catch(() => {
        // Constraint might have a different name, try to find and remove it
        return queryInterface.sequelize.query(
          `
          SELECT constraint_name 
          FROM information_schema.table_constraints 
          WHERE table_name = 'exam_schedules' 
          AND constraint_type = 'FOREIGN KEY'
          AND constraint_name LIKE '%status%';
          `,
          { transaction }
        ).then(([results]) => {
          if (results && results.length > 0) {
            const constraintName = results[0].constraint_name;
            return queryInterface.sequelize.query(
              `ALTER TABLE exam_schedules DROP CONSTRAINT ${constraintName};`,
              { transaction }
            );
          }
        });
      });

      // 7. Remove the status_id column
      await queryInterface.removeColumn('exam_schedules', 'status_id', { transaction });

      // 8. Add index on the new status column
      await queryInterface.addIndex(
        'exam_schedules',
        ['status'],
        {
          name: 'idx_exam_schedules_status',
          transaction
        }
      );

      await transaction.commit();
      console.log('✅ Successfully migrated status_id to status ENUM');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Remove index on status
      await queryInterface.removeIndex(
        'exam_schedules',
        'idx_exam_schedules_status',
        { transaction }
      ).catch(() => {});

      // 2. Add status_id column back
      await queryInterface.addColumn(
        'exam_schedules',
        'status_id',
        {
          type: Sequelize.UUID,
          allowNull: true, // Temporarily allow null
          references: {
            model: 'exam_statuses',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        { transaction }
      );

      // 3. Set a default status_id (you may need to adjust this based on your exam_statuses data)
      // For now, we'll leave it NULL and let the application handle it
      
      // 4. Make status_id NOT NULL (if needed)
      // await queryInterface.changeColumn(...)

      // 5. Add index back
      await queryInterface.addIndex(
        'exam_schedules',
        ['status_id'],
        {
          name: 'idx_exam_schedules_status_id',
          transaction
        }
      );

      // 6. Remove status column
      await queryInterface.removeColumn('exam_schedules', 'status', { transaction });

      await transaction.commit();
      console.log('✅ Successfully reverted status ENUM to status_id');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};

