const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const Admission = require('../models/admission.model');
const Student = require('../models/student.model');
const Parent = require('../models/parent.model');
const StudentParent = require('../models/student-parent.model');
const AcademicYear = require('../models/academic-year.model');
const Class = require('../models/class.model');
const Section = require('../models/section.model');
const School = require('../models/school.model');
const Branch = require('../models/branch.model');
const FeeStructure = require('../models/fee-structure.model');
const FeeType = require('../models/fee-type.model');
const FeeInvoice = require('../models/fee-invoice.model');
const User = require('../models/user.model');
const { logger } = require('../utils/logger');
const xlsx = require('xlsx');

/**
 * Generate random password for guardian accounts
 */
const generateRandomPassword = (length = 8) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

/**
 * Get all admissions with filtering and pagination
 */
const getAllAdmissions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, academic_year, class_name, admission_type } = req.query;
    const offset = (page - 1) * limit;
    
    // Build where condition based on user role
    let whereCondition = {};
    
    // Super admin can see all admissions
    if (req.user.role === 'super_admin') {
      // No restrictions
    } else if (req.user.role === 'school_admin') {
      // School admin can see admissions for their school
      whereCondition.school_id = req.user.school_id;
    } else {
      // Branch level users can see admissions for their branch only
      whereCondition.branch_id = req.user.branch_id;
    }
    
    // Apply filters
    if (status) {
      if (status.includes(',')) {
        // Handle multiple statuses (comma-separated)
        const statusArray = status.split(',').map(s => s.trim());
        whereCondition.status = { [Op.in]: statusArray };
      } else {
        whereCondition.status = status;
      }
    }
    if (academic_year) whereCondition.academic_year = academic_year;
    if (class_name) whereCondition.applied_class = { [Op.like]: `%${class_name}%` };
    if (admission_type) whereCondition.admission_type = admission_type;
    
    const admissions = await Admission.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Student,
          as: 'student',
          include: [
            {
              model: Parent,
              as: 'parents',
              attributes: ['id', 'father_name', 'mother_name', 'guardian_name', 'father_phone', 'mother_phone', 'guardian_phone', 'father_email', 'mother_email', 'guardian_email', 'guardian_relation']
            }
          ]
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name', 'code']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      data: admissions.rows,
      pagination: {
        total: admissions.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(admissions.count / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching admissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admissions',
      error: error.message
    });
  }
};

/**
 * Create new admission application
 */
