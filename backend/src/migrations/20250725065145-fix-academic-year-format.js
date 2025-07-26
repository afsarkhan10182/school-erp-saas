'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔄 Starting academic year format fix migration...');

    // Update students table
    console.log('📝 Updating students table...');
    await queryInterface.sequelize.query(`
      UPDATE students 
      SET academic_year = CASE 
        WHEN academic_year = '2025-26' THEN '2025-2026'
        WHEN academic_year = '2024-25' THEN '2024-2025'
        WHEN academic_year = '2026-27' THEN '2026-2027'
        ELSE academic_year
      END
      WHERE academic_year IN ('2025-26', '2024-25', '2026-27');
    `);

    // Update fee_structures table
    console.log('📝 Updating fee_structures table...');
    await queryInterface.sequelize.query(`
      UPDATE fee_structures 
      SET academic_year = CASE 
        WHEN academic_year = '2025-26' THEN '2025-2026'
        WHEN academic_year = '2024-25' THEN '2024-2025'
        WHEN academic_year = '2026-27' THEN '2026-2027'
        ELSE academic_year
      END
      WHERE academic_year IN ('2025-26', '2024-25', '2026-27');
    `);

    // Update fee_invoices table
    console.log('📝 Updating fee_invoices table...');
    await queryInterface.sequelize.query(`
      UPDATE fee_invoices 
      SET academic_year = CASE 
        WHEN academic_year = '2025-26' THEN '2025-2026'
        WHEN academic_year = '2024-25' THEN '2024-2025'
        WHEN academic_year = '2026-27' THEN '2026-2027'
        ELSE academic_year
      END
      WHERE academic_year IN ('2025-26', '2024-25', '2026-27');
    `);

    console.log('✅ Academic year format fix migration completed successfully!');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Reverting academic year format fix migration...');

    // Revert students table
    console.log('📝 Reverting students table...');
    await queryInterface.sequelize.query(`
      UPDATE students 
      SET academic_year = CASE 
        WHEN academic_year = '2025-2026' THEN '2025-26'
        WHEN academic_year = '2024-2025' THEN '2024-25'
        WHEN academic_year = '2026-2027' THEN '2026-27'
        ELSE academic_year
      END
      WHERE academic_year IN ('2025-2026', '2024-2025', '2026-2027');
    `);

    // Revert fee_structures table
    console.log('📝 Reverting fee_structures table...');
    await queryInterface.sequelize.query(`
      UPDATE fee_structures 
      SET academic_year = CASE 
        WHEN academic_year = '2025-2026' THEN '2025-26'
        WHEN academic_year = '2024-2025' THEN '2024-25'
        WHEN academic_year = '2026-2027' THEN '2026-27'
        ELSE academic_year
      END
      WHERE academic_year IN ('2025-2026', '2024-2025', '2026-2027');
    `);

    // Revert fee_invoices table
    console.log('📝 Reverting fee_invoices table...');
    await queryInterface.sequelize.query(`
      UPDATE fee_invoices 
      SET academic_year = CASE 
        WHEN academic_year = '2025-2026' THEN '2025-26'
        WHEN academic_year = '2024-2025' THEN '2024-25'
        WHEN academic_year = '2026-2027' THEN '2026-27'
        ELSE academic_year
      END
      WHERE academic_year IN ('2025-2026', '2024-2025', '2026-2027');
    `);

    console.log('✅ Academic year format fix migration reverted successfully!');
  }
};
