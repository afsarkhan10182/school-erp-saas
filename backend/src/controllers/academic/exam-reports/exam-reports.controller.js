const {
  Exam,
  ExamResult,
  Student,
  Class,
  Section,
  School,
  Branch,
  ReportTemplate,
  ReportCardSetup,
  ReportCardSetupExam,
  StudentPromotion,
  Parent,
  User,
  AttendanceRecord,
  AttendanceSession,
  StudentReportCardArchive,
  sequelize
} = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { Op, fn, col } = require('sequelize');
const { randomUUID } = require('crypto');
const PDFDocument = require('pdfkit');
const { sendEmail } = require('~/utils/communication/email');
const fs = require('fs').promises;
const path = require('path');
const { resolvePrivateReportCardsPath } = require('~/utils/shared/pathHelper');
const {
  getSchoolCodeFromId,
  ensureSchoolUploadDir,
  getCurrentYear
} = require('~/utils/shared/storage');
const { calculateWeightedReportCard } = require('~/utils/academic/weightedReportCard');
const ReportCardService = require('~/services/academic/report-card.service');
const { getResolvedExamResults } = require('~/services/academic/subject-mark-rollup.service');
const { resultKey } = require('~/utils/academic/completeSubjectMarkRollups');

const getReportCardAttendance = async (studentIds, schoolId, branchId, academicYear) => {
  const rows = await AttendanceRecord.findAll({
    where: { student_id: { [Op.in]: studentIds }, school_id: schoolId, branch_id: branchId },
    attributes: ['student_id', 'status', [fn('COUNT', col('AttendanceRecord.id')), 'record_count']],
    include: [
      {
        model: AttendanceSession,
        as: 'session',
        attributes: [],
        where: {
          school_id: schoolId,
          branch_id: branchId,
          status: 'published',
          ...(academicYear
            ? { [Op.or]: [{ academic_year: academicYear }, { academic_year: null }] }
            : {})
        },
        required: true
      }
    ],
    group: ['AttendanceRecord.student_id', 'AttendanceRecord.status']
  });
  const summaries = Object.fromEntries(studentIds.map(id => [id, { total: 0, present: 0, late: 0 }]));
  rows.forEach(row => {
    const summary = summaries[row.student_id];
    if (!summary) return;
    const count = Number(row.record_count ?? row.get?.('record_count') ?? 0);
    summary.total += count;
    if (row.status === 'present') summary.present += count;
    if (row.status === 'late') summary.late += count;
  });
  return summaries;
};

const getPromotedStudentIds = async ({ classId, sectionId, schoolId, branchId, academicYear }) => {
  const promotions = await StudentPromotion.findAll({
    where: {
      from_class_id: classId,
      from_academic_year: academicYear,
      action: 'promote',
      school_id: schoolId,
      ...(branchId && { branch_id: branchId }),
      ...(sectionId && { from_section_id: sectionId })
    },
    attributes: ['student_id']
  });
  return promotions.map(promotion => promotion.student_id);
};

/**
 * Get students for report cards
 */
const getStudentsForReportCards = async (req, res) => {
  try {
    const { exam_id, class_id, section_id, enrollment_scope = 'currently_studying' } = req.query;

    // Validate required parameters
    if (!exam_id || !class_id) {
      return res.status(400).json({
        success: false,
        message: 'Exam ID and Class ID are required'
      });
    }

    const schoolId = req.schoolId || req.user.school_id;
    const branchId = req.branchId;
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'School context is required' });
    }

    const exam = await Exam.findOne({
      where: {
        id: exam_id,
        school_id: schoolId,
        ...(branchId && { branch_id: branchId })
      }
    });
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    if (!['currently_studying', 'full_register'].includes(enrollment_scope)) {
      return res.status(400).json({ success: false, message: 'Invalid enrollment scope' });
    }
    if (enrollment_scope === 'full_register' && !exam.academic_year) {
      return res.status(409).json({ success: false, message: 'Exam academic year is required for the full register' });
    }
    const sourceClass = enrollment_scope === 'full_register'
      ? await Class.findOne({
          where: { id: class_id, school_id: schoolId, ...(branchId && { branch_id: branchId }) }
        })
      : null;
    if (enrollment_scope === 'full_register' && !sourceClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    const rosterBranchId = branchId || sourceClass?.branch_id;

    // Get students based on class and section
    const currentRoster = {
      class_id,
      ...(section_id && { section_id })
    };
    const promotedIds = enrollment_scope === 'full_register'
      ? await getPromotedStudentIds({
          classId: class_id,
          sectionId: section_id,
          schoolId,
          branchId: rosterBranchId,
          academicYear: exam.academic_year
        })
      : [];
    const whereClause = {
      school_id: schoolId,
      ...(rosterBranchId && { branch_id: rosterBranchId }),
      status: 'active',
      ...(enrollment_scope === 'full_register'
        ? { [Op.or]: [currentRoster, ...(promotedIds.length ? [{ id: { [Op.in]: promotedIds } }] : [])] }
        : currentRoster)
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
          as: 'sectionInfo',
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order: [['roll_number', 'ASC']]
    });

    // Get exam results for these students
    const resultStudents = students.map(student => ({
      ...(student.toJSON?.() || student),
      ...(promotedIds.includes(student.id) && { class_id, section_id: section_id || student.section_id })
    }));
    const resultsMap = await getResolvedExamResults({ exams: [exam], students: resultStudents, schoolId, branchId });
    const resolvedResults = [...resultsMap.values()];
    const hasUngradedResults = resolvedResults.some(
      result => result.grade == null && result.percentage != null && Number.isFinite(Number(result.percentage))
    );
    const reportCardService = hasUngradedResults ? new ReportCardService() : null;
    const gradingSystem = reportCardService
      ? await reportCardService.getGradingSystem(schoolId)
      : null;

    // Prepare student data with exam results
    const studentsWithResults = students.map(student => {
      const result = resultsMap.get(resultKey(student.id, exam_id));
      const percentage = Number(result?.percentage);
      return {
        id: student.id,
        name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown',
        roll_number: student.roll_number,
        class: student.class?.name,
        section: student.sectionInfo?.name,
        is_promoted_since_exam: promotedIds.includes(student.id),
        total_marks: result?.marks_obtained || 0,
        grade: result?.grade ?? (result?.percentage != null && Number.isFinite(percentage) && gradingSystem
          ? reportCardService.calculateGrade(percentage, gradingSystem)
          : null),
        is_absent: result?.is_absent || false
      };
    });

    res.json({
      success: true,
      data: studentsWithResults
    });
  } catch (error) {
    logger.error('Error fetching students for report cards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students for report cards',
      error: error.message
    });
  }
};

