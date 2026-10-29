<template>
  <main v-if="canManage" class="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
    <header>
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Classwork &amp; Logbook</h1>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Record dated classwork, lesson notes, and teaching logs. These entries are separate from homework assignments.</p>
    </header>
    <p v-if="allBranchesReadOnly" role="status" class="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">Select a specific branch in the global selector to create or edit entries. All Branches is read-only.</p>

    <section class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 class="text-lg font-medium text-gray-900 dark:text-white">{{ editingId ? 'Edit entry' : 'Create new entry' }}</h2>
      <form class="mt-4 grid gap-4 sm:grid-cols-2" @submit.prevent="save">
        <label class="text-sm text-gray-700 dark:text-gray-300">Entry type
          <select v-model="form.entry_type" required class="input-field mt-1"><option>Classwork</option><option>Logbook</option><option>Notes</option></select>
        </label>
        <label class="text-sm text-gray-700 dark:text-gray-300">Date
          <input v-model="form.date" type="date" required class="input-field mt-1" />
        </label>
        <label class="text-sm text-gray-700 dark:text-gray-300">Grade / class
          <select v-model="form.class_id" required class="input-field mt-1" :disabled="classesLoading || allBranchesReadOnly" @change="loadPlacementOptions"><option value="">Select a class</option><option v-for="item in classes" :key="item.id" :value="item.id">{{ item.name }}</option></select>
        </label>
        <label class="text-sm text-gray-700 dark:text-gray-300">Section <span class="text-gray-500">(optional)</span>
          <select v-model="form.section_id" class="input-field mt-1" :disabled="!form.class_id || placementLoading"><option value="">All assigned sections</option><option v-for="item in sections" :key="item.id" :value="item.id">{{ item.name }}</option></select>
        </label>
        <label class="text-sm text-gray-700 dark:text-gray-300">Learning area / subject
          <select v-model="form.subject_id" required class="input-field mt-1" :disabled="!form.class_id || placementLoading"><option value="">Select a subject</option><option v-for="item in subjects" :key="item.id" :value="item.id">{{ item.name }}</option></select>
        </label>
        <label class="text-sm text-gray-700 dark:text-gray-300">Topic / title
          <input v-model.trim="form.title" required maxlength="180" class="input-field mt-1" />
        </label>
        <label class="text-sm text-gray-700 dark:text-gray-300 sm:col-span-2">Content / notes
          <textarea v-model.trim="form.notes" required rows="5" maxlength="10000" class="input-field mt-1" placeholder="Describe the lesson or work covered…"></textarea>
        </label>
        <label class="text-sm text-gray-700 dark:text-gray-300 sm:col-span-2">Attachment <span class="text-gray-500">(optional · PDF, image, or Word · max 5 MB)</span>
          <input class="mt-2 block w-full text-sm" type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx" @change="onFileChange" />
          <span v-if="selectedFile" class="mt-1 block text-xs text-gray-500">{{ selectedFile.name }}</span>
        </label>
        <div class="sm:col-span-2 flex flex-wrap items-center gap-3">
          <p v-if="error" role="alert" class="w-full text-sm text-red-600">{{ error }}</p>
          <button class="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50" :disabled="saving || allBranchesReadOnly">{{ saving ? 'Saving…' : editingId ? 'Save changes' : 'Create entry' }}</button>
          <button v-if="editingId" type="button" class="rounded-lg border px-4 py-2.5 text-sm" @click="resetForm">Cancel edit</button>
        </div>
      </form>
    </section>

    <section class="space-y-4">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label class="text-sm text-gray-700 dark:text-gray-300">Grade / class
          <select v-model="filters.class_id" class="input-field mt-1" @change="applyFilters"><option value="">All assigned classes</option><option v-for="item in classes" :key="item.id" :value="item.id">{{ item.name }}</option></select>
        </label>
        <label class="text-sm text-gray-700 dark:text-gray-300">Session
          <select v-model="filters.academic_year" class="input-field mt-1" @change="applyFilters"><option value="">All sessions</option><option v-for="year in academicYears" :key="year.id" :value="year.code || year.name">{{ year.name }}</option></select>
        </label>
        <label class="text-sm text-gray-700 dark:text-gray-300">Entry type
          <select v-model="filters.entry_type" class="input-field mt-1" @change="applyFilters"><option value="">All types</option><option>Classwork</option><option>Logbook</option><option>Notes</option></select>
        </label>
        <label class="text-sm text-gray-700 dark:text-gray-300">From date
          <input v-model="filters.from_date" type="date" class="input-field mt-1" @change="applyFilters" />
        </label>
        <label class="text-sm text-gray-700 dark:text-gray-300">To date
          <input v-model="filters.to_date" type="date" class="input-field mt-1" @change="applyFilters" />
        </label>
        <label class="text-sm text-gray-700 dark:text-gray-300">Search entries
          <input v-model.trim="filters.search" type="search" class="input-field mt-1" placeholder="Topic or notes" @input="scheduleSearch" />
        </label>
        <label class="text-sm text-gray-700 dark:text-gray-300">Sort by
          <select v-model="filters.sort_by" class="input-field mt-1" @change="applyFilters"><option value="date">Date</option><option value="type">Entry type</option><option value="title">Topic</option></select>
        </label>
        <label class="text-sm text-gray-700 dark:text-gray-300">Order
          <select v-model="filters.sort_order" class="input-field mt-1" @change="applyFilters"><option value="DESC">Newest / Z–A</option><option value="ASC">Oldest / A–Z</option></select>
        </label>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button v-for="action in ['Copy', 'CSV', 'Excel', 'PDF']" :key="action" type="button" class="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 dark:hover:bg-gray-700" :disabled="exporting || loading" @click="exportEntries(action)">{{ exporting ? 'Preparing…' : action === 'Copy' ? 'Copy' : `Export ${action}` }}</button>
        <details class="relative"><summary class="cursor-pointer list-none rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">Columns</summary><fieldset class="absolute right-0 z-10 mt-2 grid min-w-48 gap-2 rounded-lg border bg-white p-3 shadow-lg dark:border-gray-600 dark:bg-gray-800"><legend class="sr-only">Visible classwork columns</legend><label v-for="column in CLASSWORK_COLUMNS" :key="column.key" class="flex items-center gap-2 text-sm"><input v-model="visibleColumns" type="checkbox" :value="column.key" />{{ column.header }}</label></fieldset></details>
        <button type="button" class="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700" @click="printEntries">Print</button>
      </div>
      <p v-if="listError" role="alert" class="text-sm text-red-600">{{ listError }}</p>
      <div v-if="loading" class="py-8 text-center text-sm text-gray-500">Loading entries…</div>
      <div v-else-if="entries.length" class="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <table class="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
          <thead class="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-900"><tr><th v-for="column in visibleColumnDefinitions" :key="column.key" class="px-4 py-3">{{ column.header }}</th><th class="px-4 py-3">Attachment</th><th v-if="!allBranchesReadOnly" class="px-4 py-3">Actions</th></tr></thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700"><tr v-for="item in entries" :key="item.id" class="align-top"><td v-for="column in visibleColumnDefinitions" :key="column.key" class="px-4 py-3" :class="{ 'min-w-48': column.key === 'title', 'whitespace-nowrap': column.key === 'date' }"><template v-if="column.key === 'class_name'">{{ item.class_name || className(item.class_id) }}</template><template v-else>{{ column.value(item) || '—' }}</template></td><td class="px-4 py-3"><button v-if="item.file_available" type="button" class="text-indigo-600 hover:underline" @click="downloadAttachment(item)">Download</button><span v-else>—</span></td><td v-if="!allBranchesReadOnly" class="whitespace-nowrap px-4 py-3"><button type="button" class="mr-3 text-indigo-600 hover:underline" @click="edit(item)">Edit</button><button type="button" class="text-red-600 hover:underline" @click="remove(item)">Delete</button></td></tr></tbody>
        </table>
      </div>
      <p v-else class="rounded-xl border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-600">{{ filters.search ? 'No entries match your search.' : 'No classwork or logbook entries have been recorded yet.' }}</p>
      <div v-if="pagination.totalPages > 1" class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300"><span>Page {{ pagination.page }} of {{ pagination.totalPages }} · {{ pagination.total }} entries</span><div class="flex gap-2"><button class="rounded border px-3 py-1.5 disabled:opacity-50" :disabled="pagination.page <= 1 || loading" @click="changePage(-1)">Previous</button><button class="rounded border px-3 py-1.5 disabled:opacity-50" :disabled="pagination.page >= pagination.totalPages || loading" @click="changePage(1)">Next</button></div></div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Classwork } from '~/api/academic/classwork';
