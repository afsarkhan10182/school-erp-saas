require('module-alias/register');

const SystemSettingsController = require('../src/controllers/administration/settings/system-settings.controller');
const { sequelize, School, SettingsChangeLog } = require('../src/models');

const callController = async (method, req) => {
  let body;
  let statusCode = 200;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      body = payload;
      return this;
    }
  };

  await SystemSettingsController[method](req, res);
  return { body, statusCode };
};

describe('school system preferences', () => {
  beforeEach(() => {
    jest.spyOn(sequelize, 'transaction').mockImplementation(async callback => callback({}));
    jest.spyOn(SettingsChangeLog, 'create').mockResolvedValue({});
  });

  afterEach(() => jest.restoreAllMocks());

  it('loads fields shown by the settings form from school columns and settings JSON', async () => {
    jest.spyOn(School, 'findByPk').mockResolvedValue({
      date_format: 'YYYY-MM-DD',
      settings: { itemsPerPage: 50, showNotifications: false, defaultTheme: 'dark' }
    });

    const { body, statusCode } = await callController('getSystemSettings', {
      user: { school_id: 'school-1' }
    });

    expect(statusCode).toBe(200);
    expect(body.data.systemSettings).toMatchObject({
      dateFormat: 'YYYY-MM-DD',
      itemsPerPage: 50,
      showNotifications: false,
      defaultTheme: 'dark'
    });
  });

  it('uses the explicitly selected school for Platform Owner reads', async () => {
    const findByPk = jest.spyOn(School, 'findByPk').mockResolvedValue({
      date_format: 'YYYY-MM-DD',
      settings: {}
    });

    const { statusCode } = await callController('getSystemSettings', {
      user: { role: 'super_admin', school_id: null },
      schoolId: 'selected-school'
    });

    expect(statusCode).toBe(200);
    expect(findByPk).toHaveBeenCalledWith('selected-school', expect.any(Object));
  });

  it('requires an explicit school before Platform Owner settings reads or writes', async () => {
    const findByPk = jest.spyOn(School, 'findByPk');
    const user = { role: 'super_admin', school_id: null };

    const read = await callController('getSystemSettings', { user });
    const write = await callController('updateSystemSettings', {
      user,
      body: { systemSettings: { dateFormat: 'YYYY-MM-DD' } }
    });

    expect(read.statusCode).toBe(400);
    expect(write.statusCode).toBe(400);
    expect(findByPk).not.toHaveBeenCalled();
  });

  it('saves the form contract while preserving other system configuration', async () => {
    const school = {
      date_format: 'DD/MM/YYYY',
      settings: { defaultTheme: 'dark', existingPreference: 'keep' },
      update: jest.fn(async values => Object.assign(school, values))
    };
    jest.spyOn(School, 'findByPk').mockResolvedValue(school);

    const { body, statusCode } = await callController('updateSystemSettings', {
      user: { school_id: 'school-1' },
      body: {
        systemSettings: {
          dateFormat: 'MM/DD/YYYY',
          itemsPerPage: '100',
          showNotifications: false
        }
      }
    });

    expect(statusCode).toBe(200);
    expect(school.update).toHaveBeenCalledWith({
      settings: {
        defaultTheme: 'dark',
        existingPreference: 'keep',
        dateFormat: 'MM/DD/YYYY',
        itemsPerPage: 100,
        showNotifications: false
      },
      date_format: 'MM/DD/YYYY'
    }, { transaction: expect.any(Object) });
    expect(SettingsChangeLog.create).toHaveBeenCalledWith(expect.objectContaining({
      school_id: 'school-1',
      category: 'system_preferences',
      changes: expect.objectContaining({
        dateFormat: {
          before: { exists: true, value: 'DD/MM/YYYY' },
          after: { exists: true, value: 'MM/DD/YYYY' }
        },
        itemsPerPage: {
          before: { exists: false, value: null },
          after: { exists: true, value: 100 }
        }
      })
    }), { transaction: expect.any(Object) });
    expect(body.data.systemSettings).toMatchObject({
      dateFormat: 'MM/DD/YYYY',
      itemsPerPage: 100,
      showNotifications: false
    });
  });

  it('keeps the generic system-config updater contract used by ConfigManager', async () => {
    const school = {
      settings: { existingPreference: true },
      update: jest.fn()
    };
    jest.spyOn(School, 'findByPk').mockResolvedValue(school);

    const { statusCode } = await callController('updateSystemSettings', {
      user: { school_id: 'school-1' },
      body: { systemSettings: { customPreference: 'enabled' } }
    });

    expect(statusCode).toBe(200);
    expect(school.update).toHaveBeenCalledWith({
      settings: { existingPreference: true, customPreference: 'enabled' }
    }, { transaction: expect.any(Object) });
  });

  it.each([
    [{ dateFormat: '13/13/2026' }, 'Invalid date format'],
    [{ itemsPerPage: '40' }, 'Invalid items per page'],
    [{ defaultPaginationSize: '40' }, 'Invalid pagination size'],
    [{ showNotifications: 'false' }, 'Invalid notification preference']
  ])('rejects invalid form preferences before writing', async (settings, message) => {
    const findByPk = jest.spyOn(School, 'findByPk');

    const { body, statusCode } = await callController('updateSystemSettings', {
      user: { school_id: 'school-1' },
      body: { systemSettings: settings }
    });

    expect(statusCode).toBe(400);
    expect(body.message).toBe(message);
    expect(findByPk).not.toHaveBeenCalled();
  });

  it('rejects non-object settings before writing', async () => {
    const findByPk = jest.spyOn(School, 'findByPk');

    const { body, statusCode } = await callController('updateSystemSettings', {
      user: { school_id: 'school-1' },
      body: { systemSettings: [] }
    });

    expect(statusCode).toBe(400);
    expect(body.message).toBe('System settings must be an object');
    expect(findByPk).not.toHaveBeenCalled();
  });
});
