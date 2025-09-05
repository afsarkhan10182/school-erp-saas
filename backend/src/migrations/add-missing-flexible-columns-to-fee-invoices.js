'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check which columns already exist and only add missing ones
    const tableDescription = await queryInterface.describeTable('fee_invoices');
    
    // Add invoice_type if it doesn't exist
    if (!tableDescription.invoice_type) {
      await queryInterface.addColumn('fee_invoices', 'invoice_type', {
        type: Sequelize.ENUM('tuition', 'transport', 'hostel', 'library', 'exam', 'sports', 'donation', 'misc', 'other'),
        allowNull: false,
        defaultValue: 'tuition',
        comment: 'Type of invoice for flexible mode'
      });
    }

    // Add entity_type if it doesn't exist
    if (!tableDescription.entity_type) {
      await queryInterface.addColumn('fee_invoices', 'entity_type', {
        type: Sequelize.ENUM('student', 'staff', 'vendor', 'school', 'other'),
        allowNull: true,
        comment: 'Type of entity this invoice is for'
      });
    }

    // Add entity_id if it doesn't exist
    if (!tableDescription.entity_id) {
      await queryInterface.addColumn('fee_invoices', 'entity_id', {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Reference to student, staff, vendor, etc.'
      });
    }

    // Add title if it doesn't exist
    if (!tableDescription.title) {
      await queryInterface.addColumn('fee_invoices', 'title', {
        type: Sequelize.STRING(200),
        allowNull: true,
        comment: 'Invoice title for generic mode'
      });
    }

    // Add description if it doesn't exist
    if (!tableDescription.description) {
      await queryInterface.addColumn('fee_invoices', 'description', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Invoice description'
      });
    }

    // Add subtotal if it doesn't exist
    if (!tableDescription.subtotal) {
      await queryInterface.addColumn('fee_invoices', 'subtotal', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Subtotal before tax and discount'
      });
    }

    // Make existing columns nullable for flexible mode (only if they're currently NOT NULL)
    if (tableDescription.student_id && !tableDescription.student_id.allowNull) {
      await queryInterface.changeColumn('fee_invoices', 'student_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'students',
          key: 'id',
        },
      });
    }

    if (tableDescription.fee_structure_id && !tableDescription.fee_structure_id.allowNull) {
      await queryInterface.changeColumn('fee_invoices', 'fee_structure_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'fee_structures',
          key: 'id',
        },
      });
    }

    if (tableDescription.class_name && !tableDescription.class_name.allowNull) {
      await queryInterface.changeColumn('fee_invoices', 'class_name', {
        type: Sequelize.STRING(20),
        allowNull: true,
      });
    }

    if (tableDescription.academic_year && !tableDescription.academic_year.allowNull) {
      await queryInterface.changeColumn('fee_invoices', 'academic_year', {
        type: Sequelize.STRING(10),
        allowNull: true,
      });
    }

    if (tableDescription.fee_type_name && !tableDescription.fee_type_name.allowNull) {
      await queryInterface.changeColumn('fee_invoices', 'fee_type_name', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }

    // Add indexes for new columns
    try {
      await queryInterface.addIndex('fee_invoices', ['invoice_type']);
    } catch (error) {
      // Index might already exist, ignore error
    }

    try {
      await queryInterface.addIndex('fee_invoices', ['entity_type', 'entity_id']);
    } catch (error) {
      // Index might already exist, ignore error
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    try {
      await queryInterface.removeIndex('fee_invoices', ['invoice_type']);
    } catch (error) {
      // Index might not exist, ignore error
    }

    try {
      await queryInterface.removeIndex('fee_invoices', ['entity_type', 'entity_id']);
    } catch (error) {
      // Index might not exist, ignore error
    }

    // Remove new columns
    const tableDescription = await queryInterface.describeTable('fee_invoices');
    
    if (tableDescription.invoice_type) {
      await queryInterface.removeColumn('fee_invoices', 'invoice_type');
    }
    if (tableDescription.entity_type) {
      await queryInterface.removeColumn('fee_invoices', 'entity_type');
    }
    if (tableDescription.entity_id) {
      await queryInterface.removeColumn('fee_invoices', 'entity_id');
    }
    if (tableDescription.title) {
      await queryInterface.removeColumn('fee_invoices', 'title');
    }
    if (tableDescription.description) {
      await queryInterface.removeColumn('fee_invoices', 'description');
    }
    if (tableDescription.subtotal) {
      await queryInterface.removeColumn('fee_invoices', 'subtotal');
    }

    // Restore original constraints
    await queryInterface.changeColumn('fee_invoices', 'student_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'students',
        key: 'id',
      },
    });

    await queryInterface.changeColumn('fee_invoices', 'fee_structure_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'fee_structures',
        key: 'id',
      },
    });

    await queryInterface.changeColumn('fee_invoices', 'class_name', {
      type: Sequelize.STRING(20),
      allowNull: false,
    });

    await queryInterface.changeColumn('fee_invoices', 'academic_year', {
      type: Sequelize.STRING(10),
      allowNull: false,
    });

    await queryInterface.changeColumn('fee_invoices', 'fee_type_name', {
      type: Sequelize.STRING(100),
      allowNull: false,
    });
  }
};
