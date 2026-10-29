const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Papa = require('papaparse');
const fs = require('fs');
const os = require('os');
const path = require('path');

const getPaymentMethodInvoiceIds = require('~/utils/financial/paymentMethodInvoiceIds');
const parseMonthlyPeriods = require('~/utils/financial/parseMonthlyPeriods');
const { applyEnrollmentFilter, applySiblingFilter } = require('~/utils/academic/studentFilters');
const getStudentInvoiceTotals = require('~/utils/financial/studentInvoiceTotals');

const REPORT_COLUMNS = {
  receipts: [
    { key: 'invoice_number', header: 'Invoice Number' },
    { key: 'receipt_number', header: 'Receipt Number' },
    { key: 'payment_date', header: 'Payment Date' },
    { key: 'payment_amount', header: 'Amount' },
    { key: 'payment_method', header: 'Payment Method' },
    { key: 'status', header: 'Status' },
    { key: 'student_name', header: 'Student Name' },
    { key: 'admission_number', header: 'Admission No.' },
    { key: 'class', header: 'Class' },
    { key: 'section', header: 'Section' },
    { key: 'fee_type', header: 'Fee Type' },
    { key: 'branch', header: 'Branch' }
  ],
  fees: [
    { key: 'invoice_number', header: 'Invoice Number' },
    { key: 'invoice_date', header: 'Invoice Date' },
    { key: 'due_date', header: 'Due Date' },
    { key: 'total_amount', header: 'Total Amount' },
    { key: 'paid_amount', header: 'Paid Amount' },
    { key: 'balance_amount', header: 'Balance' },
    { key: 'status', header: 'Status' },
    { key: 'student_name', header: 'Student Name' },
    { key: 'admission_number', header: 'Admission No.' },
    { key: 'class', header: 'Class' },
    { key: 'section', header: 'Section' },
    { key: 'branch', header: 'Branch' },
    { key: 'stream', header: 'Stream' },
    { key: 'invoice_count', header: 'Invoice Count' },
    { key: 'fee_type', header: 'Fee Type' }
  ],
  students: [
    { key: 'admission_number', header: 'Admission No.' },
    { key: 'roll_number', header: 'Roll Number' },
    { key: 'student_name', header: 'Student Name' },
    { key: 'gender', header: 'Gender' },
    { key: 'date_of_birth', header: 'Date of Birth' },
    { key: 'current_class', header: 'Class' },
    { key: 'section', header: 'Section' },
    { key: 'branch', header: 'Branch' },
    { key: 'status', header: 'Status' },
    { key: 'admission_date', header: 'Admission Date' },
    { key: 'total_billed', header: 'Billed (All Years)' },
    { key: 'total_due', header: 'Due (All Years)' },
    { key: 'guardian_name', header: 'Parent / Guardian' },
    { key: 'guardian_phone', header: 'Guardian Phone' },
    { key: 'guardian_email', header: 'Guardian Email' }
  ],
  attendance: [
    { key: 'date', header: 'Date' },
    { key: 'class', header: 'Class' },
    { key: 'section', header: 'Section' },
    { key: 'status', header: 'Status' },
    { key: 'remarks', header: 'Remarks' },
    { key: 'admission_number', header: 'Admission No.' },
    { key: 'student_name', header: 'Student Name' },
    { key: 'time_in', header: 'Time In' },
    { key: 'time_out', header: 'Time Out' }
  ],
  library: [
    { key: 'title', header: 'Title' },
    { key: 'author', header: 'Author' },
    { key: 'isbn', header: 'ISBN' },
    { key: 'category', header: 'Category' },
    { key: 'publisher', header: 'Publisher' },
    { key: 'edition', header: 'Edition' },
    { key: 'quantity', header: 'Quantity' },
    { key: 'available', header: 'Available' },
    { key: 'purchase_date', header: 'Purchase Date' },
    { key: 'purchase_price', header: 'Purchase Price' },
    { key: 'sale_price', header: 'Sale Price' }
  ],
  homeworks: [
    { key: 'title', header: 'Title' },
    { key: 'class_name', header: 'Class' },
    { key: 'section_name', header: 'Section' },
    { key: 'subject_name', header: 'Subject' },
    { key: 'academic_year', header: 'Academic Year' },
    { key: 'due_date', header: 'Due Date' },
    { key: 'branch_name', header: 'Branch' }
  ],
  classwork: [
    { key: 'date', header: 'Date' },
    { key: 'entry_type', header: 'Type' },
    { key: 'title', header: 'Topic' },
    { key: 'class_name', header: 'Class' },
    { key: 'section_name', header: 'Section' },
    { key: 'subject_name', header: 'Learning Area' },
    { key: 'teacher_name', header: 'Teacher' },
    { key: 'notes', header: 'Content / Notes' }
  ],
  gate_passes: [
    { key: 'pass_no', header: 'Pass Number' },
    { key: 'student_name', header: 'Student' },
    { key: 'admission_number', header: 'Admission Number' },
    { key: 'class_name', header: 'Class' },
    { key: 'reason', header: 'Reason' },
    { key: 'collector_name', header: 'Collector' },
    { key: 'collector_relation', header: 'Relation' },
    { key: 'leaving_at', header: 'Leaving At' },
    { key: 'actual_out_at', header: 'Actual Departure' },
    { key: 'expected_return_at', header: 'Expected Return' },
    { key: 'returned_at', header: 'Returned At' },
    { key: 'status', header: 'Status' },
    { key: 'gate_name', header: 'Gate' },
    { key: 'branch_name', header: 'Branch' }
  ],
  visitors: [
    { key: 'visitor_name', header: 'Visitor Name' },
    { key: 'phone', header: 'Phone' },
    { key: 'purpose', header: 'Purpose' },
    { key: 'in_time', header: 'In-Time' },
    { key: 'out_time', header: 'Out-Time' },
    { key: 'status', header: 'Status' }
  ],
  admission_enquiries: [
    { key: 'student_name', header: 'Student Name' },
    { key: 'parent_name', header: 'Parent Name' },
    { key: 'phone', header: 'Phone' },
    { key: 'enquiry_date', header: 'Enquiry Date' },
    { key: 'interested_class', header: 'Interested Class' },
    { key: 'follow_up', header: 'Follow-up' },
    { key: 'status', header: 'Status' }
  ],
  transactions: [
    { key: 'date', header: 'Date' },
    { key: 'type', header: 'Type' },
    { key: 'name', header: 'Name' },
    { key: 'category', header: 'Category' },
    { key: 'amount', header: 'Amount' },
    { key: 'reference_number', header: 'Reference' },
    { key: 'payment_method', header: 'Payment Method' },
    { key: 'description', header: 'Description' },
    { key: 'branch', header: 'Branch' }
  ],
  audit_events: [
    { key: 'created_at', header: 'Date' },
    { key: 'actor_name', header: 'User' },
    { key: 'actor_role', header: 'Role' },
    { key: 'action', header: 'Activity' },
    { key: 'entity_name', header: 'Entity' },
    { key: 'record_id', header: 'Record ID' },
    { key: 'branch_id', header: 'Branch ID' },
    { key: 'request', header: 'Request' },
    { key: 'changes', header: 'Recorded Changes' }
  ]
};

class UnifiedExportService {
  constructor() {
    this.supportedFormats = ['pdf', 'excel', 'csv', 'print'];
    this.supportedReportTypes = [
      'receipts',
      'fees',
      'students',
      'attendance',
      'library',
      'transactions',
      'homeworks',
      'classwork',
      'gate_passes',
      'visitors',
      'admission_enquiries',
      'audit_events'
    ];
  }

  // Helper function to parse amount values consistently
  parseAmount(value) {
    return parseFloat(String(value || 0).replace(/[₹,]/g, '')) || 0;
  }

  // Helper function to format currency consistently
  formatCurrency(amount) {
    return `Rs. ${this.parseAmount(amount).toLocaleString('en-IN')}`;
  }

  getColumnsForReport(reportType) {
    return REPORT_COLUMNS[reportType] || [];
  }

