<template>
  <main class="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
    <header>
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Audit Trail</h1>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">School record changes with actor, tenant, branch, and field-level deltas.</p>
      <p class="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
        Audit events are retained for 90 days. Bulk updates and deletes are recorded as aggregate operations; they do not include per-record before values.
      </p>
      <p v-if="exportNotice" role="status" class="mt-3 text-sm text-green-700 dark:text-green-300">{{ exportNotice }}</p>
      <p v-if="exportError" role="alert" class="mt-3 text-sm text-red-700 dark:text-red-300">{{ exportError }}</p>
    </header>

    <form class="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:grid-cols-2 lg:grid-cols-4" @submit.prevent="applyFilters">
      <label class="text-sm text-gray-700 dark:text-gray-300">Search
        <input v-model.trim="filters.search" class="input-field mt-1" type="search" placeholder="Actor, entity, or field value" />
      </label>
      <label class="text-sm text-gray-700 dark:text-gray-300">Activity
        <select v-model="filters.action" class="input-field mt-1">
          <option value="">All activity</option>
          <option value="created">Created</option>
          <option value="updated">Updated</option>
          <option value="deleted">Deleted</option>
          <option value="bulk_updated">Bulk updated</option>
          <option value="bulk_deleted">Bulk deleted</option>
        </select>
      </label>
      <label class="text-sm text-gray-700 dark:text-gray-300">Entity
        <input v-model.trim="filters.entity" class="input-field mt-1" placeholder="e.g. Student" />
      </label>
      <label class="text-sm text-gray-700 dark:text-gray-300">Rows per page
        <select v-model.number="pagination.limit" class="input-field mt-1">
          <option v-for="size in [10, 25, 50, 100]" :key="size" :value="size">{{ size }}</option>
        </select>
      </label>
      <label class="text-sm text-gray-700 dark:text-gray-300">From
        <input v-model="filters.from" class="input-field mt-1" type="date" />
      </label>
      <label class="text-sm text-gray-700 dark:text-gray-300">To
        <input v-model="filters.to" class="input-field mt-1" type="date" />
      </label>
      <div class="flex items-end gap-2 lg:col-span-2">
        <button class="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50" :disabled="loading">Filter</button>
        <button type="button" class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:border-gray-600" :disabled="loading" @click="resetFilters">Reset</button>
      </div>
    </form>

    <p v-if="error" role="alert" class="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{{ error }}</p>
    <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <h2 class="font-semibold text-gray-900 dark:text-white">School activity</h2>
        <div class="flex flex-wrap items-center gap-2">
          <span class="mr-1 text-sm text-gray-500">{{ pagination.total }} events</span>
          <button v-for="format in exportFormats" :key="format" type="button" class="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium capitalize text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700" :disabled="exporting || loading" @click="exportAuditTrail(format)">{{ exporting ? 'Preparing…' : format }}</button>
        </div>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-700">
        <div class="flex flex-wrap items-center gap-2" role="group" aria-label="Sort audit events">
          <span class="text-xs font-medium text-gray-500">Sort by</span>
          <button v-for="field in sortFields" :key="field.value" type="button" class="rounded-md px-2.5 py-1.5 text-xs font-medium" :class="sortBy === field.value ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'" :aria-pressed="sortBy === field.value" @click="setSort(field.value)">{{ field.label }}</button>
          <button type="button" class="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs text-gray-700 dark:border-gray-600 dark:text-gray-200" :aria-label="sortOrder === 'desc' ? 'Descending order' : 'Ascending order'" @click="toggleSortOrder">{{ sortOrder === 'desc' ? 'Newest / Z–A' : 'Oldest / A–Z' }}</button>
        </div>
        <div class="flex items-center gap-1" role="group" aria-label="Audit event layout">
          <button v-for="mode in viewModes" :key="mode" type="button" class="rounded-md px-2.5 py-1.5 text-xs font-medium capitalize" :class="viewMode === mode ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'" :aria-pressed="viewMode === mode" @click="viewMode = mode">{{ mode }}</button>
        </div>
      </div>
      <p v-if="loading" class="p-6 text-sm text-gray-500">Loading audit events…</p>
      <p v-else-if="!entries.length" class="p-6 text-sm text-gray-500">No audit events match these filters.</p>
      <ul v-else :class="viewMode === 'grid' ? 'grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3' : 'divide-y divide-gray-100 dark:divide-gray-700'">
        <li v-for="entry in entries" :key="entry.id" :class="viewMode === 'grid' ? 'rounded-lg border border-gray-200 p-4 dark:border-gray-700' : 'p-4 sm:p-5'">
          <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold capitalize text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">{{ actionLabel(entry.action) }}</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ entry.entity_name }}</span>
                <span v-if="entry.record_id" class="break-all text-xs text-gray-500">#{{ entry.record_id }}</span>
              </div>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">{{ actorName(entry) }} · {{ entry.actor_role || 'unknown role' }}<span v-if="entry.branch_id"> · branch {{ entry.branch_id }}</span></p>
              <p v-if="entry.request_path" class="mt-1 break-all text-xs text-gray-500">{{ entry.request_method }} {{ entry.request_path }}</p>
            </div>
            <time class="text-xs text-gray-500 sm:text-right">{{ formatDate(entry.created_at) }}</time>
          </div>
          <details v-if="entry.changes" class="mt-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
            <summary class="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-200">Review recorded changes</summary>
            <p v-if="entry.changes.note" class="mt-2 text-xs text-amber-700 dark:text-amber-300">{{ entry.changes.note }}<span v-if="entry.changes.affected_count !== undefined"> ({{ entry.changes.affected_count }} rows)</span></p>
            <div v-if="changeFields(entry).length" class="mt-3 divide-y divide-gray-100 dark:divide-gray-700">
              <div v-for="field in changeFields(entry)" :key="field" class="grid gap-2 py-2 text-sm sm:grid-cols-[minmax(100px,0.7fr)_1fr_1fr]">
                <span class="font-medium text-gray-700 dark:text-gray-200">{{ field }}</span>
                <span class="break-words text-gray-600 dark:text-gray-300"><b class="mr-1 text-xs text-gray-500">Before</b>{{ showValue(entry.changes.before?.[field]) }}</span>
                <span class="break-words text-gray-600 dark:text-gray-300"><b class="mr-1 text-xs text-gray-500">After</b>{{ showValue(entry.changes.after?.[field]) }}</span>
              </div>
            </div>
            <p v-else-if="!entry.changes.note" class="mt-2 text-sm text-gray-500">No field-level values were recorded for this event.</p>
          </details>
        </li>
      </ul>
      <footer v-if="pagination.pages > 1" class="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
        <button class="rounded border px-3 py-1.5 text-sm disabled:opacity-40 dark:border-gray-600" :disabled="pagination.page <= 1 || loading" @click="changePage(-1)">Previous</button>
        <span class="text-xs text-gray-500">Page {{ pagination.page }} of {{ pagination.pages }}</span>
        <button class="rounded border px-3 py-1.5 text-sm disabled:opacity-40 dark:border-gray-600" :disabled="pagination.page >= pagination.pages || loading" @click="changePage(1)">Next</button>
      </footer>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { AuditTrail } from '~/api/administration/audit-trail';
