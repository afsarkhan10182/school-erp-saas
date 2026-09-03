const { Op } = require('sequelize');
const {
  Student,
  User,
  Class,
  Section,
  FeeInvoice,
  AttendanceRecord,
  LibraryIssue,
  LibraryBook,
  DynamicEntityRecord,
  Parent,
  StudentParent
} = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { schoolWhere } = require('~/utils/shared/requestScope');

/**
 * Multi-module reports suite with real aggregations from live tables.
 */
const suite = async (req, res) => {
  try {
    const moduleKey = req.params.module;
    const type = req.query.type || 'summary';
    const where = schoolWhere(req);

    if (moduleKey === 'students') {
      return studentModule(req, res, where, type);
    }
    if (moduleKey === 'fees') {
      return feesModule(req, res, where, type);
    }
    if (moduleKey === 'attendance') {
      return attendanceModule(req, res, where, type);
    }
    if (moduleKey === 'library') {
      return libraryModule(req, res, where, type);
    }
    if (moduleKey === 'hostel') {
      return dynamicEntityReport(req, res, 'hostel_allocation', type);
    }
    if (moduleKey === 'transport') {
      return transportModule(req, res, type);
    }
    if (moduleKey === 'hr') {
      return hrModule(req, res, type);
    }
    if (moduleKey === 'inventory') {
      return dynamicEntityReport(req, res, 'inventory_product', type);
    }
    if (moduleKey === 'accounting') {
      return dynamicEntityReport(req, res, 'voucher', type);
    }
    if (moduleKey === 'exams') {
      return res.json({
        success: true,
        data: {
          message: 'Use /api/exam-reports for tabulation, progress and marksheet',
          links: ['/exam-reports/tabulation', '/exam-reports/progress', '/reports/exams']
        }
      });
    }

    return res.status(404).json({
      success: false,
      message: 'Unknown report module',
      modules: [
        'students',
        'fees',
        'attendance',
        'library',
        'hostel',
        'transport',
        'hr',
        'inventory',
        'accounting',
        'exams'
      ]
    });
  } catch (error) {
    logger.error('reports suite', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const studentModule = async (req, res, where, type) => {
  if (req.query.class_id) where.class_id = req.query.class_id;
  if (req.query.section_id) where.section_id = req.query.section_id;
  if (req.query.status) where.status = req.query.status;
  if (req.query.from_date || req.query.to_date) {
    where.admission_date = {};
    if (req.query.from_date) where.admission_date[Op.gte] = req.query.from_date;
    if (req.query.to_date) where.admission_date[Op.lte] = req.query.to_date;
  }
  if (type === 'credentials') {
    const students = await Student.findAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['email', 'status'], required: false }],
      attributes: ['id', 'first_name', 'last_name', 'admission_number', 'current_class', 'email'],
      limit: 1000
    });
    return res.json({
      success: true,
      data: {
        columns: ['name', 'admission_number', 'class_name', 'login_email', 'login_status'],
        rows: students.map(s => ({
          name: `${s.first_name} ${s.last_name || ''}`.trim(),
          admission_number: s.admission_number,
          class_name: s.current_class,
          login_email: s.user?.email || s.email || '—',
          login_status: s.user?.status || 'no account'
        }))
      }
    });
  }
  if (type === 'admissions') {
    const students = await Student.findAll({
      where,
      attributes: [
        'id',
        'first_name',
        'last_name',
        'admission_number',
        'admission_date',
        'current_class',
        'status'
      ],
      order: [['admission_date', 'DESC']],
      limit: 1000
    });
    return res.json({
      success: true,
      data: {
        columns: [
          'first_name',
          'last_name',
          'admission_number',
          'admission_date',
          'current_class',
          'status'
        ],
        rows: students
      }
    });
  }
  if (type === 'class-section') {
    const students = await Student.findAll({
      where: { ...where, status: { [Op.ne]: 'deleted' } },
      include: [
        { model: Class, as: 'class', attributes: ['name'], required: false },
        { model: Section, as: 'sectionInfo', attributes: ['name'], required: false }
      ],
      attributes: ['id']
    });
    const map = {};
    students.forEach(s => {
      const label = `${s.class?.name || 'Unassigned'} / ${s.sectionInfo?.name || '—'}`;
      map[label] = (map[label] || 0) + 1;
    });
    return res.json({
      success: true,
      data: {
        columns: ['label', 'count'],
        rows: Object.entries(map).map(([label, count]) => ({ label, count }))
      }
    });
  }
  if (type === 'siblings') {
    const links = await StudentParent.findAll({
      include: [
        {
          model: Student,
          as: 'student',
          where,
          attributes: ['id', 'first_name', 'last_name', 'admission_number']
        },
        { model: Parent, as: 'parent', attributes: ['guardian_name', 'father_name'] }
      ]
    });
    const byParent = {};
    links.forEach(link => {
      const pid = link.parent_id;
      if (!byParent[pid]) {
        byParent[pid] = {
          parent: link.parent?.guardian_name || link.parent?.father_name || pid,
          students: []
        };
      }
      if (link.student) byParent[pid].students.push(link.student);
    });
    const rows = Object.values(byParent)
      .filter(r => r.students.length > 1)
      .map(r => ({
        parent: r.parent,
        students: r.students.map(s => `${s.first_name} (${s.admission_number})`).join(', '),
        count: r.students.length
      }));
    return res.json({
      success: true,
      data: { columns: ['parent', 'students', 'count'], rows }
    });
  }
  // summary
  const total = await Student.count({ where: { ...where, status: { [Op.ne]: 'deleted' } } });
  const active = await Student.count({ where: { ...where, status: 'active' } });
  return res.json({
    success: true,
    data: {
      columns: ['metric', 'value'],
      rows: [
        { metric: 'Total students', value: total },
        { metric: 'Active', value: active }
      ],
      types: ['summary', 'credentials', 'admissions', 'class-section', 'siblings']
    }
  });
};

