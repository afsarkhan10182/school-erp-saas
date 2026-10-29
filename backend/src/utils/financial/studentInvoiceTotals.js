const { FeeInvoice } = require('~/models');
const { Op } = require('sequelize');

const getStudentInvoiceTotals = async (students, { includePaid = false } = {}) => {
  if (!students.length) return new Map();

  const invoices = await FeeInvoice.findAll({
    where: {
      school_id: { [Op.in]: [...new Set(students.map(student => student.school_id))] },
      student_id: { [Op.in]: students.map(student => student.id) },
      status: { [Op.in]: ['sent', 'paid', 'partial_paid', 'overdue'] }
    },
    attributes: [
      'school_id',
      'student_id',
      [FeeInvoice.sequelize.fn('SUM', FeeInvoice.sequelize.col('total_amount')), 'total_billed'],
      ...(includePaid
        ? [[FeeInvoice.sequelize.fn('SUM', FeeInvoice.sequelize.col('paid_amount')), 'total_paid']]
        : []),
      [FeeInvoice.sequelize.fn('SUM', FeeInvoice.sequelize.col('balance_amount')), 'total_due']
    ],
    group: ['school_id', 'student_id'],
    raw: true
  });

  return new Map(
    invoices.map(invoice => [
      `${invoice.school_id}:${invoice.student_id}`,
      {
        total_billed: Number(invoice.total_billed) || 0,
        ...(includePaid ? { total_paid: Number(invoice.total_paid) || 0 } : {}),
        total_due: Number(invoice.total_due) || 0
      }
    ])
  );
};

module.exports = getStudentInvoiceTotals;
