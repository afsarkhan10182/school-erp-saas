require('dotenv').config();
const { sequelize, User, School, Branch } = require('../src/models');
const { logger } = require('../src/utils/logger');
const bcrypt = require('bcryptjs');

const ROLES = User.ROLES;

const initDatabase = async () => {
  try {
    // Test the database connection
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');

    // Sync all models
    await sequelize.sync({ force: true });
    logger.info('Database synchronized');

    // Create a super admin user
    const hashedPassword = await bcrypt.hash('Admin@123', 12);
    
    const superAdmin = await User.create({
      email: 'superadmin@example.com',
      password: hashedPassword,
      first_name: 'Super',
      last_name: 'Admin',
      role: ROLES.SUPER_ADMIN,
      status: 'active',
      email_verified: true,
    });
    logger.info('Super admin user created successfully');
    logger.info(`Email: superadmin@example.com`);
    logger.info(`Password: Admin@123`);
    logger.info('Please change the password after first login.');

    // Create a sample school
    const school = await School.create({
      name: 'Demo School',
      code: 'DEMO',
      email: 'info@demoschool.edu',
      phone: '+1234567890',
      address: '123 Education St, Learning City',
      city: 'Education City',
      state: 'Knowledge State',
      country: 'India',
      postal_code: '123456',
      website: 'https://demoschool.edu',
      timezone: 'Asia/Kolkata',
      academic_year_start: new Date('2023-04-01'),
      academic_year_end: new Date('2024-03-31'),
      status: 'active',
      subscription_plan: 'premium',
      subscription_start_date: new Date(),
      subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      max_students: 1000,
      max_staff: 100,
      max_branches: 5,
      created_by: superAdmin.id,
    });

    // Create a main branch for the school
    const branch = await Branch.create({
      name: 'Main Campus',
      code: 'MAIN',
      email: 'main@demoschool.edu',
      phone: '+1234567890',
      address: '123 Education St, Learning City',
      city: 'Education City',
      state: 'Knowledge State',
      country: 'India',
      postal_code: '123456',
      principal_name: 'Dr. Principal',
      principal_email: 'principal@demoschool.edu',
      principal_phone: '+1234567891',
      is_main_branch: true,
      status: 'active',
      school_id: school.id,
      created_by: superAdmin.id,
    });

    // Create a school admin user
    const schoolAdminPassword = await bcrypt.hash('School@123', 12);
    await User.create({
      email: 'admin@demoschool.edu',
      password: schoolAdminPassword,
      first_name: 'School',
      last_name: 'Admin',
      role: ROLES.SCHOOL_ADMIN,
      status: 'active',
      email_verified: true,
      school_id: school.id,
      branch_id: branch.id,
      created_by: superAdmin.id,
    });

    logger.info('Sample school and admin user created successfully');
    logger.info(`School Admin Email: admin@demoschool.edu`);
    logger.info(`Password: School@123`);
    logger.info('Please change the password after first login.');

    process.exit(0);
  } catch (error) {
    logger.error('Error initializing database:', error);
    process.exit(1);
  }
};

initDatabase();
