<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Online admission</h1>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Share the QR / form link and review applications (approve or reject)
      </p>
    </div>

    <!-- Admission Form QR -->
    <section class="card">
      <header
        class="pb-3 border-b border-gray-200/80 dark:border-gray-700/80 text-sm font-semibold text-gray-900 dark:text-white"
      >
        Admission Form QR
      </header>
      <div class="pt-4">
        <div
          v-if="!canShowQr"
          class="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 px-4 py-3 text-sm text-indigo-800 dark:text-indigo-200"
        >
          {{
            isSuperAdmin
              ? 'Select a school below and click Filter to generate that school’s admission QR.'
              : 'Waiting for school context…'
          }}
        </div>
        <div v-else class="text-center max-w-md mx-auto">
          <div id="admission-qr-print">
            <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-4">
              {{ qrSchoolLabel }} Admission Form
            </h2>
            <img
              :src="qrImageUrl"
              alt="Admission Form QR"
              class="mx-auto w-[220px] h-[220px] bg-white p-2 rounded-xl border border-gray-200 dark:border-gray-700"
            />
          </div>
          <div class="mt-4 flex flex-wrap justify-center gap-3">
            <a
              :href="applyUrl"
              target="_blank"
              rel="noopener"
              class="btn-secondary"
            >
              Open Form
            </a>
            <button
              type="button"
              class="btn-primary"
              @click="printQr"
            >
              Print QR
            </button>
            <button
              type="button"
              class="btn-secondary"
              @click="copyLink"
            >
              {{ copied ? 'Copied!' : 'Copy link' }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Scope filter -->
    <section class="card space-y-4">
      <header class="pb-3 border-b border-gray-200/80 dark:border-gray-700/80 text-sm font-semibold text-gray-900 dark:text-white">
        Filter applications
      </header>
      <div class="space-y-4">
        <div class="grid grid-cols-1 gap-4" :class="filterColsClass">
          <div v-if="showSchoolDropdown">
            <EnhancedDropdown
              v-model="selectedSchoolId"
              :options="schoolOptions"
              label="School"
              placeholder="Select school"
              :disabled="schoolsLoading"
              @change="onSchoolChange"
            />
          </div>

          <div v-if="showBranchDropdown">
            <EnhancedDropdown
              v-model="selectedBranchFilter"
              :options="branchOptions"
              label="Branch"
              placeholder="All branches"
              :disabled="branchesLoading"
              @change="onBranchChange"
            />
          </div>

          <div>
            <EnhancedDropdown
              v-model="selectedClassId"
              :options="classOptions"
              label="Class"
              placeholder="All classes"
              :disabled="classesLoading"
              @change="filter"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ classOptions.length ? `${classOptions.length} classes loaded` : classesLoading ? 'Loading classes…' : 'No classes found for this scope' }}
            </p>
          </div>
        </div>
        <div class="flex justify-end">
          <button
            type="button"
            class="btn-primary disabled:opacity-50"
            :disabled="filtering || (showSchoolDropdown && !selectedSchoolId)"
            @click="filter"
          >
            {{ filtering ? 'Loading…' : 'Filter' }}
          </button>
        </div>
      </div>
    </section>

    <!-- Applications list -->
    <section class="card space-y-4">
      <header
        class="pb-3 border-b border-gray-200/80 dark:border-gray-700/80 flex flex-wrap items-center justify-between gap-3"
      >
        <h2 class="text-base font-bold text-gray-900 dark:text-white">
          Online admission list
        </h2>
        <input
          v-model="search"
          type="search"
          placeholder="Search applicants..."
          class="input-field w-full sm:w-64"
        />
      </header>

      <div
        v-if="listError"
        class="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300"
      >
        {{ listError }}
        <button class="ml-3 underline font-medium" type="button" @click="filter">Retry</button>
      </div>

      <div class="table-container">
        <div v-if="filtering" class="p-6 text-sm text-gray-500">Loading applications…</div>
        <table v-else class="table">
          <thead>
            <tr>
              <th class="w-12">#</th>
              <th>Applicant</th>
              <th>Phone</th>
              <th>Class</th>
              <th>Applied Date</th>
              <th>Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700/60">
            <tr
              v-for="(row, idx) in filteredRows"
              :key="row.id"
              class="table-row-hover"
            >
              <td class="px-6 py-4 text-sm text-gray-500">{{ idx + 1 }}</td>
              <td class="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                {{ applicantName(row) }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{{ row.phone || row.payload?.phone || '—' }}</td>
              <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{{ classLabel(row) }}</td>
              <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{{ row.date_value || formatDate(row.createdAt) }}</td>
              <td class="px-6 py-4 text-sm">
                <span
                  class="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider"
                  :class="[
                    row.status === 'approved'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : row.status === 'rejected'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                  ]"
                >
                  {{ row.status || 'pending' }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-right whitespace-nowrap">
                <template v-if="row.status === 'pending' || !row.status">
                  <button
                    type="button"
                    class="mr-3 text-sm font-semibold text-green-600 hover:text-green-700 dark:text-green-400 disabled:opacity-50"
                    :disabled="actingId === row.id"
                    @click="requestAction(row.id, 'approve')"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    class="text-sm font-semibold text-red-600 hover:text-red-700 dark:text-red-400 disabled:opacity-50"
                    :disabled="actingId === row.id"
                    @click="requestAction(row.id, 'reject')"
                  >
                    Reject
                  </button>
                </template>
                <span v-else class="text-gray-400">—</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p
          v-if="!filtering && !filteredRows.length && !listError"
          class="p-8 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          No applications for this filter. Share the form link or adjust class/branch.
        </p>
      </div>
    </section>
    <ConfirmDialog
      :show="Boolean(pendingAction)"
      :title="pendingAction?.action === 'approve' ? 'Approve application?' : 'Reject application?'"
      :message="
        pendingAction?.action === 'approve'
          ? 'This will approve the application and create a student record.'
          : 'This will reject the admission application.'
      "
      :confirm-label="pendingAction?.action === 'approve' ? 'Approve' : 'Reject'"
      :danger="pendingAction?.action !== 'approve'"
      @close="pendingAction = null"
      @confirm="confirmAction"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue';
import { useAuth } from '~/composables/useAuth';
import { useAuthStore } from '~/stores/auth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useToast } from '~/composables/useToast';
import { Schools } from '~/api/administration/schools';
import { Branches } from '~/api/administration/branches';
import { Classes } from '~/api/academic/classes';
import { DynamicEntities } from '~/api/shared/dynamic-entities';
import { extractList, apiErrorMessage } from '~/utils/list-response';

type Opt = { value: string; label: string; description?: string };

const { user, currentSchool, isSuperAdmin } = useAuth();
const authStore = useAuthStore();
const { selectedBranchId, currentSchool: globalCurrentSchool } = useGlobalBranch();
const { showToast } = useToast();

const schoolOptions = ref<Opt[]>([]);
const branchOptions = ref<Opt[]>([]);
const classOptions = ref<Opt[]>([]);
const schoolsRaw = ref<any[]>([]);

const schoolsLoading = ref(false);
const branchesLoading = ref(false);
const classesLoading = ref(false);
const lookupError = ref('');

const selectedSchoolId = ref('');
const selectedBranchFilter = ref('');
const selectedClassId = ref('');

const rows = ref<any[]>([]);
const filtering = ref(false);
const listError = ref('');
const search = ref('');
const copied = ref(false);
const actingId = ref('');
const pendingAction = ref<{ id: string; action: 'approve' | 'reject' } | null>(null);

const showSchoolDropdown = computed(() => !!isSuperAdmin.value);

/** Show an explicit branch filter only when the current school has multiple branches. */
const showBranchDropdown = computed(() => branchOptions.value.length > 1);

const filterColsClass = computed(() => {
  const n = 1 + (showSchoolDropdown.value ? 1 : 0) + (showBranchDropdown.value ? 1 : 0);
  if (n >= 3) return 'md:grid-cols-3';
  if (n === 2) return 'md:grid-cols-2';
  return 'md:grid-cols-1 max-w-md';
});

const activeSchool = computed(() => {
  if (isSuperAdmin.value) {
    return schoolsRaw.value.find((s: any) => s.id === selectedSchoolId.value) || null;
  }
  return (
    currentSchool.value || {
      id: user.value?.school_id,
      code: user.value?.school?.code,
      name: user.value?.school?.name
    }
  );
});

const schoolCode = computed(
  () => activeSchool.value?.code || currentSchool.value?.code || user.value?.school?.code || ''
);

const qrSchoolLabel = computed(
  () =>
    activeSchool.value?.name || currentSchool.value?.name || user.value?.school?.name || 'School'
);

const applyUrl = computed(() => {
  if (!schoolCode.value || !import.meta.client) return '';
  return `${window.location.origin}/apply/${schoolCode.value}`;
});

const canShowQr = computed(() => {
  if (!schoolCode.value) return false;
  if (isSuperAdmin.value && !selectedSchoolId.value) return false;
  return true;
});

const qrImageUrl = computed(() => {
  if (!applyUrl.value) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(applyUrl.value)}`;
});

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return rows.value;
  return rows.value.filter((r: any) => {
    const name = applicantName(r).toLowerCase();
    const phone = String(r.phone || r.payload?.phone || '').toLowerCase();
    return name.includes(q) || phone.includes(q) || String(r.status || '').includes(q);
  });
});

const toOpts = (list: any[], labelKey = 'name'): Opt[] =>
  (list || []).map((item: any) => ({
    value: String(item.id),
    label: item[labelKey] || item.name || item.code || String(item.id),
    description: item.code
  }));

const applicantName = (row: any) => {
  if (row.title && !String(row.title).startsWith('admission_application')) return row.title;
  const p = row.payload || {};
  const name = [p.first_name, p.last_name].filter(Boolean).join(' ');
  return name || row.title || '—';
};

const classLabel = (row: any) => {
  if (row.class?.name) return row.class.name;
  const id = row.class_id || row.payload?.class_id;
  const hit = classOptions.value.find(c => c.value === id);
  return hit?.label || '—';
};

const formatDate = (value: string) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
};

/** GET /api/schools — super admin only */
const loadSchools = async () => {
  schoolsLoading.value = true;
  try {
    const res: any = await Schools.getAll({ limit: 200, status: 'active' });
    schoolsRaw.value = extractList(res, ['schools', 'rows']);
    schoolOptions.value = toOpts(schoolsRaw.value);
  } catch (error: any) {
    lookupError.value = apiErrorMessage(error, 'Failed to load schools');
    schoolOptions.value = [];
  } finally {
    schoolsLoading.value = false;
  }
};


/** GET /api/classes/dropdown */
const loadClasses = async () => {
  classesLoading.value = true;
  try {
    const qs = new URLSearchParams();
    const schoolId =
      selectedSchoolId.value || activeSchool.value?.id || user.value?.school_id || '';
    if (schoolId) qs.set('school_id', schoolId);
    if (selectedBranchFilter.value || selectedBranchId.value) {
      qs.set('branch_id', selectedBranchFilter.value || selectedBranchId.value);
    }

    const res: any = await Classes.getDropdown(qs.toString());
    const list = extractList(res, ['classes']);
    const classes = list.length ? list : Array.isArray(res?.data) ? res.data : [];
    classOptions.value = toOpts(classes);
  } catch (error: any) {
    lookupError.value = apiErrorMessage(error, 'Failed to load classes');
    classOptions.value = [];
  } finally {
    classesLoading.value = false;
  }
};

const onSchoolChange = async () => {
  selectedClassId.value = '';
  selectedBranchFilter.value = '';
  rows.value = [];
  branchOptions.value = [];
  classOptions.value = [];
  if (!selectedSchoolId.value) return;
  await loadBranches();
  await loadClasses();
};

const loadBranches = async () => {
  branchesLoading.value = true;
  try {
    const params: { school_id?: string; status?: string } = { status: 'active' };
    const schoolId = selectedSchoolId.value || activeSchool.value?.id || user.value?.school_id;
    if (schoolId) params.school_id = schoolId;
    const res: any = await Branches.getForDropdown(params);
    branchOptions.value = toOpts(extractList(res, ['branches', 'rows']));
  } catch (error: any) {
    lookupError.value = apiErrorMessage(error, 'Failed to load branches');
    branchOptions.value = [];
  } finally {
    branchesLoading.value = false;
  }
};

const onBranchChange = async () => {
  selectedClassId.value = '';
  await loadClasses();
  await filter();
};

/** GET /api/entities/admission_application */
const filter = async () => {
  if (showSchoolDropdown.value && !selectedSchoolId.value) {
    showToast('Select a school first', 'error');
    return;
  }
  filtering.value = true;
  listError.value = '';
  try {
    const params: Record<string, string> = {};
    if (selectedClassId.value) params.class_id = selectedClassId.value;
    if (selectedBranchFilter.value || selectedBranchId.value) {
      params.branch_id = selectedBranchFilter.value || selectedBranchId.value;
    }
    if (isSuperAdmin.value && selectedSchoolId.value) {
      params.school_id = selectedSchoolId.value;
    }
    const res: any = await DynamicEntities.list('admission_application', params);
    rows.value = extractList(res, ['records']);
  } catch (error: any) {
    listError.value = apiErrorMessage(error);
    rows.value = [];
  } finally {
    filtering.value = false;
  }
};

const requestAction = (id: string, action: 'approve' | 'reject') => {
  pendingAction.value = { id, action };
};

const confirmAction = async () => {
  if (!pendingAction.value) return;
  const { id, action } = pendingAction.value;
  pendingAction.value = null;
  actingId.value = id;
  try {
    await DynamicEntities.action('admission_application', id, action);
    showToast(action === 'approve' ? 'Approved — student created' : 'Rejected', 'success');
    await filter();
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  } finally {
    actingId.value = '';
  }
};

const copyLink = async () => {
  if (!applyUrl.value) return;
  try {
    await navigator.clipboard.writeText(applyUrl.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    window.prompt('Copy this URL', applyUrl.value);
  }
};

const printQr = () => {
  const el = document.getElementById('admission-qr-print');
  if (!el) return;
  const w = window.open('', 'admission-qr-print');
  if (!w) return;
  w.document.write(
    `<html><head><title>Admission Form QR</title></head><body style="font-family:Arial,sans-serif;text-align:center;padding:30px;">${el.innerHTML}</body></html>`
  );
  w.document.close();
  w.focus();
  w.print();
};

const bootLookups = async () => {
  lookupError.value = '';
  if (isSuperAdmin.value) {
    await loadSchools();
  }
  await loadBranches();
};

onMounted(bootLookups);

watch(selectedBranchId, async newVal => {
  if (isSuperAdmin.value && !selectedSchoolId.value) return;
  if (!selectedBranchFilter.value) selectedBranchFilter.value = newVal || '';
  selectedClassId.value = '';
  await loadClasses();
  await filter();
}, { immediate: true });
</script>
