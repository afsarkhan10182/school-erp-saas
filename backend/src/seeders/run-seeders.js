const { seedModules } = require('./module-seeder');
const { seedSubscriptionPlans } = require('./subscription-plan-seeder');
const { logger } = require('../utils/logger');

async function runAllSeeders() {
  try {
    logger.info('🚀 Starting database seeding process...');
    
    // First seed modules
    logger.info('📦 Seeding modules...');
    await seedModules();
    
    // Then seed subscription plans (which depend on modules)
    logger.info('📋 Seeding subscription plans...');
    await seedSubscriptionPlans();
    
    logger.info('✅ All seeders completed successfully!');
    
  } catch (error) {
    logger.error('❌ Error running seeders:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runAllSeeders();
}

module.exports = { runAllSeeders };
