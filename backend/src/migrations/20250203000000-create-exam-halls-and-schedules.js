'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Create exam_halls table
      await queryInterface.createTable(
        'exam_halls',
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
          },
          name: {
            type: Sequelize.STRING(100),
            allowNull: false
          },
          code: {
            type: Sequelize.STRING(20),
            allowNull: false
          },
          capacity: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 30
          },
          floor: {
            type: Sequelize.STRING(20),
            allowNull: true
          },
          building: {
            type: Sequelize.STRING(50),
            allowNull: true
          },
          facilities: {
            type: Sequelize.JSON,
            allowNull: true
          },
          is_active: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          school_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'schools',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          branch_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'branches',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          created_by: {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: 'users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          updated_by: {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: 'users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          }
        },
        { transaction }
      );

      // Create indexes for exam_halls
      await queryInterface.addIndex('exam_halls', ['school_id'], {
        name: 'idx_exam_halls_school_id',
        transaction
      });
      await queryInterface.addIndex('exam_halls', ['branch_id'], {
        name: 'idx_exam_halls_branch_id',
        transaction
      });
      await queryInterface.addIndex('exam_halls', ['is_active'], {
        name: 'idx_exam_halls_is_active',
        transaction
      });
      await queryInterface.addIndex('exam_halls', ['code', 'branch_id'], {
        name: 'idx_exam_halls_code_branch',
        unique: true,
        transaction
      });

      // 2. Create exam_schedules table
      await queryInterface.createTable(
        'exam_schedules',
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
          },
          exam_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'exams',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          exam_date: {
            type: Sequelize.DATEONLY,
            allowNull: false
          },
          start_time: {
            type: Sequelize.TIME,
            allowNull: true
          },
          end_time: {
            type: Sequelize.TIME,
            allowNull: true
          },
          duration_minutes: {
            type: Sequelize.INTEGER,
            allowNull: true
          },
          exam_hall_id: {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: 'exam_halls',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          invigilator_id: {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: 'users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          additional_invigilators: {
            type: Sequelize.JSON,
            allowNull: true
          },
          status_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'exam_statuses',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT'
          },
          seating_arrangement: {
            type: Sequelize.JSON,
            allowNull: true
          },
          special_instructions: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          is_rescheduled: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
          },
          rescheduled_reason: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          original_date: {
            type: Sequelize.DATEONLY,
            allowNull: true
          },
          is_active: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true
          },
          branch_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'branches',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          school_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'schools',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          created_by: {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: 'users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          updated_by: {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: 'users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          }
        },
        { transaction }
      );

      // Create indexes for exam_schedules
      await queryInterface.addIndex('exam_schedules', ['exam_id'], {
        name: 'idx_exam_schedules_exam_id',
        transaction
      });
      await queryInterface.addIndex('exam_schedules', ['branch_id'], {
        name: 'idx_exam_schedules_branch_id',
        transaction
      });
      await queryInterface.addIndex('exam_schedules', ['school_id'], {
        name: 'idx_exam_schedules_school_id',
        transaction
      });
      await queryInterface.addIndex('exam_schedules', ['exam_date'], {
        name: 'idx_exam_schedules_exam_date',
        transaction
      });
      await queryInterface.addIndex('exam_schedules', ['status_id'], {
        name: 'idx_exam_schedules_status_id',
        transaction
      });
      await queryInterface.addIndex('exam_schedules', ['exam_hall_id'], {
        name: 'idx_exam_schedules_exam_hall_id',
        transaction
      });
      await queryInterface.addIndex('exam_schedules', ['invigilator_id'], {
        name: 'idx_exam_schedules_invigilator_id',
        transaction
      });
      await queryInterface.addIndex('exam_schedules', ['is_active'], {
        name: 'idx_exam_schedules_is_active',
        transaction
      });
      await queryInterface.addIndex('exam_schedules', ['exam_id', 'branch_id', 'exam_date'], {
        name: 'idx_exam_schedules_unique_schedule',
        unique: true,
        transaction
      });

      // 3. Migrate existing exam data to exam_schedules
      // For each existing exam that has a date, create a schedule entry
      await queryInterface.sequelize.query(
        `
        INSERT INTO exam_schedules (
          id, exam_id, exam_date, start_time, end_time, duration_minutes,
          status_id, branch_id, school_id, is_active, created_by, updated_by,
          created_at, updated_at
        )
        SELECT 
          gen_random_uuid() as id,
          e.id as exam_id,
          e.exam_date,
          e.start_time,
          e.end_time,
          e.duration_minutes,
          e.status_id,
          e.branch_id,
          e.school_id,
          e.is_active,
          e.created_by,
          e.updated_by,
          e.created_at,
          e.updated_at
        FROM exams e
        WHERE e.exam_date IS NOT NULL
        `,
        { transaction }
      );

      // 4. Remove scheduling columns from exams table
      await queryInterface.removeColumn('exams', 'exam_date', { transaction });
      await queryInterface.removeColumn('exams', 'start_time', { transaction });
      await queryInterface.removeColumn('exams', 'end_time', { transaction });
      await queryInterface.removeColumn('exams', 'duration_minutes', { transaction });
      await queryInterface.removeColumn('exams', 'status_id', { transaction });

      // 5. Drop the old index on exam_date
      await queryInterface.removeIndex('exams', 'idx_exams_exam_date', { transaction });
      await queryInterface.removeIndex('exams', 'idx_exams_status_id', { transaction });

      await transaction.commit();
      console.log('✅ Migration completed: Created exam_halls and exam_schedules tables');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Re-add scheduling columns to exams table
      await queryInterface.addColumn(
        'exams',
        'exam_date',
        {
          type: Sequelize.DATEONLY,
          allowNull: true
        },
        { transaction }
      );
      await queryInterface.addColumn(
        'exams',
        'start_time',
        {
          type: Sequelize.TIME,
          allowNull: true
        },
        { transaction }
      );
      await queryInterface.addColumn(
        'exams',
        'end_time',
        {
          type: Sequelize.TIME,
          allowNull: true
        },
        { transaction }
      );
      await queryInterface.addColumn(
        'exams',
        'duration_minutes',
        {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        { transaction }
      );
      await queryInterface.addColumn(
        'exams',
        'status_id',
        {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'exam_statuses',
            key: 'id'
          }
        },
        { transaction }
      );

      // 2. Migrate data back from exam_schedules to exams
      await queryInterface.sequelize.query(
        `
        UPDATE exams e
        SET 
          exam_date = es.exam_date,
          start_time = es.start_time,
          end_time = es.end_time,
          duration_minutes = es.duration_minutes,
          status_id = es.status_id
        FROM exam_schedules es
        WHERE e.id = es.exam_id
        `,
        { transaction }
      );

      // 3. Re-create indexes
      await queryInterface.addIndex('exams', ['exam_date'], {
        name: 'idx_exams_exam_date',
        transaction
      });
      await queryInterface.addIndex('exams', ['status_id'], {
        name: 'idx_exams_status_id',
        transaction
      });

      // 4. Make status_id NOT NULL again
      await queryInterface.changeColumn(
        'exams',
        'status_id',
        {
          type: Sequelize.UUID,
          allowNull: false
        },
        { transaction }
      );
      await queryInterface.changeColumn(
        'exams',
        'exam_date',
        {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        { transaction }
      );

      // 5. Drop new tables
      await queryInterface.dropTable('exam_schedules', { transaction });
      await queryInterface.dropTable('exam_halls', { transaction });

      await transaction.commit();
      console.log('✅ Rollback completed: Restored original exam table structure');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};

