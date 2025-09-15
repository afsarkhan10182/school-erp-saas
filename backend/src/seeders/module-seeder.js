const { Module } = require('~/models');
const { logger } = require('~/utils/shared/logger');

const defaultModules = [
  {
    code: 'students',
    name: 'Student Management',
    description: 'Admit students, manage profiles, class assignments, and student records',
    icon: '👥',
    category: 'academic',
    is_core: true,
    sort_order: 1,
    features: [
      'Student admission and registration',
      'Student profile management',
      'Class and section assignment',
      'Student records and history',
      'Bulk student import/export',
      'Student search and filtering'
    ],
    permissions: [
      'view_students',
      'create_students',
      'edit_students',
      'delete_students',
      'import_students',
      'export_students'
    ]
  },
  {
    code: 'fees',
    name: 'Fee Management',
    description: 'Fee types, structures, invoices, payments, and collections',
    icon: '💰',
    category: 'financial',
    is_core: true,
    sort_order: 2,
    features: [
      'Fee type management',
      'Fee structure creation',
      'Invoice generation',
      'Payment tracking',
      'Fee collection reports',
      'Online payment integration'
    ],
    permissions: [
      'view_fees',
      'create_fee_types',
      'edit_fee_structures',
      'generate_invoices',
      'record_payments',
      'view_fee_reports'
    ]
  },
  {
    code: 'attendance',
    name: 'Attendance Management',
    description: 'Track student and staff attendance with reports and notifications',
    icon: '📊',
    category: 'academic',
    is_core: false,
    sort_order: 3,
    features: [
      'Daily attendance tracking',
      'Attendance reports',
      'Absence notifications',
      'Attendance analytics',
      'Bulk attendance import',
      'Attendance history'
    ],
    permissions: [
      'view_attendance',
      'mark_attendance',
      'edit_attendance',
      'view_attendance_reports',
      'send_attendance_notifications'
    ]
  },
  {
    code: 'exams',
    name: 'Examination Management',
    description: 'Exam schedules, results, grades, and academic performance tracking',
    icon: '📝',
    category: 'academic',
    is_core: false,
    sort_order: 4,
    features: [
      'Exam schedule management',
      'Result entry and processing',
      'Grade calculation',
      'Performance analytics',
      'Report card generation',
      'Academic progress tracking'
    ],
    permissions: [
      'view_exams',
      'create_exam_schedules',
      'enter_results',
      'calculate_grades',
      'generate_report_cards',
      'view_performance_reports'
    ]
  },
  {
    code: 'library',
    name: 'Library Management',
    description: 'Book catalog, issue/return, fine management, and library reports',
    icon: '📚',
    category: 'academic',
    is_core: false,
    sort_order: 5,
    features: [
      'Book catalog management',
      'Book issue and return',
      'Fine calculation',
      'Library reports',
      'Book search',
      'Member management'
    ],
    permissions: [
      'view_library',
      'manage_books',
      'issue_books',
      'return_books',
      'calculate_fines',
      'view_library_reports'
    ]
  },
  {
    code: 'transport',
    name: 'Transport Management',
    description: 'Bus routes, vehicle management, student transportation tracking',
    icon: '🚌',
    category: 'administrative',
    is_core: false,
    sort_order: 6,
    features: [
      'Route management',
      'Vehicle tracking',
      'Student assignment',
      'Transport reports',
      'Driver management',
      'Route optimization'
    ],
    permissions: [
      'view_transport',
      'manage_routes',
      'assign_students',
      'track_vehicles',
      'view_transport_reports'
    ]
  },
  {
    code: 'hr',
    name: 'Human Resources',
    description: 'Staff management, payroll, leave management, and HR reports',
    icon: '👨‍💼',
    category: 'administrative',
    is_core: false,
    sort_order: 7,
    features: [
      'Staff profile management',
      'Payroll processing',
      'Leave management',
      'Performance evaluation',
      'HR reports',
      'Staff attendance'
    ],
    permissions: [
      'view_hr',
      'manage_staff',
      'process_payroll',
      'manage_leave',
      'evaluate_performance',
      'view_hr_reports'
    ]
  },
  {
    code: 'reports',
    name: 'Advanced Reports',
    description: 'Comprehensive analytics, custom reports, and data export',
    icon: '📈',
    category: 'reporting',
    is_core: false,
    sort_order: 8,
    features: [
      'Custom report builder',
      'Data analytics',
      'Export capabilities',
      'Dashboard creation',
      'Scheduled reports',
      'Performance metrics'
    ],
    permissions: [
      'view_reports',
      'create_custom_reports',
      'export_data',
      'view_analytics',
      'schedule_reports'
    ]
  },
  {
    code: 'settings',
    name: 'System Settings',
    description: 'School configuration, user management, and system preferences',
    icon: '⚙️',
    category: 'administrative',
    is_core: true,
    sort_order: 9,
    features: [
      'School configuration',
      'User management',
      'Role and permissions',
      'System preferences',
      'Backup and restore',
      'System monitoring'
    ],
    permissions: [
      'view_settings',
      'manage_users',
      'manage_roles',
      'configure_system',
      'manage_backups',
      'view_system_logs'
    ]
  }
];

