const httpStatus = require('http-status');
const { Op } = require('sequelize');
const ApiError = require('~/utils/ApiError');
const { logger } = require('~/utils/logger');
const { AttendanceSession, AttendanceRecord, Student, Parent, Class, Section } = require('~/models');
const { sendSMS } = require('~/utils/sms');
const attendanceExportService = require('~/services/attendance-export.service');
const AttendanceValidationService = require('~/services/attendance-validation.service');
const { sendEmail } = require('~/utils/email');

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
      remarks = null,
    } = req.body;

    if (!date || !class_id) {
      throw new ApiError(httpStatus.default.BAD_REQUEST, 'date and class_id are required');
    }

    const branchId = req.branchId || req.user.branch_id || req.body.branch_id;
    if (!branchId) {
      throw new ApiError(httpStatus.default.BAD_REQUEST, 'branch_id is required in context or body');
    }

    const [session, created] = await AttendanceSession.findOrCreate({
      where: {
        school_id: req.schoolId,
        branch_id: branchId,
        class_id,
        section_id: section_id || null,
        date,
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
        created_by: req.user.id,
      },
    });

    return res.status(created ? httpStatus.default.CREATED : httpStatus.default.OK).json({ success: true, data: session });
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

    const session = await AttendanceSession.findOne({ where: { id: session_id, school_id: req.schoolId } });
    if (!session) throw new ApiError(httpStatus.default.NOT_FOUND, 'Attendance session not found');

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
        await AttendanceValidationService.logAttendanceAction('edit_time_limit_violation', {
          session_id,
          user_id: req.user.id,
          error: editError.message
        }, settings);
        
        // Only throw error if enforcement is enabled and not in grace mode
        if (settings.attendanceSettings?.validationRules?.enforceEditTimeLimit === true) {
          throw new ApiError(400, '⚠️ This action is outside school policy. Your admin may review this change.');
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
        AttendanceValidationService.logAttendanceAction('validation_violation', {
          session_id,
          student_id: record.student_id,
          status: record.status,
          remarks: record.remarks,
          error: validationError.message
        }, settings);
        
        // Only throw error if enforcement is enabled and not in grace mode
        if (settings.attendanceSettings?.validationRules?.enforceRemarksForAbsent === true ||
            settings.attendanceSettings?.validationRules?.enforceRemarksForLate === true) {
          throw new ApiError(400, '⚠️ This action is outside school policy. Your admin may review this change.');
        }
      }
      
      return {
        ...record,
        status: record.status,
        remarks: record.remarks || ''
      };
    });

    // Bulk upsert attendance records
    await AttendanceRecord.bulkCreate(processedRecords.map(record => ({
      session_id: session_id,
      student_id: record.student_id,
      date: session.date, // Add the date from the session
      status: record.status,
      remarks: record.remarks,
      school_id: req.schoolId,
      branch_id: session.branch_id,
      class_id: session.class_id, // Add class_id from session
      section_id: session.section_id, // Add section_id from session
      created_by: req.user.id,
      updated_by: req.user.id
    })), {
      updateOnDuplicate: ['status', 'remarks', 'updated_by', 'updated_at']
    });

    // Update session status if publishing
    if (publish && session.status !== 'published') {
      await session.update({
        status: 'published',
        updated_by: req.user.id
      });
    }

    // Log successful attendance action
    await AttendanceValidationService.logAttendanceAction('attendance_saved', {
      session_id,
      records_count: processedRecords.length,
      published: publish,
      user_id: req.user.id
    }, settings);

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
    const session = await AttendanceSession.findOne({
      where: { id, school_id: req.schoolId },
      include: [{ model: AttendanceRecord, as: 'records' }],
    });
    if (!session) throw new ApiError(httpStatus.default.NOT_FOUND, 'Session not found');
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
    if (req.user.role === 'branch_admin') where.branch_id = req.user.branch_id; else if (req.branchId) where.branch_id = req.branchId;
    if (class_id) where.class_id = class_id;
    if (section_id) where.section_id = section_id;
    if (status) where.status = status;
    if (date_from && date_to) where.date = { [Op.between]: [date_from, date_to] };

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await AttendanceSession.findAndCountAll({ where, order: [['date', 'DESC']], limit: parseInt(limit), offset });
    return res.status(httpStatus.default.OK).json({ success: true, data: rows, pagination: { total: count, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    logger.error('Error listing attendance sessions:', error);
    return next(error);
  }
};

// Attendance reports
const getReport = async (req, res, next) => {
  try {
    const { report_type = 'daily', date, month, year, class_id, section_id, student_id, date_from, date_to, academic_year } = req.query;
    const whereRec = { school_id: req.schoolId };
    if (req.user.role === 'branch_admin') whereRec.branch_id = req.user.branch_id; else if (req.branchId) whereRec.branch_id = req.branchId;
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

    const records = await AttendanceRecord.findAll({ where: whereRec, include: [{ model: Student, as: 'student' }] });

    // Basic aggregation
    const summary = {
      total: records.length,
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      late: records.filter(r => r.status === 'late').length,
      excused: records.filter(r => r.status === 'excused').length,
    };

    return res.status(httpStatus.default.OK).json({ success: true, data: { records, summary } });
  } catch (error) {
    logger.error('Error generating attendance report:', error);
    return next(error);
  }
};

// Bulk import from CSV/Excel (expects pre-parsed rows sent by client)
const bulkImport = async (req, res, next) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows)) throw new ApiError(httpStatus.default.BAD_REQUEST, 'rows[] is required');

    let imported = 0;
    for (const row of rows) {
      const {
        date, class_id, section_id = null, student_id, status,
        attendance_type = 'daily', period_number = null,
      } = row;

      const branchId = req.branchId || req.user.branch_id || row.branch_id || req.body.branch_id;
      if (!branchId) continue;
      const [session] = await AttendanceSession.findOrCreate({
        where: { school_id: req.schoolId, branch_id: branchId, class_id, section_id: section_id || null, date, period_number },
        defaults: { attendance_type, created_by: req.user.id },
      });

      await AttendanceRecord.upsert({
        session_id: session.id,
        student_id,
        date,
        status,
        class_id,
        section_id,
        school_id: req.schoolId,
        branch_id: branchId,
        created_by: req.user.id,
        updated_by: req.user.id,
      });
      imported += 1;
    }

    return res.status(httpStatus.default.OK).json({ success: true, data: { imported } });
  } catch (error) {
    logger.error('Error in attendance bulk import:', error);
    return next(error);
  }
};

