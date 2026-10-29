const httpStatus = require('http-status');
const { Op, fn, col } = require('sequelize');
const ApiError = require('~/utils/shared/ApiError');
const { logger } = require('~/utils/shared/logger');
const {
  AttendanceSession,
  AttendanceRecord,
  Student,
  Parent,
  Class,
  Section,
  ClassTeacher,
  SubjectTeacher
} = require('~/models');
const { sendSMS, formatPhoneNumber } = require('~/utils/communication/sms');
const attendanceExportService = require('~/services/academic/attendance-export.service');
const AttendanceValidationService = require('~/services/academic/attendance-validation.service');
const { sendEmail } = require('~/utils/communication/email');

const getTeacherAssignments = async (teacherId, schoolId) => {
  const [classAssignments, subjectAssignments] = await Promise.all([
    ClassTeacher.findAll({
      where: { teacher_id: teacherId, school_id: schoolId, is_active: true },
      attributes: ['class_id', 'section_id', 'stream_id', 'branch_id', 'academic_year']
    }),
    SubjectTeacher.findAll({
      where: { teacher_id: teacherId, school_id: schoolId },
      attributes: ['class_id', 'section_id', 'stream_id', 'branch_id', 'academic_year']
    })
  ]);

  return [...classAssignments, ...subjectAssignments].filter(
    assignment => assignment.class_id && assignment.branch_id && assignment.academic_year
  );
};

const assertTeacherAssignment = async (req, target) => {
  if (req.user.role !== 'teacher') return;

  const assignments = await getTeacherAssignments(req.user.id, req.schoolId);
  const assigned = assignments.some(
    assignment =>
      assignment.class_id === target.class_id &&
      assignment.branch_id === target.branch_id &&
      assignment.academic_year === target.academic_year &&
      (!assignment.section_id || assignment.section_id === (target.section_id || null)) &&
      (!assignment.stream_id || assignment.stream_id === (target.stream_id || null))
  );

  if (!assigned)
    throw new ApiError(httpStatus.default.FORBIDDEN, 'Class is not assigned to this teacher');
};

const teacherAssignmentWhere = async req => {
  if (req.user.role !== 'teacher') return null;

  const assignments = await getTeacherAssignments(req.user.id, req.schoolId);
  return assignments
    .filter(assignment => !req.branchId || assignment.branch_id === req.branchId)
    .map(({ class_id, section_id, stream_id, branch_id, academic_year }) => ({
      class_id,
      branch_id,
      academic_year,
      ...(section_id && { section_id }),
      ...(stream_id && { stream_id })
    }));
};

// Create or get an attendance session for a class/section/date/period
const upsertSession = async (req, res, next) => {
  try {
    const {
      date,
      attendance_type = 'daily',
      subject_id = null,
      class_id,
      section_id = null,
      stream_id = null,
      academic_year = null,
      remarks = null
    } = req.body;

    if (!date || !class_id) {
      throw new ApiError(httpStatus.default.BAD_REQUEST, 'date and class_id are required');
    }

    const branchId = req.branchId || req.user.branch_id || req.body.branch_id;
    if (!branchId) {
      throw new ApiError(
        httpStatus.default.BAD_REQUEST,
        'branch_id is required in context or body'
      );
    }

    const classRecord = await Class.findOne({
      where: { id: class_id, school_id: req.schoolId, branch_id: branchId }
    });
    if (!classRecord)
      throw new ApiError(httpStatus.default.NOT_FOUND, 'Class not found in this branch');

    if (section_id) {
      const sectionRecord = await Section.findOne({
        where: { id: section_id, class_id, school_id: req.schoolId, branch_id: branchId }
      });
      if (!sectionRecord)
        throw new ApiError(httpStatus.default.NOT_FOUND, 'Section not found in this class');
    }

    await assertTeacherAssignment(req, {
      class_id,
      section_id,
      stream_id,
      branch_id: branchId,
      academic_year
    });

    const [session, created] = await AttendanceSession.findOrCreate({
      where: {
        school_id: req.schoolId,
        branch_id: branchId,
        class_id,
        section_id: section_id || null,
        date
      },
      defaults: {
        attendance_type,
        academic_year,
        remarks,
        status: 'draft',
        stream_id: stream_id || null,
        subject_id: subject_id || null,
        branch_id: branchId,
        school_id: req.schoolId,
        created_by: req.user.id
      }
    });

    return res
      .status(created ? httpStatus.default.CREATED : httpStatus.default.OK)
      .json({ success: true, data: session });
  } catch (error) {
    logger.error('Error upserting attendance session:', error);
    return next(error);
  }
};