const feesModule = async (req, res, where, type) => {
  const base = { ...where };
  if (req.query.from_date || req.query.to_date) {
    base.due_date = {};
    if (req.query.from_date) base.due_date[Op.gte] = req.query.from_date;
    if (req.query.to_date) base.due_date[Op.lte] = req.query.to_date;
  }
  if (type === 'due') {
    const invoices = await FeeInvoice.findAll({
      where: {
        ...base,
        status: { [Op.in]: ['sent', 'partial_paid', 'overdue'] }
      },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['first_name', 'last_name', 'admission_number'],
          required: false
        }
      ],
      limit: 500,
      order: [['due_date', 'ASC']]
    });
    return res.json({
      success: true,
      data: {
        columns: ['invoice_number', 'student', 'status', 'balance_amount', 'due_date'],
        rows: invoices.map(inv => ({
          invoice_number: inv.invoice_number,
          student: inv.student
            ? `${inv.student.first_name} ${inv.student.last_name || ''}`.trim()
            : '—',
          status: inv.status || inv.payment_status,
          balance_amount: inv.balance_amount ?? inv.total_amount,
          due_date: inv.due_date
        }))
      }
    });
  }
  const [total, paid, overdue] = await Promise.all([
    FeeInvoice.count({ where: base }),
    FeeInvoice.count({ where: { ...base, status: 'paid' } }),
    FeeInvoice.count({ where: { ...base, status: 'overdue' } })
  ]);
  return res.json({
    success: true,
    data: {
      columns: ['metric', 'value'],
      rows: [
        { metric: 'Total invoices', value: total },
        { metric: 'Paid', value: paid },
        { metric: 'Overdue', value: overdue }
      ],
      types: ['summary', 'due']
    }
  });
};

