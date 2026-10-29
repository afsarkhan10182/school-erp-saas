const { School } = require('~/models');
const ApiError = require('~/utils/shared/ApiError');

const isPaymentMethodEnabled = (paymentMethods = {}, method) => {
  if (method === 'online') return paymentMethods.online === true;
  if (!['cash', 'card', 'upi', 'bank_transfer', 'cheque'].includes(method)) return false;
  return paymentMethods[method] !== false;
};

const requireEnabledFeePaymentMethod = async (req, res, next) => {
  try {
    const schoolId = req.schoolId || req.user?.school_id;
    if (!schoolId) throw new ApiError(400, 'School context is required');

    const school = await School.findByPk(schoolId, { attributes: ['id', 'fee_settings'] });
    if (!school) throw new ApiError(404, 'School not found');

    const method = req.body?.payment_method || 'cash';
    if (!isPaymentMethodEnabled(school.fee_settings?.paymentMethods, method)) {
      throw new ApiError(400, `Payment method "${method}" is disabled for this school`);
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { isPaymentMethodEnabled, requireEnabledFeePaymentMethod };
