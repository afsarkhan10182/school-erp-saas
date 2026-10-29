const {
  Exam,
  Student,
  Class,
  Section,
  ExamPosition,
  ClassTeacher,
  SubjectTeacher
} = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { Op } = require('sequelize');
const { getResolvedExamResults } = require('~/services/academic/subject-mark-rollup.service');
const ReportCardService = require('~/services/academic/report-card.service');

const gradeFor = (percentage, gradingSystem, reportCards) =>
  percentage == null ? null : reportCards.calculateGrade(Number(percentage), gradingSystem);

const isPassing = (percentage, gradingSystem) => {
  if (percentage == null) return false;
  const scale = gradingSystem.gradeScales.find(
    item => Number(percentage) >= item.min_percentage && Number(percentage) <= item.max_percentage
  );
  return typeof scale?.is_passing === 'boolean'
    ? scale.is_passing
    : Number(percentage) >= Number(gradingSystem.passing_percentage ?? 35);
};

const resolvePositionScope = async (req, examId, classId, sectionId) => {
  const schoolId = req.schoolId || req.user.school_id;
  if (!schoolId) return { error: { status: 400, message: 'School context is required' } };

  const branchId =
    req.branchId ||
    (['admin', 'super_admin'].includes(req.user.role) ? undefined : req.user.branch_id);
  const classWhere = { id: classId, school_id: schoolId };
  if (branchId) classWhere.branch_id = branchId;
  const classItem = await Class.findOne({
    where: classWhere,
    attributes: ['id', 'school_id', 'branch_id']
  });
  if (!classItem) return { error: { status: 404, message: 'Class not found' } };

  if (req.user.role === 'teacher') {
    const assignmentWhere = {
      teacher_id: req.user.id,
      class_id: classItem.id,
      school_id: schoolId,
      branch_id: classItem.branch_id
    };
    const [classAssignment, subjectAssignment] = await Promise.all([
      ClassTeacher.findOne({ where: { ...assignmentWhere, is_active: true }, attributes: ['id'] }),
      SubjectTeacher.findOne({ where: assignmentWhere, attributes: ['id'] })
    ]);
    if (!classAssignment && !subjectAssignment) {
      return { error: { status: 403, message: 'Not assigned to this class' } };
    }
  }

  const exam = await Exam.findOne({
    where: {
      id: examId,
      school_id: schoolId,
      [Op.or]: [{ branch_id: classItem.branch_id }, { branch_id: null }]
    },
    attributes: ['id']
  });
  if (!exam) return { error: { status: 404, message: 'Exam not found for this class' } };

  if (sectionId) {
    const section = await Section.findOne({
      where: {
        id: sectionId,
        class_id: classItem.id,
        school_id: schoolId,
        branch_id: classItem.branch_id
      },
      attributes: ['id', 'school_id', 'branch_id']
    });
    if (!section) return { error: { status: 404, message: 'Section not found for this class' } };
  }

  return {
    scope: {
      school_id: schoolId,
      branch_id: classItem.branch_id,
      class_id: classItem.id,
      ...(sectionId && { section_id: sectionId })
    }
  };
};

/**
 * Get students for position management
 */
