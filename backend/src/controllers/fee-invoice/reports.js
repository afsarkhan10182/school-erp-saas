const { FeeInvoice, FeeStructure, FeeType, Student, Parent, School, FeePayment, Branch } = require('../../models');
const ApiError = require('../../utils/ApiError');
const { logger } = require('../../utils/logger');
const { Op } = require('sequelize');

// Get fee collection summary
const getFeeCollectionSummary = async (req, res, next) => {
  try {
    const { academic_year, class_name, start_date, end_date } = req.query;

    const whereClause = {
      school_id: req.schoolId,
    };

    if (academic_year) whereClause.academic_year = academic_year;
    if (start_date && end_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)],
      };
    }

    const includeClause = [];
    if (class_name) {
      includeClause.push({
        model: Student,
        as: 'student',
        where: { current_class: class_name },
        attributes: [],
      });
    }

    // Get summary statistics
    const totalInvoices = await FeeInvoice.count({
      where: whereClause,
      include: includeClause,
    });

    const paidInvoices = await FeeInvoice.count({
      where: { ...whereClause, status: 'paid' },
      include: includeClause,
    });

    const overdueInvoices = await FeeInvoice.count({
      where: { ...whereClause, status: 'overdue' },
      include: includeClause,
    });

    const partialPaidInvoices = await FeeInvoice.count({
      where: { ...whereClause, status: 'partial_paid' },
      include: includeClause,
    });

    // Get amount statistics
    const amountStats = await FeeInvoice.findAll({
      where: whereClause,
      include: includeClause,
      attributes: [
        [FeeInvoice.sequelize.fn('SUM', FeeInvoice.sequelize.col('total_amount')), 'total_amount'],
        [FeeInvoice.sequelize.fn('SUM', FeeInvoice.sequelize.col('paid_amount')), 'total_paid'],
        [FeeInvoice.sequelize.fn('SUM', FeeInvoice.sequelize.col('balance_amount')), 'total_balance'],
      ],
      raw: true,
    });

    const summary = {
      invoice_counts: {
        total: totalInvoices,
        paid: paidInvoices,
        overdue: overdueInvoices,
        partial_paid: partialPaidInvoices,
        pending: totalInvoices - paidInvoices - overdueInvoices - partialPaidInvoices,
      },
      amounts: {
        total_amount: parseFloat(amountStats[0]?.total_amount || 0),
        total_paid: parseFloat(amountStats[0]?.total_paid || 0),
        total_balance: parseFloat(amountStats[0]?.total_balance || 0),
        collection_percentage: totalInvoices > 0 
          ? ((paidInvoices / totalInvoices) * 100).toFixed(2)
          : 0,
      },
    };

    return res.status(200).json({ success: true, data: summary });
  } catch (error) {
    logger.error('Error fetching fee collection summary:', error);
    return next(error);
  }
};

// Generate report with filtering, pagination, and sorting options
// Export fee invoice report in Excel or CSV format (legacy - replaced by new implementation)
const exportFeeInvoicesReportLegacy = async (req, res, next) => {
  try {
    const format = req.query.format || 'csv';
    const invoices = await FeeInvoice.findAll({
      where: {
        school_id: req.schoolId,
      },
      include: [
        {
          model: Student,
          as: 'student',
        },
        {
          model: FeeStructure,
          as: 'feeStructure',
          include: [
            {
              model: FeeType,
              as: 'feeType',
            },
          ],
        },
      ],
    });

    // Process and convert invoices data to desired format
    let data;
    if (format === 'excel') {
      // Convert to Excel format
      data = convertToExcel(invoices); // Assume convertToExcel is a utility function
    } else {
      // Convert to CSV format
      data = convertToCSV(invoices); // Assume convertToCSV is a utility function
    }

    res.setHeader('Content-disposition', `attachment; filename=fee_invoices.${format}`);
    res.set('Content-Type', `text/${format}`);
    res.send(data);
  } catch (error) {
    logger.error('Error exporting fee invoices:', error);
    return next(error);
  }
};

