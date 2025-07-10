const { sequelize } = require('../src/config/database');
const { SubscriptionPlan, User } = require('../src/models');
const { logger } = require('../src/utils/logger');

async function seedSubscriptionPlans() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established.');

    // Find a super admin user to set as created_by
    const superAdmin = await User.findOne({
      where: { role: 'super_admin' }
    });

    if (!superAdmin) {
      logger.error('No super admin user found. Please create a super admin first.');
      process.exit(1);
    }

    const defaultPlans = [
      {
        name: 'Free Trial',
        code: 'trial',
        description: 'Free trial plan for new schools',
        price: 0.00,
        currency: 'INR',
        billing_cycle: 'monthly',
        max_students: 50,
        max_staff: 10,
        max_branches: 1,
        modules: ['academics', 'attendance', 'fees'],
        features: {
          basic_support: true,
          email_notifications: true,
          basic_reports: true
        },
        is_active: true,
        is_popular: false,
        sort_order: 1,
        created_by: superAdmin.id,
        updated_by: superAdmin.id
      },
      {
        name: 'Basic Plan',
        code: 'basic',
        description: 'Basic plan for small schools',
        price: 999.00,
        currency: 'INR',
        billing_cycle: 'monthly',
        max_students: 200,
        max_staff: 25,
        max_branches: 2,
        modules: ['academics', 'attendance', 'fees', 'exams', 'library'],
        features: {
          basic_support: true,
          email_notifications: true,
          basic_reports: true,
          sms_notifications: true,
          advanced_reports: true
        },
        is_active: true,
        is_popular: true,
        sort_order: 2,
        created_by: superAdmin.id,
        updated_by: superAdmin.id
      },
      {
        name: 'Standard Plan',
        code: 'standard',
        description: 'Standard plan for medium schools',
        price: 1999.00,
        currency: 'INR',
        billing_cycle: 'monthly',
        max_students: 500,
        max_staff: 50,
        max_branches: 5,
        modules: ['academics', 'attendance', 'fees', 'exams', 'library', 'hostel', 'transport'],
        features: {
          priority_support: true,
          email_notifications: true,
          sms_notifications: true,
          advanced_reports: true,
          custom_reports: true,
          api_access: true
        },
        is_active: true,
        is_popular: false,
        sort_order: 3,
        created_by: superAdmin.id,
        updated_by: superAdmin.id
      },
      {
        name: 'Premium Plan',
        code: 'premium',
        description: 'Premium plan for large schools',
        price: 3999.00,
        currency: 'INR',
        billing_cycle: 'monthly',
        max_students: 1000,
        max_staff: 100,
        max_branches: 10,
        modules: ['academics', 'attendance', 'fees', 'exams', 'library', 'hostel', 'transport', 'hr', 'accounting'],
        features: {
          priority_support: true,
          email_notifications: true,
          sms_notifications: true,
          advanced_reports: true,
          custom_reports: true,
          api_access: true,
          white_label: true,
          custom_domain: true,
          dedicated_support: true
        },
        is_active: true,
        is_popular: false,
        sort_order: 4,
        created_by: superAdmin.id,
        updated_by: superAdmin.id
      },
      {
        name: 'Enterprise Plan',
        code: 'enterprise',
        description: 'Enterprise plan for large institutions',
        price: 9999.00,
        currency: 'INR',
        billing_cycle: 'monthly',
        max_students: 5000,
        max_staff: 500,
        max_branches: 50,
        modules: ['academics', 'attendance', 'fees', 'exams', 'library', 'hostel', 'transport', 'hr', 'accounting', 'alumni'],
        features: {
          priority_support: true,
          email_notifications: true,
          sms_notifications: true,
          advanced_reports: true,
          custom_reports: true,
          api_access: true,
          white_label: true,
          custom_domain: true,
          dedicated_support: true,
          custom_integrations: true,
          on_premise_option: true
        },
        is_active: true,
        is_popular: false,
        sort_order: 5,
        created_by: superAdmin.id,
        updated_by: superAdmin.id
      }
    ];

    for (const planData of defaultPlans) {
      const existingPlan = await SubscriptionPlan.findOne({
        where: { code: planData.code }
      });

      if (existingPlan) {
        logger.info(`Plan ${planData.name} already exists, skipping...`);
        continue;
      }

      await SubscriptionPlan.create(planData);
      logger.info(`Created subscription plan: ${planData.name}`);
    }

    logger.info('Subscription plans seeded successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding subscription plans:', error);
    process.exit(1);
  }
}

// Run the seed function
seedSubscriptionPlans(); 