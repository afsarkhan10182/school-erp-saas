const {
  Exam,
  ExamResult,
  ExamSubjectMark,
  ExamSchedule,
  Student,
  Class,
  Section,
  Subject,
  SubjectTeacher
} = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { Op } = require('sequelize');
const { resolveSchoolBranchScope } = require('~/utils/shared/requestScope');
const XLSX = require('xlsx');
const fs = require('fs');
const { parseSubjectMarkImport } = require('~/utils/academic/parseSubjectMarkImport');

const getMarksContext = async (req, { exam_id, class_id, section_id, subject_id }) => {
  const scope = await resolveSchoolBranchScope(req, {
    branchRequired: true,
    lockAssignedBranch: req.user.role === 'teacher'
  });
  const exam = await Exam.findOne({
    where: { id: exam_id, school_id: scope.school_id, branch_id: scope.branch_id }
  });
  if (!exam) return { error: 'Exam not found', status: 404 };

  const schedule = await ExamSchedule.findOne({
    where: {
      exam_id,
      school_id: scope.school_id,
      branch_id: scope.branch_id,
      class_id,
      section_id: section_id || null,
      subject_id,
      is_active: true,
      status: { [Op.ne]: 'cancelled' }
    }
  });
  if (!schedule) {
    return {
      error: 'This class, section, and subject are not scheduled for this exam',
      status: 400
    };
  }

  if (req.user.role === 'teacher') {
    const assignment = await SubjectTeacher.findOne({
      where: {
        teacher_id: req.user.id,
        school_id: scope.school_id,
        branch_id: scope.branch_id,
        class_id,
        subject_id,
        academic_year: exam.academic_year,
        [Op.or]: [{ section_id: section_id || null }, { section_id: null }]
      }
    });
    if (!assignment) return { error: 'You are not assigned to this class and subject', status: 403 };
  }

  return { scope, exam, schedule };
};

const getLegacyResultsForSingleScheduledSubject = async ({
  exam_id,
  class_id,
  section_id,
  scope,
  studentIds
}) => {
  const scheduleCount = await ExamSchedule.count({
    where: {
      exam_id,
      school_id: scope.school_id,
      branch_id: scope.branch_id,
      class_id,
      section_id: section_id || null,
      is_active: true,
      status: { [Op.ne]: 'cancelled' }
    }
  });
  if (scheduleCount !== 1 || !studentIds.length) return [];

  return ExamResult.findAll({
    where: {
      exam_id,
      school_id: scope.school_id,
      branch_id: scope.branch_id,
      student_id: { [Op.in]: studentIds }
    }
  });
};

/**
 * Get students for marks entry based on filters
 */
