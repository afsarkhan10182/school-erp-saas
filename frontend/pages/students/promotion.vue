<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Student promotion</h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Move students to the next class or keep them in the same class for the new year.
        </p>
      </div>
      <div class="text-sm text-gray-600 dark:text-gray-400">
        <span class="font-bold text-gray-900 dark:text-white">{{ students.length }}</span>
        loaded
      </div>
    </div>

    <section class="card">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <EnhancedDropdown
          v-model="fromClassId"
          :options="classOptions"
          label="From class"
          placeholder="Select class"
          @change="onFromClass"
        />
        <EnhancedDropdown
          v-model="fromSectionId"
          :options="fromSectionOptions"
          label="From section"
          placeholder="All"
        />
        <EnhancedDropdown
          v-model="toClassId"
          :options="classOptions"
          label="To class"
          placeholder="Select class"
          @change="onToClass"
        />
        <EnhancedDropdown
          v-model="toYear"
          :options="yearOptions"
          label="To academic year"
          placeholder="Select year"
        />
        <div class="md:col-span-4 flex justify-end">
          <button
            type="button"
            :disabled="!fromClassId || loading"
            class="btn-primary flex items-center gap-2 disabled:opacity-50"
            @click="loadStudents"
          >
            {{ loading ? 'Loading...' : 'Load students' }}
          </button>
        </div>
      </div>
    </section>

    <section class="table-container">
      <table
        v-if="students.length"
        class="table"
      >
        <thead>
          <tr>
            <th class="w-12 px-4 py-3.5">
              <input type="checkbox" :checked="allSelected" @change="toggleAll" class="rounded text-indigo-600 focus:ring-indigo-500" />
            </th>
            <th>Student</th>
            <th>Roll</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700/60">
          <tr
            v-for="student in students"
            :key="student.id"
            class="table-row-hover"
          >
            <td class="px-4 py-3">
              <input v-model="selected" type="checkbox" :value="student.id" class="rounded text-indigo-600 focus:ring-indigo-500" />
            </td>
            <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
              {{ student.first_name }} {{ student.last_name }}
            </td>
            <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{{ student.roll_number || '—' }}</td>
            <td class="px-6 py-4 text-sm">
              <select
                v-model="actions[student.id]"
                class="input-field py-1 px-2.5 text-xs max-w-[120px]"
              >
                <option value="promote">Promote</option>
                <option value="repeat">Repeat</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!students.length" class="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Select a class and load students to prepare promotion.
      </p>
      <div
        v-if="students.length"
        class="p-4 border-t border-gray-200 dark:border-gray-700/80 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end"
      >
        <button
          type="button"
          :disabled="saving || !toClassId || !toYear || !selected.length"
          class="btn-primary disabled:opacity-50"
          @click="save"
        >
          {{ saving ? 'Saving...' : `Save promotion (${selected.length})` }}
        </button>
      </div>
    </section>
    <ConfirmDialog
      :show="showPromotionConfirm"
      title="Save promotion?"
      :message="`Save promotion for ${selected.length} selected students?`"
      confirm-label="Save promotion"
      @close="showPromotionConfirm = false"
      @confirm="confirmSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue';
import { useAcademics } from '~/composables/useAcademics';
import { useToast } from '~/composables/useToast';
import { useAuth } from '~/composables/useAuth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { Promotions } from '~/api/students/academic-services';
import { AcademicYears } from '~/api/academic/academic-years';
import { extractList, apiErrorMessage } from '~/utils/list-response';

const { showToast } = useToast();
const { user } = useAuth();
const { selectedBranchId, branchScopeParams: scopeParams } = useGlobalBranch();
const { classOptions, sectionOptions, fetchClasses, fetchSections } = useAcademics();
const fromClassId = ref('');
const fromSectionId = ref('');
const toClassId = ref('');
const toYear = ref('');
const loading = ref(false);
const saving = ref(false);
const showPromotionConfirm = ref(false);
const students = ref<any[]>([]);
const selected = ref<string[]>([]);
const actions = reactive<Record<string, 'promote' | 'repeat'>>({});
const allSelected = computed(
  () => students.value.length > 0 && selected.value.length === students.value.length
);
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
  await fetchClasses({
    schoolId: user.value?.school_id,
    branchId: selectedBranchId.value || user.value?.branch_id
  });
};
const onFromClass = async () => {
  resetLoaded();
  if (fromClassId.value) {
    await fetchSections({
      schoolId: user.value?.school_id,
      branchId: selectedBranchId.value || user.value?.branch_id,
      classId: fromClassId.value
    });
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
  if (!selected.value.length) {
    showToast('Select at least one student', 'error');
    return;
  }
  if (!toClassId.value || !toYear.value) {
    showToast('Select a destination class and academic year', 'error');
    return;
  }
  showPromotionConfirm.value = true;
};

const confirmSave = async () => {
  showPromotionConfirm.value = false;
  if (!selected.value.length || !toClassId.value || !toYear.value) return;
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
  await fetchClasses({ branchId: selectedBranchId.value || user.value?.branch_id });
  const yearRes: any = await AcademicYears.getAll({ limit: 50 });
  years.value = Array.isArray(yearRes.data) ? yearRes.data : yearRes.data?.academicYears || [];
});
</script>
