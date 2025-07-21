const { Student, Parent, StudentParent, FeeStructure, FeeInvoice, FeeType, AcademicYear, Class, Section } = require('../models');
const { Op } = require('sequelize');
const ApiError = require('../utils/ApiError');
const { logger } = require('../utils/logger');
const { sequelize } = require('../config/database');
const csv = require('csv-parser');
const { Readable } = require('stream');

// Utility function to handle ENUM validation errors
const handleEnumValidationError = (error) => {
  console.log('🔍 Handling ENUM validation error:', error.message);
  
  if (error.message && error.message.includes('enum_students_admission_sought_in')) {
    throw new ApiError(400, 'Please select a valid stream (Arts, Commerce, or Science) or leave it empty.');
  }
  if (error.message && error.message.includes('enum_students_gender')) {
    throw new ApiError(400, 'Please select a valid gender (Male, Female, or Other).');
  }
  if (error.message && error.message.includes('enum_students_category')) {
    throw new ApiError(400, 'Please select a valid category (General, OBC, SC, ST, or Other).');
  }
  if (error.message && error.message.includes('enum_students_status')) {
    throw new ApiError(400, 'Please select a valid status (Active, Inactive, Transferred, Graduated, or Dropped).');
  }
  // Re-throw other errors
  throw error;
};

// Utility function to sanitize ENUM fields
const sanitizeEnumFields = (data) => {
  console.log('🔍 Before sanitizing ENUM fields:', {
    admission_sought_in: data.admission_sought_in,
    gender: data.gender,
    category: data.category,
    status: data.status
  });
  
  // Handle empty string for ENUM fields - convert to null
  if (data.admission_sought_in === '' || data.admission_sought_in === undefined) {
    data.admission_sought_in = null;
  }
  
  if (data.gender === '' || data.gender === undefined) {
    data.gender = null;
  }
  
  if (data.category === '' || data.category === undefined) {
    data.category = null;
  }
  
  if (data.status === '' || data.status === undefined) {
    data.status = 'active'; // Default status
  }
  
  console.log('🔍 After sanitizing ENUM fields:', {
    admission_sought_in: data.admission_sought_in,
    gender: data.gender,
    category: data.category,
    status: data.status
  });
  
  return data;
};