const attendanceModule = async (req, res, where, type) => {
  if (req.query.class_id) where.class_id = req.query.class_id;
  if (req.query.section_id) where.section_id = req.query.section_id;
  if (req.query.from_date || req.query.to_date) {
    where.date = {};
    if (req.query.from_date) where.date[Op.gte] = req.query.from_date;
    if (req.query.to_date) where.date[Op.lte] = req.query.to_date;
  }
  const records = await AttendanceRecord.findAll({
    where,
    attributes: ['status'],
    limit: 5000
  });
  const map = {};
  records.forEach(r => {
    const k = r.status || 'unknown';
    map[k] = (map[k] || 0) + 1;
  });
  return res.json({
    success: true,
    data: {
      columns: ['status', 'count'],
      rows: Object.entries(map).map(([status, count]) => ({ status, count })),
      types: ['summary']
    }
  });
};

const baseLibraryBookFields = ['title', 'author', 'isbn', 'category', 'available', 'quantity'];
const parityLibraryBookFields = ['publisher', 'edition', 'purchase_date', 'purchase_price', 'sale_price'];
let libraryBookColumns;

const libraryBookFields = async () => {
  if (!libraryBookColumns) {
    libraryBookColumns = await LibraryBook.sequelize.getQueryInterface().describeTable('library_books').catch(() => ({}));
  }
  return [...baseLibraryBookFields, ...parityLibraryBookFields.filter(field => libraryBookColumns[field])];
};

const libraryModule = async (req, res, where, type) => {
  if (type === 'issued') {
    const issues = await LibraryIssue.findAll({
      where: { ...where, status: 'issued' },
      include: [
        { model: LibraryBook, as: 'book', attributes: ['title'] },
        {
          model: Student,
          as: 'student',
          attributes: ['first_name', 'last_name', 'admission_number']
        }
      ],
      limit: 500
    });
    return res.json({
      success: true,
      data: {
        columns: ['book', 'borrower', 'borrower_type', 'issue_date', 'due_date', 'fine_amount'],
        rows: issues.map(i => ({
          book: i.book?.title,
          borrower: i.borrower_name || (i.student
            ? `${i.student.first_name} ${i.student.last_name || ''}`.trim()
            : '—'),
          borrower_type: i.borrower_type || 'student',
          issue_date: i.issue_date,
          due_date: i.due_date,
          fine_amount: i.fine_amount || 0
        }))
      }
    });
  }
  const books = await LibraryBook.count({ where });
  const issued = await LibraryIssue.count({ where: { ...where, status: 'issued' } });
  if (type === 'books') {
    const rows = await LibraryBook.findAll({ where, attributes: await libraryBookFields(), limit: 500, order: [['title', 'ASC']] });
    return res.json({
      success: true,
      data: {
        columns: ['title', 'author', 'publisher', 'edition', 'isbn', 'category', 'purchase_date', 'purchase_price', 'sale_price', 'available'],
        rows: rows.map(b => ({
          title: b.title,
          author: b.author || '—',
          publisher: b.publisher || '—',
          edition: b.edition || '—',
          isbn: b.isbn || '—',
          category: b.category || '—',
          purchase_date: b.purchase_date || '—',
          purchase_price: b.purchase_price || '—',
          sale_price: b.sale_price || '—',
          available: `${b.available}/${b.quantity}`
        }))
      }
    });
  }
  return res.json({
    success: true,
    data: {
      columns: ['metric', 'value'],
      rows: [
        { metric: 'Books', value: books },
        { metric: 'Currently issued', value: issued }
      ],
      types: ['summary', 'books', 'issued']
    }
  });
};

