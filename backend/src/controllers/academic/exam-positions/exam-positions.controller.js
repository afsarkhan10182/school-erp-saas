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
    const whereClause = {
      class_id: class_id,
      school_id: school_id || req.user.school_id,
      branch_id: branch_id || req.user.branch_id,
      is_active: true
    };

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
          as: 'section',
          attributes: ['id', 'name']
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
        }
      }
    });

    // Get existing positions
    const existingPositions = await ExamPosition.findAll({
      where: {
        exam_id: exam_id,
        student_id: {
          [Op.in]: students.map(s => s.id)
        }
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
        name: student.name,
        roll_number: student.roll_number,
        class: student.class?.name,
        section: student.section?.name,
        total_marks: result?.marks_obtained || 0,
        percentage: result?.percentage || 0,
        grade: result?.grade || null,
        position: position?.position || index + 1,
        teacher_comment: position?.teacher_comment || '',
        principal_comment: position?.principal_comment || '',
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
    const students = await Student.findAll({
      where: {
        class_id: class_id,
        school_id: req.user.school_id,
        branch_id: req.user.branch_id,
        is_active: true
      },
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

    // Assign positions
    const positions = [];
    let currentPosition = 1;
    let currentScore = null;

    for (let i = 0; i < sortedStudents.length; i++) {
      const student = sortedStudents[i];
      const score = student.examResults[0]?.marks_obtained || 0;

      if (currentScore !== null && score !== currentScore) {
        currentPosition = i + 1;
      }

      positions.push({
        student_id: student.id,
        position: currentPosition,
        marks: score
      });

      currentScore = score;
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

    // Process each position
    for (const positionData of positions) {
      try {
        const { student_id, position, teacher_comment, principal_comment } = positionData;

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
          teacher_comment: teacher_comment || null,
          principal_comment: principal_comment || null,
          school_id: req.user.school_id,
          branch_id: req.user.branch_id,
          created_by: req.user.id,
          updated_by: req.user.id
        };

        let savedPosition;
        if (existingPosition) {
          // Update existing position
          await ExamPosition.update(positionRecord, {
            where: {
              exam_id: exam_id,
              student_id: student_id
            }
          });
          savedPosition = await ExamPosition.findByPk(existingPosition.id);
        } else {
          // Create new position
          savedPosition = await ExamPosition.create(positionRecord);
        }

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
