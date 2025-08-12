const exportService = require('../services/export.service');
const logger = require('../utils/logger');

/**
 * Generic Export Controller
 * Handles exports for all report types using the universal export service
 */
class ExportController {
  /**
   * Generic export method for any report type
   */
  async exportReport(req, res, next) {
    try {
      const { format = 'excel', reportType } = req.params;
      const { includeSummary = false, ...filters } = req.query;

      logger.info(`Export request received: ${reportType} in ${format} format`);

      // Validate report type
      if (!reportType) {
        return res.status(400).json({
          success: false,
          message: 'Report type is required'
        });
      }

      // Get report configuration and data
      const { config, data, summary } = await this.getReportData(reportType, filters, req.user);

      if (!data || data.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
          message: 'No data found for the specified filters'
        });
      }

      // Prepare export configuration
      const exportConfig = {
        ...config,
        generatedBy: req.user.name || req.user.email,
        filters: filters,
        summary: includeSummary === 'true' ? summary : null,
        options: {
          includeSummary: includeSummary === 'true',
          includeHeader: true,
          includeFooter: true,
          compression: true,
          locale: 'en-IN',
          currency: 'INR'
        }
      };

      // Generate export
      const exportData = await exportService.export(exportConfig, data, format);

      // Generate filename
      const filename = exportService.generateFilename(
        `${reportType}-report`,
        format
      );

      // Set response headers
      exportService.setDownloadHeaders(res, filename, format, exportData);

      // Send response
      res.send(exportData);

