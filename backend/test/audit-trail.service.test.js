require('module-alias/register');
const auditContext = require('../src/utils/shared/auditContext');
const { registerAuditHooks } = require('../src/services/shared/audit-trail.service');

class SampleRecord {
  static hooks = {};
  static addHook(name, key, handler) { this.hooks[name] = handler; }
  static primaryKeyAttribute = 'id';
  static count = jest.fn();
  get(field) { return this.dataValues[field]; }
  changed() { return this.changedFields; }
}

describe('general audit event hooks', () => {
  let create;
  let hooks;

  beforeEach(() => {
    SampleRecord.hooks = {};
    SampleRecord.count.mockReset().mockResolvedValue(4);
    create = jest.fn().mockResolvedValue({});
    registerAuditHooks({ SampleRecord }, { create });
    hooks = SampleRecord.hooks;
  });

  it('records creates with request tenant/actor and redacts sensitive values', async () => {
    const instance = new SampleRecord();
    instance.dataValues = {
      id: 'record-1', school_id: 'school-1', branch_id: 'branch-1', name: 'Asha',
      password_hash: 'never-store-this', api_key: 'secret-value'
    };

    await auditContext.run({
      actor_id: 'admin-1', actor_role: 'admin', school_id: 'school-1',
      request_method: 'POST', request_path: '/api/students'
    }, () => hooks.afterCreate(instance, {}));

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      school_id: 'school-1', branch_id: 'branch-1', actor_id: 'admin-1',
      action: 'created', entity_name: 'SampleRecord', record_id: 'record-1',
      request_method: 'POST', request_path: '/api/students',
      changes: { after: expect.objectContaining({ password_hash: '[redacted]', api_key: '[redacted]' }) }
    }), expect.objectContaining({ hooks: false }));
  });

  it('stores before/after deltas for changed fields, redacting secrets on both sides', async () => {
    const instance = new SampleRecord();
    instance.dataValues = { id: 'record-2', school_id: 'school-1', name: 'Old', api_key: 'old-secret' };
    instance.changedFields = ['name', 'api_key'];
    const options = {};

    await auditContext.run({ actor_id: 'admin-1', actor_role: 'admin', school_id: 'school-1' }, async () => {
      hooks.beforeUpdate(instance, options);
      instance.dataValues.name = 'New';
      instance.dataValues.api_key = 'new-secret';
      await hooks.afterUpdate(instance, options);
    });

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      action: 'updated',
      changes: { before: { name: 'Old', api_key: '[redacted]' }, after: { name: 'New', api_key: '[redacted]' } }
    }), expect.any(Object));
  });

  it('does not write an event without an authenticated school actor', async () => {
    const instance = new SampleRecord();
    instance.dataValues = { id: 'record-3', school_id: 'school-1', name: 'Asha' };
    await hooks.afterCreate(instance, {});
    expect(create).not.toHaveBeenCalled();
  });

  it('records bulk updates as scoped aggregates with the affected row count', async () => {
    const options = { model: SampleRecord, where: { school_id: 'school-1' }, attributes: { status: 'inactive' } };
    await auditContext.run({ actor_id: 'admin-1', actor_role: 'admin', school_id: 'school-1' }, async () => {
      await hooks.beforeBulkUpdate(options);
      await hooks.afterBulkUpdate(options);
    });

    expect(SampleRecord.count).toHaveBeenCalledWith({ where: options.where, transaction: undefined });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      action: 'bulk_updated', entity_name: 'SampleRecord', record_id: null,
      changes: expect.objectContaining({ bulk: true, affected_count: 4, fields: ['status'], after: { status: 'inactive' } })
    }), expect.any(Object));
  });
});
