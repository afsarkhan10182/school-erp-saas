<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-[96rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Bulk edit students</h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Load a class roster, edit fields inline, then save all changed rows once.</p>
        </div>
        <span class="text-sm text-gray-600 dark:text-gray-300">{{ dirtyIds.size }} changed</span>
      </header>

      <section class="panel">
        <h2 class="section-title">Load students</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <EnhancedDropdown v-if="showBranchDropdown" v-model="selectedBranchId" :options="branchOptions" label="Branch" placeholder="All branches" @update:model-value="onBranchChange" />
          <EnhancedDropdown v-model="classId" :options="classOptions" label="Class *" placeholder="Select class" @update:model-value="onClassChange" />
          <EnhancedDropdown v-model="sectionId" :options="sectionOptions" label="Section" placeholder="All sections" :disabled="!classId" />
          <div class="flex items-end"><button class="primary-button w-full" :disabled="!classId || loading" @click="load">{{ loading ? 'Loading…' : 'Load Students' }}</button></div>
        </div>
      </section>

      <section v-if="students.length" class="panel space-y-5">
        <div><h2 class="section-title mb-0">Bulk numbering</h2><p class="mt-1 text-xs text-gray-500">Leave a starting value blank to skip that number series.</p></div>
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <label class="field-label">Admission numbers<input v-model="admissionStart" type="number" min="0" placeholder="Start from" class="input-field mt-1" /></label>
          <label class="field-label">Roll numbers<input v-model="rollStart" type="number" min="0" placeholder="Start from" class="input-field mt-1" /></label>
          <button class="secondary-button" @click="applyNumbering">Apply Changes</button>
          <button class="primary-button md:col-span-2" :disabled="saving || !dirtyIds.size" @click="saveAll">{{ saving ? 'Saving…' : `Save All Changes (${dirtyIds.size})` }}</button>
        </div>
      </section>

      <section v-if="students.length" class="panel">
        <div class="flex items-center justify-between gap-4 mb-4">
          <div><h2 class="section-title mb-0">Columns to edit</h2><p class="text-xs text-gray-500">Choose up to 10 standard fields. Configured school fields will use this same chooser.</p></div>
          <span class="text-xs font-medium text-gray-500">{{ selectedColumns.length }}/10</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <label v-for="field in fields" :key="field.key" class="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200">
            <input v-model="selectedColumns" type="checkbox" :value="field.key" :disabled="!selectedColumns.includes(field.key) && selectedColumns.length >= 10" /> {{ field.label }}
          </label>
        </div>
      </section>

      <section class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-x-auto">
        <div v-if="loading" class="p-6 text-sm text-gray-500">Loading students…</div>
        <table v-else-if="students.length" class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700/60"><tr>
            <th class="sticky left-0 z-10 bg-gray-50 dark:bg-gray-700 px-4 py-3 text-left table-heading">Student</th>
            <th v-for="field in visibleFields" :key="field.key" class="px-4 py-3 text-left table-heading whitespace-nowrap">{{ field.label }}</th>
          </tr></thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="student in students" :key="student.id" :class="dirtyIds.has(student.id) ? 'bg-amber-50 dark:bg-amber-900/10' : ''">
              <td class="sticky left-0 bg-inherit px-4 py-3 min-w-56"><div class="text-sm font-medium text-gray-900 dark:text-white">{{ student.first_name }} {{ student.last_name }}</div><div class="text-xs text-gray-500">{{ student.admission_number }}</div></td>
              <td v-for="field in visibleFields" :key="field.key" class="px-3 py-2 min-w-44">
                <select v-if="field.options" v-model="student._edit[field.key]" class="input-field" @change="markDirty(student.id)"><option value="">Select</option><option v-for="option in field.options" :key="option.value" :value="option.value">{{ option.label }}</option></select>
                <input v-else v-model="student._edit[field.key]" :type="field.type || 'text'" class="input-field" @input="markDirty(student.id)" />
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="p-8 text-center text-sm text-gray-500">Select a class and load its students.</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { StudentCategories, Students } from '~/api/students';
import { DynamicEntities } from '~/api/shared/dynamic-entities';
import { useAcademics } from '~/composables/useAcademics';
import { useAuth } from '~/composables/useAuth';
import { useSchoolBranchScope } from '~/composables/useSchoolBranchScope';
import { useToast } from '~/composables/useToast';
import { extractList, apiErrorMessage } from '~/utils/list-response';

const { user } = useAuth();
const { branchOptions, selectedBranchId, showBranchDropdown, scopeParams, loadScope } = useSchoolBranchScope();
const { classOptions, sectionOptions, fetchClasses, fetchSections } = useAcademics();
const { showToast } = useToast();
const classId = ref(''); const sectionId = ref(''); const admissionStart = ref(''); const rollStart = ref('');
const loading = ref(false); const saving = ref(false); const students = ref<any[]>([]); const dirtyIds = ref(new Set<string>());
const categories = ref<any[]>([]);
const fields = computed(() => [
  { key: 'admission_number', label: 'Admission No.' }, { key: 'roll_number', label: 'Roll No.' }, { key: 'first_name', label: 'First Name' }, { key: 'last_name', label: 'Last Name' },
  { key: 'admission_date', label: 'Admission Date', type: 'date' }, { key: 'date_of_birth', label: 'Date of Birth', type: 'date' },
  { key: 'category_id', label: 'Category', options: categories.value.map(category => ({ label: category.name, value: category.id })) },
  { key: 'gender', label: 'Gender', options: [{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }, { label: 'Other', value: 'other' }] },
  { key: 'blood_group', label: 'Blood Group', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(value => ({ label: value, value })) },
  { key: 'mother_tongue', label: 'Mother Tongue' }, { key: 'religion', label: 'Religion' }, { key: 'caste', label: 'Caste' }, { key: 'email', label: 'Email', type: 'email' },
  { key: 'phone', label: 'Mobile No.' }, { key: 'city', label: 'City' }, { key: 'state', label: 'State' }, { key: 'address', label: 'Address' }
]);
const selectedColumns = ref(['admission_number', 'roll_number', 'first_name', 'last_name', 'admission_date', 'date_of_birth', 'email', 'phone']);
const visibleFields = computed(() => fields.value.filter(field => selectedColumns.value.includes(field.key)));
const resetRoster = () => { sectionId.value = ''; students.value = []; dirtyIds.value = new Set(); };
const onBranchChange = async () => {
  classId.value = '';
  resetRoster();
  await fetchClasses({ schoolId: user.value?.school_id, branchId: selectedBranchId.value || user.value?.branch_id });
};
const onClassChange = async (value: string) => {
  classId.value = value;
  resetRoster();
  if (value) await fetchSections({ schoolId: user.value?.school_id, branchId: selectedBranchId.value || user.value?.branch_id, classId: value });
};
const load = async () => {
  loading.value = true;
  try { const response: any = await Students.getAll({ class_id: classId.value, section_id: sectionId.value || undefined, limit: 200, ...scopeParams.value }); students.value = extractList(response, ['students']).map((student: any) => { const values = Object.fromEntries(fields.value.map(field => [field.key, student[field.key] ?? ''])); return { ...student, _edit: { ...values }, _original: values }; }); dirtyIds.value = new Set(); showToast(`Loaded ${students.value.length} students`, 'success'); }
  catch (error: any) { showToast(apiErrorMessage(error), 'error'); } finally { loading.value = false; }
};
const markDirty = (id: string) => { dirtyIds.value = new Set(dirtyIds.value).add(id); };
const applyNumbering = () => { if (admissionStart.value === '' && rollStart.value === '') return showToast('Enter a starting number', 'error'); students.value.forEach((student, index) => { if (admissionStart.value !== '') student._edit.admission_number = String(Number(admissionStart.value) + index); if (rollStart.value !== '') student._edit.roll_number = String(Number(rollStart.value) + index); markDirty(student.id); }); };
const saveAll = async () => {
  const changed = students.value.filter(student => dirtyIds.value.has(student.id)).map(student => ({ id: student.id, updates: Object.fromEntries(fields.value.filter(field => student._edit[field.key] !== student._original[field.key]).map(field => [field.key, student._edit[field.key]])) })).filter(student => Object.keys(student.updates).length); if (!changed.length || !window.confirm(`Save changes for ${changed.length} students?`)) return; saving.value = true;
  try { await DynamicEntities.bulkEditStudents({ students: changed }); showToast(`Updated ${changed.length} students`, 'success'); await load(); }
  catch (error: any) { showToast(apiErrorMessage(error), 'error'); } finally { saving.value = false; }
};
await loadScope();
const [, categoryResponse] = await Promise.all([
  fetchClasses({ branchId: selectedBranchId.value || user.value?.branch_id }),
  StudentCategories.getAll(scopeParams.value)
]);
categories.value = extractList(categoryResponse, ['categories']);
</script>

<style scoped>
.panel { @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5; }
.section-title { @apply text-sm font-semibold text-gray-900 dark:text-white mb-4; }
.field-label { @apply text-sm font-medium text-gray-700 dark:text-gray-300; }
.input-field { @apply w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white; }
.primary-button { @apply px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50; }
.secondary-button { @apply px-4 py-2.5 border border-indigo-300 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium; }
.table-heading { @apply text-xs font-semibold uppercase text-gray-500 dark:text-gray-300; }
</style>
