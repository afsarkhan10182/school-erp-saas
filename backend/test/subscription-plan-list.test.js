require('module-alias/register');
const { Op } = require('sequelize');
const { SubscriptionPlan } = require('../src/models');
const SubscriptionService = require('../src/services/administration/subscriptions/subscription.service');

describe('subscription plan directory query', () => {
  const originalFindAndCountAll = SubscriptionPlan.findAndCountAll;

  afterEach(() => {
    SubscriptionPlan.findAndCountAll = originalFindAndCountAll;
  });

  it('applies plan filters, safe search/sorting, and server pagination', async () => {
    SubscriptionPlan.findAndCountAll = jest.fn().mockResolvedValue({ count: 31, rows: [{ id: 'plan-1' }] });

    const result = await SubscriptionService.getAllPlans({
      page: '2', limit: '25', is_active: 'false', is_popular: 'true', billing_cycle: 'yearly',
      search: '  Campus  ', sort_by: 'price', sort_order: 'DESC'
    });

    const query = SubscriptionPlan.findAndCountAll.mock.calls[0][0];
    expect(query.where).toMatchObject({ is_active: false, is_popular: true, billing_cycle: 'yearly' });
    expect(query.where[Op.or]).toEqual([
      { name: { [Op.iLike]: '%Campus%' } }, { code: { [Op.iLike]: '%Campus%' } }
    ]);
    expect(query.order).toEqual([['price', 'DESC'], ['name', 'ASC']]);
    expect(query).toMatchObject({ limit: 25, offset: 25, distinct: true });
    expect(result.pagination).toEqual({ page: 2, limit: 25, total: 31, pages: 2 });
  });

  it('clamps page size and rejects unsupported sort columns', async () => {
    SubscriptionPlan.findAndCountAll = jest.fn().mockResolvedValue({ count: 0, rows: [] });

    await SubscriptionService.getAllPlans({ page: '-4', limit: '500', sort_by: 'school_id', sort_order: 'DESC' });

    expect(SubscriptionPlan.findAndCountAll.mock.calls[0][0]).toMatchObject({
      where: {}, order: [['sort_order', 'DESC'], ['name', 'ASC']], limit: 100, offset: 0
    });
  });
});
