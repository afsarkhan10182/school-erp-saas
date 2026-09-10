<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Card Templates</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          ID / admit card layouts used when generating cards
        </p>
      </div>
      <div>
        <NuxtLink
          to="/cards"
          class="inline-flex items-center rounded-xl border border-indigo-200 dark:border-indigo-500/30 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors shadow-sm"
        >
          Generate cards →
        </NuxtLink>
      </div>
    </div>

      <form class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 mb-6 space-y-5" @submit.prevent="save">
        <div>
          <h2 class="text-base font-semibold text-gray-900 dark:text-white">Template setup</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">Configure size, audience and card background before choosing visible fields.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <label v-if="showBranchDropdown" class="space-y-1.5">
            <span class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Branch</span>
            <select
              v-model="selectedBranchId"
              required
              class="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-600"
              @change="load"
            >
              <option value="" disabled>Select branch</option>
              <option v-for="branch in branchOptions" :key="branch.value" :value="branch.value">
                {{ branch.label }}
              </option>
            </select>
          </label>
          <label class="space-y-1.5">
            <span class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Template name</span>
            <input v-model="form.name" required placeholder="Template name" class="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-600" />
          </label>
          <label class="space-y-1.5">
            <span class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Card type</span>
            <select v-model="form.kind" class="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-600">
              <option value="id">ID card</option>
              <option value="admit">Admit card</option>
            </select>
          </label>
          <label class="space-y-1.5">
            <span class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">User type</span>
            <select v-model="form.user_type" class="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-600">
              <option value="student">Student</option>
              <option value="employee">Employee</option>
            </select>
          </label>
          <label class="space-y-1.5">
            <span class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Width (mm)</span>
            <input v-model.number="form.layout_width" type="number" min="40" class="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-600" />
          </label>
          <label class="space-y-1.5">
            <span class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Height (mm)</span>
            <input v-model.number="form.layout_height" type="number" min="30" class="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-600" />
          </label>
          <label class="space-y-1.5">
            <span class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Background color</span>
            <input v-model="form.background_color" type="color" class="w-full border rounded-md h-10 p-1 dark:bg-gray-900 dark:border-gray-600" />
          </label>
          <label class="space-y-1.5 lg:col-span-1">
            <span class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Background image URL</span>
            <input v-model="form.fields_json.background_image_url" placeholder="Optional image URL" class="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-600" />
          </label>
        </div>

        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Visible fields</h3>
            <label class="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <input v-model="form.is_active" type="checkbox" class="rounded border-gray-300" />
              Active template
            </label>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label
              v-for="field in cardFields"
              :key="field.key"
              class="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 dark:bg-gray-900/40 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200"
            >
              <input v-model="form.fields_json[field.key]" type="checkbox" class="rounded border-gray-300" />
              {{ field.label }}
            </label>
          </div>
        </div>

        <div class="flex justify-end">
          <button type="submit" class="w-full sm:w-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium">
            {{ editingId ? 'Update template' : 'Add template' }}
          </button>
        </div>
      </form>

      <p v-if="error" class="mb-4 text-sm text-red-600">{{ error }}</p>

      <div class="bg-white dark:bg-gray-800 shadow rounded-md overflow-x-auto">
        <table class="min-w-full divide-y">
          <thead>
            <tr>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Name</th>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Kind</th>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">User</th>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Layout</th>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Active</th>
              <th class="px-4 py-3 text-right text-xs uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in templates" :key="t.id" class="border-t">
              <td class="px-4 py-3 text-sm">{{ t.name }}</td>
              <td class="px-4 py-3 text-sm">{{ t.kind }}</td>
              <td class="px-4 py-3 text-sm">{{ t.user_type }}</td>
              <td class="px-4 py-3 text-sm">{{ t.layout_width }}×{{ t.layout_height }} mm</td>
              <td class="px-4 py-3 text-sm">{{ t.is_active ? 'Yes' : 'No' }}</td>
              <td class="px-4 py-3 text-sm text-right space-x-2">
                <button class="text-indigo-600" @click="edit(t)">Edit</button>
                <button class="text-red-600" @click="remove(t.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!templates.length" class="p-6 text-sm text-gray-500">No templates yet.</p>
      </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { CardTemplates } from '~/api/academic/cards-exams-reports';
import { useSchoolBranchScope } from '~/composables/useSchoolBranchScope';
import { apiErrorMessage, extractList } from '~/utils/list-response';

const { branchOptions, selectedBranchId, showBranchDropdown, scopeParams, loadScope } = useSchoolBranchScope();
const templates = ref<any[]>([]);
const editingId = ref('');
const error = ref('');
const defaultFields = {
  show_photo: true,
  show_admission: true,
  show_class: true,
  show_roll: true,
  show_dob: true,
  show_blood: true,
  show_valid_until: true,
  background_image_url: ''
};
const cardFields: Array<{ key: keyof typeof defaultFields; label: string }> = [
  { key: 'show_photo', label: 'Photo' },
  { key: 'show_admission', label: 'Admission no.' },
  { key: 'show_class', label: 'Class' },
  { key: 'show_roll', label: 'Roll no.' },
  { key: 'show_dob', label: 'DOB' },
  { key: 'show_blood', label: 'Blood group' },
  { key: 'show_valid_until', label: 'Valid until' }
];
const form = reactive({
  name: '',
  kind: 'id',
  user_type: 'student',
  layout_width: 86,
  layout_height: 54,
  background_color: '#4f46e5',
  fields_json: { ...defaultFields },
  is_active: true
});

const load = async () => {
  error.value = '';
  try {
    const res: any = await CardTemplates.list(scopeParams.value);
    templates.value = res.data?.templates || extractList(res) || [];
  } catch (e) {
    error.value = apiErrorMessage(e);
  }
};

const resetForm = () => {
  editingId.value = '';
  form.name = '';
  form.kind = 'id';
  form.user_type = 'student';
  form.layout_width = 86;
  form.layout_height = 54;
  form.background_color = '#4f46e5';
  form.fields_json = { ...defaultFields };
  form.is_active = true;
};

const edit = (t: any) => {
  editingId.value = t.id;
  form.name = t.name;
  form.kind = t.kind;
  form.user_type = t.user_type;
  form.layout_width = t.layout_width;
  form.layout_height = t.layout_height;
  form.background_color = t.background_color || '#4f46e5';
  form.fields_json = { ...defaultFields, ...(t.fields_json || {}) };
  form.is_active = t.is_active !== false;
};

const save = async () => {
  try {
    if (editingId.value) await CardTemplates.update(editingId.value, { ...form, ...scopeParams.value });
    else await CardTemplates.create({ ...form, ...scopeParams.value });
    resetForm();
    await load();
  } catch (e) {
    error.value = apiErrorMessage(e);
  }
};

const remove = async (id: string) => {
  if (!confirm('Delete this template?')) return;
  try {
    await CardTemplates.remove(id);
    await load();
  } catch (e) {
    error.value = apiErrorMessage(e);
  }
};

onMounted(async () => {
  await loadScope();
  await load();
});
</script>
