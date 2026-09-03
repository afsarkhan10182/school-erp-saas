<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Homework</h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Assign class work within the selected branch.</p>
        </div>
        <button class="px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700" @click="openCreate">
          Add homework
        </button>
      </div>

      <section class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <EnhancedDropdown
            v-if="branchOptions.length > 1"
            v-model="selectedBranchId"
            :options="branchOptions"
            label="Branch"
            placeholder="Select branch"
            @change="onBranchChange"
          />
          <EnhancedDropdown
            v-model="filterClassId"
            :options="classOptions"
            label="Class"
            placeholder="All classes"
            @change="load"
          />
        </div>
      </section>

      <div v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ errorMessage }}
        <button class="ml-3 underline" @click="load">Retry</button>
      </div>

      <section class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg overflow-x-auto">
        <div v-if="loading" class="p-6 text-sm text-gray-500 dark:text-gray-400">Loading homework...</div>
        <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700/60">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Title</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Class</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Due</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="item in items" :key="item.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/40">
              <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{{ item.title }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ item.class?.name || '-' }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ item.due_date }}</td>
              <td class="px-4 py-3 text-sm text-right">
                <button class="text-sm font-medium text-indigo-600 hover:text-indigo-700 mr-3" @click="openEdit(item)">Edit</button>
                <button class="text-sm font-medium text-red-600 hover:text-red-700" @click="remove(item.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!loading && !items.length && !errorMessage" class="p-6 text-sm text-gray-500 dark:text-gray-400">No homework for this scope.</p>
      </section>

      <div v-if="showForm" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 w-full max-w-lg shadow-xl">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">{{ editingId ? 'Edit homework' : 'Add homework' }}</h2>
          <input v-model.trim="form.title" class="input" placeholder="Title" />
          <textarea v-model.trim="form.description" class="input min-h-24" placeholder="Description" />
          <EnhancedDropdown v-model="form.class_id" :options="classOptions" label="Class" placeholder="Select class" class="mb-3" />
          <input v-model="form.due_date" type="date" class="input" />
          <div class="flex justify-end gap-2 mt-4">
            <button class="px-3 py-2 text-sm text-gray-700 dark:text-gray-200" @click="showForm = false">Cancel</button>
            <button class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg disabled:opacity-50" :disabled="saving" @click="save">
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { Branches } from '~/api/administration/branches';
import { Homeworks } from '~/api/students/academic-services';
import { useAcademics } from '~/composables/useAcademics';
import { useAuth } from '~/composables/useAuth';
import { useToast } from '~/composables/useToast';
import { extractList, apiErrorMessage } from '~/utils/list-response';

const { showToast } = useToast();
const { user } = useAuth();
const { classOptions, fetchClasses } = useAcademics();
const items = ref<any[]>([]);
const branchOptions = ref<any[]>([]);
const selectedBranchId = ref('');
const filterClassId = ref('');
const showForm = ref(false);
const loading = ref(false);
const saving = ref(false);
const errorMessage = ref('');
const editingId = ref('');
const form = ref({ title: '', description: '', class_id: '', due_date: '' });

const branchParams = () => selectedBranchId.value ? { branch_id: selectedBranchId.value } : {};

const loadBranches = async () => {
  const response: any = await Branches.getForDropdown({ status: 'active' });
  const branches = extractList(response, ['branches']);
  branchOptions.value = branches.map((b: any) => ({ value: b.id, label: b.name || b.code || b.id }));
  selectedBranchId.value = user.value?.branch_id || (branchOptions.value.length === 1 ? branchOptions.value[0].value : '');
};

const loadClasses = async () => {
  await fetchClasses({ branchId: selectedBranchId.value || user.value?.branch_id });
};

const load = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response: any = await Homeworks.getAll({ ...branchParams(), ...(filterClassId.value ? { class_id: filterClassId.value } : {}) });
    items.value = extractList(response, ['homeworks']);
  } catch (error: any) {
    errorMessage.value = apiErrorMessage(error);
  } finally {
    loading.value = false;
  }
};

const onBranchChange = async () => {
  filterClassId.value = '';
  await loadClasses();
  await load();
};

const openCreate = () => {
  editingId.value = '';
  form.value = { title: '', description: '', class_id: '', due_date: '' };
  showForm.value = true;
};

const openEdit = (item: any) => {
  editingId.value = item.id;
  form.value = {
    title: item.title || '',
    description: item.description || '',
    class_id: item.class_id || '',
    due_date: item.due_date || ''
  };
  showForm.value = true;
};

const save = async () => {
  saving.value = true;
  try {
    const payload = { ...form.value, ...branchParams() };
    if (editingId.value) await Homeworks.update(editingId.value, payload);
    else await Homeworks.create(payload);
    showForm.value = false;
    await load();
    showToast('Homework saved', 'success');
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  } finally {
    saving.value = false;
  }
};

const remove = async (id: string) => {
  if (!window.confirm('Delete this homework?')) return;
  try {
    await Homeworks.remove(id);
    await load();
    showToast('Deleted', 'success');
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  }
};

onMounted(async () => {
  await loadBranches();
  await loadClasses();
  await load();
});
</script>

<style scoped>
.input {
  @apply w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 mb-3 text-sm dark:bg-gray-900 dark:text-white;
}
</style>
