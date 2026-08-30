<template>
  <div v-if="!entity" class="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
    <p class="text-sm text-red-600">Unknown screen: {{ entityKey }}</p>
  </div>
  <div v-else class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">{{ entity.title }}</h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">{{ entity.description }}</p>
        </div>
        <div class="flex flex-col gap-3 sm:flex-row">
          <div v-if="isSuperAdmin" class="sm:w-64">
            <label class="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">School</label>
            <select
              v-model="selectedSchoolId"
              class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-900 dark:text-white"
              @change="onSchoolChange"
            >
              <option value="">Select school</option>
              <option v-for="school in schoolOptions" :key="school.value" :value="school.value">
                {{ school.label }}
              </option>
            </select>
          </div>
          <div v-if="showBranchDropdown" class="sm:w-64">
            <label class="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Branch</label>
            <select
              v-model="selectedBranchId"
              class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-900 dark:text-white"
              @change="reload"
            >
              <option value="">All branches</option>
              <option v-for="branch in branchOptions" :key="branch.value" :value="branch.value">
                {{ branch.label }}
              </option>
            </select>
          </div>
        </div>
        <button
          class="inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
          @click="openCreate"
        >
          Add
        </button>
      </div>

      <div
        v-if="errorMessage"
        class="mb-4 rounded-md border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300"
      >
        {{ errorMessage }}
        <button class="ml-3 underline" @click="reload">Retry</button>
      </div>

      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg overflow-x-auto">
        <div v-if="loading" class="p-6 text-sm text-gray-500">Loading…</div>
        <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700/60">
            <tr>
              <th
                v-for="col in entity.columns"
                :key="col.key"
                class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400"
              >
                {{ col.label }}
              </th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="item in items" :key="item.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/40">
              <td v-for="col in entity.columns" :key="col.key" class="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                {{ display(item, col.key) }}
              </td>
              <td class="px-4 py-3 text-sm whitespace-nowrap">
                <button
                  v-for="action in entity.actions || []"
                  :key="action.id"
                  class="mr-3 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                  @click="runAction(item.id, action.id)"
                >
                  {{ action.label }}
                </button>
                <button class="text-sm font-medium text-red-600 hover:text-red-700" @click="remove(item.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!loading && !items.length && !errorMessage" class="p-6 text-sm text-gray-500">
No records yet. Add the first record when this setup is needed.
        </p>
      </div>

      <div v-if="showForm" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div
          class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl"
        >
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add {{ entity.title }}</h2>
          <div v-for="field in entity.fields" :key="field.key" class="mb-3">
            <label class="block text-sm font-medium mb-1">
              {{ field.label }} <span v-if="field.required" class="text-red-500">*</span>
            </label>
            <textarea
              v-if="field.type === 'textarea'"
              v-model="form[field.key]"
              :required="field.required"
              class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-900 dark:text-white"
            />
            <select
              v-else-if="field.type === 'select'"
              v-model="form[field.key]"
              :required="field.required"
              class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-900 dark:text-white"
            >
              <option value="">Select</option>
              <option
                v-for="opt in fieldOptions(field)"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
            <input
              v-else-if="field.type === 'checkbox'"
              v-model="form[field.key]"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <input
              v-else
              v-model="form[field.key]"
              :type="field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'"
              :required="field.required"
              class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div class="flex justify-end gap-2 mt-4">
            <button class="px-3 py-2 text-sm text-gray-700 dark:text-gray-200" @click="showForm = false">Cancel</button>
            <button class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg" @click="save">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { SCHOOL_OPS_ENTITIES, type OpsField } from '~/config/school-ops';
import { SchoolOps } from '~/api/shared/school-ops';
import { Students } from '~/api/students';
import { Classes } from '~/api/academic/classes';
import { Schools } from '~/api/administration/schools';
import { Branches } from '~/api/administration/branches';
import { Users } from '~/api/administration/users';
import { useToast } from '~/composables/useToast';
import { useAuth } from '~/composables/useAuth';
import { extractList, apiErrorMessage } from '~/utils/list-response';

