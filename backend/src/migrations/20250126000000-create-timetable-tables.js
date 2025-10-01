'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create timetables table first (since timetable_slots references it)
    await queryInterface.createTable('timetables', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      academic_year: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      class_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'classes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      section_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'sections', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
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
    });

    // Add indexes for timetables table
    await queryInterface.addIndex('timetables', ['school_id']);
    await queryInterface.addIndex('timetables', ['branch_id']);
    await queryInterface.addIndex('timetables', ['class_id']);
    await queryInterface.addIndex('timetables', ['section_id']);
    await queryInterface.addIndex('timetables', ['academic_year']);
    await queryInterface.addIndex('timetables', ['is_active']);
    await queryInterface.addIndex('timetables', ['is_default']);

    // Add unique constraint for timetables
    await queryInterface.addConstraint('timetables', {
      fields: ['school_id', 'class_id', 'section_id', 'academic_year'],
      type: 'unique',
      name: 'unique_timetable_per_class_section_year'
    });

    // Create timetable_slots table
    await queryInterface.createTable('timetable_slots', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      timetable_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'timetables', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      day_of_week: {
        type: Sequelize.STRING(20), // Initially string, will be changed to integer in next migration
        allowNull: false
      },
      period_number: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      end_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      subject_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'subjects', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      teacher_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      room_number: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      slot_type: {
        type: Sequelize.ENUM('regular', 'break', 'lunch', 'assembly', 'free', 'exam'),
        allowNull: false,
        defaultValue: 'regular'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
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
    });

    // Add indexes for timetable_slots table
    await queryInterface.addIndex('timetable_slots', ['timetable_id']);
    await queryInterface.addIndex('timetable_slots', ['day_of_week']);
    await queryInterface.addIndex('timetable_slots', ['period_number']);
    await queryInterface.addIndex('timetable_slots', ['subject_id']);
    await queryInterface.addIndex('timetable_slots', ['teacher_id']);
    await queryInterface.addIndex('timetable_slots', ['slot_type']);
    await queryInterface.addIndex('timetable_slots', ['is_active']);

    // Add unique constraint for timetable_slots
    await queryInterface.addConstraint('timetable_slots', {
      fields: ['timetable_id', 'day_of_week', 'period_number'],
      type: 'unique',
      name: 'unique_slot_per_timetable_day_period'
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order (due to foreign key constraints)
    await queryInterface.dropTable('timetable_slots');
    await queryInterface.dropTable('timetables');
  }
};
