<template>
  <div
    class="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8 transition-colors duration-300"
  >
    <div class="max-w-7xl mx-auto space-y-6">
      <!-- Header Banner -->
      <div
        class="bg-white dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {{ active === 'register' ? 'General Register' : 'Student Extra Reports' }}
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{
              active === 'register'
                ? 'Official student register roster, admission credentials, and roll numbers.'
                : 'Comprehensive reporting across student credentials, admissions, class rosters, and sibling groups.'
            }}
          </p>
        </div>
      </div>

      <!-- Filter Controls Bar -->
      <div
        class="bg-white dark:bg-gray-800/80 backdrop-blur-md rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50 flex flex-wrap gap-3 items-center"
      >
        <select
          v-model="classId"
          class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
          @change="onClassChange"
        >
          <option value="">All classes</option>
          <option v-for="option in classOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <select
          v-model="sectionId"
          class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
          :disabled="!classId"
          @change="load(active)"
        >
          <option value="">All sections</option>
          <option v-for="option in sectionOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <input
          v-model="fromDate"
          type="date"
          class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
          @change="load(active)"
        />
        <input
          v-model="toDate"
          type="date"
          class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
          @change="load(active)"
        />
      </div>

      <!-- Navigation Tabs (Only when viewing as multi-report suite) -->
      <div
        v-if="route.query.tab !== 'register'"
        class="flex gap-2 flex-wrap border-b border-gray-200 dark:border-gray-700 pb-3"
      >
        <button
          v-for="tab in tabs.filter(t => t.id !== 'register')"
          :key="tab.id"
          class="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
          :class="
            active === tab.id
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
          "
          @click="load(tab.id)"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Data Table Card Container -->
      <div
        class="bg-white dark:bg-gray-800/90 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr
                class="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50"
              >
                <th
                  v-for="h in headers"
                  :key="h"
                  class="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {{ formatHeader(h) }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700/50 text-sm">
              <tr
                v-for="(row, i) in rows"
                :key="i"
                class="hover:bg-gray-50/50 dark:hover:bg-gray-750 transition-colors"
              >
                <td
                  v-for="h in headers"
                  :key="h"
                  class="px-6 py-4 text-gray-900 dark:text-gray-100 font-medium whitespace-nowrap"
                >
                  <template v-if="h === 'login_status'">
                    <span
                      class="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
                      :class="getStatusBadgeClass(row[h])"
                    >
                      {{ row[h] || 'no account' }}
                    </span>
                  </template>
                  <template v-else>
                    {{ cell(row, h) }}
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="!rows.length" class="p-12 text-center">
          <div class="inline-flex p-4 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 mb-3">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p class="text-base font-medium text-gray-900 dark:text-white">No records found</p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Select filters above to search student records.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useAcademics } from '~/composables/useAcademics';
import { DynamicEntities } from '~/api/shared/dynamic-entities';

const route = useRoute();
const { selectedBranchId, currentSchool, branchScopeParams } = useGlobalBranch();
const { classOptions, sectionOptions, fetchClasses, fetchSections } = useAcademics();

const tabs = [
  { id: 'credentials', label: 'Login credentials' },
  { id: 'admissions', label: 'Admission report' },
  { id: 'register', label: 'General Register' },
  { id: 'class-section', label: 'Class & section' },
  { id: 'siblings', label: 'Siblings' }
];
const active = ref('credentials');
const rows = ref<any[]>([]);
const classId = ref('');
const sectionId = ref('');
const today = new Date().toISOString().split('T')[0];
const fromDate = ref('');
const toDate = ref('');

const headers = computed(() => {
  if (active.value === 'credentials')
    return ['name', 'admission_number', 'class_name', 'login_email', 'login_status'];
  if (active.value === 'admissions')
    return [
      'first_name',
      'last_name',
      'admission_number',
      'admission_date',
      'current_class',
      'present_address',
      'permanent_address',
      'previous_school_name'
    ];
  if (active.value === 'register')
    return [
      'first_name',
      'last_name',
      'admission_number',
      'current_class',
      'login_email',
      'login_status'
    ];
  if (active.value === 'class-section') return ['label', 'count'];
  return ['parent', 'students'];
});

const formatHeader = (h: string) => {
  return h.replace(/_/g, ' ').toUpperCase();
};

const getStatusBadgeClass = (status?: string) => {
  if (status === 'active')
    return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
  if (status === 'inactive' || status === 'disabled')
    return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
  return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20';
};

const cell = (row: any, h: string) => {
  if (h === 'students' && Array.isArray(row.students)) {
    return row.students.map((s: any) => s.first_name).join(', ');
  }
  return row[h] ?? '—';
};

const load = async (id: string) => {
  active.value = id;
  const res: any = await DynamicEntities.reports(id === 'register' ? 'credentials' : id, {
    ...branchScopeParams.value,
    ...(classId.value ? { class_id: classId.value } : {}),
    ...(sectionId.value ? { section_id: sectionId.value } : {}),
    ...(fromDate.value ? { from_date: fromDate.value } : {}),
    ...(toDate.value ? { to_date: toDate.value } : {})
  });
  rows.value = res.data?.rows || [];
};

const onScopeChange = async () => {
  classId.value = '';
  sectionId.value = '';
  await fetchClasses({ branchId: selectedBranchId.value });
  await load(active.value);
};

const onClassChange = async () => {
  sectionId.value = '';
  if (classId.value) {
    await fetchSections({ classId: classId.value, branchId: selectedBranchId.value });
  }
  await load(active.value);
};

watch(selectedBranchId, () => {
  onScopeChange();
});

watch(currentSchool, () => {
  onScopeChange();
});

onMounted(async () => {
  await fetchClasses({ branchId: selectedBranchId.value });
  const initialTab = tabs.some(tab => tab.id === route.query.tab)
    ? String(route.query.tab)
    : 'credentials';
  await load(initialTab);
});
</script>
