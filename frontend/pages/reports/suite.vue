<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-6xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Reports suite</h1>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Live aggregations across students, fees, attendance, library, hostel, transport, HR,
        inventory and accounting.
      </p>

      <div class="flex flex-wrap gap-3 mb-6">
        <select v-model="classId" class="border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700" @change="onClassChange">
          <option value="">All classes</option>
          <option v-for="option in classOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
        <select v-model="sectionId" class="border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700" :disabled="!classId" @change="load(activeType)">
          <option value="">All sections</option>
          <option v-for="option in sectionOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
        <input v-model="fromDate" type="date" class="border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700" @change="load(activeType)" />
        <input v-model="toDate" type="date" class="border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700" @change="load(activeType)" />
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
          :class="activeModule === m.key ? 'bg-indigo-600 text-white' : 'bg-white border dark:bg-gray-800'"
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
          :class="activeType === t ? 'bg-indigo-100 text-indigo-800' : 'bg-white border dark:bg-gray-800'"
          @click="load(t)"
        >
          {{ t }}
        </button>
      </div>

      <p v-if="error" class="mb-4 text-sm text-red-600">{{ error }}</p>
      <p v-if="loading" class="text-sm text-gray-500 mb-4">Loading…</p>

      <div class="bg-white dark:bg-gray-800 shadow rounded-md overflow-x-auto">
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
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ReportsSuite } from '~/api/academic/cards-exams-reports';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useAcademics } from '~/composables/useAcademics';
import { apiErrorMessage } from '~/utils/list-response';

const route = useRoute();
const { selectedBranchId, currentSchool, branchScopeParams } = useGlobalBranch();
const { classOptions, sectionOptions, fetchClasses, fetchSections } = useAcademics();
const modules = ref<any[]>([]);
const activeModule = ref('students');
const activeType = ref('summary');
const types = ref<string[]>([]);
const columns = ref<string[]>([]);
const rows = ref<any[]>([]);
const loading = ref(false);
const error = ref('');
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
  await load(types.value[0] || 'summary');
};

const onClassChange = async () => {
  sectionId.value = '';
  if (classId.value) await fetchSections({ classId: classId.value, branchId: selectedBranchId.value });
  await load(activeType.value);
};

const load = async (type: string) => {
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
    if (res.data?.types?.length) types.value = res.data.types;
  } catch (e) {
    error.value = apiErrorMessage(e);
    rows.value = [];
  } finally {
    loading.value = false;
  }
};

const onScopeChange = async () => {
  classId.value = '';
  sectionId.value = '';
  await fetchClasses({ branchId: selectedBranchId.value });
  await load(activeType.value);
};

watch(selectedBranchId, () => {
  onScopeChange();
});

watch(currentSchool, () => {
  onScopeChange();
});

onMounted(async () => {
  try {
    await fetchClasses({ branchId: selectedBranchId.value });
    const res: any = await ReportsSuite.catalog();
    modules.value = res.data?.modules || [];
    const q = String(route.query.module || '');
    const initial =
      modules.value.find((m: any) => m.key === q) || modules.value[0];
    if (initial) await selectModule(initial);
  } catch (e) {
    error.value = apiErrorMessage(e);
  }
});
</script>
