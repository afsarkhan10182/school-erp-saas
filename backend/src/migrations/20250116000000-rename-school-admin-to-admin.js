'use strict';

/**
 * Migration to rename 'school_admin' role to 'admin'
 * This makes the role more generic and suitable for any institution type
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log('Starting role rename migration: school_admin -> admin');

      // Step 1: Add new 'admin' value to ENUM (must be done outside transaction)
      console.log('Step 1: Adding "admin" to role ENUM...');
      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'admin';`
      );

      // Step 2: Update all existing 'school_admin' records to 'admin'
      console.log('Step 2: Updating existing user records...');
      const [results] = await queryInterface.sequelize.query(
        `UPDATE users SET role = 'admin' WHERE role = 'school_admin';`
      );
      console.log(`Updated ${results.rowCount || 0} user records`);

      // Step 3: Recreate ENUM without 'school_admin'
      console.log('Step 3: Recreating ENUM without "school_admin"...');

      // Drop default constraint first
      await queryInterface.sequelize.query(`ALTER TABLE users ALTER COLUMN role DROP DEFAULT;`);

      // Drop temp ENUM if it exists from previous failed migration
      await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_users_role_new";`);

      // Create new ENUM type without 'school_admin'
      await queryInterface.sequelize.query(
        `CREATE TYPE "enum_users_role_new" AS ENUM(
          'super_admin',
          'admin',
          'branch_admin',
          'teacher',
          'accountant',
          'librarian',
          'receptionist',
          'student',
          'parent'
        );`
      );

      // Change column to use new ENUM
      await queryInterface.sequelize.query(
        `ALTER TABLE users
        ALTER COLUMN role TYPE "enum_users_role_new"
        USING role::text::"enum_users_role_new";`
      );

      // Drop old ENUM
      await queryInterface.sequelize.query(`DROP TYPE "enum_users_role";`);

      // Rename new ENUM to original name
      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_users_role_new" RENAME TO "enum_users_role";`
      );

      // Restore default constraint
      await queryInterface.sequelize.query(
        `ALTER TABLE users ALTER COLUMN role SET DEFAULT 'student';`
      );

      console.log('Migration completed successfully!');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log('Reverting role rename migration: admin -> school_admin');

      // Step 1: Add 'school_admin' back to ENUM (must be done outside transaction)
      console.log('Step 1: Adding "school_admin" back to role ENUM...');
      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'school_admin';`
      );

      // Step 2: Update all 'admin' records back to 'school_admin'
      console.log('Step 2: Reverting user records...');
      const [results] = await queryInterface.sequelize.query(
        `UPDATE users SET role = 'school_admin' WHERE role = 'admin';`
      );
      console.log(`Reverted ${results.rowCount || 0} user records`);

      // Step 3: Recreate ENUM without 'admin'
      console.log('Step 3: Recreating ENUM without "admin"...');

      // Drop default constraint first
      await queryInterface.sequelize.query(`ALTER TABLE users ALTER COLUMN role DROP DEFAULT;`);

      // Create new ENUM type without 'admin'
      await queryInterface.sequelize.query(
        `CREATE TYPE "enum_users_role_new" AS ENUM(
          'super_admin',
          'school_admin',
          'branch_admin',
          'teacher',
          'accountant',
          'librarian',
          'receptionist',
          'student',
          'parent'
        );`
      );

      // Change column to use new ENUM
      await queryInterface.sequelize.query(
        `ALTER TABLE users
        ALTER COLUMN role TYPE "enum_users_role_new"
        USING role::text::"enum_users_role_new";`
      );

      // Drop old ENUM
      await queryInterface.sequelize.query(`DROP TYPE "enum_users_role";`);

      // Rename new ENUM to original name
      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_users_role_new" RENAME TO "enum_users_role";`
      );

      // Restore default constraint
      await queryInterface.sequelize.query(
        `ALTER TABLE users ALTER COLUMN role SET DEFAULT 'student';`
      );

      console.log('Migration rollback completed successfully!');
    } catch (error) {
      console.error('Migration rollback failed:', error);
      throw error;
    }
  }
};
