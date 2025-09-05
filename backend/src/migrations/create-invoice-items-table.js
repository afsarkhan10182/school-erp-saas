'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('invoice_items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      invoice_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'fee_invoices',
          key: 'id',
        },
        onDelete: 'CASCADE',
        comment: 'Reference to the invoice'
      },
      item_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: 'Name of the invoice item'
      },
      item_description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Description of the invoice item'
      },
      quantity: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1.00,
        comment: 'Quantity of the item'
      },
      unit_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Unit price of the item'
      },
      discount_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Discount percentage for this item'
      },
      discount_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Discount amount for this item'
      },
      tax_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Tax percentage for this item'
      },
      tax_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Tax amount for this item'
      },
      line_total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Total amount for this line item (quantity * unit_price - discount + tax)'
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Order of items in the invoice'
      },
      school_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'schools',
          key: 'id',
        },
        comment: 'School this item belongs to'
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
    await queryInterface.addIndex('invoice_items', ['invoice_id']);
    await queryInterface.addIndex('invoice_items', ['school_id']);
    await queryInterface.addIndex('invoice_items', ['invoice_id', 'sort_order']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('invoice_items');
  }
};