/**
 * Get report card templates
 */
const getReportCardTemplates = async (req, res) => {
  try {
    const schoolId = req.schoolId || req.user.school_id;
    const templates = await ReportTemplate.findAll({
      where: {
        is_active: true,
        report_type: { [Op.in]: ['student_wise', 'detailed'] },
        [Op.or]: [{ school_id: schoolId || null }, { school_id: null }]
      },
      attributes: [
        'id',
        'name',
        'description',
        'report_type',
        'config',
        'footer_template',
        'is_default',
        'school_id'
      ],
      order: [
        ['is_default', 'DESC'],
        ['name', 'ASC']
      ]
    });

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    logger.error('Error fetching report card templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report card templates',
      error: error.message
    });
  }
};

/**
 * Generate report cards
 */
const generateReportCards = async (req, res) => {
  try {
    const {
      exam_id,
      setup_id,
      student_ids,
      template_id,
      output_format,
      email_options,
      class_id,
      section_id,
      enrollment_scope = 'currently_studying',
      archive_report_cards = false
    } = req.body;
    const outputFormat = output_format || 'pdf';

    // Validate required parameters
    if (
      (!exam_id && !setup_id) ||
      (exam_id && setup_id) ||
      !Array.isArray(student_ids) ||
      student_ids.length === 0 ||
      (!template_id && !setup_id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Choose one exam or report-card setup, provide student IDs, and select a template for single-exam reports'
      });
    }
    if (!['pdf', 'print'].includes(outputFormat)) {
      return res
        .status(400)
        .json({ success: false, message: 'Unsupported report card output format' });
    }
    if (!['currently_studying', 'full_register'].includes(enrollment_scope)) {
      return res.status(400).json({ success: false, message: 'Invalid enrollment scope' });
    }
    if (enrollment_scope === 'full_register' && !class_id) {
      return res.status(400).json({ success: false, message: 'Class is required for the full register' });
    }
    if (archive_report_cards && !['admin', 'branch_admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only school administrators can archive report cards' });
    }

    const requestedStudentIds = [...new Set(student_ids)];
    const schoolContextId = req.schoolId || req.user.school_id;
    const branchContextId = req.branchId;

    let reportCardSetup = null;
    let examIds = [];
    let exam;
    if (setup_id) {
      if (!branchContextId) {
        return res
          .status(400)
          .json({ success: false, message: 'Select one branch to generate this report card' });
      }
      reportCardSetup = await ReportCardSetup.findOne({
        where: { id: setup_id, school_id: schoolContextId, branch_id: branchContextId },
        include: [
          { model: ReportTemplate, as: 'template' },
          {
            model: ReportCardSetupExam,
            as: 'examEntries',
            include: [
              {
                model: Exam,
                as: 'exam',
                include: [
                  { model: School, as: 'school', attributes: ['id', 'name', 'code'] },
                  { model: Branch, as: 'branch', attributes: ['id', 'name'] }
                ]
              }
            ]
          }
        ]
      });
      if (!reportCardSetup)
        return res.status(404).json({ success: false, message: 'Report-card setup not found' });
      if (
        !reportCardSetup.is_published ||
        reportCardSetup.examEntries.length === 0 ||
        reportCardSetup.examEntries.some(
          entry =>
            !entry.exam?.result_status ||
            !entry.exam?.is_active ||
            entry.exam.school_id !== reportCardSetup.school_id ||
            entry.exam.branch_id !== reportCardSetup.branch_id
        )
      ) {
        return res.status(409).json({
          success: false,
          message:
            'Publish the setup after releasing every included exam before generating report cards'
        });
      }
      if (
        !reportCardSetup.template?.is_active ||
        !['student_wise', 'detailed'].includes(reportCardSetup.template.report_type) ||
        ![reportCardSetup.school_id, null].includes(reportCardSetup.template.school_id)
      ) {
        return res.status(404).json({ success: false, message: 'Report card template not found' });
      }
      examIds = reportCardSetup.examEntries.map(entry => entry.exam_id);
      exam = {
        ...reportCardSetup.examEntries[0].exam.toJSON(),
        name: reportCardSetup.name,
        max_marks: 100
      };
    } else {
      exam = await Exam.findOne({
        where: {
          id: exam_id,
          ...(schoolContextId && { school_id: schoolContextId }),
          ...(branchContextId && { branch_id: branchContextId })
        },
        include: [
          { model: School, as: 'school', attributes: ['id', 'name', 'code'] },
          { model: Branch, as: 'branch', attributes: ['id', 'name'] }
        ]
      });
      examIds = [exam_id];
    }

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }
    const schoolId = schoolContextId || exam.school_id;
    const branchId = branchContextId || exam.branch_id;
    if (
      enrollment_scope === 'full_register' &&
      (!exam.academic_year || reportCardSetup?.examEntries.some(entry => entry.exam.academic_year !== exam.academic_year))
    ) {
      return res.status(409).json({ success: false, message: 'Included exams must share an academic year for the full register' });
    }
    const sourceClass = enrollment_scope === 'full_register'
      ? await Class.findOne({
          where: { id: class_id, school_id: schoolId, ...(branchId && { branch_id: branchId }) }
        })
      : null;
    if (enrollment_scope === 'full_register' && !sourceClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    const rosterBranchId = branchId || sourceClass?.branch_id;

    const template =
      reportCardSetup?.template ||
      (await ReportTemplate.findOne({
        where: {
          id: template_id,
          is_active: true,
          report_type: { [Op.in]: ['student_wise', 'detailed'] },
          [Op.or]: [{ school_id: schoolId }, { school_id: null }]
        }
      }));
    if (!template) {
      return res.status(404).json({ success: false, message: 'Report card template not found' });
    }

    const emailRequested = email_options?.to_parents || email_options?.to_students;
    // Get students with their exam results
    const promotedIds = enrollment_scope === 'full_register'
      ? await getPromotedStudentIds({
          classId: class_id,
          sectionId: section_id,
          schoolId,
          branchId: rosterBranchId,
          academicYear: exam.academic_year
        })
      : [];
    const studentWhere = {
        id: { [Op.in]: requestedStudentIds },
        school_id: schoolId,
        ...(rosterBranchId && { branch_id: rosterBranchId }),
        ...(class_id && {
          status: 'active',
          [Op.or]: [
            { class_id, ...(section_id && { section_id }) },
            ...(enrollment_scope === 'full_register' && promotedIds.length ? [{ id: { [Op.in]: promotedIds } }] : [])
          ]
        })
      };
    const students = await Student.findAll({
      where: studentWhere,
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
        },
        {
          model: Parent,
          as: 'parents',
          attributes: emailRequested
            ? ['father_name', 'mother_name', 'guardian_name', 'father_email', 'mother_email', 'guardian_email']
            : ['father_name', 'mother_name', 'guardian_name'],
          where: { school_id: schoolId },
          through: { attributes: ['relationship', 'is_primary'] },
          ...(emailRequested
            ? {
                include: [
                  {
                    model: User,
                    as: 'user',
                    attributes: ['email'],
                    where: { school_id: schoolId },
                    required: false
                  }
                ]
              }
            : {}),
          required: false
        },
        ...(emailRequested
          ? [
              {
                model: User,
                as: 'user',
                attributes: ['email'],
                where: { school_id: schoolId },
                required: false
              }
            ]
          : [])
      ]
    });
    if (students.length !== requestedStudentIds.length) {
      return res
        .status(404)
        .json({ success: false, message: 'One or more selected students were not found' });
    }
    const attendanceSummaries = await getReportCardAttendance(
      requestedStudentIds,
      schoolId,
      branchId,
      exam.academic_year
    );
    students.forEach(student => {
      student.attendance_summary = attendanceSummaries[student.id];
    });

    const resultExams = reportCardSetup
      ? reportCardSetup.examEntries.map(entry => entry.exam)
      : [exam];
    const resultStudents = students.map(student => ({
      ...(student.toJSON?.() || student),
      ...(promotedIds.includes(student.id) && { class_id, section_id: section_id || student.section_id })
    }));
    const resolvedResults = await getResolvedExamResults({
      exams: resultExams,
      students: resultStudents,
      schoolId,
      branchId
    });

    // Create results map (one result per student)
    const resultsMap = {};
    if (reportCardSetup) {
      const reportCardService = new ReportCardService();
      const gradingSystem = await reportCardService.getGradingSystem(schoolId);
      const resultsByStudent = {};
      students.forEach(student => {
        resultsByStudent[student.id] = Object.fromEntries(
          reportCardSetup.examEntries.map(entry => [
            entry.exam_id,
            resolvedResults.get(resultKey(student.id, entry.exam_id))
          ])
        );
        const weighted = calculateWeightedReportCard(
          reportCardSetup.examEntries,
          resultsByStudent[student.id] || {}
        );
        resultsMap[student.id] = {
          percentage: weighted.percentage,
          marks_obtained: weighted.percentage,
          grade:
            weighted.percentage === null
              ? 'N/A'
              : reportCardService.calculateGrade(weighted.percentage, gradingSystem),
          is_absent: weighted.is_absent,
          exam_breakdown: weighted.breakdown,
          theory_marks_obtained: null,
          practical_marks_obtained: null,
          viva_marks_obtained: null,
          assignment_marks_obtained: null
        };
      });
    } else {
      const subjectRollups = [...resolvedResults.values()].filter(result => result.is_subject_rollup);
      if (subjectRollups.length) {
        const reportCardService = new ReportCardService();
        const gradingSystem = await reportCardService.getGradingSystem(schoolId);
        subjectRollups.forEach(result => {
          result.grade = reportCardService.calculateGrade(result.percentage, gradingSystem);
        });
      }
      students.forEach(student => {
        const result = resolvedResults.get(resultKey(student.id, exam.id));
        if (result) resultsMap[student.id] = result;
      });
    }

    // PDF is also the printable artifact; the browser opens it for the print dialog.
    let downloadUrl = null;
    let reportId = null;
    if (['pdf', 'print'].includes(outputFormat)) {
      const timestamp = Date.now();
      reportId = `report-${setup_id || exam_id}-${timestamp}`;
      const fileName = `${reportId}.pdf`;

      // Get school code for school-specific path
      // Structure: uploads/schools/{schoolCode}/{year}/report-cards/{filename}
      const schoolCode = await getSchoolCodeFromId(schoolId);
      const year = getCurrentYear();

      // Ensure school-specific report-cards directory exists
      const reportsDir = ensureSchoolUploadDir(schoolCode, 'report-cards', year);
      const filePath = path.join(reportsDir, fileName);

      // Generate PDF
      await generatePDFReportCard(
        exam,
        students,
        resultsMap,
        filePath,
        template,
        reportCardSetup?.orientation
      );

      downloadUrl = `/api/exam-reports/download/${reportId}?school_id=${encodeURIComponent(schoolId)}`;
    }

    let archivedStudents = 0;
    if (archive_report_cards) {
      const storageYear = Number(getCurrentYear());
      const schoolCode = await getSchoolCodeFromId(schoolId);
      const archiveDir = resolvePrivateReportCardsPath(schoolCode, String(storageYear));
      await fs.mkdir(archiveDir, { recursive: true });
      const archivedFiles = [];
      const archiveRows = [];
      try {
        for (const student of students) {
          const archiveId = randomUUID();
          const fileName = `${archiveId}.pdf`;
          const filePath = path.join(archiveDir, fileName);
          archivedFiles.push(filePath);
          await generatePDFReportCard(
            exam,
            [student],
            resultsMap,
            filePath,
            template,
            reportCardSetup?.orientation
          );
          archiveRows.push({
            id: archiveId,
            student_id: student.id,
            exam_id: setup_id ? null : exam.id,
            setup_id: setup_id || null,
            school_id: schoolId,
            branch_id: rosterBranchId || branchId,
            title: `${exam.name} report card`,
            academic_year: exam.academic_year || null,
            file_name: fileName,
            storage_year: storageYear,
            created_by: req.user?.id || null
          });
        }
        await sequelize.transaction(transaction =>
          StudentReportCardArchive.bulkCreate(archiveRows, { transaction })
        );
        archivedStudents = archiveRows.length;
      } catch (archiveError) {
        await Promise.all(archivedFiles.map(filePath => fs.unlink(filePath).catch(() => {})));
        throw archiveError;
      }
    }

    const emailDelivery = { requested: false, sent: 0, failed: 0, skipped_students: 0 };
    if (emailRequested) {
      emailDelivery.requested = true;
      Object.assign(
        emailDelivery,
        await sendReportCardEmails(
          exam,
          students,
          resultsMap,
          template,
          email_options,
          reportCardSetup?.orientation
        )
      );
    }

    const reportData = {
      report_id: reportId,
      generated_at: new Date().toISOString(),
      total_students: requestedStudentIds.length,
      template_used: template.id,
      setup_used: setup_id || null,
      template_name: template.name,
      output_format: outputFormat,
      email_sent: emailDelivery.sent > 0,
      email_delivery: emailDelivery,
      download_url: downloadUrl,
      archived_students: archivedStudents
    };

    res.json({
      success: true,
      message: `Report cards generated for ${requestedStudentIds.length} students`,
      data: reportData
    });
  } catch (error) {
    logger.error('Error generating report cards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report cards',
      error: error.message
    });
  }
};