const createAdmission = async (req, res) => {
  try {
    // Parse JSON data from FormData if present
    console.log('🔍 Raw request body:', req.body);
    console.log('📁 Files received:', req.files ? Object.keys(req.files) : 'No files');
    
    let admissionData;
    try {
      admissionData = req.body.admissionData ? JSON.parse(req.body.admissionData) : req.body;
      console.log('✅ Parsed admission data:', JSON.stringify(admissionData, null, 2));
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON data in admission data',
        error: parseError.message,
      });
    }

    // Check if this is a comprehensive admission (with student/guardian data)
    if (admissionData.student && admissionData.guardian) {
      return await createComprehensiveAdmission(req, res, admissionData);
    }

    // Determine school_id and branch_id based on user role
    let school_id, branch_id;
    if (req.user.role === 'super_admin') {
      school_id = admissionData.school_id;
      branch_id = admissionData.branch_id;
      if (!school_id || !branch_id) {
        return res.status(400).json({
          success: false,
          message: 'School ID and Branch ID are required for super admin',
        });
      }
    } else if (req.user.role === 'school_admin') {
      school_id = req.user.school_id;
      branch_id = admissionData.branch_id || req.user.branch_id;
    } else {
      school_id = req.user.school_id;
      branch_id = req.user.branch_id;
    }

    // Handle file uploads
    const uploadedFiles = {};
    if (req.files) {
      Object.keys(req.files).forEach(key => {
        if (req.files[key] && req.files[key][0]) {
          uploadedFiles[key] = req.files[key][0].filename;
        }
      });
    }

    // Create admission record - using the actual database schema
    const admissionRecord = {
      application_number: `APP${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      student_id: null, // Will be set when student is created later
      first_name: admissionData.first_name,
      last_name: admissionData.last_name,
      middle_name: admissionData.middle_name || '',
      date_of_birth: admissionData.date_of_birth,
      gender: admissionData.gender,
      email: admissionData.email,
      phone: admissionData.phone,
      address: admissionData.address,
      city: admissionData.city,
      state: admissionData.state,
      postal_code: admissionData.postal_code,
      country: admissionData.country || 'India',
      applied_class: admissionData.applied_class,
      academic_year: admissionData.academic_year,
      admission_type: admissionData.admission_type || 'new',
      status: 'pending',
      application_date: admissionData.application_date,
      documents: uploadedFiles,
      notes: admissionData.notes || 'Admission application submitted',
      school_id,
      branch_id,
      created_by: req.user.id,
      updated_by: req.user.id,
    };

    // Create new admission
    const admission = await Admission.create(admissionRecord);
    
    // Return the created admission
    res.status(201).json({
      success: true,
      data: admission,
      message: 'Admission application created successfully'
    });
  } catch (error) {
    logger.error('Error creating admission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create admission',
      error: error.message
    });
  }
};

/**
 * Create comprehensive admission with student, guardian, and login credentials
 */
const createComprehensiveAdmission = async (req, res, admissionData) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Determine school_id and branch_id based on user role
    let school_id, branch_id;
    if (req.user.role === 'super_admin') {
      school_id = admissionData.school_id;
      branch_id = admissionData.branch_id;
      if (!school_id || !branch_id) {
        throw new Error('School ID and Branch ID are required for super admin');
      }
    } else if (req.user.role === 'school_admin') {
      school_id = req.user.school_id;
      branch_id = admissionData.branch_id || req.user.branch_id;
    } else {
      school_id = req.user.school_id;
      branch_id = req.user.branch_id;
    }

    // Handle file uploads
    const uploadedFiles = {};
    if (req.files) {
      Object.keys(req.files).forEach(key => {
        if (req.files[key] && req.files[key][0]) {
          uploadedFiles[key] = req.files[key][0].filename;
        }
      });
    }

    // Date validation removed - pass dates directly

    // Get class and section names from IDs
    let className = '', sectionName = '';
    let classRecord = null, sectionRecord = null;
    try {
      if (admissionData.class_id) {
        classRecord = await Class.findByPk(admissionData.class_id);
        className = classRecord ? classRecord.name : `Class-${admissionData.class_id}`;
      }
      if (admissionData.section_id) {
        sectionRecord = await Section.findByPk(admissionData.section_id);
        sectionName = sectionRecord ? sectionRecord.name : `Section-${admissionData.section_id}`;
      }
    } catch (error) {
      console.error('Error fetching class/section names:', error);
      className = `Class-${admissionData.class_id || 'Unknown'}`;
      sectionName = `Section-${admissionData.section_id || 'Unknown'}`;
    }

    // Get academic year name
    let academicYearName = '';
    try {
      if (admissionData.academic_year_id) {
        const yearRecord = await AcademicYear.findByPk(admissionData.academic_year_id);
        academicYearName = yearRecord ? yearRecord.name : `Year-${admissionData.academic_year_id}`;
      }
    } catch (error) {
      console.error('Error fetching academic year name:', error);
      academicYearName = `Year-${admissionData.academic_year_id || 'Unknown'}`;
    }

    // Create student record - with simple date handling
    const studentData = {
      admission_number: admissionData.register_no,
      first_name: admissionData.student.first_name,
      last_name: admissionData.student.last_name,
      email: admissionData.student.email,
      phone: admissionData.student.mobile_no,
      date_of_birth: admissionData.student.date_of_birth || '2021-01-01',
      gender: admissionData.student.gender,
      blood_group: admissionData.student.blood_group,
      mother_tongue: admissionData.student.mother_tongue,
      religion: admissionData.student.religion,
      caste: admissionData.student.caste,
      city: admissionData.student.city,
      state: admissionData.student.state,
      present_address: admissionData.student.present_address,
      permanent_address: admissionData.student.permanent_address,
      profile_picture: uploadedFiles.student_profile_picture || null,
      category: admissionData.category,
      admission_date: admissionData.admission_date || '2024-01-01',
      // Use foreign keys for class and section
      admission_class: classRecord ? classRecord.code : className,
      current_class: classRecord ? classRecord.code : className,
      section: sectionName,
      class_id: admissionData.class_id || null,
      section_id: admissionData.section_id || null,
      academic_year: academicYearName,
      school_id,
      branch_id,
      status: 'active',
      created_by: req.user.id,
      updated_by: req.user.id,
    };

    // Debug logging for dates
    console.log('Debug - Original dates:', {
      date_of_birth: admissionData.student.date_of_birth,
      admission_date: admissionData.admission_date
    });
    console.log('Debug - Validated dates:', {
      date_of_birth: studentData.date_of_birth,
      admission_date: studentData.admission_date
    });
    
    // No more strict validation - dates will have fallback values
    
    // Debug the actual student data being sent to database
    console.log('Debug - Student data being sent to database:', JSON.stringify(studentData, null, 2));

    const student = await Student.create(studentData, { transaction });

    // Create guardian/parent record
    const guardianData = {
      // Set guardian information based on relation
      guardian_name: admissionData.guardian.name,
      guardian_phone: admissionData.guardian.mobile_no,
      guardian_email: admissionData.guardian.email,
      guardian_relation: admissionData.guardian.relation,
      address: admissionData.guardian.address,
      city: admissionData.guardian.city,
      state: admissionData.guardian.state,
      country: 'India',
      emergency_contact: admissionData.guardian.mobile_no,
      emergency_relation: admissionData.guardian.relation,
      school_id,
      branch_id,
      created_by: req.user.id,
      updated_by: req.user.id,
    };

    // Set father or mother information based on relation
    if (admissionData.guardian.relation === 'father') {
      guardianData.father_name = admissionData.guardian.name;
      guardianData.father_phone = admissionData.guardian.mobile_no;
      guardianData.father_email = admissionData.guardian.email;
      guardianData.father_occupation = admissionData.guardian.occupation;
      guardianData.father_qualification = admissionData.guardian.education;
      guardianData.father_income = admissionData.guardian.income;
    } else if (admissionData.guardian.relation === 'mother') {
      guardianData.mother_name = admissionData.guardian.name;
      guardianData.mother_phone = admissionData.guardian.mobile_no;
      guardianData.mother_email = admissionData.guardian.email;
      guardianData.mother_occupation = admissionData.guardian.occupation;
      guardianData.mother_qualification = admissionData.guardian.education;
      guardianData.mother_income = admissionData.guardian.income;
    }

    const guardian = await Parent.create(guardianData, { transaction });

    // Link student and guardian
    await StudentParent.create({
      student_id: student.id,
      parent_id: guardian.id,
      relationship: admissionData.guardian.relation,
      is_primary: true,
      is_emergency_contact: true,
    }, { transaction });

    // Create student login credentials if provided - temporarily disabled
    /*
    if (admissionData.login && admissionData.login.username && admissionData.login.password) {
      const studentUser = await User.create({
        first_name: student.first_name,
        last_name: student.last_name,
        email: admissionData.login.username,
        password: admissionData.login.password, // Will be hashed by model hook
        role: 'student',
        school_id,
        branch_id,
        isActive: true,
        two_factor_enabled: false, // Add missing required field
        created_by: req.user.id,
        updated_by: req.user.id,
      }, { transaction });

      // Update student with user_id
      await student.update({ user_id: studentUser.id }, { transaction });
    }

    // Create guardian login credentials if provided
    if (admissionData.guardian.login && admissionData.guardian.login.username && admissionData.guardian.login.password) {
      const guardianUser = await User.create({
        first_name: admissionData.guardian.name.split(' ')[0] || admissionData.guardian.name,
        last_name: admissionData.guardian.name.split(' ').slice(1).join(' ') || '',
        email: admissionData.guardian.login.username,
        password: admissionData.guardian.login.password, // Will be hashed by model hook
        role: 'parent',
        school_id,
        branch_id,
        isActive: true,
        two_factor_enabled: false, // Add missing required field
        created_by: req.user.id,
        updated_by: req.user.id,
      }, { transaction });

      // Update guardian with user_id
      await guardian.update({ user_id: guardianUser.id }, { transaction });
    }
    */

    // Create admission record - with simple date handling
    const admissionRecord = {
      application_number: `APP${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      student_id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      date_of_birth: '2021-01-01', // Simple default date
      gender: student.gender,
      email: student.email,
      phone: student.phone,
      address: student.present_address,
      city: student.city,
      state: student.state,
      applied_class: classRecord ? classRecord.name : className,
      academic_year: academicYearName,
      admission_type: admissionData.admission_type || 'new',
      status: 'admitted', // Auto-admit since student is created immediately
      application_date: '2024-01-01', // Simple default date
      documents: uploadedFiles,
      notes: 'Comprehensive admission with student and guardian creation',
      school_id,
      branch_id,
      created_by: req.user.id,
      updated_by: req.user.id,
    };

    const admission = await Admission.create(admissionRecord, { transaction });

    await transaction.commit();

    // Return the created data
    res.status(201).json({
      success: true,
      data: {
        admission,
        student,
        guardian
      },
      message: 'Admission created successfully with student and guardian'
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Error creating comprehensive admission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create admission',
      error: error.message
    });
  }
};

