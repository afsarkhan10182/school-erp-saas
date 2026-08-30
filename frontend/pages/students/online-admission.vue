<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Online admission</h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Share the QR / form link and review applications (approve or reject)
        </p>
      </div>

      <!-- Admission Form QR -->
      <section class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg overflow-hidden">
        <header
          class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-800 dark:text-gray-100"
        >
          Admission Form QR
        </header>
        <div class="p-6">
          <div
            v-if="!canShowQr"
            class="rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-3 text-sm text-blue-800 dark:text-blue-200"
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
                class="mx-auto w-[220px] h-[220px] bg-white p-2 rounded border border-gray-200"
              />
            </div>
            <div class="mt-4 flex flex-wrap justify-center gap-3">
              <a
                :href="applyUrl"
                target="_blank"
                rel="noopener"
                class="inline-flex items-center px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Open Form
              </a>
              <button
                type="button"
                class="inline-flex items-center px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                @click="printQr"
              >
                Print QR
              </button>
              <button
                type="button"
                class="inline-flex items-center px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md"
                @click="copyLink"
              >
                {{ copied ? 'Copied' : 'Copy link' }}
              </button>
            </div>
            <p class="mt-3 text-xs text-gray-500 break-all font-mono">{{ applyUrl }}</p>
          </div>
        </div>
      </section>

      <!-- Filters — real /branches/dropdown + /classes/dropdown -->
      <section class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg overflow-hidden">
        <header
          class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-800 dark:text-gray-100"
        >
          Select ground
        </header>
        <div class="p-4 space-y-3">
          <p v-if="lookupError" class="text-sm text-red-600">
            {{ lookupError }}
            <button type="button" class="ml-2 underline" @click="bootLookups">Retry</button>
          </p>
          <div
            class="grid grid-cols-1 gap-4"
            :class="filterColsClass"
          >
            <EnhancedDropdown
              v-if="showSchoolDropdown"
              v-model="selectedSchoolId"
              :options="schoolOptions"
              label="School"
              placeholder="Select school"
              required
              :loading="schoolsLoading"
              @change="onSchoolChange"
            />
            <EnhancedDropdown
              v-if="showBranchDropdown"
              v-model="selectedBranchId"
              :options="branchOptions"
              label="Branch"
              placeholder="Select branch"
              required
              :loading="branchesLoading"
              @change="onBranchChange"
            />
            <EnhancedDropdown
              v-model="selectedClassId"
              :options="classOptions"
              label="Class"
              placeholder="All classes"
              :loading="classesLoading"
              :helper-text="
                classOptions.length
                  ? `${classOptions.length} classes loaded`
                  : classesLoading
                    ? 'Loading classes…'
                    : 'No classes found for this scope'
              "
            />
          </div>
          <div class="flex justify-end">
            <button
              type="button"
              class="inline-flex items-center px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              :disabled="filtering || (showSchoolDropdown && !selectedSchoolId)"
              @click="filter"
            >
              {{ filtering ? 'Loading…' : 'Filter' }}
            </button>
          </div>
        </div>
      </section>

      <!-- Applications list — real /school-ops/admission_application -->
      <section class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg overflow-hidden">
        <header
          class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-2"
        >
          <h2 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Online admission list
          </h2>
          <input
            v-model="search"
            type="search"
            placeholder="Search…"
            class="border rounded-md px-3 py-1.5 text-sm dark:bg-gray-900 dark:border-gray-600 w-full sm:w-56"
          />
        </header>

        <div
          v-if="listError"
          class="mx-4 mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {{ listError }}
          <button class="ml-3 underline" type="button" @click="filter">Retry</button>
        </div>

        <div class="overflow-x-auto">
          <div v-if="filtering" class="p-6 text-sm text-gray-500">Loading applications…</div>
          <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700/60">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">#</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Applicant</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Phone</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Class</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Applied</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Status</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="(row, idx) in filteredRows" :key="row.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                <td class="px-4 py-3 text-sm">{{ idx + 1 }}</td>
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  {{ applicantName(row) }}
                </td>
                <td class="px-4 py-3 text-sm">{{ row.phone || row.payload?.phone || '—' }}</td>
                <td class="px-4 py-3 text-sm">{{ classLabel(row) }}</td>
                <td class="px-4 py-3 text-sm">{{ row.date_value || formatDate(row.createdAt) }}</td>
                <td class="px-4 py-3 text-sm capitalize">{{ row.status || 'pending' }}</td>
                <td class="px-4 py-3 text-sm whitespace-nowrap">
                  <template v-if="row.status === 'pending' || !row.status">
                    <button
                      type="button"
                      class="mr-3 text-sm font-medium text-green-600 hover:text-green-700 disabled:opacity-50"
                      :disabled="actingId === row.id"
                      @click="runAction(row.id, 'approve')"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      class="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                      :disabled="actingId === row.id"
                      @click="runAction(row.id, 'reject')"
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
            class="p-6 text-sm text-gray-500"
          >
            No applications for this filter. Share the form link or adjust class/branch.
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { useAuth } from '~/composables/useAuth';
import { useToast } from '~/composables/useToast';
import { Schools } from '~/api/administration/schools';
import { Branches } from '~/api/administration/branches';
import { Classes } from '~/api/academic/classes';
import { SchoolOps } from '~/api/shared/school-ops';
import { extractList, apiErrorMessage } from '~/utils/list-response';