const getStudentReportCardArchives = async (req, res) => {
  try {
    const schoolId = req.schoolId || req.user.school_id;
    if (!schoolId) return res.status(400).json({ success: false, message: 'Select a school first' });
    if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(req.params.studentId)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID' });
    }
    const branchId = req.branchId;
    const archives = await StudentReportCardArchive.findAll({
      where: {
        student_id: req.params.studentId,
        school_id: schoolId,
        ...(branchId && { branch_id: branchId })
      },
      attributes: ['id', 'title', 'academic_year', 'created_at'],
      order: [['created_at', 'DESC']]
    });
    return res.json({ success: true, data: archives });
  } catch (error) {
    logger.error('Error fetching student report-card archive:', error);
    return res.status(500).json({ success: false, message: 'Failed to load archived report cards' });
  }
};

const downloadStudentReportCardArchive = async (req, res) => {
  try {
    const schoolId = req.schoolId || req.user.school_id;
    if (!schoolId) return res.status(400).json({ success: false, message: 'Select a school first' });
    if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(req.params.archiveId)) {
      return res.status(400).json({ success: false, message: 'Invalid archive ID' });
    }
    const archive = await StudentReportCardArchive.findOne({
      where: {
        id: req.params.archiveId,
        school_id: schoolId,
        ...(req.branchId && { branch_id: req.branchId })
      }
    });
    if (!archive) return res.status(404).json({ success: false, message: 'Archived report card not found' });
    if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\.pdf$/i.test(archive.file_name) ||
        !Number.isInteger(Number(archive.storage_year)) || Number(archive.storage_year) < 2000) {
      return res.status(404).json({ success: false, message: 'Archived report card file not found' });
    }

    const schoolCode = await getSchoolCodeFromId(archive.school_id);
    const reportsDir = resolvePrivateReportCardsPath(schoolCode, String(archive.storage_year));
    const filePath = path.join(reportsDir, archive.file_name);
    await fs.access(filePath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report-card-${archive.id}.pdf"`);
    return res.sendFile(path.resolve(filePath));
  } catch (error) {
    if (error.code === 'ENOENT') return res.status(404).json({ success: false, message: 'Archived report card file not found' });
    logger.error('Error downloading archived report card:', error);
    return res.status(500).json({ success: false, message: 'Failed to download archived report card' });
  }
};

