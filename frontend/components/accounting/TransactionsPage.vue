<script setup lang="ts">
import { reactive, ref, watch, onMounted, computed } from 'vue';
import { AccountingCategories, AccountingTransactions } from '~/api/accounting';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useToast } from '~/composables/useToast';
import { apiErrorMessage, extractList } from '~/utils/list-response';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue';

const props = defineProps<{ type: 'income' | 'expense' }>();
const { selectedBranchId } = useGlobalBranch();
const { showToast } = useToast();
const items = ref<any[]>([]);
const categories = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const showForm = ref(false);
const editingId = ref<string | null>(null);
const pendingDeleteId = ref<string | null>(null);
const form = reactive({ category_id: '', name: '', amount: '', date: new Date().toISOString().slice(0, 10), reference_number: '', payment_method: '', description: '' });
const title = computed(() => props.type === 'income' ? 'Income Transactions' : 'Expense Transactions');
const categoryOptions = computed(() => categories.value.filter(c => c.type === props.type).map(c => ({ label: c.name, value: c.id })));

const load = async () => {
  if (!selectedBranchId.value) return;
  loading.value = true;
  try {
    const [transactions, categoryResponse] = await Promise.all([
      AccountingTransactions.getAll({ branch_id: selectedBranchId.value, type: props.type, limit: 100 }),
      AccountingCategories.getAll({ branch_id: selectedBranchId.value, limit: 100, type: props.type })
    ]);
    items.value = extractList(transactions);
    categories.value = extractList(categoryResponse);
  } catch (error: any) { showToast(apiErrorMessage(error), 'error'); }
  finally { loading.value = false; }
};
const reset = () => Object.assign(form, { category_id: '', name: '', amount: '', date: new Date().toISOString().slice(0, 10), reference_number: '', payment_method: '', description: '' });
const openCreate = () => { editingId.value = null; reset(); showForm.value = true; };
const openEdit = (item: any) => { editingId.value = item.id; Object.assign(form, { category_id: item.category_id || '', name: item.name || '', amount: item.amount || '', date: item.date || '', reference_number: item.reference_number || '', payment_method: item.payment_method || '', description: item.description || '' }); showForm.value = true; };
const save = async () => {
  if (!selectedBranchId.value || !form.category_id || !form.name.trim() || !form.amount) return;
  saving.value = true;
  try {
    const payload = { ...form, name: form.name.trim(), amount: Number(form.amount), branch_id: selectedBranchId.value };
    if (editingId.value) await AccountingTransactions.update(editingId.value, payload); else await AccountingTransactions.create(payload);
    showForm.value = false; await load(); showToast(editingId.value ? 'Transaction updated' : 'Transaction created', 'success');
  } catch (error: any) { showToast(apiErrorMessage(error), 'error'); }
  finally { saving.value = false; }
};
const remove = (id: string) => { pendingDeleteId.value = id; };
const confirmRemove = async () => {
  if (!pendingDeleteId.value) return;
  try { await AccountingTransactions.delete(pendingDeleteId.value); await load(); showToast('Transaction deleted', 'success'); }
  catch (error: any) { showToast(apiErrorMessage(error), 'error'); }
  finally { pendingDeleteId.value = null; }
};
watch([selectedBranchId, () => props.type], load);
onMounted(load);
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between gap-4"><div><h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ title }}</h1><p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Track branch {{ type }} transactions.</p></div><button class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white" @click="openCreate">Add {{ type }}</button></div>
    <div v-if="loading" class="text-sm text-gray-500">Loading...</div>
    <div v-else class="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"><table class="min-w-full text-sm"><thead><tr class="text-left text-xs uppercase text-gray-500"><th class="p-4">Name</th><th class="p-4">Category</th><th class="p-4">Amount</th><th class="p-4">Date</th><th class="p-4 text-right">Actions</th></tr></thead><tbody><tr v-for="item in items" :key="item.id" class="border-t border-gray-100 dark:border-gray-700"><td class="p-4 font-medium">{{ item.name }}</td><td class="p-4">{{ item.category?.name || '-' }}</td><td class="p-4">{{ item.amount }}</td><td class="p-4">{{ item.date }}</td><td class="p-4 text-right"><button class="mr-3 text-indigo-600" @click="openEdit(item)">Edit</button><button class="text-rose-600" @click="remove(item.id)">Delete</button></td></tr></tbody></table><p v-if="!items.length" class="p-8 text-center text-sm text-gray-500">No {{ type }} transactions found.</p></div>
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form class="w-full max-w-lg space-y-4 rounded-xl bg-white p-6 dark:bg-gray-800" @submit.prevent="save"><h2 class="text-lg font-semibold">{{ editingId ? 'Edit' : 'Add' }} {{ type }}</h2><EnhancedDropdown v-model="form.category_id" :options="categoryOptions" label="Category" placeholder="Select category" required /><input v-model="form.name" required class="input-field w-full" placeholder="Transaction name" /><div class="grid grid-cols-2 gap-3"><input v-model="form.amount" required type="number" min="0" step="0.01" class="input-field w-full" placeholder="Amount" /><input v-model="form.date" required type="date" class="input-field w-full" /></div><input v-model="form.reference_number" class="input-field w-full" placeholder="Reference number (optional)" /><input v-model="form.payment_method" class="input-field w-full" placeholder="Payment method (optional)" /><textarea v-model="form.description" rows="3" class="input-field w-full" placeholder="Description (optional)"></textarea><div class="flex justify-end gap-3"><button type="button" class="px-4 py-2" @click="showForm = false">Cancel</button><button class="rounded-lg bg-indigo-600 px-4 py-2 text-white" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button></div></form></div>
    <ConfirmDialog :show="Boolean(pendingDeleteId)" title="Delete transaction" message="This transaction will be permanently deleted." confirm-label="Delete" @close="pendingDeleteId = null" @confirm="confirmRemove" />
  </div>
</template>
