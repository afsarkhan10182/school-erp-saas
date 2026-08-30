<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-6xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Student extra reports</h1>
      <div class="flex flex-wrap gap-3 mb-6">
        <select
          v-if="showSchoolDropdown"
          v-model="selectedSchoolId"
          class="border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
          @change="changeSchool"
        >
          <option v-for="school in schoolOptions" :key="school.value" :value="school.value">
            {{ school.label }}
          </option>
        </select>
        <select
          v-if="showBranchDropdown"
          v-model="selectedBranchId"
          class="border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
          @change="onBranchChange"
        >
          <option value="">All branches</option>
          <option v-for="branch in branchOptions" :key="branch.value" :value="branch.value">
            {{ branch.label }}
          </option>
        </select>
        <select
          v-model="classId"
          class="border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
          @change="onClassChange"
        >
          <option value="">All classes</option>
          <option v-for="option in classOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <select
          v-model="sectionId"
          class="border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
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
          class="border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
          @change="load(active)"
        />
        <input
          v-model="toDate"
          type="date"
          class="border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
          @change="load(active)"
        />
      </div>
      <div class="flex gap-2 mb-6 flex-wrap">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="px-3 py-2 text-sm rounded-md"
          :class="active === tab.id ? 'bg-indigo-600 text-white' : 'bg-white border dark:bg-gray-800'"
          @click="load(tab.id)"
        >
          {{ tab.label }}
        </button>
      </div>
      <div class="bg-white dark:bg-gray-800 shadow rounded-md overflow-x-auto">
        <table class="min-w-full divide-y">
          <thead>
            <tr>
              <th v-for="h in headers" :key="h" class="px-4 py-3 text-left text-xs uppercase text-gray-500">
                {{ h }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in rows" :key="i">
              <td v-for="h in headers" :key="h" class="px-4 py-3 text-sm">{{ cell(row, h) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="!rows.length" class="p-6 text-sm text-gray-500">No rows.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useSchoolBranchScope } from '~/composables/useSchoolBranchScope';
import { useAcademics } from '~/composables/useAcademics';
import { SchoolOps } from '~/api/shared/school-ops';

const route = useRoute();
const {
  schoolOptions,
  branchOptions,
  selectedSchoolId,
  selectedBranchId,
  showSchoolDropdown,
  showBranchDropdown,
  scopeParams,
  loadScope,
  onSchoolChange
} = useSchoolBranchScope();
const { classOptions, sectionOptions, fetchClasses, fetchSections } = useAcademics();

const tabs = [
  { id: 'credentials', label: 'Login credentials' },
  { id: 'admissions', label: 'Admission report' },
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
  if (active.value === 'credentials') return ['name', 'admission_number', 'class_name', 'login_email', 'login_status'];
  if (active.value === 'admissions') return ['first_name', 'last_name', 'admission_number', 'admission_date', 'current_class', 'present_address', 'permanent_address', 'previous_school_name', 'custom_fields'];
  if (active.value === 'class-section') return ['label', 'count'];
  return ['parent', 'students'];
});

const cell = (row: any, h: string) => {
  if (h === 'students' && Array.isArray(row.students)) {
    return row.students.map((s: any) => s.first_name).join(', ');
  }
  return row[h] ?? '—';
};

const load = async (id: string) => {
  active.value = id;
  const res: any = await SchoolOps.reports(id, {
    ...scopeParams.value,
    ...(classId.value ? { class_id: classId.value } : {}),
    ...(sectionId.value ? { section_id: sectionId.value } : {}),
    ...(fromDate.value ? { from_date: fromDate.value } : {}),
    ...(toDate.value ? { to_date: toDate.value } : {})
  });
  rows.value = res.data?.rows || [];
};

const changeSchool = async () => {
  await onSchoolChange();
  classId.value = '';
  sectionId.value = '';
  await fetchClasses({ branchId: selectedBranchId.value });
  await load(active.value);
};

const onBranchChange = async () => {
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

onMounted(async () => {
  await loadScope();
  await fetchClasses({ branchId: selectedBranchId.value });
  if (route.query.tab === 'admissions') {
    fromDate.value = today;
    toDate.value = today;
  }
  await load(tabs.some(tab => tab.id === route.query.tab) ? String(route.query.tab) : 'credentials');
});
</script>