// GET endpoint to retrieve fee invoice report with pagination and filtering
const getFeeInvoiceReport = async (req, res, next) => {
  try {
    logger.debug('getFeeInvoiceReport: Request received', {
      userRole: req.user?.role,
      userSchoolId: req.user?.school_id,
      schoolId: req.schoolId,
      query: req.query
    });

    const { page = 1, limit = 10, search, status, class_name, section, from_date, to_date } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {
      school_id: req.schoolId,
    };

    if (status) whereClause.status = status;
    if (from_date && to_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(from_date), new Date(to_date)],
      };
    }

    logger.debug('getFeeInvoiceReport: Query parameters', {
      whereClause,
      page,
      limit,
      offset
    });

    const includeClause = [
      {
        model: Student,
        as: 'student',
        where: {},
      },
      {
        model: FeeStructure,
        as: 'feeStructure',
        include: [
          {
            model: FeeType,
            as: 'feeType',
          },
        ],
      },
    ];

    // Add student filters
    if (search) {
      includeClause[0].where[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { 
          admission_number: { 
            [Op.and]: [
              { [Op.not]: null },
              { [Op.iLike]: `%${search}%` }
            ]
          } 
        },
      ];
    }
    if (class_name) includeClause[0].where.current_class = class_name;
    if (section) includeClause[0].where.section = section;

    const { count, rows: invoices } = await FeeInvoice.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    return res.status(200).json({
      success: true,
      data: {
        invoices,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_records: count,
          per_page: parseInt(limit),
          has_next: parseInt(page) < totalPages,
          has_prev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching fee invoice report:', error);
    return next(error);
  }
};

// GET endpoint to export fee invoices report
const exportFeeInvoicesReport = async (req, res, next) => {
  try {
    const { format = 'csv', search, status, class_name, section, from_date, to_date } = req.query;

    const whereClause = {
      school_id: req.schoolId,
    };

    if (status) whereClause.status = status;
    if (from_date && to_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(from_date), new Date(to_date)],
      };
    }

    const includeClause = [
      {
        model: Student,
        as: 'student',
        where: {},
      },
      {
        model: FeeStructure,
        as: 'feeStructure',
        include: [
          {
            model: FeeType,
            as: 'feeType',
          },
        ],
      },
    ];

    // Add student filters
    if (search) {
      includeClause[0].where[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { 
          admission_number: { 
            [Op.and]: [
              { [Op.not]: null },
              { [Op.iLike]: `%${search}%` }
            ]
          } 
        },
      ];
    }
    if (class_name) includeClause[0].where.current_class = class_name;
    if (section) includeClause[0].where.section = section;

    const invoices = await FeeInvoice.findAll({
      where: whereClause,
      include: includeClause,
      order: [['created_at', 'DESC']],
    });

    // Convert to export format
    const exportData = invoices.map(invoice => ({
      'Invoice Number': invoice.invoice_number,
      'Student Name': invoice.student ? `${invoice.student.first_name} ${invoice.student.last_name}` : 'N/A',
      'Admission Number': invoice.student?.admission_number || 'N/A',
      'Class': invoice.student?.current_class || 'N/A',
      'Section': invoice.student?.section || 'N/A',
      'Amount': invoice.amount,
      'Paid Amount': invoice.paid_amount,
      'Balance': invoice.balance_amount,
      'Due Date': invoice.due_date,
      'Status': invoice.status,
      'Created At': invoice.created_at,
      'Updated At': invoice.updated_at,
    }));

    if (format === 'csv') {
      // Generate CSV
      const csvHeaders = Object.keys(exportData[0] || {});
      const csvRows = exportData.map(row => 
        csvHeaders.map(header => {
          const value = row[header];
          // Handle null/undefined values and escape quotes
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
            ? `"${stringValue.replace(/"/g, '""')}"`
            : stringValue;
        }).join(',')
      );
      
      const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="fee-invoices-report-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="fee-invoices-report-${new Date().toISOString().split('T')[0]}.json"`);
      res.json({
        success: true,
        data: exportData,
        exported_at: new Date().toISOString(),
        total_records: exportData.length,
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid export format. Supported formats: csv, json',
      });
    }
  } catch (error) {
    logger.error('Error exporting fee invoices report:', error);
    return next(error);
  }
};

// Get fee collection statistics
const getFeeStats = async (req, res, next) => {
  try {
    logger.debug('getFeeStats: Request received', {
      userRole: req.user?.role,
      userSchoolId: req.user?.school_id,
      schoolId: req.schoolId,
      query: req.query
    });

    const { academic_year, class_name } = req.query;
    
    const whereClause = {
      school_id: req.schoolId,
    };

    if (academic_year) whereClause.academic_year = academic_year;

    const includeClause = [];
    if (class_name) {
      includeClause.push({
        model: Student,
        as: 'student',
        where: { current_class: class_name },
        attributes: [],
      });
    }

    logger.debug('getFeeStats: Query parameters', {
      whereClause,
      includeClause: includeClause.length
    });

    // Get summary statistics
    const [totalInvoices, paidInvoices, overdueInvoices, partialPaidInvoices] = await Promise.all([
      FeeInvoice.count({
        where: whereClause,
        include: includeClause,
      }),
      FeeInvoice.count({
        where: { ...whereClause, status: 'paid' },
        include: includeClause,
      }),
      FeeInvoice.count({
        where: { ...whereClause, status: 'overdue' },
        include: includeClause,
      }),
      FeeInvoice.count({
        where: { ...whereClause, status: 'partial_paid' },
        include: includeClause,
      }),
    ]);

    // Get amount statistics
    const amountStats = await FeeInvoice.findAll({
      where: whereClause,
      include: includeClause,
      attributes: [
        [FeeInvoice.sequelize.fn('SUM', FeeInvoice.sequelize.col('total_amount')), 'total_amount'],
        [FeeInvoice.sequelize.fn('SUM', FeeInvoice.sequelize.col('paid_amount')), 'total_paid'],
        [FeeInvoice.sequelize.fn('SUM', FeeInvoice.sequelize.col('balance_amount')), 'total_balance'],
      ],
      raw: true,
    });

    const stats = amountStats[0] || {};

    return res.status(200).json({
      success: true,
      data: {
        totalInvoices,
        paidInvoices,
        overdueInvoices,
        partialPaidInvoices,
        totalAmount: parseFloat(stats.total_amount || 0),
        totalPaid: parseFloat(stats.total_paid || 0),
        totalBalance: parseFloat(stats.total_balance || 0),
        totalLateFees: parseFloat(stats.total_late_fees || 0),
        collectionRate: stats.total_amount ? ((stats.total_paid / stats.total_amount) * 100).toFixed(2) : 0,
      },
    });
  } catch (error) {
    logger.error('Error fetching fee stats:', error);
    return next(error);
  }
};

module.exports = {
  getFeeCollectionSummary,
  exportFeeInvoicesReportLegacy,
  getFeeInvoiceReport,
  exportFeeInvoicesReport,
  getFeeStats,
}; 