const { Exam, ExamResult, Student, Class, Section, ExamPosition } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { Op } = require('sequelize');

/**
 * Get students for position management
 */
const getStudentsForPositions = async (req, res) => {
  try {
    const { exam_id, class_id, school_id, branch_id } = req.query;

    // Validate required parameters
    if (!exam_id || !class_id) {
      return res.status(400).json({
        success: false,
        message: 'Exam ID and Class ID are required'
      });
    }

    // Get students based on class
    const { section_id } = req.query;
    const whereClause = {
      class_id: class_id,
      school_id: school_id || req.user.school_id,
      branch_id: branch_id || req.user.branch_id,
      status: 'active'
    };

    if (section_id) {
      whereClause.section_id = section_id;
    }

    const students = await Student.findAll({
      where: whereClause,
      include: [
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name']
        },
        {
          model: Section,
          as: 'sectionInfo',
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order: [['roll_number', 'ASC']]
    });

    // Get exam results for these students
    const examResults = await ExamResult.findAll({
      where: {
        exam_id: exam_id,
        student_id: {
          [Op.in]: students.map(s => s.id)
        },
        school_id: school_id || req.user.school_id,
        branch_id: branch_id || req.user.branch_id
      }
    });

    // Get existing positions
    const existingPositions = await ExamPosition.findAll({
      where: {
        exam_id: exam_id,
        student_id: {
          [Op.in]: students.map(s => s.id)
        },
        school_id: school_id || req.user.school_id,
        branch_id: branch_id || req.user.branch_id
      }
    });

    // Create maps for results and positions
    const resultsMap = {};
    const positionsMap = {};

    examResults.forEach(result => {
      resultsMap[result.student_id] = result;
    });

    existingPositions.forEach(position => {
      positionsMap[position.student_id] = position;
    });

    // Prepare student data with results and positions
    const studentsWithPositions = students.map((student, index) => {
      const result = resultsMap[student.id];
      const position = positionsMap[student.id];

      return {
        id: student.id,
        name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown',
        roll_number: student.roll_number,
        class: student.class?.name,
        section: student.sectionInfo?.name,
        total_marks: result?.marks_obtained || 0,
        percentage: result?.percentage || 0,
        grade: result?.grade || null,
        position: position?.position || index + 1,
        teacher_comment: position?.teacher_comment || position?.remarks || null,
        principal_comment: position?.principal_comment || null,
        is_absent: result?.is_absent || false
      };
    });

    res.json({
      success: true,
      data: studentsWithPositions
    });
  } catch (error) {
    logger.error('Error fetching students for positions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students for positions',
      error: error.message
    });
  }
};

/**
 * Calculate positions automatically
 */
const calculatePositions = async (req, res) => {
  try {
    const { exam_id, class_id, calculation_method, tie_breaking_method, include_absent } = req.body;

    // Validate required parameters
    if (!exam_id || !class_id) {
      return res.status(400).json({
        success: false,
        message: 'Exam ID and Class ID are required'
      });
    }

    // Get students with their exam results
    const { section_id } = req.body;
    const whereClause = {
      class_id: class_id,
      school_id: req.user.school_id,
      branch_id: req.user.branch_id,
      status: 'active'
    };

    if (section_id) {
      whereClause.section_id = section_id;
    }

    const students = await Student.findAll({
      where: whereClause,
      include: [
        {
          model: ExamResult,
          as: 'examResults',
          where: { exam_id: exam_id },
          required: true
        }
      ],
      order: [['roll_number', 'ASC']]
    });

    // Filter out absent students if not including them
    let studentsToRank = students;
    if (!include_absent) {
      studentsToRank = students.filter(student => !student.examResults[0]?.is_absent);
    }

    // Sort students based on calculation method
    let sortedStudents = [];
    switch (calculation_method) {
      case 'total_marks':
        sortedStudents = studentsToRank.sort(
          (a, b) =>
            (b.examResults[0]?.marks_obtained || 0) - (a.examResults[0]?.marks_obtained || 0)
        );
        break;
      case 'percentage':
        sortedStudents = studentsToRank.sort(
          (a, b) => (b.examResults[0]?.percentage || 0) - (a.examResults[0]?.percentage || 0)
        );
        break;
      case 'grade_points':
        // Sort by grade points (assuming grade is numeric)
        sortedStudents = studentsToRank.sort((a, b) => {
          const gradeA = parseFloat(a.examResults[0]?.grade) || 0;
          const gradeB = parseFloat(b.examResults[0]?.grade) || 0;
          return gradeB - gradeA;
        });
        break;
      default:
        sortedStudents = studentsToRank.sort(
          (a, b) =>
            (b.examResults[0]?.marks_obtained || 0) - (a.examResults[0]?.marks_obtained || 0)
        );
    }

    // Assign positions with proper tie handling
    const positions = [];
    let currentPosition = 1;

    for (let i = 0; i < sortedStudents.length; i++) {
      const student = sortedStudents[i];
      const result = student.examResults[0];
      
      // Get score based on calculation method
      let score = 0;
      if (calculation_method === 'percentage') {
        score = result?.percentage || 0;
      } else if (calculation_method === 'grade_points') {
        score = parseFloat(result?.grade) || 0;
      } else {
        score = result?.marks_obtained || 0;
      }

      // If this is not the first student and score is different, update position
      if (i > 0) {
        const prevStudent = sortedStudents[i - 1];
        const prevResult = prevStudent.examResults[0];
        let prevScore = 0;
        if (calculation_method === 'percentage') {
          prevScore = prevResult?.percentage || 0;
        } else if (calculation_method === 'grade_points') {
          prevScore = parseFloat(prevResult?.grade) || 0;
        } else {
          prevScore = prevResult?.marks_obtained || 0;
        }

        if (score !== prevScore) {
          currentPosition = i + 1;
        }
      }

      positions.push({
        student_id: student.id,
        position: currentPosition,
        marks: result?.marks_obtained || 0,
        percentage: result?.percentage || 0,
        grade: result?.grade || null
      });
    }

    res.json({
      success: true,
      data: positions
    });
  } catch (error) {
    logger.error('Error calculating positions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate positions',
      error: error.message
    });
  }
};

