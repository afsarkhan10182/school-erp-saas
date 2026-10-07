<script setup lang="ts">
import { reactive, ref, watch, onMounted } from 'vue';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { AccountingCategories } from '~/api/accounting';
import { apiErrorMessage, extractList } from '~/utils/list-response';
import { useToast } from '~/composables/useToast';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue';

const { selectedBranchId } = useGlobalBranch();
const { showToast } = useToast();
const data = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const showForm = ref(false);
const editingId = ref<string | null>(null);
const pendingDeleteId = ref<string | null>(null);
const form = reactive({ name: '', type: 'income', description: '', is_active: true });
const typeOptions = [{ label: 'Income', value: 'income' }, { label: 'Expense', value: 'expense' }];

const fetchData = async () => {
  if (!selectedBranchId.value) return;
  loading.value = true;
  try {
    const res = await AccountingCategories.getAll({ branch_id: selectedBranchId.value });
    data.value = extractList(res);
  } catch (error) {
    console.error('Error fetching categories:', error);
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  Object.assign(form, { name: '', type: 'income', description: '', is_active: true });
  editingId.value = null;
};

const openCreate = () => { resetForm(); showForm.value = true; };
const openEdit = (item: any) => {
  Object.assign(form, { name: item.name || '', type: item.type || 'income', description: item.description || '', is_active: item.is_active !== false });
  editingId.value = item.id;
  showForm.value = true;
};
const save = async () => {
  if (!selectedBranchId.value || !form.name.trim()) return;
  saving.value = true;
  try {
    const payload = { ...form, name: form.name.trim(), branch_id: selectedBranchId.value };
    if (editingId.value) await AccountingCategories.update(editingId.value, payload);
    else await AccountingCategories.create(payload);
    showForm.value = false;
    await fetchData();
    showToast(editingId.value ? 'Category updated' : 'Category created', 'success');
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  } finally { saving.value = false; }
};
const remove = (id: string) => { pendingDeleteId.value = id; };
const confirmRemove = async () => {
  if (!pendingDeleteId.value) return;
  try { await AccountingCategories.delete(pendingDeleteId.value); await fetchData(); showToast('Category deleted', 'success'); }
  catch (error: any) { showToast(apiErrorMessage(error), 'error'); }
  finally { pendingDeleteId.value = null; }
};

onMounted(fetchData);
watch(selectedBranchId, fetchData);
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Account Categories</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Organize income and expense transactions.</p>
      </div>
      <button class="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium" @click="openCreate">Add category</button>
    </div>
    <div v-if="loading">Loading...</div>
    <div v-else class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <table class="min-w-full text-sm"><thead><tr class="text-left text-xs uppercase text-gray-500"><th class="p-4">Name</th><th class="p-4">Type</th><th class="p-4">Status</th><th class="p-4 text-right">Actions</th></tr></thead>
        <tbody><tr v-for="item in data" :key="item.id" class="border-t border-gray-100 dark:border-gray-700"><td class="p-4 font-medium">{{ item.name }}</td><td class="p-4 capitalize">{{ item.type }}</td><td class="p-4">{{ item.is_active === false ? 'Inactive' : 'Active' }}</td><td class="p-4 text-right"><button class="mr-3 text-indigo-600" @click="openEdit(item)">Edit</button><button class="text-rose-600" @click="remove(item.id)">Delete</button></td></tr></tbody>
      </table>
      <p v-if="!data.length" class="p-8 text-center text-sm text-gray-500">No categories found for this branch.</p>
    </div>
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form class="w-full max-w-md space-y-4 rounded-xl bg-white p-6 dark:bg-gray-800" @submit.prevent="save">
        <h2 class="text-lg font-semibold">{{ editingId ? 'Edit category' : 'Add category' }}</h2>
        <input v-model="form.name" required class="input-field w-full" placeholder="Category name" />
        <EnhancedDropdown v-model="form.type" :options="typeOptions" label="Type" placeholder="Select type" />
        <textarea v-model="form.description" class="input-field w-full" rows="3" placeholder="Description"></textarea>
        <label class="flex items-center gap-2 text-sm"><input v-model="form.is_active" type="checkbox" /> Active</label>
        <div class="flex justify-end gap-3"><button type="button" class="px-4 py-2" @click="showForm = false">Cancel</button><button class="rounded-lg bg-indigo-600 px-4 py-2 text-white" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button></div>
      </form>
    </div>
    <ConfirmDialog :show="Boolean(pendingDeleteId)" title="Delete category" message="This account category will be permanently deleted." confirm-label="Delete" @close="pendingDeleteId = null" @confirm="confirmRemove" />
  </div>
</template>
