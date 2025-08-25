const { Student, Parent, StudentParent, FeeStructure, FeeInvoice, FeeType, AcademicYear, Class, Section, Stream, Branch } = require('../models');
const { Op } = require('sequelize');
const ApiError = require('../utils/ApiError');
const { logger } = require('../utils/logger');
const { sequelize } = require('../config/database');
const csv = require('csv-parser');
const { Readable } = require('stream');
const { sanitizeEnumFields } = require('../utils/studentUtils');
const { getCurrentAcademicYearForSchool } = require('../utils/academicYearUtils');

// Utility function to handle ENUM validation errors
const handleEnumValidationError = (error) => {
  
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

// Create a new student
const createStudent = async (req, res, next) => {
  try {
  
    // Handle both FormData and JSON formats
    let studentData = {};
    let guardianData = {};
    
    try {
      // Check if data is sent as FormData with JSON string
      if (req.body.studentData) {
        const parsedData = JSON.parse(req.body.studentData);
        
        // Extract student data from nested structure
        if (parsedData.student && typeof parsedData.student === 'object') {
          studentData = { ...parsedData.student };
        } else {
          studentData = { ...parsedData };
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
        if (parsedData.stream_id) studentData._stream_id = parsedData.stream_id;
        
        if (studentData.mobile_no) studentData.phone = studentData.mobile_no;
        if (typeof parsedData !== 'undefined' && 'admission_type' in parsedData) studentData.admission_type = parsedData.admission_type;
      } else {
        // Direct nested object (already parsed)
        if (req.body.student && typeof req.body.student === 'object') {
          studentData = { ...req.body.student };
         } else {
          studentData = { ...req.body };
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
        if (req.body.stream_id) studentData._stream_id = req.body.stream_id;
      }
      
      // Ensure critical fields are properly extracted from nested structure
      if (req.body.student && req.body.student.gender) {
        studentData.gender = req.body.student.gender;
      }
      if (req.body.student && req.body.student.first_name) {
        studentData.first_name = req.body.student.first_name;
      }
      if (req.body.student && req.body.student.last_name) {
        studentData.last_name = req.body.student.last_name;
      }
      if (req.body.student && req.body.student.date_of_birth) {
        studentData.date_of_birth = req.body.student.date_of_birth;
      }
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      // Fallback to flat structure
      studentData = { ...req.body };
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

    // Check for duplicate roll number in the same class-section-stream combination
    if (studentData.roll_number && studentData._class_id && studentData._section_id) {
      const rollNumberWhere = {
        roll_number: studentData.roll_number,
        branch_id: branch_id,
        class_id: studentData._class_id,
        section_id: studentData._section_id,
      };
      
      // Include stream_id in the check if it's provided (only if not null/undefined)
      if (studentData._stream_id && studentData._stream_id !== null && studentData._stream_id !== undefined) {
        rollNumberWhere.stream_id = studentData._stream_id;
      }
      
      const existingRollNumber = await Student.findOne({
        where: rollNumberWhere,
      });

      if (existingRollNumber) {
        const streamName = (studentData._stream_id && studentData._stream_id !== null && studentData._stream_id !== undefined) ? `-${studentData._stream_id}` : '';
        throw new ApiError(400, `Roll number ${studentData.roll_number} already exists in this class-section${streamName}.`, {
          errors: {
            roll_number: `Roll number ${studentData.roll_number} already exists in this class-section${streamName}.`
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
         }
      } catch (error) {
        console.error('❌ Error fetching section:', error);
      }
      delete studentData._section_id;
    }
    
    // Handle academic year - use provided ID or fallback to current academic year
    if (studentData._academic_year_id) {
      try {
        const yearRecord = await AcademicYear.findByPk(studentData._academic_year_id);
        if (yearRecord) {
          studentData.academic_year = yearRecord.name;
         }
      } catch (error) {
        console.error('❌ Error fetching academic year:', error);
      }
      delete studentData._academic_year_id;
    }
    
    // Handle stream - get stream name from ID if provided
    if (studentData._stream_id) {
      try {
        const streamRecord = await Stream.findByPk(studentData._stream_id);
        if (streamRecord) {
          studentData.stream = streamRecord.name;
          studentData.stream_id = studentData._stream_id; // Set the actual stream_id
         } else {
          console.log('❌ Stream not found with ID:', studentData._stream_id);
         }
      } catch (error) {
        console.error('❌ Error fetching stream:', error);
      }
      delete studentData._stream_id;
    } else {
      // Fallback to current academic year if no ID provided
      try {
        const currentYear = await getCurrentAcademicYearForSchool(school_id);
        if (currentYear) {
          studentData.academic_year = currentYear.name;
          } else {
          // Last resort: use current year as string
          const currentYearString = new Date().getFullYear().toString();
          studentData.academic_year = `${currentYearString}-${parseInt(currentYearString) + 1}`;
         }
      } catch (error) {
        // Last resort fallback
        const currentYearString = new Date().getFullYear().toString();
        studentData.academic_year = `${currentYearString}-${parseInt(currentYearString) + 1}`;
      }
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
    // Create student record within a transaction to prevent race conditions
    let student;
    const transaction = await sequelize.transaction();
    
    try {
      // Re-check for duplicates within transaction to prevent race conditions
      const existingStudentInTx = await Student.findOne({
        where: {
          admission_number: finalStudentData.admission_number,
          school_id: school_id,
        },
        transaction
      });

      if (existingStudentInTx) {
        await transaction.rollback();
        throw new ApiError(400, 'Student with this admission number already exists.', {
          errors: {
            admission_number: 'Student with this admission number already exists.'
          }
        });
      }

      // Re-check for duplicate roll number within transaction
      if (finalStudentData.roll_number && finalStudentData.class_id && finalStudentData.section_id) {
        const existingRollNumberInTx = await Student.findOne({
          where: {
            roll_number: finalStudentData.roll_number,
            branch_id: branch_id,
            class_id: finalStudentData.class_id,
            section_id: finalStudentData.section_id,
          },
          transaction
        });

        if (existingRollNumberInTx) {
          await transaction.rollback();
          throw new ApiError(400, `Roll number ${finalStudentData.roll_number} already exists in this class-section.`, {
            errors: {
              roll_number: `Roll number ${finalStudentData.roll_number} already exists in this class-section.`
            }
          });
        }
      }

      // Create student within transaction
      student = await Student.create(finalStudentData, { transaction });
    } catch (error) {
      await transaction.rollback();
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
        parentData.father_income = guardianData.income === '' ? null : guardianData.income;
      } else if (guardianData.relation === 'mother') {
        parentData.mother_name = guardianData.name;
        parentData.mother_phone = guardianData.mobile_no;
        parentData.mother_email = guardianData.email;
        parentData.mother_occupation = guardianData.occupation;
        parentData.mother_qualification = guardianData.education;
        parentData.mother_income = guardianData.income === '' ? null : guardianData.income;
      }

      // Always set both father and mother names if provided
      if (guardianData.father_name) {
        parentData.father_name = guardianData.father_name;
      }
      if (guardianData.mother_name) {
        parentData.mother_name = guardianData.mother_name;
      }

      // Note: Parent model doesn't have enum fields that need sanitization
      // Removed sanitizeEnumFields(parentData) call

      // Check if parent already exists with same phone number in same school/branch
      let parent;
      const existingParent = await Parent.findOne({
        where: {
          guardian_phone: parentData.guardian_phone,
          school_id: school_id,
          branch_id: branch_id,
        },
        transaction
      });

      if (existingParent) {
        console.log(`🔍 Found existing parent with phone ${parentData.guardian_phone}, linking to existing parent`);
        parent = existingParent;
      } else {
        console.log(`🔍 Creating new parent with phone ${parentData.guardian_phone}`);
        parent = await Parent.create(parentData, { transaction });
      }

      // Link student and parent
      await StudentParent.create({
        student_id: student.id,
        parent_id: parent.id,
        school_id,
        relationship: guardianData.relation || 'guardian',
        is_primary: true,
        is_fee_payer: true,
        is_emergency_contact: true,
      }, { transaction });
    }

    // Commit the transaction
    await transaction.commit();

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
      stream_id,
      school_id
    } = req.query;

    // Build where clause for Student table
    const whereClause = {};
    
    // Handle school_id and branch_id filtering based on user role
    if (req.user.role === 'super_admin') {
      // Super admin can see all students or filter by school_id
      if (school_id) {
        whereClause.school_id = school_id;
      }
      // If no school_id provided, show all students (no whereClause.school_id restriction)
    } else if (req.user.role === 'school_admin') {
      // School admin is restricted to their school
      whereClause.school_id = req.schoolId;
    } else if (req.user.role === 'branch_admin') {
      // Branch admin is restricted to their specific branch
      whereClause.school_id = req.schoolId;
      whereClause.branch_id = req.user.branch_id;
    } else {
      // Default fallback for other roles
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

    if (stream_id) {
      whereClause.stream_id = stream_id;
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
          model: Stream,
          as: 'stream',
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
    // First, try to find the student without school_id filter to see if it exists
    const studentWithoutFilter = await Student.findByPk(id);

    // Check if schoolId is set
    if (!req.schoolId) {
      throw new ApiError(500, 'School context not properly set');
    }

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
            'guardian_income', 'guardian_education', 'guardian_occupation',
            'guardian_relation', 'city', 'state', 'address'
          ],
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'code'],
        },
        {
          model: Stream,
          as: 'stream',
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
      throw new ApiError(404, 'Student not found');
    }

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
    
    try {
      // Check if data is sent as FormData with JSON string
      if (updates.studentData) {
        const parsedData = JSON.parse(updates.studentData);
        
        // Extract student data from nested structure
        if (parsedData.student && typeof parsedData.student === 'object') {
          studentUpdates = { ...parsedData.student };
        } else {
          studentUpdates = { ...parsedData };
        }
        
        // Extract academic fields from main structure
        if (parsedData.roll_number) studentUpdates.roll_number = parsedData.roll_number;
        if (parsedData.admission_date) academicUpdates.admission_date = parsedData.admission_date;
        if (parsedData.category) academicUpdates.category = parsedData.category;
        if (parsedData.admission_number) academicUpdates.admission_number = parsedData.admission_number;
        
        // Store class_id, section_id, and stream_id for later processing
        if (parsedData.class_id) academicUpdates._class_id = parsedData.class_id;
        if (parsedData.section_id) academicUpdates._section_id = parsedData.section_id;
        if (parsedData.academic_year_id) academicUpdates._academic_year_id = parsedData.academic_year_id;
        if (parsedData.stream_id) academicUpdates._stream_id = parsedData.stream_id;
        
        if (studentUpdates.mobile_no) studentUpdates.phone = studentUpdates.mobile_no;
        if (typeof parsedData !== 'undefined' && 'admission_type' in parsedData) studentUpdates.admission_type = parsedData.admission_type;
      } else if (updates.student && typeof updates.student === 'object') {
        // Direct nested object (already parsed) - this is the current case
        studentUpdates = { ...updates.student };
        // Extract academic fields from main structure
        if (updates.roll_number) studentUpdates.roll_number = updates.roll_number;
        if (updates.admission_date) academicUpdates.admission_date = updates.admission_date;
        if (updates.category) academicUpdates.category = updates.category;
        if (updates.admission_number) academicUpdates.admission_number = updates.admission_number;
        
        // Store class_id and section_id for later processing
        if (updates.class_id) academicUpdates._class_id = updates.class_id;
        if (updates.section_id) academicUpdates._section_id = updates.section_id;
        if (updates.academic_year_id) academicUpdates._academic_year_id = updates.academic_year_id;
        if (updates.stream_id) academicUpdates._stream_id = updates.stream_id;
        
        if (studentUpdates.mobile_no) studentUpdates.phone = studentUpdates.mobile_no;
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
    
    if (academicUpdates._stream_id) {
      try {
        const streamRecord = await Stream.findByPk(academicUpdates._stream_id);
        if (streamRecord) {
          academicUpdates.stream = streamRecord.name;
          academicUpdates.stream_id = academicUpdates._stream_id; // Set the actual stream_id
          console.log('🔍 Stream name resolved:', streamRecord.name);
        }
      } catch (error) {
        console.error('❌ Error fetching stream:', error);
      }
      delete academicUpdates._stream_id;
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

    // Check for duplicate roll number in the same class-section-stream combination (only if roll number is being updated)
    if (updateData.roll_number && updateData.roll_number !== student.roll_number) {
      const rollNumberWhere = {
        roll_number: updateData.roll_number,
        branch_id: student.branch_id,
        class_id: updateData.class_id || student.class_id,
        section_id: updateData.section_id || student.section_id,
        id: { [Op.ne]: student.id }, // Exclude current student
      };
      
      // Include stream_id in the check if it's being updated or if student has one (only if not null/undefined)
      if (updateData.stream_id && updateData.stream_id !== null && updateData.stream_id !== undefined) {
        rollNumberWhere.stream_id = updateData.stream_id;
      } else if (student.stream_id && student.stream_id !== null && student.stream_id !== undefined) {
        rollNumberWhere.stream_id = student.stream_id;
      }
      
      const existingRollNumber = await Student.findOne({
        where: rollNumberWhere,
      });

      if (existingRollNumber) {
        const streamName = (rollNumberWhere.stream_id && rollNumberWhere.stream_id !== null && rollNumberWhere.stream_id !== undefined) ? `-${rollNumberWhere.stream_id}` : '';
        throw new ApiError(400, `Roll number ${updateData.roll_number} already exists in this class-section${streamName}.`);
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
    const { class_name, class_names, section, academic_year, status = 'active', fee_structure_id } = req.query;

    if (!class_name && !class_names && !fee_structure_id) {
      throw new ApiError(400, 'Class name, class names array, or fee structure ID is required');
    }

    const whereClause = {
      school_id: req.schoolId,
      status,
    };

    // Add branch filtering for branch_admin
    if (req.user.role === 'branch_admin') {
      whereClause.branch_id = req.user.branch_id;
    }

    // Handle fee structure ID - fetch students from all applicable classes
    if (fee_structure_id) {
      const feeStructure = await FeeStructure.findByPk(fee_structure_id);

      if (!feeStructure) {
        throw new ApiError(404, 'Fee structure not found');
      }

      // ✅ Normalize applicable classes (array or JSON string)
      let applicableClasses = [];
      if (feeStructure.applicable_classes) {
        if (typeof feeStructure.applicable_classes === 'string') {
          try {
            applicableClasses = JSON.parse(feeStructure.applicable_classes);
          } catch {
            applicableClasses = [];
          }
        } else if (Array.isArray(feeStructure.applicable_classes)) {
          applicableClasses = feeStructure.applicable_classes;
        }
      }

      // ✅ If no array found, fallback to single class_name
      if (!applicableClasses || applicableClasses.length === 0) {
        applicableClasses = [feeStructure.class_name];
      }

      console.log('✅ Final applicableClasses for this fee structure:', applicableClasses);

      // ✅ Always use Op.in (even if 1 class)
      whereClause.current_class = { [Op.in]: applicableClasses };

      // ✅ Academic year fallback
      whereClause.academic_year = academic_year || feeStructure.academic_year;
    }
    // Handle multiple classes if provided directly
    else if (class_names && Array.isArray(JSON.parse(class_names))) {
      const classNames = JSON.parse(class_names);
      whereClause.current_class = {
        [Op.in]: classNames
      };
      logger.info(`Fetching students for multiple classes: ${classNames.join(', ')}`);
    } 
    // Handle single class name
    else if (class_name) {
      whereClause.current_class = class_name;
      logger.info(`Fetching students for single class: ${class_name}`);
    }

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

    logger.info(`Found ${students.length} students for the specified criteria`);
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
    
    // Handle school_id and branch_id filtering based on user role
    if (req.user.role === 'super_admin') {
      // Super admin must provide school_id to see students
      if (school_id) {
        whereClause.school_id = school_id;
      } else {
        // If no school_id provided, return empty stats for security
        return res.status(200).json({
          success: true,
          data: {
            total: 0,
            active: 0,
            inactive: 0,
            graduated: 0,
            dropped: 0,
            newThisMonth: 0,
            classCount: 0,
            class_distribution: [],
            branch_distribution: [],
          }
        });
      }
    } else if (req.user.role === 'school_admin') {
      // School admin is restricted to their school
      whereClause.school_id = req.schoolId;
    } else if (req.user.role === 'branch_admin') {
      // Branch admin is restricted to their specific branch
      whereClause.school_id = req.schoolId;
      whereClause.branch_id = req.user.branch_id;
    } else {
      // Default fallback for other roles
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
      from_date,
      to_date,
      sort_by = 'created_at',
      sort_order = 'DESC',
      school_id,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause based on user role
    let whereClause = {};
    
    // Handle school_id filtering based on user role
    if (req.user.role === 'super_admin') {
      // Super admin must provide school_id to see students
      if (school_id) {
        whereClause.school_id = school_id;
      } else {
        // If no school_id provided, return empty report for security
        return res.status(200).json({
          success: true,
          data: [],
          pagination: {
            current_page: parseInt(page),
            total_pages: 0,
            total_count: 0,
            limit: parseInt(limit),
          }
        });
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
    
    // Add date range filters
    if (from_date || to_date) {
      whereClause.admission_date = {};
      if (from_date) {
        whereClause.admission_date[Op.gte] = new Date(from_date);
      }
      if (to_date) {
        whereClause.admission_date[Op.lte] = new Date(to_date);
      }
    }

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
      // Super admin must provide school_id to see students
      if (school_id) {
        whereClause.school_id = school_id;
      } else {
        // If no school_id provided, return empty export for security
        return res.status(200).json({
          success: true,
          data: [],
          message: 'No data to export - school_id required for super admin',
        });
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
  try {
    if (!req.file) {
      throw new ApiError(400, 'CSV file is required');
    }

    const { branch_id, class_id, section_id, academic_year_id } = req.body;
    
    // Validate required fields
    if (!branch_id || !class_id) {
      throw new ApiError(400, 'Branch and Class are required');
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
      'FirstName', 'Gender', 'Birthday', 'AdmissionDate', 'AdmissionNumber',
      'GuardianName', 'GuardianRelation', 'GuardianMobileNo', 'GuardianAddress'
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
    if (!classRecord) {
      throw new ApiError(400, 'Invalid class ID');
    }
    
    let sectionRecord = null;
    if (section_id) {
      sectionRecord = await Section.findByPk(section_id);
      if (!sectionRecord) {
        throw new ApiError(400, 'Invalid section ID');
      }
    }

    // Get academic year name - use provided ID or fallback to current academic year
    let academicYearName;
    if (academic_year_id) {
      const academicYearRecord = await AcademicYear.findByPk(academic_year_id);
      if (academicYearRecord) {
        academicYearName = academicYearRecord.name;

      }
    }
    
    // Fallback to current academic year if no ID provided or ID not found
    if (!academicYearName) {
      try {
        const currentYear = await getCurrentAcademicYearForSchool(school_id);
        if (currentYear) {
          academicYearName = currentYear.name;
          console.log('🔍 Bulk import: Academic year fallback to current:', academicYearName);
        } else {
          // Last resort: use current year as string
          const currentYearString = new Date().getFullYear().toString();
          academicYearName = `${currentYearString}-${(parseInt(currentYearString) + 1).toString().slice(-2)}`;
          console.log('🔍 Bulk import: Academic year last resort:', academicYearName);
        }
      } catch (error) {
        console.error('❌ Error fetching current academic year for bulk import:', error);
        // Last resort fallback
        const currentYearString = new Date().getFullYear().toString();
        academicYearName = `${currentYearString}-${(parseInt(currentYearString) + 1).toString().slice(-2)}`;
      }
    }

    const results = {
      total: dataRows.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    // Process each row with individual transactions
    for (let i = 0; i < dataRows.length; i++) {
      const rowData = dataRows[i];
      if (!rowData || Object.keys(rowData).length === 0) continue;

      const rowTransaction = await sequelize.transaction();
      
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
          first_name: rowData.FirstName ? rowData.FirstName.substring(0, 50) : null,
          last_name: rowData.LastName ? rowData.LastName.substring(0, 50) : null, // Now optional
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
          phone: rowData.Phone ? rowData.Phone.substring(0, 20) : null,
          city: rowData.City || null,
          state: rowData.State || null,
          present_address: rowData.PresentAddress || null,
          permanent_address: rowData.PermanentAddress || null,
          category: category,
          email: rowData.StudentEmail || null,
          // Junior college specific fields
          admission_sought_in: rowData.Stream?.toLowerCase() || null, // arts, commerce, science
          previous_exam_details: (() => {
            try {
              return rowData.PreviousExams ? JSON.parse(rowData.PreviousExams) : [];
            } catch (parseError) {
              return [];
            }
          })(),
          school_id,
          branch_id,
          class_id,
          section_id: section_id || null,
          stream_id: req.body.stream_id || null, // Add stream_id from request body
          admission_class: classRecord.name,
          current_class: classRecord.name,
          section: sectionRecord ? sectionRecord.name : null,
          academic_year: academicYearName,
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
          { field: 'AdmissionNumber', value: rowData.AdmissionNumber, name: 'Admission Number' }
        ];

        const missingStudentFields = studentRequiredFields
          .filter(field => !field.value || String(field.value).trim() === '')
          .map(field => field.name);

        if (missingStudentFields.length > 0) {
          throw new Error(`Missing required student fields: ${missingStudentFields.join(', ')}`);
        }

        // Validate field lengths
        if (rowData.FirstName && rowData.FirstName.length > 50) {
          throw new Error(`First name too long (${rowData.FirstName.length} chars, max 50): ${rowData.FirstName.substring(0, 30)}...`);
        }
        if (rowData.LastName && rowData.LastName.length > 50) {
          throw new Error(`Last name too long (${rowData.LastName.length} chars, max 50): ${rowData.LastName.substring(0, 30)}...`);
        }
        if (rowData.Phone && rowData.Phone.length > 20) {
          throw new Error(`Phone number too long (${rowData.Phone.length} chars, max 20): ${rowData.Phone}`);
        }

        // Validate guardian required fields with strict checking
        const guardianRequiredFields = [
          { field: 'GuardianName', value: rowData.GuardianName, name: 'Guardian Name' },
          { field: 'GuardianRelation', value: rowData.GuardianRelation, name: 'Guardian Relation' },
          { field: 'GuardianMobileNo', value: rowData.GuardianMobileNo, name: 'Guardian Mobile No' },
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
          transaction: rowTransaction
        });

        if (existingStudent) {
          throw new Error(`Student with admission number ${studentData.admission_number} already exists`);
        }

        // Check for duplicate roll number in the same class-section-stream combination
        if (studentData.roll_number) {
          const rollNumberWhere = {
            roll_number: studentData.roll_number,
            branch_id: branch_id,
            class_id: class_id,
          };
          
          // Only include section_id in the query if it's provided
          if (section_id) {
            rollNumberWhere.section_id = section_id;
          }
          
          // Include stream_id in the check if it's provided (only if not null/undefined)
          if (req.body.stream_id && req.body.stream_id !== null && req.body.stream_id !== undefined) {
            rollNumberWhere.stream_id = req.body.stream_id;
          }
          
          const existingRollNumber = await Student.findOne({
            where: rollNumberWhere,
            transaction: rowTransaction
          });

          if (existingRollNumber) {
            const sectionName = sectionRecord ? sectionRecord.name : 'No Section';
            const streamName = (req.body.stream_id && req.body.stream_id !== null && req.body.stream_id !== undefined) ? `-${req.body.stream_id}` : '';
            throw new Error(`Roll number ${studentData.roll_number} already exists in ${classRecord.name}-${sectionName}${streamName}`);
          }
        }

        // Create student
        const student = await Student.create(studentData, { transaction: rowTransaction });
        // Create guardian/parent (required fields already validated)
        {
          const guardianData = {
            guardian_name: rowData.GuardianName ? rowData.GuardianName.substring(0, 100) : null,
            guardian_phone: rowData.GuardianMobileNo ? rowData.GuardianMobileNo.substring(0, 20) : null,
            guardian_email: rowData.GuardianEmail || null,
            guardian_relation: rowData.GuardianRelation?.toLowerCase() || 'guardian',
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
            guardianData.father_name = rowData.GuardianName ? rowData.GuardianName.substring(0, 100) : null;
            guardianData.father_phone = rowData.GuardianMobileNo ? rowData.GuardianMobileNo.substring(0, 20) : null;
            guardianData.father_email = rowData.GuardianEmail || null;
            guardianData.father_occupation = rowData.GuardianOccupation || null;
            guardianData.father_qualification = rowData.GuardianEducation || null;
            guardianData.father_income = rowData.GuardianIncome !== undefined ? rowData.GuardianIncome : null;
          } else if (guardianData.guardian_relation === 'mother') {
            guardianData.mother_name = rowData.GuardianName ? rowData.GuardianName.substring(0, 100) : null;
            guardianData.mother_phone = rowData.GuardianMobileNo ? rowData.GuardianMobileNo.substring(0, 20) : null;
            guardianData.mother_email = rowData.GuardianEmail || null;
            guardianData.mother_occupation = rowData.GuardianOccupation || null;
            guardianData.mother_qualification = rowData.GuardianEducation || null;
            guardianData.mother_income = rowData.GuardianIncome !== undefined ? rowData.GuardianIncome : null;
          }

          // Set both father and mother names if provided separately
          if (rowData.FatherName) {
            guardianData.father_name = rowData.FatherName.substring(0, 100);
          }
          if (rowData.MotherName) {
            guardianData.mother_name = rowData.MotherName.substring(0, 100);
          }

          // Check if parent already exists with same phone number in same school/branch
          let guardian;
          const existingParent = await Parent.findOne({
            where: {
              guardian_phone: guardianData.guardian_phone,
              school_id: school_id,
              branch_id: branch_id,
            },
            transaction: rowTransaction
          });

          if (existingParent) {
            guardian = existingParent;
          } else {
            guardian = await Parent.create(guardianData, { transaction: rowTransaction });
          }



          // Link student and guardian
          await StudentParent.create({
            student_id: student.id,
            parent_id: guardian.id,
            relationship: guardianData.guardian_relation,
            is_primary: true,
            is_emergency_contact: true,
          }, { transaction: rowTransaction });
        }

        // Commit the row transaction
        await rowTransaction.commit();
        results.successful++;
      } catch (error) {
        // Rollback the row transaction
        try {
          await rowTransaction.rollback();
        } catch (rollbackError) {
          // Ignore rollback errors
        }
        
        results.failed++;
        results.errors.push({
          row: i + 1, // +1 because of 0-based index
          error: error.message,
          data: rowData
        });
      }
    }

    res.status(200).json({
      success: true,
      data: results,
      message: `Import completed. ${results.successful} students imported successfully, ${results.failed} failed.`
    });

  } catch (error) {
    logger.error('Error in bulk import:', error);
    return next(error);
  }
};

// Get student invoice breakdown for accordion details
const getStudentInvoiceBreakdown = async (req, res, next) => {
  try {
    const { id: studentId } = req.params;
    const { academic_year, status, payment_model } = req.query;

    // Get student
    const student = await Student.findOne({
      where: {
        id: studentId,
        school_id: req.schoolId,
      },
      include: [
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name', 'code'],
        },
      ],
    });

    if (!student) {
      throw new ApiError(404, 'Student not found');
    }

    // Build invoice filter
    const invoiceWhereClause = {
      student_id: studentId,
      school_id: req.schoolId,
    };

    if (academic_year && academic_year.trim() !== '') {
      invoiceWhereClause.academic_year = academic_year;
    }
    if (status && status.trim() !== '') {
      invoiceWhereClause.status = status;
    }
    if (payment_model && payment_model.trim() !== '') {
      invoiceWhereClause.payment_model = payment_model;
    }

    // Get all invoices for this student
    const invoices = await FeeInvoice.findAll({
      where: invoiceWhereClause,
      include: [
        {
          model: FeeStructure,
          as: 'feeStructure',
          include: [
            {
              model: FeeType,
              as: 'feeType',
            },
          ],
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name', 'code'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    // Group invoices by receipt_group_id for paid/partial_paid invoices
    const groupedInvoices = {};
    const ungroupedInvoices = [];

    invoices.forEach(invoice => {
      // Only group invoices that have a receipt_group_id AND are paid/partial_paid
      if (invoice.receipt_group_id && ['paid', 'partial_paid'].includes(invoice.status)) {
        if (!groupedInvoices[invoice.receipt_group_id]) {
          groupedInvoices[invoice.receipt_group_id] = {
            receipt_group_id: invoice.receipt_group_id,
            invoices: [],
            total_amount: 0,
            total_paid: 0,
            total_balance: 0,
            payment_date: invoice.last_payment_date,
            payment_method: invoice.payment_method,
            transaction_id: invoice.transaction_id,
            status: invoice.status,
          };
        }
        groupedInvoices[invoice.receipt_group_id].invoices.push(invoice);
        groupedInvoices[invoice.receipt_group_id].total_amount += parseFloat(invoice.total_amount || 0);
        groupedInvoices[invoice.receipt_group_id].total_paid += parseFloat(invoice.paid_amount || 0);
        groupedInvoices[invoice.receipt_group_id].total_balance += parseFloat(invoice.balance_amount || 0);
      } else {
        // All other invoices (including paid invoices without receipt_group_id) go to ungrouped
        ungroupedInvoices.push(invoice);
      }
    });

    // Debug logging to help identify issues
    console.log('🔍 Invoice Breakdown Debug:', {
      totalInvoices: invoices.length,
      groupedInvoices: Object.keys(groupedInvoices).length,
      ungroupedInvoices: ungroupedInvoices.length,
      paidInvoices: invoices.filter(inv => inv.status === 'paid').length,
      paidInUngrouped: ungroupedInvoices.filter(inv => inv.status === 'paid').length,
      paidInGrouped: Object.values(groupedInvoices).reduce((sum, group) => sum + group.invoices.filter(inv => inv.status === 'paid').length, 0)
    });

    // Helper function to get month name
    const getMonthName = (month) => {
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      return months[month - 1] || month;
    };

    // Convert grouped invoices to array format
    const groupedArray = Object.values(groupedInvoices).map(group => {
      const months = group.invoices.map(inv => inv.month).sort((a, b) => a - b);
      const years = [...new Set(group.invoices.map(inv => inv.year))];
      
      const monthNames = group.invoices.map(inv => {
        const monthName = getMonthName(inv.month);
        return `${monthName} ${inv.year}`;
      }).join(', ');
      
      // Get branch information from the first invoice that has branch data
      let branchData = null;
      for (const invoice of group.invoices) {
        if (invoice.branch) {
          branchData = invoice.branch;
          break;
        }
      }
      
      // If no branch data found in invoices, use student's branch as fallback
      if (!branchData && student.branch) {
        branchData = student.branch;
      }
      
      return {
        id: group.receipt_group_id,
        receipt_group_id: group.receipt_group_id,
        invoice_number: group.receipt_group_id, // Show the receipt group ID for grouped payments
        fee_type: group.invoices[0]?.feeStructure?.feeType?.name || 'Unknown',
        class_name: group.invoices[0]?.class_name,
        section: group.invoices[0]?.section,
        total_amount: group.total_amount,
        paid_amount: group.total_paid,
        balance_amount: group.total_balance,
        due_date: group.invoices[0]?.due_date,
        status: group.total_balance <= 0 ? 'paid' : 'partial_paid',
        academic_year: group.invoices[0]?.academic_year,
        month: months[0],
        year: years[0],
        months_covered: group.invoices.length,
        month_names: monthNames,

        payment_date: group.payment_date,
        payment_method: group.payment_method,
        transaction_id: group.transaction_id,
        payment_model: group.invoices[0]?.payment_model,
        branch: branchData,
        is_grouped: true
      };
    });

    // Sort by payment date (newest first)
    groupedArray.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

    // Calculate paid count correctly - count individual invoices with status = 'paid'
    const paidCount = invoices.filter(inv => inv.status === 'paid').length;
    const pendingCount = invoices.filter(inv => inv.status === 'sent').length;
    const overdueCount = invoices.filter(inv => inv.status === 'overdue').length;
    const partialCount = invoices.filter(inv => inv.status === 'partial_paid').length;

    // Add month information to ungrouped invoices for debugging
    ungroupedInvoices.forEach(invoice => {
      if (invoice.month && invoice.year) {
        const monthName = getMonthName(invoice.month);
        invoice.month_display = `${monthName} ${invoice.year}`;
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        student: {
          id: student.id,
          name: `${student.first_name} ${student.last_name}`,
          admission_number: student.admission_number,
          current_class: student.current_class,
          section: student.section,
          branch: student.branch,
        },
        grouped_invoices: groupedArray,
        ungrouped_invoices: ungroupedInvoices,
        summary: {
          total_invoices: invoices.length,
          total_grouped: groupedArray.length,
          total_ungrouped: ungroupedInvoices.length,
          total_amount: invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0),
          total_paid: invoices.reduce((sum, inv) => sum + parseFloat(inv.paid_amount || 0), 0),
          total_balance: invoices.reduce((sum, inv) => sum + parseFloat(inv.balance_amount || 0), 0),
          paid_count: paidCount,
          pending_count: pendingCount,
          overdue_count: overdueCount,
          partial_count: partialCount,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching student invoice breakdown:', error);
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
  getStudentInvoiceBreakdown,
};

