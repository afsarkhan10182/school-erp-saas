<script setup lang="ts">
import { reactive, ref, watch, onMounted, computed } from 'vue';
import { AccountingCategories, AccountingTransactions } from '~/api/accounting';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useToast } from '~/composables/useToast';
import { apiErrorMessage, extractList } from '~/utils/list-response';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue';
import Pagination from '~/components/ui/Pagination.vue';
import { useExportService } from '~/composables/useExportService';
import { usePrintReport } from '~/composables/usePrintReport';

const props = defineProps<{ type: 'income' | 'expense' }>();
const { selectedBranchId, currentBranch, currentSchool, isSuperAdmin } = useGlobalBranch();
const { showToast } = useToast();
const items = ref<any[]>([]);
const categories = ref<any[]>([]);
const loading = ref(false);
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 });
const search = ref('');
const categoryFilter = ref('');
const sortBy = ref<'name' | 'category' | 'amount' | 'date'>('date');
const sortOrder = ref<'ASC' | 'DESC'>('DESC');
const saving = ref(false);
const showForm = ref(false);
const editingId = ref<string | null>(null);
const pendingDeleteId = ref<string | null>(null);
const viewMode = ref<'list' | 'grid'>('list');
const form = reactive({ category_id: '', name: '', amount: '', date: new Date().toISOString().slice(0, 10), reference_number: '', payment_method: '', description: '' });
const title = computed(() => props.type === 'income' ? 'Income Transactions' : 'Expense Transactions');
const categoryOptions = computed(() => categories.value.filter(c => c.type === props.type).map(c => ({ label: c.name, value: c.id })));
const missingPlatformSchool = computed(() => isSuperAdmin.value && !currentSchool.value?.id);
const allBranchesReadOnly = computed(() => !selectedBranchId.value || missingPlatformSchool.value);
let loadRequestId = 0;
const { generateReport, isGenerating } = useExportService();
const { printReport, openPrintWindow } = usePrintReport();
const reportColumns = [
  { key: 'date', header: 'Date' }, { key: 'type', header: 'Type' },
  { key: 'name', header: 'Name' }, { key: 'category', header: 'Category' },
  { key: 'amount', header: 'Amount' }, { key: 'reference_number', header: 'Reference' },
  { key: 'payment_method', header: 'Payment Method' }, { key: 'description', header: 'Description' },
  { key: 'branch', header: 'Branch' }
];
const exportFormats = ['csv', 'excel', 'pdf'] as const;

