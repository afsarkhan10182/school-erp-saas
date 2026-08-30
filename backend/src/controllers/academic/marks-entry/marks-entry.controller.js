const { Exam, ExamResult, ExamSchedule, Student, Class, Section, Subject } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { Op } = require('sequelize');

/**
 * Get students for marks entry based on filters
 */
const getStudentsForMarksEntry = async (req, res) => {
  try {
    const { exam_id, class_id, section_id, subject_id, school_id, branch_id } = req.query;

    // Validate required parameters
    if (!exam_id || !class_id) {
      return res.status(400).json({
        success: false,
        message: 'Exam ID and Class ID are required'
      });
    }

    // Get exam details with schedule
    const exam = await Exam.findByPk(exam_id, {
      include: [
        {
          model: ExamSchedule,
          as: 'schedules',
          required: false
        }
      ]
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check if we have a schedule for this class/section
    let relevantSchedule = null;
    if (exam.schedules && exam.schedules.length > 0) {
      // First, try to find a schedule with matching class_id
      relevantSchedule = exam.schedules.find(
        schedule =>
          schedule.class_id === class_id && (!section_id || schedule.section_id === section_id)
      );

      // If no specific schedule found, use the first available schedule
      if (!relevantSchedule) {
        relevantSchedule = exam.schedules[0];
      }
    }

    // If no schedule exists, create a default one for this exam/class combination
    if (!relevantSchedule) {
      // Create a default schedule for this exam and class
      const { ExamSchedule } = require('~/models');

      relevantSchedule = await ExamSchedule.create({
        exam_id: exam_id,
        class_id: class_id,
        section_id: section_id || null,
        exam_date: new Date().toISOString().split('T')[0], // Today's date
        start_time: '09:00:00',
        end_time: '12:00:00',
        duration_minutes: 180,
        theory_marks: 70,
        practical_marks: 20,
        viva_marks: 10,
        assignment_marks: 0,
        total_marks: 100,
        pass_marks: 35,
        status: 'scheduled',
        school_id: school_id || req.user.school_id,
        branch_id: branch_id || req.user.branch_id,
        created_by: req.user.id
      });
    }

    // Get students based on class and section
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

    // Get existing exam results for these students
    const existingResults = await ExamResult.findAll({
      where: {
        exam_id: exam_id,
        student_id: {
          [Op.in]: students.map(s => s.id)
        }
      }
    });

    // Create a map of existing results
    const resultsMap = {};
    existingResults.forEach(result => {
      resultsMap[result.student_id] = result;
    });

    // Prepare student data with existing marks
    const studentsWithMarks = students.map((student, index) => {
      const existingResult = resultsMap[student.id];
      return {
        id: student.id,
        serial_number: index + 1,
        name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.name,
        roll_number: student.roll_number,
        admission_number: student.admission_number,
        category: student.category || 'general',
        class: student.class?.name,
        section: student.sectionInfo?.name,
        existing_marks: existingResult
          ? {
              theory_marks_obtained: existingResult.theory_marks_obtained,
              practical_marks_obtained: existingResult.practical_marks_obtained,
              viva_marks_obtained: existingResult.viva_marks_obtained,
              assignment_marks_obtained: existingResult.assignment_marks_obtained,
              marks_obtained: existingResult.marks_obtained,
              is_absent: existingResult.is_absent
            }
          : null
      };
    });

    // Get exam schedule details for mark distribution
    const markDistribution = {
      theory_marks: relevantSchedule?.theory_marks || 0,
      practical_marks: relevantSchedule?.practical_marks || 0,
      viva_marks: relevantSchedule?.viva_marks || 0,
      assignment_marks: relevantSchedule?.assignment_marks || 0,
      total_marks: relevantSchedule?.total_marks || exam.max_marks || 100,
      pass_marks: relevantSchedule?.pass_marks || 35
    };

    res.json({
      success: true,
      data: {
        exam: {
          id: exam.id,
          name: exam.name,
          max_marks: exam.max_marks
        },
        mark_distribution: markDistribution,
        students: studentsWithMarks
      }
    });
  } catch (error) {
    logger.error('Error fetching students for marks entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students for marks entry',
      error: error.message
    });
  }
};

/**
 * Save marks for multiple students
 */
const saveMarks = async (req, res) => {
  try {
    const { exam_id, marks_data } = req.body;

    if (!exam_id || !marks_data || !Array.isArray(marks_data)) {
      return res.status(400).json({
        success: false,
        message: 'Exam ID and marks data are required'
      });
    }

    const exam = await Exam.findOne({
      where: {
        id: exam_id,
        school_id: req.user.school_id,
        ...(req.user.branch_id && { branch_id: req.user.branch_id })
      }
    });
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    const results = [];
    const errors = [];

    // Process each student's marks
    for (const studentMarks of marks_data) {
      try {
        const {
          student_id,
          theory_marks_obtained,
          practical_marks_obtained,
          viva_marks_obtained,
          assignment_marks_obtained,
          is_absent = false
        } = studentMarks;

        // Calculate total marks if not absent
        let totalMarks = 0;
        if (!is_absent) {
          totalMarks =
            (theory_marks_obtained || 0) +
            (practical_marks_obtained || 0) +
            (viva_marks_obtained || 0) +
            (assignment_marks_obtained || 0);
        }

        // Check if result already exists
        const existingResult = await ExamResult.findOne({
          where: {
            exam_id: exam_id,
            student_id: student_id
          }
        });

        const resultData = {
          exam_id: exam_id,
          student_id: student_id,
          theory_marks_obtained: is_absent ? null : theory_marks_obtained,
          practical_marks_obtained: is_absent ? null : practical_marks_obtained,
          viva_marks_obtained: is_absent ? null : viva_marks_obtained,
          assignment_marks_obtained: is_absent ? null : assignment_marks_obtained,
          marks_obtained: is_absent ? 0 : totalMarks,
          percentage: is_absent ? 0 : (totalMarks / exam.max_marks) * 100,
          is_absent: is_absent,
          school_id: req.user.school_id,
          branch_id: req.user.branch_id,
          created_by: req.user.id,
          updated_by: req.user.id
        };

        let result;
        if (existingResult) {
          // Update existing result
          await ExamResult.update(resultData, {
            where: {
              exam_id: exam_id,
              student_id: student_id
            }
          });
          result = await ExamResult.findByPk(existingResult.id);
        } else {
          // Create new result
          result = await ExamResult.create(resultData);
        }

        results.push({
          student_id: student_id,
          result_id: result.id,
          success: true
        });
      } catch (error) {
        logger.error(`Error saving marks for student ${studentMarks.student_id}:`, error);
        errors.push({
          student_id: studentMarks.student_id,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Marks saved for ${results.length} students`,
      data: {
        successful: results,
        errors: errors
      }
    });
  } catch (error) {
    logger.error('Error saving marks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save marks',
      error: error.message
    });
  }
};

/**
 * Get marks entry summary
 */
const getMarksEntrySummary = async (req, res) => {
  try {
    const { exam_id, class_id, section_id } = req.query;

    if (!exam_id || !class_id) {
      return res.status(400).json({
        success: false,
        message: 'Exam ID and Class ID are required'
      });
    }

    // Get total students
    const whereClause = {
      class_id: class_id,
      school_id: req.user.school_id,
      branch_id: req.user.branch_id,
      status: 'active'
    };

    if (section_id) {
      whereClause.section_id = section_id;
    }

    const totalStudents = await Student.count({ where: whereClause });

    // Get students with marks entered
    const studentsWithMarks = await ExamResult.count({
      where: {
        exam_id: exam_id,
        school_id: req.user.school_id,
        branch_id: req.user.branch_id
      }
    });

    // Get absent students
    const absentStudents = await ExamResult.count({
      where: {
        exam_id: exam_id,
        is_absent: true,
        school_id: req.user.school_id,
        branch_id: req.user.branch_id
      }
    });

    res.json({
      success: true,
      data: {
        total_students: totalStudents,
        marks_entered: studentsWithMarks,
        absent_students: absentStudents,
        pending: totalStudents - studentsWithMarks
      }
    });
  } catch (error) {
    logger.error('Error fetching marks entry summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch marks entry summary',
      error: error.message
    });
  }
};

module.exports = {
  getStudentsForMarksEntry,
  saveMarks,
  getMarksEntrySummary
};