// Create a new student
const createStudent = async (req, res, next) => {
  try {
  
    console.log('📁 Files received:', req.files ? Object.keys(req.files) : 'No files');

    // Handle both FormData and JSON formats
    let studentData = {};
    let guardianData = {};
    
    try {
      // Check if data is sent as FormData with JSON string
      if (req.body.studentData) {
        const parsedData = JSON.parse(req.body.studentData);
        console.log('🔍 Parsed student data from FormData:', JSON.stringify(parsedData, null, 2));
        
        // Extract student data from nested structure
        if (parsedData.student && typeof parsedData.student === 'object') {
          studentData = { ...parsedData.student };
          console.log('🔍 Extracted student data from FormData:', studentData);
        } else {
          studentData = { ...parsedData };
          console.log('🔍 Using parsed data directly:', studentData);
        }
        
        // Extract guardian data
        if (parsedData.guardian && typeof parsedData.guardian === 'object') {
          guardianData = { ...parsedData.guardian };
        }
        
        // Always merge root-level academic fields with student data
        if (parsedData.admission_number) studentData.admission_number = parsedData.admission_number;
        if (parsedData.roll_number) studentData.roll_number = parsedData.roll_number;
        if (parsedData.admission_date) studentData.admission_date = parsedData.admission_date;
        if (parsedData.category) studentData.category = parsedData.category;
        if (parsedData.class_id) studentData._class_id = parsedData.class_id;
        if (parsedData.section_id) studentData._section_id = parsedData.section_id;
        if (parsedData.academic_year_id) studentData._academic_year_id = parsedData.academic_year_id;
        
        if (studentData.mobile_no) studentData.phone = studentData.mobile_no;
        if (typeof parsedData !== 'undefined' && 'admission_type' in parsedData) studentData.admission_type = parsedData.admission_type;
      } else {
        // Direct nested object (already parsed)
        if (req.body.student && typeof req.body.student === 'object') {
          studentData = { ...req.body.student };
          console.log('🔍 Extracted student data from direct object:', studentData);
        } else {
          studentData = { ...req.body };
          console.log('🔍 Using request body directly:', studentData);
        }
        
        // Extract guardian data
        if (req.body.guardian && typeof req.body.guardian === 'object') {
          guardianData = { ...req.body.guardian };
        }
        
        // Always merge root-level academic fields with student data
        if (req.body.admission_number) studentData.admission_number = req.body.admission_number;
        if (req.body.roll_number) studentData.roll_number = req.body.roll_number;
        if (req.body.admission_date) studentData.admission_date = req.body.admission_date;
        if (req.body.category) studentData.category = req.body.category;
        if (req.body.class_id) studentData._class_id = req.body.class_id;
        if (req.body.section_id) studentData._section_id = req.body.section_id;
        if (req.body.academic_year_id) studentData._academic_year_id = req.body.academic_year_id;
      }
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      // Fallback to flat structure
      studentData = { ...req.body };
      console.log('🔍 Fallback to flat structure:', studentData);
    }

    // Handle file uploads
    if (req.files && req.files.student_profile_picture) {
      studentData.profile_picture = req.files.student_profile_picture[0].filename;
    }

    // Determine school_id and branch_id based on user role
    let school_id, branch_id;
    if (req.user.role === 'super_admin') {
      school_id = studentData.school_id;
      branch_id = studentData.branch_id;
      if (!school_id || !branch_id) {
        throw new ApiError(400, 'School ID and Branch ID are required for super admin');
      }
    } else if (req.user.role === 'school_admin') {
      school_id = req.user.school_id;
      branch_id = studentData.branch_id || req.user.branch_id;
    } else {
      school_id = req.user.school_id;
      branch_id = req.user.branch_id;
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({
      where: {
        admission_number: studentData.admission_number,
        school_id: school_id,
      },
    });

    if (existingStudent) {
      throw new ApiError(400, 'Student with this admission number already exists.', {
        errors: {
          admission_number: 'Student with this admission number already exists.'
        }
      });
    }

    // Check for duplicate roll number in the same class-section
    if (studentData.roll_number && studentData._class_id && studentData._section_id) {
      const existingRollNumber = await Student.findOne({
        where: {
          roll_number: studentData.roll_number,
          branch_id: branch_id,
          class_id: studentData._class_id,
          section_id: studentData._section_id,
        },
      });

      if (existingRollNumber) {
        throw new ApiError(400, `Roll number ${studentData.roll_number} already exists in this class-section.`, {
          errors: {
            roll_number: `Roll number ${studentData.roll_number} already exists in this class-section.`
          }
        });
      }
    }

    // Get class and section names from IDs if provided
    if (studentData._class_id) {
      try {
        const classRecord = await Class.findByPk(studentData._class_id);
        if (classRecord) {
          studentData.admission_class = classRecord.name;
          studentData.current_class = classRecord.name;
          studentData.class_id = studentData._class_id; // Set the actual class_id
          console.log('🔍 Class name resolved:', classRecord.name);
        }
      } catch (error) {
        console.error('❌ Error fetching class:', error);
      }
      delete studentData._class_id;
    }
    
    if (studentData._section_id) {
      try {
        const sectionRecord = await Section.findByPk(studentData._section_id);
        if (sectionRecord) {
          studentData.section = sectionRecord.name;
          studentData.section_id = studentData._section_id; // Set the actual section_id
          console.log('🔍 Section name resolved:', sectionRecord.name);
        }
      } catch (error) {
        console.error('❌ Error fetching section:', error);
      }
      delete studentData._section_id;
    }
    
    if (studentData._academic_year_id) {
      try {
        const yearRecord = await AcademicYear.findByPk(studentData._academic_year_id);
        if (yearRecord) {
          studentData.academic_year = yearRecord.name;
          console.log('🔍 Academic year resolved:', yearRecord.name);
        }
      } catch (error) {
        console.error('❌ Error fetching academic year:', error);
      }
      delete studentData._academic_year_id;
    }

    // Prepare student data for creation
    const finalStudentData = {
      ...studentData,
      school_id,
      branch_id,
      created_by: req.user.id,
    };

    // Sanitize ENUM fields
    sanitizeEnumFields(finalStudentData);

    console.log('🔍 Final student data for creation:', finalStudentData);

    // Create student record
    let student;
    try {
      student = await Student.create(finalStudentData);
    } catch (error) {
      // Handle ENUM validation errors specifically
      handleEnumValidationError(error);
    }

    // Create guardian/parent record if provided
    if (guardianData && Object.keys(guardianData).length > 0) {
      const parentData = {
        // Set guardian information based on relation
        guardian_name: guardianData.name,
        guardian_phone: guardianData.mobile_no,
        guardian_email: guardianData.email,
        guardian_relation: guardianData.relation,
        guardian_occupation: guardianData.occupation,
        guardian_income: guardianData.income,
        guardian_education: guardianData.education,
        address: guardianData.address,
        city: guardianData.city,
        state: guardianData.state,
        country: 'India',
        emergency_contact: true, // Set to true since this is the emergency contact
        school_id,
        branch_id,
        created_by: req.user.id,
      };

      // Set father or mother information based on relation
      if (guardianData.relation === 'father') {
        parentData.father_name = guardianData.name;
        parentData.father_phone = guardianData.mobile_no;
        parentData.father_email = guardianData.email;
        parentData.father_occupation = guardianData.occupation;
        parentData.father_qualification = guardianData.education;
        parentData.father_income = guardianData.income;
      } else if (guardianData.relation === 'mother') {
        parentData.mother_name = guardianData.name;
        parentData.mother_phone = guardianData.mobile_no;
        parentData.mother_email = guardianData.email;
        parentData.mother_occupation = guardianData.occupation;
        parentData.mother_qualification = guardianData.education;
        parentData.mother_income = guardianData.income;
      }

      // Always set both father and mother names if provided
      if (guardianData.father_name) {
        parentData.father_name = guardianData.father_name;
      }
      if (guardianData.mother_name) {
        parentData.mother_name = guardianData.mother_name;
      }

      const parent = await Parent.create(parentData);

      // Link student and parent
      await StudentParent.create({
        student_id: student.id,
        parent_id: parent.id,
        school_id,
        relationship: guardianData.relation || 'guardian',
        is_primary: true,
        is_fee_payer: true,
        is_emergency_contact: true,
      });
    }

    logger.info(`Student created: ${student.first_name} ${student.last_name} (${student.admission_number})`);
    return res.status(201).json({ success: true, data: student });
  } catch (error) {
    logger.error('Error creating student:', error);
    return next(error);
  }
};

// Get all students
const getStudents = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      academic_year, 
      class_name, 
      section, 
      status,
      branch_id,
      class_id,
      section_id,
      school_id
    } = req.query;

    // Build where clause for Student table
    const whereClause = {};
    
    // Handle school_id filtering based on user role
    if (req.user.role === 'super_admin') {
      // Super admin can filter by school_id if provided, otherwise see all students
      if (school_id) {
        whereClause.school_id = school_id;
      }
    } else {
      // School admin and branch admin are restricted to their school
      whereClause.school_id = req.schoolId;
    }

    // Apply filters
    if (search) {
      whereClause[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { 
          admission_number: { 
            [Op.and]: [
              { [Op.not]: null },
              { [Op.iLike]: `%${search}%` }
            ]
          } 
        },
        { 
          email: { 
            [Op.and]: [
              { [Op.not]: null },
              { [Op.iLike]: `%${search}%` }
            ]
          } 
        },
      ];
    }

    if (academic_year) whereClause.academic_year = academic_year;
    if (class_name) whereClause.current_class = class_name;
    if (section) whereClause.section = section;
    if (status) whereClause.status = status;
    if (branch_id) whereClause.branch_id = branch_id;

    // Handle class_id and section_id using foreign keys
    if (class_id) {
      whereClause.class_id = class_id;
    }

    if (section_id) {
      whereClause.section_id = section_id;
    }

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await Student.count({ where: whereClause });

    // Get students with pagination
    const students = await Student.findAll({
      where: whereClause,
      include: [
        {
          model: Parent,
          as: 'parents',
          through: { attributes: [] },
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'code'],
        },
        {
          model: Section,
          as: 'sectionInfo',
          attributes: ['id', 'name'],
        },
      ],
      order: [['first_name', 'ASC'], ['last_name', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return res.status(200).json({ 
      success: true, 
      data: students,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(totalCount / limit),
        total_count: totalCount,
        limit: parseInt(limit),
      }
    });
  } catch (error) {
    logger.error('Error fetching students:', error);
    return next(error);
  }
};