const sendReportCardEmails = async (
  exam,
  students,
  resultsMap,
  template,
  options,
  orientation = 'portrait'
) => {
  const delivery = { sent: 0, failed: 0, skipped_students: 0 };
  const validEmail = value =>
    typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  for (const student of students) {
    const parents = student.parents || [];
    const recipients = new Set();
    if (options.to_parents) {
      parents
        .flatMap(parent => [
          parent.guardian_email,
          parent.father_email,
          parent.mother_email,
          parent.user?.email
        ])
        .filter(validEmail)
        .forEach(email => recipients.add(email.trim()));
    }
    if (options.to_students) {
      [student.email, student.user?.email]
        .filter(validEmail)
        .forEach(email => recipients.add(email.trim()));
    }
    if (!recipients.size) {
      delivery.skipped_students++;
      continue;
    }

    let attachment;
    try {
      attachment = await generatePDFReportCard(
        exam,
        [student],
        resultsMap,
        null,
        template,
        orientation
      );
    } catch (error) {
      logger.error(`Failed to render email report card for student ${student.id}:`, error);
      delivery.failed += recipients.size;
      continue;
    }

    for (const to of recipients) {
      try {
        await sendEmail({
          to,
          subject: `Report card: ${String(exam.name)
            .replace(/[\r\n]+/g, ' ')
            .trim()}`,
          text: `Please find the report card for ${student.first_name} ${student.last_name || ''} attached.`,
          attachments: [
            {
              filename: `report-card-${String(student.roll_number || student.id).replace(/[^\w.-]/g, '-')}.pdf`,
              content: attachment,
              contentType: 'application/pdf'
            }
          ]
        });
        delivery.sent++;
      } catch (error) {
        logger.error(`Failed to email report card for student ${student.id}:`, error);
        delivery.failed++;
      }
    }
  }
  return delivery;
};