const props = defineProps<{ entityKey: string }>();
const { showToast } = useToast();
const { user } = useAuth();
const entity = computed(() => SCHOOL_OPS_ENTITIES[props.entityKey]);
const isSuperAdmin = computed(() => user.value?.role === 'super_admin');
const isBranchAdmin = computed(() => user.value?.role === 'branch_admin');
const items = ref<any[]>([]);
const loading = ref(false);
const errorMessage = ref('');
const showForm = ref(false);
const form = reactive<Record<string, any>>({});
const classOptions = ref<Array<{ label: string; value: string }>>([]);
const studentOptions = ref<Array<{ label: string; value: string }>>([]);
const userOptions = ref<Array<{ label: string; value: string }>>([]);
const staffOptions = ref<Array<{ label: string; value: string }>>([]);
const entityOptions = ref<Record<string, Array<{ label: string; value: string }>>>({});
const schoolOptions = ref<Array<{ label: string; value: string }>>([]);
const selectedSchoolId = ref('');
const branchOptions = ref<Array<{ label: string; value: string }>>([]);
const selectedBranchId = ref('');
const showBranchDropdown = computed(() => !isBranchAdmin.value && branchOptions.value.length > 1);

const errText = (error: any) => apiErrorMessage(error);

const display = (item: any, key: string) => {
  if (key === 'student' && item.student) {
    return `${item.student.first_name} ${item.student.last_name || ''}`.trim();
  }
  if (key === 'class' && item.class) return item.class.name;
  const value = item[key];
  if (value && typeof value === 'object') return value.name || value.email || '';
  return value ?? '—';
};

const fieldOptions = (field: OpsField) => {
  if (field.lookup === 'classes') return classOptions.value;
  if (field.lookup === 'students') return studentOptions.value;
  if (field.lookup === 'users') return userOptions.value;
  if (field.lookup === 'staff') return staffOptions.value;
  if (field.lookup?.startsWith('entity:')) return entityOptions.value[field.lookup.slice(7)] || [];
  return field.options || [];
};

const loadLookups = async () => {
  if (!entity.value) return;
  try {
    const needs = entity.value.fields.map(f => f.lookup).filter(Boolean);
    const entityNeeds = needs.filter((lookup): lookup is `entity:${string}` => Boolean(lookup?.startsWith('entity:'))).map(lookup => lookup.slice(7));
    await Promise.all(entityNeeds.map(async entityKey => {
      const res: any = await SchoolOps.list(entityKey, scopeParams.value);
      entityOptions.value[entityKey] = extractList(res, ['records']).map((item: any) => ({ label: item.title, value: item.id }));
    }));
    if (needs.includes('classes')) {
      const qs = new URLSearchParams();
      // Prefer dropdown endpoint used across the app
      const res: any = await Classes.getDropdown(qs.toString());
      const list = extractList(res, ['classes']);
      const classes = list.length ? list : Array.isArray(res?.data) ? res.data : [];
      classOptions.value = classes.map((c: any) => ({
        label: c.name,
        value: c.id
      }));
    }
    if (needs.includes('students')) {
      const res: any = await Students.getAll({ limit: 200 });
      studentOptions.value = extractList(res, ['students']).map((s: any) => ({
        label: `${s.first_name} ${s.last_name || ''} (${s.admission_number})`,
        value: s.id
      }));
    }
    if (needs.includes('users') || needs.includes('staff')) {
      const res: any = await Users.getAll({ limit: 200 });
      const users = extractList(res, ['users']);
      userOptions.value = users.map((u: any) => ({
        label: `${u.first_name} ${u.last_name || ''}`.trim(),
        value: u.id
      }));
      const staffRoles = new Set(['super_admin', 'admin', 'branch_admin', 'accountant', 'teacher', 'librarian', 'receptionist']);
      staffOptions.value = users.filter((u: any) => staffRoles.has(u.role)).map((u: any) => ({ label: `${u.first_name} ${u.last_name || ''}`.trim(), value: u.id }));
    }
  } catch (error: any) {
    // Lookups are optional for list view
    console.warn('Lookup load failed', errText(error));
  }
};