  // Helper function to build common where clause
  buildWhereClause(filters, user, schoolId) {
    const whereClause = {};

    // Add school_id filter
    if (schoolId) {
      whereClause.school_id = schoolId;
    }

    // Branch-scoped accounts cannot widen exports by omitting or changing branch_id.
    if (
      user.role === 'branch_admin' ||
      user.role === 'receptionist' ||
      (['accountant', 'librarian'].includes(user.role) && user.branch_id)
    ) {
      whereClause.branch_id = user.branch_id;
    } else if (filters.branch_id) {
      whereClause.branch_id = filters.branch_id;
    }

    return whereClause;
  }

  // Helper function to add date filters
  addDateFilters(whereClause, filters, dateField = 'date') {
    const { Op } = require('sequelize');

    if (filters.from_date && filters.to_date) {
      whereClause[dateField] = {
        [Op.between]: [filters.from_date, filters.to_date]
      };
    } else if (filters.from_date) {
      whereClause[dateField] = { [Op.gte]: filters.from_date };
    } else if (filters.date) {
      whereClause[dateField] = filters.date;
    }

    return whereClause;
  }

  /**
   * Main export method that routes to appropriate handlers
   */
  async exportReport(reportType, format, filters, user, schoolId, customColumns = null) {
    // Validate inputs upfront
    if (!this.supportedReportTypes.includes(reportType)) {
      throw new Error(`Unsupported report type: ${reportType}`);
    }
    if (!this.supportedFormats.includes(format)) {
      throw new Error(`Unsupported format: ${format}`);
    }
    if (!customColumns || !Array.isArray(customColumns) || customColumns.length === 0) {
      throw new Error('Custom columns are required and must be a non-empty array.');
    }

    // Get data based on report type
    const data = await this.getReportData(reportType, filters, user, schoolId);

    // Generate export based on format with custom columns
    const result = await this.generateExport(
      reportType,
      format,
      data,
      filters,
      user,
      schoolId,
      customColumns
    );

    return result;
  }

  /**
   * Get data for different report types
   */
  async getReportData(reportType, filters, user, schoolId) {
    switch (reportType) {
      case 'receipts':
        return await this.getReceiptsData(filters, user, schoolId);

      case 'fees':
        return await this.getFeesData(filters, user, schoolId);

      case 'students':
        return await this.getStudentsData(filters, user, schoolId);

      case 'attendance':
        return await this.getAttendanceData(filters, user, schoolId);

      case 'library':
        return await this.getLibraryData(filters, user, schoolId);

      case 'transactions':
        return await this.getTransactionsData(filters, user, schoolId);

      case 'homeworks':
        return await this.getHomeworksData(filters, user, schoolId);

      case 'classwork':
        return await this.getClassworkData(filters, user, schoolId);

      case 'gate_passes':
        return await this.getGatePassesData(filters, user, schoolId);

      case 'visitors':
        return await this.getVisitorsData(filters, user, schoolId);
      case 'admission_enquiries':
        return await this.getAdmissionEnquiriesData(filters, user, schoolId);

      case 'audit_events':
        return await this.getAuditEventsData(filters, schoolId);

      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }
  }