// Save attendance records for a session
const saveRecords = async (req, res, next) => {
  try {
    const { session_id, records, publish } = req.body;
    if (!session_id || !Array.isArray(records)) {
      throw new ApiError(httpStatus.default.BAD_REQUEST, 'session_id and records[] are required');
    }

    const sessionWhere = { id: session_id, school_id: req.schoolId };
    if (req.branchId) sessionWhere.branch_id = req.branchId;
    const session = await AttendanceSession.findOne({ where: sessionWhere });
    if (!session) throw new ApiError(httpStatus.default.NOT_FOUND, 'Attendance session not found');

    await assertTeacherAssignment(req, session);

    const studentIds = records.map(record => record.student_id);
    const uniqueStudentIds = [...new Set(studentIds)];
    if (uniqueStudentIds.length !== records.length || uniqueStudentIds.some(id => !id)) {
      throw new ApiError(
        httpStatus.default.BAD_REQUEST,
        'Attendance records must contain unique student IDs'
      );
    }
    const students = await Student.findAll({
      where: {
        id: { [Op.in]: uniqueStudentIds },
        school_id: req.schoolId,
        branch_id: session.branch_id,
        class_id: session.class_id,
        section_id: session.section_id,
        stream_id: session.stream_id
      },
      attributes: ['id']
    });
    if (students.length !== uniqueStudentIds.length) {
      throw new ApiError(
        httpStatus.default.FORBIDDEN,
        'Attendance includes a student outside this class'
      );
    }

    // Use comprehensive validation service with soft enforcement
    const settings = await AttendanceValidationService.validateAttendanceSubmission(
      req.schoolId,
      session.date,
      records,
      publish
    );

    // Check edit time limit for published sessions (soft enforcement with grace mode)
    if (session.status === 'published') {
      try {
        await AttendanceValidationService.validateWithGraceMode(
          AttendanceValidationService.validateEditTimeLimit,
          'editTimeLimit',
          session.date,
          settings
        );
      } catch (editError) {
        // Log the violation but don't block if enforcement is disabled
        await AttendanceValidationService.logAttendanceAction(
          'edit_time_limit_violation',
          {
            session_id,
            user_id: req.user.id,
            error: editError.message
          },
          settings
        );

        // Only throw error if enforcement is enabled and not in grace mode
        if (settings.attendanceSettings?.validationRules?.enforceEditTimeLimit === true) {
          throw new ApiError(
            400,
            '⚠️ This action is outside school policy. Your admin may review this change.'
          );
        }
      }
    }

    // Process attendance records with soft validation and grace mode
    const processedRecords = records.map(record => {
      try {
        // Validate attendance status
        AttendanceValidationService.validateAttendanceStatus(
          record.status,
          record.remarks,
          settings
        );
      } catch (validationError) {
        // Log validation violations
        AttendanceValidationService.logAttendanceAction(
          'validation_violation',
          {
            session_id,
            student_id: record.student_id,
            status: record.status,
            remarks: record.remarks,
            error: validationError.message
          },
          settings
        );

        // Only throw error if enforcement is enabled and not in grace mode
        if (
          settings.attendanceSettings?.validationRules?.enforceRemarksForAbsent === true ||
          settings.attendanceSettings?.validationRules?.enforceRemarksForLate === true
        ) {
          throw new ApiError(
            400,
            '⚠️ This action is outside school policy. Your admin may review this change.'
          );
        }
      }

      return {
        ...record,
        status: record.status,
        remarks: record.remarks || ''
      };
    });

    // Use bulkCreate with proper unique constraint handling
    await AttendanceRecord.bulkCreate(
      processedRecords.map(record => ({
        session_id: session_id,
        student_id: record.student_id,
        date: session.date,
        status: record.status,
        remarks: record.remarks,
        school_id: req.schoolId,
        branch_id: session.branch_id,
        class_id: session.class_id,
        section_id: session.section_id,
        created_by: req.user.id,
        updated_by: req.user.id
      })),
      {
        updateOnDuplicate: ['status', 'remarks', 'updated_by', 'updated_at'],
        ignoreDuplicates: false
      }
    );

    // Update session status if publishing
    if (publish && session.status !== 'published') {
      await session.update({
        status: 'published',
        updated_by: req.user.id
      });
    }

    // Log successful attendance action
    await AttendanceValidationService.logAttendanceAction(
      'attendance_saved',
      {
        session_id,
        records_count: processedRecords.length,
        published: publish,
        user_id: req.user.id
      },
      settings
    );

    return res.status(httpStatus.default.OK).json({
      success: true,
      message: publish ? 'Attendance published successfully' : 'Attendance saved successfully',
      data: { session_id, records_count: processedRecords.length }
    });
  } catch (error) {
    logger.error('Error saving attendance records:', error);
    return next(error);
  }
};

