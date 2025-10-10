const httpStatus = require('http-status');
const { ExamPosition, Exam, Student, ExamResult } = require('~/models');
const { success, error } = require('~/utils/shared/apiResponse');
const { asyncHandler } = require('~/utils/shared/apiResponse');
const ApiError = require('~/utils/shared/ApiError');
const { logger } = require('~/utils/shared/logger');

class ExamPositionController {
  /**
   * Get positions by exam ID
   */
  static getByExamId = asyncHandler(async (req, res) => {
    const { examId } = req.params;
    const { page = 1, limit = 50, search, sort_by = 'position', sort_order = 'ASC' } = req.query;

    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {
      exam_id: examId,
      school_id: req.user.school_id,
      ...(req.user.role === 'branch_admin' && { branch_id: req.user.branch_id })
    };

    // Add search filter
    if (search) {
      whereClause[Op.or] = [
        { '$student.first_name$': { [Op.iLike]: `%${search}%` } },
        { '$student.last_name$': { [Op.iLike]: `%${search}%` } },
        { '$student.admission_number$': { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await ExamPosition.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'first_name', 'last_name', 'admission_number', 'roll_number']
        },
        {
          model: Exam,
          as: 'exam',
          attributes: ['id', 'name', 'max_marks']
        }
      ],
      order: [[sort_by, sort_order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const result = {
      positions: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    };

    success(res, result, 'Exam positions retrieved successfully');
  });

  /**
   * Calculate positions for an exam
   */
  static calculatePositions = asyncHandler(async (req, res) => {
    const { examId } = req.params;

    // Verify exam exists and user has access
    const exam = await Exam.findOne({
      where: {
        id: examId,
        school_id: req.user.school_id,
        ...(req.user.role === 'branch_admin' && { branch_id: req.user.branch_id })
      }
    });

    if (!exam) {
      throw new ApiError(404, 'Exam not found');
    }

    // Get all exam results for this exam
    const examResults = await ExamResult.findAll({
      where: {
        exam_id: examId,
        school_id: req.user.school_id
      },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: [
            'id',
            'first_name',
            'last_name',
            'admission_number',
            'roll_number',
            'class_id',
            'section_id'
          ]
        }
      ],
      order: [
        ['total_marks', 'DESC'],
        ['percentage', 'DESC']
      ]
    });

    if (examResults.length === 0) {
      throw new ApiError(400, 'No exam results found for this exam');
    }

    // Clear existing positions
    await ExamPosition.destroy({
      where: { exam_id: examId }
    });

    // Calculate positions
    const positions = [];
    let currentPosition = 1;
    let previousMarks = null;
    let previousPercentage = null;

    for (let i = 0; i < examResults.length; i++) {
      const result = examResults[i];

      // If marks are different from previous, update position
      if (
        previousMarks !== null &&
        (result.total_marks !== previousMarks || result.percentage !== previousPercentage)
      ) {
        currentPosition = i + 1;
      }

      const positionData = {
        exam_id: examId,
        student_id: result.student_id,
        position: currentPosition,
        total_marks: result.total_marks,
        percentage: result.percentage,
        grade: result.grade,
        is_passed: result.is_passed,
        school_id: req.user.school_id,
        branch_id: req.user.branch_id,
        created_by: req.user.id,
        updated_by: req.user.id
      };

      positions.push(positionData);

      previousMarks = result.total_marks;
      previousPercentage = result.percentage;
    }

    // Bulk create positions
    await ExamPosition.bulkCreate(positions);

    success(
      res,
      {
        message: 'Positions calculated successfully',
        total_positions: positions.length
      },
      'Exam positions calculated successfully'
    );
  });

  /**
   * Get single position
   */
  static getById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const position = await ExamPosition.findOne({
      where: {
        id,
        school_id: req.user.school_id,
        ...(req.user.role === 'branch_admin' && { branch_id: req.user.branch_id })
      },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'first_name', 'last_name', 'admission_number', 'roll_number']
        },
        {
          model: Exam,
          as: 'exam',
          attributes: ['id', 'name', 'max_marks']
        }
      ]
    });

    if (!position) {
      throw new ApiError(404, 'Exam position not found');
    }

    success(res, { position }, 'Exam position retrieved successfully');
  });

  /**
   * Update position
   */
  static update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const position = await ExamPosition.findOne({
      where: {
        id,
        school_id: req.user.school_id,
        ...(req.user.role === 'branch_admin' && { branch_id: req.user.branch_id })
      }
    });

    if (!position) {
      throw new ApiError(404, 'Exam position not found');
    }

    // Update position
    await position.update({
      ...updateData,
      updated_by: req.user.id
    });

    success(res, { position }, 'Exam position updated successfully');
  });

  /**
   * Delete position
   */
  static delete = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const position = await ExamPosition.findOne({
      where: {
        id,
        school_id: req.user.school_id,
        ...(req.user.role === 'branch_admin' && { branch_id: req.user.branch_id })
      }
    });

    if (!position) {
      throw new ApiError(404, 'Exam position not found');
    }

    await position.destroy();

    success(
      res,
      { message: 'Exam position deleted successfully' },
      'Exam position deleted successfully'
    );
  });

  /**
   * Export positions
   */
  static exportPositions = asyncHandler(async (req, res) => {
    const { examId } = req.params;
    const { format = 'csv' } = req.query;

    // Get all positions for the exam
    const positions = await ExamPosition.findAll({
      where: {
        exam_id: examId,
        school_id: req.user.school_id,
        ...(req.user.role === 'branch_admin' && { branch_id: req.user.branch_id })
      },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['first_name', 'last_name', 'admission_number', 'roll_number']
        },
        {
          model: Exam,
          as: 'exam',
          attributes: ['name', 'max_marks']
        }
      ],
      order: [['position', 'ASC']]
    });

    if (positions.length === 0) {
      throw new ApiError(404, 'No positions found for this exam');
    }

    // Generate export data
    const exportData = positions.map((position, index) => ({
      'S.No': index + 1,
      Position: position.position,
      'Student Name': `${position.student.first_name} ${position.student.last_name}`,
      'Admission Number': position.student.admission_number,
      'Roll Number': position.student.roll_number,
      'Total Marks': position.total_marks,
      Percentage: position.percentage,
      Grade: position.grade,
      Status: position.is_passed ? 'Passed' : 'Failed'
    }));

    if (format === 'csv') {
      // Convert to CSV
      const csvHeader = Object.keys(exportData[0]).join(',');
      const csvRows = exportData.map(row => Object.values(row).join(','));
      const csvContent = [csvHeader, ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="exam-positions-${examId}.csv"`);
      res.send(csvContent);
    } else {
      // Return JSON
      success(res, { positions: exportData }, 'Positions exported successfully');
    }
  });
}

module.exports = ExamPositionController;