// Export attendance report (Excel/CSV)
const exportReport = async (req, res, next) => {
  try {
    const { format = 'xlsx' } = req.query;
    // Handle both old and new filtering approaches
    req.query.report_type = req.query.report_type || 'daily';
    const { report_type, date, month, year, class_id, section_id, student_id, date_from, date_to, academic_year } = req.query;
    const whereRec = { school_id: req.schoolId };
    if (req.user.role === 'branch_admin') whereRec.branch_id = req.user.branch_id; else if (req.branchId) whereRec.branch_id = req.branchId;
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
      student_name: `${r.student?.first_name || ''} ${r.student?.last_name || ''}`.trim(),
    }));

    const fileName = `attendance_${Date.now()}.${format === 'csv' ? 'csv' : 'xlsx'}`;

    if (format === 'csv') {
      const { stringify } = require('csv-stringify/sync');
      const csv = stringify(rows, { header: true });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.status(200).send(csv);
    }

    const XLSX = require('xlsx');
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
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

    const session = await AttendanceSession.findOne({ where: { id: session_id, school_id: req.schoolId } });
    if (!session) throw new ApiError(httpStatus.default.NOT_FOUND, 'Attendance session not found');

    const absentRecords = await AttendanceRecord.findAll({
      where: { session_id, status: 'absent' },
      include: [{ model: Student, as: 'student', include: [{ association: 'parents', through: { attributes: [] } }] }],
    });

    let notified = 0;
    for (const rec of absentRecords) {
      const student = rec.student;
      const parentList = (student && student.parents) ? student.parents : [];
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
        await sendSMS(phone, `Absence Alert: ${student.first_name} ${student.last_name || ''} was absent on ${rec.date}.`);
        notified += 1;
      }

      // Email (lazy import to avoid startup dependency when email config missing)
      if (contactEmails.length > 0) {
        for (const email of contactEmails) {
          await sendEmail({
            to: email,
            subject: 'Absence Notification',
            text: `Dear Parent/Guardian,\n\nThis is to inform you that ${student.first_name} ${student.last_name || ''} was marked absent on ${rec.date}.\n\nRegards,\nSchool Admin`,
          });
          notified += 1;
        }
      }
    }

    return res.status(httpStatus.default.OK).json({ success: true, data: { notified, count_absent: absentRecords.length } });
  } catch (error) {
    logger.error('Error notifying absentees:', error);
    return next(error);
  }
};