  async getAuditEventsData(filters, schoolId) {
    const { AuditEvent, User } = require('~/models');
    const { Op, Sequelize } = require('sequelize');
    if (!schoolId) throw new Error('School ID is required to export audit events');
    const retainedFrom = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const from = filters.from_date ? new Date(`${filters.from_date}T00:00:00.000Z`) : null;
    const to = filters.to_date ? new Date(`${filters.to_date}T00:00:00.000Z`) : null;
    const where = {
      school_id: schoolId,
      created_at: {
        [Op.gte]: from && from > retainedFrom ? from : retainedFrom,
        ...(to ? { [Op.lt]: new Date(to.getTime() + 86400000) } : {})
      }
    };
    if (filters.branch_id) where.branch_id = filters.branch_id;
    const action = String(filters.action || '').trim().slice(0, 24);
    const entity = String(filters.entity || '').trim().slice(0, 120);
    const search = String(filters.search || '').trim().slice(0, 120);
    if (action) where.action = action;
    if (entity) where.entity_name = { [Op.iLike]: `%${entity}%` };
    if (search) {
      const pattern = `%${search}%`;
      where[Op.or] = [
        { entity_name: { [Op.iLike]: pattern } },
        { action: { [Op.iLike]: pattern } },
        { request_path: { [Op.iLike]: pattern } },
        { '$actor.first_name$': { [Op.iLike]: pattern } },
        { '$actor.last_name$': { [Op.iLike]: pattern } },
        Sequelize.where(Sequelize.cast(Sequelize.col('changes'), 'text'), { [Op.iLike]: pattern })
      ];
    }
    const sortBy = ['user', 'activity'].includes(filters.sort_by) ? filters.sort_by : 'date';
    const sortOrder = String(filters.sort_order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const events = await AuditEvent.findAll({
      where,
      include: [{ association: 'actor', attributes: ['first_name', 'last_name'] }],
      order: sortBy === 'user'
        ? [[{ model: User, as: 'actor' }, 'first_name', sortOrder], [{ model: User, as: 'actor' }, 'last_name', sortOrder], ['created_at', 'DESC']]
        : [[sortBy === 'activity' ? 'action' : 'created_at', sortOrder], ...(sortBy === 'date' ? [] : [['created_at', 'DESC']])]
    });
    return events.map(event => {
      const row = event.get({ plain: true });
      return {
        created_at: row.created_at,
        actor_name: row.actor ? `${row.actor.first_name || ''} ${row.actor.last_name || ''}`.trim() : 'Former user',
        actor_role: row.actor_role || '',
        action: row.action,
        entity_name: row.entity_name,
        record_id: row.record_id || '',
        branch_id: row.branch_id || '',
        request: [row.request_method, row.request_path].filter(Boolean).join(' '),
        changes: JSON.stringify(row.changes || {})
      };
    });
  }

  async getLibraryData(filters, user, schoolId) {
    const { LibraryBook } = require('~/models');
    const { Op } = require('sequelize');
    const where = this.buildWhereClause(filters, user, schoolId);

    if (filters.category) where.category = filters.category;
    if (filters.search?.trim()) {
      const search = `%${filters.search.trim()}%`;
      where[Op.or] = ['title', 'author', 'isbn', 'category'].map(field => ({
        [field]: { [Op.like]: search }
      }));
    }

    return LibraryBook.findAll({
      where,
      attributes: [
        'title',
        'author',
        'isbn',
        'category',
        'publisher',
        'edition',
        'quantity',
        'available',
        'purchase_date',
        'purchase_price',
        'sale_price'
      ],
      order: [['title', 'ASC']]
    });
  }

  async getHomeworksData(filters, user, schoolId) {
    const { Homework, Class, Section, Subject, Branch } = require('~/models');
    const { Op } = require('sequelize');
    const where = this.buildWhereClause(filters, user, schoolId);
    if (!schoolId) throw new Error('School ID is required to export homework');
    if (user.role === 'teacher') {
      if (!user.branch_id)
        throw new Error('Teacher must be assigned to a branch to export homework');
      where.branch_id = user.branch_id;
    }
    if (filters.class_id) where.class_id = filters.class_id;
    if (filters.academic_year && filters.academic_year !== 'all') {
      where[Op.and] = [
        ...(where[Op.and] || []),
        { [Op.or]: [{ academic_year: filters.academic_year }, { academic_year: null }] }
      ];
    }
    if (filters.search?.trim()) {
      const search = `%${filters.search.trim()}%`;
      where[Op.and] = [
        ...(where[Op.and] || []),
        {
          [Op.or]: [
            { title: { [Op.iLike]: search } },
            { description: { [Op.iLike]: search } },
            { '$class.name$': { [Op.iLike]: search } },
            { '$section.name$': { [Op.iLike]: search } },
            { '$subject.name$': { [Op.iLike]: search } }
          ]
        }
      ];
    }
    const sortBy = ['title', 'due_date'].includes(filters.sort_by) ? filters.sort_by : 'due_date';
    const sortOrder = String(filters.sort_order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const rows = await Homework.findAll({
      where,
      include: [
        { model: Class, as: 'class', attributes: ['name'] },
        { model: Section, as: 'section', attributes: ['name'], required: false },
        { model: Subject, as: 'subject', attributes: ['name'], required: false }
      ],
      order: [
        [sortBy, sortOrder],
        ['id', 'ASC']
      ]
    });
    const branchIds = [...new Set(rows.map(row => row.branch_id).filter(Boolean))];
    const branches = branchIds.length
      ? await Branch.findAll({
          where: { id: { [Op.in]: branchIds }, school_id: schoolId },
          attributes: ['id', 'name']
        })
      : [];
    const branchNames = new Map(branches.map(branch => [branch.id, branch.name]));
    return rows.map(row => {
      const record = row.toJSON();
      return {
        title: record.title,
        class_name: record.class?.name || '',
        section_name: record.section?.name || '',
        subject_name: record.subject?.name || '',
        academic_year: record.academic_year || 'Legacy / unassigned',
        due_date: record.due_date,
        branch_name: branchNames.get(record.branch_id) || ''
      };
    });
  }

  async getClassworkData(filters, user, schoolId) {
    const { DynamicEntityRecord } = require('~/models');
    const { Op, Sequelize } = require('sequelize');
    if (!schoolId) throw new Error('School ID is required to export classwork');
    const where = { ...this.buildWhereClause(filters, user, schoolId), entity_type: 'classwork_entry' };
    if (user.role === 'teacher') {
      if (!user.branch_id) throw new Error('Teacher must be assigned to a branch to export classwork');
      const year = await require('~/utils/academic/academicYearUtils').getCurrentAcademicYearForSchool(schoolId);
      const assignmentScope = await require('~/utils/academic/teacherStudentScope').getTeacherStudentWhere({
        teacherId: user.id, schoolId, academicYear: year?.code || year?.name
      });
      const assignments = (assignmentScope[Op.or] || [])
        .filter(item => item.class_id && item.branch_id)
        .map(({ class_id, branch_id }) => ({ class_id, branch_id }));
      where.branch_id = user.branch_id;
      where.created_by = user.id;
      where[Op.and] = [{ [Op.or]: assignments.length ? assignments : [{ class_id: null }] }];
    }
    if (filters.class_id) where.class_id = filters.class_id;
    if (filters.entry_type) {
      if (!['Classwork', 'Logbook', 'Notes'].includes(filters.entry_type)) throw new Error('Invalid classwork entry type');
      where[Op.and] = [...(where[Op.and] || []), Sequelize.where(Sequelize.json('payload.entry_type'), filters.entry_type)];
    }
    if (filters.section_id) where[Op.and] = [...(where[Op.and] || []), Sequelize.where(Sequelize.json('payload.section_id'), filters.section_id)];
    if (filters.academic_year) where[Op.and] = [...(where[Op.and] || []), Sequelize.where(Sequelize.json('payload.academic_year'), filters.academic_year)];
    this.addDateFilters(where, filters, 'date_value');
    if (filters.search?.trim()) {
      const search = `%${filters.search.trim().slice(0, 120)}%`;
      where[Op.and] = [...(where[Op.and] || []), { [Op.or]: [
        { title: { [Op.iLike]: search } },
        { notes: { [Op.iLike]: search } },
        Sequelize.where(Sequelize.cast(Sequelize.col('payload'), 'text'), { [Op.iLike]: search })
      ] }];
    }
    const sortColumns = { date: 'date_value', title: 'title', type: Sequelize.json('payload.entry_type') };
    const sortColumn = sortColumns[filters.sort_by] || sortColumns.date;
    const sortOrder = String(filters.sort_order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const rows = await DynamicEntityRecord.findAll({ where, order: [[sortColumn, sortOrder], ['created_at', 'DESC']] });
    return rows.map(row => {
      const payload = row.payload || {};
      return {
        date: row.date_value, entry_type: payload.entry_type || '', title: row.title,
        class_name: payload.class_name || '', section_name: payload.section_name || '',
        subject_name: payload.subject_name || '', teacher_name: payload.teacher_name || '', notes: row.notes || ''
      };
    });
  }

  async getGatePassesData(filters, user, schoolId) {
    const { GatePass, Student, Class, Branch } = require('~/models');
    const { Op } = require('sequelize');
    const where = this.buildWhereClause(filters, user, schoolId);
    if (!schoolId) throw new Error('School ID is required to export gate passes');
    if (user.role === 'receptionist') {
      if (!user.branch_id)
        throw new Error('Receptionist must be assigned to a branch to export gate passes');
      where.branch_id = user.branch_id;
    }
    if (
      filters.status &&
      ['pending', 'approved', 'rejected', 'out', 'returned', 'cancelled'].includes(filters.status)
    ) {
      where.status = filters.status;
    }
    if (filters.search?.trim()) {
      const search = `%${filters.search.trim()}%`;
      where[Op.or] = [
        { pass_no: { [Op.iLike]: search } },
        { collector_name: { [Op.iLike]: search } },
        { '$student.first_name$': { [Op.iLike]: search } },
        { '$student.last_name$': { [Op.iLike]: search } },
        { '$student.admission_number$': { [Op.iLike]: search } }
      ];
    }
    const rows = await GatePass.findAll({
      where,
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['first_name', 'middle_name', 'last_name', 'admission_number', 'class_id'],
          include: [{ model: Class, as: 'class', attributes: ['name'], required: false }]
        },
        { model: Branch, as: 'branch', attributes: ['name'] }
      ],
      order: [
        ['leaving_at', 'DESC'],
        ['id', 'ASC']
      ]
    });
    return rows.map(row => {
      const pass = row.toJSON();
      const student = pass.student || {};
      return {
        pass_no: pass.pass_no,
        student_name: [student.first_name, student.middle_name, student.last_name]
          .filter(Boolean)
          .join(' '),
        admission_number: student.admission_number || '',
        class_name: student.class?.name || '',
        reason: pass.reason,
        collector_name: pass.collector_name,
        collector_relation: pass.collector_relation,
        leaving_at: pass.leaving_at,
        actual_out_at: pass.actual_out_at,
        expected_return_at: pass.expected_return_at,
        returned_at: pass.returned_at,
        status: pass.status,
        gate_name: pass.gate_name,
        branch_name: pass.branch?.name || ''
      };
    });
  }

  async getVisitorsData(filters, user, schoolId) {
    const { DynamicEntityRecord } = require('~/models');
    const { Op } = require('sequelize');
    if (!schoolId) throw new Error('School ID is required to export visitors');
    if (user.role === 'receptionist' && !user.branch_id) {
      throw new Error('Receptionist must be assigned to a branch to export visitors');
    }
    const where = { ...this.buildWhereClause(filters, user, schoolId), entity_type: 'visitor' };
    if (filters.status) where.status = filters.status;
    if (filters.search?.trim()) {
      const search = `%${filters.search.trim().slice(0, 100)}%`;
      where[Op.or] = ['title', 'reference_no', 'notes'].map(field => ({
        [field]: { [Op.iLike]: search }
      }));
    }
    const rows = await DynamicEntityRecord.findAll({
      where,
      order: [
        ['created_at', 'DESC'],
        ['id', 'ASC']
      ]
    });
    return rows.map(row => {
      const record = row.toJSON();
      return {
        visitor_name: record.title,
        phone: record.reference_no || '',
        purpose: record.notes || '',
        in_time: record.created_at,
        out_time: record.payload?.exit_time || '',
        status: record.status
      };
    });
  }

  async getAdmissionEnquiriesData(filters, user, schoolId) {
    const { DynamicEntityRecord, Class, sequelize } = require('~/models');
    const { Op } = require('sequelize');
    if (!schoolId) throw new Error('School ID is required to export admission enquiries');
    if (user.role === 'receptionist' && !user.branch_id) {
      throw new Error('Receptionist must be assigned to a branch to export admission enquiries');
    }
    const where = {
      ...this.buildWhereClause(filters, user, schoolId),
      entity_type: 'enquiry'
    };
    if (filters.search?.trim()) {
      const search = `%${filters.search.trim().slice(0, 100)}%`;
      where[Op.or] = [
        ...['title', 'reference_no', 'notes', 'status'].map(field => ({
          [field]: { [Op.iLike]: search }
        })),
        sequelize.where(sequelize.cast(sequelize.col('payload'), 'text'), { [Op.iLike]: search })
      ];
    }
    const rows = await DynamicEntityRecord.findAll({
      where,
      include: [{ model: Class, as: 'class', attributes: ['id', 'name'], required: false }],
      order: [['created_at', 'DESC'], ['id', 'ASC']]
    });
    return rows.map(row => {
      const record = row.toJSON();
      return {
        student_name: record.title,
        parent_name: record.payload?.parent_name || '',
        phone: record.reference_no || '',
        enquiry_date: record.date_value || record.created_at,
        interested_class: record.class?.name || record.payload?.class_id_label || '',
        follow_up: record.notes || '',
        status: record.status
      };
    });
  }

  async getTransactionsData(filters, user, schoolId) {
    const { SchoolTransaction, AccountCategory, Branch } = require('~/models');
    const { Op } = require('sequelize');
    const where = this.buildWhereClause(filters, user, schoolId);

    if (filters.transaction_type && ['income', 'expense'].includes(filters.transaction_type)) {
      where.type = filters.transaction_type;
    }
    if (filters.category_id) where.category_id = filters.category_id;
    this.addDateFilters(where, filters);
    if (filters.search?.trim()) {
      const search = `%${filters.search.trim()}%`;
      where[Op.or] = ['name', 'reference_number'].map(field => ({
        [field]: { [Op.iLike]: search }
      }));
    }

    const sortableFields = ['name', 'category', 'amount', 'date'];
    const validSort = sortableFields.includes(filters.sort_by);
    const sortBy = validSort ? filters.sort_by : 'date';
    const sortOrder =
      validSort && String(filters.sort_order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const order =
      sortBy === 'category'
        ? [[{ model: AccountCategory, as: 'category' }, 'name', sortOrder]]
        : [[sortBy, sortOrder]];
    if (sortBy !== 'date') order.push(['date', 'DESC']);
    order.push(['created_at', 'DESC']);

    const rows = await SchoolTransaction.findAll({
      where,
      include: [
        { model: AccountCategory, as: 'category', attributes: ['name'] },
        { model: Branch, as: 'branch', attributes: ['name'] }
      ],
      order
    });

    return rows.map(row => {
      const transaction = row.toJSON ? row.toJSON() : row;
      return {
        ...transaction,
        category: transaction.category?.name || '',
        branch: transaction.branch?.name || ''
      };
    });
  }

  /**
   * Get receipts data for export
   */
  async getReceiptsData(filters, user, schoolId) {
    const { FeePayment, FeeInvoice, Student, FeeStructure, FeeType, Branch } = require('~/models');

    // Build where clause using helper
    const whereClause = this.buildWhereClause(filters, user, schoolId);

    // Add date filters
    this.addDateFilters(whereClause, filters, 'payment_date');

    // Payment method filter
    if (filters.payment_method && filters.payment_method !== '') {
      whereClause.payment_method = filters.payment_method;
    }

    // Build student include with potential filters
    const studentInclude = {
      model: Student,
      as: 'student',
      include: [
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name', 'code']
        }
      ]
    };

    // Add class filter to student include if provided
    if (filters.class_id && filters.class_id !== '') {
      studentInclude.where = { ...studentInclude.where };
      studentInclude.where.current_class_id = filters.class_id;
    }

    // Add section filter to student include if provided
    if (filters.section && filters.section !== '') {
      if (!studentInclude.where) studentInclude.where = {};
      studentInclude.where.section = filters.section;
    }

    const payments = await FeePayment.findAll({
      where: { ...whereClause, payment_status: 'completed' },
      include: [
        studentInclude,
        {
          model: FeeInvoice,
          as: 'invoice',
          include: [
            {
              model: FeeStructure,
              as: 'feeStructure',
              include: [
                {
                  model: FeeType,
                  as: 'feeType',
                  attributes: ['id', 'name']
                }
              ]
            }
          ]
        }
      ],
      order: [['payment_date', 'DESC']]
    });

    if (payments.length === 0) {
      return []; // Return empty array if no data found
    }
    const mappedData = payments
      .map((payment, index) => {
        try {
          const mapped = {
            invoice_number: payment.invoice?.invoice_number || payment.invoice?.id || 'N/A',
            receipt_number: payment.receipt_number || `R${payment.id}`,
            payment_date: payment.payment_date || '',
            payment_amount: payment.payment_amount || payment.amount || 0,
            payment_method: payment.payment_method || 'N/A',
            status: payment.payment_status || 'completed',
            student_name: payment.student
              ? `${payment.student.first_name || ''} ${payment.student.last_name || ''}`.trim()
              : 'Student Not Found',
            admission_number: payment.student?.admission_number || 'N/A',
            class: payment.student?.current_class || payment.student?.current_class_name || 'N/A',
            section: payment.student?.section || 'N/A',
            fee_type: payment.invoice?.feeStructure?.feeType?.name || payment.fee_type || 'N/A',
            branch: payment.student?.branch?.name || payment.branch_name || 'N/A',
            school: 'School ERP System'
          };
          return mapped;
        } catch (error) {
          logger.error('❌ Error mapping payment data:', error, {
            paymentId: payment.id,
            paymentData: {
              receipt_number: payment.receipt_number,
              payment_date: payment.payment_date,
              payment_amount: payment.payment_amount,
              student_id: payment.student_id
            }
          });
          return null;
        }
      })
      .filter(Boolean); // Remove any null entries

    return mappedData;
  }

  /**
   * Get fees data for export
   */
  async getFeesData(filters, user, schoolId) {
    const { FeeInvoice, Student, FeeStructure, FeeType, Branch, Stream } = require('~/models');
    const { Op } = require('sequelize');

    // Handle monthly payments differently
    if (filters.payment_model === 'monthly' && filters.months && filters.months.length > 0) {
      return await this.getMonthlyFeesData(filters, user, schoolId);
    }

    // Build where clause using helper
    const whereClause = this.buildWhereClause(filters, user, schoolId);

    if (filters.status) {
      const statuses = String(filters.status)
        .split(',')
        .map(status => status.trim())
        .filter(Boolean);
      if (statuses.length === 1) whereClause.status = statuses[0];
      else if (statuses.length > 1) whereClause.status = { [Op.in]: statuses };
    }
    if (filters.academic_year) whereClause.academic_year = filters.academic_year;

    // Add payment model filter
    if (filters.payment_model) {
      whereClause.payment_model = filters.payment_model;
    }
    if (filters.payment_method) {
      whereClause.id = {
        [Op.in]: await getPaymentMethodInvoiceIds({
          paymentMethod: filters.payment_method,
          schoolId,
          branchId:
            user.role === 'branch_admin' || (user.role === 'accountant' && user.branch_id)
              ? user.branch_id
              : filters.branch_id,
          academicYear: filters.academic_year
        })
      };
    }

    // Add date filters for invoice_date or due_date
    if (filters.from_date && filters.to_date) {
      whereClause[Op.or] = [
        { invoice_date: { [Op.between]: [filters.from_date, filters.to_date] } },
        { due_date: { [Op.between]: [filters.from_date, filters.to_date] } }
      ];
    } else if (filters.from_date || filters.to_date) {
      const dateOperator = filters.from_date ? Op.gte : Op.lte;
      const date = filters.from_date || filters.to_date;
      whereClause[Op.or] = [
        { invoice_date: { [dateOperator]: date } },
        { due_date: { [dateOperator]: date } }
      ];
    }

    if (filters.due_from || filters.due_to) {
      whereClause.due_date = {};
      if (filters.due_from) whereClause.due_date[Op.gte] = filters.due_from;
      if (filters.due_to) whereClause.due_date[Op.lte] = filters.due_to;
    }

    const studentWhereClause = {};
    if (filters.search) {
      studentWhereClause[Op.or] = [
        { first_name: { [Op.iLike]: `%${filters.search}%` } },
        { last_name: { [Op.iLike]: `%${filters.search}%` } },
        { admission_number: { [Op.iLike]: `%${filters.search}%` } }
      ];
    }
    if (filters.class_id) studentWhereClause.class_id = filters.class_id;
    if (filters.section_id) studentWhereClause.section_id = filters.section_id;
    if (filters.stream_id) studentWhereClause.stream_id = filters.stream_id;
    if (filters.class_name && !filters.class_id)
      studentWhereClause.current_class = filters.class_name;
    if (filters.section_name && !filters.section_id)
      studentWhereClause.section = filters.section_name;
    else if (filters.section && !filters.section_id) studentWhereClause.section = filters.section;
    if (user.role === 'branch_admin' || (user.role === 'accountant' && user.branch_id)) {
      studentWhereClause.branch_id = user.branch_id;
    }

    const invoices = await FeeInvoice.findAll({
      where: whereClause,
      include: [
        {
          model: Student,
          as: 'student',
          where: studentWhereClause
        },
        {
          model: FeeStructure,
          as: 'feeStructure',
          include: [
            {
              model: FeeType,
              as: 'feeType'
            }
          ]
        },
        { model: Branch, as: 'branch', attributes: ['name'] },
        { model: Stream, as: 'stream', attributes: ['name'] }
      ],
      order: [['invoice_date', 'DESC']]
    });

    return invoices.map(invoice => ({
      invoice_number: invoice.invoice_number,
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date,
      total_amount: invoice.total_amount,
      paid_amount: invoice.paid_amount,
      discount_amount: invoice.discount_amount,
      late_fee_amount: invoice.late_fee_amount,
      balance_amount: invoice.balance_amount,
      status:
        invoice.status === 'sent'
          ? 'Pending'
          : invoice.status === 'partial_paid'
            ? 'Partially paid'
            : invoice.status
              ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)
              : 'Pending',
      student_name: `${invoice.student.first_name} ${invoice.student.last_name}`.trim(),
      admission_number: invoice.student.admission_number,
      class: invoice.student.current_class,
      section: invoice.student.section,
      branch: invoice.branch?.name || '',
      stream: invoice.stream?.name || '',
      invoice_count: 1,
      fee_type: invoice.feeStructure.feeType.name
    }));
  }