// Get attendance for a session
const getSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const where = { id, school_id: req.schoolId };
    if (req.branchId) where.branch_id = req.branchId;
    const session = await AttendanceSession.findOne({
      where,
      include: [{ model: AttendanceRecord, as: 'records' }]
    });
    if (!session) throw new ApiError(httpStatus.default.NOT_FOUND, 'Session not found');
    await assertTeacherAssignment(req, session);
    return res.status(httpStatus.default.OK).json({ success: true, data: session });
  } catch (error) {
    logger.error('Error getting attendance session:', error);
    return next(error);
  }
};

// List sessions by filters
const listSessions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, date_from, date_to, class_id, section_id, status } = req.query;
    const where = { school_id: req.schoolId };
    if (req.user.role === 'branch_admin') where.branch_id = req.user.branch_id;
    else if (req.branchId) where.branch_id = req.branchId;
    if (class_id) where.class_id = class_id;
    if (section_id) where.section_id = section_id;
    if (status) where.status = status;
    if (date_from && date_to) where.date = { [Op.between]: [date_from, date_to] };
    if (req.user.role === 'teacher') {
      const assignments = await teacherAssignmentWhere(req);
      where[Op.or] = assignments.length ? assignments : [{ id: { [Op.is]: null } }];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await AttendanceSession.findAndCountAll({
      where,
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    return res.status(httpStatus.default.OK).json({
      success: true,
      data: rows,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (error) {
    logger.error('Error listing attendance sessions:', error);
    return next(error);
  }
};

// Attendance reports
const getReport = async (req, res, next) => {
  try {
    const {
      report_type = 'daily',
      date,
      month,
      year,
      class_id,
      section_id,
      student_id,
      date_from,
      date_to,
      academic_year,
      branch_id,
      page = 1,
      limit = 10,
      export_all = false
    } = req.query;

    const whereRec = { school_id: req.schoolId };

    // Handle branch filtering
    if (req.user.role === 'branch_admin') {
      whereRec.branch_id = req.user.branch_id;
    } else if (req.branchId) {
      whereRec.branch_id = req.branchId;
    } else if (branch_id) {
      whereRec.branch_id = branch_id;
    }

    // Add other filters
    if (class_id) whereRec.class_id = class_id;
    if (section_id) whereRec.section_id = section_id;
    if (student_id) whereRec.student_id = student_id;
    if (academic_year) whereRec.academic_year = academic_year;

    // Enhanced date filtering logic
    if (date_from && date_to) {
      // Date range filtering
      whereRec.date = { [Op.between]: [date_from, date_to] };
    } else if (date_from) {
      // From date only - if no date_to, look for records from date_from onwards
      whereRec.date = { [Op.gte]: date_from };
    } else if (report_type === 'daily' && date) {
      // Single date
      whereRec.date = date;
    } else if (report_type === 'monthly' && month && year) {
      // Monthly filtering
      const start = `${year}-${String(month).padStart(2, '0')}-01`;
      const end = `${year}-${String(month).padStart(2, '0')}-31`;
      whereRec.date = { [Op.between]: [start, end] };
    } else {
      // If no date filters provided, get recent records (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      whereRec.date = { [Op.gte]: thirtyDaysAgo.toISOString().split('T')[0] };
    }

    // Aggregate across the full filter before applying the page limit.
    const statusCounts = await AttendanceRecord.count({ where: whereRec, group: ['status'] });
    const countsByStatus = Object.fromEntries(
      statusCounts.map(({ status, count }) => [status, Number(count)])
    );
    const totalRecords = statusCounts.reduce((total, row) => total + Number(row.count), 0);

    // Calculate pagination
    const currentPage = parseInt(page);
    const pageSize = parseInt(limit);
    const totalPages = Math.ceil(totalRecords / pageSize);
    const offset = (currentPage - 1) * pageSize;

    // Build query options
    const queryOptions = {
      where: whereRec,
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'first_name', 'last_name', 'admission_number', 'email', 'phone']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Section,
          as: 'section',
          attributes: ['id', 'name']
        }
      ],
      order: [
        ['date', 'DESC'],
        ['created_at', 'DESC']
      ]
    };

    // Add pagination if not exporting all
    if (!export_all) {
      queryOptions.limit = pageSize;
      queryOptions.offset = offset;
    }

    // Get records with proper includes
    const records = await AttendanceRecord.findAll(queryOptions);

    const summary = {
      total: totalRecords,
      present: countsByStatus.present || 0,
      absent: countsByStatus.absent || 0,
      late: countsByStatus.late || 0,
      excused: countsByStatus.excused || 0
    };

    // Prepare response data
    const paginationData = {
      current_page: currentPage,
      total_pages: totalPages,
      total_records: totalRecords,
      per_page: pageSize,
      has_next_page: currentPage < totalPages,
      has_prev_page: currentPage > 1
    };

    const responseData = {
      records,
      summary,
      pagination: paginationData
    };

    return res.status(httpStatus.default.OK).json({
      success: true,
      data: responseData,
      filters: {
        date_from,
        date_to,
        branch_id: whereRec.branch_id,
        class_id,
        section_id,
        academic_year
      }
    });
  } catch (error) {
    logger.error('Error generating attendance report:', error);
    return next(error);
  }
};

// Export attendance report (Excel/CSV)
const exportReport = async (req, res, next) => {
  try {
    const { format = 'xlsx' } = req.query;
    // Handle both old and new filtering approaches
    req.query.report_type = req.query.report_type || 'daily';
    const {
      report_type,
      date,
      month,
      year,
      class_id,
      section_id,
      student_id,
      date_from,
      date_to,
      academic_year
    } = req.query;
    const whereRec = { school_id: req.schoolId };
    if (req.user.role === 'branch_admin') whereRec.branch_id = req.user.branch_id;
    else if (req.branchId) whereRec.branch_id = req.branchId;
    if (class_id) whereRec.class_id = class_id;
    if (section_id) whereRec.section_id = section_id;
    if (student_id) whereRec.student_id = student_id;
    if (academic_year) whereRec.academic_year = academic_year;

    // Enhanced date filtering logic
    if (date_from && date_to) {
      // Date range filtering
      whereRec.date = { [Op.between]: [date_from, date_to] };
    } else if (date_from) {
      // From date only
      whereRec.date = { [Op.gte]: date_from };
    } else if (report_type === 'daily' && date) {
      // Single date
      whereRec.date = date;
    } else if (report_type === 'monthly' && month && year) {
      // Monthly filtering
      const start = `${year}-${String(month).padStart(2, '0')}-01`;
      const end = `${year}-${String(month).padStart(2, '0')}-31`;
      whereRec.date = { [Op.between]: [start, end] };
    }

    // Remove academic_year from AttendanceRecord where clause since it's in AttendanceSession
    const recordWhereClause = { ...whereRec };
    const sessionWhereClause = {};
    if (academic_year) {
      sessionWhereClause.academic_year = academic_year;
      delete recordWhereClause.academic_year;
    }

    const includes = [
      { model: Student, as: 'student' },
      { model: Class, as: 'class' },
      { model: Section, as: 'section' }
    ];

    // Add session include if we need to filter by academic_year
    if (academic_year) {
      includes.push({
        model: AttendanceSession,
        as: 'session',
        where: sessionWhereClause
      });
    }

    const records = await AttendanceRecord.findAll({
      where: recordWhereClause,
      include: includes
    });
    const rows = records.map(r => ({
      date: r.date,
      class: r.class?.name || '',
      section: r.section?.name || '',
      status: r.status,
      remarks: r.remarks || '',
      admission_number: r.student?.admission_number || '',
      student_name: `${r.student?.first_name || ''} ${r.student?.last_name || ''}`.trim()
    }));

    const fileName = `attendance_${Date.now()}.${format === 'csv' ? 'csv' : 'xlsx'}`;

    if (format === 'csv') {
      const Papa = require('papaparse');
      const csv = Papa.unparse(rows, { header: true });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.status(200).send(csv);
    }

    const XLSX = require('xlsx');
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.status(200).send(buf);
  } catch (error) {
    logger.error('Error exporting attendance report:', error);
    return next(error);
  }
};

// Notify absentees via SMS/Email for a session
const notifyAbsentees = async (req, res, next) => {
  try {
    const { session_id } = req.body;
    if (!session_id) throw new ApiError(httpStatus.default.BAD_REQUEST, 'session_id is required');

    const sessionWhere = { id: session_id, school_id: req.schoolId };
    if (req.branchId) sessionWhere.branch_id = req.branchId;
    const session = await AttendanceSession.findOne({ where: sessionWhere });
    if (!session) throw new ApiError(httpStatus.default.NOT_FOUND, 'Attendance session not found');
    if (session.status !== 'published') {
      throw new ApiError(httpStatus.default.BAD_REQUEST, 'Attendance must be published before notifying parents');
    }

    const absentRecords = await AttendanceRecord.findAll({
      where: {
        session_id,
        school_id: req.schoolId,
        branch_id: session.branch_id,
        status: 'absent'
      },
      include: [
        {
          model: Student,
          as: 'student',
          include: [{ association: 'parents', through: { attributes: [] } }]
        }
      ]
    });

    let notified = 0;
    for (const rec of absentRecords) {
      const student = rec.student;
      const parentList = student && student.parents ? student.parents : [];
      const contactPhones = [];
      const contactEmails = [];

      parentList.forEach(p => {
        if (p.guardian_phone) contactPhones.push(p.guardian_phone);
        if (p.father_phone) contactPhones.push(p.father_phone);
        if (p.mother_phone) contactPhones.push(p.mother_phone);
        if (p.guardian_email) contactEmails.push(p.guardian_email);
        if (p.father_email) contactEmails.push(p.father_email);
        if (p.mother_email) contactEmails.push(p.mother_email);
      });

      // SMS
      for (const phone of contactPhones) {
        await sendSMS({
          to: formatPhoneNumber(phone),
          message: `Absence Alert: ${student.first_name} ${student.last_name || ''} was absent on ${rec.date}.`
        });
        notified += 1;
      }

      // Email (lazy import to avoid startup dependency when email config missing)
      if (contactEmails.length > 0) {
        for (const email of contactEmails) {
          await sendEmail({
            to: email,
            subject: 'Absence Notification',
            text: `Dear Parent/Guardian,\n\nThis is to inform you that ${student.first_name} ${student.last_name || ''} was marked absent on ${rec.date}.\n\nRegards,\nAdmin`
          });
          notified += 1;
        }
      }
    }

    return res
      .status(httpStatus.default.OK)
      .json({ success: true, data: { notified, count_absent: absentRecords.length } });
  } catch (error) {
    logger.error('Error notifying absentees:', error);
    return next(error);
  }
};

// Export attendance report as PDF
const exportPDFReport = async (req, res, next) => {
  try {
    const PDFDocument = require('pdfkit');
    const branchId = req.branchId || req.user.branch_id;

    // Use the same filtering logic as Excel export
    const { class_id, section_id, student_id, date_from, date_to, academic_year } = req.query;
    const whereRec = { school_id: req.schoolId };
    if (req.user.role === 'branch_admin') whereRec.branch_id = req.user.branch_id;
    else if (branchId) whereRec.branch_id = branchId;
    if (class_id) whereRec.class_id = class_id;
    if (section_id) whereRec.section_id = section_id;
    if (student_id) whereRec.student_id = student_id;
    if (academic_year) whereRec.academic_year = academic_year;

    // Enhanced date filtering logic (same as Excel export)
    if (date_from && date_to) {
      // Date range filtering
      whereRec.date = { [Op.between]: [date_from, date_to] };
    } else if (date_from) {
      // From date only
      whereRec.date = { [Op.gte]: date_from };
    }

    // Validate required filters for PDF export
    if (!date_from) {
      return next(
        new ApiError(httpStatus.default.BAD_REQUEST, 'date_from is required for PDF export')
      );
    }

    // Remove academic_year from AttendanceRecord where clause since it's in AttendanceSession
    const recordWhereClause = { ...whereRec };
    const sessionWhereClause = {};
    if (academic_year) {
      sessionWhereClause.academic_year = academic_year;
      delete recordWhereClause.academic_year;
    }

    const includes = [
      { model: Student, as: 'student' },
      { model: Class, as: 'class' },
      { model: Section, as: 'section' }
    ];

    // Add session include if we need to filter by academic_year
    if (academic_year) {
      includes.push({
        model: AttendanceSession,
        as: 'session',
        where: sessionWhereClause
      });
    }

    const records = await AttendanceRecord.findAll({
      where: recordWhereClause,
      include: includes,
      order: [
        ['date', 'ASC'],
        ['class_id', 'ASC'],
        ['section_id', 'ASC']
      ]
    });

    // Generate PDF
    const doc = new PDFDocument({ margin: 50 });

    // Header
    doc.fontSize(18).text('Attendance Report', { align: 'center' });
    doc.moveDown();

    // Report details
    doc.fontSize(12);
    const reportDate = new Date().toLocaleDateString();
    doc.text(`Generated on: ${reportDate}`, { align: 'right' });

    if (date_from && date_to) {
      doc.text(`Period: ${date_from} to ${date_to}`, { align: 'right' });
    } else if (date_from) {
      doc.text(`From: ${date_from}`, { align: 'right' });
    }

    if (records.length > 0 && records[0].class) {
      doc.text(`Class: ${records[0].class.name}`, { align: 'right' });
    }

    if (records.length > 0 && records[0].section) {
      doc.text(`Section: ${records[0].section.name}`, { align: 'right' });
    }

    if (academic_year) {
      doc.text(`Academic Year: ${academic_year}`, { align: 'right' });
    }

    doc.moveDown();

    if (records.length === 0) {
      doc
        .fontSize(14)
        .text('No attendance records found for the selected criteria.', { align: 'center' });
      doc.moveDown();
    } else {
      // Summary
      const totalRecords = records.length;
      const presentCount = records.filter(r => r.status === 'present').length;
      const absentCount = records.filter(r => r.status === 'absent').length;
      const lateCount = records.filter(r => r.status === 'late').length;
      const excusedCount = records.filter(r => r.status === 'excused').length;

      doc.fontSize(14).text('Summary', { underline: true });
      doc.fontSize(12);
      doc.text(`Total Records: ${totalRecords}`);
      doc.text(
        `Present: ${presentCount}, Absent: ${absentCount}, Late: ${lateCount}, Excused: ${excusedCount}`
      );
      doc.moveDown();

      // Table headers
      let currentY = doc.y;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Date', 50, currentY, { width: 70 });
      doc.text('Class', 120, currentY, { width: 60 });
      doc.text('Section', 180, currentY, { width: 60 });
      doc.text('Admission No.', 240, currentY, { width: 80 });
      doc.text('Student Name', 320, currentY, { width: 120 });
      doc.text('Status', 440, currentY, { width: 60 });
      doc.text('Remarks', 500, currentY, { width: 80 });

      currentY += 15;
      doc.moveTo(50, currentY).lineTo(580, currentY).stroke();
      currentY += 5;

      doc.fontSize(9).font('Helvetica');

      records.forEach(record => {
        const student = record.student;
        const studentName = `${student.first_name} ${student.last_name || ''}`.trim();

        // Check if we need a new page
        if (currentY > 720) {
          doc.addPage();
          currentY = 50;

          // Repeat headers on new page
          doc.fontSize(10).font('Helvetica-Bold');
          doc.text('Date', 50, currentY, { width: 70 });
          doc.text('Class', 120, currentY, { width: 60 });
          doc.text('Section', 180, currentY, { width: 60 });
          doc.text('Admission No.', 240, currentY, { width: 80 });
          doc.text('Student Name', 320, currentY, { width: 120 });
          doc.text('Status', 440, currentY, { width: 60 });
          doc.text('Remarks', 500, currentY, { width: 80 });

          currentY += 15;
          doc.moveTo(50, currentY).lineTo(580, currentY).stroke();
          currentY += 5;
          doc.fontSize(9).font('Helvetica');
        }

        // Truncate long text to prevent overlapping
        const truncatedName =
          studentName.length > 16 ? studentName.substring(0, 13) + '...' : studentName;
        const truncatedRemarks =
          (record.remarks || '').length > 12
            ? (record.remarks || '').substring(0, 9) + '...'
            : record.remarks || '';

        doc.text(record.date, 50, currentY, { width: 65, ellipsis: true });
        doc.text(record.class?.name || '', 120, currentY, { width: 55, ellipsis: true });
        doc.text(record.section?.name || '', 180, currentY, { width: 55, ellipsis: true });
        doc.text(student.admission_number || '', 240, currentY, { width: 75, ellipsis: true });
        doc.text(truncatedName, 320, currentY, { width: 115, ellipsis: true });
        doc.text(record.status.toUpperCase(), 440, currentY, { width: 55, ellipsis: true });
        doc.text(truncatedRemarks, 500, currentY, { width: 75, ellipsis: true });

        currentY += 12; // Consistent row height
      });
    }

    const dateStr = date_from === date_to ? date_from : `${date_from}_to_${date_to || date_from}`;
    const filename = `attendance-report-${dateStr}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Simple pipe approach
    doc.pipe(res);
    doc.end();
  } catch (error) {
    logger.error('Error exporting PDF report:', error);
    return next(new ApiError(httpStatus.default.INTERNAL_SERVER_ERROR, error.message));
  }
};

// Export attendance report as Excel
const exportExcelReport = async (req, res, next) => {
  try {
    const branchId = req.branchId || req.user.branch_id;
    // Validate required filters for Excel export
    if (!req.query.date_from) {
      return next(
        new ApiError(httpStatus.default.BAD_REQUEST, 'date_from is required for Excel export')
      );
    }

    const filters = {
      school_id: req.schoolId,
      branch_id: branchId,
      class_id: req.query.class_id,
      section_id: req.query.section_id,
      subject_id: req.query.subject_id,
      date_from: req.query.date_from,
      date_to: req.query.date_to || req.query.date_from, // If no date_to provided, use date_from (single day report)
      attendance_type: req.query.attendance_type,
      academic_year: req.query.academic_year
    };

    const workbook = await attendanceExportService.generateExcelReport(filters);

    const filename = `attendance-report-${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    logger.error('Error exporting Excel report:', error);
    return next(new ApiError(httpStatus.default.INTERNAL_SERVER_ERROR, error.message));
  }
};

// Get attendance summary data
const getSummary = async (req, res, next) => {
  try {
    const branchId = req.branchId || req.user.branch_id;
    const filters = {
      school_id: req.schoolId,
      branch_id: branchId,
      class_id: req.query.class_id,
      section_id: req.query.section_id,
      subject_id: req.query.subject_id,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      attendance_type: req.query.attendance_type
    };

    const summary = await attendanceExportService.generateSummaryData(filters);

    return res.status(httpStatus.default.OK).json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Error getting attendance summary:', error);
    return next(new ApiError(httpStatus.default.INTERNAL_SERVER_ERROR, error.message));
  }
};

// Debug endpoint to check attendance data
const debugAttendanceData = async (req, res, next) => {
  try {
    const { branch_id } = req.query;

    // Get basic counts
    const totalRecords = await AttendanceRecord.count({
      where: { school_id: req.schoolId }
    });

    const branchRecords = await AttendanceRecord.count({
      where: {
        school_id: req.schoolId,
        branch_id: branch_id || req.branchId
      }
    });

    // Get recent records
    const recentRecords = await AttendanceRecord.findAll({
      where: {
        school_id: req.schoolId,
        branch_id: branch_id || req.branchId
      },
      include: [
        { model: Student, as: 'student', attributes: ['first_name', 'last_name'] },
        { model: Class, as: 'class', attributes: ['name'] }
      ],
      order: [['date', 'DESC']],
      limit: 5
    });

    // Get date range of existing data
    const dateRange = await AttendanceRecord.findAll({
      where: {
        school_id: req.schoolId,
        branch_id: branch_id || req.branchId
      },
      attributes: [
        [fn('MIN', col('date')), 'earliest_date'],
        [fn('MAX', col('date')), 'latest_date']
      ],
      raw: true
    });

    return res.status(200).json({
      success: true,
      debug: {
        totalRecordsInSchool: totalRecords,
        totalRecordsInBranch: branchRecords,
        recentRecords: recentRecords.map(r => ({
          id: r.id,
          date: r.date,
          status: r.status,
          student: r.student ? `${r.student.first_name} ${r.student.last_name}` : 'N/A',
          class: r.class?.name || 'N/A'
        })),
        dateRange: dateRange[0] || { earliest_date: null, latest_date: null },
        queryParams: req.query
      }
    });
  } catch (error) {
    logger.error('Error in debug endpoint:', error);
    return next(error);
  }
};

module.exports = {
  upsertSession,
  saveRecords,
  getSession,
  listSessions,
  getReport,
  notifyAbsentees,
  exportReport,
  exportPDFReport,
  exportExcelReport,
  getSummary,
  debugAttendanceData
};