const getStudentsForMarksEntry = async (req, res) => {
  try {
    const { exam_id, class_id, section_id, subject_id } = req.query;

    // Validate required parameters
    if (!exam_id || !class_id || !subject_id) {
      return res.status(400).json({
        success: false,
        message: 'Exam, class, and subject are required'
      });
    }

    const context = await getMarksContext(req, req.query);
    if (context.error) {
      return res.status(context.status).json({ success: false, message: context.error });
    }
    const { scope, exam, schedule } = context;

    const whereClause = {
      class_id: class_id,
      school_id: scope.school_id,
      branch_id: scope.branch_id,
      status: 'active'
    };

    whereClause.section_id = section_id || null;

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

    const existingResults = await ExamSubjectMark.findAll({
      where: {
        exam_schedule_id: schedule.id,
        school_id: scope.school_id,
        branch_id: scope.branch_id,
        student_id: {
          [Op.in]: students.map(s => s.id)
        }
      }
    });
    const legacyResults = await getLegacyResultsForSingleScheduledSubject({
      exam_id,
      class_id,
      section_id,
      scope,
      studentIds: students.map(student => student.id)
    });

    // Legacy exam-wide marks are attributable only when this cohort has one active schedule.
    const resultsMap = {};
    legacyResults.forEach(result => {
      resultsMap[result.student_id] = result;
    });
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
      theory_marks: schedule.theory_marks || 0,
      practical_marks: schedule.practical_marks || 0,
      viva_marks: schedule.viva_marks || 0,
      assignment_marks: schedule.assignment_marks || 0,
      total_marks: schedule.total_marks || exam.max_marks || 100,
      pass_marks: schedule.pass_marks || 35
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
    res.status(error.statusCode || error.status || 500).json({
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
    const { exam_id, class_id, section_id, subject_id, marks_data } = req.body;

    if (!exam_id || !class_id || !subject_id || !Array.isArray(marks_data) || !marks_data.length) {
      return res.status(400).json({
        success: false,
        message: 'Exam, class, subject, and marks data are required'
      });
    }

    const context = await getMarksContext(req, req.body);
    if (context.error) {
      return res.status(context.status).json({ success: false, message: context.error });
    }
    const { scope, exam, schedule } = context;
    const studentIds = marks_data.map(item => item.student_id);
    if (new Set(studentIds).size !== studentIds.length || studentIds.some(id => !id)) {
      return res
        .status(400)
        .json({ success: false, message: 'Each student must appear once in the marks data' });
    }

    const students = await Student.findAll({
      where: {
        id: { [Op.in]: studentIds },
        school_id: scope.school_id,
        branch_id: scope.branch_id,
        class_id,
        section_id: section_id || null,
        status: 'active'
      },
      attributes: ['id']
    });
    if (students.length !== marks_data.length) {
      return res.status(400).json({
        success: false,
        message: 'Marks include a student outside this scheduled class and section'
      });
    }

    const markLimits = {
      theory_marks_obtained: Number(schedule.theory_marks) || 0,
      practical_marks_obtained: Number(schedule.practical_marks) || 0,
      viva_marks_obtained: Number(schedule.viva_marks) || 0,
      assignment_marks_obtained: Number(schedule.assignment_marks) || 0
    };
    const invalidMarks = marks_data.some(item =>
      !item.is_absent && Object.entries(markLimits).some(([field, maximum]) => {
        const value = item[field] == null ? 0 : Number(item[field]);
        return !Number.isFinite(value) || value < 0 || value > maximum;
      })
    );
    if (invalidMarks) {
      return res.status(400).json({
        success: false,
        message: 'Marks must be valid and within each scheduled component limit'
      });
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
            Number(theory_marks_obtained || 0) +
            Number(practical_marks_obtained || 0) +
            Number(viva_marks_obtained || 0) +
            Number(assignment_marks_obtained || 0);
        }

        // Check if result already exists
        const existingResult = await ExamSubjectMark.findOne({
          where: {
            exam_schedule_id: schedule.id,
            student_id,
            school_id: scope.school_id,
            branch_id: scope.branch_id
          }
        });

        const resultData = {
          exam_schedule_id: schedule.id,
          student_id: student_id,
          theory_marks_obtained: is_absent ? null : theory_marks_obtained,
          practical_marks_obtained: is_absent ? null : practical_marks_obtained,
          viva_marks_obtained: is_absent ? null : viva_marks_obtained,
          assignment_marks_obtained: is_absent ? null : assignment_marks_obtained,
          marks_obtained: is_absent ? 0 : totalMarks,
          is_absent: is_absent,
          school_id: scope.school_id,
          branch_id: scope.branch_id,
          created_by: req.user.id,
          updated_by: req.user.id
        };

        let result;
        if (existingResult) {
          await ExamSubjectMark.update(resultData, {
            where: { id: existingResult.id }
          });
          result = await ExamSubjectMark.findByPk(existingResult.id);
        } else {
          result = await ExamSubjectMark.create(resultData);
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
    res.status(error.statusCode || error.status || 500).json({
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
    const { exam_id, class_id, section_id, subject_id } = req.query;

    if (!exam_id || !class_id || !subject_id) {
      return res.status(400).json({
        success: false,
        message: 'Exam, class, and subject are required'
      });
    }

    const context = await getMarksContext(req, req.query);
    if (context.error) {
      return res.status(context.status).json({ success: false, message: context.error });
    }
    const { scope } = context;
    const students = await Student.findAll({
      where: {
        school_id: scope.school_id,
        branch_id: scope.branch_id,
        class_id,
        section_id: section_id || null,
        status: 'active'
      },
      attributes: ['id']
    });
    const results = students.length
      ? await ExamSubjectMark.findAll({
          where: {
            exam_schedule_id: context.schedule.id,
            school_id: scope.school_id,
            branch_id: scope.branch_id,
            student_id: { [Op.in]: students.map(student => student.id) }
          },
          attributes: ['student_id', 'is_absent']
        })
      : [];
    const legacyResults = await getLegacyResultsForSingleScheduledSubject({
      exam_id,
      class_id,
      section_id,
      scope,
      studentIds: students.map(student => student.id)
    });
    const resultsByStudent = new Map(results.map(result => [result.student_id, result]));
    legacyResults.forEach(result => {
      if (!resultsByStudent.has(result.student_id)) resultsByStudent.set(result.student_id, result);
    });
    const allResults = [...resultsByStudent.values()];
    const absentStudents = allResults.filter(result => result.is_absent).length;
    const studentsWithMarks = allResults.length;

    res.json({
      success: true,
      data: {
        total_students: students.length,
        marks_entered: studentsWithMarks,
        absent_students: absentStudents,
        pending: students.length - studentsWithMarks
      }
    });
  } catch (error) {
    logger.error('Error fetching marks entry summary:', error);
    res.status(error.statusCode || error.status || 500).json({
      success: false,
      message: 'Failed to fetch marks entry summary',
      error: error.message
    });
  }
};

const previewMarksImport = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Select a CSV or Excel file' });
    const context = await getMarksContext(req, req.body);
    if (context.error) return res.status(context.status).json({ success: false, message: context.error });
    const { scope, schedule } = context;
    const students = await Student.findAll({
      where: {
        school_id: scope.school_id,
        branch_id: scope.branch_id,
        class_id: schedule.class_id,
        section_id: schedule.section_id || null,
        status: 'active'
      },
      attributes: ['id', 'first_name', 'last_name', 'admission_number', 'roll_number'],
      order: [['roll_number', 'ASC']]
    });
    const workbook = XLSX.readFile(req.file.path, { raw: false });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    const parsed = parseSubjectMarkImport(rows, students, schedule);
    return res.json({ success: true, data: { ...parsed, total_rows: rows.length } });
  } catch (error) {
    logger.error('Error previewing subject marks import:', error);
    return res.status(400).json({ success: false, message: error.message || 'Could not read the marks file' });
  } finally {
    if (req.file?.path) await fs.promises.unlink(req.file.path).catch(() => {});
  }
};

const downloadMarksImportTemplate = async (req, res) => {
  try {
    const context = await getMarksContext(req, req.query);
    if (context.error) return res.status(context.status).json({ success: false, message: context.error });
    const { scope, schedule } = context;
    const students = await Student.findAll({
      where: {
        school_id: scope.school_id,
        branch_id: scope.branch_id,
        class_id: schedule.class_id,
        section_id: schedule.section_id || null,
        status: 'active'
      },
      attributes: ['admission_number', 'first_name', 'last_name', 'roll_number'],
      order: [['roll_number', 'ASC']]
    });
    const columns = [
      { header: 'Admission Number', key: 'admission_number' },
      { header: 'Student Name', key: 'student_name' },
      { header: 'Roll Number', key: 'roll_number' },
      ...[
        ['theory_marks_obtained', 'theory_marks'],
        ['practical_marks_obtained', 'practical_marks'],
        ['viva_marks_obtained', 'viva_marks'],
        ['assignment_marks_obtained', 'assignment_marks']
      ].filter(([, scheduleField]) => Number(schedule[scheduleField]) > 0)
        .map(([key]) => ({ header: key, key })),
      { header: 'Is Absent', key: 'is_absent' }
    ];
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(students.map(student => ({
      admission_number: student.admission_number,
      student_name: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
      roll_number: student.roll_number,
      is_absent: false
    })), { header: columns.map(column => column.key) });
    XLSX.utils.sheet_add_aoa(sheet, [columns.map(column => column.header)], { origin: 'A1' });
    XLSX.utils.book_append_sheet(workbook, sheet, 'Marks Entry');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="subject-marks-template.xlsx"');
    return res.send(buffer);
  } catch (error) {
    logger.error('Error creating subject marks template:', error);
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStudentsForMarksEntry,
  saveMarks,
  getMarksEntrySummary,
  previewMarksImport,
  downloadMarksImportTemplate
};