const transportModule = async (req, res, type) => {
  if (type === 'summary') {
    const [assignments, students] = await Promise.all([
      DynamicEntityRecord.count({ where: { ...schoolWhere(req), entity_type: 'transport_assignment' } }),
      Student.findAll({ where: schoolWhere(req), attributes: ['documents'], limit: 500 })
    ]);
    return res.json({
      success: true,
      data: {
        columns: ['metric', 'value'],
        rows: [
          { metric: 'Vehicle assignments', value: assignments },
          { metric: 'Student allocations', value: students.filter(s => {
            const extras = s.documents?.admission_extras || {};
            return extras.transport_route_id || extras.transport_vehicle_id || extras.transport_stop_id;
          }).length }
        ],
        types: ['summary', 'list', 'student-allocations']
      }
    });
  }
  if (type === 'student-allocations') {
    const students = await Student.findAll({
      where: schoolWhere(req),
      attributes: ['first_name', 'last_name', 'admission_number', 'current_class', 'section', 'documents'],
      order: [['first_name', 'ASC']],
      limit: 500
    });
    const rows = students
      .map(student => {
        const extras = student.documents?.admission_extras || {};
        return {
          student: `${student.first_name} ${student.last_name || ''}`.trim(),
          admission_number: student.admission_number,
          class: [student.current_class, student.section].filter(Boolean).join('-') || '—',
          route: extras.transport_route || '—',
          route_id: extras.transport_route_id || '',
          vehicle: extras.transport_vehicle || '—',
          vehicle_id: extras.transport_vehicle_id || '',
          stop: extras.transport_stop || '—',
          stop_id: extras.transport_stop_id || ''
        };
      })
      .filter(row => row.route_id || row.vehicle_id || row.stop_id)
      .filter(row => !req.query.route_id || row.route_id === req.query.route_id)
      .filter(row => !req.query.vehicle_id || row.vehicle_id === req.query.vehicle_id)
      .filter(row => !req.query.stop_id || row.stop_id === req.query.stop_id)
      .map(({ route_id, vehicle_id, stop_id, ...row }) => row);
    return res.json({ success: true, data: { columns: ['student', 'admission_number', 'class', 'route', 'vehicle', 'stop'], rows } });
  }
  return dynamicEntityReport(req, res, 'transport_assignment', type);
};

const dynamicEntityReport = async (req, res, entityType, type) => {
  const where = { ...schoolWhere(req), entity_type: entityType };
  const records = await DynamicEntityRecord.findAll({
    where,
    include: [{ model: Student, as: 'student', attributes: ['first_name', 'last_name', 'admission_number'], required: false }],
    order: [['created_at', 'DESC']],
    limit: 500
  });
  const byStatus = {};
  records.forEach(r => {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  });
  if (type === 'list') {
    if (entityType === 'transport_assignment') {
      return res.json({
        success: true,
        data: {
          columns: ['assignment', 'route', 'vehicle', 'status'],
          rows: records.map(r => ({ assignment: r.title, route: r.payload?.route_id_label || '—', vehicle: r.payload?.vehicle_id_label || '—', status: r.status }))
        }
      });
    }
    if (entityType === 'hostel_allocation') {
      return res.json({
        success: true,
        data: {
          columns: ['reference', 'student', 'admission_number', 'hostel', 'room', 'status'],
          rows: records.map(r => ({ reference: r.title, student: r.student ? `${r.student.first_name} ${r.student.last_name || ''}`.trim() : '—', admission_number: r.student?.admission_number || '—', hostel: r.payload?.hostel_id_label || '—', room: r.payload?.room_id_label || '—', status: r.status }))
        }
      });
    }
    if (entityType === 'voucher') {
      return res.json({
        success: true,
        data: {
          columns: ['narration', 'account', 'type', 'head', 'ref_no', 'pay_via', 'amount', 'date'],
          rows: records.map(r => ({ narration: r.title, account: r.payload?.account_id_label || '—', type: r.payload?.voucher_type || '—', head: r.payload?.voucher_head_id_label || '—', ref_no: r.reference_no || '—', pay_via: r.payload?.pay_via || '—', amount: r.amount, date: r.date_value }))
        }
      });
    }
    if (entityType === 'inventory_product') {
      return res.json({
        success: true,
        data: {
          columns: ['product', 'code', 'category', 'purchase_unit', 'sales_unit', 'purchase_price', 'sales_price'],
          rows: records.map(r => ({ product: r.title, code: r.reference_no || '—', category: r.payload?.category_id_label || '—', purchase_unit: r.payload?.purchase_unit_id_label || '—', sales_unit: r.payload?.sales_unit_id_label || '—', purchase_price: r.payload?.purchase_price || '—', sales_price: r.amount }))
        }
      });
    }
    return res.json({
      success: true,
      data: {
        columns: ['title', 'status', 'date_value', 'amount', 'reference_no'],
        rows: records.map(r => ({
          title: r.title,
          status: r.status,
          date_value: r.date_value,
          amount: r.amount,
          reference_no: r.reference_no
        }))
      }
    });
  }
  return res.json({
    success: true,
    data: {
      columns: ['status', 'count'],
      rows: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
      types: ['summary', 'list'],
      entity: entityType
    }
  });
};