// Get student by ID
const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Debug logging
    console.log('=== STUDENT CONTROLLER DEBUG ===');
    console.log('User:', req.user);
    console.log('SchoolId from middleware:', req.schoolId);
    console.log('Student ID requested:', id);
    console.log('User school_id:', req.user?.school_id);
    console.log('User branch_id:', req.user?.branch_id);

    // First, try to find the student without school_id filter to see if it exists
    const studentWithoutFilter = await Student.findByPk(id);
    console.log('Student without school filter:', studentWithoutFilter ? {
      id: studentWithoutFilter.id,
      name: `${studentWithoutFilter.first_name} ${studentWithoutFilter.last_name}`,
      school_id: studentWithoutFilter.school_id,
      branch_id: studentWithoutFilter.branch_id
    } : 'Not found');

    // Check if schoolId is set
    if (!req.schoolId) {
      console.log('ERROR: req.schoolId is undefined!');
      console.log('User object:', req.user);
      throw new ApiError(500, 'School context not properly set');
    }

    console.log('Looking for student with criteria:', { id, school_id: req.schoolId });

    const student = await Student.findOne({
      where: {
        id,
        school_id: req.schoolId,
      },
      include: [
        {
          model: Parent,
          as: 'parents',
          through: { attributes: ['relationship', 'is_primary'] },
          attributes: [
            'id', 'father_name', 'mother_name', 'guardian_name', 
            'father_phone', 'mother_phone', 'guardian_phone',
            'father_email', 'mother_email', 'guardian_email',
            'father_occupation', 'mother_occupation',
            'father_qualification', 'mother_qualification',
            'father_income', 'mother_income',
            'guardian_relation', 'city', 'state', 'address'
          ],
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'code'],
        },
        {
          model: Section,
          as: 'sectionInfo',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!student) {
      console.log('Student not found with criteria:', { id, school_id: req.schoolId });
      console.log('Available school_id for this student:', studentWithoutFilter?.school_id);
      console.log('User school_id:', req.user?.school_id);
      throw new ApiError(404, 'Student not found');
    }

    console.log('Student found:', student.id);
    return res.status(200).json({ success: true, data: student });
  } catch (error) {
    logger.error('Error fetching student:', error);
    return next(error);
  }
};

