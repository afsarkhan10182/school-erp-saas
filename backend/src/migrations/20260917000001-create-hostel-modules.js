'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('hostels', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      school_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'schools', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      branch_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'branches', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      hostel_name: { type: Sequelize.STRING, allowNull: false },
      hostel_type: { type: Sequelize.STRING, defaultValue: 'Boys' }, // Boys, Girls, Co-ed
      address: { type: Sequelize.TEXT },
      intake: { type: Sequelize.INTEGER },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.createTable('room_types', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      school_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'schools', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      branch_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'branches', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      type_name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.createTable('hostel_rooms', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      school_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'schools', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      branch_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'branches', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      hostel_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'hostels', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      room_type_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'room_types', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      room_number: { type: Sequelize.STRING, allowNull: false },
      number_of_beds: { type: Sequelize.INTEGER, defaultValue: 1 },
      cost_per_bed: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.createTable('hostel_allocations', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      school_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'schools', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      branch_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'branches', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      student_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'students', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      hostel_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'hostels', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      room_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'hostel_rooms', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      month: { type: Sequelize.STRING },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('hostel_allocations');
    await queryInterface.dropTable('hostel_rooms');
    await queryInterface.dropTable('room_types');
    await queryInterface.dropTable('hostels');
  }
};