  /**
   * Get monthly fees data for export
   */
  async getMonthlyFeesData(filters, user, schoolId) {
    const {
      FeeInvoice,
      Student,
      FeeStructure,
      FeeType,
      FeePayment,
      Branch,
      Stream
    } = require('~/models');
    const { Op } = require('sequelize');
    const selectedPeriods = parseMonthlyPeriods(filters.periods);

    // Parse months parameter - handle both array and comma-separated string formats
    let monthsArray = [];
    if (selectedPeriods.length) {
      monthsArray = [...new Set(selectedPeriods.map(period => period.month))];
    } else if (filters.months) {
      if (Array.isArray(filters.months)) {
        monthsArray = filters.months.map(m => parseInt(m));
      } else if (typeof filters.months === 'string') {
        monthsArray = filters.months.split(',').map(m => parseInt(m.trim()));
      }
    }

    if (monthsArray.length === 0) {
      throw new Error('Months are required for monthly payment export');
    }

    const currentYear = filters.year ? parseInt(filters.year) : new Date().getFullYear();

    const whereClause = {
      ...this.buildWhereClause(filters, user, schoolId),
      payment_model: 'monthly'
    };
    if (selectedPeriods.length) {
      whereClause[Op.or] = selectedPeriods;
    } else {
      whereClause.month = { [Op.in]: monthsArray };
      whereClause.year = currentYear;
    }
    if (filters.payment_method) {
      whereClause.id = {
        [Op.in]: await getPaymentMethodInvoiceIds({
          paymentMethod: filters.payment_method,
          schoolId,
          branchId:
            user.role === 'branch_admin' || (user.role === 'accountant' && user.branch_id)
              ? user.branch_id
              : filters.branch_id,
          academicYear: filters.academic_year
        })
      };
    }

    // Add student filters
    const studentWhereClause = {};
    if (filters.search) {
      studentWhereClause[Op.or] = [
        { first_name: { [Op.iLike]: `%${filters.search}%` } },
        { last_name: { [Op.iLike]: `%${filters.search}%` } },
        { admission_number: { [Op.iLike]: `%${filters.search}%` } }
      ];
    }
    if (filters.class_id) studentWhereClause.class_id = filters.class_id;
    if (filters.section_id) studentWhereClause.section_id = filters.section_id;
    if (filters.stream_id) studentWhereClause.stream_id = filters.stream_id;
    if (user.role === 'branch_admin' || (user.role === 'accountant' && user.branch_id)) {
      studentWhereClause.branch_id = user.branch_id;
    }

    // Get all monthly invoices
    const monthlyInvoices = await FeeInvoice.findAll({
      where: whereClause,
      include: [
        {
          model: Student,
          as: 'student',
          where: studentWhereClause,
          attributes: [
            'id',
            'first_name',
            'last_name',
            'admission_number',
            'roll_number',
            'current_class',
            'section',
            'photo'
          ]
        },
        {
          model: FeeStructure,
          as: 'feeStructure',
          include: [
            {
              model: FeeType,
              as: 'feeType',
              attributes: ['id', 'name']
            }
          ]
        },
        {
          model: FeePayment,
          as: 'payments',
          attributes: ['id', 'payment_amount', 'payment_date', 'payment_method', 'payment_status'],
          where: { payment_status: 'completed' },
          required: false,
          order: [['created_at', 'DESC']],
          limit: 5
        },
        { model: Branch, as: 'branch', attributes: ['name'] },
        { model: Stream, as: 'stream', attributes: ['name'] }
      ],
      order: [
        ['student_id', 'ASC'],
        ['month', 'ASC']
      ],
      limit: 5000 // Reasonable limit to prevent memory issues
    });

    // Group by student and month to show payment status
    const studentMonthStatus = {};

    monthlyInvoices.forEach(invoice => {
      const studentId = invoice.student_id;
      const month = invoice.month;
      const monthName = [
        '',
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
      ][month];

      if (!studentMonthStatus[studentId]) {
        studentMonthStatus[studentId] = {
          student: invoice.student,
          months: {},
          totalAmount: 0,
          totalPaid: 0,
          totalPending: 0
        };
      }

      const isPaid = parseFloat(invoice.paid_amount) >= parseFloat(invoice.total_amount);
      const isPartial = parseFloat(invoice.paid_amount) > 0 && !isPaid;

      studentMonthStatus[studentId].months[month] = {
        month,
        monthName,
        invoice: invoice,
        amount: parseFloat(invoice.total_amount),
        paid: parseFloat(invoice.paid_amount),
        balance: parseFloat(invoice.balance_amount),
        status: isPaid ? 'paid' : isPartial ? 'partial' : 'pending',
        dueDate: invoice.due_date,
        payments: invoice.payments || []
      };

      studentMonthStatus[studentId].totalAmount += parseFloat(invoice.total_amount);
      studentMonthStatus[studentId].totalPaid += parseFloat(invoice.paid_amount);
      studentMonthStatus[studentId].totalPending += parseFloat(invoice.balance_amount);
    });

    // Convert to flat array format for export
    const exportData = [];
    Object.values(studentMonthStatus).forEach(studentData => {
      monthsArray.forEach(month => {
        const monthData = studentData.months[month];
        if (monthData && monthData.invoice) {
          exportData.push({
            invoice_number: monthData.invoice.invoice_number,
            invoice_date: monthData.invoice.invoice_date,
            due_date: monthData.dueDate,
            total_amount: monthData.amount,
            paid_amount: monthData.paid,
            balance_amount: monthData.balance,
            status:
              monthData.status === 'paid'
                ? 'paid'
                : monthData.status === 'partial'
                  ? 'partial_paid'
                  : 'sent',
            student_name:
              `${studentData.student.first_name} ${studentData.student.last_name || ''}`.trim(),
            admission_number: studentData.student.admission_number,
            class: studentData.student.current_class,
            section: studentData.student.section,
            branch: monthData.invoice.branch?.name || '',
            stream: monthData.invoice.stream?.name || '',
            invoice_count: 1,
            fee_type: monthData.invoice.feeStructure?.feeType?.name || 'Monthly Fee',
            month: month,
            month_name: monthData.monthName,
            payment_model: 'monthly'
          });
        }
      });
    });

    return exportData;
  }