// Update student
const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    console.log('🔍 Update Student Request Body:', JSON.stringify(updates, null, 2));
    console.log('📁 Files received:', req.files ? Object.keys(req.files) : 'No files');

    const student = await Student.findOne({
      where: {
        id,
        school_id: req.schoolId,
      },
    });

    if (!student) {
      throw new ApiError(404, 'Student not found');
    }

    // Handle both FormData and JSON formats
    let studentUpdates = {};
    let academicUpdates = {};
    
    console.log('🔍 Checking data structure...');
    console.log('🔍 Has studentData field?', !!updates.studentData);
    console.log('🔍 Has student field?', !!updates.student);
    console.log('🔍 Student field type:', typeof updates.student);
    console.log('🔍 Content-Type:', req.headers['content-type']);
    
    try {
      // Check if data is sent as FormData with JSON string
      if (updates.studentData) {
        const parsedData = JSON.parse(updates.studentData);
        console.log('🔍 Parsed student data from FormData:', JSON.stringify(parsedData, null, 2));
        
        // Extract student data from nested structure
        if (parsedData.student && typeof parsedData.student === 'object') {
          studentUpdates = { ...parsedData.student };
          console.log('🔍 Extracted student data from FormData:', studentUpdates);
        } else {
          studentUpdates = { ...parsedData };
          console.log('🔍 Using parsed data directly:', studentUpdates);
        }
        
        // Extract academic fields from main structure
        if (parsedData.roll_number) studentUpdates.roll_number = parsedData.roll_number;
        if (parsedData.admission_date) academicUpdates.admission_date = parsedData.admission_date;
        if (parsedData.category) academicUpdates.category = parsedData.category;
        if (parsedData.admission_number) academicUpdates.admission_number = parsedData.admission_number;
        
        // Store class_id and section_id for later processing
        if (parsedData.class_id) academicUpdates._class_id = parsedData.class_id;
        if (parsedData.section_id) academicUpdates._section_id = parsedData.section_id;
        if (parsedData.academic_year_id) academicUpdates._academic_year_id = parsedData.academic_year_id;
        
        if (studentUpdates.mobile_no) studentUpdates.phone = studentUpdates.mobile_no;
        if (typeof parsedData !== 'undefined' && 'admission_type' in parsedData) studentUpdates.admission_type = parsedData.admission_type;
      } else if (updates.student && typeof updates.student === 'object') {
        // Direct nested object (already parsed) - this is the current case
        studentUpdates = { ...updates.student };
        console.log('🔍 Extracted student data from direct object:', studentUpdates);
        console.log('🔍 First name from student object:', studentUpdates.first_name);
        
        // Extract academic fields from main structure
        if (updates.roll_number) studentUpdates.roll_number = updates.roll_number;
        if (updates.admission_date) academicUpdates.admission_date = updates.admission_date;
        if (updates.category) academicUpdates.category = updates.category;
        if (updates.admission_number) academicUpdates.admission_number = updates.admission_number;
        
        // Store class_id and section_id for later processing
        if (updates.class_id) academicUpdates._class_id = updates.class_id;
        if (updates.section_id) academicUpdates._section_id = updates.section_id;
        if (updates.academic_year_id) academicUpdates._academic_year_id = updates.academic_year_id;
        
        if (studentUpdates.mobile_no) studentUpdates.phone = studentUpdates.mobile_no;
        if (typeof parsedData !== 'undefined' && 'admission_type' in parsedData) studentUpdates.admission_type = parsedData.admission_type;
        if ('admission_type' in updates) studentUpdates.admission_type = updates.admission_type;
      } else {
        // Flat data structure
        studentUpdates = { ...updates };
        console.log('🔍 Using flat data structure:', studentUpdates);
      }
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      // Fallback to flat structure
      studentUpdates = { ...updates };
      console.log('🔍 Fallback to flat structure:', studentUpdates);
    }

    // Handle file uploads
    if (req.files && req.files.student_profile_picture) {
      studentUpdates.profile_picture = req.files.student_profile_picture[0].filename;
    }

    // Remove any fields that shouldn't be updated directly
    delete studentUpdates.id;
    delete studentUpdates.created_at;
    delete studentUpdates.updated_at;
    delete studentUpdates.created_by;

    console.log('🔍 Final student updates:', studentUpdates);
    console.log('🔍 Academic updates:', academicUpdates);
    console.log('🔍 First name being updated:', studentUpdates.first_name);
    console.log('🔍 Last name being updated:', studentUpdates.last_name);
    console.log('🔍 Class ID being processed:', academicUpdates._class_id);
    console.log('🔍 Section ID being processed:', academicUpdates._section_id);
    console.log('🔍 Category being updated:', academicUpdates.category);
    console.log('🔍 Register number being updated:', academicUpdates.admission_number);

    // Get class and section names from IDs if provided
    if (academicUpdates._class_id) {
      try {
        const classRecord = await Class.findByPk(academicUpdates._class_id);
        if (classRecord) {
          academicUpdates.admission_class = classRecord.name;
          academicUpdates.current_class = classRecord.name;
          academicUpdates.class_id = academicUpdates._class_id; // Set the actual class_id
          console.log('🔍 Class name resolved:', classRecord.name);
        }
      } catch (error) {
        console.error('❌ Error fetching class:', error);
      }
      delete academicUpdates._class_id;
    }
    
    if (academicUpdates._section_id) {
      try {
        console.log('🔍 Looking up section with ID:', academicUpdates._section_id);
        const sectionRecord = await Section.findByPk(academicUpdates._section_id);
        console.log('🔍 Section record found:', sectionRecord ? {
          id: sectionRecord.id,
          name: sectionRecord.name,
          code: sectionRecord.code
        } : 'Not found');
        
        if (sectionRecord) {
          academicUpdates.section = sectionRecord.name;
          academicUpdates.section_id = academicUpdates._section_id; // Set the actual section_id
          console.log('🔍 Section name resolved:', sectionRecord.name);
        } else {
  
        }
      } catch (error) {
        console.error('❌ Error fetching section:', error);
      }
      delete academicUpdates._section_id;
    }
    
    if (academicUpdates._academic_year_id) {
      try {
        const yearRecord = await AcademicYear.findByPk(academicUpdates._academic_year_id);
        if (yearRecord) {
          academicUpdates.academic_year = yearRecord.name;
          console.log('🔍 Academic year resolved:', yearRecord.name);
        }
      } catch (error) {
        console.error('❌ Error fetching academic year:', error);
      }
      delete academicUpdates._academic_year_id;
    }

    const updateData = {
      ...studentUpdates,
      ...academicUpdates,
      updated_by: req.user.id,
    };
    
    // Sanitize ENUM fields
    sanitizeEnumFields(updateData);

    console.log('🔍 Data being sent to database update:', updateData);
    console.log('🔍 Section field in update data:', updateData.section);
    console.log('🔍 Admission class field in update data:', updateData.admission_class);
    console.log('🔍 Current class field in update data:', updateData.current_class);

    // Check for duplicate roll number in the same class-section (only if roll number is being updated)
    if (updateData.roll_number && updateData.roll_number !== student.roll_number) {
      const existingRollNumber = await Student.findOne({
        where: {
          roll_number: updateData.roll_number,
          branch_id: student.branch_id,
          class_id: updateData.class_id || student.class_id,
          section_id: updateData.section_id || student.section_id,
          id: { [Op.ne]: student.id }, // Exclude current student
        },
      });

      if (existingRollNumber) {
        throw new ApiError(400, `Roll number ${updateData.roll_number} already exists in this class-section.`);
      }
    }

    try {
      await student.update(updateData);
    } catch (error) {
      // Handle ENUM validation errors specifically
      handleEnumValidationError(error);
    }
    
    // Log what was actually saved
    
    console.log('🔍 Student section after update:', student.section);
    console.log('🔍 Student admission class after update:', student.admission_class);
    console.log('🔍 Student current class after update:', student.current_class);

    // Update parent/guardian information if provided
    let guardianUpdates = null;
    
    // Extract guardian data from nested structure
    if (updates.guardian && typeof updates.guardian === 'object') {
      guardianUpdates = updates.guardian;
    } else if (updates.studentData) {
      try {
        const parsedData = JSON.parse(updates.studentData);
        if (parsedData.guardian && typeof parsedData.guardian === 'object') {
          guardianUpdates = parsedData.guardian;
        }
      } catch (parseError) {
        console.error('❌ Error parsing guardian data:', parseError);
      }
    } else if (updates.student && typeof updates.student === 'object') {
      // For direct object format, guardian data is at the same level
      if (updates.guardian && typeof updates.guardian === 'object') {
        guardianUpdates = updates.guardian;
      }
    }
    
    if (guardianUpdates) {
      console.log('🔍 Updating guardian information:', guardianUpdates);
      
      // Get the primary parent for this student
      const studentParent = await StudentParent.findOne({
        where: { 
          student_id: student.id,
          is_primary: true 
        },
        include: [{ model: Parent, as: 'parent' }]
      });

      if (studentParent && studentParent.parent) {
        const parentUpdateData = {
          // Set guardian information based on relation
          guardian_name: guardianUpdates.name,
          guardian_phone: guardianUpdates.mobile_no,
          guardian_email: guardianUpdates.email,
          guardian_relation: guardianUpdates.relation,
          guardian_occupation: guardianUpdates.occupation,
          guardian_income: guardianUpdates.income,
          guardian_education: guardianUpdates.education,
          address: guardianUpdates.address,
          city: guardianUpdates.city,
          state: guardianUpdates.state,
          emergency_contact: true, // Set to true since this is the emergency contact
          updated_by: req.user.id,
        };

        // Set father or mother information based on relation
        if (guardianUpdates.relation === 'father') {
          parentUpdateData.father_name = guardianUpdates.name;
          parentUpdateData.father_phone = guardianUpdates.mobile_no;
          parentUpdateData.father_email = guardianUpdates.email;
          parentUpdateData.father_occupation = guardianUpdates.occupation;
          parentUpdateData.father_qualification = guardianUpdates.education;
          parentUpdateData.father_income = guardianUpdates.income;
        } else if (guardianUpdates.relation === 'mother') {
          parentUpdateData.mother_name = guardianUpdates.name;
          parentUpdateData.mother_phone = guardianUpdates.mobile_no;
          parentUpdateData.mother_email = guardianUpdates.email;
          parentUpdateData.mother_occupation = guardianUpdates.occupation;
          parentUpdateData.mother_qualification = guardianUpdates.education;
          parentUpdateData.mother_income = guardianUpdates.income;
        }

        // Always update both father and mother names if provided
        if (guardianUpdates.father_name) {
          parentUpdateData.father_name = guardianUpdates.father_name;
        }
        if (guardianUpdates.mother_name) {
          parentUpdateData.mother_name = guardianUpdates.mother_name;
        }
        
        // Update additional guardian fields if provided
        if (guardianUpdates.occupation) {
          if (guardianUpdates.relation === 'father') {
            parentUpdateData.father_occupation = guardianUpdates.occupation;
          } else if (guardianUpdates.relation === 'mother') {
            parentUpdateData.mother_occupation = guardianUpdates.occupation;
          }
        }
        
        if (guardianUpdates.education) {
          if (guardianUpdates.relation === 'father') {
            parentUpdateData.father_qualification = guardianUpdates.education;
          } else if (guardianUpdates.relation === 'mother') {
            parentUpdateData.mother_qualification = guardianUpdates.education;
          }
        }
        
        if (guardianUpdates.income) {
          if (guardianUpdates.relation === 'father') {
            parentUpdateData.father_income = guardianUpdates.income;
          } else if (guardianUpdates.relation === 'mother') {
            parentUpdateData.mother_income = guardianUpdates.income;
          }
        }

        console.log('🔍 Guardian updates being applied:', parentUpdateData);
        await studentParent.parent.update(parentUpdateData);
        // Guardian information updated successfully
      } else {
        // No primary parent found for student
      }
    }

    logger.info(`Student updated: ${student.first_name} ${student.last_name} (${student.admission_number})`);
    return res.status(200).json({ success: true, data: student });
  } catch (error) {
    logger.error('Error updating student:', error);
    return next(error);
  }
};