type Opt = { value: string; label: string; description?: string };

const { user, currentSchool, isSuperAdmin } = useAuth();
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
const selectedBranchId = ref('');
const selectedClassId = ref('');

const rows = ref<any[]>([]);
const filtering = ref(false);
const listError = ref('');
const search = ref('');
const copied = ref(false);
const actingId = ref('');

const showSchoolDropdown = computed(() => !!isSuperAdmin.value);

/** Multi-branch only (school admin). Super admin: after school, only if >1 branch. */
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
  return currentSchool.value || { id: user.value?.school_id, code: user.value?.school?.code, name: user.value?.school?.name };
});

const schoolCode = computed(
  () =>
    activeSchool.value?.code ||
    currentSchool.value?.code ||
    user.value?.school?.code ||
    ''
);

const qrSchoolLabel = computed(
  () =>
    activeSchool.value?.name ||
    currentSchool.value?.name ||
    user.value?.school?.name ||
    'School'
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

/** GET /api/branches/dropdown */
const loadBranches = async (schoolId?: string) => {
  branchesLoading.value = true;
  lookupError.value = '';
  try {
    const params: { school_id?: string } = {};
    if (schoolId) params.school_id = schoolId;
    else if (user.value?.school_id) params.school_id = user.value.school_id;

    const res: any = await Branches.getForDropdown(params);
    const list = extractList(res, ['branches']);
    // dropdown often returns data as a plain array
    const branches = list.length ? list : Array.isArray(res?.data) ? res.data : [];
    branchOptions.value = toOpts(branches);

    if (branchOptions.value.length === 1) {
      selectedBranchId.value = branchOptions.value[0].value;
    } else if (
      user.value?.branch_id &&
      branchOptions.value.some(b => b.value === user.value?.branch_id)
    ) {
      selectedBranchId.value = user.value.branch_id;
    }
  } catch (error: any) {
    lookupError.value = apiErrorMessage(error, 'Failed to load branches');
    branchOptions.value = [];
  } finally {
    branchesLoading.value = false;
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
    if (selectedBranchId.value) qs.set('branch_id', selectedBranchId.value);

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
  selectedBranchId.value = '';
  selectedClassId.value = '';
  rows.value = [];
  branchOptions.value = [];
  classOptions.value = [];
  if (!selectedSchoolId.value) return;
  await loadBranches(selectedSchoolId.value);
  await loadClasses();
};

const onBranchChange = async () => {
  selectedClassId.value = '';
  await loadClasses();
};

/** GET /api/school-ops/admission_application */
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
    if (selectedBranchId.value) params.branch_id = selectedBranchId.value;
    if (isSuperAdmin.value && selectedSchoolId.value) {
      params.school_id = selectedSchoolId.value;
    }
    const res: any = await SchoolOps.list('admission_application', params);
    rows.value = extractList(res, ['records']);
  } catch (error: any) {
    listError.value = apiErrorMessage(error);
    rows.value = [];
  } finally {
    filtering.value = false;
  }
};

const runAction = async (id: string, action: 'approve' | 'reject') => {
  if (!window.confirm(action === 'approve' ? 'Approve this application and create a student?' : 'Reject this application?')) return;
  actingId.value = id;
  try {
    await SchoolOps.action('admission_application', id, action);
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
    return;
  }
  await loadBranches(user.value?.school_id);
  await loadClasses();
  await filter();
};

onMounted(bootLookups);
</script>
