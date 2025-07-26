'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔄 Adding sort_order column to sections table...');
    
    await queryInterface.addColumn('sections', 'sort_order', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Order for sorting sections within a class'
    });

    // Update existing sections with sequential sort_order values
    console.log('📝 Updating existing sections with sequential sort_order values...');
    await queryInterface.sequelize.query(`
      UPDATE sections 
      SET sort_order = subquery.row_num
      FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY class_id ORDER BY name) as row_num
        FROM sections
      ) as subquery
      WHERE sections.id = subquery.id;
    `);

    console.log('✅ sort_order column added to sections table successfully!');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Removing sort_order column from sections table...');
    
    await queryInterface.removeColumn('sections', 'sort_order');
    
    console.log('✅ sort_order column removed from sections table successfully!');
  }
};
