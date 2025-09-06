const { SubscriptionPlan, Module, PlanModule } = require('../models');
const { logger } = require('../utils/logger');

const defaultPlans = [
  {
    name: 'Trial',
    code: 'trial',
    description: 'Free trial with basic features',
    price: 0.00,
    currency: 'INR',
    billing_cycle: 'monthly',
    max_students: 50,
    max_staff: 10,
    max_branches: 1,
    is_active: true,
    is_popular: false,
    sort_order: 1,
    features: {
      description: 'Perfect for trying out the system',
      highlights: ['Basic student management', 'Fee management', '30-day trial']
    },
    modules: ['students', 'fees', 'settings'] // Core modules only
  },
  {
    name: 'Basic',
    code: 'basic',
    description: 'Essential school management features',
    price: 999.00,
    currency: 'INR',
    billing_cycle: 'yearly',
    max_students: 200,
    max_staff: 25,
    max_branches: 2,
    is_active: true,
    is_popular: false,
    sort_order: 2,
    features: {
      description: 'Essential features for small schools',
      highlights: ['Student management', 'Fee management', 'Basic reports', 'System settings']
    },
    modules: ['students', 'fees', 'settings', 'reports']
  },
  {
    name: 'Premium',
    code: 'premium',
    description: 'Advanced features for growing schools',
    price: 1999.00,
    currency: 'INR',
    billing_cycle: 'yearly',
    max_students: 500,
    max_staff: 50,
    max_branches: 5,
    is_active: true,
    is_popular: true,
    sort_order: 3,
    features: {
      description: 'Advanced features for growing schools',
      highlights: ['All Basic features', 'Attendance management', 'Examination system', 'Advanced reports']
    },
    modules: ['students', 'fees', 'attendance', 'exams', 'settings', 'reports']
  },
  {
    name: 'Enterprise',
    code: 'enterprise',
    description: 'Complete school management solution',
    price: 4999.00,
    currency: 'INR',
    billing_cycle: 'yearly',
    max_students: -1, // Unlimited
    max_staff: -1, // Unlimited
    max_branches: -1, // Unlimited
    is_active: true,
    is_popular: false,
    sort_order: 4,
    features: {
      description: 'Complete solution for large schools',
      highlights: ['All Premium features', 'HR management', 'Transport management', 'Library management', 'Priority support']
    },
    modules: ['students', 'fees', 'attendance', 'exams', 'hr', 'transport', 'library', 'settings', 'reports']
  },
  {
    name: 'Lifetime',
    code: 'lifetime',
    description: 'Lifetime plan with unlimited access',
    price: 4999.00,
    currency: 'INR',
    billing_cycle: 'lifetime',
    max_students: -1, // Unlimited
    max_staff: -1, // Unlimited
    max_branches: -1, // Unlimited
    is_active: true,
    is_popular: false,
    sort_order: 5,
    features: {
      description: 'One-time payment for lifetime access',
      highlights: ['All Enterprise features', 'Lifetime access', 'All future updates', 'Priority support']
    },
    modules: ['students', 'fees', 'attendance', 'exams', 'hr', 'transport', 'library', 'settings', 'reports'] // All modules
  }
];

/**
 * Seed subscription plans into the database
 * This function is idempotent - safe to run multiple times
 */
async function seedSubscriptionPlans() {
  try {
    logger.info('🌱 Starting subscription plan seeding process...');
    
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const planData of defaultPlans) {
      try {
        const { modules, ...planFields } = planData;
        
        // Check if plan already exists
        const existingPlan = await SubscriptionPlan.findOne({
          where: { code: planData.code }
        });
        
        if (!existingPlan) {
          // Create new plan
          const plan = await SubscriptionPlan.create({
            ...planFields,
            created_by: null, // System seeder
            updated_by: null
          });
          
          // Create plan-module relationships
          if (modules && modules.length > 0) {
            const moduleRecords = await Module.findAll({
              where: { 
                code: modules,
                is_active: true 
              }
            });
            
            const planModules = moduleRecords.map((module, index) => ({
              subscription_plan_id: plan.id,
              module_id: module.id,
              is_required: module.is_core,
              is_enabled: true,
              sort_order: index + 1,
              created_by: null,
              updated_by: null
            }));
            
            await PlanModule.bulkCreate(planModules);
          }
          
          logger.info(`✅ Created plan: ${planData.name} (${planData.code}) with ${modules.length} modules`);
          createdCount++;
        } else {
          // Update existing plan if needed
          const needsUpdate = 
            existingPlan.name !== planData.name ||
            existingPlan.description !== planData.description ||
            existingPlan.price !== planData.price ||
            existingPlan.max_students !== planData.max_students ||
            existingPlan.max_staff !== planData.max_staff ||
            existingPlan.max_branches !== planData.max_branches ||
            existingPlan.is_popular !== planData.is_popular ||
            existingPlan.sort_order !== planData.sort_order;
          
          if (needsUpdate) {
            await existingPlan.update(planFields);
            logger.info(`🔄 Updated plan: ${planData.name} (${planData.code})`);
            updatedCount++;
          } else {
            logger.debug(`⏭️  Plan already exists and up-to-date: ${planData.name} (${planData.code})`);
            skippedCount++;
          }
          
          // Update plan-module relationships if modules changed
          if (modules && modules.length > 0) {
            const moduleRecords = await Module.findAll({
              where: { 
                code: modules,
                is_active: true 
              }
            });
            
            // Remove existing plan-module relationships
            await PlanModule.destroy({
              where: { subscription_plan_id: existingPlan.id }
            });
            
            // Create new plan-module relationships
            const planModules = moduleRecords.map((module, index) => ({
              subscription_plan_id: existingPlan.id,
              module_id: module.id,
              is_required: module.is_core,
              is_enabled: true,
              sort_order: index + 1,
              created_by: null,
              updated_by: null
            }));
            
            await PlanModule.bulkCreate(planModules);
            logger.info(`🔄 Updated plan-module relationships for: ${planData.name} (${planData.code})`);
          }
        }
      } catch (error) {
        logger.error(`❌ Error processing plan ${planData.code}:`, error.message);
        throw error;
      }
    }
    
    logger.info(`✅ Subscription plan seeding completed: ${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped`);
    
  } catch (error) {
    logger.error('❌ Error in subscription plan seeding:', error);
    throw error;
  }
}

module.exports = { seedSubscriptionPlans };
