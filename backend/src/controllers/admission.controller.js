const { Op } = require('sequelize');
const Admission = require('../models/admission.model');
const Student = require('../models/student.model');
const Parent = require('../models/parent.model');
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
    const { page = 1, limit = 10, status, academic_year_id, class_id, branch_id } = req.query;
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
    if (status) whereCondition.status = status;
    if (academic_year_id) whereCondition.academic_year_id = academic_year_id;
    if (class_id) whereCondition.class_id = class_id;
    if (branch_id && req.user.role === 'school_admin') whereCondition.branch_id = branch_id;
    
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
              attributes: ['id', 'first_name', 'last_name', 'phone', 'email', 'relation']
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
    let admissionData;
    try {
      admissionData = req.body.admissionData ? JSON.parse(req.body.admissionData) : req.body;
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON data in admission data',
      });
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

    // Create student first
    const studentData = {
      ...admissionData.student,
      school_id,
      branch_id,
      admission_date: admissionData.application_date,
      admission_class: '', // Will be set from class lookup
      current_class: '', // Will be set from class lookup
      section: '', // Will be set from section lookup
      academic_year: '', // Will be set from academic year lookup
      status: 'pending', // Student status will be pending until admission is approved
      created_by: req.user.id,
    };

    // Get class, section, and academic year details for student record
    const classRecord = await Class.findByPk(admissionData.class_id);
    const sectionRecord = await Section.findByPk(admissionData.section_id);
    const academicYear = await AcademicYear.findByPk(admissionData.academic_year_id);

    if (classRecord) {
      studentData.admission_class = classRecord.name;
      studentData.current_class = classRecord.name;
    }
    if (sectionRecord) {
      studentData.section = sectionRecord.name;
    }
    if (academicYear) {
      studentData.academic_year = academicYear.code || academicYear.name;
    }

    // Generate admission number
    const timestamp = Date.now();
    const randomNum = Math.random().toString(36).substring(2, 8).toUpperCase();
    studentData.admission_number = `ADM${timestamp}${randomNum}`;

    const student = await Student.create(studentData);

    // Create parent/guardian records
    if (admissionData.guardian) {
      const guardianData = admissionData.guardian;
      
      // Create father record if provided
      if (guardianData.father_name) {
        const fatherData = {
          first_name: guardianData.father_name.split(' ')[0],
          last_name: guardianData.father_name.split(' ').slice(1).join(' ') || '',
          phone: guardianData.father_phone,
          email: guardianData.father_email,
          occupation: guardianData.father_occupation,
          relation: 'father',
          is_primary_contact: guardianData.primary_contact === 'father' || guardianData.primary_contact === 'both',
          school_id,
          branch_id,
          created_by: req.user.id,
        };

        const father = await Parent.create(fatherData);
        
        // Create student-parent relationship
        await student.addParent(father);

        // Create guardian login if requested
        if (guardianData.create_login && guardianData.login_email) {
          const guardianPassword = guardianData.password || generateRandomPassword();
          await User.create({
            first_name: fatherData.first_name,
            last_name: fatherData.last_name,
            email: guardianData.login_email,
            phone: guardianData.father_phone,
            password: guardianPassword,
            role: 'parent',
            school_id,
            branch_id,
            status: 'active',
            email_verified: true,
            created_by: req.user.id,
          });
        }
      }

      // Create mother record if provided
      if (guardianData.mother_name) {
        const motherData = {
          first_name: guardianData.mother_name.split(' ')[0],
          last_name: guardianData.mother_name.split(' ').slice(1).join(' ') || '',
          phone: guardianData.mother_phone,
          email: guardianData.mother_email,
          occupation: guardianData.mother_occupation,
          relation: 'mother',
          is_primary_contact: guardianData.primary_contact === 'mother' || guardianData.primary_contact === 'both',
          school_id,
          branch_id,
          created_by: req.user.id,
        };

        const mother = await Parent.create(motherData);
        
        // Create student-parent relationship
        await student.addParent(mother);
      }
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

    // Create admission record
    const admissionRecord = {
      application_number: `APP${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      student_id: student.id,
      academic_year_id: admissionData.academic_year_id,
      class_id: admissionData.class_id,
      section_id: admissionData.section_id,
      application_date: admissionData.application_date,
      status: 'pending',
      priority: admissionData.priority || 'medium',
      admission_type: admissionData.admission_type || 'new',
      previous_school: admissionData.previous_school,
      previous_class: admissionData.previous_class,
      documents_submitted: uploadedFiles,
      remarks: `Hostel: ${admissionData.hostel?.required ? 'Yes' : 'No'}, Transport: ${admissionData.transport?.required ? 'Yes' : 'No'}`,
      hostel_required: admissionData.hostel?.required || false,
      transport_required: admissionData.transport?.required || false,
      school_id,
      branch_id,
      created_by: req.user.id,
      updated_by: req.user.id,
    };

    // Create new admission
    const admission = await Admission.create(admissionRecord);
    
    // Generate fee invoice if admission is approved
    if (admission.status === 'approved') {
      await generateAdmissionFeeInvoice(admission.id);
    }
    
    const createdAdmission = await Admission.findByPk(admission.id, {
      include: [
        {
          model: Student,
          as: 'student',
          include: [
            {
              model: Parent,
              as: 'parents',
              attributes: ['id', 'first_name', 'last_name', 'phone', 'email', 'relation']
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
    
    res.status(201).json({
      success: true,
      data: createdAdmission,
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
              attributes: ['id', 'first_name', 'last_name', 'phone', 'email', 'relation']
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
              attributes: ['id', 'first_name', 'last_name', 'phone', 'email', 'relation']
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
