<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Student categories</h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Group students for fees and reporting
          </p>
        </div>
        <button class="px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700" @click="openCreate">
          Add category
        </button>
      </div>

      <div
        v-if="errorMessage"
        class="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {{ errorMessage }}
        <button class="ml-3 underline" @click="load">Retry</button>
      </div>

      <select
        v-if="showBranchDropdown"
        v-model="selectedBranchId"
        class="w-full max-w-xs border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-900 dark:text-white"
        @change="load"
      >
        <option value="">All branches</option>
        <option v-for="branch in branchOptions" :key="branch.value" :value="branch.value">
          {{ branch.label }}
        </option>
      </select>

      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg overflow-hidden">
        <div v-if="loading" class="p-6 text-sm text-gray-500">Loading…</div>
        <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700/60">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Name</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Description</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="item in items" :key="item.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/40">
              <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">{{ item.name }}</td>
              <td class="px-4 py-3 text-sm text-gray-500">{{ item.description || '—' }}</td>
              <td class="px-4 py-3 text-sm">
                <button class="mr-3 text-sm font-medium text-indigo-600 hover:text-indigo-700" @click="edit(item)">Edit</button>
                <button class="text-sm font-medium text-red-600 hover:text-red-700" @click="remove(item.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!loading && !items.length && !errorMessage" class="p-6 text-sm text-gray-500">
          No categories yet.
        </p>
      </div>

      <div v-if="showForm" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 w-full max-w-md shadow-xl">
          <h2 class="text-lg font-semibold mb-4">{{ editingId ? 'Edit' : 'Add' }} category</h2>
          <input
            v-model="form.name"
            class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 mb-3 dark:bg-gray-900 dark:text-white"
            placeholder="Name"
          />
          <textarea
            v-model="form.description"
            class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 mb-4 dark:bg-gray-900 dark:text-white"
            placeholder="Description"
          />
          <div class="flex justify-end gap-2">
            <button class="px-3 py-2 text-sm" @click="showForm = false">Cancel</button>
            <button class="px-3 py-2 bg-indigo-600 text-white text-sm rounded-md" @click="save">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { StudentCategories } from '~/api/students/school-ops';
import { useSchoolBranchScope } from '~/composables/useSchoolBranchScope';
import { useToast } from '~/composables/useToast';
import { extractList, apiErrorMessage } from '~/utils/list-response';

const { showToast } = useToast();
const { branchOptions, selectedBranchId, showBranchDropdown, scopeParams, loadScope } = useSchoolBranchScope();
const items = ref<any[]>([]);
const showForm = ref(false);
const editingId = ref('');
const loading = ref(false);
const errorMessage = ref('');
const form = ref({ name: '', description: '' });

const load = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response: any = await StudentCategories.getAll(scopeParams.value);
    items.value = extractList(response, ['categories']);
  } catch (error: any) {
    errorMessage.value = apiErrorMessage(error);
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  editingId.value = '';
  form.value = { name: '', description: '' };
  showForm.value = true;
};

const edit = (item: any) => {
  editingId.value = item.id;
  form.value = { name: item.name, description: item.description || '' };
  showForm.value = true;
};

const save = async () => {
  try {
    if (editingId.value) await StudentCategories.update(editingId.value, { ...form.value, ...scopeParams.value });
    else await StudentCategories.create({ ...form.value, ...scopeParams.value });
    showForm.value = false;
    await load();
    showToast('Saved', 'success');
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  }
};

const remove = async (id: string) => {
  if (!window.confirm('Delete this category?')) return;
  try {
    await StudentCategories.remove(id);
    await load();
    showToast('Deleted', 'success');
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  }
};

onMounted(async () => {
  await loadScope();
  await load();
});
</script>
