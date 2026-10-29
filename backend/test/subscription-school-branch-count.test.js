require('module-alias/register');
const { School, Branch } = require('../src/models');
const { Op } = require('sequelize');
const SubscriptionService = require('../src/services/administration/subscriptions/subscription.service');

describe('school subscription directory branch counts', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('returns actual branch counts, including zero, for each paginated school', async () => {
    jest.spyOn(School, 'findAndCountAll').mockResolvedValue({
      count: 2,
      rows: [
        { id: 'school-a', toJSON: () => ({ id: 'school-a', name: 'Two Branches' }) },
        { id: 'school-b', toJSON: () => ({ id: 'school-b', name: 'No Branches' }) }
      ]
    });
    const findBranches = jest.spyOn(Branch, 'findAll').mockResolvedValue([
      { school_id: 'school-a', branch_count: '2' }
    ]);

    const result = await SubscriptionService.getSchoolsWithSubscriptions({ page: 1, limit: 10 });

    expect(result.schools.map(school => school.branch_count)).toEqual([2, 0]);
    expect(findBranches).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { school_id: ['school-a', 'school-b'] },
        group: ['school_id'],
        raw: true
      })
    );
  });

  it('passes the inactive status filter through to the tenant query', async () => {
    const findSchools = jest.spyOn(School, 'findAndCountAll').mockResolvedValue({ count: 0, rows: [] });

    await SubscriptionService.getSchoolsWithSubscriptions({ status: 'inactive' });

    expect(findSchools).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'inactive' } })
    );
  });

  it('filters expiring active and trial subscriptions to the next 30 days', async () => {
    const findSchools = jest.spyOn(School, 'findAndCountAll').mockResolvedValue({ count: 0, rows: [] });
    jest.useFakeTimers().setSystemTime(new Date('2026-10-27T12:00:00.000Z'));

    await SubscriptionService.getSchoolsWithSubscriptions({ status: 'expiring' });

    const where = findSchools.mock.calls[0][0].where;
    expect(where.status).toEqual({ [Op.in]: ['active', 'trial'] });
    expect(where.subscription_end_date[Op.between].map(date => date.toISOString())).toEqual([
      '2026-10-27T12:00:00.000Z',
      '2026-11-26T12:00:00.000Z'
    ]);
  });

  it('filters registration windows and applies allowlisted directory sort orders', async () => {
    const findSchools = jest.spyOn(School, 'findAndCountAll').mockResolvedValue({ count: 0, rows: [] });
    jest.useFakeTimers().setSystemTime(new Date('2026-10-27T12:00:00.000Z'));

    await SubscriptionService.getSchoolsWithSubscriptions({
      registered_period: '30d',
      sort: 'expiry_soonest'
    });

    expect(findSchools).toHaveBeenCalledWith(expect.objectContaining({
      where: { created_at: { [Op.gte]: new Date('2026-09-27T12:00:00.000Z') } },
      order: [['subscription_end_date', 'ASC']]
    }));
  });

  it.each([
    ['newest', [['created_at', 'DESC']]],
    ['oldest', [['created_at', 'ASC']]],
    ['name_asc', [['name', 'ASC']]],
    ['name_desc', [['name', 'DESC']]],
    ['expiry_soonest', [['subscription_end_date', 'ASC']]]
  ])('sorts the tenant directory by %s', async (sort, order) => {
    const findSchools = jest.spyOn(School, 'findAndCountAll').mockResolvedValue({ count: 0, rows: [] });

    await SubscriptionService.getSchoolsWithSubscriptions({ sort });

    expect(findSchools.mock.calls[0][0].order).toEqual(order);
  });

  it.each([
    [{ sort: 'created_at; DROP TABLE schools' }, 'Invalid school directory sort'],
    [{ registered_period: 'all-time' }, 'Invalid school registration period']
  ])('rejects unrecognized directory query values', async (params, message) => {
    const findSchools = jest.spyOn(School, 'findAndCountAll');

    await expect(SubscriptionService.getSchoolsWithSubscriptions(params)).rejects.toMatchObject({
      statusCode: 400,
      message
    });
    expect(findSchools).not.toHaveBeenCalled();
  });
});
