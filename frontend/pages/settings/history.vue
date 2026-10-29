<template>
  <main class="min-h-screen bg-gray-50 px-4 py-6 dark:bg-gray-900 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-6xl space-y-6">
      <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <NuxtLink to="/settings" class="text-sm text-indigo-600 hover:underline dark:text-indigo-400">← Settings</NuxtLink>
          <h1 class="mt-2 text-2xl font-bold text-gray-900 dark:text-white">System Settings History</h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Review and selectively restore recorded system preferences for this school.
          </p>
        </div>
        <button class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium dark:border-gray-600" :disabled="loading" @click="loadHistory">
          Refresh history
        </button>
      </header>

      <div class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
        Only non-secret System Preferences are recorded here. Restores apply school-wide and are allowed only while each selected value still matches the saved value.
      </div>

      <p v-if="error" role="alert" class="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{{ error }}</p>

      <form class="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[minmax(12rem,1fr)_repeat(2,minmax(9rem,auto))_auto_auto] dark:border-gray-700 dark:bg-gray-800" @submit.prevent="applyFilters">
        <label class="text-xs font-medium text-gray-600 dark:text-gray-300">Search changes
          <input v-model.trim="filters.search" type="search" maxlength="120" placeholder="Setting, value or administrator" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
        </label>
        <label class="text-xs font-medium text-gray-600 dark:text-gray-300">From
          <input v-model="filters.from" type="date" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
        </label>
        <label class="text-xs font-medium text-gray-600 dark:text-gray-300">To
          <input v-model="filters.to" type="date" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
        </label>
        <button type="submit" class="self-end rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50" :disabled="loading">Filter</button>
        <button type="button" class="self-end rounded-md border border-gray-300 px-4 py-2 text-sm font-medium dark:border-gray-600" :disabled="loading" @click="resetFilters">Reset</button>
      </form>

      <section class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <h2 class="font-semibold text-gray-900 dark:text-white">Recent preference changes</h2>
            <span class="text-xs text-gray-500">{{ pagination.total }} records</span>
          </div>
          <div v-if="loading" class="p-6 text-sm text-gray-500">Loading history…</div>
          <div v-else-if="!entries.length" class="p-6 text-sm text-gray-500">No system preference changes have been recorded yet.</div>
          <ul v-else class="divide-y divide-gray-100 dark:divide-gray-700">
            <li v-for="entry in entries" :key="entry.id">
              <button class="w-full px-4 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50" :class="selectedId === entry.id ? 'bg-indigo-50 dark:bg-indigo-950/30' : ''" @click="openEntry(entry.id)">
                <span class="flex items-start justify-between gap-3">
                  <span class="font-medium text-gray-900 dark:text-white">{{ entry.undo_of_id ? 'Put-back record' : 'System preferences' }}</span>
                  <span class="shrink-0 text-xs text-gray-500">{{ formatDate(entry.created_at) }}</span>
                </span>
                <span class="mt-1 block text-sm text-gray-600 dark:text-gray-300">{{ Object.keys(entry.changes || {}).map(field => fieldLabel(field)).join(', ') }}</span>
                <span class="mt-2 block text-xs text-gray-500">{{ actorName(entry.actor) }}</span>
              </button>
            </li>
          </ul>
          <footer v-if="pagination.pages > 1" class="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
            <button class="rounded border px-3 py-1.5 text-sm disabled:opacity-40 dark:border-gray-600" :disabled="pagination.page <= 1 || loading" @click="changePage(-1)">Previous</button>
            <span class="text-xs text-gray-500">Page {{ pagination.page }} of {{ pagination.pages }}</span>
            <button class="rounded border px-3 py-1.5 text-sm disabled:opacity-40 dark:border-gray-600" :disabled="pagination.page >= pagination.pages || loading" @click="changePage(1)">Next</button>
          </footer>
        </div>

        <div class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div class="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <h2 class="font-semibold text-gray-900 dark:text-white">Change details</h2>
            <p v-if="selected" class="mt-1 text-xs text-gray-500">{{ formatDate(selected.created_at) }} · {{ actorName(selected.actor) }}</p>
          </div>
          <div v-if="detailLoading" class="p-6 text-sm text-gray-500">Loading change details…</div>
          <div v-else-if="!selected" class="p-6 text-sm text-gray-500">Select a record to review its saved and current values.</div>
          <div v-else class="space-y-4 p-4">
            <div v-for="change in selected.changes" :key="change.field" class="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <label class="flex items-start gap-3">
                <input v-model="selectedFields" type="checkbox" :value="change.field" :disabled="!change.can_restore || restoring" class="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <span class="min-w-0 flex-1">
                  <span class="block font-medium text-gray-900 dark:text-white">{{ change.label }}</span>
                  <span class="mt-2 grid gap-2 text-xs sm:grid-cols-3">
                    <span><b class="block text-gray-500">Before</b>{{ formatValue(change.before) }}</span>
                    <span><b class="block text-gray-500">Saved as</b>{{ formatValue(change.saved) }}</span>
                    <span><b class="block text-gray-500">Right now</b>{{ formatValue(change.current) }}</span>
                  </span>
                  <span class="mt-2 block text-xs" :class="change.can_restore ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'">
                    {{ change.can_restore ? 'Can be restored' : 'Current value differs; refresh and review before restoring' }}
                  </span>
                </span>
              </label>
            </div>
            <div v-if="selected.can_restore" class="space-y-3 border-t border-gray-200 pt-4 dark:border-gray-700">
              <label class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input v-model="confirmed" type="checkbox" class="mt-1 rounded border-gray-300 text-indigo-600" />
                I understand selected preferences will change for the whole school immediately.
              </label>
              <button class="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50" :disabled="!confirmed || !selectedFields.length || restoring" @click="restoreSelected">
                {{ restoring ? 'Restoring…' : `Restore ${selectedFields.length || 'selected'} setting${selectedFields.length === 1 ? '' : 's'}` }}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { Settings } from '~/api/administration/settings';

