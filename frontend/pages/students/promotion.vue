<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Student promotion</h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Move students to the next class or keep them in the same class for the new year.</p>
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400"><span class="font-medium text-gray-900 dark:text-white">{{ students.length }}</span> loaded</div>
      </div>

      <section class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div v-if="showBranchDropdown">
          <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Branch</label>
          <EnhancedDropdown v-model="selectedBranchId" :options="branchOptions" placeholder="All branches" @update:model-value="onBranchChange" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">From class</label>
          <EnhancedDropdown v-model="fromClassId" :options="classOptions" placeholder="Select class" @change="onFromClass" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">From section</label>
          <EnhancedDropdown v-model="fromSectionId" :options="fromSectionOptions" placeholder="All" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">To class</label>
          <EnhancedDropdown v-model="toClassId" :options="classOptions" placeholder="Select class" @change="onToClass" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">To academic year</label>
          <EnhancedDropdown v-model="toYear" :options="yearOptions" placeholder="Select year" />
        </div>
        <div class="md:col-span-4">
          <button
            type="button"
            :disabled="!fromClassId || loading"
            class="px-4 py-2 bg-green-600 text-white text-sm rounded-md disabled:opacity-50"
            @click="loadStudents"
          >
            {{ loading ? 'Loading...' : 'Load students' }}
          </button>
        </div>
      </section>

      <section class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg overflow-hidden">
        <table v-if="students.length" class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700/60">
            <tr>
              <th class="px-4 py-3"><input type="checkbox" :checked="allSelected" @change="toggleAll" /></th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Student</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Roll</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="student in students" :key="student.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/40">
              <td class="px-4 py-3"><input v-model="selected" type="checkbox" :value="student.id" /></td>
              <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
                {{ student.first_name }} {{ student.last_name }}
              </td>
              <td class="px-4 py-3 text-sm">{{ student.roll_number || '—' }}</td>
              <td class="px-4 py-3 text-sm">
                <select v-model="actions[student.id]" class="border rounded-md px-2 py-1 dark:bg-gray-900 dark:border-gray-600">
                  <option value="promote">Promote</option>
                  <option value="repeat">Repeat</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!students.length" class="p-6 text-sm text-gray-500 dark:text-gray-400">Select a class and load students to prepare promotion.</p>
        <div v-if="students.length" class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button
            type="button"
            :disabled="saving || !toClassId || !toYear || !selected.length"
            class="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md disabled:opacity-50"
            @click="save"
          >
            {{ saving ? 'Saving...' : `Save promotion (${selected.length})` }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { useAcademics } from '~/composables/useAcademics';
import { useToast } from '~/composables/useToast';
import { useAuth } from '~/composables/useAuth';
import { useSchoolBranchScope } from '~/composables/useSchoolBranchScope';
import { Promotions } from '~/api/students/academic-services';
import { AcademicYears } from '~/api/academic/academic-years';
import { extractList, apiErrorMessage } from '~/utils/list-response';

const { showToast } = useToast();
const { user } = useAuth();
const { branchOptions, selectedBranchId, showBranchDropdown, scopeParams, loadScope } = useSchoolBranchScope();
const { classOptions, sectionOptions, fetchClasses, fetchSections } = useAcademics();
const fromClassId = ref('');
const fromSectionId = ref('');
const toClassId = ref('');
const toYear = ref('');
const loading = ref(false);
const saving = ref(false);
const students = ref<any[]>([]);
const selected = ref<string[]>([]);
const actions = reactive<Record<string, 'promote' | 'repeat'>>({});
const allSelected = computed(() => students.value.length > 0 && selected.value.length === students.value.length);
const toggleAll = () => {
  selected.value = allSelected.value ? [] : students.value.map(student => student.id);
};
const years = ref<any[]>([]);
const fromSectionOptions = computed(() => sectionOptions.value);
const yearOptions = computed(() => years.value.map((y: any) => ({ value: y.name, label: y.name })));
const resetLoaded = () => {
  fromSectionId.value = '';
  students.value = [];
  selected.value = [];
  Object.keys(actions).forEach(key => delete actions[key]);
};

const onBranchChange = async () => {
  fromClassId.value = '';
  toClassId.value = '';
  resetLoaded();
  await fetchClasses({ schoolId: user.value?.school_id, branchId: selectedBranchId.value || user.value?.branch_id });
};
const onFromClass = async () => {
  resetLoaded();
  if (fromClassId.value) {
    await fetchSections({ schoolId: user.value?.school_id, branchId: selectedBranchId.value || user.value?.branch_id, classId: fromClassId.value });
  }
};
const onToClass = async () => {
  if (toClassId.value) {
    await fetchSections({ schoolId: user.value?.school_id, classId: toClassId.value });
  }
};

const loadStudents = async () => {
  loading.value = true;
  try {
    const response: any = await Promotions.getStudents({
      class_id: fromClassId.value,
      section_id: fromSectionId.value || undefined,
      ...scopeParams.value
    });
    students.value = extractList(response, ['students']);
    selected.value = [];
    students.value.forEach(s => {
      actions[s.id] = 'promote';
    });
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  } finally {
    loading.value = false;
  }
};

const save = async () => {
  if (!window.confirm(`Save promotion for ${selected.value.length} students?`)) return;
  saving.value = true;
  try {
    await Promotions.promote({
      from_class_id: fromClassId.value,
      from_section_id: fromSectionId.value || undefined,
      to_class_id: toClassId.value,
      to_academic_year: toYear.value,
      ...scopeParams.value,
      students: students.value
        .filter(s => selected.value.includes(s.id))
        .map(s => ({ student_id: s.id, action: actions[s.id] || 'promote' }))
    });
    showToast('Promotion saved', 'success');
    await loadStudents();
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  await loadScope();
  await fetchClasses({ branchId: selectedBranchId.value || user.value?.branch_id });
  const yearRes: any = await AcademicYears.getAll({ limit: 50 });
  years.value = Array.isArray(yearRes.data) ? yearRes.data : yearRes.data?.academicYears || [];
});
</script>
