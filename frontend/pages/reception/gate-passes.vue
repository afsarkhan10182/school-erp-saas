<template>
  <div class="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Student Gate Passes</h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Record authorised early departures and check students back in at the gate.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <div class="relative">
          <button type="button" class="rounded-lg border px-3 py-2 text-sm" :aria-expanded="showExportColumns" @click="showExportColumns = !showExportColumns">Export columns</button>
          <div v-if="showExportColumns" class="absolute right-0 z-20 mt-2 max-h-80 w-64 overflow-y-auto rounded-md border bg-white p-3 shadow-lg dark:border-gray-600 dark:bg-gray-800">
            <label v-for="column in exportColumns" :key="column.key" class="flex items-center gap-2 py-1 text-sm">
              <input v-model="column.visible" type="checkbox" :disabled="column.visible && selectedExportColumns.length === 1" />{{ column.label }}
            </label>
          </div>
        </div>
        <button v-for="format in ['csv', 'excel', 'pdf']" :key="format" type="button" class="rounded-lg border px-3 py-2 text-sm disabled:opacity-50" :disabled="!pagination.total || isGenerating" @click="exportPasses(format)">{{ isGenerating ? 'Preparing…' : format.toUpperCase() }}</button>
        <button class="rounded-lg border px-4 py-2 text-sm font-semibold" @click="showTerminal = !showTerminal">
          {{ showTerminal ? 'Hide gate terminal' : 'Gate terminal' }}
        </button>
        <button class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white" @click="showForm = !showForm">
          {{ showForm ? 'Close form' : 'Issue gate pass' }}
        </button>
      </div>
    </header>

    <p v-if="errorMessage" role="alert" class="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200">{{ errorMessage }}</p>
    <p v-if="successMessage" role="status" class="rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-200">{{ successMessage }}</p>

    <section v-if="showTerminal" class="rounded-xl border bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Gate terminal</h2>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Scan or enter the pass number or student admission number. Only approved passes can be used.</p>
      <form class="mt-4 flex flex-col gap-2 sm:flex-row" @submit.prevent="lookupCode">
        <input v-model.trim="terminalCode" class="input-field min-w-0 flex-1" placeholder="Scan / enter pass or admission number" autofocus />
        <button class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900" :disabled="terminalLoading || !terminalCode">{{ terminalLoading ? 'Checking…' : 'Check code' }}</button>
      </form>
      <article v-if="terminalPass" class="mt-4 flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700">
        <div>
          <p class="font-semibold text-gray-900 dark:text-white">{{ terminalPass.student?.name }} · {{ terminalPass.student?.admission_number }}</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ terminalPass.pass_no }} · {{ terminalPass.reason_label }} · {{ terminalPass.gate_name }}</p>
          <p class="mt-1 text-sm">Collected by {{ terminalPass.collector_name }} ({{ terminalPass.collector_relation }})</p>
          <p class="text-xs font-semibold uppercase tracking-wide">Status: {{ terminalPass.status }}</p>
        </div>
        <button v-if="terminalPass.status === 'approved'" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white" @click="terminalAction('out')">Mark student out</button>
        <button v-else class="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white" @click="terminalAction('return')">Mark back in</button>
      </article>
    </section>

    <section v-if="showForm" class="rounded-xl border bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Issue a student exit pass</h2>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Only record the ID type and last four digits; do not store a full government ID number or collector photo.</p>
      <form class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" @submit.prevent="issuePass">
        <label class="text-sm">Student *
          <input v-model.trim="studentSearch" class="input-field mt-1" placeholder="Search name or admission number" />
          <select v-model="form.student_id" required class="input-field mt-1"><option value="">Choose an active student</option><option v-for="student in students" :key="student.id" :value="student.id">{{ student.first_name }} {{ student.last_name }} · {{ student.admission_number }} · {{ student.class?.name || 'Unassigned' }}</option></select>
        </label>
        <label class="text-sm">Reason *
          <select v-model="form.reason" required class="input-field mt-1"><option value="">Choose reason</option><option value="sick">Sick / unwell</option><option value="parent_pickup">Parent pickup</option><option value="doctor">Doctor appointment</option><option value="family_emergency">Family emergency</option><option value="school_event">School event / match</option><option value="other">Other</option></select>
        </label>
        <label class="text-sm">Leaving at *<input v-model="form.leaving_at" required type="datetime-local" class="input-field mt-1" /></label>
        <label class="text-sm">Collector name *<input v-model.trim="form.collector_name" required maxlength="120" class="input-field mt-1" /></label>
        <label class="text-sm">Relation to student *<input v-model.trim="form.collector_relation" required maxlength="60" class="input-field mt-1" /></label>
        <label class="text-sm">Collector mobile *<input v-model.trim="form.collector_phone" required inputmode="tel" maxlength="24" class="input-field mt-1" /></label>
        <label class="text-sm">ID type *<select v-model="form.collector_id_type" required class="input-field mt-1"><option value="school_id">School ID</option><option value="aadhaar">Aadhaar</option><option value="passport">Passport</option><option value="driving_license">Driving licence</option><option value="other">Other</option></select></label>
        <label class="text-sm">Last four ID digits *<input v-model.trim="form.collector_id_last4" required inputmode="numeric" pattern="[0-9]{4}" maxlength="4" class="input-field mt-1" /></label>
        <label class="text-sm">Expected back at <input v-model="form.expected_return_at" type="datetime-local" class="input-field mt-1" /></label>
        <label class="text-sm">Gate<input v-model.trim="form.gate_name" maxlength="80" class="input-field mt-1" /></label>
        <label class="text-sm sm:col-span-2 lg:col-span-3">Note <textarea v-model.trim="form.note" rows="2" maxlength="500" class="input-field mt-1" /></label>
        <div class="flex flex-wrap items-center justify-between gap-3 sm:col-span-2 lg:col-span-3">
          <p class="text-xs text-gray-600 dark:text-gray-400">Receptionist-issued passes require administrator approval. Managers can issue an approved pass directly.</p>
          <button class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" :disabled="saving || !branchId">{{ saving ? 'Saving…' : 'Issue pass' }}</button>
        </div>
        <p v-if="!branchId" class="text-sm text-amber-700 sm:col-span-2 lg:col-span-3">Select a specific branch before issuing a pass.</p>
      </form>
    </section>

    <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div v-for="card in summary" :key="card.status" class="rounded-xl border bg-white p-4 dark:border-gray-700 dark:bg-gray-800"><p class="text-xs font-semibold uppercase text-gray-500">{{ card.label }}</p><p class="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{{ card.count }}</p></div>
    </section>

    <section class="rounded-xl border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div class="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700">
        <h2 class="font-semibold text-gray-900 dark:text-white">Gate pass register</h2>
        <div class="flex flex-col gap-2 sm:flex-row">
          <input v-model.trim="search" class="input-field" placeholder="Search pass / student / collector" />
          <select v-model="statusFilter" class="input-field"><option value="">All statuses</option><option v-for="status in statuses" :key="status" :value="status">{{ title(status) }}</option></select>
          <button class="rounded-lg border px-3 py-2 text-sm" @click="load">Refresh</button>
        </div>
      </div>
      <div v-if="loading" class="p-8 text-center text-sm text-gray-500">Loading passes…</div>
      <div v-else-if="!passes.length" class="p-8 text-center text-sm text-gray-500">No gate passes match these filters.</div>
      <p v-else class="px-4 pt-3 pb-1 text-xs text-gray-500">Scroll horizontally when needed to review every field and action.</p>
      <div v-if="!loading && passes.length" class="overflow-x-auto">
        <table class="min-w-[900px] w-full text-left text-sm">
          <thead class="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900/50"><tr><th class="px-4 py-3">Pass / student</th><th class="px-4 py-3">Reason</th><th class="px-4 py-3">Collector</th><th class="px-4 py-3">Leaving</th><th class="px-4 py-3">Back</th><th class="px-4 py-3">Status</th><th class="px-4 py-3">Actions</th></tr></thead>
          <tbody class="divide-y dark:divide-gray-700"><tr v-for="pass in passes" :key="pass.id">
            <td class="px-4 py-3"><button class="whitespace-nowrap font-semibold text-indigo-700 dark:text-indigo-300" @click="selectPass(pass)">{{ pass.pass_no }}</button><p>{{ pass.student?.first_name }} {{ pass.student?.last_name }} · {{ pass.student?.admission_number }}</p><p class="text-xs text-gray-500">{{ pass.student?.class?.name }}</p></td>
            <td class="px-4 py-3">{{ pass.reason_label }}<p v-if="pass.note" class="max-w-48 truncate text-xs text-gray-500">{{ pass.note }}</p></td>
            <td class="px-4 py-3">{{ pass.collector_name }}<p class="whitespace-nowrap text-xs text-gray-500">{{ pass.collector_relation }} · {{ pass.collector_phone }}</p></td>
            <td class="px-4 py-3">{{ formatDate(pass.actual_out_at || pass.leaving_at) }}</td><td class="px-4 py-3">{{ formatDate(pass.returned_at) }}</td>
            <td class="px-4 py-3"><span class="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold dark:bg-gray-700">{{ title(pass.status) }}</span></td>
            <td class="px-4 py-3"><div class="flex flex-wrap gap-1">
              <button v-if="canManage && pass.status === 'pending'" class="rounded border px-2 py-1 text-xs" @click="act(pass, 'approve')">Approve</button>
              <button v-if="canManage && pass.status === 'pending'" class="rounded border px-2 py-1 text-xs" @click="act(pass, 'reject')">Reject</button>
              <button v-if="pass.status === 'pending' || pass.status === 'approved'" class="rounded border px-2 py-1 text-xs" @click="act(pass, 'cancel')">Cancel</button>
              <button v-if="pass.status === 'approved'" class="rounded border px-2 py-1 text-xs" @click="act(pass, 'out')">Mark out</button>
              <button v-if="pass.status === 'out'" class="rounded border px-2 py-1 text-xs" @click="act(pass, 'return')">Mark back</button>
            </div></td>
          </tr></tbody>
        </table>
      </div>
      <Pagination :pagination="pagination" item-label="passes" @page-changed="changePage" @page-size-changed="changePageSize" />
    </section>

    <section v-if="selectedPass" class="rounded-xl border bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <div class="flex items-start justify-between gap-3"><div><h2 class="text-lg font-semibold">Pass details · {{ selectedPass.pass_no }}</h2><p class="text-sm text-gray-500">{{ selectedPass.student?.first_name }} {{ selectedPass.student?.last_name }} · {{ title(selectedPass.status) }}</p></div><button class="rounded border px-3 py-1 text-sm" @click="selectedPass = null">Close</button></div>
      <dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3"><div><dt class="text-gray-500">Collector</dt><dd>{{ selectedPass.collector_name }} ({{ selectedPass.collector_relation }})</dd></div><div><dt class="text-gray-500">Phone</dt><dd>{{ selectedPass.collector_phone }}</dd></div><div><dt class="text-gray-500">ID proof</dt><dd>{{ selectedPass.collector_id_type }} · •••• {{ selectedPass.collector_id_last4 }}</dd></div><div><dt class="text-gray-500">Departure</dt><dd>{{ formatDate(selectedPass.actual_out_at || selectedPass.leaving_at) }}</dd></div><div><dt class="text-gray-500">Return</dt><dd>{{ formatDate(selectedPass.returned_at || selectedPass.expected_return_at) }}</dd></div><div><dt class="text-gray-500">Gate</dt><dd>{{ selectedPass.gate_name }}</dd></div><div v-if="selectedPass.note"><dt class="text-gray-500">Reason note</dt><dd>{{ selectedPass.note }}</dd></div></dl>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import Pagination from '~/components/ui/Pagination.vue';
