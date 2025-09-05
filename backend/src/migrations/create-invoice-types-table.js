'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('invoice_types', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Invoice type name (e.g., Tuition, Transport, Hostel)'
      },
      code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'Short code for invoice type (e.g., TUI, TRP, HST)'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Description of the invoice type'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether this invoice type is active'
      },
      requires_student: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether this invoice type requires a student'
      },
      requires_class: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether this invoice type requires a class'
      },
      requires_fee_structure: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether this invoice type requires a fee structure'
      },
      default_payment_terms: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Default payment terms for this invoice type'
      },
      school_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'schools',
          key: 'id',
        },
        comment: 'School this invoice type belongs to'
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes
    await queryInterface.addIndex('invoice_types', ['school_id', 'code'], { unique: true });
    await queryInterface.addIndex('invoice_types', ['school_id', 'is_active']);
    await queryInterface.addIndex('invoice_types', ['school_id', 'name']);

    // Insert default invoice types for existing schools
    await queryInterface.sequelize.query(`
      INSERT INTO invoice_types (id, name, code, description, requires_student, requires_class, requires_fee_structure, school_id, created_at, updated_at)
      SELECT 
        gen_random_uuid(),
        'Tuition Fees',
        'TUI',
        'Regular academic tuition fees',
        true,
        true,
        true,
        id,
        NOW(),
        NOW()
      FROM schools
      WHERE id NOT IN (SELECT school_id FROM invoice_types WHERE code = 'TUI')
    `);

    await queryInterface.sequelize.query(`
      INSERT INTO invoice_types (id, name, code, description, requires_student, requires_class, requires_fee_structure, school_id, created_at, updated_at)
      SELECT 
        gen_random_uuid(),
        'Transport Fees',
        'TRP',
        'School bus and transport fees',
        true,
        false,
        false,
        id,
        NOW(),
        NOW()
      FROM schools
      WHERE id NOT IN (SELECT school_id FROM invoice_types WHERE code = 'TRP')
    `);

    await queryInterface.sequelize.query(`
      INSERT INTO invoice_types (id, name, code, description, requires_student, requires_class, requires_fee_structure, school_id, created_at, updated_at)
      SELECT 
        gen_random_uuid(),
        'Hostel Fees',
        'HST',
        'Boarding and hostel fees',
        true,
        false,
        false,
        id,
        NOW(),
        NOW()
      FROM schools
      WHERE id NOT IN (SELECT school_id FROM invoice_types WHERE code = 'HST')
    `);

    await queryInterface.sequelize.query(`
      INSERT INTO invoice_types (id, name, code, description, requires_student, requires_class, requires_fee_structure, school_id, created_at, updated_at)
      SELECT 
        gen_random_uuid(),
        'Library Fees',
        'LIB',
        'Library membership and book fees',
        true,
        false,
        false,
        id,
        NOW(),
        NOW()
      FROM schools
      WHERE id NOT IN (SELECT school_id FROM invoice_types WHERE code = 'LIB')
    `);

    await queryInterface.sequelize.query(`
      INSERT INTO invoice_types (id, name, code, description, requires_student, requires_class, requires_fee_structure, school_id, created_at, updated_at)
      SELECT 
        gen_random_uuid(),
        'Exam Fees',
        'EXM',
        'Examination and assessment fees',
        true,
        true,
        false,
        id,
        NOW(),
        NOW()
      FROM schools
      WHERE id NOT IN (SELECT school_id FROM invoice_types WHERE code = 'EXM')
    `);

    await queryInterface.sequelize.query(`
      INSERT INTO invoice_types (id, name, code, description, requires_student, requires_class, requires_fee_structure, school_id, created_at, updated_at)
      SELECT 
        gen_random_uuid(),
        'Sports Fees',
        'SPT',
        'Sports and physical education fees',
        true,
        false,
        false,
        id,
        NOW(),
        NOW()
      FROM schools
      WHERE id NOT IN (SELECT school_id FROM invoice_types WHERE code = 'SPT')
    `);

    await queryInterface.sequelize.query(`
      INSERT INTO invoice_types (id, name, code, description, requires_student, requires_class, requires_fee_structure, school_id, created_at, updated_at)
      SELECT 
        gen_random_uuid(),
        'Donations',
        'DON',
        'School donations and contributions',
        false,
        false,
        false,
        id,
        NOW(),
        NOW()
      FROM schools
      WHERE id NOT IN (SELECT school_id FROM invoice_types WHERE code = 'DON')
    `);

    await queryInterface.sequelize.query(`
      INSERT INTO invoice_types (id, name, code, description, requires_student, requires_class, requires_fee_structure, school_id, created_at, updated_at)
      SELECT 
        gen_random_uuid(),
        'Miscellaneous',
        'MISC',
        'Other miscellaneous charges',
        false,
        false,
        false,
        id,
        NOW(),
        NOW()
      FROM schools
      WHERE id NOT IN (SELECT school_id FROM invoice_types WHERE code = 'MISC')
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('invoice_types');
  }
};