// Get students by class
const getStudentsByClass = async (req, res, next) => {
  try {
    const { class_name, section, academic_year, status = 'active' } = req.query;

    if (!class_name) {
      throw new ApiError(400, 'Class name is required');
    }

    const whereClause = {
      school_id: req.schoolId,
      current_class: class_name,
      status,
    };

    if (section) whereClause.section = section;
    if (academic_year) whereClause.academic_year = academic_year;

    const students = await Student.findAll({
      where: whereClause,
      include: [
        {
          model: Parent,
          as: 'parents',
          through: { attributes: ['relationship', 'is_primary'] },
        },
      ],
      order: [['roll_number', 'ASC'], ['first_name', 'ASC']],
    });

    return res.status(200).json({ success: true, data: students });
  } catch (error) {
    logger.error('Error fetching students by class:', error);
    return next(error);
  }
};

// Get student statistics
const getStudentStats = async (req, res, next) => {
  try {
    const { 
      academic_year, 
      branch_id, 
      class_id, 
      section_id,
      school_id
    } = req.query;

    const whereClause = {};
    
    // Handle school_id filtering based on user role
    if (req.user.role === 'super_admin') {
      // Super admin can filter by school_id if provided, otherwise see all students
      if (school_id) {
        whereClause.school_id = school_id;
      }
    } else {
      // School admin and branch admin are restricted to their school
      whereClause.school_id = req.schoolId;
    }

    if (academic_year) whereClause.academic_year = academic_year;
    if (branch_id) whereClause.branch_id = branch_id;

    // Handle class_id and section_id using foreign keys
    if (class_id) {
      whereClause.class_id = class_id;
    }

    if (section_id) {
      whereClause.section_id = section_id;
    }

    const totalStudents = await Student.count({
      where: whereClause,
    });

    const activeStudents = await Student.count({
      where: { ...whereClause, status: 'active' },
    });

    const inactiveStudents = await Student.count({
      where: { ...whereClause, status: 'inactive' },
    });

    const graduatedStudents = await Student.count({
      where: { ...whereClause, status: 'graduated' },
    });

    const droppedStudents = await Student.count({
      where: { ...whereClause, status: 'dropped' },
    });

    // Get class-wise distribution
    const classDistribution = await Student.findAll({
      where: whereClause,
      attributes: [
        'current_class',
        [Student.sequelize.fn('COUNT', Student.sequelize.col('id')), 'count'],
      ],
      group: ['current_class'],
      order: [['current_class', 'ASC']],
      raw: true,
    });

    // Get branch-wise distribution (only when viewing by school, not by branch)
    let branchDistribution = [];
    if (school_id && !branch_id) {
      branchDistribution = await Student.findAll({
        where: whereClause,
        attributes: [
          'branch_id',
          [Student.sequelize.fn('COUNT', Student.sequelize.col('id')), 'count'],
        ],
        group: ['branch_id'],
        order: [['branch_id', 'ASC']],
        raw: true,
      });
    }

    // Get new students this month
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const newThisMonth = await Student.count({
      where: {
        ...whereClause,
        created_at: {
          [Op.gte]: firstDayOfMonth,
        },
      },
    });

    // Get class count
    const classCount = await Student.count({
      where: whereClause,
      distinct: true,
      col: 'current_class',
    });

    const stats = {
      total: totalStudents,
      active: activeStudents,
      inactive: inactiveStudents,
      graduated: graduatedStudents,
      dropped: droppedStudents,
      newThisMonth: newThisMonth,
      classCount: classCount,
      class_distribution: classDistribution,
      branch_distribution: branchDistribution,
    };

    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error fetching student statistics:', error);
    return next(error);
  }
};