import { Homeworks } from '~/api/students/academic-services';
import { useAcademics } from '~/composables/useAcademics';
import { useCommon } from '~/composables/useCommon';
import { useAuth } from '~/composables/useAuth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { apiErrorMessage, extractList } from '~/utils/list-response';
import { canManageClasswork } from '~/utils/classworkAccess';
import { homePathForRole } from '~/utils/home-path';
import { getLocalDateInputValue } from '~/utils/localDate';
import { CLASSWORK_COLUMNS, classworkCsv, classworkTsv, collectClassworkExportRows } from '~/utils/classworkExport';

const { user } = useAuth();
const canManage = computed(() => canManageClasswork(user.value?.role));
const { effectiveBranchId, currentSchool } = useGlobalBranch();
const { classes, academicYears, currentAcademicYear, fetchAcademicYears, fetchClasses } = useAcademics();
const { copyToClipboard, downloadFile } = useCommon();
const classesLoading = ref(false);
const placementLoading = ref(false);
const loading = ref(false);
const saving = ref(false);
const exporting = ref(false);
const visibleColumns = ref(CLASSWORK_COLUMNS.map(column => column.key));
const visibleColumnDefinitions = computed(() => CLASSWORK_COLUMNS.filter(column => visibleColumns.value.includes(column.key)));
const error = ref('');
const listError = ref('');
const entries = ref<any[]>([]);
const sections = ref<any[]>([]);
const subjects = ref<any[]>([]);
const pagination = ref({ page: 1, limit: 25, total: 0, totalPages: 0 });
const editingId = ref('');
const filters = ref({ class_id: '', academic_year: '', entry_type: '', from_date: '', to_date: '', search: '', sort_by: 'date', sort_order: 'DESC' });
const emptyForm = () => ({ entry_type: 'Classwork', date: getLocalDateInputValue(), class_id: '', section_id: '', subject_id: '', title: '', notes: '' });
const form = ref(emptyForm());
const selectedFile = ref<File | null>(null);
const allBranchesReadOnly = computed(() => !effectiveBranchId.value && ['admin', 'super_admin'].includes(user.value?.role || ''));
let searchTimer: ReturnType<typeof setTimeout> | undefined;
const scopeParams = () => ({ ...(currentSchool.value?.id || user.value?.school_id ? { school_id: currentSchool.value?.id || user.value?.school_id } : {}), ...(effectiveBranchId.value ? { branch_id: effectiveBranchId.value } : {}) });
const className = id => classes.value.find(item => item.id === id)?.name || '—';

