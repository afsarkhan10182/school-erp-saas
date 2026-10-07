<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Item Issues</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage items issued to students and staff
        </p>
      </div>
      <div>
        <button
          @click="openCreateModal"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-150"
        >
          <Plus class="w-4 h-4" />
          Issue Item
        </button>
      </div>
    </div>

    <!-- Issues List -->
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50/80 dark:bg-gray-900/40">
            <tr>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Item
              </th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Issued To
              </th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Dates
              </th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th class="px-5 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="issue in issues"
              :key="issue.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
            >
              <td class="px-5 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {{ issue.item?.name || 'Unknown Item' }}
                <span class="text-xs text-gray-500 block">Qty: {{ issue.quantity }}</span>
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                <span class="capitalize font-medium">{{ issue.issued_to_type }}</span>
                <span class="text-xs text-gray-500 block">{{ issue.issued_to_id }}</span>
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                <div>Issued: {{ formatDate(issue.issue_date) }}</div>
                <div v-if="issue.return_date" class="text-xs text-gray-500">Return: {{ formatDate(issue.return_date) }}</div>
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                    issue.status === 'returned'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                  ]"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="issue.status === 'returned' ? 'bg-emerald-500' : 'bg-amber-500'"
                  ></span>
                  <span class="capitalize">{{ issue.status }}</span>
                </span>
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap text-right text-sm font-medium">
                <button
                  @click="editIssue(issue)"
                  class="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3 hover:underline"
                >
                  Edit
                </button>
                <button
                  @click="deleteIssue(issue.id)"
                  class="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
            <tr v-if="issues.length === 0 && !loading">
              <td colspan="5" class="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                No issued items found. Create one to get started.
              </td>
            </tr>
            <tr v-if="loading">
              <td colspan="5" class="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Loading...
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-if="pagination.total > 0"
        :pagination="pagination"
        item-label="issues"
        @page-changed="goToPage"
        @page-size-changed="changeLimit"
      />
    </div>

    <!-- Create/Edit Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 w-full max-w-md shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <h3 class="text-lg font-bold text-gray-900 dark:text-white">
          {{ isEditing ? 'Edit Issue' : 'Issue Item' }}
        </h3>

        <form @submit.prevent="saveIssue" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >Item <span class="text-rose-500">*</span></label
            >
            <EnhancedDropdown
              v-model="form.item_id"
              :options="itemOptions"
              label="Item"
              placeholder="Select an item"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >User Type <span class="text-rose-500">*</span></label
              >
              <EnhancedDropdown
                v-model="form.issued_to_type"
                :options="issuedToTypeOptions"
                label="User Type"
                placeholder="Select user type"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >User ID (UUID) <span class="text-rose-500">*</span></label
              >
              <input
                v-model="form.issued_to_id"
                type="text"
                required
                class="input-field w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                placeholder="Paste the user's UUID"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >Quantity</label
              >
              <input
                v-model="form.quantity"
                type="number"
                min="1"
                required
                class="input-field w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >Status <span class="text-rose-500">*</span></label
              >
              <EnhancedDropdown
                v-model="form.status"
                :options="issueStatusOptions"
                label="Status"
                placeholder="Select status"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >Issue Date</label
              >
              <input
                v-model="form.issue_date"
                type="date"
                required
                class="input-field w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >Return Date</label
              >
              <input
                v-model="form.return_date"
                type="date"
                class="input-field w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >Note</label
            >
            <textarea
              v-model="form.note"
              rows="2"
              class="input-field w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
              placeholder="Any additional notes"
            ></textarea>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {{ isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    <ConfirmDialog :open="deleteDialog.open" title="Delete issue" message="Are you sure you want to delete this record?" confirm-label="Delete" @confirm="confirmDeleteIssue" @cancel="deleteDialog.open = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { InventoryIssues, InventoryItems } from '~/api/inventory';
import { Plus } from 'lucide-vue-next';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useToast } from '~/composables/useToast';
import { extractList, apiErrorMessage } from '~/utils/list-response';
import Pagination from '~/components/ui/Pagination.vue';
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';

const { selectedBranchId } = useGlobalBranch();
const { showError, showSuccess } = useToast();

const issues = ref<any[]>([]);
const items = ref<any[]>([]);
const loading = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const isSubmitting = ref(false);
const deleteDialog = reactive({ open: false, id: '' });
const editingId = ref<string | null>(null);

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
});

