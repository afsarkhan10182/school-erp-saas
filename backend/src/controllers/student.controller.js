const { Student, Parent, StudentParent, FeeStructure, FeeInvoice, FeeType } = require('../models');
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

module.exports = {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  getStudentsByClass,
  getStudentStats,
};