/**
 * Generate PDF report card
 */
const generatePDFReportCard = async (
  exam,
  students,
  resultsMap,
  filePath,
  template,
  orientation = 'portrait'
) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        layout: orientation
      });

      const chunks = filePath ? null : [];
      const stream = filePath ? require('fs').createWriteStream(filePath) : null;
      if (stream) {
        doc.pipe(stream);
        stream.on('finish', () => resolve());
        stream.on('error', reject);
      } else {
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
      }
      doc.on('error', reject);

      // Generate report card for each student
      students.forEach((student, index) => {
        if (index > 0) {
          doc.addPage();
        }
        const result = resultsMap[student.id];
        const left = doc.page.margins.left;
        const width = doc.page.width - left - doc.page.margins.right;
        const navy = '#24324b';
        const accent = '#5b5bd6';
        const muted = '#64748b';
        const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Student';
        const parents = student.parents || [];
        const fatherName = parents.find(parent => parent.father_name)?.father_name;
        const motherName = parents.find(parent => parent.mother_name)?.mother_name;
        const guardianName = parents.find(parent => parent.guardian_name)?.guardian_name;

        doc.rect(0, 0, doc.page.width, 8).fill(accent);
        doc.fillColor(navy).font('Helvetica-Bold').fontSize(19)
          .text(exam.school?.name || 'School', left, 35, { width, align: 'center' });
        if (exam.branch?.name) {
          doc.fillColor(muted).font('Helvetica').fontSize(10)
            .text(exam.branch.name, left, 59, { width, align: 'center' });
        }
        doc.fillColor(navy).font('Helvetica-Bold').fontSize(15)
          .text(template.name || 'Report Card', left, 82, { width, align: 'center' });
        doc.moveTo(left, 107).lineTo(left + width, 107).lineWidth(1).strokeColor('#dbe2ea').stroke();

        const infoY = 122;
        doc.roundedRect(left, infoY, width, 108, 8).fillAndStroke('#f5f7fb', '#e2e8f0');
        doc.fillColor(navy).font('Helvetica-Bold').fontSize(10).text(studentName, left + 15, infoY + 13, { width: width * 0.52 });
        doc.fillColor(muted).font('Helvetica').fontSize(9);
        doc.text(`Admission No.  ${student.admission_number || 'N/A'}`, left + 15, infoY + 33, { width: width * 0.52 });
        doc.text(`Class  ${student.class?.name || 'N/A'}${student.sectionInfo?.name ? `  ·  ${student.sectionInfo.name}` : ''}`, left + 15, infoY + 50, { width: width * 0.52 });
        doc.text(`Date of birth  ${student.date_of_birth || '—'}`, left + 15, infoY + 67, { width: width * 0.52 });
        doc.fillColor(muted).fontSize(8).font('Helvetica-Bold')
          .text('ROLL NUMBER', left + width * 0.63, infoY + 12, { width: width * 0.32 });
        doc.fillColor(navy).fontSize(10)
          .text(student.roll_number || '—', left + width * 0.63, infoY + 25, { width: width * 0.32 });
        doc.fillColor(muted).fontSize(8)
          .text('FATHER', left + width * 0.63, infoY + 44, { width: width * 0.32 });
        doc.fillColor(navy).font('Helvetica').fontSize(9)
          .text(fatherName || guardianName || '—', left + width * 0.63, infoY + 56, { width: width * 0.32 });
        doc.fillColor(muted).font('Helvetica-Bold').fontSize(8)
          .text('MOTHER', left + width * 0.63, infoY + 75, { width: width * 0.32 });
        doc.fillColor(navy).font('Helvetica').fontSize(9)
          .text(motherName || '—', left + width * 0.63, infoY + 87, { width: width * 0.32 });

        const score = result?.percentage;
        const hasScore = score !== null && score !== undefined && Number.isFinite(Number(score));
        const scoreText = hasScore ? `${Number(score).toFixed(2)}%` : 'N/A';
        const gradeText = result?.grade || 'N/A';
        const statusText = result?.is_absent ? 'Absent' : result ? 'Evaluated' : 'No result';
        const attendance = student.attendance_summary || { total: 0, present: 0, late: 0 };
        const attended = attendance.present + attendance.late;
        const attendanceText = attendance.total
          ? `${Math.round((attended / attendance.total) * 100)}%`
          : 'N/A';
        const cardY = 246;
        const cardGap = 8;
        const cardWidth = (width - cardGap * 3) / 4;
        [
          {
            label: 'OVERALL SCORE',
            value: scoreText,
            detail: result?.exam_breakdown
              ? 'Weighted aggregate'
              : result?.marks_obtained != null
                ? `${result.marks_obtained} / ${exam.max_marks || 100} marks`
                : ''
          },
          { label: 'GRADE', value: gradeText },
          { label: 'ATTENDANCE', value: attendanceText, detail: `${attended} / ${attendance.total} tracked` },
          { label: 'STATUS', value: statusText }
        ].forEach((card, cardIndex) => {
          const x = left + cardIndex * (cardWidth + cardGap);
          doc.roundedRect(x, cardY, cardWidth, 68, 7).fillAndStroke('#ffffff', '#e2e8f0');
          doc.fillColor(muted).font('Helvetica-Bold').fontSize(8).text(card.label, x + 10, cardY + 10, { width: cardWidth - 20 });
          doc.fillColor(cardIndex === 0 ? accent : navy).font('Helvetica-Bold').fontSize(15)
            .text(card.value, x + 10, cardY + 27, { width: cardWidth - 20 });
          if (card.detail) {
            doc.fillColor(muted).font('Helvetica').fontSize(7)
              .text(card.detail, x + 10, cardY + 49, { width: cardWidth - 20 });
          }
        });

        let tableY = 340;
        doc.fillColor(navy).font('Helvetica-Bold').fontSize(11).text('Examination breakdown', left, tableY);
        tableY += 23;
        const hasExamBreakdown = Array.isArray(result?.exam_breakdown);
        const rows = result?.exam_breakdown || [{
          exam_name: exam.name || 'Examination', weightage: 100,
          marks_obtained: result?.marks_obtained, max_marks: exam.max_marks || 100,
          percentage: result?.is_absent || !hasScore ? null : Number(score),
          is_absent: Boolean(result?.is_absent), has_result: Boolean(result)
        }];
        const columns = { exam: left + 10, weight: left + width * 0.69, result: left + width * 0.82 };
        const headerHeight = 25;
        doc.rect(left, tableY, width, headerHeight).fill('#eef2f7');
        doc.fillColor(muted).font('Helvetica-Bold').fontSize(8);
        doc.text('EXAMINATION', columns.exam, tableY + 8, { width: width * 0.64 });
        doc.text(hasExamBreakdown ? 'WEIGHT' : 'MAX MARKS', columns.weight, tableY + 8, { width: width * 0.12, align: 'right' });
        doc.text('RESULT', columns.result, tableY + 8, { width: width * 0.15, align: 'right' });
        tableY += headerHeight;
        rows.forEach((item, rowIndex) => {
          const percentage = item.percentage === null ? null : Number(item.percentage);
          const detail = percentage === null
            ? item.is_absent ? 'Absent' : item.has_result ? 'No score' : 'No result'
            : hasExamBreakdown
              ? `${percentage.toFixed(2)}%`
              : `${item.marks_obtained ?? 0} / ${item.max_marks} (${percentage.toFixed(2)}%)`;
          const nameHeight = doc.font('Helvetica').fontSize(9).heightOfString(item.exam_name || 'Examination', { width: width * 0.62 });
          const rowHeight = Math.max(29, nameHeight + 12);
          if (tableY + rowHeight > doc.page.height - 95) {
            doc.addPage();
            tableY = 50;
            doc.rect(left, tableY, width, headerHeight).fill('#eef2f7');
            doc.fillColor(muted).font('Helvetica-Bold').fontSize(8);
            doc.text('EXAMINATION', columns.exam, tableY + 8, { width: width * 0.64 });
            doc.text(hasExamBreakdown ? 'WEIGHT' : 'MAX MARKS', columns.weight, tableY + 8, { width: width * 0.12, align: 'right' });
            doc.text('RESULT', columns.result, tableY + 8, { width: width * 0.15, align: 'right' });
            tableY += headerHeight;
          }
          if (rowIndex % 2 === 1) doc.rect(left, tableY, width, rowHeight).fill('#fafbfc');
          doc.fillColor(navy).font('Helvetica').fontSize(9).text(item.exam_name || 'Examination', columns.exam, tableY + 7, { width: width * 0.62 });
          doc.fillColor(muted).text(
            hasExamBreakdown ? `${Number(item.weightage || 0)}%` : `${item.max_marks || exam.max_marks || 100}`,
            columns.weight, tableY + 8, { width: width * 0.12, align: 'right' }
          );
          doc.fillColor(detail === 'Absent' ? '#c24141' : navy).text(detail, columns.result, tableY + 8, { width: width * 0.15, align: 'right' });
          tableY += rowHeight;
          doc.moveTo(left, tableY).lineTo(left + width, tableY).lineWidth(0.5).strokeColor('#e2e8f0').stroke();
        });

        if (result && !result.is_absent && template.config?.show_rank && result.rank != null) {
          tableY += 14;
          doc.fillColor(navy).font('Helvetica-Bold').fontSize(9).text(`Rank: ${result.rank}`, left, tableY);
        }
        const componentMarks = [
          ['Theory', result?.theory_marks_obtained],
          ['Practical', result?.practical_marks_obtained],
          ['Viva', result?.viva_marks_obtained],
          ['Assignment', result?.assignment_marks_obtained]
        ].filter(([, value]) => value !== null && value !== undefined);
        if (componentMarks.length) {
          tableY += 14;
          doc.fillColor(navy).font('Helvetica-Bold').fontSize(9).text('Component marks', left, tableY);
          tableY += 14;
          doc.fillColor(muted).font('Helvetica').fontSize(8)
            .text(componentMarks.map(([label, value]) => `${label}: ${value}`).join('     '), left, tableY, { width });
        }
        if (result && !result.is_absent && template.config?.show_remarks !== false && result.remarks) {
          tableY += 18;
          doc.fillColor(muted).font('Helvetica').fontSize(9).text(`Remarks: ${result.remarks}`, left, tableY, { width });
        }

        const signatureY = tableY + 50;
        if (signatureY + 25 < doc.page.height - 70) {
          const signatureWidth = width / 3;
          ['Class Teacher', 'Principal', "Parent's Signature"].forEach((label, signatureIndex) => {
            const x = left + signatureIndex * signatureWidth + 8;
            doc.moveTo(x, signatureY).lineTo(x + signatureWidth - 16, signatureY)
              .lineWidth(0.7).strokeColor('#94a3b8').stroke();
            doc.fillColor(muted).font('Helvetica').fontSize(8)
              .text(label, x, signatureY + 7, { width: signatureWidth - 16, align: 'center' });
          });
        }

        const footer = String(template.footer_template || `Generated on ${new Date().toLocaleDateString()}`)
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        doc.font('Helvetica').fontSize(8).fillColor(muted)
          .text(footer, left, doc.page.height - 70, { width, align: 'center' });
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Download report card
 */
const downloadReportCard = async (req, res) => {
  try {
    const { reportId } = req.params;

    logger.info('Download report card request:', {
      reportId,
      user: req.user?.id,
      path: req.path,
      originalUrl: req.originalUrl
    });

    // Get school code for school-specific path
    // Structure: uploads/schools/{schoolCode}/{year}/report-cards/{filename}
    const schoolId = req.schoolId || req.user?.school_id;
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: 'School ID is required to download report card'
      });
    }

    const schoolCode = await getSchoolCodeFromId(schoolId);
    const year = getCurrentYear();
    const reportsDir = ensureSchoolUploadDir(schoolCode, 'report-cards', year);
    const fileName = `${reportId}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    logger.debug('Looking for file at:', filePath);

    // Check if file exists
    try {
      await fs.access(filePath);
      logger.debug('File found, sending...');
    } catch (error) {
      logger.error('File not found:', filePath, error);
      return res.status(404).json({
        success: false,
        message: 'Report card file not found',
        filePath: filePath
      });
    }

    // Set headers and send file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report-card-${reportId}.pdf"`);
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    logger.error('Error downloading report card:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download report card',
      error: error.message
    });
  }
};

