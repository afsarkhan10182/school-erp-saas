<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Student categories</h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Group students for fees and reporting
        </p>
      </div>
      <button
        class="btn-primary"
        @click="openCreate"
      >
        Add category
      </button>
    </div>

    <div
      v-if="errorMessage"
      class="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300"
    >
      {{ errorMessage }}
      <button class="ml-3 underline font-medium" @click="load">Retry</button>
    </div>

    <div class="table-container">
      <div v-if="loading" class="p-6 text-sm text-gray-500">Loading…</div>
      <table v-else class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700/60">
          <tr
            v-for="item in items"
            :key="item.id"
            class="table-row-hover"
          >
            <td class="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{{ item.name }}</td>
            <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{{ item.description || '—' }}</td>
            <td class="px-6 py-4 text-sm text-right space-x-2">
              <button
                class="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                @click="edit(item)"
              >
                Edit
              </button>
              <button
                class="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                @click="requestRemove(item.id)"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!loading && !items.length && !errorMessage" class="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
        No categories yet.
      </p>
    </div>

    <!-- Create/Edit Modal -->
    <div
      v-if="showForm"
      class="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"
    >
      <div
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4"
      >
        <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ editingId ? 'Edit' : 'Add' }} category</h2>
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
            <input
              v-model="form.name"
              class="input-field"
              placeholder="Category name"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea
              v-model="form.description"
              class="input-field min-h-[80px]"
              placeholder="Brief description"
            />
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button class="btn-secondary" @click="showForm = false">Cancel</button>
          <button class="btn-primary" @click="save">
            Save
          </button>
        </div>
      </div>
    </div>

    <Modal :show="Boolean(pendingDeleteId)" size="sm" @close="pendingDeleteId = ''">
      <template #header>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Delete category?</h2>
      </template>
      <template #body>
        <p class="text-sm text-gray-600 dark:text-gray-300">
          This student category will be permanently removed.
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn-secondary" @click="pendingDeleteId = ''">Cancel</button>
          <button class="btn-danger" @click="confirmRemove">Delete</button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { StudentCategories } from '~/api/students/academic-services';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useToast } from '~/composables/useToast';
import { extractList, apiErrorMessage } from '~/utils/list-response';
import Modal from '~/components/ui/Modal.vue';

const { showToast } = useToast();
const { selectedBranchId, branchScopeParams: scopeParams } = useGlobalBranch();
const items = ref<any[]>([]);
const showForm = ref(false);
const editingId = ref('');
const loading = ref(false);
const errorMessage = ref('');
const pendingDeleteId = ref('');
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
    if (editingId.value)
      await StudentCategories.update(editingId.value, { ...form.value, ...scopeParams.value });
    else await StudentCategories.create({ ...form.value, ...scopeParams.value });
    showForm.value = false;
    await load();
    showToast('Saved', 'success');
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  }
};

const requestRemove = (id: string) => {
  pendingDeleteId.value = id;
};

const confirmRemove = async () => {
  if (!pendingDeleteId.value) return;
  const id = pendingDeleteId.value;
  pendingDeleteId.value = '';
  try {
    await StudentCategories.remove(id);
    await load();
    showToast('Deleted', 'success');
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  }
};

onMounted(async () => {
  await load();
});

watch(selectedBranchId, async () => {
  await load();
});
</script>
