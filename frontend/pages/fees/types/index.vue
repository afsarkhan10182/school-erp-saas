<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Fee Types</h1>
        <button
          @click="openCreateModal"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          <PlusIcon class="h-4 w-4 mr-2" />
          Add Fee Type
        </button>
      </div>

      <!-- Fee Types List -->
      <div class="mt-8">
        <div v-if="isLoading" class="p-8 text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading fee types...</p>
        </div>

        <div v-else-if="feeTypes.length === 0" class="p-8 text-center">
          <BanknoteIcon class="mx-auto h-12 w-12 text-gray-400" />
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">No fee types found.</p>
        </div>

        <div v-else class="shadow overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:rounded-lg">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="feeType in feeTypes" :key="feeType.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {{ feeType.name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ feeType.description || 'No description' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ feeType.amount ? `₹${feeType.amount}` : 'Variable' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="{
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': feeType.is_active,
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': !feeType.is_active,
                    }"
                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  >
                    {{ feeType.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    @click="editFeeType(feeType)"
                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    @click="deleteFeeType(feeType.id)"
                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ isEditing ? 'Edit Fee Type' : 'Create Fee Type' }}
          </h3>
          
          <form @submit.prevent="saveFeeType">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
              <input
                v-model="form.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter fee type name"
              />
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <textarea
                v-model="form.description"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter fee type description"
              ></textarea>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount (Optional)</label>
              <input
                v-model="form.amount"
                type="number"
                step="0.01"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter default amount"
              />
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Leave empty for variable amounts</p>
            </div>

            <div class="mb-6">
              <label class="flex items-center">
                <input
                  v-model="form.is_active"
                  type="checkbox"
                  class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
              </label>
            </div>

            <div class="flex justify-end space-x-3">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                {{ isSubmitting ? 'Saving...' : (isEditing ? 'Update' : 'Create') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { apiClient } from '~/utils/api';
import { PlusIcon, BanknoteIcon } from 'lucide-vue-next';

const feeTypes = ref([]);
const isLoading = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const isSubmitting = ref(false);
const editingId = ref(null);

const form = ref({
  name: '',
  description: '',
  amount: '',
  is_active: true
});

const resetForm = () => {
  form.value = {
    name: '',
    description: '',
    amount: '',
    is_active: true
  };
};

const fetchFeeTypes = async () => {
  isLoading.value = true;
  try {
    const response = await apiClient.feeTypes.getAll();
    feeTypes.value = response.data;
  } catch (error) {
    console.error('Error fetching fee types:', error);
  } finally {
    isLoading.value = false;
  }
};

const openCreateModal = () => {
  resetForm();
  isEditing.value = false;
  showModal.value = true;
};

const editFeeType = (feeType) => {
  form.value = {
    name: feeType.name,
    description: feeType.description || '',
    amount: feeType.amount || '',
    is_active: feeType.is_active
  };
  editingId.value = feeType.id;
  isEditing.value = true;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  resetForm();
  editingId.value = null;
};

const saveFeeType = async () => {
  isSubmitting.value = true;
  try {
    const payload = {
      name: form.value.name,
      description: form.value.description,
      amount: form.value.amount ? parseFloat(form.value.amount) : null,
      is_active: form.value.is_active
    };

    if (isEditing.value) {
      await apiClient.feeTypes.update(editingId.value, payload);
    } else {
      await apiClient.feeTypes.create(payload);
    }

    closeModal();
    await fetchFeeTypes();
  } catch (error) {
    console.error('Error saving fee type:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const deleteFeeType = async (id) => {
  if (confirm('Are you sure you want to delete this fee type?')) {
    try {
      await apiClient.feeTypes.delete(id);
      await fetchFeeTypes();
    } catch (error) {
      console.error('Error deleting fee type:', error);
    }
  }
};

onMounted(() => {
  fetchFeeTypes();
});
</script>

<style scoped>
/****************************************************
  Tailwind CSS styles are generated from utilities.
  Add custom styles here.
****************************************************/
</style>
