'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Insert the academic_management module
      const [moduleResult] = await queryInterface.bulkInsert(
        'modules',
        [
          {
            id: Sequelize.literal('gen_random_uuid()'),
            code: 'academic_management',
            name: 'Academic Management',
            description:
              'Advanced academic management features including subject management, class assignments, and timetable management',
            icon: '📚',
            features: JSON.stringify([
              'Subject Management',
              'Class-Subject Assignments',
              'Timetable Management',
              'Advanced Academic Configuration'
            ]),
            category: 'academic',
            is_active: true,
            is_core: false,
            sort_order: 10,
            version: '1.0.0',
            dependencies: JSON.stringify([]),
            permissions: JSON.stringify([
              'manage_subjects',
              'manage_class_assignments',
              'manage_timetables',
              'view_academic_management'
            ]),
            created_at: new Date(),
            updated_at: new Date()
          }
        ],
        { transaction }
      );

      // Get the module ID
      const [moduleRecord] = await queryInterface.sequelize.query(
        `SELECT id FROM modules WHERE code = 'academic_management'`,
        { transaction }
      );

      if (moduleRecord.length === 0) {
        throw new Error('Failed to create academic_management module');
      }

      const moduleId = moduleRecord[0].id;

      // Get all active subscription plans
      const [plans] = await queryInterface.sequelize.query(
        `SELECT id FROM subscription_plans WHERE is_active = true`,
        { transaction }
      );

      // Add the module to all existing subscription plans
      const planModules = plans.map(plan => ({
        id: Sequelize.literal('gen_random_uuid()'),
        subscription_plan_id: plan.id,
        module_id: moduleId,
        is_required: false, // Not required - can be disabled
        is_enabled: true, // Enable by default for existing plans
        sort_order: 10,
        created_at: new Date(),
        updated_at: new Date()
      }));

      if (planModules.length > 0) {
        await queryInterface.bulkInsert('plan_modules', planModules, { transaction });
      }

      await transaction.commit();
      console.log('✅ Academic Management module created successfully');
      console.log(`📋 Added to ${plans.length} subscription plans`);
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error creating academic_management module:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Get the module ID
      const [moduleRecord] = await queryInterface.sequelize.query(
        `SELECT id FROM modules WHERE code = 'academic_management'`,
        { transaction }
      );

      if (moduleRecord.length > 0) {
        const moduleId = moduleRecord[0].id;

        // Remove from all subscription plans
        await queryInterface.sequelize.query(
          `DELETE FROM plan_modules WHERE module_id = :moduleId`,
          {
            replacements: { moduleId },
            transaction
          }
        );

        // Remove the module
        await queryInterface.sequelize.query(`DELETE FROM modules WHERE id = :moduleId`, {
          replacements: { moduleId },
          transaction
        });
      }

      await transaction.commit();
      console.log('✅ Academic Management module removed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error removing academic_management module:', error);
      throw error;
    }
  }
};
