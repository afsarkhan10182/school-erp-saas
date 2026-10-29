const { Op } = require('sequelize');
const { FeePayment } = require('~/models');

const getPaymentMethodInvoiceIds = async ({ paymentMethod, schoolId, branchId, academicYear }) => {
  if (!paymentMethod) return null;

  const where = {
    payment_method: paymentMethod,
    payment_status: 'completed',
    invoice_id: { [Op.ne]: null }
  };
  if (schoolId) where.school_id = schoolId;
  if (branchId) where.branch_id = branchId;
  if (academicYear) where.academic_year = academicYear;

  const payments = await FeePayment.findAll({
    attributes: ['invoice_id'],
    where,
    group: ['invoice_id'],
    raw: true
  });

  return payments.map(payment => payment.invoice_id);
};

module.exports = getPaymentMethodInvoiceIds;