import { Export } from '~/api/shared/export';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { usePrintReport } from '~/composables/usePrintReport';
import { apiErrorMessage } from '~/utils/list-response';

const { effectiveBranchId, currentSchool } = useGlobalBranch();
const entries = ref<any[]>([]);
const loading = ref(false);
const error = ref('');
const exporting = ref(false);
const exportError = ref('');
const exportNotice = ref('');
const filters = reactive({ search: '', action: '', entity: '', from: '', to: '' });
const pagination = reactive({ page: 1, limit: 25, total: 0, pages: 0 });
const sortBy = ref<'date' | 'user' | 'activity'>('date');
const sortOrder = ref<'asc' | 'desc'>('desc');
const viewMode = ref<'list' | 'grid'>('list');
const viewModes = ['list', 'grid'] as const;
const sortFields = [
  { value: 'date', label: 'Date' },
  { value: 'user', label: 'User' },
  { value: 'activity', label: 'Activity' }
] as const;
const { printReport, openPrintWindow } = usePrintReport();
const auditExportColumns = [
  { key: 'created_at', header: 'Date' }, { key: 'actor_name', header: 'User' },
  { key: 'actor_role', header: 'Role' }, { key: 'action', header: 'Activity' },
  { key: 'entity_name', header: 'Entity' }, { key: 'record_id', header: 'Record ID' },
  { key: 'branch_id', header: 'Branch ID' }, { key: 'request', header: 'Request' },
  { key: 'changes', header: 'Recorded Changes' }
];
const exportFormats = ['copy', 'csv', 'excel', 'pdf', 'print'] as const;

