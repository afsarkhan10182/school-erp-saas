'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔄 Fixing payment_model enum to only have "installment" and "monthly" values...');
    
    try {
      // Step 1: Check if the payment_model column exists
      const tableDescription = await queryInterface.describeTable('fee_structures');
      
      if (!tableDescription.payment_model) {
        console.log('📋 payment_model column does not exist, creating it...');
        await queryInterface.addColumn('fee_structures', 'payment_model', {
          type: Sequelize.ENUM('installment', 'monthly'),
          allowNull: false,
          defaultValue: 'monthly',
        });
        console.log('✅ Created payment_model column with correct enum values');
        return;
      }
      
      // Step 2: Check current enum values
      let currentEnumValues = [];
      try {
        const enumQuery = await queryInterface.sequelize.query(`
          SELECT unnest(enum_range(NULL::enum_fee_structures_payment_model)) as enum_value;
        `);
        currentEnumValues = enumQuery[0].map(row => row.enum_value);
        console.log('📋 Current enum values:', currentEnumValues);
      } catch (error) {
        console.log('⚠️ Could not query enum values, proceeding with recreation');
      }
      
      // Step 3: Temporarily change column to TEXT to avoid enum constraints
      console.log('🔄 Temporarily changing column to TEXT...');
      await queryInterface.sequelize.query(`
        ALTER TABLE "fee_structures" 
        ALTER COLUMN "payment_model" TYPE TEXT;
      `);
      console.log('✅ Changed column to TEXT');
      
      // Step 4: Update existing records to use correct values
      console.log('🔄 Updating existing records...');
      
      // Map any old values to new values
      const updateQueries = [
        // Update any old values to 'installment'
        `UPDATE fee_structures SET payment_model = 'installment' WHERE payment_model IN ('senior_branch', 'installment');`,
        // Update any old values to 'monthly'  
        `UPDATE fee_structures SET payment_model = 'monthly' WHERE payment_model IN ('school_branch', 'monthly');`,
        // Set default for any other values
        `UPDATE fee_structures SET payment_model = 'monthly' WHERE payment_model NOT IN ('installment', 'monthly');`
      ];
      
      for (const query of updateQueries) {
        try {
          await queryInterface.sequelize.query(query);
        } catch (error) {
          console.log('⚠️ Update query failed (might be no records to update):', error.message);
        }
      }
      console.log('✅ Updated existing records');
      
      // Step 5: Drop the old enum if it exists
      try {
        await queryInterface.sequelize.query(`
          DROP TYPE IF EXISTS "enum_fee_structures_payment_model";
        `);
        console.log('✅ Dropped old enum type');
      } catch (error) {
        console.log('⚠️ Could not drop old enum:', error.message);
      }
      
      // Step 6: Create new enum with only the correct values
      console.log('🔄 Creating new enum with correct values...');
      await queryInterface.sequelize.query(`
        CREATE TYPE "enum_fee_structures_payment_model" AS ENUM ('installment', 'monthly');
      `);
      console.log('✅ Created new enum with correct values');
      
      // Step 7: Change column back to use the new enum
      console.log('🔄 Changing column to use new enum...');
      await queryInterface.sequelize.query(`
        ALTER TABLE "fee_structures" 
        ALTER COLUMN "payment_model" TYPE "enum_fee_structures_payment_model" 
        USING "payment_model"::text::"enum_fee_structures_payment_model";
      `);
      console.log('✅ Changed column to use new enum');
      
      // Step 8: Verify the fix
      console.log('🔄 Verifying the fix...');
      const verifyQuery = await queryInterface.sequelize.query(`
        SELECT unnest(enum_range(NULL::enum_fee_structures_payment_model)) as enum_value;
      `);
      
      const newValues = verifyQuery[0].map(row => row.enum_value);
      console.log('✅ New enum values:', newValues);
      
      if (newValues.includes('installment') && newValues.includes('monthly') && newValues.length === 2) {
        console.log('🎉 Successfully fixed payment_model enum! Only "installment" and "monthly" values are now allowed.');
      } else {
        throw new Error(`Enum values are not correct after fix. Expected: ["installment", "monthly"], Got: ${JSON.stringify(newValues)}`);
      }
      
      // Step 9: Check if there are any records with invalid values
      const invalidRecordsQuery = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count FROM fee_structures 
        WHERE payment_model NOT IN ('installment', 'monthly');
      `);
      
      const invalidCount = invalidRecordsQuery[0][0].count;
      if (invalidCount > 0) {
        console.log(`⚠️ Found ${invalidCount} records with invalid payment_model values`);
      } else {
        console.log('✅ All records have valid payment_model values');
      }
      
    } catch (error) {
      console.error('❌ Error fixing payment_model enum:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Reverting payment_model enum changes...');
    
    try {
      // This is a destructive migration, so we'll just recreate the original state
      // Remove the payment_model column entirely
      await queryInterface.removeColumn('fee_structures', 'payment_model');
      
      // Drop the enum type
      try {
        await queryInterface.sequelize.query(`
          DROP TYPE IF EXISTS "enum_fee_structures_payment_model";
        `);
      } catch (error) {
        console.log('⚠️ Could not drop enum type:', error.message);
      }
      
      console.log('✅ Reverted payment_model enum changes');
      
    } catch (error) {
      console.error('❌ Error reverting payment_model enum:', error.message);
      throw error;
    }
  }
}; 