/**
 * Get admission by ID
 */
const getAdmissionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    let whereCondition = { id };
    
    // Apply role-based filtering
    if (req.user.role === 'school_admin') {
      whereCondition.school_id = req.user.school_id;
    } else if (req.user.role !== 'super_admin') {
      whereCondition.branch_id = req.user.branch_id;
    }
    
    const admission = await Admission.findOne({
      where: whereCondition,
      include: [
        {
          model: Student,
          as: 'student',
          include: [
            {
              model: Parent,
              as: 'parents',
              attributes: ['id', 'father_name', 'mother_name', 'guardian_name', 'father_phone', 'mother_phone', 'guardian_phone', 'father_email', 'mother_email', 'guardian_email', 'guardian_relation']
            }
          ]
        },
        {
          model: AcademicYear,
          as: 'academicYear',
          attributes: ['id', 'name', 'start_date', 'end_date']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'grade']
        },
        {
          model: Section,
          as: 'sectionInfo',
          attributes: ['id', 'name']
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name', 'code']
        }
      ]
    });
    
    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Admission not found'
      });
    }
    
    res.json({
      success: true,
      data: admission
    });
  } catch (error) {
    logger.error('Error fetching admission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admission',
      error: error.message
    });
  }
};

/**
 * Update admission status
 */
const updateAdmissionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks, rejection_reason } = req.body;
    
    let whereCondition = { id };
    
    // Apply role-based filtering
    if (req.user.role === 'school_admin') {
      whereCondition.school_id = req.user.school_id;
    } else if (req.user.role !== 'super_admin') {
      whereCondition.branch_id = req.user.branch_id;
    }
    
    const admission = await Admission.findOne({ where: whereCondition });
    
    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Admission not found'
      });
    }
    
    // Update admission
    const updateData = {
      status,
      remarks,
      rejection_reason,
      processed_by: req.user.id,
      updated_by: req.user.id
    };
    
    if (status === 'approved') {
      updateData.admission_date = new Date();
    }
    
    await admission.update(updateData);
    
    // Generate fee invoice if admission is approved
    if (status === 'approved') {
      await generateAdmissionFeeInvoice(admission.id);
    }
    
    const updatedAdmission = await Admission.findByPk(admission.id, {
      include: [
        {
          model: Student,
          as: 'student',
          include: [
            {
              model: Parent,
              as: 'parents',
              attributes: ['id', 'father_name', 'mother_name', 'guardian_name', 'father_phone', 'mother_phone', 'guardian_phone', 'father_email', 'mother_email', 'guardian_email', 'guardian_relation']
            }
          ]
        },
        {
          model: AcademicYear,
          as: 'academicYear',
          attributes: ['id', 'name', 'start_date', 'end_date']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'grade']
        },
        {
          model: Section,
          as: 'section',
          attributes: ['id', 'name']
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name', 'code']
        }
      ]
    });
    
    res.json({
      success: true,
      data: updatedAdmission,
      message: 'Admission status updated successfully'
    });
  } catch (error) {
    logger.error('Error updating admission status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update admission status',
      error: error.message
    });
  }
};

/**
 * Delete admission
 */
const deleteAdmission = async (req, res) => {
  try {
    const { id } = req.params;
    
    let whereCondition = { id };
    
    // Apply role-based filtering
    if (req.user.role === 'school_admin') {
      whereCondition.school_id = req.user.school_id;
    } else if (req.user.role !== 'super_admin') {
      whereCondition.branch_id = req.user.branch_id;
    }
    
    const admission = await Admission.findOne({ where: whereCondition });
    
    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Admission not found'
      });
    }
    
    await admission.destroy();
    
    res.json({
      success: true,
      message: 'Admission deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting admission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete admission',
      error: error.message
    });
  }
};