  /**
   * Get students data for export
   */
  async getStudentsData(filters, user, schoolId) {
    const { Student, Parent, Branch } = require('~/models');
    const { Op } = require('sequelize');

    // Build where clause using helper
    const whereClause = this.buildWhereClause(filters, user, schoolId);

    whereClause.status = { [Op.ne]: 'deleted' };
    if (filters.academic_year) whereClause.academic_year = filters.academic_year;
    if (filters.class_name) whereClause.current_class = filters.class_name;
    if (filters.section_name) whereClause.section = filters.section_name;
    if (filters.status && filters.status !== 'deleted') whereClause.status = filters.status;
    if (filters.gender) whereClause.gender = filters.gender;
    if (filters.class_id) whereClause.class_id = filters.class_id;
    if (filters.section_id) whereClause.section_id = filters.section_id;
    if (filters.stream_id) whereClause.stream_id = filters.stream_id;
    if (filters.category_id) whereClause.category_id = filters.category_id;
    if (filters.search) {
      whereClause[Op.or] = [
        { first_name: { [Op.iLike]: `%${filters.search}%` } },
        { last_name: { [Op.iLike]: `%${filters.search}%` } },
        { admission_number: { [Op.iLike]: `%${filters.search}%` } },
        { email: { [Op.iLike]: `%${filters.search}%` } }
      ];
    }
    await applyEnrollmentFilter(whereClause, filters.enrollment, filters.academic_year);
    await applySiblingFilter(whereClause, filters.has_siblings);

    const students = await Student.findAll({
      where: whereClause,
      include: [
        {
          model: Parent,
          as: 'parents',
          through: { attributes: [] },
          attributes: ['guardian_name', 'guardian_phone', 'guardian_email', 'guardian_relation']
        },
        { model: Branch, as: 'branch', attributes: ['name'] }
      ],
      order: [['created_at', 'DESC']]
    });
    const invoiceTotals = await getStudentInvoiceTotals(students);

    return students.map(student => ({
      admission_number: student.admission_number,
      roll_number: student.roll_number,
      student_name: `${student.first_name} ${student.last_name}`.trim(),
      gender: student.gender,
      date_of_birth: student.date_of_birth,
      current_class: student.current_class,
      section: student.section,
      branch: student.branch?.name || '',
      status: student.status,
      admission_date: student.admission_date,
      ...(invoiceTotals.get(`${student.school_id}:${student.id}`) || {
        total_billed: 0,
        total_due: 0
      }),
      guardian_name: student.parents?.[0]?.guardian_name || '',
      guardian_phone: student.parents?.[0]?.guardian_phone || '',
      guardian_email: student.parents?.[0]?.guardian_email || ''
    }));
  }

