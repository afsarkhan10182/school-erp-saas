const httpStatus = require('http-status');
const { Op } = require('sequelize');
const { ExamResult, Exam, Student, GradingSystem, GradeScale } = require('~/models');
const { success, error } = require('~/utils/shared/apiResponse');
const { asyncHandler } = require('~/utils/shared/apiResponse');
const ApiError = require('~/utils/shared/ApiError');
const { logger } = require('~/utils/shared/logger');
const getExamPassStatus = require('~/utils/academic/examPassStatus');

class ExamResultController {
  /**
   * Get results by exam ID
   */
  static getByExamId = asyncHandler(async (req, res) => {
    const { examId } = req.params;
    const {
      page = 1,
      limit = 50,
      search,
      grade,
      sort_by = 'marks_obtained',
      sort_order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;

    const gradingSystem = await GradingSystem.findOne({
      where: { school_id: req.user.school_id, is_active: true },
      include: [
        {
          model: GradeScale,
          as: 'gradeScales',
          attributes: ['min_percentage', 'max_percentage', 'is_passing']
        }
      ]
    });

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

    // Add grade filter
    if (grade) {
      whereClause.grade = grade;
    }

    const { count, rows } = await ExamResult.findAndCountAll({
      where: whereClause,
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

    const results = rows.map(row => {
      const data = row.toJSON();
      return { ...data, is_passed: getExamPassStatus(data.percentage, data.is_absent, gradingSystem) };
    });

    const result = {
      results,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    };

    success(res, result, 'Exam results retrieved successfully');
  });

  /**
   * Create bulk results
   */
  static createBulk = asyncHandler(async (req, res) => {
    const { examId } = req.params;
    const { results } = req.body;

    if (!results || !Array.isArray(results) || results.length === 0) {
      throw new ApiError(400, 'Results array is required');
    }

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

    // Validate and prepare results data
    const resultsData = results.map(result => ({
      exam_id: examId,
      student_id: result.student_id,
      marks_obtained: result.marks_obtained,
      total_marks: result.total_marks || exam.max_marks,
      percentage: result.percentage,
      grade: result.grade,
      is_passed: result.is_passed,
      remarks: result.remarks,
      school_id: req.user.school_id,
      branch_id: req.user.branch_id,
      created_by: req.user.id,
      updated_by: req.user.id
    }));

    // Bulk create results
    const createdResults = await ExamResult.bulkCreate(resultsData, {
      updateOnDuplicate: [
        'marks_obtained',
        'total_marks',
        'percentage',
        'grade',
        'is_passed',
        'remarks',
        'updated_by'
      ]
    });

    success(
      res,
      {
        results: createdResults,
        total_created: createdResults.length
      },
      'Bulk results created successfully',
      httpStatus.CREATED
    );
  });

  /**
   * Calculate grades for an exam
   */
  static calculateGrades = asyncHandler(async (req, res) => {
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

    // Get active grading system for the school
    const gradingSystem = await GradingSystem.findOne({
      where: {
        school_id: req.user.school_id,
        is_active: true
      },
      include: [
        {
          model: GradeScale,
          as: 'gradeScales',
          order: [['min_percentage', 'DESC']]
        }
      ]
    });

    if (!gradingSystem) {
      throw new ApiError(404, 'No active grading system found for this school');
    }

    // Get all results for this exam
    const results = await ExamResult.findAll({
      where: {
        exam_id: examId,
        school_id: req.user.school_id
      }
    });

    if (results.length === 0) {
      throw new ApiError(400, 'No exam results found for this exam');
    }

    // Calculate grades for each result
    const updatedResults = [];
    for (const result of results) {
      const percentage = result.percentage;
      let grade = null;
      let isPassed = false;

      // Find appropriate grade based on percentage
      for (const gradeScale of gradingSystem.gradeScales) {
        if (percentage >= gradeScale.min_percentage && percentage <= gradeScale.max_percentage) {
          grade = gradeScale.grade;
          isPassed = gradeScale.is_passing;
          break;
        }
      }

      // Update result with calculated grade
      await result.update({
        grade,
        is_passed: isPassed,
        updated_by: req.user.id
      });

      updatedResults.push(result);
    }

    success(
      res,
      {
        message: 'Grades calculated successfully',
        total_updated: updatedResults.length
      },
      'Exam grades calculated successfully'
    );
  });

  /**
   * Export results
   */
  static exportResults = asyncHandler(async (req, res) => {
    const { examId } = req.params;
    const { format = 'csv' } = req.query;
    const gradingSystem = await GradingSystem.findOne({
      where: { school_id: req.user.school_id, is_active: true },
      include: [
        {
          model: GradeScale,
          as: 'gradeScales',
          attributes: ['min_percentage', 'max_percentage', 'is_passing']
        }
      ]
    });

    // Get all results for the exam
    const results = await ExamResult.findAll({
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
      order: [['marks_obtained', 'DESC']]
    });

    if (results.length === 0) {
      throw new ApiError(404, 'No results found for this exam');
    }

    // Generate export data
    const exportData = results.map((result, index) => {
      const isPassed = getExamPassStatus(result.percentage, result.is_absent, gradingSystem);
      return {
        'S.No': index + 1,
        'Student Name': `${result.student.first_name} ${result.student.last_name}`,
        'Admission Number': result.student.admission_number,
        'Roll Number': result.student.roll_number,
        'Marks Obtained': result.marks_obtained,
        'Total Marks': result.exam.max_marks,
        Percentage: result.percentage,
        Grade: result.grade,
        Status: result.is_absent ? 'Absent' : isPassed == null ? 'Not graded' : isPassed ? 'Passed' : 'Failed',
        Remarks: result.remarks
      };
    });

    if (format === 'csv') {
      const csvValue = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
      const csvHeader = Object.keys(exportData[0]).map(csvValue).join(',');
      const csvRows = exportData.map(row => Object.values(row).map(csvValue).join(','));
      const csvContent = [csvHeader, ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="exam-results-${examId}.csv"`);
      res.send(csvContent);
    } else {
      // Return JSON
      success(res, { results: exportData }, 'Results exported successfully');
    }
  });

  /**
   * Get single result
   */
  static getById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await ExamResult.findOne({
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

    if (!result) {
      throw new ApiError(404, 'Exam result not found');
    }

    success(res, { result }, 'Exam result retrieved successfully');
  });

  /**
   * Update result
   */
  static update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const result = await ExamResult.findOne({
      where: {
        id,
        school_id: req.user.school_id,
        ...(req.user.role === 'branch_admin' && { branch_id: req.user.branch_id })
      }
    });

    if (!result) {
      throw new ApiError(404, 'Exam result not found');
    }

    // Update result
    await result.update({
      ...updateData,
      updated_by: req.user.id
    });

    success(res, { result }, 'Exam result updated successfully');
  });

  /**
   * Delete result
   */
  static delete = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await ExamResult.findOne({
      where: {
        id,
        school_id: req.user.school_id,
        ...(req.user.role === 'branch_admin' && { branch_id: req.user.branch_id })
      }
    });

    if (!result) {
      throw new ApiError(404, 'Exam result not found');
    }

    await result.destroy();

    success(
      res,
      { message: 'Exam result deleted successfully' },
      'Exam result deleted successfully'
    );
  });
}

module.exports = ExamResultController;