/**
 * Bulk import from uploaded Excel or CSV file
 * 
 * SUPPORTED FORMATS (in order of preference):
 * 1. PRIMARY: Excel (.xlsx, .xls) - Recommended for teachers
 * 2. SECONDARY: CSV (.csv) - For advanced users
 * 
 * REQUIRED COLUMNS:
 * - Date: Date of attendance (YYYY-MM-DD format)
 * - Class: Class name (will lookup class ID) OR ClassId: Direct class UUID
 * - AdmissionNumber: Student admission number OR StudentName: Student full name
 * - Status: present|absent|late|excused
 * 
 * OPTIONAL COLUMNS:
 * - Section: Section name OR SectionId: Direct section UUID  
 * - StudentName: Student full name (helpful for teachers)
 * - Type: daily|period (defaults to 'daily')
 * - PeriodNumber: Period number (required if Type is 'period')
 * - AcademicYear: Academic year (e.g., "2024-25")
 * - Remarks: Optional notes/comments
 * 
 * FEATURES:
 * - Smart lookup: Resolves class/section/student names to IDs automatically
 * - Flexible naming: Supports both human-readable and system column names
 * - Comprehensive validation: Detailed error reporting with row numbers
 * - Batch processing: Efficient handling of large files
 */
const bulkImportFile = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      throw new ApiError(httpStatus.default.BAD_REQUEST, 'Excel (.xlsx, .xls) or CSV (.csv) file is required');
    }

    const fileName = req.file.originalname.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isCsv = fileName.endsWith('.csv');

    logger.info(`Processing bulk import file: ${req.file.originalname}, Size: ${req.file.buffer.length} bytes, Type detected: ${isExcel ? 'Excel' : isCsv ? 'CSV' : 'Unknown'}`);

    if (!isExcel && !isCsv) {
      throw new ApiError(httpStatus.default.BAD_REQUEST, 'Only Excel (.xlsx, .xls) and CSV (.csv) files are supported. Excel is the preferred format.');
    }

    let rows = [];
    let errors = [];
    let totalRows = 0;

    try {
      if (isExcel) {
        // Handle Excel files (.xlsx, .xls) - Primary import format
        logger.info('Processing Excel file for attendance import');
        const XLSX = require('xlsx');
        
        try {
          const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
          
          if (!workbook.SheetNames.length) {
            throw new Error('Excel file contains no worksheets');
          }
          
          // Use the first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          logger.info(`Reading worksheet: ${firstSheetName}`);
          
          // Convert to JSON with header row
          const jsonRows = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,  // Use first row as headers
            defval: '', // Default value for empty cells
            raw: false, // Convert all values to strings for consistent processing
          });
          
          if (jsonRows.length < 2) {
            throw new ApiError(httpStatus.default.BAD_REQUEST, 'Excel file must have at least a header row and one data row');
          }

          // Get headers from first row
          const headers = jsonRows[0];
          logger.info(`Excel headers detected: ${headers.join(', ')}`);
          
          // Convert rows to objects using headers
          for (let i = 1; i < jsonRows.length; i++) {
            const row = {};
            headers.forEach((header, index) => {
              row[header] = jsonRows[i][index] || '';
            });
            
            // Skip empty rows
            if (Object.values(row).some(value => value && value.toString().trim())) {
              rows.push(row);
            }
          }
          
          totalRows = jsonRows.length - 1; // Exclude header row
          logger.info(`Processed ${totalRows} rows from Excel file, ${rows.length} non-empty rows`);
          
        } catch (xlsxError) {
          logger.error('Error processing Excel file:', xlsxError);
          throw new ApiError(httpStatus.default.BAD_REQUEST, `Failed to process Excel file: ${xlsxError.message}. Please ensure the file is a valid Excel format (.xlsx or .xls)`);
        }
      } else {
        // Handle CSV files
        const csv = require('csv-parser');
        const { Readable } = require('stream');
        const csvContent = req.file.buffer.toString('utf-8');
        
        await new Promise((resolve, reject) => {
          let rowCount = 0;
          Readable.from(csvContent)
            .pipe(csv())
            .on('data', (row) => {
              rowCount++;
              rows.push(row);
            })
            .on('end', () => {
              totalRows = rowCount;
              resolve();
            })
            .on('error', reject);
        });
      }

      if (rows.length === 0) {
        throw new ApiError(httpStatus.default.BAD_REQUEST, 'No valid data rows found in file');
      }

      logger.info(`Processing ${rows.length} rows from ${isExcel ? 'Excel' : 'CSV'} file`);

    } catch (parseError) {
      logger.error('Error parsing file:', parseError);
      throw new ApiError(httpStatus.default.BAD_REQUEST, `Error parsing file: ${parseError.message}`);
    }

    let imported = 0;
    let skipped = 0;

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        
        // Expected columns support both IDs and human-readable names
        const date = row.Date || row.date;
        const status = (row.Status || row.status || '').toString().toLowerCase();
        const attendance_type = (row.Type || row.attendance_type || 'daily').toString().toLowerCase();
        const period_number = row.PeriodNumber ? parseInt(row.PeriodNumber) : (row.period_number ? parseInt(row.period_number) : null);
        const remarks = row.Remarks || row.remarks || '';
        const academic_year = row.AcademicYear || row.academic_year || '';

        // Handle class identification (ID or Name)
        let class_id = row.ClassId || row.class_id;
        const class_name = row.ClassName || row.class_name || row.Class;
        
        // Handle section identification (ID or Name) 
        let section_id = row.SectionId || row.section_id || null;
        const section_name = row.SectionName || row.section_name || row.Section;
        
        // Handle student identification (ID, Admission Number, or Name)
        let student_id = row.StudentId || row.student_id;
        const admission_number = row.AdmissionNumber || row.admission_number || row.AdmissionNo;
        const student_name = row.StudentName || row.student_name;

        // Lookup IDs from human-readable names if IDs not provided
        try {
          // Get the correct branch_id (handle undefined case)
          const branchId = req.branchId || req.user.branch_id;
          
          // Lookup Class ID from Class Name
          if (!class_id && class_name) {
            const classWhere = { 
              name: class_name, 
              school_id: req.schoolId,
              is_active: true 
            };
            
            // Only add branch_id if it's defined
            if (branchId) {
              classWhere.branch_id = branchId;
            }
            
            const classRecord = await require('../../../models').Class.findOne({
              where: classWhere
            });
            if (classRecord) {
              class_id = classRecord.id;
            } else {
              throw new Error(`Class '${class_name}' not found`);
            }
          }

          // Lookup Section ID from Section Name
          if (!section_id && section_name) {
            const sectionWhere = { 
              name: section_name,
              school_id: req.schoolId,
              is_active: true
            };
            
            // Only add branch_id if it's defined
            if (branchId) {
              sectionWhere.branch_id = branchId;
            }
            
            const sectionRecord = await require('../../../models').Section.findOne({
              where: sectionWhere
            });
            if (sectionRecord) {
              section_id = sectionRecord.id;
            } else {
              throw new Error(`Section '${section_name}' not found`);
            }
          }

          // Lookup Student ID from Admission Number or Student Name
          if (!student_id && (admission_number || student_name)) {
            const studentWhere = {
              school_id: req.schoolId,
              is_active: true
            };
            
            // Only add branch_id if it's defined
            if (branchId) {
              studentWhere.branch_id = branchId;
            }
            
            if (admission_number) {
              studentWhere.admission_number = admission_number;
            } else if (student_name) {
              // Try to match by full name (first_name + last_name)
              const nameParts = student_name.trim().split(/\s+/);
              if (nameParts.length === 1) {
                studentWhere.first_name = nameParts[0];
              } else if (nameParts.length >= 2) {
                studentWhere.first_name = nameParts[0];
                studentWhere.last_name = nameParts.slice(1).join(' ');
              }
            }

            const studentRecord = await require('../../../models').Student.findOne({ where: studentWhere });
            if (studentRecord) {
              student_id = studentRecord.id;
            } else {
              const identifier = admission_number || student_name;
              throw new Error(`Student '${identifier}' not found`);
            }
          }
        } catch (lookupError) {
          errors.push({
            row: i + 2,
            message: `Lookup error: ${lookupError.message}`
          });
          skipped++;
          continue;
        }

        // Validate required fields (check original input OR resolved IDs)
        const hasClass = class_id || class_name;
        const hasStudent = student_id || admission_number || student_name;
        
        if (!date || !hasClass || !hasStudent || !status) {
          errors.push({
            row: i + 2, // +2 because row index starts at 0 and we have header
            message: 'Missing required fields: Date, Class (ID or Name), Student (ID, Admission Number, or Name), and Status are required'
          });
          skipped++;
          continue;
        }

        // At this point, class_id and student_id should be resolved from the lookup
        if (!class_id || !student_id) {
          // This shouldn't happen if lookup worked, but just in case
          errors.push({
            row: i + 2,
            message: 'Failed to resolve Class or Student IDs - check if the names exist in the system'
          });
          skipped++;
          continue;
        }

        // Validate status
        const validStatuses = ['present', 'absent', 'late', 'excused'];
        if (!validStatuses.includes(status)) {
          errors.push({
            row: i + 2,
            message: `Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}`
          });
          skipped++;
          continue;
        }

        // Validate attendance type
        const validTypes = ['daily', 'period'];
        if (attendance_type && !validTypes.includes(attendance_type)) {
          errors.push({
            row: i + 2,
            message: `Invalid type '${attendance_type}'. Must be 'daily' or 'period'`
          });
          skipped++;
          continue;
        }

        // Create or find session (use the same branchId from lookup)
        const branchId = req.branchId || req.user.branch_id;
        const [session] = await AttendanceSession.findOrCreate({
          where: { 
            school_id: req.schoolId, 
            branch_id: branchId, 
            class_id, 
            section_id: section_id || null, 
            date, 
            period_number: attendance_type === 'period' ? period_number : null 
          },
          defaults: { 
            attendance_type, 
            created_by: req.user.id,
            school_id: req.schoolId,
            branch_id: branchId,
            academic_year: academic_year || null,
          },
        });

        // Create or update attendance record
        await AttendanceRecord.upsert({
          session_id: session.id,
          student_id,
          date,
          status,
          remarks: remarks || null,
          class_id,
          section_id,
          school_id: req.schoolId,
          branch_id: branchId,
          created_by: req.user.id,
          updated_by: req.user.id,
        });

        imported++;
      } catch (rowError) {
        logger.error(`Error processing row ${i + 2}:`, rowError);
        errors.push({
          row: i + 2,
          message: rowError.message || 'Unknown error processing row'
        });
        skipped++;
      }
    }

    logger.info(`Bulk import completed: ${imported} imported, ${skipped} skipped, ${errors.length} errors`);

    return res.status(httpStatus.default.OK).json({ 
      success: true, 
      data: { 
        imported, 
        skipped,
        totalRows,
        errors: errors.slice(0, 50), // Limit errors to first 50 to avoid large responses
        summary: `Successfully imported ${imported} of ${totalRows} records. ${skipped} records were skipped due to errors.`
      } 
    });
  } catch (error) {
    logger.error('Error in attendance bulk import:', error);
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
    if (req.user.role === 'branch_admin') whereRec.branch_id = req.user.branch_id; else if (branchId) whereRec.branch_id = branchId;
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
      return next(new ApiError(httpStatus.default.BAD_REQUEST, 'date_from is required for PDF export'));
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
      order: [['date', 'ASC'], ['class_id', 'ASC'], ['section_id', 'ASC']]
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
      doc.fontSize(14).text('No attendance records found for the selected criteria.', { align: 'center' });
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
      doc.text(`Present: ${presentCount}, Absent: ${absentCount}, Late: ${lateCount}, Excused: ${excusedCount}`);
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
      
      records.forEach((record) => {
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
        const truncatedName = studentName.length > 16 ? studentName.substring(0, 13) + '...' : studentName;
        const truncatedRemarks = (record.remarks || '').length > 12 ? (record.remarks || '').substring(0, 9) + '...' : (record.remarks || '');
        
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
    
    const dateStr = date_from === date_to ? 
      date_from : 
      `${date_from}_to_${date_to || date_from}`;
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
      return next(new ApiError(httpStatus.default.BAD_REQUEST, 'date_from is required for Excel export'));
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
      academic_year: req.query.academic_year,
    };

    const workbook = await attendanceExportService.generateExcelReport(filters);
    
    const filename = `attendance-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    logger.error('Error exporting Excel report:', error);
    return next(new ApiError(httpStatus.default.INTERNAL_SERVER_ERROR, error.message));
  }
};

// Generate attendance import template with actual student data
// Primary format: Excel (.xlsx) - Recommended for teachers
// Secondary format: CSV (.csv) - For advanced users
// Template includes all students from specified class/section with pre-filled data
const generateImportTemplate = async (req, res, next) => {
  try {
    const { class_id, section_id, date, academic_year, format = 'xlsx' } = req.query; // Excel is default format
    const branchId = req.branchId || req.user.branch_id;
    
    if (!class_id) {
      return next(new ApiError(httpStatus.default.BAD_REQUEST, 'class_id is required'));
    }
    
    if (!date) {
      return next(new ApiError(httpStatus.default.BAD_REQUEST, 'date is required'));
    }
    
    // Get students from the specified class and section
    const studentWhere = {
      school_id: req.schoolId,
      class_id,
      is_active: true
    };
    
    if (branchId) studentWhere.branch_id = branchId;
    if (section_id) studentWhere.section_id = section_id;
    
    const students = await Student.findAll({
      where: studentWhere,
      include: [
        { model: Class, as: 'class', attributes: ['name'] },
        { model: Section, as: 'section', attributes: ['name'] }
      ],
      order: [['admission_number', 'ASC']]
    });
    
    if (students.length === 0) {
      return next(new ApiError(httpStatus.default.BAD_REQUEST, 'No students found for the specified class/section'));
    }
    
    // Generate template rows
    const rows = students.map(student => ({
      Date: date,
      Class: student.class?.name || '',
      Section: student.section?.name || '',
      AdmissionNumber: student.admission_number,
      StudentName: `${student.first_name} ${student.last_name || ''}`.trim(),
      Status: 'present', // Default status
      Type: 'daily',
      PeriodNumber: '',
      AcademicYear: academic_year || '',
      Remarks: ''
    }));
    
    const fileExtension = format === 'csv' ? 'csv' : 'xlsx';
    const fileName = `attendance-template-${students[0].class?.name || 'class'}-${date}.${fileExtension}`;
    
    if (format === 'csv') {
      // CSV format (secondary option)
      const { stringify } = require('csv-stringify/sync');
      const csv = stringify(rows, { header: true });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.status(200).send(csv);
    } else {
      // Excel format (primary/default option)
      const XLSX = require('xlsx');
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance Template');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.status(200).send(buf);
    }
  } catch (error) {
    logger.error('Error generating import template:', error);
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
      attendance_type: req.query.attendance_type,
    };

    const summary = await attendanceExportService.generateSummaryData(filters);
    
    return res.status(httpStatus.default.OK).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    logger.error('Error getting attendance summary:', error);
    return next(new ApiError(httpStatus.default.INTERNAL_SERVER_ERROR, error.message));
  }
};

module.exports = {
  upsertSession,
  saveRecords,
  getSession,
  listSessions,
  getReport,
  bulkImport,
  notifyAbsentees,
  exportReport,
  bulkImportFile,
  exportPDFReport,
  exportExcelReport,
  getSummary,
  generateImportTemplate,
};


