<template>
  <div v-if="!entity" class="p-8">
    <p class="text-sm text-red-600">Unknown screen: {{ entityKey }}</p>
  </div>
  <div v-else class="space-y-6 max-w-full">
    <!-- Page Header & Filter Controls -->
    <div class="bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 rounded-2xl shadow-sm p-6">
      <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span class="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Layers class="w-5 h-5" />
            </span>
            {{ entity.title }}
          </h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ entity.description }}</p>
        </div>

        <div class="flex flex-wrap items-end gap-3">
          <!-- School Selector (Super Admin) -->
          <div v-if="isSuperAdmin" class="flex-1 min-w-[180px]">
            <label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              School
            </label>
            <div class="relative">
              <select
                v-model="selectedSchoolId"
                class="appearance-none w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3.5 py-2 pr-8 text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                @change="onSchoolChange"
              >
                <option value="">Select school</option>
                <option v-for="school in schoolOptions" :key="school.value" :value="school.value">
                  {{ school.label }}
                </option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-gray-400">
                <ChevronDown class="w-4 h-4" />
              </div>
            </div>
          </div>

          <!-- Branch Selector -->
          <div v-if="showBranchDropdown" class="flex-1 min-w-[160px]">
            <label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Branch
            </label>
            <div class="relative">
              <select
                v-model="selectedBranchId"
                class="appearance-none w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3.5 py-2 pr-8 text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                @change="reload"
              >
                <option value="">All branches</option>
                <option v-for="branch in branchOptions" :key="branch.value" :value="branch.value">
                  {{ branch.label }}
                </option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-gray-400">
                <ChevronDown class="w-4 h-4" />
              </div>
            </div>
          </div>

          <!-- Class Selector -->
          <div class="flex-1 min-w-[150px]">
            <label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Class
            </label>
            <div class="relative">
              <select
                v-model="selectedClassId"
                class="appearance-none w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3.5 py-2 pr-8 text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                @change="onClassFilterChange"
              >
                <option value="">All classes</option>
                <option v-for="c in classOptions" :key="c.value" :value="c.value">
                  {{ c.label }}
                </option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-gray-400">
                <ChevronDown class="w-4 h-4" />
              </div>
            </div>
          </div>

          <!-- Section Selector -->
          <div v-if="selectedClassId" class="flex-1 min-w-[140px]">
            <label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Section
            </label>
            <div class="relative">
              <select
                v-model="selectedSectionId"
                class="appearance-none w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3.5 py-2 pr-8 text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                @change="reload"
              >
                <option value="">All sections</option>
                <option v-for="s in sectionOptions" :key="s.value" :value="s.value">
                  {{ s.label }}
                </option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-gray-400">
                <ChevronDown class="w-4 h-4" />
              </div>
            </div>
          </div>

          <!-- Add Button -->
          <div class="self-end">
            <button
              class="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200 whitespace-nowrap"
              @click="openCreate"
            >
              <Plus class="w-4 h-4" />
              Add {{ entity.title }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <div
      v-if="errorMessage"
      class="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800/80 p-4 text-sm text-red-700 dark:text-red-300 flex items-center justify-between shadow-sm"
    >
      <span class="font-medium">{{ errorMessage }}</span>
      <button class="px-3.5 py-1.5 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded-xl text-xs font-semibold hover:bg-red-200 transition-colors flex items-center gap-1.5" @click="reload">
        <RefreshCw class="w-3.5 h-3.5" />
        Retry
      </button>
    </div>

    <!-- Table Container -->
    <div class="bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 shadow-sm rounded-2xl overflow-hidden">
      <div v-if="loading" class="p-12 text-center text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-3">
        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
        Loading records…
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700/60">
          <thead class="bg-gray-50/80 dark:bg-gray-800">
            <tr>
              <th
                v-for="col in entity.columns"
                :key="col.key"
                class="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 min-w-[140px]"
              >
                {{ col.label }}
              </th>
              <th class="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 min-w-[160px] sticky right-0 bg-gray-50/95 dark:bg-gray-800 backdrop-blur-sm shadow-xs">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700/60 bg-white dark:bg-gray-800">
            <tr v-for="item in items" :key="item.id" class="hover:bg-gray-50/60 dark:hover:bg-gray-700/40 transition-colors">
              <td v-for="col in entity.columns" :key="col.key" class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                {{ display(item, col.key) }}
              </td>
              <td class="px-6 py-4 text-sm whitespace-nowrap text-right space-x-2 sticky right-0 bg-white dark:bg-gray-800 shadow-sm">
                <button
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors border border-amber-200 dark:border-amber-900/50"
                  @click="openEdit(item)"
                >
                  <Pencil class="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  v-for="action in entity.actions || []"
                  :key="action.id"
                  class="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors border border-indigo-200 dark:border-indigo-900/50"
                  @click="runAction(item.id, action.id)"
                >
                  {{ action.label }}
                </button>
                <button
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors border border-red-200 dark:border-red-900/50"
                  @click="remove(item.id)"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>

          <div v-if="!items.length && !errorMessage" class="p-12 text-center space-y-3">
            <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto text-gray-400">
              <Layers class="w-6 h-6" />
            </div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">No records found</p>
            <p class="text-xs text-gray-500 dark:text-gray-500">Click the button above to add your first record.</p>
          </div>
        </div>
      </div>

      <!-- Add/Edit Modal Dialog -->
      <div v-if="showForm" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
          <div class="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-700 pb-3">
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ editingId ? 'Edit' : 'Add' }} {{ entity.title }}</h2>
            <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" @click="showForm = false">✕</button>
          </div>

          <div v-for="field in entity.fields" :key="field.key" class="mb-4">
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              {{ field.label }} <span v-if="field.required" class="text-red-500">*</span>
            </label>

            <!-- Textarea Field -->
            <textarea
              v-if="field.type === 'textarea'"
              v-model="form[field.key]"
              :required="field.required"
              rows="3"
              class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            />

            <!-- Select Field with Custom Chevron -->
            <div v-else-if="field.type === 'select'" class="relative">
              <select
                v-model="form[field.key]"
                :required="field.required"
                class="appearance-none w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-8 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              >
                <option value="">Select {{ field.label }}</option>
                <option
                  v-for="opt in fieldOptions(field)"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-gray-400">
                <ChevronDown class="w-4 h-4" />
              </div>
            </div>

            <!-- Checkbox Field -->
            <div v-else-if="field.type === 'checkbox'" class="flex items-center gap-2">
              <input
                v-model="form[field.key]"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ field.label }}</span>
            </div>

            <!-- Standard Input Field -->
            <input
              v-else
              v-model="form[field.key]"
              :type="field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'"
              :required="field.required"
              class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>

          <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" @click="showForm = false">
              Cancel
            </button>
            <button class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors" @click="save">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