  /**
   * Get attendance data for export
   */
  async getAttendanceData(filters, user, schoolId) {
    const { AttendanceRecord, Student, Class, Section } = require('~/models');

    // Build where clause using helper
    const whereRec = this.buildWhereClause(filters, user, schoolId);

    if (filters.class_id) whereRec.class_id = filters.class_id;
    if (filters.section_id) whereRec.section_id = filters.section_id;
    if (filters.student_id) whereRec.student_id = filters.student_id;
    if (filters.academic_year) whereRec.academic_year = filters.academic_year;

    // Add date filters
    this.addDateFilters(whereRec, filters, 'date');

    const records = await AttendanceRecord.findAll({
      where: whereRec,
      include: [
        { model: Student, as: 'student' },
        { model: Class, as: 'class' },
        { model: Section, as: 'section' }
      ],
      order: [['date', 'DESC']]
    });

    return records.map(record => ({
      date: record.date,
      class: record.class?.name || '',
      section: record.section?.name || '',
      status: record.status,
      remarks: record.remarks || '',
      admission_number: record.student?.admission_number || '',
      student_name: `${record.student?.first_name || ''} ${record.student?.last_name || ''}`.trim(),
      time_in: record.time_in || '',
      time_out: record.time_out || ''
    }));
  }

  /**
   * Generate export in specified format
   */
  async generateExport(reportType, format, data, filters, user, schoolId, customColumns = null) {
    const fileName = this.generateFileName(reportType, format);

    if (format === 'print') {
      return this.generatePrint(reportType, data, filters, fileName, customColumns);
    }

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'school-erp-export-'));
    const filePath = path.join(tempDir, fileName);

    try {
      let result;
      switch (format) {
        case 'pdf':
          result = await this.generatePDF(reportType, data, filters, filePath, customColumns);
          break;

        case 'excel':
          result = await this.generateExcel(reportType, data, filters, filePath, customColumns);
          break;

        case 'csv':
          result = await this.generateCSV(reportType, data, filters, filePath, customColumns);
          break;

        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      return { ...result, tempDir };
    } catch (error) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      throw error;
    }
  }

  /**
   * Generate PDF export with professional styling
   */
  async generatePDF(reportType, data, filters, filePath, customColumns = null) {
    const fileName = path.basename(filePath);
    const layout = customColumns?.length > 8 ? 'landscape' : 'portrait';
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      layout
    });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Professional header - matching the image exactly
    doc
      .fontSize(28)
      .font('Helvetica-Bold')
      .fillColor('#2c3e50')
      .text('School ERP System', { align: 'center' });

    doc.moveDown(0.2);

    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#2c3e50')
      .text(`${this.getReportTitle(reportType)} Report`, { align: 'center' });

    doc.moveDown(0.2);

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#666666')
      .text(`Generated on: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });

    doc.moveDown(1);

    // Add filters info with professional styling - matching the image
    if (Object.keys(filters).length > 0) {
      const activeFilters = Object.entries(filters).filter(([key, value]) => value && value !== '');

      if (activeFilters.length > 0) {
        // Filters box with rounded corners effect
        const filterBoxY = doc.y;
        const filterBoxHeight = 30;

        // Main filter box
        doc
          .rect(50, filterBoxY, 495, filterBoxHeight)
          .fillColor('#f5f5f5')
          .fill()
          .strokeColor('#e0e0e0')
          .lineWidth(0.5)
          .stroke();

        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#2c3e50')
          .text('Applied Filters:', 60, filterBoxY + 8);

        const filterText = activeFilters
          .map(([key, value]) => {
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return `${label}: ${value}`;
          })
          .join(' | ');

        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#2c3e50')
          .text(filterText, 60, filterBoxY + 18, { width: 475 });

        doc.moveDown(2);
      }
    }

    // Add summary section if data exists - matching the image exactly
    if (data.length > 0) {
      const summaryY = doc.y;

      // Calculate summary values using helper functions
      const totalRecords = data.length;
      let totalAmount = 0;
      let totalCollected = 0;
      let summaryLabel = 'TOTAL RECORDS';
      let amountLabel = 'TOTAL AMOUNT';

      // Calculate amount based on report type
      if (reportType === 'receipts') {
        totalAmount = data.reduce((sum, row) => sum + this.parseAmount(row.payment_amount), 0);
        summaryLabel = 'TOTAL RECEIPTS';
        amountLabel = 'TOTAL COLLECTED';
      } else if (reportType === 'fees') {
        totalAmount = data.reduce((sum, row) => sum + this.parseAmount(row.total_amount), 0);
        totalCollected = data.reduce((sum, row) => sum + this.parseAmount(row.paid_amount), 0);
        summaryLabel = 'TOTAL INVOICES';
        amountLabel = 'TOTAL FEES';
      } else if (reportType === 'students') {
        summaryLabel = 'TOTAL STUDENTS';
        amountLabel = 'TOTAL STUDENTS';
      } else if (reportType === 'attendance') {
        summaryLabel = 'TOTAL RECORDS';
        amountLabel = 'TOTAL RECORDS';
      }

      // Summary cards - matching the image styling
      const cardWidth = 160;
      const cardHeight = 70;
      const cardSpacing = 20;
      const startX = 50;

      // Determine number of cards based on report type
      const isFeesReport = reportType === 'fees' && totalCollected > 0;
      const numCards = isFeesReport ? 3 : 2;
      const totalWidth = cardWidth * numCards + cardSpacing * (numCards - 1);

      // Summary section background
      doc
        .rect(startX, summaryY, totalWidth, cardHeight)
        .fillColor('#f9f9f9')
        .fill()
        .strokeColor('#dee2e6')
        .lineWidth(1)
        .stroke();

      // Total Amount Card (if applicable) - FIRST
      if (totalAmount > 0) {
        doc
          .rect(startX + 5, summaryY + 5, cardWidth - 10, cardHeight - 10)
          .fillColor('#ffffff')
          .fill()
          .strokeColor('#dee2e6')
          .lineWidth(1)
          .stroke();

        const formattedAmount = this.formatCurrency(totalAmount);

        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .fillColor('#2c3e50')
          .text(formattedAmount, startX + 15, summaryY + 20, {
            width: cardWidth - 30,
            align: 'center'
          });

        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#2c3e50')
          .text(amountLabel, startX + 15, summaryY + 50, {
            width: cardWidth - 30,
            align: 'center'
          });
      }

      // Total Collected Card (for fees reports) - SECOND
      let recordsCardX = startX + cardWidth + cardSpacing;
      if (isFeesReport) {
        doc
          .rect(recordsCardX + 5, summaryY + 5, cardWidth - 10, cardHeight - 10)
          .fillColor('#ffffff')
          .fill()
          .strokeColor('#dee2e6')
          .lineWidth(1)
          .stroke();

        const formattedCollected = this.formatCurrency(totalCollected);

        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .fillColor('#2c3e50')
          .text(formattedCollected, recordsCardX + 15, summaryY + 20, {
            width: cardWidth - 30,
            align: 'center'
          });

        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#2c3e50')
          .text('TOTAL COLLECTED', recordsCardX + 15, summaryY + 50, {
            width: cardWidth - 30,
            align: 'center'
          });

        recordsCardX = startX + (cardWidth + cardSpacing) * 2;
      }

      // Total Records Card - LAST
      doc
        .rect(recordsCardX + 5, summaryY + 5, cardWidth - 10, cardHeight - 10)
        .fillColor('#ffffff')
        .fill()
        .strokeColor('#dee2e6')
        .lineWidth(1)
        .stroke();

      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .fillColor('#2c3e50')
        .text(totalRecords.toString(), recordsCardX + 15, summaryY + 20, {
          width: cardWidth - 30,
          align: 'center'
        });

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#2c3e50')
        .text(summaryLabel, recordsCardX + 15, summaryY + 50, {
          width: cardWidth - 30,
          align: 'center'
        });

      doc.moveDown(2.5);
    }

    // Add data table with professional styling - matching the image exactly
    if (data.length > 0) {
      // Use the columns provided from the frontend
      const columns = customColumns;

      const tableTop = doc.y;
      let currentY = tableTop;
      const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

      // Calculate optimal column widths based on content type
      const getColumnWidth = columnKey => {
        const widthMap = {
          invoice_number: 70,
          receipt_number: 70,
          payment_date: 45,
          student_name: 90,
          branch: 45,
          class: 40,
          section: 40,
          payment_amount: 50,
          payment_method: 40,
          fee_type: 55
        };
        return widthMap[columnKey] || 50; // Default width
      };

      // Calculate total width and adjust if needed
      let totalWidth = columns.reduce((sum, col) => sum + getColumnWidth(col.key), 0);
      const scaleFactor = tableWidth / totalWidth;

      const getAdjustedWidth = columnKey => {
        return getColumnWidth(columnKey) * scaleFactor;
      };

      // Center the table on the page
      const tableStartX = (doc.page.width - tableWidth) / 2;

      // Draw table header - dark blue background with white text
      doc.rect(tableStartX, currentY, tableWidth, 25).fillColor('#1e3a8a').fill();

      let currentX = tableStartX;
      columns.forEach((column, index) => {
        const colWidth = getAdjustedWidth(column.key);

        // Draw header cell border
        doc.rect(currentX, currentY, colWidth, 25).strokeColor('#1e3a8a').lineWidth(0.5).stroke();

        // Use shorter header text for better fit
        const shortHeader =
          column.header.length > 10 ? column.header.substring(0, 10) : column.header;

        doc
          .fontSize(8)
          .font('Helvetica-Bold')
          .fillColor('#ffffff')
          .text(shortHeader.toUpperCase(), currentX + 2, currentY + 8, {
            width: colWidth - 4,
            align: column.key.includes('amount') ? 'right' : 'left'
          });

        currentX += colWidth;
      });

      currentY += 25;

      // Draw data rows
      data.forEach((row, rowIndex) => {
        const rowHeight = 20;
        if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          currentY = doc.page.margins.top;
        }

        // Calculate row height based on content - use consistent height for better appearance
        // Fixed row height for consistency.

        // Draw row background
        doc.rect(tableStartX, currentY, tableWidth, rowHeight).fillColor('#ffffff').fill();

        // Draw cell content
        let currentX = tableStartX;
        columns.forEach((column, colIndex) => {
          const colWidth = getAdjustedWidth(column.key);
          const value = row[column.key] || '';
          let displayValue = String(value);

          // Format values based on column type using helper functions
          if (
            column.key.includes('amount') ||
            column.key.includes('paid') ||
            column.key.includes('total') ||
            column.key.includes('remaining')
          ) {
            displayValue = this.formatCurrency(value);
          } else if (column.key.includes('date') || column.key.includes('time')) {
            if (value) {
              displayValue = new Date(value).toLocaleDateString('en-IN');
            }
          } else if (column.key === 'status') {
            displayValue = String(value).toUpperCase();
          } else if (column.key === 'payment_method') {
            displayValue = String(value).toLowerCase();
          } else if (column.key === 'student_name') {
            // Truncate long student names to fit in cell
            const cleanName = String(value).replace(/null/g, '').trim();
            displayValue = cleanName.length > 18 ? cleanName.substring(0, 15) + '...' : cleanName;
          }

          // Draw cell border
          doc
            .rect(currentX, currentY, colWidth, rowHeight)
            .strokeColor('#e0e0e0')
            .lineWidth(0.5)
            .stroke();

          // Draw text with proper alignment
          doc
            .fontSize(8)
            .font('Helvetica')
            .fillColor('#2c3e50')
            .text(displayValue, currentX + 2, currentY + 6, {
              width: colWidth - 4,
              align: column.key.includes('amount') ? 'right' : 'left'
            });

          currentX += colWidth;
        });

        currentY += rowHeight;
      });

      // Draw table border
      doc
        .rect(tableStartX, tableTop, tableWidth, currentY - tableTop)
        .strokeColor('#dee2e6')
        .lineWidth(1)
        .stroke();
    } else {
      doc
        .fontSize(14)
        .font('Helvetica')
        .fillColor('#7f8c8d')
        .text('No data found for the specified filters.', { align: 'center' });
    }

    // Add footer - simplified without redundant timestamp
    doc.moveDown(2);
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#2c3e50')
      .text(`Total Records: ${data.length}`, { align: 'right' });

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        // Check if file exists and has content
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          if (stats.size === 0) {
            logger.error(`📄 PDF file is empty: ${fileName}`);
            reject(new Error('Generated PDF file is empty'));
            return;
          }
        } else {
          logger.error(`📄 PDF file not found: ${fileName}`);
          reject(new Error('PDF file was not created'));
          return;
        }

        resolve({
          fileName,
          filePath,
          tempDir: path.dirname(filePath),
          format: 'pdf',
          contentType: 'application/pdf'
        });
      });
      stream.on('error', error => {
        logger.error(`📄 PDF generation error:`, error);
        reject(error);
      });
    });
  }

  /**
   * Generate Excel export
   */
  async generateExcel(reportType, data, filters, filePath, customColumns = null) {
    const fileName = path.basename(filePath);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(this.getReportTitle(reportType));

    // Add common metadata
    this.addExcelMetadata(worksheet, reportType, data, filters);

    // Add data headers
    const columns = customColumns;
    const headers = columns.map(col => col.header);
    worksheet.addRow(headers);

    // Add data rows
    data.forEach(row => {
      const rowData = columns.map(col => row[col.key] ?? '');
      worksheet.addRow(rowData);
    });

    // Style summary section
    if (data.length > 0) {
      const summaryStartRow = worksheet.rowCount - data.length - 6; // Adjust based on summary rows
      const summaryEndRow = worksheet.rowCount - data.length - 1;

      for (let i = summaryStartRow; i <= summaryEndRow; i++) {
        const row = worksheet.getRow(i);
        row.font = { bold: true };
        if (i === summaryStartRow) {
          // Summary header row
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1E3A8A' }
          };
          row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        } else if (i > summaryStartRow + 1) {
          // Summary data rows
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8F9FA' }
          };
        }
      }
    }

    // Style data headers
    const headerRow = worksheet.getRow(worksheet.rowCount - data.length);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 15;
    });

    await workbook.xlsx.writeFile(filePath);

    // Validate file was created
    if (!fs.existsSync(filePath)) {
      throw new Error('Failed to create Excel file');
    }

    return {
      fileName,
      filePath,
      tempDir: path.dirname(filePath),
      format: 'excel',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  }

  /**
   * Generate CSV export
   */
  async generateCSV(reportType, data, filters, filePath, customColumns = null) {
    const fileName = path.basename(filePath);
    const columns = customColumns;

    // Add metadata rows
    const metadataRows = [];
    this.addCSVMetadata(metadataRows, reportType, data, filters);

    // Add headers
    metadataRows.push(columns.map(col => col.header));

    // Add data rows
    const dataRows = data.map(row => columns.map(col => {
      const value = row[col.key] ?? '';
      return reportType === 'audit_events' && typeof value === 'string' && /^[=+@\t\r-]/.test(value)
        ? `'${value}`
        : value;
    }));

    const allRows = [...metadataRows, ...dataRows];
    const csv = Papa.unparse(allRows, { header: true });

    fs.writeFileSync(filePath, csv);

    // Validate file was created
    if (!fs.existsSync(filePath)) {
      throw new Error('Failed to create CSV file');
    }

    return {
      fileName,
      filePath,
      tempDir: path.dirname(filePath),
      format: 'csv',
      contentType: 'text/csv'
    };
  }

  /**
   * Generate print-friendly data
   */
  async generatePrint(reportType, data, filters, fileName, customColumns = null) {
    // For print format, we return the data as JSON with metadata
    // The frontend can handle the actual printing

    const printData = {
      reportType,
      title: this.getReportTitle(reportType),
      generatedAt: new Date().toISOString(),
      filters,
      columns: customColumns,
      data,
      totalRecords: data.length
    };

    return {
      fileName,
      format: 'print',
      contentType: 'application/json',
      data: printData
    };
  }

  /**
   * Add common metadata to Excel worksheet
   */
  addExcelMetadata(worksheet, reportType, data, filters) {
    // Add header
    worksheet.addRow([`${this.getReportTitle(reportType)} Report`]);
    worksheet.addRow([`Generated on: ${new Date().toLocaleDateString()}`]);
    worksheet.addRow([]);

    // Add filters info
    if (Object.keys(filters).length > 0) {
      worksheet.addRow(['Filters Applied:']);
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          worksheet.addRow([`${key}: ${value}`]);
        }
      });
      worksheet.addRow([]);
    }

    // Add summary section
    if (data.length > 0) {
      const summaryData = this.calculateSummaryData(reportType, data);

      // Add summary header
      worksheet.addRow(['Summary']);
      worksheet.addRow([]);

      // Add summary cards
      worksheet.addRow(['Total Records', summaryData.totalRecords]);
      if (summaryData.totalAmount > 0) {
        worksheet.addRow(['Total Amount', summaryData.formattedAmount]);
      }
      worksheet.addRow([]);
    }
  }

  /**
   * Add common metadata to CSV rows
   */
  addCSVMetadata(metadataRows, reportType, data, filters) {
    // Add header
    metadataRows.push([`${this.getReportTitle(reportType)} Report`]);
    metadataRows.push([`Generated on: ${new Date().toLocaleDateString()}`]);
    metadataRows.push([]);

    // Add filters info
    if (Object.keys(filters).length > 0) {
      metadataRows.push(['Filters Applied:']);
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          metadataRows.push([`${key}: ${value}`]);
        }
      });
      metadataRows.push([]);
    }

    // Add summary section
    if (data.length > 0) {
      const summaryData = this.calculateSummaryData(reportType, data);

      // Add summary header
      metadataRows.push(['Summary']);
      metadataRows.push([]);

      // Add summary cards
      metadataRows.push(['Total Records', summaryData.totalRecords]);
      if (summaryData.totalAmount > 0) {
        metadataRows.push(['Total Amount', summaryData.formattedAmount]);
      }
      metadataRows.push([]);
    }
  }

  /**
   * Generate filename for export
   */
  generateFileName(reportType, format) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const extension =
      format === 'csv' ? 'csv' : format === 'excel' ? 'xlsx' : format === 'pdf' ? 'pdf' : 'json';
    return `${reportType}_report_${timestamp}.${extension}`;
  }

  /**
   * Calculate summary data for reports
   */
  calculateSummaryData(reportType, data) {
    const totalRecords = data.length;
    let totalAmount = 0;
    let summaryLabel = 'TOTAL RECORDS';
    let amountLabel = 'TOTAL AMOUNT';

    // Calculate amount based on report type
    if (reportType === 'receipts') {
      totalAmount = data.reduce((sum, row) => sum + this.parseAmount(row.payment_amount), 0);
      summaryLabel = 'TOTAL RECEIPTS';
      amountLabel = 'TOTAL COLLECTED';
    } else if (reportType === 'fees') {
      totalAmount = data.reduce((sum, row) => sum + this.parseAmount(row.total_amount), 0);
      summaryLabel = 'TOTAL INVOICES';
      amountLabel = 'TOTAL FEES';
    } else if (reportType === 'students') {
      summaryLabel = 'TOTAL STUDENTS';
      amountLabel = 'TOTAL STUDENTS';
    } else if (reportType === 'attendance') {
      summaryLabel = 'TOTAL RECORDS';
      amountLabel = 'TOTAL RECORDS';
    } else if (reportType === 'transactions') {
      totalAmount = data.reduce((sum, row) => sum + this.parseAmount(row.amount), 0);
      summaryLabel = 'TOTAL TRANSACTIONS';
      amountLabel = 'TOTAL AMOUNT';
    }

    return {
      totalRecords,
      totalAmount,
      formattedAmount: this.formatCurrency(totalAmount),
      summaryLabel,
      amountLabel
    };
  }

  /**
   * Get report title
   */
  getReportTitle(reportType) {
    const titles = {
      receipts: 'Receipts',
      fees: 'Fee Invoices',
      students: 'Students',
      attendance: 'Attendance',
      library: 'Library Catalog',
      transactions: 'Accounting Transactions',
      homeworks: 'Homework Assignments',
      classwork: 'Classwork & Logbook',
      gate_passes: 'Gate Pass Register',
      visitors: 'Visitor Register',
      admission_enquiries: 'Admission Enquiries',
      audit_events: 'Audit Trail'
    };
    return titles[reportType] || reportType;
  }
}

module.exports = new UnifiedExportService();