import { GatePasses } from '~/api/shared/gate-passes';
import { useAuth } from '~/composables/useAuth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { extractList, apiErrorMessage } from '~/utils/list-response';
import { useExportService } from '~/composables/useExportService';

const { user } = useAuth();
const { selectedBranchId, currentSchool } = useGlobalBranch();
const { generateReport, isGenerating } = useExportService();
const canManage = computed(() => ['super_admin', 'admin', 'branch_admin'].includes(user.value?.role || ''));
const branchId = computed(() => selectedBranchId.value || (['branch_admin', 'receptionist'].includes(user.value?.role || '') ? user.value?.branch_id : '') || '');
const branchParams = computed(() => ({ ...(currentSchool.value?.id ? { school_id: currentSchool.value.id } : {}), ...(branchId.value ? { branch_id: branchId.value } : {}) }));
const statuses = ['pending', 'approved', 'rejected', 'out', 'returned', 'cancelled'];
const reasonLabels: Record<string, string> = { sick: 'Sick / unwell', parent_pickup: 'Parent pickup', doctor: 'Doctor appointment', family_emergency: 'Family emergency', school_event: 'School event / match', other: 'Other' };
const passes = ref<any[]>([]);
const showExportColumns = ref(false);
const exportColumns = ref([
  { key: 'pass_no', label: 'Pass number', visible: true }, { key: 'student_name', label: 'Student', visible: true },
  { key: 'admission_number', label: 'Admission number', visible: true }, { key: 'class_name', label: 'Class', visible: true },
  { key: 'reason', label: 'Reason', visible: true }, { key: 'collector_name', label: 'Collector', visible: true },
  { key: 'collector_relation', label: 'Relation', visible: true }, { key: 'leaving_at', label: 'Leaving at', visible: true },
  { key: 'actual_out_at', label: 'Actual departure', visible: true }, { key: 'expected_return_at', label: 'Expected return', visible: true },
  { key: 'returned_at', label: 'Returned at', visible: true }, { key: 'status', label: 'Status', visible: true },
  { key: 'gate_name', label: 'Gate', visible: true }, { key: 'branch_name', label: 'Branch', visible: true }
]);
const selectedExportColumns = computed(() => exportColumns.value.filter(column => column.visible));
const pagination = reactive({ page: 1, limit: 10, total: 0, totalPages: 0 });
const students = ref<any[]>([]);
const studentSearch = ref('');
const selectedPass = ref<any>(null);
const statusFilter = ref('');
const search = ref('');
const loading = ref(false);
const saving = ref(false);
const terminalLoading = ref(false);
const showForm = ref(false);
const showTerminal = ref(false);
const terminalCode = ref('');
const terminalPass = ref<any>(null);
const errorMessage = ref('');
const successMessage = ref('');
const form = ref({ student_id: '', reason: '', leaving_at: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16), expected_return_at: '', collector_name: '', collector_relation: '', collector_phone: '', collector_id_type: 'school_id', collector_id_last4: '', gate_name: 'Main Gate', note: '' });
const summary = computed(() => [
  { status: 'pending', label: 'Awaiting approval (page)' }, { status: 'approved', label: 'Approved, not out (page)' },
  { status: 'out', label: 'Currently out (page)' }, { status: 'today', label: 'Issued today (page)' }
].map(card => ({ ...card, count: card.status === 'today' ? passes.value.filter(p => new Date(p.created_at).toDateString() === new Date().toDateString()).length : passes.value.filter(p => p.status === card.status).length })));
const title = (value: string) => value?.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || '—';
const formatDate = (value?: string | null) => value ? new Date(value).toLocaleString() : '—';