// Get student report with advanced filtering
const getStudentReport = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      academic_year,
      class_name,
      section_name,
      status,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
      school_id,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause based on user role
    let whereClause = {};
    
    // Handle school_id filtering based on user role
    if (req.user.role === 'super_admin') {
      // Super admin can filter by school_id if provided, otherwise see all students
      if (school_id) {
        whereClause.school_id = school_id;
      }
    } else {
      // School admin and branch admin are restricted to their school
      whereClause.school_id = req.schoolId;
    }

    // Add filters
    if (academic_year) whereClause.academic_year = academic_year;
    if (class_name) whereClause.current_class = class_name;
    if (section_name) whereClause.section = section_name;
    if (status) whereClause.status = status;

    // Add search functionality
    if (search) {
      whereClause[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { 
          admission_number: { 
            [Op.and]: [
              { [Op.not]: null },
              { [Op.iLike]: `%${search}%` }
            ]
          } 
        },
        { 
          email: { 
            [Op.and]: [
              { [Op.not]: null },
              { [Op.iLike]: `%${search}%` }
            ]
          } 
        },
      ];
    }

    const { count, rows } = await Student.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Parent,
          as: 'parents',
          through: { attributes: ['relationship', 'is_primary'] },
        },
        {
          model: AcademicYear,
          as: 'academicYear',
          attributes: ['id', 'name', 'code'],
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'code'],
        },
        {
          model: Section,
          as: 'sectionInfo',
          attributes: ['id', 'name'],
        },
      ],
      order: [[sort_by, sort_order.toUpperCase()]],
      limit: parseInt(limit),
      offset,
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    logger.error('Error fetching student report:', error);
    return next(error);
  }
};