const entries = ref<any[]>([]);
const selected = ref<any>(null);
const selectedId = ref('');
const selectedFields = ref<string[]>([]);
const confirmed = ref(false);
const loading = ref(false);
const detailLoading = ref(false);
const restoring = ref(false);
const error = ref('');
const filters = reactive({ search: '', from: '', to: '' });
const pagination = reactive({ page: 1, limit: 25, total: 0, pages: 0 });
const labels: Record<string, string> = {
  dateFormat: 'Date format', defaultLanguage: 'Default language', timeFormat: 'Time format',
  defaultTheme: 'Dashboard style', defaultPaginationSize: 'Default pagination size',
  itemsPerPage: 'Items per page', showNotifications: 'Show notifications'
};

const fieldLabel = (field: string) => labels[field] || field;
const actorName = (actor: any) => actor ? `${actor.first_name} ${actor.last_name}`.trim() : 'Former user';
const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
const formatValue = (state: any) => !state?.exists ? 'Not set' : typeof state.value === 'boolean' ? (state.value ? 'On' : 'Off') : String(state.value ?? '—');

const loadHistory = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response: any = await Settings.getSystemSettingsHistory({
      page: pagination.page, limit: pagination.limit,
      search: filters.search || '', from: filters.from || '', to: filters.to || ''
    });
    entries.value = response.data || [];
    Object.assign(pagination, response.pagination || {});
  } catch (err: any) {
    error.value = err.message || 'Unable to load settings history.';
  } finally {
    loading.value = false;
  }
};

const applyFilters = async () => {
  pagination.page = 1;
  selected.value = null;
  selectedId.value = '';
  selectedFields.value = [];
  confirmed.value = false;
  await loadHistory();
};

const resetFilters = async () => {
  Object.assign(filters, { search: '', from: '', to: '' });
  await applyFilters();
};

const openEntry = async (id: string) => {
  selectedId.value = id;
  detailLoading.value = true;
  selected.value = null;
  selectedFields.value = [];
  confirmed.value = false;
  error.value = '';
  try {
    const response: any = await Settings.getSystemSettingsHistoryEntry(id);
    selected.value = response.data;
  } catch (err: any) {
    error.value = err.message || 'Unable to load change details.';
  } finally {
    detailLoading.value = false;
  }
};

const changePage = async (delta: number) => {
  pagination.page += delta;
  await loadHistory();
};

const restoreSelected = async () => {
  if (!selected.value || !confirmed.value || !selectedFields.value.length) return;
  restoring.value = true;
  error.value = '';
  try {
    await Settings.restoreSystemSettingsHistory(selected.value.id, selectedFields.value);
    await loadHistory();
    await openEntry(selected.value.id);
  } catch (err: any) {
    error.value = err.message || 'Unable to restore selected settings.';
  } finally {
    restoring.value = false;
  }
};

onMounted(loadHistory);
</script>