const load = async () => {
  loading.value = true; errorMessage.value = '';
  try {
    const response: any = await GatePasses.list({ ...branchParams.value, ...(statusFilter.value ? { status: statusFilter.value } : {}), ...(search.value ? { search: search.value } : {}), page: pagination.page, limit: pagination.limit });
    passes.value = extractList(response).map(p => ({ ...p, reason_label: reasonLabels[p.reason] || p.reason }));
    Object.assign(pagination, response.data?.pagination || response.pagination || { page: 1, limit: pagination.limit, total: passes.value.length, totalPages: 1 });
  }
  catch (error: any) { errorMessage.value = apiErrorMessage(error); } finally { loading.value = false; }
};
const applyFilters = () => { pagination.page = 1; load(); };
const changePage = (page: number) => { pagination.page = page; load(); };
const changePageSize = (limit: number) => { pagination.limit = limit; applyFilters(); };
const exportPasses = async (format: string) => {
  try {
    await generateReport({ report_type: 'gate_passes', format, filters: { ...branchParams.value, ...(statusFilter.value ? { status: statusFilter.value } : {}), ...(search.value ? { search: search.value } : {}) }, columns: selectedExportColumns.value.map(({ key, label }) => ({ key, header: label })) });
  } catch (error: any) { errorMessage.value = apiErrorMessage(error); }
};
const loadStudents = async () => {
  if (!branchId.value) { students.value = []; return; }
  try { const response: any = await GatePasses.students({ limit: 100, search: studentSearch.value, ...branchParams.value }); students.value = extractList(response); }
  catch (error: any) { errorMessage.value = apiErrorMessage(error); }
};
const issuePass = async () => {
  if (!branchId.value) return;
  saving.value = true; errorMessage.value = ''; successMessage.value = '';
  try { const response: any = await GatePasses.create({ ...form.value, expected_return_at: form.value.expected_return_at || null, branch_id: branchId.value }); successMessage.value = `Pass ${response.data?.pass_no || ''} ${canManage.value ? 'approved' : 'created and is awaiting approval'}.`; showForm.value = false; await load(); }
  catch (error: any) { errorMessage.value = apiErrorMessage(error); } finally { saving.value = false; }
};
const act = async (pass: any, action: 'approve' | 'reject' | 'out' | 'return' | 'cancel') => {
  if (['reject', 'cancel'].includes(action) && !window.confirm(`${title(action)} this gate pass?`)) return;
  errorMessage.value = ''; successMessage.value = '';
  try { await GatePasses.transition(pass.id, action); successMessage.value = `Pass ${({ approve: 'approved', reject: 'rejected', out: 'marked out', return: 'marked back in', cancel: 'cancelled' } as Record<string, string>)[action]}.`; await load(); if (selectedPass.value?.id === pass.id) await selectPass(pass); if (terminalPass.value?.id === pass.id) await lookupCode(); }
  catch (error: any) { errorMessage.value = apiErrorMessage(error); }
};
const selectPass = async (pass: any) => { try { const response: any = await GatePasses.get(pass.id); selectedPass.value = response.data; } catch (error: any) { errorMessage.value = apiErrorMessage(error); } };
const lookupCode = async () => {
  terminalLoading.value = true; errorMessage.value = '';
  try { const response: any = await GatePasses.lookup(terminalCode.value, branchParams.value); terminalPass.value = { ...response.data, reason_label: reasonLabels[response.data?.reason] || response.data?.reason }; }
  catch (error: any) { terminalPass.value = null; errorMessage.value = apiErrorMessage(error); } finally { terminalLoading.value = false; }
};
const terminalAction = async (action: 'out' | 'return') => { if (!terminalPass.value?.id) return; const id = terminalPass.value.id; await act({ id }, action); terminalCode.value = terminalPass.value?.pass_no || terminalCode.value; await lookupCode(); };

let searchTimer: ReturnType<typeof setTimeout> | undefined;
watch([statusFilter, selectedBranchId, currentSchool], () => { applyFilters(); loadStudents(); selectedPass.value = null; terminalPass.value = null; });
watch(search, () => { clearTimeout(searchTimer); searchTimer = setTimeout(applyFilters, 250); });
watch(studentSearch, () => loadStudents());
onMounted(() => { load(); loadStudents(); });
onUnmounted(() => clearTimeout(searchTimer));
</script>