const form = reactive({
  item_id: '',
  issued_to_type: 'student',
  issued_to_id: '',
  issue_date: new Date().toISOString().split('T')[0],
  return_date: '',
  status: 'issued',
  quantity: 1,
  note: ''
});
const itemOptions = computed(() =>
  items.value.map(item => ({
    value: item.id,
    label: `${item.name} (Available: ${item.available_quantity})`
  }))
);
const issuedToTypeOptions = [
  { value: 'student', label: 'Student' },
  { value: 'user', label: 'Staff/User' }
];
const issueStatusOptions = [
  { value: 'issued', label: 'Issued' },
  { value: 'returned', label: 'Returned' }
];

const resetForm = () => {
  form.item_id = '';
  form.issued_to_type = 'student';
  form.issued_to_id = '';
  form.issue_date = new Date().toISOString().split('T')[0];
  form.return_date = '';
  form.status = 'issued';
  form.quantity = 1;
  form.note = '';
};

const goToPage = async (page: number) => {
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  if (page >= 1 && page <= totalPages) {
    pagination.page = page;
    await loadData();
  }
};

const changeLimit = async (newLimit: number) => {
  pagination.limit = newLimit;
  pagination.page = 1;
  await loadData();
};

const loadItems = async () => {
  if (!selectedBranchId.value) return;
  try {
    const res = await InventoryItems.getAll({ branch_id: selectedBranchId.value, limit: 1000 });
    items.value = extractList(res);
  } catch (e) {
    console.error('Failed to load items', e);
  }
};

const loadData = async () => {
  if (!selectedBranchId.value) return;
  loading.value = true;
  try {
    const response = await InventoryIssues.getAll({
      branch_id: selectedBranchId.value,
      page: pagination.page,
      limit: pagination.limit,
      include: 'item'
    });

    issues.value = extractList(response);

    if (response?.pagination?.total !== undefined) {
      pagination.total = response.pagination.total;
    } else if (response?.total !== undefined) {
      pagination.total = response.total;
    } else {
      pagination.total = issues.value.length;
    }
  } catch (error: any) {
    showError(apiErrorMessage(error, 'Failed to fetch issues'));
  } finally {
    loading.value = false;
  }
};

const openCreateModal = () => {
  resetForm();
  isEditing.value = false;
  editingId.value = null;
  showModal.value = true;
};

const editIssue = (item: any) => {
  isEditing.value = true;
  editingId.value = item.id;
  form.item_id = item.item_id || '';
  form.issued_to_type = item.issued_to_type || 'student';
  form.issued_to_id = item.issued_to_id || '';
  form.issue_date = item.issue_date ? new Date(item.issue_date).toISOString().split('T')[0] : '';
  form.return_date = item.return_date ? new Date(item.return_date).toISOString().split('T')[0] : '';
  form.status = item.status || 'issued';
  form.quantity = Number(item.quantity) || 1;
  form.note = item.note || '';
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  resetForm();
  editingId.value = null;
  isEditing.value = false;
};

const saveIssue = async () => {
  if (!selectedBranchId.value) {
    showError('No branch selected');
    return;
  }
  if (!form.item_id) {
    showError('Please select an item');
    return;
  }
  if (!form.issued_to_id) {
    showError('Recipient ID is required');
    return;
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(form.issued_to_id)) {
    showError('Enter a valid user UUID');
    return;
  }

  isSubmitting.value = true;
  try {
    const payload = {
      ...form,
      quantity: Number(form.quantity) || 1,
      branch_id: selectedBranchId.value,
      return_date: form.return_date || null
    };

    if (isEditing.value && editingId.value) {
      await InventoryIssues.update(editingId.value, payload);
      showSuccess('Issue updated successfully');
    } else {
      await InventoryIssues.create(payload);
      showSuccess('Item issued successfully');
    }

    closeModal();
    await loadData();
    await loadItems();
  } catch (error: any) {
    showError(apiErrorMessage(error, 'Error saving issue'));
  } finally {
    isSubmitting.value = false;
  }
};

const deleteIssue = async (id: string) => {
  deleteDialog.id = id;
  deleteDialog.open = true;
};

const confirmDeleteIssue = async () => {
  try {
    await InventoryIssues.delete(deleteDialog.id);
    showSuccess('Record deleted successfully');
    await loadData();
    await loadItems();
  } catch (error: any) {
    showError('Error deleting record');
  } finally {
    deleteDialog.open = false;
    deleteDialog.id = '';
  }
};

onMounted(() => {
  loadItems();
  loadData();
});

watch(selectedBranchId, () => {
  pagination.page = 1;
  loadItems();
  loadData();
});
</script>
