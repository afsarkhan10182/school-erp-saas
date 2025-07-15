'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const saltRounds = 10;

    // Helper function to hash passwords
    const hashPassword = async (password) => {
      return await bcrypt.hash(password, saltRounds);
    };

    // Generate UUIDs for entities
    const superAdminId = uuidv4();
    const schoolAdminId = uuidv4();
    const branchAdminId = uuidv4();
    const teacherId1 = uuidv4();
    const teacherId2 = uuidv4();
    const accountantId = uuidv4();
    const receptionistId = uuidv4();
    const librarianId = uuidv4();

    const schoolId = uuidv4();
    const branchId1 = uuidv4();
    const branchId2 = uuidv4();

    const academicYearId = uuidv4();
    const classIds = Array(12).fill().map(() => uuidv4());
    const sectionIds = Array(24).fill().map(() => uuidv4());
    
    const subscriptionPlanIds = Array(4).fill().map(() => uuidv4());
    const feeTypeIds = Array(8).fill().map(() => uuidv4());
    const feeStructureIds = Array(3).fill().map(() => uuidv4());

    const studentIds = Array(20).fill().map(() => uuidv4());
    const parentIds = Array(20).fill().map(() => uuidv4());
    const admissionIds = Array(5).fill().map(() => uuidv4());

    // 1. Insert Subscription Plans (no dependencies)
    await queryInterface.bulkInsert('subscription_plans', [
      {
        id: subscriptionPlanIds[0],
        name: 'Starter Plan',
        code: 'STARTER',
        description: 'Perfect for small schools with basic requirements',
        price: 5000.00,
        currency: 'INR',
        billing_cycle: 'monthly',
        max_students: 100,
        max_staff: 10,
        max_branches: 1,
        modules: ['academics', 'attendance', 'fees'],
        features: JSON.stringify({
          'student_management': true,
          'fee_management': true,
          'attendance': true,
          'basic_reports': true,
          'sms_notifications': 100,
          'email_notifications': 500,
          'storage_gb': 1
        }),
        is_active: true,
        is_popular: false,
        sort_order: 1,
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: subscriptionPlanIds[1],
        name: 'Professional Plan',
        code: 'PROFESSIONAL',
        description: 'Ideal for medium-sized schools with advanced features',
        price: 12000.00,
        currency: 'INR',
        billing_cycle: 'monthly',
        max_students: 500,
        max_staff: 50,
        max_branches: 3,
        modules: ['academics', 'attendance', 'fees', 'exams', 'library', 'transport'],
        features: JSON.stringify({
          'student_management': true,
          'fee_management': true,
          'attendance': true,
          'exam_management': true,
          'library_management': true,
          'transport_management': true,
          'advanced_reports': true,
          'sms_notifications': 1000,
          'email_notifications': 2000,
          'storage_gb': 10,
          'mobile_app': true
        }),
        is_active: true,
        is_popular: true,
        sort_order: 2,
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: subscriptionPlanIds[2],
        name: 'Enterprise Plan',
        code: 'ENTERPRISE',
        description: 'Complete solution for large schools and institutions',
        price: 25000.00,
        currency: 'INR',
        billing_cycle: 'monthly',
        max_students: 2000,
        max_staff: 200,
        max_branches: 10,
        modules: ['academics', 'attendance', 'fees', 'exams', 'library', 'transport', 'hr', 'finance', 'alumni'],
        features: JSON.stringify({
          'student_management': true,
          'fee_management': true,
          'attendance': true,
          'exam_management': true,
          'library_management': true,
          'transport_management': true,
          'hr_management': true,
          'finance_management': true,
          'alumni_management': true,
          'advanced_reports': true,
          'custom_reports': true,
          'api_access': true,
          'sms_notifications': 'unlimited',
          'email_notifications': 'unlimited',
          'storage_gb': 100,
          'mobile_app': true,
          'white_label': true
        }),
        is_active: true,
        is_popular: false,
        sort_order: 3,
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: subscriptionPlanIds[3],
        name: 'Trial Plan',
        code: 'TRIAL',
        description: '30-day free trial for new schools',
        price: 0.00,
        currency: 'INR',
        billing_cycle: 'monthly',
        max_students: 50,
        max_staff: 5,
        max_branches: 1,
        modules: ['academics', 'attendance', 'fees'],
        features: JSON.stringify({
          'student_management': true,
          'fee_management': true,
          'attendance': true,
          'basic_reports': true,
          'sms_notifications': 50,
          'email_notifications': 100,
          'storage_gb': 0.5,
          'trial_period_days': 30
        }),
        is_active: true,
        is_popular: false,
        sort_order: 0,
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // 2. Insert Schools (depends on subscription plans)
    await queryInterface.bulkInsert('schools', [
      {
        id: schoolId,
        name: 'Huda International School',
        code: 'HUDA',
        email: 'info@huda.edu',
        phone: '+91-124-4567890',
        address: 'Sector 14, Huda City Centre',
        city: 'Gurugram',
        state: 'Haryana',
        country: 'India',
        postal_code: '122001',
        website: 'https://www.huda.edu',
        timezone: 'Asia/Kolkata',
        locale: 'en-IN',
        currency: 'INR',
        date_format: 'DD/MM/YYYY',
        time_format: '12h',
        status: 'active',
        settings: JSON.stringify({
          'academic_year_start': 'April',
          'working_days': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          'school_timing': {
            'start': '08:00',
            'end': '14:30'
          },
          'uniform_required': true,
          'transport_available': true
        }),
        subscription_plan: 'PROFESSIONAL',
        subscription_start_date: new Date('2024-01-01'),
        subscription_end_date: new Date('2024-12-31'),
        max_students: 500,
        max_staff: 50,
        max_branches: 3,
        modules: ['academics', 'attendance', 'fees', 'exams', 'library', 'transport'],
        is_active: true,
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // 3. Insert Branches (depends on schools)
    await queryInterface.bulkInsert('branches', [
      {
        id: branchId1,
        name: 'Main Campus',
        code: 'MAIN',
        email: 'main@huda.edu',
        phone: '+91-124-4567890',
        address: 'Sector 14, Huda City Centre',
        city: 'Gurugram',
        state: 'Haryana',
        country: 'India',
        postal_code: '122001',
        principal_name: 'Dr. Rajesh Kumar',
        principal_email: 'principal@huda.edu',
        principal_phone: '+91-9876543211',
        is_main_branch: true,
        status: 'active',
        settings: JSON.stringify({
          'campus_area': '5 acres',
          'building_floors': 4,
          'total_classrooms': 30,
          'labs': ['Physics', 'Chemistry', 'Biology', 'Computer', 'Math'],
          'playground': true,
          'library': true,
          'cafeteria': true
        }),
        school_id: schoolId,
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: branchId2,
        name: 'Cyber City Campus',
        code: 'CYBER',
        email: 'cyber@huda.edu',
        phone: '+91-124-4567891',
        address: 'DLF Cyber City, Phase 2',
        city: 'Gurugram',
        state: 'Haryana',
        country: 'India',
        postal_code: '122002',
        principal_name: 'Mrs. Priya Sharma',
        principal_email: 'cyber.principal@huda.edu',
        principal_phone: '+91-9876543212',
        is_main_branch: false,
        status: 'active',
        settings: JSON.stringify({
          'campus_area': '3 acres',
          'building_floors': 3,
          'total_classrooms': 20,
          'labs': ['Computer', 'Math', 'Science'],
          'playground': true,
          'library': true
        }),
        school_id: schoolId,
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // 4. Insert Users (depends on schools and branches)
    await queryInterface.bulkInsert('users', [
      {
        id: superAdminId,
        email: 'superadmin@example.com',
        password: await hashPassword('Admin@123'),
        first_name: 'Super',
        last_name: 'Admin',
        phone: '+91-9876543210',
        role: 'super_admin',
        permissions: '{all}',
        status: 'active',
        email_verified: true,
        settings: JSON.stringify({ theme: 'dark', language: 'en' }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: schoolAdminId,
        email: 'admin@huda.edu',
        password: await hashPassword('School@123'),
        first_name: 'Rajesh',
        last_name: 'Kumar',
        phone: '+91-9876543211',
        role: 'school_admin',
        permissions: '{school_management,user_management,academic_management}',
        status: 'active',
        email_verified: true,
        school_id: schoolId,
        settings: JSON.stringify({ theme: 'light', language: 'en' }),
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: branchAdminId,
        email: 'branch.admin@huda.edu',
        password: await hashPassword('Branch@123'),
        first_name: 'Priya',
        last_name: 'Sharma',
        phone: '+91-9876543212',
        role: 'branch_admin',
        permissions: '{branch_management,student_management,academic_management}',
        status: 'active',
        email_verified: true,
        school_id: schoolId,
        branch_id: branchId1,
        settings: JSON.stringify({ theme: 'light', language: 'en' }),
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: teacherId1,
        email: 'teacher1@huda.edu',
        password: await hashPassword('Teacher@123'),
        first_name: 'Anjali',
        last_name: 'Verma',
        phone: '+91-9876543213',
        role: 'teacher',
        permissions: '{student_management,attendance,assignments}',
        status: 'active',
        email_verified: true,
        school_id: schoolId,
        branch_id: branchId1,
        settings: JSON.stringify({ theme: 'light', language: 'en' }),
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: teacherId2,
        email: 'teacher2@huda.edu',
        password: await hashPassword('Teacher@123'),
        first_name: 'Vikram',
        last_name: 'Singh',
        phone: '+91-9876543214',
        role: 'teacher',
        permissions: '{student_management,attendance,assignments}',
        status: 'active',
        email_verified: true,
        school_id: schoolId,
        branch_id: branchId1,
        settings: JSON.stringify({ theme: 'dark', language: 'en' }),
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: accountantId,
        email: 'accountant@huda.edu',
        password: await hashPassword('Account@123'),
        first_name: 'Suresh',
        last_name: 'Gupta',
        phone: '+91-9876543215',
        role: 'accountant',
        permissions: '{fee_management,reports,financial_reports}',
        status: 'active',
        email_verified: true,
        school_id: schoolId,
        branch_id: branchId1,
        settings: JSON.stringify({ theme: 'light', language: 'en' }),
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: receptionistId,
        email: 'reception@huda.edu',
        password: await hashPassword('Reception@123'),
        first_name: 'Meera',
        last_name: 'Joshi',
        phone: '+91-9876543216',
        role: 'receptionist',
        permissions: '{visitor_management,admission_management,basic_reports}',
        status: 'active',
        email_verified: true,
        school_id: schoolId,
        branch_id: branchId1,
        settings: JSON.stringify({ theme: 'light', language: 'en' }),
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: librarianId,
        email: 'librarian@huda.edu',
        password: await hashPassword('Library@123'),
        first_name: 'Deepak',
        last_name: 'Mishra',
        phone: '+91-9876543217',
        role: 'librarian',
        permissions: '{library_management,book_management,student_records}',
        status: 'active',
        email_verified: true,
        school_id: schoolId,
        branch_id: branchId1,
        settings: JSON.stringify({ theme: 'dark', language: 'en' }),
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // 5. Insert Academic Years (depends on users)
    await queryInterface.bulkInsert('academic_years', [
      {
        id: academicYearId,
        name: '2024-25',
        code: '2024-25',
        start_date: '2024-04-01',
        end_date: '2025-03-31',
        is_current: true,
        status: 'active',
        description: 'Academic year 2024-25',
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // 6. Insert Classes (depends on schools/branches)
    const classes = [
      { name: 'Nursery', code: 'NUR', numeric_value: 0, capacity: 25 },
      { name: 'KG', code: 'KG', numeric_value: 0, capacity: 25 },
      { name: 'Class I', code: 'I', numeric_value: 1, capacity: 30 },
      { name: 'Class II', code: 'II', numeric_value: 2, capacity: 30 },
      { name: 'Class III', code: 'III', numeric_value: 3, capacity: 30 },
      { name: 'Class IV', code: 'IV', numeric_value: 4, capacity: 30 },
      { name: 'Class V', code: 'V', numeric_value: 5, capacity: 30 },
      { name: 'Class VI', code: 'VI', numeric_value: 6, capacity: 35 },
      { name: 'Class VII', code: 'VII', numeric_value: 7, capacity: 35 },
      { name: 'Class VIII', code: 'VIII', numeric_value: 8, capacity: 35 },
      { name: 'Class IX', code: 'IX', numeric_value: 9, capacity: 40 },
      { name: 'Class X', code: 'X', numeric_value: 10, capacity: 40 }
    ];

    await queryInterface.bulkInsert('classes', classes.map((cls, index) => ({
      id: classIds[index],
      name: cls.name,
      code: cls.code,
      numeric_value: cls.numeric_value,
      description: `${cls.name} - Following CBSE curriculum`,
      capacity: cls.capacity,
      sort_order: index,
      is_active: true,
      school_id: schoolId,
      branch_id: branchId1,
      created_by: null,
      created_at: new Date(),
      updated_at: new Date()
    })));

    // 7. Insert Sections (depends on classes/users for teacher assignment)
    const sections = [];
    for (let i = 0; i < 12; i++) {
      sections.push({
        id: sectionIds[i * 2],
        name: 'A',
        capacity: classes[i].capacity,
        current_strength: Math.floor(Math.random() * classes[i].capacity * 0.8),
        is_active: true,
        class_id: classIds[i],
        class_teacher_id: i % 2 === 0 ? teacherId1 : teacherId2,
        school_id: schoolId,
        branch_id: branchId1,
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      if (i >= 2) { // Only add section B for Class I and above
        sections.push({
          id: sectionIds[i * 2 + 1],
          name: 'B',
          capacity: classes[i].capacity,
          current_strength: Math.floor(Math.random() * classes[i].capacity * 0.7),
          is_active: true,
          class_id: classIds[i],
          class_teacher_id: i % 2 === 0 ? teacherId2 : teacherId1,
          school_id: schoolId,
          branch_id: branchId1,
          created_by: null,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }

    await queryInterface.bulkInsert('sections', sections);

    // 8. Insert Fee Types (depends on schools/users)
    const feeTypes = [
      { name: 'Tuition Fee', code: 'TUITION', category: 'tuition', frequency: 'monthly', is_refundable: false, is_optional: false },
      { name: 'Admission Fee', code: 'ADMISSION', category: 'admission', frequency: 'yearly', is_refundable: false, is_optional: false },
      { name: 'Development Fee', code: 'DEVELOPMENT', category: 'development', frequency: 'yearly', is_refundable: false, is_optional: false },
      { name: 'Transport Fee', code: 'TRANSPORT', category: 'transport', frequency: 'monthly', is_refundable: true, is_optional: true },
      { name: 'Library Fee', code: 'LIBRARY', category: 'library', frequency: 'yearly', is_refundable: false, is_optional: false },
      { name: 'Lab Fee', code: 'LAB', category: 'lab', frequency: 'yearly', is_refundable: false, is_optional: false },
      { name: 'Sports Fee', code: 'SPORTS', category: 'sports', frequency: 'yearly', is_refundable: false, is_optional: true },
      { name: 'Exam Fee', code: 'EXAM', category: 'exam', frequency: 'termly', is_refundable: false, is_optional: false }
    ];

    await queryInterface.bulkInsert('fee_types', feeTypes.map((feeType, index) => ({
      id: feeTypeIds[index],
      name: feeType.name,
      code: feeType.code,
      description: `${feeType.name} for students`,
      category: feeType.category,
      frequency: feeType.frequency,
      is_refundable: feeType.is_refundable,
      is_optional: feeType.is_optional,
      is_active: true,
      school_id: schoolId,
      created_by: null,
      created_at: new Date(),
      updated_at: new Date()
    })));

    // 9. Insert Fee Structures (depends on schools/users)
    await queryInterface.bulkInsert('fee_structures', [
      {
        id: feeStructureIds[0],
        name: 'Primary Section Fee Structure',
        description: 'Fee structure for classes Nursery to V',
        academic_year: '2024-25',
        is_active: true,
        structure_data: JSON.stringify({
          'applicable_classes': ['NUR', 'KG', 'I', 'II', 'III', 'IV', 'V'],
          'fees': {
            'TUITION': { amount: 5000, frequency: 'monthly' },
            'ADMISSION': { amount: 15000, frequency: 'yearly' },
            'DEVELOPMENT': { amount: 10000, frequency: 'yearly' },
            'TRANSPORT': { amount: 2000, frequency: 'monthly', optional: true },
            'LIBRARY': { amount: 2000, frequency: 'yearly' },
            'SPORTS': { amount: 1500, frequency: 'yearly', optional: true },
            'EXAM': { amount: 1000, frequency: 'termly' }
          }
        }),
        school_id: schoolId,
        branch_id: branchId1,
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: feeStructureIds[1],
        name: 'Middle Section Fee Structure',
        description: 'Fee structure for classes VI to VIII',
        academic_year: '2024-25',
        is_active: true,
        structure_data: JSON.stringify({
          'applicable_classes': ['VI', 'VII', 'VIII'],
          'fees': {
            'TUITION': { amount: 7000, frequency: 'monthly' },
            'ADMISSION': { amount: 20000, frequency: 'yearly' },
            'DEVELOPMENT': { amount: 12000, frequency: 'yearly' },
            'TRANSPORT': { amount: 2500, frequency: 'monthly', optional: true },
            'LIBRARY': { amount: 3000, frequency: 'yearly' },
            'LAB': { amount: 4000, frequency: 'yearly' },
            'SPORTS': { amount: 2000, frequency: 'yearly', optional: true },
            'EXAM': { amount: 1500, frequency: 'termly' }
          }
        }),
        school_id: schoolId,
        branch_id: branchId1,
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: feeStructureIds[2],
        name: 'Secondary Section Fee Structure',
        description: 'Fee structure for classes IX to X',
        academic_year: '2024-25',
        is_active: true,
        structure_data: JSON.stringify({
          'applicable_classes': ['IX', 'X'],
          'fees': {
            'TUITION': { amount: 10000, frequency: 'monthly' },
            'ADMISSION': { amount: 25000, frequency: 'yearly' },
            'DEVELOPMENT': { amount: 15000, frequency: 'yearly' },
            'TRANSPORT': { amount: 3000, frequency: 'monthly', optional: true },
            'LIBRARY': { amount: 4000, frequency: 'yearly' },
            'LAB': { amount: 6000, frequency: 'yearly' },
            'SPORTS': { amount: 2500, frequency: 'yearly', optional: true },
            'EXAM': { amount: 2000, frequency: 'termly' }
          }
        }),
        school_id: schoolId,
        branch_id: branchId1,
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // 10. Insert Sample Parents (depends on schools/branches/users)
    const parentNames = [
      { father: 'Ramesh Kumar', mother: 'Sunita Kumar', occupation_f: 'Engineer', occupation_m: 'Teacher' },
      { father: 'Sunil Sharma', mother: 'Kavita Sharma', occupation_f: 'Doctor', occupation_m: 'Homemaker' },
      { father: 'Anil Gupta', mother: 'Pooja Gupta', occupation_f: 'Business', occupation_m: 'Nurse' },
      { father: 'Vikash Singh', mother: 'Neha Singh', occupation_f: 'CA', occupation_m: 'Lawyer' },
      { father: 'Rohit Verma', mother: 'Priya Verma', occupation_f: 'Manager', occupation_m: 'Designer' },
      { father: 'Sanjay Joshi', mother: 'Meera Joshi', occupation_f: 'Consultant', occupation_m: 'Teacher' },
      { father: 'Deepak Mishra', mother: 'Ritu Mishra', occupation_f: 'Pilot', occupation_m: 'Doctor' },
      { father: 'Manoj Agarwal', mother: 'Sushma Agarwal', occupation_f: 'Banker', occupation_m: 'Homemaker' },
      { father: 'Rajesh Yadav', mother: 'Anita Yadav', occupation_f: 'Police', occupation_m: 'Pharmacist' },
      { father: 'Ashok Tiwari', mother: 'Geeta Tiwari', occupation_f: 'Professor', occupation_m: 'Professor' },
      { father: 'Suresh Pandey', mother: 'Kiran Pandey', occupation_f: 'IAS Officer', occupation_m: 'Social Worker' },
      { father: 'Ravi Dubey', mother: 'Shweta Dubey', occupation_f: 'IT Professional', occupation_m: 'IT Professional' },
      { father: 'Amit Saxena', mother: 'Rekha Saxena', occupation_f: 'Advocate', occupation_m: 'Judge' },
      { father: 'Vinod Chandra', mother: 'Usha Chandra', occupation_f: 'Businessman', occupation_m: 'Artist' },
      { father: 'Naresh Goyal', mother: 'Seema Goyal', occupation_f: 'Chartered Accountant', occupation_m: 'Interior Designer' },
      { father: 'Dinesh Kapoor', mother: 'Asha Kapoor', occupation_f: 'Government Officer', occupation_m: 'Music Teacher' },
      { father: 'Mukesh Arora', mother: 'Vandana Arora', occupation_f: 'Software Engineer', occupation_m: 'HR Manager' },
      { father: 'Yogesh Malhotra', mother: 'Sangeeta Malhotra', occupation_f: 'Entrepreneur', occupation_m: 'Psychologist' },
      { father: 'Pankaj Sethi', mother: 'Nidhi Sethi', occupation_f: 'Marketing Manager', occupation_m: 'Fashion Designer' },
      { father: 'Rakesh Bhatia', mother: 'Simran Bhatia', occupation_f: 'Civil Engineer', occupation_m: 'Architect' }
    ];

    await queryInterface.bulkInsert('parents', parentNames.map((parent, index) => ({
      id: parentIds[index],
      father_name: parent.father,
      father_phone: `+91-987654${3220 + index}`,
      father_email: `${parent.father.toLowerCase().replace(' ', '.')}@gmail.com`,
      father_occupation: parent.occupation_f,
      father_qualification: 'Graduate',
      father_income: 50000 + (index * 10000),
      mother_name: parent.mother,
      mother_phone: `+91-876543${2100 + index}`,
      mother_email: `${parent.mother.toLowerCase().replace(' ', '.')}@gmail.com`,
      mother_occupation: parent.occupation_m,
      mother_qualification: 'Graduate',
      mother_income: parent.occupation_m === 'Homemaker' ? 0 : 30000 + (index * 5000),
      address: `House No. ${index + 1}, Sector ${15 + index % 10}, Gurugram`,
      city: 'Gurugram',
      state: 'Haryana',
      postal_code: `1220${10 + index % 10}`,
      country: 'India',
      emergency_contact: `+91-987654${3220 + index}`,
      emergency_relation: 'Father',
      school_id: schoolId,
      branch_id: branchId1,
      created_by: null,
      created_at: new Date(),
      updated_at: new Date()
    })));

    // 11. Insert Sample Students (depends on schools/branches/users)
    const studentNames = [
      { first: 'Aarav', last: 'Kumar', class: 'V', section: 'A', gender: 'Male' },
      { first: 'Ananya', last: 'Sharma', class: 'IV', section: 'B', gender: 'Female' },
      { first: 'Arjun', last: 'Gupta', class: 'VI', section: 'A', gender: 'Male' },
      { first: 'Diya', last: 'Singh', class: 'III', section: 'A', gender: 'Female' },
      { first: 'Ishaan', last: 'Verma', class: 'VII', section: 'B', gender: 'Male' },
      { first: 'Kavya', last: 'Joshi', class: 'II', section: 'A', gender: 'Female' },
      { first: 'Kiran', last: 'Mishra', class: 'VIII', section: 'A', gender: 'Male' },
      { first: 'Meera', last: 'Agarwal', class: 'I', section: 'A', gender: 'Female' },
      { first: 'Nishant', last: 'Yadav', class: 'IX', section: 'A', gender: 'Male' },
      { first: 'Priya', last: 'Tiwari', class: 'X', section: 'B', gender: 'Female' },
      { first: 'Rahul', last: 'Pandey', class: 'VI', section: 'B', gender: 'Male' },
      { first: 'Sanya', last: 'Dubey', class: 'V', section: 'B', gender: 'Female' },
      { first: 'Shivam', last: 'Saxena', class: 'VIII', section: 'B', gender: 'Male' },
      { first: 'Tanya', last: 'Chandra', class: 'IV', section: 'A', gender: 'Female' },
      { first: 'Varun', last: 'Goyal', class: 'VII', section: 'A', gender: 'Male' },
      { first: 'Yashika', last: 'Kapoor', class: 'IX', section: 'B', gender: 'Female' },
      { first: 'Arnav', last: 'Arora', class: 'III', section: 'B', gender: 'Male' },
      { first: 'Shreya', last: 'Malhotra', class: 'X', section: 'A', gender: 'Female' },
      { first: 'Aditya', last: 'Sethi', class: 'II', section: 'B', gender: 'Male' },
      { first: 'Riya', last: 'Bhatia', class: 'I', section: 'B', gender: 'Female' }
    ];

    await queryInterface.bulkInsert('students', studentNames.map((student, index) => ({
      id: studentIds[index],
      admission_number: `HUDA${2024}${String(index + 1).padStart(4, '0')}`,
      roll_number: `${student.class}-${student.section}-${String(index % 30 + 1).padStart(2, '0')}`,
      first_name: student.first,
      last_name: student.last,
      date_of_birth: new Date(2010 + Math.floor(index / 2), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      gender: student.gender,
      blood_group: ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-'][index % 7],
      religion: ['Hindu', 'Muslim', 'Christian', 'Sikh'][index % 4],
      nationality: 'Indian',
      mother_tongue: 'Hindi',
      email: `${student.first.toLowerCase()}.${student.last.toLowerCase()}@huda.edu`,
      phone: `+91-876543${2200 + index}`,
      emergency_contact: `+91-987654${3220 + index}`,
      address: `House No. ${index + 1}, Sector ${15 + index % 10}, Gurugram`,
      city: 'Gurugram',
      state: 'Haryana',
      postal_code: `1220${10 + index % 10}`,
      country: 'India',
      admission_date: new Date(2024, 3, Math.floor(Math.random() * 30) + 1),
      admission_class: student.class,
      current_class: student.class,
      section: student.section,
      academic_year: '2024-25',
      status: 'active',
      documents: JSON.stringify({
        'birth_certificate': true,
        'transfer_certificate': index > 5,
        'address_proof': true,
        'photo': true,
        'previous_report_card': index > 5
      }),
      medical_info: JSON.stringify({
        'allergies': index % 5 === 0 ? ['Peanuts'] : [],
        'medical_conditions': [],
        'emergency_medication': false,
        'blood_group': ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-'][index % 7],
        'vaccination_complete': true
      }),
      school_id: schoolId,
      branch_id: branchId1,
      created_by: null,
      created_at: new Date(),
      updated_at: new Date()
    })));

    // 12. Insert Student-Parent Relationships (depends on students/parents)
    const studentParentRelations = [];
    for (let i = 0; i < 20; i++) {
      studentParentRelations.push({
        id: uuidv4(),
        student_id: studentIds[i],
        parent_id: parentIds[i],
        relationship: 'father',
        is_primary: true,
        is_emergency_contact: true,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    await queryInterface.bulkInsert('student_parents', studentParentRelations);

    // 13. Insert Sample Admissions (depends on schools/branches/users)
    await queryInterface.bulkInsert('admissions', [
      {
        id: admissionIds[0],
        application_number: 'APP2024001',
        first_name: 'Advait',
        last_name: 'Kapoor',
        date_of_birth: '2016-05-15',
        gender: 'Male',
        email: 'advait.parent@gmail.com',
        phone: '+91-9876543300',
        address: 'Sector 18, Gurugram',
        city: 'Gurugram',
        state: 'Haryana',
        postal_code: '122018',
        country: 'India',
        applied_class: 'III',
        academic_year: '2024-25',
        status: 'pending',
        application_date: new Date(),
        documents: JSON.stringify({
          'birth_certificate': true,
          'address_proof': true,
          'parent_id_proof': true,
          'photo': true,
          'previous_school_records': false
        }),
        notes: 'Application received for admission in Class III',
        school_id: schoolId,
        branch_id: branchId1,
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: admissionIds[1],
        application_number: 'APP2024002',
        first_name: 'Saanvi',
        last_name: 'Rajput',
        date_of_birth: '2015-08-22',
        gender: 'Female',
        email: 'saanvi.parent@gmail.com',
        phone: '+91-9876543301',
        address: 'Sector 21, Gurugram',
        city: 'Gurugram',
        state: 'Haryana',
        postal_code: '122021',
        country: 'India',
        applied_class: 'IV',
        academic_year: '2024-25',
        status: 'approved',
        application_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        documents: JSON.stringify({
          'birth_certificate': true,
          'address_proof': true,
          'parent_id_proof': true,
          'photo': true,
          'transfer_certificate': true,
          'previous_school_records': true
        }),
        notes: 'Transfer student from Delhi Public School',
        school_id: schoolId,
        branch_id: branchId1,
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: admissionIds[2],
        application_number: 'APP2024003',
        first_name: 'Aaram',
        last_name: 'Nair',
        date_of_birth: '2014-12-10',
        gender: 'Male',
        email: 'aaram.parent@gmail.com',
        phone: '+91-9876543302',
        address: 'Sector 28, Gurugram',
        city: 'Gurugram',
        state: 'Haryana',
        postal_code: '122028',
        country: 'India',
        applied_class: 'V',
        academic_year: '2024-25',
        status: 'under_review',
        application_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        documents: JSON.stringify({
          'birth_certificate': true,
          'address_proof': true,
          'parent_id_proof': true,
          'photo': true,
          'transfer_certificate': false,
          'previous_school_records': false
        }),
        notes: 'Interview scheduled for next week',
        school_id: schoolId,
        branch_id: branchId1,
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: admissionIds[3],
        application_number: 'APP2024004',
        first_name: 'Myra',
        last_name: 'Shah',
        date_of_birth: '2013-03-18',
        gender: 'Female',
        email: 'myra.parent@gmail.com',
        phone: '+91-9876543303',
        address: 'Sector 31, Gurugram',
        city: 'Gurugram',
        state: 'Haryana',
        postal_code: '122031',
        country: 'India',
        applied_class: 'VI',
        academic_year: '2024-25',
        status: 'rejected',
        application_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        documents: JSON.stringify({
          'birth_certificate': true,
          'address_proof': false,
          'parent_id_proof': true,
          'photo': true,
          'transfer_certificate': false,
          'previous_school_records': false
        }),
        notes: 'Application rejected due to incomplete documents',
        school_id: schoolId,
        branch_id: branchId1,
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: admissionIds[4],
        application_number: 'APP2024005',
        first_name: 'Reyansh',
        last_name: 'Bansal',
        date_of_birth: '2012-07-25',
        gender: 'Male',
        email: 'reyansh.parent@gmail.com',
        phone: '+91-9876543304',
        address: 'Sector 45, Gurugram',
        city: 'Gurugram',
        state: 'Haryana',
        postal_code: '122045',
        country: 'India',
        applied_class: 'VIII',
        academic_year: '2024-25',
        status: 'waiting_list',
        application_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        documents: JSON.stringify({
          'birth_certificate': true,
          'address_proof': true,
          'parent_id_proof': true,
          'photo': true,
          'transfer_certificate': true,
          'previous_school_records': true,
          'character_certificate': true
        }),
        notes: 'Added to waiting list - will be contacted when seat becomes available',
        school_id: schoolId,
        branch_id: branchId1,
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // 14. Insert Sample Transaction (depends on schools/subscription_plans/users)
    await queryInterface.bulkInsert('transactions', [
      {
        id: uuidv4(),
        transaction_id: 'TXN202400001',
        school_id: schoolId,
        subscription_plan_id: subscriptionPlanIds[1], // Professional Plan
        amount: 12000.00,
        currency: 'INR',
        payment_method: 'online',
        payment_status: 'completed',
        transaction_status: 'completed',
        billing_cycle: 'monthly',
        subscription_start_date: new Date('2024-01-01'),
        subscription_end_date: new Date('2024-01-31'),
        description: 'Monthly subscription payment for January 2024',
        gateway_response: JSON.stringify({
          'payment_id': 'pay_123456789',
          'order_id': 'order_987654321',
          'signature': 'signature_hash_value'
        }),
        gateway_transaction_id: 'pay_123456789',
        gateway_name: 'Razorpay',
        is_manual: false,
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    console.log('✅ Demo data seeding completed successfully!');
    console.log('🔑 Login Credentials:');
    console.log('   Super Admin: superadmin@example.com / Admin@123');
    console.log('   School Admin: admin@huda.edu / School@123');
    console.log('   Branch Admin: branch.admin@huda.edu / Branch@123');
    console.log('   Teacher: teacher1@huda.edu / Teacher@123');
    console.log('   Accountant: accountant@huda.edu / Account@123');
    console.log('   Receptionist: reception@huda.edu / Reception@123');
    console.log('   Librarian: librarian@huda.edu / Library@123');
  },

  down: async (queryInterface, Sequelize) => {
    // Delete in reverse order of dependencies
    const tables = [
      'admissions', 'fee_invoices', 'student_parents', 'parents', 'students', 
      'fee_structures', 'fee_types', 'sections', 'classes', 'academic_years',
      'subscription_renewal_requests', 'transactions', 'subscription_plans',
      'branches', 'schools', 'users'
    ];
    
    for (const table of tables) {
      await queryInterface.bulkDelete(table, null, {});
    }
  }
}; 