// Export student report
const exportStudentReport = async (req, res, next) => {
  try {
    const { academic_year, class_name, section_name, status, school_id } = req.query;

    // Build where clause
    const whereClause = {};
    
    // Handle school_id filtering based on user role
    if (req.user.role === 'super_admin') {
      // Super admin can filter by school_id if provided, otherwise see all students
      if (school_id) {
        whereClause.school_id = school_id;
      }
    } else {
      // School admin and branch admin are restricted to their school
      whereClause.school_id = req.schoolId;
    }
    if (academic_year) whereClause.academic_year = academic_year;
    if (class_name) whereClause.current_class = class_name;
    if (section_name) whereClause.section = section_name;
    if (status) whereClause.status = status;

    // Get students with related data
    const students = await Student.findAll({
      where: whereClause,
      include: [
        {
          model: Parent,
          as: 'parents',
          through: { attributes: [] },
          attributes: ['guardian_name', 'guardian_phone', 'guardian_email', 'guardian_relation'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    // Set response headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=student_report.xlsx');

    // TODO: Implement Excel generation
    // For now, return JSON
    res.json({
      success: true,
      data: students,
      message: 'Student report generated successfully',
    });
  } catch (error) {
    logger.error('Error exporting student report:', error);
    return next(error);
  }
};

// Bulk import students from CSV
const bulkImportStudents = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    if (!req.file) {
      throw new ApiError(400, 'CSV file is required');
    }

    const { branch_id, class_id, section_id } = req.body;
    
    // Validate required fields
    if (!branch_id || !class_id || !section_id) {
      throw new ApiError(400, 'Branch, Class, and Section are required');
    }

    // Determine school_id and branch_id based on user role
    let school_id;
    if (req.user.role === 'super_admin') {
      school_id = req.body.school_id;
      if (!school_id) {
        throw new ApiError(400, 'School ID is required for super admin');
      }
    } else {
      school_id = req.user.school_id;
    }

    // Read and parse CSV file using proper CSV parser
    if (!req.file || !req.file.buffer) {
      throw new ApiError(400, 'CSV file is required and must be uploaded properly');
    }

    const csvContent = req.file.buffer.toString('utf-8');
    if (!csvContent || csvContent.trim().length === 0) {
      throw new ApiError(400, 'CSV file is empty');
    }

    const dataRows = [];
    
    // Parse CSV using stream
    await new Promise((resolve, reject) => {
      const stream = Readable.from(csvContent);
      
      stream
        .pipe(csv())
        .on('data', (row) => {
          dataRows.push(row);
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    });
    
    if (dataRows.length === 0) {
      throw new ApiError(400, 'CSV file must contain at least one data row');
    }

    // Validate required columns - all mandatory fields
    const requiredColumns = [
      'FirstName', 'Gender', 'Birthday', 'AdmissionDate', 'AdmissionNumber', 'Category',
      'GuardianName', 'GuardianRelation', 'GuardianOccupation', 'GuardianIncome', 'GuardianEducation', 'GuardianMobileNo', 'GuardianEmail', 'GuardianAddress'
    ];
    
    if (!dataRows[0] || Object.keys(dataRows[0]).length === 0) {
      throw new ApiError(400, 'CSV file must contain valid headers');
    }
    
    const headers = Object.keys(dataRows[0]);
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    if (missingColumns.length > 0) {
      throw new ApiError(400, `Missing required columns: ${missingColumns.join(', ')}. Found columns: ${headers.join(', ')}`);
    }

    // Get class and section names
    const classRecord = await Class.findByPk(class_id);
    const sectionRecord = await Section.findByPk(section_id);
    
    if (!classRecord || !sectionRecord) {
      throw new ApiError(400, 'Invalid class or section ID');
    }

    const results = {
      total: dataRows.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    // Process each row
    for (let i = 0; i < dataRows.length; i++) {
      const rowData = dataRows[i];
      if (!rowData || Object.keys(rowData).length === 0) continue;

      try {

        // Map category ID to category name
        const categoryMapping = {
          '1': 'general',
          '2': 'obc',
          '3': 'sc',
          '4': 'st',
          '5': 'other'
        };
        
        const categoryId = rowData.Category?.toString() || rowData.CategoryID?.toString();
        const category = categoryMapping[categoryId] || 'general';

        // Validate and transform data
        const studentData = {
          first_name: rowData.FirstName,
          last_name: rowData.LastName || null, // Now optional
          gender: rowData.Gender?.toLowerCase(),
          date_of_birth: rowData.Birthday,
          admission_date: rowData.AdmissionDate,
          roll_number: rowData.Roll || null,
          admission_number: rowData.AdmissionNumber || `TEMP_${Date.now()}_${i}`,
          blood_group: rowData.BloodGroup || null,
          mother_tongue: rowData.MotherTongue || null,      // Always mapped
          religion: rowData.Religion || null,               // Always mapped
          caste: rowData.Caste || null,                     // Always mapped
          aadhaar_number: rowData.AadhaarNumber || null,    // Always mapped
          address: rowData.Address || null,                 // Always mapped
          phone: rowData.Phone || null,
          city: rowData.City || null,
          state: rowData.State || null,
          present_address: rowData.PresentAddress || null,
          permanent_address: rowData.PermanentAddress || null,
          category: category,
          email: rowData.StudentEmail || null,
          // Junior college specific fields
          admission_sought_in: rowData.Stream?.toLowerCase() || null, // arts, commerce, science
          previous_exam_details: rowData.PreviousExams ? JSON.parse(rowData.PreviousExams) : [],
          school_id,
          branch_id,
          class_id,
          section_id,
          admission_class: classRecord.name,
          current_class: classRecord.name,
          section: sectionRecord.name,
          academic_year: new Date().getFullYear().toString(),
          status: 'active',
          created_by: req.user.id,
          updated_by: req.user.id,
        };

        // Validate student required fields with strict checking
        const studentRequiredFields = [
          { field: 'FirstName', value: rowData.FirstName, name: 'First Name' },
          { field: 'Gender', value: rowData.Gender, name: 'Gender' },
          { field: 'Birthday', value: rowData.Birthday, name: 'Date of Birth' },
          { field: 'AdmissionDate', value: rowData.AdmissionDate, name: 'Admission Date' },
          { field: 'AdmissionNumber', value: rowData.AdmissionNumber, name: 'Admission Number' },
          { field: 'Category', value: rowData.Category, name: 'Category' }
        ];

        const missingStudentFields = studentRequiredFields
          .filter(field => !field.value || String(field.value).trim() === '')
          .map(field => field.name);

        if (missingStudentFields.length > 0) {
          throw new Error(`Missing required student fields: ${missingStudentFields.join(', ')}`);
        }

        // Validate guardian required fields with strict checking
        const guardianRequiredFields = [
          { field: 'GuardianName', value: rowData.GuardianName, name: 'Guardian Name' },
          { field: 'GuardianRelation', value: rowData.GuardianRelation, name: 'Guardian Relation' },
          { field: 'GuardianOccupation', value: rowData.GuardianOccupation, name: 'Guardian Occupation' },
          { field: 'GuardianIncome', value: rowData.GuardianIncome, name: 'Guardian Income' },
          { field: 'GuardianEducation', value: rowData.GuardianEducation, name: 'Guardian Education' },
          { field: 'GuardianMobileNo', value: rowData.GuardianMobileNo, name: 'Guardian Mobile No' },
          { field: 'GuardianEmail', value: rowData.GuardianEmail, name: 'Guardian Email' },
          { field: 'GuardianAddress', value: rowData.GuardianAddress, name: 'Guardian Address' }
        ];

        const missingGuardianFields = guardianRequiredFields
          .filter(field => !field.value || String(field.value).trim() === '')
          .map(field => field.name);

        if (missingGuardianFields.length > 0) {
          throw new Error(`Missing required guardian fields: ${missingGuardianFields.join(', ')}`);
        }

        // Validate gender format
        const validGenders = ['male', 'female', 'other'];
        if (!validGenders.includes(studentData.gender)) {
          throw new Error(`Invalid gender "${studentData.gender}". Must be one of: ${validGenders.join(', ')}`);
        }

        // Check for duplicate admission number
        const existingStudent = await Student.findOne({
          where: {
            admission_number: studentData.admission_number,
            school_id: school_id,
          },
        });

        if (existingStudent) {
          throw new Error(`Student with admission number ${studentData.admission_number} already exists`);
        }

        // Check for duplicate roll number in the same class-section
        if (studentData.roll_number) {
          const existingRollNumber = await Student.findOne({
            where: {
              roll_number: studentData.roll_number,
              branch_id: branch_id,
              class_id: class_id,
              section_id: section_id,
            },
          });

          if (existingRollNumber) {
            throw new Error(`Roll number ${studentData.roll_number} already exists in ${classRecord.name}-${sectionRecord.name}`);
          }
        }

        // Create student
        const student = await Student.create(studentData, { transaction });
        // Create guardian/parent (required fields already validated)
        {
          const guardianData = {
            guardian_name: rowData.GuardianName,
            guardian_phone: rowData.GuardianMobileNo,
            guardian_email: rowData.GuardianEmail,
            guardian_relation: rowData.GuardianRelation || 'guardian',
            guardian_occupation: rowData.GuardianOccupation || null,
            guardian_income: rowData.GuardianIncome !== undefined ? rowData.GuardianIncome : null, // Always mapped, allow null
            guardian_education: rowData.GuardianEducation || null,                                 // Always mapped, allow null
            address: rowData.GuardianAddress || null,
            city: rowData.City || null,
            state: rowData.State || null,
            country: 'India',
            emergency_contact: true, // Set to true since this is the emergency contact
            school_id,
            branch_id,
            created_by: req.user.id,
            updated_by: req.user.id,
            mother_name: rowData.MotherName || null, // Always mapped
          };

          // Set father or mother information based on relation
          if (guardianData.guardian_relation === 'father') {
            guardianData.father_name = rowData.GuardianName;
            guardianData.father_phone = rowData.GuardianMobileNo;
            guardianData.father_email = rowData.GuardianEmail;
            guardianData.father_occupation = rowData.GuardianOccupation || null;
          } else if (guardianData.guardian_relation === 'mother') {
            guardianData.mother_name = rowData.GuardianName;
            guardianData.mother_phone = rowData.GuardianMobileNo;
            guardianData.mother_email = rowData.GuardianEmail;
            guardianData.mother_occupation = rowData.GuardianOccupation || null;
          }

          // Set both father and mother names if provided separately
          if (rowData.FatherName) {
            guardianData.father_name = rowData.FatherName;
          }
          if (rowData.MotherName) {
            guardianData.mother_name = rowData.MotherName;
          }

          const guardian = await Parent.create(guardianData, { transaction });

          // Link student and guardian
          await StudentParent.create({
            student_id: student.id,
            parent_id: guardian.id,
            relationship: guardianData.guardian_relation,
            is_primary: true,
            is_emergency_contact: true,
          }, { transaction });
        }

        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: i + 1, // +1 because of 0-based index
          error: error.message,
          data: rowData
        });
      }
    }

    await transaction.commit();

    res.status(200).json({
      success: true,
      data: results,
      message: `Import completed. ${results.successful} students imported successfully, ${results.failed} failed.`
    });

  } catch (error) {
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      logger.error('Error rolling back transaction:', rollbackError);
    }
    logger.error('Error in bulk import:', error);
    return next(error);
  }
};

module.exports = {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  getStudentsByClass,
  getStudentStats,
  getStudentReport,
  exportStudentReport,
  bulkImportStudents,
};

