<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Inventory Items</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage inventory items for your branch
        </p>
      </div>
      <div>
        <button
          @click="openCreateModal"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-150"
        >
          <Plus class="w-4 h-4" />
          Add Item
        </button>
      </div>
    </div>

    <!-- Items List -->
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50/80 dark:bg-gray-900/40">
            <tr>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Category
              </th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Quantity
              </th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Price
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
              v-for="item in items"
              :key="item.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
            >
              <td class="px-5 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {{ item.name }}
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                {{ item.category?.name || 'Unknown Category' }}
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                <div class="font-medium text-gray-900 dark:text-white">{{ item.available_quantity }} Available</div>
                <div class="text-xs text-gray-500">Total: {{ item.total_quantity }}</div>
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                ${{ item.unit_price }}
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                    item.is_active
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                  ]"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="item.is_active ? 'bg-emerald-500' : 'bg-rose-500'"
                  ></span>
                  {{ item.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap text-right text-sm font-medium">
                <button
                  @click="editItem(item)"
                  class="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3 hover:underline"
                >
                  Edit
                </button>
                <button
                  @click="deleteItem(item.id)"
                  class="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
            <tr v-if="items.length === 0 && !loading">
              <td colspan="6" class="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                No items found. Create one to get started.
              </td>
            </tr>
            <tr v-if="loading">
              <td colspan="6" class="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Loading...
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-if="pagination.total > 0"
        :pagination="pagination"
        item-label="items"
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
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 w-full max-w-md shadow-xl space-y-4"
      >
        <h3 class="text-lg font-bold text-gray-900 dark:text-white">
          {{ isEditing ? 'Edit Item' : 'Create New Item' }}
        </h3>

        <form @submit.prevent="saveItem" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >Item Name <span class="text-rose-500">*</span></label
            >
            <input
              v-model="form.name"
              type="text"
              required
              class="input-field w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
              placeholder="e.g., Whiteboard Marker"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >Category <span class="text-rose-500">*</span></label
            >
            <select
              v-model="form.category_id"
              required
              class="input-field w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="" disabled>Select a category</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >Total Quantity</label
              >
              <input
                v-model="form.total_quantity"
                type="number"
                min="0"
                class="input-field w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >Available Quantity</label
              >
              <input
                v-model="form.available_quantity"
                type="number"
                min="0"
                class="input-field w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >Unit Price</label
            >
            <div class="relative rounded-md shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                v-model="form.unit_price"
                type="number"
                step="0.01"
                min="0"
                class="input-field w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >Description</label
            >
            <textarea
              v-model="form.description"
              rows="2"
              class="input-field w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
              placeholder="Description"
            ></textarea>
          </div>

          <div class="space-y-2 pt-1">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="form.is_active"
                type="checkbox"
                class="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
              />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
            </label>
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
    <ConfirmDialog
      :open="deleteDialog.open"
      title="Delete item"
      message="Are you sure you want to delete this item?"
      confirm-label="Delete"
      @confirm="confirmDeleteItem"
      @cancel="deleteDialog.open = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { InventoryItems, InventoryCategories } from '~/api/inventory';
import { Plus } from 'lucide-vue-next';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useToast } from '~/composables/useToast';
import { extractList, apiErrorMessage } from '~/utils/list-response';
import Pagination from '~/components/ui/Pagination.vue';
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue';

const { selectedBranchId } = useGlobalBranch();
const { showError, showSuccess } = useToast();

const items = ref<any[]>([]);
const categories = ref<any[]>([]);
const loading = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const isSubmitting = ref(false);
const editingId = ref<string | null>(null);
const deleteDialog = reactive({ open: false, id: '' });

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
});

const form = reactive({
  category_id: '',
  name: '',
  description: '',
  total_quantity: 0,
  available_quantity: 0,
  unit_price: 0,
  is_active: true
});

const resetForm = () => {
  form.category_id = '';
  form.name = '';
  form.description = '';
  form.total_quantity = 0;
  form.available_quantity = 0;
  form.unit_price = 0;
  form.is_active = true;
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

const loadCategories = async () => {
  if (!selectedBranchId.value) return;
  try {
    const res = await InventoryCategories.getAll({ branch_id: selectedBranchId.value, limit: 1000 });
    categories.value = extractList(res);
  } catch (e) {
    console.error('Failed to load categories', e);
  }
};

const loadData = async () => {
  if (!selectedBranchId.value) return;
  loading.value = true;
  try {
    const response = await InventoryItems.getAll({
      branch_id: selectedBranchId.value,
      page: pagination.page,
      limit: pagination.limit,
      include: 'category'
    });

    items.value = extractList(response);

    if (response?.pagination?.total !== undefined) {
      pagination.total = response.pagination.total;
    } else if (response?.total !== undefined) {
      pagination.total = response.total;
    } else {
      pagination.total = items.value.length;
    }
  } catch (error: any) {
    showError(apiErrorMessage(error, 'Failed to fetch items'));
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

const editItem = (item: any) => {
  isEditing.value = true;
  editingId.value = item.id;
  form.category_id = item.category_id || '';
  form.name = item.name || '';
  form.description = item.description || '';
  form.total_quantity = Number(item.total_quantity) || 0;
  form.available_quantity = Number(item.available_quantity) || 0;
  form.unit_price = Number(item.unit_price) || 0;
  form.is_active = item.is_active !== undefined ? item.is_active : true;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  resetForm();
  editingId.value = null;
  isEditing.value = false;
};

const saveItem = async () => {
  if (!selectedBranchId.value) {
    showError('No branch selected');
    return;
  }
  if (!form.name?.trim()) {
    showError('Item name is required');
    return;
  }
  if (!form.category_id) {
    showError('Please select a category');
    return;
  }

  isSubmitting.value = true;
  try {
    const payload = {
      name: form.name.trim(),
      category_id: form.category_id,
      description: form.description,
      total_quantity: Number(form.total_quantity) || 0,
      available_quantity: Number(form.available_quantity) || 0,
      unit_price: Number(form.unit_price) || 0,
      is_active: form.is_active,
      branch_id: selectedBranchId.value
    };

    if (isEditing.value && editingId.value) {
      await InventoryItems.update(editingId.value, payload);
      showSuccess('Item updated successfully');
    } else {
      await InventoryItems.create(payload);
      showSuccess('Item created successfully');
    }

    closeModal();
    await loadData();
  } catch (error: any) {
    showError(apiErrorMessage(error, 'Error saving item'));
  } finally {
    isSubmitting.value = false;
  }
};

const deleteItem = async (id: string) => {
  deleteDialog.id = id;
  deleteDialog.open = true;
};

const confirmDeleteItem = async () => {
  try {
    await InventoryItems.delete(deleteDialog.id);
    showSuccess('Item deleted successfully');
    await loadData();
  } catch (error: any) {
    showError(apiErrorMessage(error, 'Error deleting item'));
  } finally {
    deleteDialog.open = false;
    deleteDialog.id = '';
  }
};

onMounted(() => {
  loadCategories();
  loadData();
});

watch(selectedBranchId, () => {
  pagination.page = 1;
  loadCategories();
  loadData();
});
</script>
