'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('vehicles', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      school_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'schools', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      branch_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'branches', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      vehicle_number: { type: Sequelize.STRING, allowNull: false },
      vehicle_model: { type: Sequelize.STRING },
      driver_name: { type: Sequelize.STRING },
      driver_license: { type: Sequelize.STRING },
      driver_contact: { type: Sequelize.STRING },
      seating_capacity: { type: Sequelize.INTEGER },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.createTable('transport_routes', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      school_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'schools', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      branch_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'branches', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      route_name: { type: Sequelize.STRING, allowNull: false },
      start_point: { type: Sequelize.STRING },
      end_point: { type: Sequelize.STRING },
      fare: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.createTable('vehicle_routes', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      vehicle_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'vehicles', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      route_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'transport_routes', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.createTable('student_transports', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      school_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'schools', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      branch_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'branches', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      student_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'students', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      route_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'transport_routes', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      vehicle_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'vehicles', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      pickup_point: { type: Sequelize.STRING },
      month: { type: Sequelize.STRING },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('student_transports');
    await queryInterface.dropTable('vehicle_routes');
    await queryInterface.dropTable('transport_routes');
    await queryInterface.dropTable('vehicles');
  }
};