</template>

<!-- SchoolCrudPage component -->

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { MODULE_ENTITY_DEFINITIONS, type EntityField } from '~/config/entity-definitions';
import { DynamicEntities } from '~/api/shared/dynamic-entities';
import { Students } from '~/api/students';
import { Classes } from '~/api/academic/classes';
import { Schools } from '~/api/administration/schools';
import { Branches } from '~/api/administration/branches';
import { Users } from '~/api/administration/users';
import { useToast } from '~/composables/useToast';
import { useAuth } from '~/composables/useAuth';
import { extractList, apiErrorMessage } from '~/utils/list-response';
import { ChevronDown, Plus, Pencil, Trash2, RefreshCw, Layers } from 'lucide-vue-next';

const props = defineProps<{ entityKey: string }>();
const { showToast } = useToast();
const { user } = useAuth();
const entity = computed(() => MODULE_ENTITY_DEFINITIONS[props.entityKey]);
const isSuperAdmin = computed(() => user.value?.role === 'super_admin');
const isBranchAdmin = computed(() => user.value?.role === 'branch_admin');
const items = ref<any[]>([]);
const loading = ref(false);
const errorMessage = ref('');
const showForm = ref(false);
const editingId = ref<string | null>(null);
const form = reactive<Record<string, any>>({});
const classOptions = ref<Array<{ label: string; value: string }>>([]);
const sectionOptions = ref<Array<{ label: string; value: string }>>([]);
const selectedClassId = ref('');
const selectedSectionId = ref('');
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

const fieldOptions = (field: EntityField) => {
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
      const res: any = await DynamicEntities.list(entityKey, scopeParams.value);
      entityOptions.value[entityKey] = extractList(res, ['records']).map((item: any) => ({ label: item.title, value: item.id }));
    }));

    // Fetch class list for header filter and field options (scoped to selected branch/school)
    await loadClassesForBranch();

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
    console.warn('Lookup load failed', errText(error));
  }
};

const loadClassesForBranch = async () => {
  try {
    const params = new URLSearchParams();
    if (selectedSchoolId.value) params.set('school_id', selectedSchoolId.value);
    if (selectedBranchId.value) params.set('branch_id', selectedBranchId.value);
    const res: any = await Classes.getDropdown(params.toString());
    const list = extractList(res, ['classes']);
    const classes = list.length ? list : Array.isArray(res?.data) ? res.data : [];
    classOptions.value = classes.map((c: any) => ({
      label: c.name,
      value: c.id
    }));
  } catch (error: any) {
    console.warn('Class lookup load failed', errText(error));
  }
};

const onBranchChange = async () => {
  selectedClassId.value = '';
  selectedSectionId.value = '';
  sectionOptions.value = [];
  await loadClassesForBranch();
  await reload();
};

const onClassFilterChange = async () => {
  selectedSectionId.value = '';
  if (selectedClassId.value) {
    try {
      const res: any = await Classes.getSections(selectedClassId.value);
      const list = extractList(res, ['sections']);
      sectionOptions.value = list.map((s: any) => ({ label: s.name, value: s.id }));
    } catch {
      sectionOptions.value = [];
    }
  } else {
    sectionOptions.value = [];
  }
  await reload();
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
    const res: any = await DynamicEntities.list(props.entityKey, scopeParams.value);
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
  ...(selectedBranchId.value ? { branch_id: selectedBranchId.value } : {}),
  ...(selectedClassId.value ? { class_id: selectedClassId.value } : {}),
  ...(selectedSectionId.value ? { section_id: selectedSectionId.value } : {})
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
  selectedClassId.value = '';
  selectedSectionId.value = '';
  sectionOptions.value = [];
  await loadBranches();
  await loadClassesForBranch();
  await reload();
};

const reload = async () => {
  await Promise.all([load(), loadLookups()]);
};

const openCreate = () => {
  editingId.value = null;
  Object.keys(form).forEach(k => delete form[k]);
  showForm.value = true;
};

const openEdit = (item: any) => {
  editingId.value = item.id;
  Object.keys(form).forEach(k => delete form[k]);
  Object.assign(form, item);
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
    if (editingId.value) {
      await DynamicEntities.update(props.entityKey, editingId.value, payload);
    } else {
      await DynamicEntities.create(props.entityKey, payload);
    }
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
    await DynamicEntities.remove(props.entityKey, id);
    await load();
  } catch (error: any) {
    showToast(errText(error), 'error');
  }
};

const runAction = async (id: string, action: string) => {
  try {
    await DynamicEntities.action(props.entityKey, id, action);
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
