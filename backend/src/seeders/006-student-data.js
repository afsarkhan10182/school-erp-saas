'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Parents for Demo School
    await queryInterface.bulkInsert('parents', [
      {
        id: '550e8400-e29b-41d4-a716-446655440018',
        father_name: 'Rajesh Gupta',
        father_phone: '+91-9876543215',
        father_email: 'rajesh.gupta@email.com',
        father_occupation: 'Software Engineer',
        father_qualification: 'B.Tech',
        father_income: 800000.00,
        mother_name: 'Sunita Gupta',
        mother_phone: '+91-9876543216',
        mother_email: 'sunita.gupta@email.com',
        mother_occupation: 'Homemaker',
        mother_qualification: 'B.A',
        mother_income: 0.00,
        guardian_name: 'Rajesh Gupta',
        guardian_phone: '+91-9876543215',
        guardian_email: 'rajesh.gupta@email.com',
        guardian_relation: 'father',
        guardian_occupation: 'Software Engineer',
        address: '456 Student Colony, Education City',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        postal_code: '400002',
        is_primary_contact: true,
        emergency_contact: true,
        school_id: '550e8400-e29b-41d4-a716-446655440006',
        branch_id: '550e8400-e29b-41d4-a716-446655440007',
        created_by: '550e8400-e29b-41d4-a716-446655440008',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440019',
        father_name: 'Amit Pandey',
        father_phone: '+91-9876543218',
        father_email: 'amit.pandey@email.com',
        father_occupation: 'Business Owner',
        father_qualification: 'MBA',
        father_income: 1200000.00,
        mother_name: 'Priya Pandey',
        mother_phone: '+91-9876543217',
        mother_email: 'priya.pandey@email.com',
        mother_occupation: 'Teacher',
        mother_qualification: 'B.Ed',
        mother_income: 600000.00,
        guardian_name: 'Priya Pandey',
        guardian_phone: '+91-9876543217',
        guardian_email: 'priya.pandey@email.com',
        guardian_relation: 'mother',
        guardian_occupation: 'Teacher',
        address: '789 Learning Lane, Knowledge Park',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        postal_code: '400003',
        is_primary_contact: true,
        emergency_contact: true,
        school_id: '550e8400-e29b-41d4-a716-446655440006',
        branch_id: '550e8400-e29b-41d4-a716-446655440007',
        created_by: '550e8400-e29b-41d4-a716-446655440008',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], { returning: true });

    // Create Students for Demo School
    await queryInterface.bulkInsert('students', [
      {
        id: '550e8400-e29b-41d4-a716-446655440020',
        admission_number: 'DEMO001',
        roll_number: 'VI-A-001',
        first_name: 'Arjun',
        last_name: 'Gupta',
        middle_name: null,
        date_of_birth: '2012-05-15',
        gender: 'male',
        blood_group: 'B+',
        religion: 'Hindu',
        caste: 'General',
        category: 'general',
        nationality: 'Indian',
        mother_tongue: 'Hindi',
        email: 'arjun.gupta@student.com',
        phone: '+91-9876543219',
        emergency_contact: '+91-9876543215',
        address: '456 Student Colony, Education City',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        postal_code: '400002',
        admission_date: '2024-04-01',
        admission_class: 'Class VI',
        current_class: 'Class VI',
        section: 'A',
        class_id: '550e8400-e29b-41d4-a716-446655440009', // Class VI
        section_id: '550e8400-e29b-41d4-a716-446655440011', // Section A
        academic_year: '2024-2025',
        status: 'active',
        photo: null,
        documents: JSON.stringify({
          birth_certificate: 'uploaded',
          transfer_certificate: 'uploaded',
          previous_marksheet: 'uploaded'
        }),
        medical_info: JSON.stringify({
          medical_conditions: null,
          allergies: null,
          blood_group: 'B+'
        }),
        notes: null,
        school_id: '550e8400-e29b-41d4-a716-446655440006',
        branch_id: '550e8400-e29b-41d4-a716-446655440007',
        user_id: null,
        created_by: '550e8400-e29b-41d4-a716-446655440008',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440021',
        admission_number: 'DEMO002',
        roll_number: 'VI-B-001',
        first_name: 'Rahul',
        last_name: 'Pandey',
        middle_name: null,
        date_of_birth: '2012-08-20',
        gender: 'male',
        blood_group: 'O+',
        religion: 'Hindu',
        caste: 'General',
        category: 'general',
        nationality: 'Indian',
        mother_tongue: 'Hindi',
        email: 'rahul.pandey@student.com',
        phone: '+91-9876543220',
        emergency_contact: '+91-9876543217',
        address: '789 Learning Lane, Knowledge Park',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        postal_code: '400003',
        admission_date: '2024-04-01',
        admission_class: 'Class VI',
        current_class: 'Class VI',
        section: 'B',
        class_id: '550e8400-e29b-41d4-a716-446655440009', // Class VI
        section_id: '550e8400-e29b-41d4-a716-446655440012', // Section B
        academic_year: '2024-2025',
        status: 'active',
        photo: null,
        documents: JSON.stringify({
          birth_certificate: 'uploaded',
          transfer_certificate: 'uploaded',
          previous_marksheet: 'uploaded'
        }),
        medical_info: JSON.stringify({
          medical_conditions: null,
          allergies: null,
          blood_group: 'O+'
        }),
        notes: null,
        school_id: '550e8400-e29b-41d4-a716-446655440006',
        branch_id: '550e8400-e29b-41d4-a716-446655440007',
        user_id: null,
        created_by: '550e8400-e29b-41d4-a716-446655440008',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], { returning: true });

    // Create Student-Parent Relationships
    await queryInterface.bulkInsert('student_parents', [
      {
        id: '550e8400-e29b-41d4-a716-446655440022',
        student_id: '550e8400-e29b-41d4-a716-446655440020',
        parent_id: '550e8400-e29b-41d4-a716-446655440018',
        relationship: 'father',
        is_primary: true,
        is_emergency_contact: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440023',
        student_id: '550e8400-e29b-41d4-a716-446655440021',
        parent_id: '550e8400-e29b-41d4-a716-446655440019',
        relationship: 'mother',
        is_primary: true,
        is_emergency_contact: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], { returning: true });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('student_parents', { student_id: ['550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440021'] }, {});
    await queryInterface.bulkDelete('students', { school_id: '550e8400-e29b-41d4-a716-446655440006' }, {});
    await queryInterface.bulkDelete('parents', { school_id: '550e8400-e29b-41d4-a716-446655440006' }, {});
  }
}; 