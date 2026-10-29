const auditContext = require('~/utils/shared/auditContext');
const { logger } = require('~/utils/shared/logger');
const { Op } = require('sequelize');

const sensitiveKey = /password|secret|token|api.?key|credential|authorization|private.?file|access.?key|refresh.?key|salt/i;
const ignoredFields = new Set(['createdAt', 'updatedAt', 'created_at', 'updated_at']);

const safeValue = (value, key = '') => {
  if (sensitiveKey.test(key)) return '[redacted]';
  if (value === null || value === undefined || typeof value === 'boolean' || typeof value === 'number') return value ?? null;
  if (typeof value === 'string') return value.length > 2000 ? '[omitted: value too large]' : value;
  if (Buffer.isBuffer(value)) return '[binary data]';
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.slice(0, 100).map(item => safeValue(item));
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).slice(0, 100).map(([childKey, childValue]) => [childKey, safeValue(childValue, childKey)]));
  }
  return String(value);
};

const snapshot = (instance, fields) => Object.fromEntries(
  fields.filter(field => !ignoredFields.has(field)).map(field => [field, safeValue(instance.get(field), field)])
);

const persist = async (AuditEvent, instance, action, changes, options = {}) => {
  const context = auditContext.get();
  if (!context?.actor_id || !context?.school_id || !Object.keys(changes).length || /\/import(?:\/|\?|$)/i.test(context.request_path || '')) return;
  const model = instance.constructor;
  const recordId = instance.get(model.primaryKeyAttribute || 'id');
  try {
    await AuditEvent.create({
      school_id: instance.get('school_id') || context.school_id,
      branch_id: instance.get('branch_id') || context.branch_id || null,
      actor_id: context.actor_id,
      actor_role: context.actor_role,
      action,
      entity_name: model.name,
      record_id: recordId === null || recordId === undefined ? null : String(recordId),
      changes,
      request_method: context.request_method,
      request_path: context.request_path
    }, { transaction: options.transaction, hooks: false });
  } catch (error) {
    logger.error('Audit event persistence failed', {
      action,
      entity: model.name,
      recordId: recordId === undefined ? null : String(recordId),
      message: error.message
    });
    if (options.transaction) throw error;
  }
};

const persistBulk = async (AuditEvent, options, action, changes) => {
  const context = auditContext.get();
  const model = options.model;
  if (!context?.actor_id || !context?.school_id || !model || /\/import(?:\/|\?|$)/i.test(context.request_path || '')) return;
  try {
    await AuditEvent.create({
      school_id: context.school_id,
      branch_id: context.branch_id || null,
      actor_id: context.actor_id,
      actor_role: context.actor_role,
      action,
      entity_name: model.name,
      record_id: null,
      changes,
      request_method: context.request_method,
      request_path: context.request_path
    }, { transaction: options.transaction, hooks: false });
  } catch (error) {
    logger.error('Bulk audit event persistence failed', { action, entity: model.name, message: error.message });
    if (options.transaction) throw error;
  }
};

const registerAuditHooks = (models, AuditEvent) => {
  for (const model of new Set(Object.values(models))) {
    if (!model?.addHook || model === AuditEvent || model.name === 'SettingsChangeLog') continue;
    model.addHook('afterCreate', 'schoolAuditAfterCreate', (instance, options) =>
      persist(AuditEvent, instance, 'created', { after: snapshot(instance, Object.keys(instance.dataValues)) }, options)
    );
    model.addHook('beforeUpdate', 'schoolAuditBeforeUpdate', (instance, options) => {
      const fields = instance.changed() || [];
      options.auditTrailBefore = snapshot(instance, fields);
    });
    model.addHook('afterUpdate', 'schoolAuditAfterUpdate', (instance, options) => {
      const before = options.auditTrailBefore || {};
      const fields = Object.keys(before);
      const after = snapshot(instance, fields);
      return persist(AuditEvent, instance, 'updated', {
        before,
        after
      }, options);
    });
    model.addHook('beforeDestroy', 'schoolAuditBeforeDestroy', (instance, options) => {
      options.auditTrailBefore = snapshot(instance, Object.keys(instance.dataValues));
    });
    model.addHook('afterDestroy', 'schoolAuditAfterDestroy', (instance, options) =>
      persist(AuditEvent, instance, 'deleted', { before: options.auditTrailBefore || {} }, options)
    );
    model.addHook('afterBulkCreate', 'schoolAuditAfterBulkCreate', async (instances, options) => {
      if (options.individualHooks) return;
      for (const instance of instances) {
        await persist(AuditEvent, instance, 'created', { after: snapshot(instance, Object.keys(instance.dataValues)) }, options);
      }
    });
    model.addHook('beforeBulkUpdate', 'schoolAuditBeforeBulkUpdate', async options => {
      if (!auditContext.get()?.actor_id || !options.model?.count) return;
      options.auditTrailAffectedCount = await options.model.count({ where: options.where, transaction: options.transaction });
    });
    model.addHook('afterBulkUpdate', 'schoolAuditAfterBulkUpdate', (options) => {
      if (options.individualHooks) return;
      const fields = Object.keys(options.attributes || {}).filter(field => !ignoredFields.has(field));
      return persistBulk(AuditEvent, options, 'bulk_updated', {
        bulk: true,
        affected_count: options.auditTrailAffectedCount,
        fields,
        after: snapshot({ get: field => options.attributes?.[field] }, fields),
        note: 'Bulk operation; per-record before values are unavailable.'
      });
    });
    model.addHook('beforeBulkDestroy', 'schoolAuditBeforeBulkDestroy', async options => {
      if (!auditContext.get()?.actor_id || !options.model?.count) return;
      options.auditTrailAffectedCount = await options.model.count({ where: options.where, transaction: options.transaction });
    });
    model.addHook('afterBulkDestroy', 'schoolAuditAfterBulkDestroy', options =>
      options.individualHooks ? undefined : persistBulk(AuditEvent, options, 'bulk_deleted', {
        bulk: true,
        affected_count: options.auditTrailAffectedCount,
        filter_fields: Object.keys(options.where || {}),
        note: 'Bulk operation; per-record values are unavailable.'
      })
    );
  }
};

const cleanupExpiredAuditEvents = AuditEvent => AuditEvent.destroy({
  where: { created_at: { [Op.lt]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } }
});

const startAuditRetentionCleanup = AuditEvent => {
  const cleanup = () => cleanupExpiredAuditEvents(AuditEvent)
    .catch(error => logger.warn('Audit retention cleanup failed', { message: error.message }));
  cleanup();
  const timer = setInterval(cleanup, 24 * 60 * 60 * 1000);
  timer.unref();
  return timer;
};

module.exports = { registerAuditHooks, safeValue, snapshot, cleanupExpiredAuditEvents, startAuditRetentionCleanup };
