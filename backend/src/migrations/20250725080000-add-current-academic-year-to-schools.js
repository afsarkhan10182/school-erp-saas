'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔄 Adding current_academic_year_id to schools table...');
    
    await queryInterface.addColumn('schools', 'current_academic_year_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'academic_years',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Reference to the current global academic year for this school'
    });

    // Add index for better performance
    await queryInterface.addIndex('schools', ['current_academic_year_id'], {
      name: 'idx_schools_current_academic_year_id'
    });

    // Update existing schools to link to the current global academic year
    console.log('📝 Linking existing schools to current global academic year...');
    await queryInterface.sequelize.query(`
      UPDATE schools 
      SET current_academic_year_id = (
        SELECT id FROM academic_years 
        WHERE is_current = true 
        LIMIT 1
      )
      WHERE current_academic_year_id IS NULL;
    `);

    console.log('✅ current_academic_year_id column added to schools table successfully!');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Removing current_academic_year_id from schools table...');
    
    await queryInterface.removeIndex('schools', 'idx_schools_current_academic_year_id');
    await queryInterface.removeColumn('schools', 'current_academic_year_id');
    
    console.log('✅ current_academic_year_id column removed from schools table successfully!');
  }
}; 