/**
 * Get admission statistics
 */
const getAdmissionStats = async (req, res) => {
  try {
    let whereCondition = {};
    
    // Apply role-based filtering
    if (req.user.role === 'school_admin') {
      whereCondition.school_id = req.user.school_id;
    } else if (req.user.role !== 'super_admin') {
      whereCondition.branch_id = req.user.branch_id;
    }
    
    // Count by status
    const [totalApplications, pendingReview, approved, admitted, rejected] = await Promise.all([
      Admission.count({ where: whereCondition }),
      Admission.count({ where: { ...whereCondition, status: 'pending' } }),
      Admission.count({ where: { ...whereCondition, status: 'approved' } }),
      Admission.count({ where: { ...whereCondition, status: 'admitted' } }),
      Admission.count({ where: { ...whereCondition, status: 'rejected' } })
    ]);
    
    // Count by admission type
    const typeStats = await Admission.findAll({
      where: whereCondition,
      attributes: [
        'admission_type',
        [Admission.sequelize.fn('COUNT', Admission.sequelize.col('id')), 'count']
      ],
      group: ['admission_type'],
      raw: true
    });
    
    // Recent admissions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentAdmissions = await Admission.count({
      where: {
        ...whereCondition,
        created_at: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });
    
    const stats = {
      totalApplications,
      pendingReview,
      approved,
      admitted,
      rejected,
      typeStats,
      recentAdmissions
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching admission stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admission statistics',
      error: error.message
    });
  }
};

/**
 * Get admission report with filters and pagination
 */
const getAdmissionReport = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status,
      admission_type,
      academic_year_id,
      class_id,
      branch_id,
      from_date,
      to_date
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Build where condition based on user role
    let whereCondition = {};
    
    // Apply role-based filtering
    if (req.user.role === 'school_admin') {
      whereCondition.school_id = req.user.school_id;
    } else if (req.user.role !== 'super_admin') {
      whereCondition.branch_id = req.user.branch_id;
    }
    
    // Apply filters
    if (search) {
      whereCondition[Op.or] = [
        { application_number: { [Op.like]: `%${search}%` } },
        { '$student.first_name$': { [Op.like]: `%${search}%` } },
        { '$student.last_name$': { [Op.like]: `%${search}%` } },
        { '$student.email$': { [Op.like]: `%${search}%` } },
        { '$student.phone$': { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (status) {
      whereCondition.status = status;
    }
    
    if (admission_type) {
      whereCondition.admission_type = admission_type;
    }
    
    if (academic_year_id) {
      whereCondition.academic_year_id = academic_year_id;
    }
    
    if (class_id) {
      whereCondition.class_id = class_id;
    }
    
    if (branch_id && req.user.role === 'super_admin') {
      whereCondition.branch_id = branch_id;
    }
    
    // Date range filter
    if (from_date || to_date) {
      whereCondition.created_at = {};
      if (from_date) {
        whereCondition.created_at[Op.gte] = new Date(from_date);
      }
      if (to_date) {
        whereCondition.created_at[Op.lte] = new Date(to_date);
      }
    }
    
    const { count, rows } = await Admission.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender']
        },
        {
          model: AcademicYear,
          as: 'academicYear',
          attributes: ['id', 'year', 'start_date', 'end_date']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'level']
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name', 'address']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      data: {
        admissions: rows,
        totalCount: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching admission report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admission report',
      error: error.message
    });
  }
};

/**
 * Export admissions to Excel format
 */
