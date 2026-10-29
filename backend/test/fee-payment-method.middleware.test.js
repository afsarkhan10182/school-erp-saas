require('module-alias/register');

const { School } = require('../src/models');
const feeInvoiceRoutes = require('../src/routes/financial/fee-invoice.routes');
const {
  isPaymentMethodEnabled,
  requireEnabledFeePaymentMethod
} = require('../src/middleware/financial/fee-payment-method');

afterEach(() => jest.restoreAllMocks());

describe('fee payment method settings', () => {
  it('preserves the existing methods by default and requires explicit Online enablement', () => {
    expect(isPaymentMethodEnabled({}, 'cash')).toBe(true);
    expect(isPaymentMethodEnabled({}, 'card')).toBe(true);
    expect(isPaymentMethodEnabled({}, 'upi')).toBe(true);
    expect(isPaymentMethodEnabled({}, 'online')).toBe(false);
    expect(isPaymentMethodEnabled({}, 'unknown')).toBe(false);
  });

  it('rejects a payment method disabled in the school settings before continuing', async () => {
    jest.spyOn(School, 'findByPk').mockResolvedValue({
      id: 'school-1',
      fee_settings: { paymentMethods: { cash: false } }
    });
    const next = jest.fn();

    await requireEnabledFeePaymentMethod(
      { schoolId: 'school-1', body: { payment_method: 'cash' } },
      {},
      next
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });

  it('allows Online only when enabled and guards every fee payment write route', async () => {
    jest.spyOn(School, 'findByPk').mockResolvedValue({
      id: 'school-1',
      fee_settings: { paymentMethods: { online: true } }
    });
    const next = jest.fn();

    await requireEnabledFeePaymentMethod(
      { schoolId: 'school-1', body: { payment_method: 'online' } },
      {},
      next
    );
    expect(next).toHaveBeenCalledWith();

    const guardedPaths = feeInvoiceRoutes.stack
      .filter(layer => layer.route?.methods.post)
      .filter(layer =>
        ['/smart-payment', '/flexible-installment', '/:id/payment'].includes(layer.route.path)
      )
      .filter(layer =>
        layer.route.stack.some(routeLayer => routeLayer.handle === requireEnabledFeePaymentMethod)
      )
      .map(layer => layer.route.path);

    expect(guardedPaths).toEqual(['/smart-payment', '/flexible-installment', '/:id/payment']);
  });
});
