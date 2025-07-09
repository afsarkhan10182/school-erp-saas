const { School, Branch, User } = require('../src/models');
const bcrypt = require('bcryptjs');
const { logger } = require('../src/utils/logger');

async function seedDemoData() {
  try {
    logger.info('Starting demo data seeding...');

    // Create demo schools
    const demoSchools = [
      {
        name: 'Demo School',
        code: 'DEMO001',
        email: 'info@demoschool.edu',
        phone: '+1234567890',
        address: '123 Education Street',
        city: 'Demo City',
        state: 'Demo State',
        country: 'Demo Country',
        postal_code: '12345',
        website: 'https://demoschool.edu',
        timezone: 'America/New_York',
        subscription_plan: 'premium',
        max_students: 1000,
        max_staff: 100,
        max_branches: 5,
        status: 'active',
        academic_year_start: '2024-06-01',
        academic_year_end: '2025-05-31',
        created_by: null, // Will be set to super admin
      },
      {
        name: 'Excellence Academy',
        code: 'EXCEL001',
        email: 'info@excellence.edu',
        phone: '+1987654321',
        address: '456 Learning Avenue',
        city: 'Excellence City',
        state: 'Excellence State',
        country: 'Excellence Country',
        postal_code: '54321',
        website: 'https://excellence.edu',
        timezone: 'America/Los_Angeles',
        subscription_plan: 'enterprise',
        max_students: 2000,
        max_staff: 200,
        max_branches: 10,
        status: 'active',
        academic_year_start: '2024-06-01',
        academic_year_end: '2025-05-31',
        created_by: null, // Will be set to super admin
      },
      {
        name: 'Future Leaders School',
        code: 'FUTURE001',
        email: 'info@futureleaders.edu',
        phone: '+1122334455',
        address: '789 Innovation Road',
        city: 'Future City',
        state: 'Future State',
        country: 'Future Country',
        postal_code: '67890',
        website: 'https://futureleaders.edu',
        timezone: 'America/Chicago',
        subscription_plan: 'basic',
        max_students: 500,
        max_staff: 50,
        max_branches: 2,
        status: 'active',
        academic_year_start: '2024-06-01',
        academic_year_end: '2025-05-31',
        created_by: null, // Will be set to super admin
      }
    ];

    // Get super admin user
    const superAdmin = await User.findOne({
      where: { role: 'super_admin' }
    });

    if (!superAdmin) {
      throw new Error('Super admin user not found. Please run init-db.js first.');
    }

    // Create schools
    const createdSchools = [];
    for (const schoolData of demoSchools) {
      schoolData.created_by = superAdmin.id;
      
      const existingSchool = await School.findOne({
        where: { code: schoolData.code }
      });

      if (existingSchool) {
        logger.info(`School ${schoolData.code} already exists, skipping...`);
        createdSchools.push(existingSchool);
        continue;
      }

      const school = await School.create(schoolData);
      createdSchools.push(school);
      logger.info(`Created school: ${school.name} (${school.code})`);
    }

    // Create demo branches for each school
    const demoBranches = [
      {
        name: 'Main Campus',
        code: 'MAIN',
        is_main_branch: true,
        principal_name: 'Dr. John Smith',
        principal_email: 'principal@demoschool.edu',
        principal_phone: '+1234567891',
      },
      {
        name: 'North Campus',
        code: 'NORTH',
        is_main_branch: false,
        principal_name: 'Dr. Sarah Johnson',
        principal_email: 'north.principal@demoschool.edu',
        principal_phone: '+1234567892',
      },
      {
        name: 'South Campus',
        code: 'SOUTH',
        is_main_branch: false,
        principal_name: 'Dr. Michael Brown',
        principal_email: 'south.principal@demoschool.edu',
        principal_phone: '+1234567893',
      }
    ];

    for (const school of createdSchools) {
      for (let i = 0; i < Math.min(demoBranches.length, school.max_branches); i++) {
        const branchData = {
          ...demoBranches[i],
          school_id: school.id,
          email: `branch${i + 1}@${school.code.toLowerCase()}.edu`,
          phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
          address: `${100 + i * 100} ${school.name} Street`,
          city: school.city,
          state: school.state,
          country: school.country,
          postal_code: school.postal_code,
          status: 'active',
          created_by: superAdmin.id,
        };

        const existingBranch = await Branch.findOne({
          where: { 
            code: branchData.code,
            school_id: school.id
          }
        });

        if (existingBranch) {
          logger.info(`Branch ${branchData.code} for school ${school.code} already exists, skipping...`);
          continue;
        }

        const branch = await Branch.create(branchData);
        logger.info(`Created branch: ${branch.name} (${branch.code}) for school: ${school.name}`);
      }
    }

    // Create additional school admin users
    const schoolAdmins = [
      {
        first_name: 'Alice',
        last_name: 'Johnson',
        email: 'alice.johnson@excellence.edu',
        password: 'School@123',
        role: 'school_admin',
        phone: '+1987654322',
        status: 'active',
      },
      {
        first_name: 'Bob',
        last_name: 'Wilson',
        email: 'bob.wilson@futureleaders.edu',
        password: 'School@123',
        role: 'school_admin',
        phone: '+1122334456',
        status: 'active',
      }
    ];

    for (const adminData of schoolAdmins) {
      const existingAdmin = await User.findOne({
        where: { email: adminData.email }
      });

      if (existingAdmin) {
        logger.info(`School admin ${adminData.email} already exists, skipping...`);
        continue;
      }

      // Find the corresponding school
      const school = await School.findOne({
        where: { 
          email: adminData.email.replace('@', '.') 
        }
      });

      if (!school) {
        logger.warn(`School not found for admin ${adminData.email}, skipping...`);
        continue;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminData.password, salt);

      const admin = await User.create({
        ...adminData,
        password: hashedPassword,
        school_id: school.id,
        created_by: superAdmin.id,
      });

      logger.info(`Created school admin: ${admin.first_name} ${admin.last_name} for school: ${school.name}`);
    }

    logger.info('Demo data seeding completed successfully!');
    
    // Log summary
    const schoolCount = await School.count();
    const branchCount = await Branch.count();
    const userCount = await User.count();
    
    logger.info(`Summary: ${schoolCount} schools, ${branchCount} branches, ${userCount} users`);

  } catch (error) {
    logger.error('Error seeding demo data:', error);
    throw error;
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedDemoData()
    .then(() => {
      logger.info('Demo data seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Demo data seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDemoData }; 