const getStudentsForPositions = async (req, res) => {
  try {
    const { exam_id, class_id, section_id } = req.query;

    // Validate required parameters
    if (!exam_id || !class_id) {
      return res.status(400).json({
        success: false,
        message: 'Exam ID and Class ID are required'
      });
    }

    const resolved = await resolvePositionScope(req, exam_id, class_id, section_id);
    if (resolved.error) {
      return res.status(resolved.error.status).json({ success: false, message: resolved.error.message });
    }
    const scope = resolved.scope;
    const students = await Student.findAll({
      where: {
        class_id: scope.class_id,
        school_id: scope.school_id,
        branch_id: scope.branch_id,
        status: 'active',
        ...(scope.section_id && { section_id: scope.section_id })
      },
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
    const exam = await Exam.findOne({ where: { id: exam_id, school_id: scope.school_id } });
    const examResults = await getResolvedExamResults({
      exams: exam ? [exam] : [], students, schoolId: scope.school_id, branchId: scope.branch_id
    });
    const reportCards = new ReportCardService();
    const gradingSystem = await reportCards.getGradingSystem(scope.school_id);

    // Get existing positions
    const existingPositions = await ExamPosition.findAll({
      where: {
        exam_id: exam_id,
        student_id: {
          [Op.in]: students.map(s => s.id)
        },
        school_id: scope.school_id,
        branch_id: scope.branch_id
      }
    });

    // Create maps for results and positions
    const resultsMap = {};
    const positionsMap = {};

    examResults.forEach(result => {
      result.grade = gradeFor(result.percentage, gradingSystem, reportCards);
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

const getPositionStats = async (req, res) => {
  try {
    const { exam_id, class_id } = req.query;
    if (!exam_id || !class_id) {
      return res.status(400).json({ success: false, message: 'Exam ID and Class ID are required' });
    }

    const resolved = await resolvePositionScope(req, exam_id, class_id);
    if (resolved.error) {
      return res.status(resolved.error.status).json({ success: false, message: resolved.error.message });
    }
    const scope = resolved.scope;
    const students = await Student.findAll({
      where: { class_id: scope.class_id, school_id: scope.school_id, branch_id: scope.branch_id, status: 'active' },
      attributes: ['id']
    });
    const positions = await ExamPosition.findAll({
      where: {
        exam_id,
        student_id: { [Op.in]: students.map(student => student.id) },
        school_id: scope.school_id,
        branch_id: scope.branch_id
      },
      attributes: ['is_passed', 'percentage']
    });
    const passed = positions.filter(position => position.is_passed).length;
    const averagePercentage = positions.length
      ? positions.reduce((sum, position) => sum + (Number(position.percentage) || 0), 0) / positions.length
      : 0;

    return res.json({
      success: true,
      data: {
        total: positions.length,
        passed,
        failed: positions.length - passed,
        pass_rate: positions.length ? (passed / positions.length) * 100 : 0,
        average_percentage: averagePercentage
      }
    });
  } catch (error) {
    logger.error('Error loading position statistics:', error);
    return res.status(500).json({ success: false, message: 'Failed to load position statistics' });
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

    const { section_id } = req.body;
    const resolved = await resolvePositionScope(req, exam_id, class_id, section_id);
    if (resolved.error) {
      return res.status(resolved.error.status).json({ success: false, message: resolved.error.message });
    }
    const scope = resolved.scope;
    const students = await Student.findAll({
      where: {
        class_id: scope.class_id,
        school_id: scope.school_id,
        branch_id: scope.branch_id,
        status: 'active',
        ...(scope.section_id && { section_id: scope.section_id })
      },
      order: [['roll_number', 'ASC']]
    });
    const exam = await Exam.findOne({ where: { id: exam_id, school_id: scope.school_id } });
    const resolvedResults = await getResolvedExamResults({
      exams: exam ? [exam] : [], students, schoolId: scope.school_id, branchId: scope.branch_id
    });
    const resultsByStudent = new Map(
      [...resolvedResults.values()].map(result => [result.student_id, result])
    );
    const reportCards = new ReportCardService();
    const gradingSystem = await reportCards.getGradingSystem(scope.school_id);
    resultsByStudent.forEach(result => {
      result.grade = gradeFor(result.percentage, gradingSystem, reportCards);
    });
    const studentsToRank = students.filter(student => {
      const result = resultsByStudent.get(student.id);
      return result && (include_absent || !result.is_absent);
    });

    const scoreFor = student => {
      const result = resultsByStudent.get(student.id);
      if (calculation_method === 'percentage') return Number(result?.percentage) || 0;
      if (calculation_method === 'grade_points') {
        return Number(
          gradingSystem.gradeScales.find(scale => scale.grade === result?.grade)?.grade_points
        ) || 0;
      }
      return Number(result?.marks_obtained) || 0;
    };

    // Sort students based on calculation method
    const sortedStudents = studentsToRank.sort((a, b) => scoreFor(b) - scoreFor(a));

    // Assign positions with proper tie handling
    const positions = [];
    let currentPosition = 1;

    for (let i = 0; i < sortedStudents.length; i++) {
      const student = sortedStudents[i];
      const result = resultsByStudent.get(student.id);
      const score = scoreFor(student);

      // If this is not the first student and score is different, update position
      if (i > 0) {
        if (score !== scoreFor(sortedStudents[i - 1])) {
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

    const resolved = await resolvePositionScope(req, exam_id, class_id, req.body.section_id);
    if (resolved.error) {
      return res.status(resolved.error.status).json({ success: false, message: resolved.error.message });
    }
    const scope = resolved.scope;

    const results = [];
    const errors = [];

    const studentIds = [...new Set(positions.map(position => position.student_id))];
    const scopedStudents = await Student.findAll({
      where: {
        id: { [Op.in]: studentIds },
        class_id: scope.class_id,
        school_id: scope.school_id,
        branch_id: scope.branch_id,
        status: 'active',
        ...(scope.section_id && { section_id: scope.section_id })
      },
      attributes: ['id', 'class_id', 'section_id']
    });
    const scopedStudentIds = scopedStudents.map(student => student.id);
    const scopedStudentRows = scopedStudents.map(student => student);
    const exam = await Exam.findOne({ where: { id: exam_id, school_id: scope.school_id } });
    const resolvedResults = await getResolvedExamResults({
      exams: exam ? [exam] : [],
      students: scopedStudentRows,
      schoolId: scope.school_id,
      branchId: scope.branch_id
    });
    const resultsMap = Object.fromEntries(
      [...resolvedResults.values()].map(result => [result.student_id, result])
    );
    const reportCards = new ReportCardService();
    const gradingSystem = await reportCards.getGradingSystem(scope.school_id);

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
            exam_id,
            student_id,
            school_id: scope.school_id,
            branch_id: scope.branch_id
          }
        });

        const positionRecord = {
          exam_id: exam_id,
          student_id: student_id,
          position: position,
          total_marks: result.marks_obtained || 0,
          percentage: result.percentage || 0,
          grade: gradeFor(result.percentage, gradingSystem, reportCards),
          is_passed: isPassing(result.percentage, gradingSystem),
          teacher_comment: teacher_comment && teacher_comment.trim() !== '' ? teacher_comment.trim() : null,
          principal_comment: principal_comment && principal_comment.trim() !== '' ? principal_comment.trim() : null,
          school_id: scope.school_id,
          branch_id: scope.branch_id,
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
  getPositionStats,
  calculatePositions,
  savePositions
};