const load = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response: any = await AuditTrail.list({
      ...(currentSchool.value?.id ? { school_id: currentSchool.value.id } : {}),
      ...(effectiveBranchId.value ? { branch_id: effectiveBranchId.value } : {}),
      ...filters, sort_by: sortBy.value, sort_order: sortOrder.value,
      page: pagination.page, limit: pagination.limit
    });
    entries.value = response.data || [];
    Object.assign(pagination, response.pagination || {});
  } catch (err: any) {
    error.value = apiErrorMessage(err, 'Unable to load audit events.');
    entries.value = [];
    pagination.total = 0;
    pagination.pages = 0;
  } finally {
    loading.value = false;
  }
};
const applyFilters = () => { pagination.page = 1; load(); };
const resetFilters = () => {
  Object.assign(filters, { search: '', action: '', entity: '', from: '', to: '' });
  pagination.limit = 25;
  sortBy.value = 'date';
  sortOrder.value = 'desc';
  applyFilters();
};
const changePage = (delta: number) => { pagination.page += delta; load(); };
const setSort = (field: (typeof sortFields)[number]['value']) => {
  if (sortBy.value === field) return;
  sortBy.value = field;
  sortOrder.value = 'desc';
  applyFilters();
};
const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc';
  applyFilters();
};
const exportAuditTrail = async (format: (typeof exportFormats)[number]) => {
  const printWindow = format === 'print' ? openPrintWindow() : null;
  if (format === 'print' && !printWindow) {
    exportError.value = 'Allow popups to print the audit trail.';
    return;
  }
  exporting.value = true;
  exportError.value = '';
  exportNotice.value = '';
  try {
    const response = await Export.exportData({
      report_type: 'audit_events', format: format === 'copy' ? 'print' : format,
      columns: JSON.stringify(auditExportColumns),
      ...(currentSchool.value?.id ? { school_id: currentSchool.value.id } : {}),
      ...(effectiveBranchId.value ? { branch_id: effectiveBranchId.value } : {}),
      search: filters.search, action: filters.action, entity: filters.entity,
      from: filters.from, to: filters.to, sort_by: sortBy.value, sort_order: sortOrder.value
    });
    if (format === 'copy' || format === 'print') {
      const payload = JSON.parse(await response.data.text());
      const rows = payload?.data?.data?.data;
      if (!Array.isArray(rows) || !rows.length) {
        printWindow?.close();
        exportError.value = 'No audit events match these filters.';
        return;
      }
      if (format === 'copy') {
        const text = [auditExportColumns.map(column => column.header).join('\t'), ...rows.map(row => auditExportColumns.map(column => String(row[column.key] ?? '').replace(/[\t\r\n]+/g, ' ')).join('\t'))].join('\n');
        await navigator.clipboard.writeText(text);
        exportNotice.value = `Copied ${rows.length} filtered audit events.`;
      } else {
        const safeRows = rows.map(row => Object.fromEntries(auditExportColumns.map(({ key }) => [key, typeof row[key] === 'string' ? row[key].replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]) : row[key]])));
        await printReport({ title: 'Audit Trail', data: safeRows, columns: auditExportColumns, filters: {}, reportType: 'audit_events' }, { showFilters: false, autoPrint: true, printWindow });
      }
      return;
    }
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-trail-${new Date().toISOString().slice(0, 10)}.${format === 'excel' ? 'xlsx' : format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err: any) {
    printWindow?.close();
    exportError.value = apiErrorMessage(err, `Unable to ${format} the audit trail.`);
  } finally {
    exporting.value = false;
  }
};
const actionLabel = (action: string) => ({
  created: 'Created', updated: 'Updated', deleted: 'Deleted', bulk_updated: 'Bulk updated', bulk_deleted: 'Bulk deleted'
}[action] || action.replaceAll('_', ' '));
const actorName = (entry: any) => entry.actor ? `${entry.actor.first_name || ''} ${entry.actor.last_name || ''}`.trim() || 'Former user' : 'Former user';
const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
const showValue = (value: any) => value === undefined ? '—' : typeof value === 'string' ? value : JSON.stringify(value);
const changeFields = (entry: any) => [...new Set([
  ...Object.keys(entry.changes?.before || {}),
  ...Object.keys(entry.changes?.after || {})
])];

watch(effectiveBranchId, () => { pagination.page = 1; load(); });
watch(() => pagination.limit, () => { pagination.page = 1; load(); });
onMounted(load);
</script>