/**
 * Seed modules into the database
 * This function is idempotent - safe to run multiple times
 */
async function seedModules() {
  try {
    logger.info('🌱 Starting module seeding process...');

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const moduleData of defaultModules) {
      try {
        const existingModule = await Module.findOne({
          where: { code: moduleData.code }
        });

        if (!existingModule) {
          // Create new module
          await Module.create(moduleData);
          logger.info(`✅ Created module: ${moduleData.name} (${moduleData.code})`);
          createdCount++;
        } else {
          // Update existing module if needed (for version updates)
          const needsUpdate =
            existingModule.name !== moduleData.name ||
            existingModule.description !== moduleData.description ||
            existingModule.icon !== moduleData.icon ||
            existingModule.category !== moduleData.category ||
            existingModule.is_core !== moduleData.is_core ||
            existingModule.sort_order !== moduleData.sort_order ||
            JSON.stringify(existingModule.features) !== JSON.stringify(moduleData.features) ||
            JSON.stringify(existingModule.permissions) !== JSON.stringify(moduleData.permissions);

          if (needsUpdate) {
            await existingModule.update(moduleData);
            logger.info(`🔄 Updated module: ${moduleData.name} (${moduleData.code})`);
            updatedCount++;
          } else {
            logger.debug(
              `⏭️  Module already exists and up-to-date: ${moduleData.name} (${moduleData.code})`
            );
            skippedCount++;
          }
        }
      } catch (error) {
        logger.error(`❌ Error processing module ${moduleData.code}:`, error.message);
        throw error;
      }
    }

    logger.info(
      `🎉 Module seeding completed! Created: ${createdCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}`
    );

    return {
      success: true,
      created: createdCount,
      updated: updatedCount,
      skipped: skippedCount,
      total: defaultModules.length
    };
  } catch (error) {
    logger.error('❌ Error seeding modules:', error);
    throw error;
  }
}

/**
 * Reset modules to default state (for testing/development)
 * WARNING: This will delete all custom modules and reset to defaults
 */
async function resetModules() {
  try {
    logger.warn('⚠️  Resetting all modules to default state...');

    // Delete all existing modules
    await Module.destroy({ where: {} });
    logger.info('🗑️  Deleted all existing modules');

    // Re-seed with defaults
    const result = await seedModules();
    logger.info('✅ Modules reset completed');

    return result;
  } catch (error) {
    logger.error('❌ Error resetting modules:', error);
    throw error;
  }
}

/**
 * Check if modules are seeded
 */
async function checkModulesSeeded() {
  try {
    const moduleCount = await Module.count();
    const expectedCount = defaultModules.length;

    return {
      seeded: moduleCount >= expectedCount,
      count: moduleCount,
      expected: expectedCount
    };
  } catch (error) {
    logger.error('❌ Error checking module seeding status:', error);
    throw error;
  }
}

// Export functions for use in CLI or other scripts
module.exports = {
  seedModules,
  resetModules,
  checkModulesSeeded,
  defaultModules
};

// Run seeder if this file is executed directly
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'seed':
      seedModules()
        .then(result => {
          process.exit(0);
        })
        .catch(error => {
          console.error('❌ Seeding failed:', error.message);
          process.exit(1);
        });
      break;

    case 'reset':
      resetModules()
        .then(result => {
          process.exit(0);
        })
        .catch(error => {
          console.error('❌ Reset failed:', error.message);
          process.exit(1);
        });
      break;

    case 'check':
      checkModulesSeeded()
        .then(result => {
          process.exit(result.seeded ? 0 : 1);
        })
        .catch(error => {
          console.error('❌ Check failed:', error.message);
          process.exit(1);
        });
      break;

    default:
      console.log(`
🌱 Module Seeder - Usage:
  node module-seeder.js seed    - Seed modules (safe to run multiple times)
  node module-seeder.js reset   - Reset all modules to defaults (WARNING: destructive)
  node module-seeder.js check   - Check if modules are properly seeded`);

      process.exit(0);
  }
}