/**
 * Tabulation sheet: one row per student with totals/grade/rank for an exam + class
 */
const getTabulationSheet = async (req, res) => {
  try {
    const { exam_id, class_id, section_id } = req.query;
    if (!exam_id || !class_id) {
      return res.status(400).json({
        success: false,
        message: 'Exam ID and Class ID are required'
      });
    }
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(String(exam_id)) || !uuidRe.test(String(class_id))) {
      return res.status(400).json({
        success: false,
        message: 'exam_id and class_id must be valid UUIDs'
      });
    }

    const studentWhere = {
      class_id,
      school_id: req.schoolId || req.user.school_id,
      status: { [Op.ne]: 'deleted' }
    };
    if (section_id) studentWhere.section_id = section_id;
    if (req.user.role === 'branch_admin') studentWhere.branch_id = req.user.branch_id;

    const students = await Student.findAll({
      where: studentWhere,
      include: [
        { model: Class, as: 'class', attributes: ['id', 'name'] },
        { model: Section, as: 'sectionInfo', attributes: ['id', 'name'], required: false }
      ],
      order: [
        ['roll_number', 'ASC'],
        ['first_name', 'ASC']
      ]
    });

    const results = await ExamResult.findAll({
      where: {
        exam_id,
        student_id: { [Op.in]: students.map(s => s.id) }
      }
    });
    const byStudent = {};
    results.forEach(r => {
      byStudent[r.student_id] = r;
    });

    const rows = students.map(student => {
      const result = byStudent[student.id];
      return {
        student_id: student.id,
        name: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
        admission_number: student.admission_number,
        roll_number: student.roll_number,
        class_name: student.class?.name,
        section_name: student.sectionInfo?.name,
        marks_obtained: result ? Number(result.marks_obtained) : null,
        percentage: result ? Number(result.percentage) : null,
        grade: result?.grade || null,
        rank: result?.rank || null,
        is_absent: result ? !!result.is_absent : false,
        theory_marks_obtained: result?.theory_marks_obtained ?? null,
        practical_marks_obtained: result?.practical_marks_obtained ?? null
      };
    });

    return res.json({
      success: true,
      message: 'Tabulation sheet loaded',
      data: { rows }
    });
  } catch (error) {
    logger.error('Error loading tabulation sheet:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load tabulation sheet',
      error: error.message
    });
  }
};

