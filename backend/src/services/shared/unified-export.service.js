const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Papa = require('papaparse');
const fs = require('fs');
const path = require('path');

const { resolveUploadsPath } = require('~/utils/shared/pathHelper');

class UnifiedExportService {
  constructor() {
    this.supportedFormats = ['pdf', 'excel', 'csv', 'print'];
    this.supportedReportTypes = ['receipts', 'fees', 'students', 'attendance'];
  }

  // Helper function to parse amount values consistently
  parseAmount(value) {
    return parseFloat(String(value || 0).replace(/[₹,]/g, '')) || 0;
  }

  // Helper function to format currency consistently
  formatCurrency(amount) {
    return `Rs. ${this.parseAmount(amount).toLocaleString('en-IN')}`;
  }

  // Helper function to build common where clause
  buildWhereClause(filters, user, schoolId) {
    const whereClause = {};

    // Add school_id filter
    if (schoolId && user.role !== 'super_admin') {
      whereClause.school_id = schoolId;
    }

    // Add branch filter for branch admins
    if (user.role === 'branch_admin') {
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

      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }
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

    // Branch filter (override if provided in filters)
    if (filters.branch_id && filters.branch_id !== '') {
      whereClause.branch_id = filters.branch_id;
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
      where: whereClause,
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
    const { FeeInvoice, Student, FeeStructure, FeeType } = require('~/models');
    const { Op } = require('sequelize');

    // Handle monthly payments differently
    if (filters.payment_model === 'monthly' && filters.months && filters.months.length > 0) {
      return await this.getMonthlyFeesData(filters, user, schoolId);
    }

    // Build where clause using helper
    const whereClause = this.buildWhereClause(filters, user, schoolId);

    if (filters.status) whereClause.status = filters.status;

    // Add payment model filter
    if (filters.payment_model) {
      whereClause.payment_model = filters.payment_model;
    }

    // Add date filters for invoice_date or due_date
    if (filters.from_date && filters.to_date) {
      whereClause[Op.or] = [
        { invoice_date: { [Op.between]: [filters.from_date, filters.to_date] } },
        { due_date: { [Op.between]: [filters.from_date, filters.to_date] } }
      ];
    }

    const invoices = await FeeInvoice.findAll({
      where: whereClause,
      include: [
        {
          model: Student,
          as: 'student',
          where: {}
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
        }
      ],
      order: [['invoice_date', 'DESC']]
    });

    return invoices.map(invoice => ({
      invoice_number: invoice.invoice_number,
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date,
      total_amount: invoice.total_amount,
      paid_amount: invoice.paid_amount,
      remaining_amount: invoice.remaining_amount,
      status: invoice.status,
      student_name: `${invoice.student.first_name} ${invoice.student.last_name}`.trim(),
      admission_number: invoice.student.admission_number,
      class: invoice.student.current_class,
      section: invoice.student.section,
      branch: invoice.student.branch?.name || '',
      fee_type: invoice.feeStructure.feeType.name
    }));
  }

  /**
   * Get monthly fees data for export
   */
  async getMonthlyFeesData(filters, user, schoolId) {
    const { FeeInvoice, Student, FeeStructure, FeeType, FeePayment } = require('~/models');
    const { Op } = require('sequelize');

    // Parse months parameter - handle both array and comma-separated string formats
    let monthsArray = [];
    if (filters.months) {
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
      school_id: schoolId,
      payment_model: 'monthly',
      month: {
        [Op.in]: monthsArray
      },
      year: currentYear
    };

    // Handle branch filtering
    if (user.role === 'branch_admin') {
      whereClause.branch_id = user.branch_id;
    } else if (filters.branch_id) {
      whereClause.branch_id = filters.branch_id;
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
    if (filters.class_id) studentWhereClause.current_class = filters.class_id;
    if (filters.section_id) studentWhereClause.section = filters.section_id;
    if (filters.stream_id) studentWhereClause.stream = filters.stream_id;

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
          order: [['created_at', 'DESC']],
          limit: 5
        }
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
            remaining_amount: monthData.balance,
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
            branch: studentData.student.branch?.name || '',
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
    const { Student, Parent } = require('~/models');

    // Build where clause using helper
    const whereClause = this.buildWhereClause(filters, user, schoolId);

    // Add school_id filter if provided in filters
    if (filters.school_id) {
      whereClause.school_id = filters.school_id;
    }

    if (filters.academic_year) whereClause.academic_year = filters.academic_year;
    if (filters.class_name) whereClause.current_class = filters.class_name;
    if (filters.section_name) whereClause.section = filters.section_name;
    if (filters.status) whereClause.status = filters.status;

    const students = await Student.findAll({
      where: whereClause,
      include: [
        {
          model: Parent,
          as: 'parents',
          through: { attributes: [] },
          attributes: ['guardian_name', 'guardian_phone', 'guardian_email', 'guardian_relation']
        }
      ],
      order: [['created_at', 'DESC']]
    });

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

    switch (format) {
      case 'pdf':
        return await this.generatePDF(reportType, data, filters, fileName, customColumns);

      case 'excel':
        return await this.generateExcel(reportType, data, filters, fileName, customColumns);

      case 'csv':
        return await this.generateCSV(reportType, data, filters, fileName, customColumns);

      case 'print':
        return await this.generatePrint(reportType, data, filters, fileName, customColumns);

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Generate PDF export with professional styling
   */
  async generatePDF(reportType, data, filters, fileName, customColumns = null) {
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      layout: 'portrait'
    });
    const filePath = path.join(resolveUploadsPath(), fileName);
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
      const tableWidth = 520; // Increased table width for better column distribution

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
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }

        // Calculate row height based on content - use consistent height for better appearance
        const rowHeight = 20; // Fixed row height for consistency

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
  async generateExcel(reportType, data, filters, fileName, customColumns = null) {
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
      const rowData = columns.map(col => row[col.key] || '');
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

    const filePath = path.join(resolveUploadsPath(), fileName);
    await workbook.xlsx.writeFile(filePath);

    // Validate file was created
    if (!fs.existsSync(filePath)) {
      throw new Error('Failed to create Excel file');
    }

    return {
      fileName,
      filePath,
      format: 'excel',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  }

  /**
   * Generate CSV export
   */
  async generateCSV(reportType, data, filters, fileName, customColumns = null) {
    const columns = customColumns;

    // Add metadata rows
    const metadataRows = [];
    this.addCSVMetadata(metadataRows, reportType, data, filters);

    // Add headers
    metadataRows.push(columns.map(col => col.header));

    // Add data rows
    const dataRows = data.map(row => columns.map(col => row[col.key] || ''));

    const allRows = [...metadataRows, ...dataRows];
    const csv = Papa.unparse(allRows, { header: true });

    const filePath = path.join(resolveUploadsPath(), fileName);
    fs.writeFileSync(filePath, csv);

    // Validate file was created
    if (!fs.existsSync(filePath)) {
      throw new Error('Failed to create CSV file');
    }

    return {
      fileName,
      filePath,
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

    const filePath = path.join(resolveUploadsPath(), fileName);
    fs.writeFileSync(filePath, JSON.stringify(printData, null, 2));

    return {
      fileName,
      filePath,
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
      attendance: 'Attendance'
    };
    return titles[reportType] || reportType;
  }
}

module.exports = new UnifiedExportService();