const exportAdmissionsToExcel = async (req, res) => {
  try {
    const {
      search = '',
      status,
      admission_type,
      academic_year_id,
      class_id,
      branch_id,
      from_date,
      to_date
    } = req.query;
    
    // Build where condition based on user role
    let whereCondition = {};
    
    // Apply role-based filtering
    if (req.user.role === 'school_admin') {
      whereCondition.school_id = req.user.school_id;
    } else if (req.user.role !== 'super_admin') {
      whereCondition.branch_id = req.user.branch_id;
    }
    
    // Apply filters
    if (search) {
      whereCondition[Op.or] = [
        { application_number: { [Op.like]: `%${search}%` } },
        { '$student.first_name$': { [Op.like]: `%${search}%` } },
        { '$student.last_name$': { [Op.like]: `%${search}%` } },
        { '$student.email$': { [Op.like]: `%${search}%` } },
        { '$student.phone$': { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (status) {
      whereCondition.status = status;
    }
    
    if (admission_type) {
      whereCondition.admission_type = admission_type;
    }
    
    if (academic_year_id) {
      whereCondition.academic_year_id = academic_year_id;
    }
    
    if (class_id) {
      whereCondition.class_id = class_id;
    }
    
    if (branch_id && req.user.role === 'super_admin') {
      whereCondition.branch_id = branch_id;
    }
    
    // Date range filter
    if (from_date || to_date) {
      whereCondition.created_at = {};
      if (from_date) {
        whereCondition.created_at[Op.gte] = new Date(from_date);
      }
      if (to_date) {
        whereCondition.created_at[Op.lte] = new Date(to_date);
      }
    }
    
    const admissions = await Admission.findAll({
      where: whereCondition,
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender']
        },
        {
          model: AcademicYear,
          as: 'academicYear',
          attributes: ['id', 'year', 'start_date', 'end_date']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'level']
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name', 'address']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    // Prepare data for Excel export
    const excelData = admissions.map(admission => ({
      'Application Number': admission.application_number || '',
      'Student Name': admission.student ? `${admission.student.first_name} ${admission.student.last_name}` : '',
      'Email': admission.student?.email || '',
      'Phone': admission.student?.phone || '',
      'Date of Birth': admission.student?.date_of_birth ? new Date(admission.student.date_of_birth).toLocaleDateString() : '',
      'Gender': admission.student?.gender || '',
      'Academic Year': admission.academicYear?.year || '',
      'Class': admission.class?.name || '',
      'Branch': admission.branch?.name || '',
      'Admission Type': admission.admission_type || '',
      'Status': admission.status || '',
      'Priority': admission.priority || '',
      'Application Date': new Date(admission.created_at).toLocaleDateString(),
      'Admission Date': admission.admission_date ? new Date(admission.admission_date).toLocaleDateString() : '',
      'Created By': admission.createdBy ? `${admission.createdBy.first_name} ${admission.createdBy.last_name}` : ''
    }));
    
    // Create workbook and worksheet
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(excelData);
    
    // Set column widths
    const colWidths = [
      { wch: 20 }, // Application Number
      { wch: 25 }, // Student Name
      { wch: 25 }, // Email
      { wch: 15 }, // Phone
      { wch: 15 }, // Date of Birth
      { wch: 10 }, // Gender
      { wch: 15 }, // Academic Year
      { wch: 15 }, // Class
      { wch: 20 }, // Branch
      { wch: 15 }, // Admission Type
      { wch: 12 }, // Status
      { wch: 10 }, // Priority
      { wch: 15 }, // Application Date
      { wch: 15 }, // Admission Date
      { wch: 20 }  // Created By
    ];
    worksheet['!cols'] = colWidths;
    
    // Add worksheet to workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Admissions Report');
    
    // Generate Excel file buffer
    const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Set response headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="admissions_report_${new Date().toISOString().split('T')[0]}.xlsx"`);
    
    res.send(excelBuffer);
  } catch (error) {
    logger.error('Error exporting admissions to Excel:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export admissions to Excel',
      error: error.message
    });
  }
};

/**
 * Export admissions to CSV format
 */
const exportAdmissionsToCSV = async (req, res) => {
  try {
    const {
      search = '',
      status,
      admission_type,
      academic_year_id,
      class_id,
      branch_id,
      from_date,
      to_date
    } = req.query;
    
    // Build where condition based on user role
    let whereCondition = {};
    
    // Apply role-based filtering
    if (req.user.role === 'school_admin') {
      whereCondition.school_id = req.user.school_id;
    } else if (req.user.role !== 'super_admin') {
      whereCondition.branch_id = req.user.branch_id;
    }
    
    // Apply filters
    if (search) {
      whereCondition[Op.or] = [
        { application_number: { [Op.like]: `%${search}%` } },
        { '$student.first_name$': { [Op.like]: `%${search}%` } },
        { '$student.last_name$': { [Op.like]: `%${search}%` } },
        { '$student.email$': { [Op.like]: `%${search}%` } },
        { '$student.phone$': { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (status) {
      whereCondition.status = status;
    }
    
    if (admission_type) {
      whereCondition.admission_type = admission_type;
    }
    
    if (academic_year_id) {
      whereCondition.academic_year_id = academic_year_id;
    }
    
    if (class_id) {
      whereCondition.class_id = class_id;
    }
    
    if (branch_id && req.user.role === 'super_admin') {
      whereCondition.branch_id = branch_id;
    }
    
    // Date range filter
    if (from_date || to_date) {
      whereCondition.created_at = {};
      if (from_date) {
        whereCondition.created_at[Op.gte] = new Date(from_date);
      }
      if (to_date) {
        whereCondition.created_at[Op.lte] = new Date(to_date);
      }
    }
    
    const admissions = await Admission.findAll({
      where: whereCondition,
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender']
        },
        {
          model: AcademicYear,
          as: 'academicYear',
          attributes: ['id', 'year', 'start_date', 'end_date']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'level']
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name', 'address']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    // Create CSV content
    const csvHeader = [
      'Application Number',
      'Student Name',
      'Email',
      'Phone',
      'Date of Birth',
      'Gender',
      'Academic Year',
      'Class',
      'Branch',
      'Admission Type',
      'Status',
      'Priority',
      'Application Date',
      'Admission Date',
      'Created By'
    ];
    
    const csvData = admissions.map(admission => [
      admission.application_number || '',
      admission.student ? `${admission.student.first_name} ${admission.student.last_name}` : '',
      admission.student?.email || '',
      admission.student?.phone || '',
      admission.student?.date_of_birth ? new Date(admission.student.date_of_birth).toLocaleDateString() : '',
      admission.student?.gender || '',
      admission.academicYear?.year || '',
      admission.class?.name || '',
      admission.branch?.name || '',
      admission.admission_type || '',
      admission.status || '',
      admission.priority || '',
      new Date(admission.created_at).toLocaleDateString(),
      admission.admission_date ? new Date(admission.admission_date).toLocaleDateString() : '',
      admission.createdBy ? `${admission.createdBy.first_name} ${admission.createdBy.last_name}` : ''
    ]);
    
    // Convert to CSV string
    const csvString = [csvHeader, ...csvData]
      .map(row => row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="admissions_report_${new Date().toISOString().split('T')[0]}.csv"`);
    
    res.send(csvString);
  } catch (error) {
    logger.error('Error exporting admissions to CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export admissions to CSV',
      error: error.message
    });
  }
};

/**
 * Helper function to generate fee invoice for approved admission
 */
const generateAdmissionFeeInvoice = async (admissionId) => {
  try {
    const admission = await Admission.findByPk(admissionId, {
      include: [
        { model: Student, as: 'student' },
        { model: AcademicYear, as: 'academicYear' },
        { model: Class, as: 'class' },
        { model: Branch, as: 'branch' }
      ]
    });
    
    if (!admission) return;
    
    // Get fee structure for the class and academic year
    const feeStructures = await FeeStructure.findAll({
      where: {
        class_id: admission.class_id,
        academic_year_id: admission.academic_year_id,
        branch_id: admission.branch_id,
        status: 'active'
      },
      include: [
        {
          model: FeeType,
          as: 'feeType',
          attributes: ['id', 'name', 'amount', 'frequency']
        }
      ]
    });
    
    // Create fee invoice for each fee structure
    for (const structure of feeStructures) {
      const invoiceData = {
        invoice_number: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        student_id: admission.student_id,
        academic_year_id: admission.academic_year_id,
        class_id: admission.class_id,
        branch_id: admission.branch_id,
        school_id: admission.school_id,
        fee_structure_id: structure.id,
        amount: structure.amount,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'pending',
        created_by: admission.created_by
      };
      
      await FeeInvoice.create(invoiceData);
    }
  } catch (error) {
    logger.error('Error generating admission fee invoice:', error);
  }
};

module.exports = {
  getAllAdmissions,
  createAdmission,
  getAdmissionById,
  updateAdmissionStatus,
  deleteAdmission,
  getAdmissionStats,
  getAdmissionReport,
  exportAdmissionsToExcel,
  exportAdmissionsToCSV
};
