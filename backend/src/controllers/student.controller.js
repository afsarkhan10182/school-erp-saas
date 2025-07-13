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
    const students = await Student.findAll({
      where: {
        school_id: req.schoolId,
      },
      include: [
        {
          model: Parent,
          as: 'parents',
          through: { attributes: [] },
        },
        {
          model: FeeInvoice,
          as: 'feeInvoices',
        },
      ],
    });
    return res.status(200).json({ success: true, data: students });
  } catch (error) {
    logger.error('Error fetching students:', error);
    return next(error);
  }
};

// Get student by ID
const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const student = await Student.findOne({
      where: {
        id,
        school_id: req.schoolId,
      },
      include: [
        {
          model: Parent,
          as: 'parents',
          through: { attributes: ['relationship', 'is_primary', 'is_fee_payer'] },
        },
        {
          model: FeeInvoice,
          as: 'feeInvoices',
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
          ],
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

    await student.update({
      ...updates,
      updated_by: req.user.id,
    });

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
    const { academic_year } = req.query;

    const whereClause = {
      school_id: req.schoolId,
    };

    if (academic_year) whereClause.academic_year = academic_year;

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
    let whereClause = {
      school_id: req.schoolId,
    };

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
    let whereClause = {
      school_id: req.schoolId,
    };

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