const loadEntries = async () => {
  loading.value = true; listError.value = '';
  try {
    const response: any = await Classwork.list({ ...scopeParams(), ...filters.value, page: pagination.value.page, limit: pagination.value.limit });
    entries.value = extractList(response);
    if (response.pagination) pagination.value = { ...pagination.value, ...response.pagination };
  } catch (cause) { listError.value = apiErrorMessage(cause); }
  finally { loading.value = false; }
};
const loadPlacementOptions = async () => {
  form.value.section_id = ''; form.value.subject_id = ''; sections.value = []; subjects.value = [];
  if (!form.value.class_id) return;
  placementLoading.value = true; error.value = '';
  try {
    const year = currentAcademicYear.value?.code || currentAcademicYear.value?.name;
    const response: any = await Homeworks.getPlacementOptions({ ...scopeParams(), class_id: form.value.class_id, academic_year: year });
    sections.value = response.data?.sections || [];
    subjects.value = response.data?.subjects || [];
  } catch (cause) { error.value = apiErrorMessage(cause); }
  finally { placementLoading.value = false; }
};
const resetForm = () => { editingId.value = ''; error.value = ''; form.value = emptyForm(); selectedFile.value = null; sections.value = []; subjects.value = []; };
const save = async () => {
  saving.value = true; error.value = '';
  const payload = new FormData();
  Object.entries({ ...form.value, ...scopeParams() }).forEach(([key, value]) => { if (value !== '') payload.append(key, String(value)); });
  if (selectedFile.value) payload.append('file', selectedFile.value);
  try {
    if (editingId.value) await Classwork.update(editingId.value, payload); else await Classwork.create(payload);
    resetForm(); await loadEntries();
  } catch (cause) { error.value = apiErrorMessage(cause); }
  finally { saving.value = false; }
};
const edit = async item => {
  editingId.value = item.id;
  form.value = { entry_type: item.entry_type, date: item.date_value, class_id: item.class_id, section_id: item.section_id || '', subject_id: item.subject_id, title: item.title, notes: item.notes || '' };
  selectedFile.value = null;
  await loadPlacementOptions();
  form.value.section_id = item.section_id || ''; form.value.subject_id = item.subject_id;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
const remove = async item => {
  if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
  try { await Classwork.remove(item.id, effectiveBranchId.value || undefined); await loadEntries(); }
  catch (cause) { listError.value = apiErrorMessage(cause); }
};
const scheduleSearch = () => { if (searchTimer) clearTimeout(searchTimer); searchTimer = setTimeout(() => { pagination.value.page = 1; loadEntries(); }, 250); };
const changePage = delta => { pagination.value.page += delta; loadEntries(); };
const applyFilters = () => { pagination.value.page = 1; loadEntries(); };
const onFileChange = event => { const input = event.target as HTMLInputElement; selectedFile.value = input.files?.[0] || null; input.value = ''; };
const printEntries = () => window.print();
const downloadAttachment = async item => {
  try { const response = await Classwork.download(item.id); downloadFile(response.data, item.private_file_name || `${item.title}-attachment`, response.headers?.['content-type'] || 'application/octet-stream'); }
  catch (cause) { listError.value = apiErrorMessage(cause); }
};
const exportEntries = async action => {
  if (!visibleColumns.value.length) { listError.value = 'Select at least one column to export.'; return; }
  exporting.value = true; listError.value = '';
  try {
    const rows = await collectClassworkExportRows(page => Classwork.list({ ...scopeParams(), ...filters.value, page, limit: 100 }));
    const keys = visibleColumns.value;
    if (action === 'Copy') { await copyToClipboard(classworkTsv(rows, keys)); return; }
    if (action === 'CSV') {
      const blob = new Blob([classworkCsv(rows, keys)], { type: 'text/csv;charset=utf-8' });
      downloadFile(blob, `classwork-${getLocalDateInputValue()}.csv`, 'text/csv');
      return;
    }
    const response = await Classwork.export({ ...scopeParams(), ...filters.value, format: action === 'Excel' ? 'excel' : 'pdf' }, visibleColumnDefinitions.value.map(({ key, header }) => ({ key, header })));
    downloadFile(response.data, `classwork-${getLocalDateInputValue()}.${action === 'Excel' ? 'xlsx' : 'pdf'}`, response.headers?.['content-type'] || 'application/octet-stream');
  } catch (cause) { listError.value = apiErrorMessage(cause); }
  finally { exporting.value = false; }
};
const loadClasses = async () => {
  classesLoading.value = true;
  try { const schoolId = currentSchool.value?.id || user.value?.school_id; await Promise.all([fetchClasses({ schoolId, ...(effectiveBranchId.value ? { branchId: effectiveBranchId.value } : {}) }), fetchAcademicYears(schoolId)]); }
  finally { classesLoading.value = false; }
};
watch(effectiveBranchId, async () => { filters.value.class_id = ''; pagination.value.page = 1; resetForm(); await loadClasses(); await loadEntries(); });
watch(() => user.value?.role, role => { if (role && !canManageClasswork(role)) navigateTo(homePathForRole(role)); }, { immediate: true });
onMounted(async () => { if (!canManage.value) return; await loadClasses(); await loadEntries(); });
</script>
