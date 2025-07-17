const { Student, Parent, StudentParent, FeeStructure, FeeInvoice, FeeType, AcademicYear, Class, Section } = require('../models');
const { Op } = require('sequelize');
const ApiError = require('../utils/ApiError');
const { logger } = require('../utils/logger');

// Create a new student
const createStudent = async (req, res, next) => {
  try {
    const {
      admission_number,
      first_name,
      last_name,
      email,
      phone,
      academic_year,
      admission_class,
      current_class,
      section,
      parents,
    } = req.body;

    // Check if student already exists
    const existingStudent = await Student.findOne({
      where: {
        admission_number,
        school_id: req.schoolId,
      },
    });

    if (existingStudent) {
      throw new ApiError(400, 'Student with this admission number already exists.');
    }

    // Create student record
    const student = await Student.create({
      admission_number,
      first_name,
      last_name,
      email,
      phone,
      academic_year,
      admission_class,
      current_class,
      section,
      school_id: req.schoolId,
      created_by: req.user.id,
    });

    // Create parent records and associations
    if (parents && parents.length > 0) {
      for (const parentData of parents) {
        const parent = await Parent.create({
          ...parentData,
          school_id: req.schoolId,
          created_by: req.user.id,
        });

        // Link student and parent
        await StudentParent.create({
          student_id: student.id,
          parent_id: parent.id,
          school_id: req.schoolId,
          relationship: parentData.relationship || 'father',
          is_primary: parentData.is_primary || false,
          is_fee_payer: parentData.is_fee_payer || false,
          is_emergency_contact: parentData.is_emergency_contact || false,
        });
      }
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
      section_id
    } = req.query;

    // Build where clause for Student table
    const whereClause = {};
    
    // Only filter by school_id if it's provided (for school_admin and branch_admin)
    // Super admin can see all students
    if (req.schoolId) {
      whereClause.school_id = req.schoolId;
    }

    // Apply filters
    if (search) {
      whereClause[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { admission_number: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (academic_year) whereClause.academic_year = academic_year;
    if (class_name) whereClause.current_class = class_name;
    if (section) whereClause.section = section;
    if (status) whereClause.status = status;
    if (branch_id) whereClause.branch_id = branch_id;

    // Handle class_id and section_id by getting their codes/names
    if (class_id) {
      const classRecord = await Class.findByPk(class_id);
      if (classRecord) {
        // Students are stored with class codes (I, II, III), not full names
        whereClause.current_class = classRecord.code;
      }
    }

    if (section_id) {
      const sectionRecord = await Section.findByPk(section_id);
      if (sectionRecord) {
        whereClause.section = sectionRecord.name;
      }
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
        if (parsedData.roll_number) academicUpdates.roll_number = parsedData.roll_number;
        if (parsedData.admission_date) academicUpdates.admission_date = parsedData.admission_date;
        if (parsedData.category) academicUpdates.category = parsedData.category;
        if (parsedData.register_no) academicUpdates.admission_number = parsedData.register_no;
        
        // Store class_id and section_id for later processing
        if (parsedData.class_id) academicUpdates._class_id = parsedData.class_id;
        if (parsedData.section_id) academicUpdates._section_id = parsedData.section_id;
        if (parsedData.academic_year_id) academicUpdates._academic_year_id = parsedData.academic_year_id;
        
      } else if (updates.student && typeof updates.student === 'object') {
        // Direct nested object (already parsed) - this is the current case
        studentUpdates = { ...updates.student };
        console.log('🔍 Extracted student data from direct object:', studentUpdates);
        console.log('🔍 First name from student object:', studentUpdates.first_name);
        
        // Extract academic fields from main structure
        if (updates.roll_number) academicUpdates.roll_number = updates.roll_number;
        if (updates.admission_date) academicUpdates.admission_date = updates.admission_date;
        if (updates.category) academicUpdates.category = updates.category;
        if (updates.register_no) academicUpdates.admission_number = updates.register_no;
        
        // Store class_id and section_id for later processing
        if (updates.class_id) academicUpdates._class_id = updates.class_id;
        if (updates.section_id) academicUpdates._section_id = updates.section_id;
        if (updates.academic_year_id) academicUpdates._academic_year_id = updates.academic_year_id;
        
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
          console.log('🔍 Section name resolved:', sectionRecord.name);
        } else {
          console.log('⚠️ Section not found with ID:', academicUpdates._section_id);
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
    
    console.log('🔍 Data being sent to database update:', updateData);
    console.log('🔍 Section field in update data:', updateData.section);
    console.log('🔍 Admission class field in update data:', updateData.admission_class);
    console.log('🔍 Current class field in update data:', updateData.current_class);

    await student.update(updateData);
    
    // Log what was actually saved
    console.log('✅ Update completed');
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
          address: guardianUpdates.address,
          city: guardianUpdates.city,
          state: guardianUpdates.state,
          emergency_contact: guardianUpdates.mobile_no,
          emergency_relation: guardianUpdates.relation,
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
        console.log('✅ Guardian information updated successfully');
      } else {
        console.log('⚠️ No primary parent found for student');
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
      section_id 
    } = req.query;

    const whereClause = {};
    
    // Only filter by school_id if it's provided (for school_admin and branch_admin)
    // Super admin can see all students
    if (req.schoolId) {
      whereClause.school_id = req.schoolId;
    }

    if (academic_year) whereClause.academic_year = academic_year;
    if (branch_id) whereClause.branch_id = branch_id;

    // Handle class_id and section_id by getting their codes/names
    if (class_id) {
      const classRecord = await Class.findByPk(class_id);
      if (classRecord) {
        // Students are stored with class codes (I, II, III), not full names
        whereClause.current_class = classRecord.code;
      }
    }

    if (section_id) {
      const sectionRecord = await Section.findByPk(section_id);
      if (sectionRecord) {
        whereClause.section = sectionRecord.name;
      }
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

    const stats = {
      total: totalStudents,
      active: activeStudents,
      inactive: inactiveStudents,
      graduated: graduatedStudents,
      dropped: droppedStudents,
      class_distribution: classDistribution,
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
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause based on user role
    let whereClause = {};
    
    // Only filter by school_id if it's provided (for school_admin and branch_admin)
    // Super admin can see all students
    if (req.schoolId) {
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
        { admission_number: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
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
          as: 'section',
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
    const {
      academic_year,
      class_name,
      section_name,
      status,
      search,
      format = 'xlsx',
    } = req.query;

    // Build where clause
    let whereClause = {};
    
    // Only filter by school_id if it's provided (for school_admin and branch_admin)
    // Super admin can see all students
    if (req.schoolId) {
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
        { admission_number: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const students = await Student.findAll({
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
          as: 'section',
          attributes: ['id', 'name'],
        },
      ],
      order: [['first_name', 'ASC'], ['last_name', 'ASC']],
    });

    if (format === 'xlsx') {
      const XLSX = require('xlsx');
      
      // Prepare data for Excel
      const excelData = students.map(student => ({
        'Admission Number': student.admission_number,
        'First Name': student.first_name,
        'Last Name': student.last_name,
        'Email': student.email,
        'Phone': student.phone,
        'Date of Birth': student.date_of_birth,
        'Gender': student.gender,
        'Current Class': student.current_class,
        'Section': student.section,
        'Academic Year': student.academic_year,
        'Status': student.status,
        'Admission Date': student.admission_date,
        'Address': student.address,
        'Father Name': student.parents?.find(p => p.StudentParent?.relationship === 'father')?.first_name + ' ' + student.parents?.find(p => p.StudentParent?.relationship === 'father')?.last_name || '',
        'Mother Name': student.parents?.find(p => p.StudentParent?.relationship === 'mother')?.first_name + ' ' + student.parents?.find(p => p.StudentParent?.relationship === 'mother')?.last_name || '',
        'Guardian Phone': student.parents?.find(p => p.StudentParent?.is_primary)?.phone || '',
        'Created At': student.createdAt,
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, 'Students');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=students-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      return res.send(buffer);
    } else if (format === 'csv') {
      // CSV export
      const csvData = students.map(student => ({
        admission_number: student.admission_number,
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email,
        phone: student.phone,
        date_of_birth: student.date_of_birth,
        gender: student.gender,
        current_class: student.current_class,
        section: student.section,
        academic_year: student.academic_year,
        status: student.status,
        admission_date: student.admission_date,
        address: student.address,
        created_at: student.createdAt,
      }));

      const csv = require('csv-stringify');
      csv(csvData, { header: true }, (err, output) => {
        if (err) {
          return next(err);
        }
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=students-report-${new Date().toISOString().split('T')[0]}.csv`);
        
        return res.send(output);
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported export format. Use xlsx or csv.',
      });
    }
  } catch (error) {
    logger.error('Error exporting student report:', error);
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
};