const load = async () => {
  if (!entity.value) return;
  if (isSuperAdmin.value && !selectedSchoolId.value) {
    items.value = [];
    errorMessage.value = 'Select a school';
    return;
  }
  loading.value = true;
  errorMessage.value = '';
  try {
    const res: any = await SchoolOps.list(props.entityKey, scopeParams.value);
    items.value = extractList(res, ['records']);
  } catch (error: any) {
    errorMessage.value = errText(error);
    items.value = [];
  } finally {
    loading.value = false;
  }
};

const scopeParams = computed(() => ({
  ...(isSuperAdmin.value && selectedSchoolId.value ? { school_id: selectedSchoolId.value } : {}),
  ...(selectedBranchId.value ? { branch_id: selectedBranchId.value } : {})
}));

const loadSchools = async () => {
  if (!isSuperAdmin.value) return;
  const res: any = await Schools.getAll({ limit: 200 });
  schoolOptions.value = extractList(res, ['schools']).map((school: any) => ({ label: school.name, value: school.id }));
  if (!selectedSchoolId.value && schoolOptions.value.length) selectedSchoolId.value = schoolOptions.value[0].value;
};

const loadBranches = async () => {
  const schoolId = selectedSchoolId.value || user.value?.school_id;
  if (!schoolId) return;
  const res: any = await Branches.getForDropdown({ status: 'active', school_id: schoolId });
  const branches = extractList(res, ['branches']);
  branchOptions.value = branches.map((branch: any) => ({ label: branch.name || branch.code || branch.id, value: branch.id }));
  selectedBranchId.value = user.value?.branch_id || (branchOptions.value.length === 1 ? branchOptions.value[0].value : '');
};

const onSchoolChange = async () => {
  selectedBranchId.value = '';
  await loadBranches();
  await reload();
};

const reload = async () => {
  await Promise.all([load(), loadLookups()]);
};

const openCreate = () => {
  Object.keys(form).forEach(k => delete form[k]);
  showForm.value = true;
};

const save = async () => {
  try {
    const missing = entity.value?.fields.find(field => field.required && !form[field.key]);
    if (missing) return showToast(`${missing.label} is required`, 'error');
    const payload = { ...form };
    if (selectedSchoolId.value) payload.school_id = selectedSchoolId.value;
    if (selectedBranchId.value) payload.branch_id = selectedBranchId.value;
    entity.value?.fields.filter(field => field.type === 'select' && field.lookup && payload[field.key]).forEach(field => {
      payload[`${field.key}_label`] = fieldOptions(field).find(option => option.value === payload[field.key])?.label || '';
    });
    if (!payload.title && payload.first_name) {
      payload.title = `${payload.first_name} ${payload.last_name || ''}`.trim();
    }
    if (!payload.title && payload.name) payload.title = payload.name;
    await SchoolOps.create(props.entityKey, payload);
    showForm.value = false;
    await load();
    showToast('Saved', 'success');
  } catch (error: any) {
    showToast(errText(error), 'error');
  }
};

const remove = async (id: string) => {
  if (!window.confirm('Delete this record?')) return;
  try {
    await SchoolOps.remove(props.entityKey, id);
    await load();
  } catch (error: any) {
    showToast(errText(error), 'error');
  }
};

const runAction = async (id: string, action: string) => {
  try {
    await SchoolOps.action(props.entityKey, id, action);
    await load();
    showToast('Updated', 'success');
  } catch (error: any) {
    showToast(errText(error), 'error');
  }
};

watch(
  () => props.entityKey,
  () => {
    reload();
  }
);

onMounted(async () => {
  await loadSchools();
  await loadBranches();
  await reload();
});
</script>
