require('module-alias/register');

const { sequelize, School, SettingsChangeLog } = require('../src/models');
const controller = require('../src/controllers/administration/settings/settings-history.controller');

const call = async (method, req) => {
  let body;
  let statusCode = 200;
  const res = {
    status(code) { statusCode = code; return this; },
    json(payload) { body = payload; return this; }
  };
  await controller[method](req, res);
  return { body, statusCode };
};

describe('system settings history', () => {
  afterEach(() => jest.restoreAllMocks());

  it('lists records only for the Platform Owner selected school', async () => {
    const findAndCountAll = jest.spyOn(SettingsChangeLog, 'findAndCountAll').mockResolvedValue({ rows: [], count: 0 });
    const { statusCode } = await call('list', {
      user: { role: 'super_admin' }, schoolId: 'selected-school', query: { page: '2', limit: '10' }
    });
    expect(statusCode).toBe(200);
    expect(findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { school_id: 'selected-school' }, limit: 10, offset: 10
    }));
  });

  it('applies case-insensitive search and inclusive date filters without widening school scope', async () => {
    const findAndCountAll = jest.spyOn(SettingsChangeLog, 'findAndCountAll').mockResolvedValue({ rows: [], count: 0 });
    const { statusCode } = await call('list', {
      user: { role: 'admin', school_id: 'school-1' },
      query: { search: 'theme', from: '2026-10-01', to: '2026-10-28' }
    });
    const options = findAndCountAll.mock.calls[0][0];
    expect(statusCode).toBe(200);
    expect(options.where.school_id).toBe('school-1');
    expect(options.where.created_at).toEqual(expect.objectContaining({
      [require('sequelize').Op.gte]: new Date('2026-10-01T00:00:00.000Z'),
      [require('sequelize').Op.lt]: new Date('2026-10-29T00:00:00.000Z')
    }));
    expect(options.where[require('sequelize').Op.or]).toHaveLength(4);
    expect(options.distinct).toBe(true);
  });

  it('rejects invalid or reversed history date ranges', async () => {
    const findAndCountAll = jest.spyOn(SettingsChangeLog, 'findAndCountAll');
    for (const query of [
      { from: '2026-02-30' },
      { from: '2026-10-29', to: '2026-10-28' }
    ]) {
      const { body, statusCode } = await call('list', {
        user: { role: 'admin', school_id: 'school-1' }, query
      });
      expect(statusCode).toBe(400);
      expect(body.message).toBe('Enter a valid date range.');
    }
    expect(findAndCountAll).not.toHaveBeenCalled();
  });

  it('refuses restoration when a selected setting no longer matches the saved value', async () => {
    jest.spyOn(sequelize, 'transaction').mockImplementation(async callback => callback({}));
    jest.spyOn(SettingsChangeLog, 'findOne').mockResolvedValue({
      id: 'change-1', undo_of_id: null,
      changes: { defaultTheme: { before: { exists: true, value: 'dark' }, after: { exists: true, value: 'light' } } }
    });
    const update = jest.fn();
    jest.spyOn(School, 'findByPk').mockResolvedValue({ settings: { defaultTheme: 'auto' }, update });
    const create = jest.spyOn(SettingsChangeLog, 'create');

    const { body, statusCode } = await call('undo', {
      user: { role: 'admin', school_id: 'school-1', id: 'admin-1' },
      params: { id: 'change-1' }, body: { fields: ['defaultTheme'] }
    });

    expect(statusCode).toBe(409);
    expect(body.success).toBe(false);
    expect(update).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('restores only selected unchanged fields and records an inverse event', async () => {
    jest.spyOn(sequelize, 'transaction').mockImplementation(async callback => callback({}));
    const changes = {
      defaultTheme: { before: { exists: true, value: 'dark' }, after: { exists: true, value: 'light' } },
      showNotifications: { before: { exists: false, value: null }, after: { exists: true, value: false } }
    };
    jest.spyOn(SettingsChangeLog, 'findOne').mockResolvedValue({ id: 'change-1', undo_of_id: null, category: 'system_preferences', changes });
    const school = { settings: { defaultTheme: 'light', showNotifications: false }, update: jest.fn() };
    jest.spyOn(School, 'findByPk').mockResolvedValue(school);
    const create = jest.spyOn(SettingsChangeLog, 'create').mockResolvedValue({});

    const { body, statusCode } = await call('undo', {
      user: { role: 'admin', school_id: 'school-1', id: 'admin-1' },
      params: { id: 'change-1' }, body: { fields: ['showNotifications'] }
    });

    expect(statusCode).toBe(200);
    expect(body.data.restored_count).toBe(1);
    expect(school.update).toHaveBeenCalledWith({ settings: { defaultTheme: 'light' } }, { transaction: expect.any(Object) });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      school_id: 'school-1', actor_id: 'admin-1', undo_of_id: 'change-1',
      changes: { showNotifications: { before: changes.showNotifications.after, after: changes.showNotifications.before } }
    }), { transaction: expect.any(Object) });
  });
});
