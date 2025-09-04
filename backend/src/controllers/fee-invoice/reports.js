const { FeeInvoice, FeeStructure, FeeType, Student, Parent, School, FeePayment, Branch } = require('../../models');
const ApiError = require('../../utils/ApiError');
const { logger } = require('../../utils/logger');
const { Op } = require('sequelize');
const XLSX = require('xlsx');
const { createDateRange } = require('../../utils/dateUtils');

// Helper function to get student full name
const getStudentFullName = (student) => {
  const firstName = student.first_name || '';
  const lastName = student.last_name || '';
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  } else if (firstName) {
    return firstName;
  } else if (lastName) {
    return lastName;
  } else {
    return 'Unknown Student';
  }
};

// Get fee collection summary
const getFeeCollectionSummary = async (req, res, next) => {
  try {
    const { academic_year, class_name, from_date, to_date, status, branch_id, search, section, payment_model, months } = req.query;

    const whereClause = {
      school_id: req.schoolId,
    };

    // Handle branch filtering based on user role
    if (req.user.role === 'branch_admin') {
      // Branch admin can only see invoices for their assigned branch
      whereClause.branch_id = req.user.branch_id;
    } else if (branch_id) {
      // If specific branch is selected
      whereClause.branch_id = branch_id;
    }

    if (academic_year) whereClause.academic_year = academic_year;
    if (status) whereClause.status = status;
    
    // Add payment model filtering
    if (payment_model) {
      whereClause.payment_model = payment_model;
    }
    
    // Add months filtering for monthly payments
    if (payment_model === 'monthly' && months && months.length > 0) {
      // Convert months to array if it's a string
      const monthsArray = Array.isArray(months) ? months : months.split(',').map(m => parseInt(m.trim()));
      whereClause.month = {
        [Op.in]: monthsArray
      };
    }
    
    if (from_date && to_date) {
      const { fromDateTime, toDateTime } = createDateRange(from_date, to_date);
      whereClause.created_at = {
        [Op.between]: [fromDateTime, toDateTime],
      };
    }



    // Build a subquery for student filtering
    let studentSubquery = null;
    if (search || class_name || section) {
      const studentWhereClause = {};
      if (search) {
        studentWhereClause[Op.or] = [
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
      if (class_name) studentWhereClause.current_class = class_name;
      if (section) studentWhereClause.section = section;
      
      // Handle student branch filtering based on user role
      if (req.user.role === 'branch_admin') {
        studentWhereClause.branch_id = req.user.branch_id;
      }

      studentSubquery = {
        model: Student,
        as: 'student',
        where: studentWhereClause,
        attributes: [],
      };
    }

    // Get summary statistics
    const totalInvoices = await FeeInvoice.count({
      where: whereClause,
      include: studentSubquery ? [studentSubquery] : [],
    });

    const paidInvoices = await FeeInvoice.count({
      where: { ...whereClause, status: 'paid' },
      include: studentSubquery ? [studentSubquery] : [],
    });

    const overdueInvoices = await FeeInvoice.count({
      where: { ...whereClause, status: 'overdue' },
      include: studentSubquery ? [studentSubquery] : [],
    });

    const partialPaidInvoices = await FeeInvoice.count({
      where: { ...whereClause, status: 'partial_paid' },
      include: studentSubquery ? [studentSubquery] : [],
    });

    // Get amount statistics - use separate query without include to avoid GROUP BY issues
    const amountStats = await FeeInvoice.findAll({
      where: whereClause,
      include: studentSubquery ? [studentSubquery] : [],
      attributes: [
        [FeeInvoice.sequelize.fn('SUM', FeeInvoice.sequelize.col('total_amount')), 'total_amount'],
        [FeeInvoice.sequelize.fn('SUM', FeeInvoice.sequelize.col('paid_amount')), 'total_paid'],
        [FeeInvoice.sequelize.fn('SUM', FeeInvoice.sequelize.col('balance_amount')), 'total_balance'],
      ],
      raw: true,
    });

    const totalAmount = parseFloat(amountStats[0]?.total_amount || 0);
    const totalPaid = parseFloat(amountStats[0]?.total_paid || 0);
    const totalBalance = parseFloat(amountStats[0]?.total_balance || 0);

    const summary = {
      totalAmount,
      totalCollected: totalPaid,
      totalPending: totalBalance,
      collectionRate: totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0,
      totalInvoices
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

    const { page = 1, limit = 10, search, status, class_name, section, from_date, to_date, branch_id, payment_model, months } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {
      school_id: req.schoolId,
    };

    // Handle branch filtering based on user role
    if (req.user.role === 'branch_admin') {
      // Branch admin can only see invoices for their assigned branch
      whereClause.branch_id = req.user.branch_id;
    } else if (branch_id) {
      // If specific branch is selected
      whereClause.branch_id = branch_id;
    }

    if (status) whereClause.status = status;
    
    // Add payment model filtering
    if (payment_model) {
      whereClause.payment_model = payment_model;
    }
    
    // Add months filtering for monthly payments
    if (payment_model === 'monthly' && months && months.length > 0) {
      // Convert months to array if it's a string
      const monthsArray = Array.isArray(months) ? months : months.split(',').map(m => parseInt(m.trim()));
      whereClause.month = {
        [Op.in]: monthsArray
      };
    }
    
    if (from_date && to_date) {
      const { fromDateTime, toDateTime } = createDateRange(from_date, to_date);
      
      // Filter by both invoice_date and due_date to capture all relevant invoices
      whereClause[Op.or] = [
        {
          invoice_date: {
            [Op.between]: [fromDateTime, toDateTime],
          }
        },
        {
          due_date: {
            [Op.between]: [fromDateTime, toDateTime],
          }
        }
      ];
    }

    logger.debug('getFeeInvoiceReport: Query parameters', {
      whereClause,
      page,
      limit,
      offset,
      payment_model,
      months
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
    
    // Handle student branch filtering based on user role
    if (req.user.role === 'branch_admin') {
      // Branch admin can only see students from their assigned branch
      includeClause[0].where.branch_id = req.user.branch_id;
    }

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
    const { format = 'excel', search, status, class_name, section, from_date, to_date, branch_id, report_type, columns } = req.query;

    const whereClause = {
      school_id: req.schoolId,
    };

    // Handle branch filtering based on user role
    if (req.user.role === 'branch_admin') {
      // Branch admin can only see invoices for their assigned branch
      whereClause.branch_id = req.user.branch_id;
    } else if (branch_id) {
      // If specific branch is selected
      whereClause.branch_id = branch_id;
    }

    if (status) whereClause.status = status;
    if (from_date && to_date) {
      const { fromDateTime, toDateTime } = createDateRange(from_date, to_date);
      
      // Filter by both invoice_date and due_date to capture all relevant invoices
      whereClause[Op.or] = [
        {
          invoice_date: {
            [Op.between]: [fromDateTime, toDateTime],
          }
        },
        {
          due_date: {
            [Op.between]: [fromDateTime, toDateTime],
          }
        }
      ];
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
    
    // Handle student branch filtering based on user role
    if (req.user.role === 'branch_admin') {
      // Branch admin can only see students from their assigned branch
      includeClause[0].where.branch_id = req.user.branch_id;
    }

    // Handle different report types
    let exportData = [];
    
    if (report_type === 'receipts') {
      // Export receipts report - use same logic as getReceiptsReport
      const allPayments = await FeePayment.findAll({
        where: whereClause,
        include: [
          {
            model: FeeInvoice,
            as: 'invoice',
            include: [
              {
                model: Student,
                as: 'student',
                where: includeClause[0].where,
                include: [
                  {
                    model: Branch,
                    as: 'branch',
                    attributes: ['id', 'name', 'code'],
                  },
                ],
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
          },
        ],
        order: [['payment_date', 'DESC']],
      });

      // Group by receipt_group_id if exists, otherwise show individual (same logic as getReceiptsReport)
      const groupedReceipts = {};
      const individualReceipts = [];

      allPayments.forEach(payment => {
        const receiptGroupId = payment.invoice?.receipt_group_id;
        
        if (receiptGroupId) {
          if (!groupedReceipts[receiptGroupId]) {
            groupedReceipts[receiptGroupId] = {
              receipt_group_id: receiptGroupId,
              payments: [],
              total_amount: 0,
              payment_date: payment.payment_date,
              payment_method: payment.payment_method,
              student: payment.invoice?.student,
              branch: payment.invoice?.student?.branch,
              fee_types: new Set(),
              month_count: 0,
              months: []
            };
          }
          
          groupedReceipts[receiptGroupId].payments.push(payment);
          groupedReceipts[receiptGroupId].total_amount += parseFloat(payment.payment_amount || 0);
          groupedReceipts[receiptGroupId].fee_types.add(payment.invoice?.feeStructure?.feeType?.name || 'N/A');
          groupedReceipts[receiptGroupId].month_count += 1;
        } else {
          individualReceipts.push(payment);
        }
      });

      // Convert grouped receipts to export format
      const groupedReceiptsArray = Object.values(groupedReceipts).map(group => {
        // Collect all unique invoice numbers for grouped receipts
        const invoiceNumbers = [...new Set(group.payments.map(p => p.invoice?.invoice_number).filter(Boolean))];
        
        return {
          'Invoice Number': invoiceNumbers.join(', '),
          'Receipt Number': group.receipt_group_id,
          'Payment Date': group.payment_date ? new Date(group.payment_date).toLocaleDateString('en-IN') : 'N/A',
          'Student Name': group.student ? getStudentFullName(group.student) : 'N/A',
          'Admission Number': group.student?.admission_number || 'N/A',
          'Roll Number': group.student?.roll_number || 'N/A',
          'Branch': group.branch?.name || 'N/A',
          'Class': group.student?.current_class || 'N/A',
          'Section': group.student?.section || 'N/A',
          'Fee Type': Array.from(group.fee_types).join(', '),
          'Payment Amount': group.total_amount.toFixed(2),
          'Payment Method': group.payment_method || 'N/A',
          'Transaction ID': group.payments[0]?.transaction_id || 'N/A',
          'Created Date': group.payments[0]?.created_at ? new Date(group.payments[0].created_at).toLocaleDateString('en-IN') : 'N/A',
          'Month Count': group.month_count > 1 ? `${group.month_count} months` : '1 month'
        };
      });

      // Convert individual receipts to export format
      const individualReceiptsArray = individualReceipts.map(payment => ({
        'Invoice Number': payment.invoice?.invoice_number || 'N/A',
        'Receipt Number': payment.receipt_number || payment.id,
        'Payment Date': payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-IN') : 'N/A',
        'Student Name': payment.invoice?.student ? getStudentFullName(payment.invoice.student) : 'N/A',
        'Admission Number': payment.invoice?.student?.admission_number || 'N/A',
        'Roll Number': payment.invoice?.student?.roll_number || 'N/A',
        'Branch': payment.invoice?.student?.branch?.name || 'N/A',
        'Class': payment.invoice?.student?.current_class || 'N/A',
        'Section': payment.invoice?.student?.section || 'N/A',
        'Fee Type': payment.invoice?.feeStructure?.feeType?.name || 'N/A',
        'Payment Amount': parseFloat(payment.payment_amount || 0).toFixed(2),
        'Payment Method': payment.payment_method || 'N/A',
        'Transaction ID': payment.transaction_id || 'N/A',
        'Created Date': payment.created_at ? new Date(payment.created_at).toLocaleDateString('en-IN') : 'N/A',
        'Month Count': '1 month'
      }));

      // Combine and sort all receipts (same as getReceiptsReport)
      exportData = [...groupedReceiptsArray, ...individualReceiptsArray]
        .sort((a, b) => new Date(b['Payment Date']) - new Date(a['Payment Date']));
      
      // Filter columns if specified
      if (columns && report_type === 'receipts') {
        const selectedColumns = columns.split(',').map(col => col.trim());
        const columnMapping = {
          'invoice_number': 'Invoice Number',
          'receipt_number': 'Receipt Number',
          'payment_date': 'Payment Date',
          'student_name': 'Student Name',
          'branch': 'Branch',
          'class': 'Class',
          'section': 'Section',
          'payment_amount': 'Payment Amount',
          'payment_method': 'Payment Method',
          'fee_type': 'Fee Type'
        };
        
        // Filter export data to only include selected columns
        exportData = exportData.map(record => {
          const filteredRecord = {};
          selectedColumns.forEach(colKey => {
            const mappedCol = columnMapping[colKey];
            if (mappedCol && record[mappedCol] !== undefined) {
              filteredRecord[mappedCol] = record[mappedCol];
            }
          });
          return filteredRecord;
        });
        
        logger.info(`Filtered export data to ${selectedColumns.length} columns:`, selectedColumns);
      }
    } else {
      // Export invoices report (default)
      const invoices = await FeeInvoice.findAll({
        where: whereClause,
        include: includeClause,
        order: [['created_at', 'DESC']],
      });

      // Convert to export format with enhanced data
      exportData = invoices.map(invoice => ({
        'Invoice Number': invoice.invoice_number || invoice.id,
        'Student Name': invoice.student ? getStudentFullName(invoice.student) : 'N/A',
        'Admission Number': invoice.student?.admission_number || 'N/A',
        'Roll Number': invoice.student?.roll_number || 'N/A',
        'Class': invoice.student?.current_class || 'N/A',
        'Section': invoice.student?.section || 'N/A',
        'Fee Type': invoice.feeStructure?.feeType?.name || 'N/A',
        'Total Amount': parseFloat(invoice.total_amount || 0).toFixed(2),
        'Paid Amount': parseFloat(invoice.paid_amount || 0).toFixed(2),
        'Balance Amount': parseFloat(invoice.balance_amount || 0).toFixed(2),
        'Due Date': invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-IN') : 'N/A',
        'Status': invoice.status || 'N/A',
        'Payment Method': invoice.payment_method || 'N/A',
        'Created Date': invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('en-IN') : 'N/A',
        'Last Updated': invoice.updated_at ? new Date(invoice.updated_at).toLocaleDateString('en-IN') : 'N/A',
      }));
    }

    // Debug logging
    logger.info(`Export data prepared: ${exportData.length} records`);
    if (exportData.length > 0) {
      logger.info(`Sample export data:`, {
        firstRecord: exportData[0],
        headers: Object.keys(exportData[0]),
        totalRecords: exportData.length
      });
    }

    if (format === 'excel' || format === 'xlsx') {
      try {
        logger.info('Starting Excel generation...');
        
        // Check if XLSX library is properly loaded
        if (!XLSX || !XLSX.utils) {
          throw new Error('XLSX library not properly loaded');
        }
        
        logger.info('XLSX library loaded successfully');
        
        // Calculate summary totals based on report type (same logic as CSV)
        let summaryTotals = {};
        let collectionRate = '0.00';
        
        if (report_type === 'receipts') {
          // Receipts summary calculation
          summaryTotals = {
            totalReceipts: exportData.length,
            totalCollected: 0,
            totalAmount: 0
          };
          
          exportData.forEach(row => {
            const paymentAmount = parseFloat(row['Payment Amount'] || 0);
            summaryTotals.totalCollected += paymentAmount;
            summaryTotals.totalAmount += paymentAmount; // For receipts, amount = collected
          });
          
          collectionRate = summaryTotals.totalAmount > 0 
            ? ((summaryTotals.totalCollected / summaryTotals.totalAmount) * 100).toFixed(2)
            : '0.00';
        } else {
          // Invoices summary calculation
          summaryTotals = {
            totalInvoices: exportData.length,
            totalAmount: 0,
            totalCollected: 0,
            totalPending: 0,
            paidInvoices: 0,
            unpaidInvoices: 0,
            partialInvoices: 0,
            overdueInvoices: 0
          };
          
          exportData.forEach(row => {
            const totalAmount = parseFloat(row['Total Amount'] || 0);
            const paidAmount = parseFloat(row['Paid Amount'] || 0);
            const balanceAmount = parseFloat(row['Balance Amount'] || 0);
            const status = row['Status'] || '';
            
            summaryTotals.totalAmount += totalAmount;
            summaryTotals.totalCollected += paidAmount;
            summaryTotals.totalPending += balanceAmount;
            
            switch (status.toLowerCase()) {
              case 'paid':
                summaryTotals.paidInvoices++;
                break;
              case 'unpaid':
                summaryTotals.unpaidInvoices++;
                break;
              case 'partial_paid':
                summaryTotals.partialInvoices++;
                break;
              case 'overdue':
                summaryTotals.overdueInvoices++;
                break;
            }
          });
          
          collectionRate = summaryTotals.totalAmount > 0 
            ? ((summaryTotals.totalCollected / summaryTotals.totalAmount) * 100).toFixed(2)
            : '0.00';
        }
        
        // Generate Excel file
        const workbook = XLSX.utils.book_new();
        logger.info('Workbook created successfully');
        
        // Create Summary worksheet
        const reportTitle = report_type === 'receipts' ? 'Receipts Report Summary' : 'Fee Collection Report Summary';
        const summaryData = [
          [reportTitle],
          [''],
          ['Report Information'],
          ['Generated on', new Date().toLocaleDateString('en-IN') + ' at ' + new Date().toLocaleTimeString('en-IN')],
          [''],
          ['School Information'],
        ];
        
        // Add school information
        try {
          const school = await School.findByPk(req.schoolId);
          if (school) {
            summaryData.push(['School', school.name]);
          }
        } catch (error) {
          logger.warn('Could not fetch school information for Excel');
        }
        
        // Add user information
        if (req.user) {
          summaryData.push(['Generated by', req.user.name || req.user.email || 'System']);
          summaryData.push(['User Role', req.user.role || 'Unknown']);
        }
        
        summaryData.push(['']);
        summaryData.push(['Summary Totals']);
        
        if (report_type === 'receipts') {
          summaryData.push(['Total Receipts', summaryTotals.totalReceipts]);
          summaryData.push(['Total Amount', `₹${summaryTotals.totalAmount.toFixed(2)}`]);
          summaryData.push(['Total Collected', `₹${summaryTotals.totalCollected.toFixed(2)}`]);
          summaryData.push(['Collection Rate', `${collectionRate}%`]);
        } else {
          summaryData.push(['Total Invoices', summaryTotals.totalInvoices]);
          summaryData.push(['Total Amount', `₹${summaryTotals.totalAmount.toFixed(2)}`]);
          summaryData.push(['Total Collected', `₹${summaryTotals.totalCollected.toFixed(2)}`]);
          summaryData.push(['Total Pending', `₹${summaryTotals.totalPending.toFixed(2)}`]);
          summaryData.push(['Collection Rate', `${collectionRate}%`]);
          
          summaryData.push(['']);
          summaryData.push(['Status Breakdown']);
          summaryData.push(['Paid Invoices', summaryTotals.paidInvoices]);
          summaryData.push(['Unpaid Invoices', summaryTotals.unpaidInvoices]);
          summaryData.push(['Partial Paid Invoices', summaryTotals.partialInvoices]);
          summaryData.push(['Overdue Invoices', summaryTotals.overdueInvoices]);
        }
        
        summaryData.push(['']);
        summaryData.push(['Applied Filters']);
        if (from_date && to_date) summaryData.push(['Date Range', `${from_date} to ${to_date}`]);
        if (branch_id) {
          try {
            const branch = await Branch.findByPk(branch_id);
            summaryData.push(['Branch', branch ? branch.name : branch_id]);
          } catch (error) {
            summaryData.push(['Branch', branch_id]);
          }
        }
        if (class_name) summaryData.push(['Class', class_name]);
        if (section) summaryData.push(['Section', section]);
        if (status) summaryData.push(['Status', status.toUpperCase()]);
        if (search) summaryData.push(['Student Search', search]);
        
        const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
        summaryWorksheet['!cols'] = [
          { wch: 25 }, // Label column
          { wch: 30 }  // Value column
        ];
        XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');
        
        // Ensure we have data to export for detailed worksheet
        if (!exportData || exportData.length === 0) {
          logger.warn('No data to export, creating empty report with headers');
          exportData = [{
            'Invoice Number': 'No Data',
            'Student Name': 'No Data',
            'Admission Number': 'No Data',
            'Roll Number': 'No Data',
            'Class': 'No Data',
            'Section': 'No Data',
            'Fee Type': 'No Data',
            'Total Amount': '0.00',
            'Paid Amount': '0.00',
            'Balance Amount': '0.00',
            'Due Date': 'N/A',
            'Status': 'No Data',
            'Payment Method': 'No Data',
            'Created Date': 'N/A',
            'Last Updated': 'N/A',
          }];
        }
        
        logger.info(`Preparing detailed worksheet with ${exportData.length} records`);
        
        // Create detailed data worksheet
        let detailedWorksheet;
        try {
          detailedWorksheet = XLSX.utils.json_to_sheet(exportData);
          logger.info('Detailed worksheet created successfully using json_to_sheet');
        } catch (worksheetError) {
          logger.error('Error creating detailed worksheet with json_to_sheet:', worksheetError);
          logger.info('Trying aoa_to_sheet as fallback...');
          
          // Fallback to aoa_to_sheet
          const headers = Object.keys(exportData[0]);
          const dataArray = [
            headers,
            ...exportData.map(row => headers.map(header => String(row[header] || '')))
          ];
          detailedWorksheet = XLSX.utils.aoa_to_sheet(dataArray);
          logger.info('Detailed worksheet created successfully using aoa_to_sheet fallback');
        }
        
        // Set column widths for better readability
        const columnWidths = [
          { wch: 15 }, // Invoice Number
          { wch: 25 }, // Student Name
          { wch: 15 }, // Admission Number
          { wch: 12 }, // Roll Number
          { wch: 10 }, // Class
          { wch: 10 }, // Section
          { wch: 20 }, // Fee Type
          { wch: 12 }, // Total Amount
          { wch: 12 }, // Paid Amount
          { wch: 12 }, // Balance Amount
          { wch: 12 }, // Due Date
          { wch: 12 }, // Status
          { wch: 15 }, // Payment Method
          { wch: 12 }, // Created Date
          { wch: 12 }, // Last Updated
        ];
        detailedWorksheet['!cols'] = columnWidths;
        logger.info('Column widths set successfully');
        
        // Add detailed worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, detailedWorksheet, 'Detailed Data');
        logger.info('Detailed worksheet added to workbook successfully');
        
        // Generate buffer with explicit options for better compatibility
        logger.info('Generating Excel buffer...');
        const excelBuffer = XLSX.write(workbook, { 
          type: 'buffer', 
          bookType: 'xlsx',
          compression: true,
          bookSST: false
        });
        
        logger.info(`Excel export generated successfully: ${exportData.length} records, buffer size: ${excelBuffer.length} bytes`);
        
        // Set headers for better compatibility
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        const excelFilename = report_type === 'receipts' ? 'receipts-report' : 'fee-collection-report';
      res.setHeader('Content-Disposition', `attachment; filename="${excelFilename}-${new Date().toISOString().split('T')[0]}.xlsx"`);
        res.setHeader('Content-Length', excelBuffer.length);
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Pragma', 'no-cache');
        
        logger.info('Sending Excel file to client...');
        res.send(excelBuffer);
        logger.info('Excel file sent successfully');
      } catch (excelError) {
        logger.error('Error generating Excel file:', excelError);
        logger.error('Error stack:', excelError.stack);
        logger.error('Error details:', {
          name: excelError.name,
          message: excelError.message,
          code: excelError.code
        });
        
        // Fallback to CSV if Excel fails
        logger.info('Falling back to CSV format due to Excel generation error');
        try {
          // Generate CSV with BOM for better compatibility
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
          
          // Add BOM for better compatibility with Google Sheets
          const BOM = '\uFEFF';
          const csvWithBOM = BOM + csvContent;
          
          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          res.setHeader('Content-Disposition', `attachment; filename="fee-invoices-report-${new Date().toISOString().split('T')[0]}.csv"`);
          res.setHeader('Content-Length', Buffer.byteLength(csvWithBOM, 'utf8'));
          res.send(csvWithBOM);
          
          logger.info('CSV fallback successful');
        } catch (csvError) {
          logger.error('CSV fallback also failed:', csvError);
          res.status(500).json({
            success: false,
            message: 'Error generating both Excel and CSV files',
            excelError: excelError.message,
            csvError: csvError.message
          });
        }
      }
      
    } else if (format === 'csv') {
      logger.info('Starting CSV generation...');
      
      // Check if we have data to export
      if (!exportData || exportData.length === 0) {
        logger.warn('No data to export - exportData is empty');
        res.status(404).json({
          success: false,
          message: 'No data found for the selected filters',
          total_records: 0
        });
        return;
      }
      
      // Calculate summary totals based on report type
      let summaryTotals = {};
      let collectionRate = '0.00';
      
      if (report_type === 'receipts') {
        // Receipts summary calculation
        summaryTotals = {
          totalReceipts: exportData.length,
          totalCollected: 0,
          totalAmount: 0
        };
        
        exportData.forEach(row => {
          const paymentAmount = parseFloat(row['Payment Amount'] || 0);
          summaryTotals.totalCollected += paymentAmount;
          summaryTotals.totalAmount += paymentAmount; // For receipts, amount = collected
        });
        
        collectionRate = summaryTotals.totalAmount > 0 
          ? ((summaryTotals.totalCollected / summaryTotals.totalAmount) * 100).toFixed(2)
          : '0.00';
      } else {
        // Invoices summary calculation
        summaryTotals = {
          totalInvoices: exportData.length,
          totalAmount: 0,
          totalCollected: 0,
          totalPending: 0,
          paidInvoices: 0,
          unpaidInvoices: 0,
          partialInvoices: 0,
          overdueInvoices: 0
        };
        
        exportData.forEach(row => {
          const totalAmount = parseFloat(row['Total Amount'] || 0);
          const paidAmount = parseFloat(row['Paid Amount'] || 0);
          const balanceAmount = parseFloat(row['Balance Amount'] || 0);
          const status = row['Status'] || '';
          
          summaryTotals.totalAmount += totalAmount;
          summaryTotals.totalCollected += paidAmount;
          summaryTotals.totalPending += balanceAmount;
          
          switch (status.toLowerCase()) {
            case 'paid':
              summaryTotals.paidInvoices++;
              break;
            case 'unpaid':
              summaryTotals.unpaidInvoices++;
              break;
            case 'partial_paid':
              summaryTotals.partialInvoices++;
              break;
            case 'overdue':
              summaryTotals.overdueInvoices++;
              break;
          }
        });
        
        collectionRate = summaryTotals.totalAmount > 0 
          ? ((summaryTotals.totalCollected / summaryTotals.totalAmount) * 100).toFixed(2)
          : '0.00';
      }
      
      // Generate CSV with summary information
      const csvLines = [];
      
      // Add report header
      const reportTitle = report_type === 'receipts' ? 'Receipts Report' : 'Fee Collection Report';
      csvLines.push(reportTitle);
      csvLines.push(`Generated on: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}`);
      
      // Add school information
      try {
        const school = await School.findByPk(req.schoolId);
        if (school) {
          csvLines.push(`School,${school.name}`);
        }
      } catch (error) {
        logger.warn('Could not fetch school information for CSV');
      }
      
      // Add user information
      if (req.user) {
        csvLines.push(`Generated by,${req.user.name || req.user.email || 'System'}`);
        csvLines.push(`User Role,${req.user.role || 'Unknown'}`);
      }
      
      csvLines.push(''); // Empty line
      
      // Add summary section
      csvLines.push('SUMMARY TOTALS');
      
      if (report_type === 'receipts') {
        csvLines.push(`Total Receipts,${summaryTotals.totalReceipts}`);
        csvLines.push(`Total Amount,₹${summaryTotals.totalAmount.toFixed(2)}`);
        csvLines.push(`Total Collected,₹${summaryTotals.totalCollected.toFixed(2)}`);
        csvLines.push(`Collection Rate,${collectionRate}%`);
      } else {
        csvLines.push(`Total Invoices,${summaryTotals.totalInvoices}`);
        csvLines.push(`Total Amount,₹${summaryTotals.totalAmount.toFixed(2)}`);
        csvLines.push(`Total Collected,₹${summaryTotals.totalCollected.toFixed(2)}`);
        csvLines.push(`Total Pending,₹${summaryTotals.totalPending.toFixed(2)}`);
        csvLines.push(`Collection Rate,${collectionRate}%`);
        
        csvLines.push(''); // Empty line
        csvLines.push('STATUS BREAKDOWN');
        csvLines.push(`Paid Invoices,${summaryTotals.paidInvoices}`);
        csvLines.push(`Unpaid Invoices,${summaryTotals.unpaidInvoices}`);
        csvLines.push(`Partial Paid Invoices,${summaryTotals.partialInvoices}`);
        csvLines.push(`Overdue Invoices,${summaryTotals.overdueInvoices}`);
      }
      csvLines.push(''); // Empty line
      
      // Add filter information
      csvLines.push('APPLIED FILTERS');
      if (from_date && to_date) csvLines.push(`Date Range,${from_date} to ${to_date}`);
      if (branch_id) {
        // Try to get branch name if possible
        try {
          const branch = await Branch.findByPk(branch_id);
          csvLines.push(`Branch,${branch ? branch.name : branch_id}`);
        } catch (error) {
          csvLines.push(`Branch,${branch_id}`);
        }
      }
      if (class_name) csvLines.push(`Class,${class_name}`);
      if (section) csvLines.push(`Section,${section}`);
      if (status) csvLines.push(`Status,${status.toUpperCase()}`);
      if (search) csvLines.push(`Student Search,${search}`);
      csvLines.push(''); // Empty line
      
      // Add detailed data headers
      const csvHeaders = Object.keys(exportData[0] || {});
      const dataTitle = report_type === 'receipts' ? 'DETAILED RECEIPT DATA' : 'DETAILED INVOICE DATA';
      csvLines.push(dataTitle);
      csvLines.push(csvHeaders.join(','));
      
      // Add detailed data rows
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
      
      csvLines.push(...csvRows);
      csvLines.push(''); // Empty line
      
      // Add totals row
      csvLines.push('TOTALS');
      if (report_type === 'receipts') {
        csvLines.push(`Total Records,${summaryTotals.totalReceipts}`);
        csvLines.push(`Total Amount,₹${summaryTotals.totalAmount.toFixed(2)}`);
        csvLines.push(`Total Collected,₹${summaryTotals.totalCollected.toFixed(2)}`);
      } else {
        csvLines.push(`Total Records,${summaryTotals.totalInvoices}`);
        csvLines.push(`Total Amount,₹${summaryTotals.totalAmount.toFixed(2)}`);
        csvLines.push(`Total Collected,₹${summaryTotals.totalCollected.toFixed(2)}`);
        csvLines.push(`Total Pending,₹${summaryTotals.totalPending.toFixed(2)}`);
      }
      
      const csvContent = csvLines.join('\n');
      logger.info(`CSV content length: ${csvContent.length} characters`);
      logger.info(`CSV rows generated: ${csvRows.length}`);
      logger.info('Summary totals calculated:', summaryTotals);
      
      // Add BOM for better compatibility with Google Sheets
      const BOM = '\uFEFF';
      const csvWithBOM = BOM + csvContent;
      
      logger.info(`CSV with BOM length: ${csvWithBOM.length} characters`);
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      const filename = report_type === 'receipts' ? 'receipts-report' : 'fee-collection-report';
      res.setHeader('Content-Disposition', `attachment; filename="${filename}-${new Date().toISOString().split('T')[0]}.csv"`);
      res.setHeader('Content-Length', Buffer.byteLength(csvWithBOM, 'utf8'));
      
      logger.info('Sending CSV file to client...');
      res.send(csvWithBOM);
      logger.info('CSV file sent successfully');
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
        message: 'Invalid export format. Supported formats: excel, csv, json',
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

    // Handle branch filtering based on user role
    if (req.user.role === 'branch_admin') {
      // Branch admin can only see invoices for their assigned branch
      whereClause.branch_id = req.user.branch_id;
    }

    if (academic_year) whereClause.academic_year = academic_year;

    const includeClause = [];
    if (class_name) {
      const studentWhereClause = { current_class: class_name };
      
      // Handle student branch filtering based on user role
      if (req.user.role === 'branch_admin') {
        // Branch admin can only see students from their assigned branch
        studentWhereClause.branch_id = req.user.branch_id;
      }
      
      includeClause.push({
        model: Student,
        as: 'student',
        where: studentWhereClause,
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