/**
 * Save positions
 */
const savePositions = async (req, res) => {
  try {
    const { exam_id, class_id, positions } = req.body;

    // Validate required parameters
    if (!exam_id || !class_id || !positions || !Array.isArray(positions)) {
      return res.status(400).json({
        success: false,
        message: 'Exam ID, Class ID, and positions are required'
      });
    }

    const results = [];
    const errors = [];

    // Get exam results for all students to get marks/percentage/grade
    const studentIds = positions.map(p => p.student_id);
    const examResults = await ExamResult.findAll({
      where: {
        exam_id: exam_id,
        student_id: {
          [Op.in]: studentIds
        },
        school_id: req.user.school_id,
        branch_id: req.user.branch_id
      }
    });

    const resultsMap = {};
    examResults.forEach(result => {
      resultsMap[result.student_id] = result;
    });

    // Process each position
    for (const positionData of positions) {
      try {
        const { student_id, position, teacher_comment, principal_comment } = positionData;
        const result = resultsMap[student_id];

        if (!result) {
          errors.push({
            student_id: student_id,
            error: 'Exam result not found for this student'
          });
          continue;
        }

        // Check if position already exists
        const existingPosition = await ExamPosition.findOne({
          where: {
            exam_id: exam_id,
            student_id: student_id
          }
        });

        const positionRecord = {
          exam_id: exam_id,
          student_id: student_id,
          position: position,
          total_marks: result.marks_obtained || 0,
          percentage: result.percentage || 0,
          grade: result.grade || null,
          is_passed: result.percentage >= 35, // Default pass percentage
          teacher_comment: teacher_comment && teacher_comment.trim() !== '' ? teacher_comment.trim() : null,
          principal_comment: principal_comment && principal_comment.trim() !== '' ? principal_comment.trim() : null,
          school_id: req.user.school_id,
          branch_id: req.user.branch_id,
          created_by: req.user.id,
          updated_by: req.user.id
        };

        let savedPosition;
        if (existingPosition) {
          // Update existing position - explicitly set all fields including comments
          // Use set method to ensure all fields are updated, including null values
          await existingPosition.update({
            position: positionRecord.position,
            total_marks: positionRecord.total_marks,
            percentage: positionRecord.percentage,
            grade: positionRecord.grade,
            is_passed: positionRecord.is_passed,
            teacher_comment: positionRecord.teacher_comment,
            principal_comment: positionRecord.principal_comment,
            updated_by: req.user.id
          });
          savedPosition = existingPosition;
        } else {
          // Create new position
          savedPosition = await ExamPosition.create(positionRecord);
        }
        
        // Reload from database to ensure we have the latest data
        await savedPosition.reload();
        
        // Verify comments were saved
        logger.debug('Position saved:', {
          student_id: student_id,
          position: savedPosition.position,
          teacher_comment: savedPosition.teacher_comment,
          principal_comment: savedPosition.principal_comment
        });

        results.push({
          student_id: student_id,
          position_id: savedPosition.id,
          success: true
        });
      } catch (error) {
        logger.error(`Error saving position for student ${positionData.student_id}:`, error);
        errors.push({
          student_id: positionData.student_id,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Positions saved for ${results.length} students`,
      data: {
        successful: results,
        errors: errors
      }
    });
  } catch (error) {
    logger.error('Error saving positions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save positions',
      error: error.message
    });
  }
};

module.exports = {
  getStudentsForPositions,
  calculatePositions,
  savePositions
};