const load = async () => {
  const requestId = ++loadRequestId;
  if (missingPlatformSchool.value) {
    items.value = [];
    categories.value = [];
    pagination.value = { page: 1, limit: pagination.value.limit, total: 0, totalPages: 0 };
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const [transactions, categoryResponse] = await Promise.all([
      AccountingTransactions.getAll({
        school_id: currentSchool.value?.id || undefined,
        branch_id: selectedBranchId.value || undefined,
        type: props.type,
        page: pagination.value.page,
        limit: pagination.value.limit,
        search: search.value.trim() || undefined,
        category_id: categoryFilter.value || undefined,
        sort_by: sortBy.value,
        sort_order: sortOrder.value
      }),
      AccountingCategories.getAll({ school_id: currentSchool.value?.id || undefined, branch_id: selectedBranchId.value || undefined, limit: 100, type: props.type })
    ]);
    if (requestId !== loadRequestId) return;
    items.value = extractList(transactions);
    categories.value = extractList(categoryResponse);
    pagination.value = { ...pagination.value, ...(transactions.pagination || {}) };
  } catch (error: any) {
    if (requestId === loadRequestId) showToast(apiErrorMessage(error), 'error');
  } finally {
    if (requestId === loadRequestId) loading.value = false;
  }
};
const applyFilters = () => { pagination.value.page = 1; load(); };
const changePage = (page: number) => { pagination.value.page = page; load(); };
const changePageSize = (limit: number) => { pagination.value.limit = limit; pagination.value.page = 1; load(); };
const toggleSort = (field: typeof sortBy.value) => {
  sortOrder.value = sortBy.value === field && sortOrder.value === 'ASC' ? 'DESC' : 'ASC';
  sortBy.value = field;
  pagination.value.page = 1;
  load();
};
const reportFilters = () => ({
  school_id: isSuperAdmin.value ? currentSchool.value?.id : undefined,
  branch_id: selectedBranchId.value || undefined,
  transaction_type: props.type,
  category_id: categoryFilter.value || undefined,
  search: search.value.trim() || undefined,
  sort_by: sortBy.value,
  sort_order: sortOrder.value
});
const exportTransactions = async (format: 'csv' | 'excel' | 'pdf') => {
  try {
    await generateReport({ report_type: 'transactions', format, filters: reportFilters(), columns: reportColumns });
  } catch (error) {
    console.error('Failed to export accounting transactions:', error);
  }
};
const printTransactions = async () => {
  const printWindow = openPrintWindow();
  if (!printWindow) {
    showToast('Please allow popups to print transactions', 'error');
    return;
  }
  try {
    await printReport({
      title: title.value,
      reportType: 'transactions',
      data: items.value.map(item => ({
        date: item.date, type: item.type, name: item.name,
        category: item.category?.name || '', amount: item.amount,
        reference_number: item.reference_number || '', payment_method: item.payment_method || '',
        description: item.description || '', branch: item.branch?.name || ''
      })),
      columns: reportColumns,
      filters: { Search: search.value || 'All transactions', Page: `${pagination.value.page} (current page)` }
    }, { autoPrint: true, printWindow });
  } catch {
    printWindow.close();
    showToast('Unable to prepare transaction printout', 'error');
  }
};
const reset = () => Object.assign(form, { category_id: '', name: '', amount: '', date: new Date().toISOString().slice(0, 10), reference_number: '', payment_method: '', description: '' });
const openCreate = () => { if (allBranchesReadOnly.value) return; editingId.value = null; reset(); showForm.value = true; };
const openEdit = (item: any) => { if (allBranchesReadOnly.value) return; editingId.value = item.id; Object.assign(form, { category_id: item.category_id || '', name: item.name || '', amount: item.amount || '', date: item.date || '', reference_number: item.reference_number || '', payment_method: item.payment_method || '', description: item.description || '' }); showForm.value = true; };
const save = async () => {
  if (!selectedBranchId.value || !form.category_id || !form.name.trim() || !form.amount) return;
  saving.value = true;
  try {
    const payload = { ...form, name: form.name.trim(), amount: Number(form.amount), school_id: currentSchool.value?.id || undefined, branch_id: selectedBranchId.value };
    if (editingId.value) await AccountingTransactions.update(editingId.value, payload); else await AccountingTransactions.create(payload);
    showForm.value = false; await load(); showToast(editingId.value ? 'Transaction updated' : 'Transaction created', 'success');
  } catch (error: any) { showToast(apiErrorMessage(error), 'error'); }
  finally { saving.value = false; }
};
const remove = (id: string) => { if (!allBranchesReadOnly.value) pendingDeleteId.value = id; };
const confirmRemove = async () => {
  if (!pendingDeleteId.value || allBranchesReadOnly.value) return;
  try { await AccountingTransactions.delete(pendingDeleteId.value); await load(); showToast('Transaction deleted', 'success'); }
  catch (error: any) { showToast(apiErrorMessage(error), 'error'); }
  finally { pendingDeleteId.value = null; }
};
watch([selectedBranchId, () => currentSchool.value?.id], () => {
  showForm.value = false;
  editingId.value = null;
  pendingDeleteId.value = null;
  items.value = [];
  categories.value = [];
  categoryFilter.value = '';
  pagination.value.page = 1;
  pagination.value.total = 0;
  pagination.value.totalPages = 0;
  load();
});
watch(() => props.type, () => { categoryFilter.value = ''; pagination.value.page = 1; load(); });
onMounted(load);
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ title }}</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Track branch {{ type }} transactions · {{ missingPlatformSchool ? 'Select a school' : selectedBranchId ? currentBranch?.name || 'Selected branch' : 'All branches' }}.</p>
      </div>
      <button class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50" :disabled="allBranchesReadOnly" @click="openCreate">Add {{ type }}</button>
    </div>
    <p v-if="allBranchesReadOnly" role="status" class="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
      {{ missingPlatformSchool ? 'Select a school to view its accounting transactions.' : `All Branches is read-only. Select a specific branch in the global selector to add, edit, or delete ${type} transactions.` }}
    </p>
    <form class="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800" @submit.prevent="applyFilters">
      <label class="min-w-56 flex-1 text-sm text-gray-700 dark:text-gray-300">
        Search name or reference
        <input v-model.trim="search" class="input-field mt-1" type="search" placeholder="Search transactions" />
      </label>
      <label class="min-w-48 text-sm text-gray-700 dark:text-gray-300">
        Category
        <select v-model="categoryFilter" class="input-field mt-1">
          <option value="">All categories</option>
          <option v-for="category in categoryOptions" :key="category.value" :value="category.value">{{ category.label }}</option>
        </select>
      </label>
      <button type="submit" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">Filter</button>
    </form>
    <div v-if="loading" class="text-sm text-gray-500">Loading...</div>
    <div v-else class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 p-3 dark:border-gray-700">
        <div class="flex gap-2" aria-label="Transaction view">
          <button type="button" :aria-pressed="viewMode === 'list'" class="rounded border px-3 py-2 text-sm" @click="viewMode = 'list'">List view</button>
          <button type="button" :aria-pressed="viewMode === 'grid'" class="rounded border px-3 py-2 text-sm" @click="viewMode = 'grid'">Grid view</button>
        </div>
        <div class="flex flex-wrap gap-2">
          <button v-for="format in exportFormats" :key="format" type="button" class="rounded border px-3 py-2 text-sm disabled:opacity-50" :disabled="isGenerating || !pagination.total" @click="exportTransactions(format)">{{ isGenerating ? 'Exporting…' : format.toUpperCase() }}</button>
          <button type="button" class="rounded border px-3 py-2 text-sm disabled:opacity-50" :disabled="!items.length" @click="printTransactions">Print</button>
        </div>
      </div>
      <div v-if="viewMode === 'list'" class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead><tr class="text-left text-xs uppercase text-gray-500"><th class="p-4"><button @click="toggleSort('name')">Name {{ sortBy === 'name' ? sortOrder === 'ASC' ? '↑' : '↓' : '↕' }}</button></th><th class="p-4"><button @click="toggleSort('category')">Category {{ sortBy === 'category' ? sortOrder === 'ASC' ? '↑' : '↓' : '↕' }}</button></th><th v-if="allBranchesReadOnly" class="p-4">Branch</th><th class="p-4 text-right"><button @click="toggleSort('amount')">Amount {{ sortBy === 'amount' ? sortOrder === 'ASC' ? '↑' : '↓' : '↕' }}</button></th><th class="p-4"><button @click="toggleSort('date')">Date {{ sortBy === 'date' ? sortOrder === 'ASC' ? '↑' : '↓' : '↕' }}</button></th><th class="p-4 text-right">Actions</th></tr></thead>
          <tbody>
            <tr v-for="item in items" :key="item.id" class="border-t border-gray-100 dark:border-gray-700">
              <td class="p-4 font-medium">{{ item.name }}</td><td class="p-4">{{ item.category?.name || '-' }}</td>
              <td v-if="allBranchesReadOnly" class="p-4">{{ item.branch?.name || '-' }}</td><td class="p-4">{{ item.amount }}</td><td class="p-4">{{ item.date }}</td>
              <td class="p-4 text-right"><template v-if="!allBranchesReadOnly"><button class="mr-3 text-indigo-600" @click="openEdit(item)">Edit</button><button class="text-rose-600" @click="remove(item.id)">Delete</button></template><span v-else class="text-xs text-gray-500">Select a branch to manage</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
        <article v-for="item in items" :key="item.id" class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div class="flex justify-between gap-3"><h2 class="font-semibold text-gray-900 dark:text-white">{{ item.name }}</h2><span class="font-semibold">{{ item.amount }}</span></div>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">{{ item.category?.name || 'Uncategorized' }}<span v-if="allBranchesReadOnly"> · {{ item.branch?.name || 'Unknown branch' }}</span></p>
          <p class="mt-1 text-xs text-gray-500">{{ item.date }}</p>
          <div class="mt-3 text-right"><template v-if="!allBranchesReadOnly"><button class="mr-3 text-indigo-600" @click="openEdit(item)">Edit</button><button class="text-rose-600" @click="remove(item.id)">Delete</button></template><span v-else class="text-xs text-gray-500">Select a branch to manage</span></div>
        </article>
      </div>
      <p v-if="!items.length" class="p-8 text-center text-sm text-gray-500">No {{ type }} transactions found.</p>
      <Pagination v-if="pagination.total" :pagination="pagination" :item-label="type + ' transactions'" @page-changed="changePage" @page-size-changed="changePageSize" />
    </div>
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form class="w-full max-w-lg space-y-4 rounded-xl bg-white p-6 dark:bg-gray-800" @submit.prevent="save"><h2 class="text-lg font-semibold">{{ editingId ? 'Edit' : 'Add' }} {{ type }}</h2><EnhancedDropdown v-model="form.category_id" :options="categoryOptions" label="Category" placeholder="Select category" required /><input v-model="form.name" required class="input-field w-full" placeholder="Transaction name" /><div class="grid grid-cols-2 gap-3"><input v-model="form.amount" required type="number" min="0" step="0.01" class="input-field w-full" placeholder="Amount" /><input v-model="form.date" required type="date" class="input-field w-full" /></div><input v-model="form.reference_number" class="input-field w-full" placeholder="Reference number (optional)" /><input v-model="form.payment_method" class="input-field w-full" placeholder="Payment method (optional)" /><textarea v-model="form.description" rows="3" class="input-field w-full" placeholder="Description (optional)"></textarea><div class="flex justify-end gap-3"><button type="button" class="px-4 py-2" @click="showForm = false">Cancel</button><button class="rounded-lg bg-indigo-600 px-4 py-2 text-white" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button></div></form></div>
    <ConfirmDialog :show="Boolean(pendingDeleteId)" title="Delete transaction" message="This transaction will be permanently deleted." confirm-label="Delete" @close="pendingDeleteId = null" @confirm="confirmRemove" />
  </div>
</template>
