<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-6xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Reports suite</h1>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
        View reports available to your role for the selected school and branch.
      </p>

      <div v-if="activeModule !== 'exams'" class="flex flex-wrap gap-3 mb-6">
        <EnhancedDropdown v-if="activeModule !== 'accounting'" v-model="classId" :options="classOptions" placeholder="All classes" id="reports-class-filter" @change="onClassChange" />
        <EnhancedDropdown v-if="activeModule !== 'accounting'" v-model="sectionId" :options="sectionOptions" placeholder="All sections" id="reports-section-filter" :disabled="!classId" @change="load(activeType)" />
        <input
          v-model="fromDate"
          type="date"
          class="border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
          @change="load(activeType)"
        />
        <input
          v-model="toDate"
          type="date"
          class="border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
          @change="load(activeType)"
        />
      </div>

      <div class="flex flex-wrap gap-2 mb-6">
        <NuxtLink
          v-for="link in dedicatedReports"
          :key="link.to"
          :to="link.to"
          class="px-3 py-2 text-sm rounded-md bg-white border dark:bg-gray-800 dark:border-gray-700"
        >
          {{ link.label }}
        </NuxtLink>
      </div>

      <div class="flex flex-wrap gap-2 mb-4">
        <button
          v-for="m in modules"
          :key="m.key"
          class="px-3 py-2 text-sm rounded-md"
          :class="
            activeModule === m.key ? 'bg-indigo-600 text-white' : 'bg-white border dark:bg-gray-800'
          "
          @click="selectModule(m)"
        >
          {{ m.title }}
        </button>
      </div>

      <div v-if="types.length" class="flex flex-wrap gap-2 mb-6">
        <button
          v-for="t in types"
          :key="t"
          class="px-3 py-1.5 text-xs rounded-md"
          :class="
            activeType === t ? 'bg-indigo-100 text-indigo-800' : 'bg-white border dark:bg-gray-800'
          "
          @click="load(t)"
        >
          {{ t }}
        </button>
      </div>

      <p v-if="error" class="mb-4 text-sm text-red-600">{{ error }}</p>
      <div v-if="reportLinks.length" class="mb-6 grid gap-3 sm:grid-cols-2" aria-label="Exam report workflows">
        <NuxtLink
          v-for="link in reportLinks"
          :key="link.to"
          :to="link.to"
          class="rounded-lg border bg-white p-4 text-sm font-medium text-indigo-700 hover:bg-indigo-50 dark:border-gray-700 dark:bg-gray-800 dark:text-indigo-300 dark:hover:bg-gray-700"
        >
          {{ link.label }} <span aria-hidden="true">→</span>
        </NuxtLink>
      </div>
      <div v-if="unsupportedAccountingReport" role="status" class="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
        <p><span class="font-semibold">{{ unsupportedAccountingReport }} doesn’t have a matching report view yet.</span> This suite currently summarizes dynamic vouchers only; Income/Expense registers are separate. Account statements, balance sheets, and cross-ledger totals need a posted ledger model, so this page won’t infer balances.</p>
        <p class="mt-2">Existing transaction registers: <NuxtLink to="/accounting/income" class="underline">Income</NuxtLink> · <NuxtLink to="/accounting/expense" class="underline">Expense</NuxtLink>.</p>
      </div>
      <p v-if="loading" class="text-sm text-gray-500 mb-4">Loading…</p>

      <div v-if="!unsupportedAccountingReport && !reportLinks.length" class="bg-white dark:bg-gray-800 shadow rounded-md overflow-x-auto">
        <table class="min-w-full divide-y">
          <thead>
            <tr>
              <th
                v-for="h in columns"
                :key="h"
                class="px-4 py-3 text-left text-xs uppercase text-gray-500"
              >
                {{ h }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in rows" :key="i" class="border-t">
              <td v-for="h in columns" :key="h" class="px-4 py-3 text-sm">
                {{ formatCell(row[h]) }}
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!rows.length && !loading" class="p-6 text-sm text-gray-500">No rows.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ReportsSuite } from '~/api/academic/cards-exams-reports';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useAcademics } from '~/composables/useAcademics';
import { apiErrorMessage } from '~/utils/list-response';
import { resolveAccountingReportTab } from '~/utils/accountingReportRoute';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';

const route = useRoute();
const {
  selectedBranchId: globalSelectedBranchId,
  currentSchool,
  branchScopeParams
} = useGlobalBranch();
const selectedBranchId = computed(() => globalSelectedBranchId.value);
const { classOptions, sectionOptions, fetchClasses, fetchSections } = useAcademics();
const modules = ref<any[]>([]);
const activeModule = ref('students');
const activeType = ref('summary');
const types = ref<string[]>([]);
const columns = ref<string[]>([]);
const rows = ref<any[]>([]);
const reportLinks = ref<{ label: string; to: string }[]>([]);
const loading = ref(false);
const error = ref('');
const unsupportedAccountingReport = ref('');
const classId = ref('');
const sectionId = ref('');
const fromDate = ref('');
const toDate = ref('');
const dedicatedReports = [
  { label: 'Student detail report', to: '/reports/students' },
  { label: 'Student extra/admission report', to: '/reports/student-extra' },
  { label: 'Fee report', to: '/reports/fees' },
  { label: 'Receipt report', to: '/reports/receipts' },
  { label: 'Attendance report', to: '/reports/attendance' }
];

const formatCell = (v: any) => {
  if (v == null) return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

const selectModule = async (m: any) => {
  activeModule.value = m.key;
  types.value = m.types || ['summary'];
  if (m.key === 'accounting') {
    classId.value = '';
    sectionId.value = '';
  } else {
    await fetchClasses({ branchId: selectedBranchId.value });
  }
  await load(types.value[0] || 'summary');
};

const onClassChange = async () => {
  sectionId.value = '';
  if (classId.value)
    await fetchSections({ classId: classId.value, branchId: selectedBranchId.value });
  await load(activeType.value);
};

const load = async (type: string) => {
  unsupportedAccountingReport.value = '';
  reportLinks.value = [];
  activeType.value = type;
  loading.value = true;
  error.value = '';
  try {
    const res: any = await ReportsSuite.run(activeModule.value, type, {
      ...branchScopeParams.value,
      ...(classId.value ? { class_id: classId.value } : {}),
      ...(sectionId.value ? { section_id: sectionId.value } : {}),
      ...(fromDate.value ? { from_date: fromDate.value } : {}),
      ...(toDate.value ? { to_date: toDate.value } : {})
    });
    columns.value = res.data?.columns || [];
    rows.value = res.data?.rows || [];
    reportLinks.value = res.data?.links || [];
    if (res.data?.types?.length) types.value = res.data.types;
  } catch (e) {
    error.value = apiErrorMessage(e);
    rows.value = [];
    reportLinks.value = [];
  } finally {
    loading.value = false;
  }
};

const onScopeChange = async () => {
  if (unsupportedAccountingReport.value) return;
  classId.value = '';
  sectionId.value = '';
  if (activeModule.value !== 'accounting') await fetchClasses({ branchId: selectedBranchId.value });
  await load(activeType.value);
};

watch(selectedBranchId, () => {
  onScopeChange();
});

watch(currentSchool, () => {
  onScopeChange();
});

const applyRoute = async () => {
  const moduleKey = String(route.query.module || '');
  const initial = modules.value.find((m: any) => m.key === moduleKey) || modules.value[0];
  if (!initial) return;
  if (moduleKey === 'accounting' && route.query.tab) {
    const requested = resolveAccountingReportTab(route.query.tab);
    if (!requested.supported) {
      activeModule.value = 'accounting';
      types.value = initial.types || ['summary', 'list'];
      activeType.value = '';
      columns.value = [];
      rows.value = [];
      unsupportedAccountingReport.value = requested.label;
      return;
    }
    await selectModule(initial);
    if (requested.type !== 'summary') await load(requested.type);
    return;
  }
  await selectModule(initial);
};

watch(() => [route.query.module, route.query.tab], () => {
  if (modules.value.length) void applyRoute();
});

onMounted(async () => {
  try {
    const res: any = await ReportsSuite.catalog();
    modules.value = res.data?.modules || [];
    await applyRoute();
  } catch (e) {
    error.value = apiErrorMessage(e);
  }
});
</script>
