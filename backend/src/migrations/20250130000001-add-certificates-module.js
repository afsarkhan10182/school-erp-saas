'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Insert the certificates module
      const [moduleResult] = await queryInterface.bulkInsert(
        'modules',
        [
          {
            id: Sequelize.literal('gen_random_uuid()'),
            code: 'certificates',
            name: 'Certificate Management',
            description:
              'Complete certificate management system for generating and managing student and employee certificates with customizable templates',
            icon: '🏆',
            features: JSON.stringify([
              'Certificate Template Management',
              'Student Certificate Generation',
              'Employee Certificate Generation',
              'Customizable Templates',
              'QR Code Integration',
              'Background Image Support',
              'Digital Signatures',
              'Print-Ready Output'
            ]),
            category: 'administrative',
            is_active: true,
            is_core: false,
            sort_order: 15,
            version: '1.0.0',
            dependencies: JSON.stringify([]),
            permissions: JSON.stringify([
              'manage_certificate_templates',
              'generate_student_certificates',
              'generate_employee_certificates',
              'view_certificate_templates',
              'delete_certificate_templates',
              'edit_certificate_templates'
            ]),
            created_at: new Date(),
            updated_at: new Date()
          }
        ],
        { transaction }
      );

      // Get the module ID
      const [moduleRecord] = await queryInterface.sequelize.query(
        `SELECT id FROM modules WHERE code = 'certificates'`,
        { transaction }
      );

      if (moduleRecord.length === 0) {
        throw new Error('Failed to create certificates module');
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
        sort_order: 15,
        created_at: new Date(),
        updated_at: new Date()
      }));

      if (planModules.length > 0) {
        await queryInterface.bulkInsert('plan_modules', planModules, { transaction });
      }

      await transaction.commit();
      console.log('✅ Certificates module created successfully');
      console.log(`📋 Added to ${plans.length} subscription plans`);
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error creating certificates module:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Get the module ID
      const [moduleRecord] = await queryInterface.sequelize.query(
        `SELECT id FROM modules WHERE code = 'certificates'`,
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
      console.log('✅ Certificates module removed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error removing certificates module:', error);
      throw error;
    }
  }
};