      logger.info(`Export completed: ${reportType} - ${data.length} records in ${format} format`);

    } catch (error) {
      logger.error(`Export failed for ${req.params.reportType}:`, error);
      return next(error);
    }
  }

  /**
   * Get report data based on report type
   */
  async getReportData(reportType, filters, user) {
    switch (reportType.toLowerCase()) {
      case 'students':
        return await this.getStudentReportData(filters, user);
      case 'fees':
      case 'fee-invoices':
        return await this.getFeeReportData(filters, user);
      case 'attendance':
        return await this.getAttendanceReportData(filters, user);
      case 'academic':
        return await this.getAcademicReportData(filters, user);
      case 'financial':
        return await this.getFinancialReportData(filters, user);
      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }
  }

  /**
   * Get student report data
   */
  async getStudentReportData(filters, user) {
    const { Student, Parent, Class, Section, Branch } = require('../models');
    const { Op } = require('sequelize');

    // Build where clause
    const whereClause = {};
    
    // Handle school_id filtering based on user role
    if (user.role === 'super_admin') {
      if (filters.school_id) {
        whereClause.school_id = filters.school_id;
      } else {
        return { config: {}, data: [], summary: {} };
      }
    } else {
      whereClause.school_id = user.school_id;
    }

    if (filters.status) whereClause.status = filters.status;
    if (filters.class_id) whereClause.class_id = filters.class_id;
    if (filters.section_id) whereClause.section_id = filters.section_id;
    if (filters.branch_id) whereClause.branch_id = filters.branch_id;

    // Handle date filters
    if (filters.date_from || filters.date_to) {
      whereClause.admission_date = {};
      if (filters.date_from) whereClause.admission_date[Op.gte] = filters.date_from;
      if (filters.date_to) whereClause.admission_date[Op.lte] = filters.date_to;
    }

    // Handle search
    if (filters.search) {
      whereClause[Op.or] = [
        { first_name: { [Op.iLike]: `%${filters.search}%` } },
        { last_name: { [Op.iLike]: `%${filters.search}%` } },
        { admission_number: { [Op.iLike]: `%${filters.search}%` } },
        { email: { [Op.iLike]: `%${filters.search}%` } }
      ];
    }

    // Get students with related data
    const students = await Student.findAll({
      where: whereClause,
      include: [
        {
          model: Parent,
          as: 'parents',
          through: { attributes: [] },
          attributes: ['guardian_name', 'guardian_phone', 'guardian_email', 'guardian_relation'],
        },
        {
          model: Class,
          as: 'class',
          attributes: ['name']
        },
        {
          model: Section,
          as: 'section',
          attributes: ['name']
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['name']
        }
      ],
      order: [['created_at', 'DESC']],
    });

    // Transform data for export
    const exportData = students.map(student => ({
      'Admission Number': student.admission_number || 'N/A',
      'Student Name': `${student.first_name || ''} ${student.last_name || ''}`.trim(),
      'Email': student.email || 'N/A',
      'Phone': student.phone || 'N/A',
      'Class': student.class?.name || 'N/A',
      'Section': student.section?.name || 'N/A',
      'Branch': student.branch?.name || 'N/A',
      'Admission Date': student.admission_date ? new Date(student.admission_date).toLocaleDateString('en-IN') : 'N/A',
      'Status': student.status || 'N/A',
      'Gender': student.gender || 'N/A',
      'Date of Birth': student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('en-IN') : 'N/A',
      'Address': student.address || 'N/A',
      'City': student.city || 'N/A',
      'State': student.state || 'N/A',
      'Pincode': student.pincode || 'N/A',
      'Guardian Name': student.parents?.[0]?.guardian_name || 'N/A',
      'Guardian Phone': student.parents?.[0]?.guardian_phone || 'N/A',
      'Guardian Email': student.parents?.[0]?.guardian_email || 'N/A',
      'Created Date': new Date(student.created_at).toLocaleDateString('en-IN')
    }));

    // Calculate summary
    const summary = {
      'Total Students': students.length,
      'Active Students': students.filter(s => s.status === 'active').length,
      'Inactive Students': students.filter(s => s.status === 'inactive').length,
      'Male Students': students.filter(s => s.gender === 'male').length,
      'Female Students': students.filter(s => s.gender === 'female').length
    };

    // Export configuration
    const config = {
      title: 'Student Report',
      description: 'Complete student information report',
      sheetName: 'Students',
      columns: [
        { key: 'Admission Number', label: 'Admission Number', type: 'text' },
        { key: 'Student Name', label: 'Student Name', type: 'text' },
        { key: 'Email', label: 'Email', type: 'text' },
        { key: 'Phone', label: 'Phone', type: 'text' },
        { key: 'Class', label: 'Class', type: 'text' },
        { key: 'Section', label: 'Section', type: 'text' },
        { key: 'Branch', label: 'Branch', type: 'text' },
        { key: 'Admission Date', label: 'Admission Date', type: 'date' },
        { key: 'Status', label: 'Status', type: 'text' },
        { key: 'Gender', label: 'Gender', type: 'text' },
        { key: 'Date of Birth', label: 'Date of Birth', type: 'date' },
        { key: 'Address', label: 'Address', type: 'text' },
        { key: 'City', label: 'City', type: 'text' },
        { key: 'State', label: 'State', type: 'text' },
        { key: 'Pincode', label: 'Pincode', type: 'text' },
        { key: 'Guardian Name', label: 'Guardian Name', type: 'text' },
        { key: 'Guardian Phone', label: 'Guardian Phone', type: 'text' },
        { key: 'Guardian Email', label: 'Guardian Email', type: 'text' },
        { key: 'Created Date', label: 'Created Date', type: 'date' }
      ]
    };

    return { config, data: exportData, summary };
  }

  /**
   * Get fee report data
   */
  async getFeeReportData(filters, user) {
    const { FeeInvoice, Student, FeeStructure, FeeType } = require('../models');
    const { Op } = require('sequelize');

    // Build where clause
    const whereClause = {};
    
    // Handle school_id filtering based on user role
    if (user.role === 'super_admin') {
      if (filters.school_id) {
        whereClause.school_id = filters.school_id;
      }
    } else {
      whereClause.school_id = user.school_id;
    }

    if (filters.status) whereClause.status = filters.status;
    if (filters.branch_id) whereClause.branch_id = filters.branch_id;
    if (filters.payment_method) whereClause.payment_method = filters.payment_method;

    // Handle date filters - support both from_date/to_date and fromDate/toDate
    const fromDate = filters.from_date || filters.fromDate;
    const toDate = filters.to_date || filters.toDate;
    
    if (fromDate || toDate) {
      whereClause[Op.or] = [
        {
          created_at: {}
        },
        {
          due_date: {}
        }
      ];
      
      if (fromDate) {
        whereClause[Op.or][0].created_at[Op.gte] = fromDate;
        whereClause[Op.or][1].due_date[Op.gte] = fromDate;
      }
      if (toDate) {
        whereClause[Op.or][0].created_at[Op.lte] = toDate;
        whereClause[Op.or][1].due_date[Op.lte] = toDate;
      }
    }

    // Build include clause for student with filters
    const studentWhereClause = {};
    
    if (filters.student_search) {
      studentWhereClause[Op.or] = [
        { first_name: { [Op.iLike]: `%${filters.student_search}%` } },
        { last_name: { [Op.iLike]: `%${filters.student_search}%` } },
        { admission_number: { [Op.iLike]: `%${filters.student_search}%` } }
      ];
    }
    
    if (filters.class_id) {
      // Handle class filtering - could be class_id or class_name
      const { Class } = require('../models');
      const classRecord = await Class.findByPk(filters.class_id);
      if (classRecord) {
        studentWhereClause.current_class = classRecord.name;
      }
    }
    
    if (filters.section_id) {
      // Handle section filtering - could be section_id or section_name
      const { Section } = require('../models');
      const sectionRecord = await Section.findByPk(filters.section_id);
      if (sectionRecord) {
        studentWhereClause.section = sectionRecord.name;
      }
    }
    
    if (filters.stream_id) {
      // Handle stream filtering
      const { Stream } = require('../models');
      const streamRecord = await Stream.findByPk(filters.stream_id);
      if (streamRecord) {
        studentWhereClause.stream = streamRecord.name;
      }
    }

    // Get invoices with related data
    const invoices = await FeeInvoice.findAll({
      where: whereClause,
      include: [
        {
          model: Student,
          as: 'student',
          where: Object.keys(studentWhereClause).length > 0 ? studentWhereClause : undefined,
          attributes: ['first_name', 'last_name', 'admission_number', 'current_class', 'section', 'stream']
        },
        {
          model: FeeStructure,
          as: 'feeStructure',
          include: [{
            model: FeeType,
            as: 'feeType',
            attributes: ['name']
          }]
        }
      ],
      order: [['created_at', 'DESC']],
    });

    // Transform data for export
    const exportData = invoices.map(invoice => ({
      'Invoice Number': invoice.invoice_number || invoice.id,
      'Student Name': invoice.student ? `${invoice.student.first_name || ''} ${invoice.student.last_name || ''}`.trim() : 'N/A',
      'Admission Number': invoice.student?.admission_number || 'N/A',
      'Roll Number': invoice.student?.roll_number || 'N/A',
      'Class': invoice.student?.current_class || 'N/A',
      'Section': invoice.student?.section || 'N/A',
      'Stream': invoice.student?.stream || 'N/A',
      'Fee Type': invoice.feeStructure?.feeType?.name || 'N/A',
      'Total Amount': parseFloat(invoice.total_amount || 0).toFixed(2),
      'Paid Amount': parseFloat(invoice.paid_amount || 0).toFixed(2),
      'Balance Amount': parseFloat(invoice.balance_amount || 0).toFixed(2),
      'Due Date': invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-IN') : 'N/A',
      'Status': invoice.status || 'N/A',
      'Payment Method': invoice.payment_method || 'N/A',
      'Invoice Date': invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('en-IN') : 'N/A',
      'Created Date': new Date(invoice.created_at).toLocaleDateString('en-IN'),
      'Last Updated': new Date(invoice.updated_at).toLocaleDateString('en-IN')
    }));

    // Calculate summary
    const totalAmount = invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + parseFloat(inv.paid_amount || 0), 0);
    const totalPending = invoices.reduce((sum, inv) => sum + parseFloat(inv.balance_amount || 0), 0);

    const summary = {
      'Total Invoices': invoices.length,
      'Total Amount': `₹${totalAmount.toFixed(2)}`,
      'Total Collected': `₹${totalPaid.toFixed(2)}`,
      'Total Pending': `₹${totalPending.toFixed(2)}`,
      'Collection Rate': `${totalAmount > 0 ? ((totalPaid / totalAmount) * 100).toFixed(2) : 0}%`
    };

    // Export configuration
    const config = {
      title: 'Fee Collection Report',
      description: 'Complete fee collection and invoice report',
      sheetName: 'Fee Invoices',
      columns: [
        { key: 'Invoice Number', label: 'Invoice Number', type: 'text' },
        { key: 'Student Name', label: 'Student Name', type: 'text' },
        { key: 'Admission Number', label: 'Admission Number', type: 'text' },
        { key: 'Roll Number', label: 'Roll Number', type: 'text' },
        { key: 'Class', label: 'Class', type: 'text' },
        { key: 'Section', label: 'Section', type: 'text' },
        { key: 'Stream', label: 'Stream', type: 'text' },
        { key: 'Fee Type', label: 'Fee Type', type: 'text' },
        { key: 'Total Amount', label: 'Total Amount', type: 'currency' },
        { key: 'Paid Amount', label: 'Paid Amount', type: 'currency' },
        { key: 'Balance Amount', label: 'Balance Amount', type: 'currency' },
        { key: 'Due Date', label: 'Due Date', type: 'date' },
        { key: 'Status', label: 'Status', type: 'text' },
        { key: 'Payment Method', label: 'Payment Method', type: 'text' },
        { key: 'Invoice Date', label: 'Invoice Date', type: 'date' },
        { key: 'Created Date', label: 'Created Date', type: 'date' },
        { key: 'Last Updated', label: 'Last Updated', type: 'date' }
      ]
    };

    return { config, data: exportData, summary };
  }

  /**
   * Get attendance report data (placeholder for future implementation)
   */
  async getAttendanceReportData(filters, user) {
    // Placeholder for attendance report
    return {
      config: {
        title: 'Attendance Report',
        description: 'Student attendance report',
        sheetName: 'Attendance',
        columns: []
      },
      data: [],
      summary: {}
    };
  }

  /**
   * Get academic report data (placeholder for future implementation)
   */
  async getAcademicReportData(filters, user) {
    // Placeholder for academic report
    return {
      config: {
        title: 'Academic Report',
        description: 'Academic performance report',
        sheetName: 'Academic',
        columns: []
      },
      data: [],
      summary: {}
    };
  }

  /**
   * Get financial report data (placeholder for future implementation)
   */
  async getFinancialReportData(filters, user) {
    // Placeholder for financial report
    return {
      config: {
        title: 'Financial Report',
        description: 'Financial summary report',
        sheetName: 'Financial',
        columns: []
      },
      data: [],
      summary: {}
    };
  }
}

module.exports = new ExportController();
