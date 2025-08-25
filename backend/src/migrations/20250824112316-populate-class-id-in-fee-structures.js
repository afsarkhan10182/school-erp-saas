'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get all fee structures that don't have class_id populated
    const feeStructures = await queryInterface.sequelize.query(
      `SELECT id, class_name, school_id, branch_id FROM fee_structures WHERE class_id IS NULL`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    console.log(`Found ${feeStructures.length} fee structures without class_id`);

    // For each fee structure, find the matching class and update
    for (const feeStructure of feeStructures) {
      try {
        // Find the class by name, school_id, and branch_id
        const classes = await queryInterface.sequelize.query(
          `SELECT id FROM classes WHERE name = :className AND school_id = :schoolId AND branch_id = :branchId`,
          {
            replacements: {
              className: feeStructure.class_name,
              schoolId: feeStructure.school_id,
              branchId: feeStructure.branch_id
            },
            type: Sequelize.QueryTypes.SELECT
          }
        );

        if (classes.length > 0) {
          // Update the fee structure with the class_id
          await queryInterface.sequelize.query(
            `UPDATE fee_structures SET class_id = :classId WHERE id = :feeStructureId`,
            {
              replacements: {
                classId: classes[0].id,
                feeStructureId: feeStructure.id
              },
              type: Sequelize.QueryTypes.UPDATE
            }
          );
          console.log(`Updated fee structure ${feeStructure.id} with class_id ${classes[0].id} for class ${feeStructure.class_name}`);
        } else {
          console.log(`No matching class found for fee structure ${feeStructure.id} with class name ${feeStructure.class_name}`);
        }
      } catch (error) {
        console.error(`Error updating fee structure ${feeStructure.id}:`, error.message);
      }
    }

    console.log('Migration completed');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove class_id from all fee structures (set to NULL)
    await queryInterface.sequelize.query(
      `UPDATE fee_structures SET class_id = NULL`,
      { type: Sequelize.QueryTypes.UPDATE }
    );
  }
};