const hrModule = async (req, res, type) => {
  const entityTypes = ['leave_request', 'salary_payment', 'advance_salary', 'staff_award'];
  const records = await DynamicEntityRecord.findAll({
    where: { ...schoolWhere(req), entity_type: { [Op.in]: entityTypes } },
    include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name', 'email', 'role'], required: false }],
    order: [['created_at', 'DESC']],
    limit: 500
  });
  const rows = records.map(r => ({
    module: r.entity_type.replace(/_/g, ' '),
    reference: r.title,
    employee: r.payload?.user_id_label || (r.user ? `${r.user.first_name} ${r.user.last_name || ''}`.trim() : '—'),
    role: r.payload?.role || r.user?.role || '—',
    month: r.payload?.month_year || '—',
    date: r.date_value,
    amount: r.amount,
    status: r.status
  }));
  if (type === 'list') {
    return res.json({
      success: true,
      data: { columns: ['module', 'reference', 'employee', 'role', 'month', 'date', 'amount', 'status'], rows }
    });
  }
  const counts = rows.reduce((acc, row) => {
    acc[row.module] = (acc[row.module] || 0) + 1;
    return acc;
  }, {});
  return res.json({
    success: true,
    data: {
      columns: ['module', 'count'],
      rows: Object.entries(counts).map(([module, count]) => ({ module, count })),
      types: ['summary', 'list']
    }
  });
};

const catalog = async (req, res) => {
  return res.json({
    success: true,
    data: {
      modules: [
        {
          key: 'students',
          title: 'Student Reports',
          types: ['summary', 'credentials', 'admissions', 'class-section', 'siblings'],
          module: 'students'
        },
        {
          key: 'fees',
          title: 'Fees Reports',
          types: ['summary', 'due'],
          module: 'fees'
        },
        {
          key: 'attendance',
          title: 'Attendance Reports',
          types: ['summary'],
          module: 'attendance'
        },
        {
          key: 'library',
          title: 'Library Reports',
          types: ['summary', 'books', 'issued'],
          module: 'library'
        },
        {
          key: 'hostel',
          title: 'Hostel Reports',
          types: ['summary', 'list'],
          module: 'hostel'
        },
        {
          key: 'transport',
          title: 'Transport Reports',
          types: ['summary', 'list', 'student-allocations'],
          module: 'transport'
        },
        {
          key: 'hr',
          title: 'HR / Leave Reports',
          types: ['summary', 'list'],
          module: 'hr'
        },
        {
          key: 'inventory',
          title: 'Inventory Reports',
          types: ['summary', 'list'],
          module: 'inventory'
        },
        {
          key: 'accounting',
          title: 'Accounting Reports',
          types: ['summary', 'list'],
          module: 'accounting'
        }
      ]
    }
  });
};

module.exports = { suite, catalog };
