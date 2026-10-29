require('module-alias/register');
const { Op } = require('sequelize');
const { AuditEvent, Branch, User } = require('../src/models');
const controller = require('../src/controllers/administration/audit-trail.controller');

const response = () => ({
  status: jest.fn(function (code) { this.statusCode = code; return this; }),
  json: jest.fn(function (body) { this.body = body; return this; })
});

describe('School Admin Audit Trail API', () => {
  afterEach(() => jest.restoreAllMocks());

  it('filters by tenant and branch and returns bounded search pagination', async () => {
    const branchLookup = jest.spyOn(Branch, 'findOne').mockResolvedValue({ id: 'branch-1' });
    const find = jest.spyOn(AuditEvent, 'findAndCountAll').mockResolvedValue({ rows: [{ id: 'event-1' }], count: 26 });
    const res = response();

    await controller.list({
      user: { role: 'admin', school_id: 'school-1' },
      query: { branch_id: 'branch-1', search: 'updated', from: '2026-10-01', page: '2', limit: '250' }
    }, res);

    const options = find.mock.calls[0][0];
    expect(branchLookup).toHaveBeenCalledWith({ where: { id: 'branch-1', school_id: 'school-1' } });
    expect(options.where.school_id).toBe('school-1');
    expect(options.where.branch_id).toBe('branch-1');
    expect(options.where.created_at[Op.gte]).toEqual(new Date('2026-10-01T00:00:00.000Z'));
    expect(options.limit).toBe(100);
    expect(options.offset).toBe(100);
    expect(options.where[Op.or]).toHaveLength(6);
    expect(res.body.pagination).toEqual({ page: 2, limit: 100, total: 26, pages: 1 });
  });

  it('requires a selected school for platform admins and rejects a foreign branch', async () => {
    const find = jest.spyOn(AuditEvent, 'findAndCountAll');
    let res = response();
    await controller.list({ user: { role: 'super_admin' }, query: {} }, res);
    expect(res.statusCode).toBe(400);

    jest.spyOn(Branch, 'findOne').mockResolvedValue(null);
    res = response();
    await controller.list({
      user: { role: 'admin', school_id: 'school-1' }, query: { branch_id: 'foreign-branch' }
    }, res);
    expect(res.statusCode).toBe(400);
    expect(find).not.toHaveBeenCalled();
  });

  it('rejects invalid audit date ranges without querying', async () => {
    const find = jest.spyOn(AuditEvent, 'findAndCountAll');
    const res = response();
    await controller.list({ user: { role: 'admin', school_id: 'school-1' }, query: { from: '2026-02-30' } }, res);
    expect(res.statusCode).toBe(400);
    expect(find).not.toHaveBeenCalled();
  });

  it('sorts by approved user/activity/date fields with deterministic direction', async () => {
    const find = jest.spyOn(AuditEvent, 'findAndCountAll').mockResolvedValue({ rows: [], count: 0 });
    const res = response();
    await controller.list({
      user: { role: 'admin', school_id: 'school-1' },
      query: { sort_by: 'user', sort_order: 'asc' }
    }, res);
    expect(find.mock.calls[0][0].order).toEqual([
      [{ model: User, as: 'actor' }, 'first_name', 'ASC'],
      [{ model: User, as: 'actor' }, 'last_name', 'ASC'],
      ['created_at', 'DESC']
    ]);

    await controller.list({
      user: { role: 'admin', school_id: 'school-1' },
      query: { sort_by: 'activity', sort_order: 'invalid' }
    }, res);
    expect(find.mock.calls[1][0].order).toEqual([
      ['action', 'DESC'],
      ['created_at', 'DESC']
    ]);

    await controller.list({
      user: { role: 'admin', school_id: 'school-1' },
      query: { sort_by: 'untrusted', sort_order: 'asc' }
    }, res);
    expect(find.mock.calls[2][0].order).toEqual([['created_at', 'ASC']]);
  });
});