/**
 * Multi-exam progress: compare marks across selected exams for a class
 */
const getProgressReport = async (req, res) => {
  try {
    const { exam_ids, class_id, section_id } = req.query;
    if (!exam_ids || !class_id) {
      return res.status(400).json({
        success: false,
        message: 'exam_ids and class_id are required'
      });
    }

    const examIdList = String(exam_ids)
      .split(',')
      .map(id => id.trim())
      .filter(Boolean);

    if (examIdList.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'At least one exam is required'
      });
    }

    const exams = await Exam.findAll({
      where: { id: { [Op.in]: examIdList }, school_id: req.schoolId || req.user.school_id },
      attributes: ['id', 'name']
    });

    const studentWhere = {
      class_id,
      school_id: req.schoolId || req.user.school_id,
      status: { [Op.ne]: 'deleted' }
    };
    if (section_id) studentWhere.section_id = section_id;
    if (req.user.role === 'branch_admin') studentWhere.branch_id = req.user.branch_id;

    const students = await Student.findAll({
      where: studentWhere,
      attributes: ['id', 'first_name', 'last_name', 'admission_number', 'roll_number'],
      order: [['roll_number', 'ASC']]
    });

    const results = await ExamResult.findAll({
      where: {
        exam_id: { [Op.in]: examIdList },
        student_id: { [Op.in]: students.map(s => s.id) }
      }
    });

    const rows = students.map(student => {
      const examMarks = {};
      examIdList.forEach(examId => {
        const result = results.find(r => r.student_id === student.id && r.exam_id === examId);
        examMarks[examId] = result
          ? {
              marks_obtained: Number(result.marks_obtained),
              percentage: Number(result.percentage),
              grade: result.grade,
              is_absent: !!result.is_absent
            }
          : null;
      });
      return {
        student_id: student.id,
        name: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
        admission_number: student.admission_number,
        roll_number: student.roll_number,
        exam_marks: examMarks
      };
    });

    return res.json({
      success: true,
      message: 'Progress report loaded',
      data: { exams, rows }
    });
  } catch (error) {
    logger.error('Error loading progress report:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load progress report',
      error: error.message
    });
  }
};

module.exports = {
  getStudentsForReportCards,
  getReportCardTemplates,
  generateReportCards,
  getStudentReportCardArchives,
  downloadStudentReportCardArchive,
  downloadReportCard,
  getTabulationSheet,
  getProgressReport,
  sendReportCardEmails,
  generatePDFReportCard,
  getReportCardAttendance
};
