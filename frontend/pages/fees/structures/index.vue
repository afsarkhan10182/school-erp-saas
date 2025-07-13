<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Fee Structures</h1>
        <button
          @click="openCreateModal"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          <PlusIcon class="h-4 w-4 mr-2" />
          Add Fee Structure
        </button>
      </div>

      <!-- Fee Structures List -->
      <div class="mt-8">
        <div v-if="isLoading" class="p-8 text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading fee structures...</p>
        </div>

        <div v-else-if="feeStructures.length === 0" class="p-8 text-center">
          <BanknoteIcon class="mx-auto h-12 w-12 text-gray-400" />
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">No fee structures found.</p>
        </div>

        <div v-else class="shadow overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:rounded-lg">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Class</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Academic Year</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="structure in feeStructures" :key="structure.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {{ structure.name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ structure.class_name }}{{ structure.section ? ` - ${structure.section}` : '' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ structure.academic_year }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  ₹{{ structure.amount }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="{
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': structure.is_active,
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': !structure.is_active,
                    }"
                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  >
                    {{ structure.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    @click="editFeeStructure(structure)"
                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    @click="deleteFeeStructure(structure.id)"
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
            {{ isEditing ? 'Edit Fee Structure' : 'Create Fee Structure' }}
          </h3>
          
          <form @submit.prevent="saveFeeStructure">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
              <input
                v-model="form.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter fee structure name"
              />
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Academic Year</label>
              <input
                v-model="form.academic_year"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., 2024-2025"
              />
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Class</label>
              <input
                v-model="form.class_name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter class name"
              />
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Section (Optional)</label>
              <input
                v-model="form.section"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter section"
              />
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fee Type</label>
              <select
                v-model="form.fee_type_id"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Fee Type</option>
                <option v-for="feeType in feeTypes" :key="feeType.id" :value="feeType.id">
                  {{ feeType.name }}
                </option>
              </select>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
              <input
                v-model="form.amount"
                type="number"
                step="0.01"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter amount"
              />
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Installments</label>
              <input
                v-model="form.installments"
                type="number"
                min="1"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Number of installments"
              />
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Discount Percentage</label>
              <input
                v-model="form.discount_percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter discount percentage"
              />
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
              <textarea
                v-model="form.notes"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter any notes"
              ></textarea>
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

const feeStructures = ref([]);
const feeTypes = ref([]);
const isLoading = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const isSubmitting = ref(false);
const editingId = ref(null);

const form = ref({
  name: '',
  academic_year: '',
  class_name: '',
  section: '',
  fee_type_id: '',
  amount: '',
  installments: 1,
  discount_percentage: 0,
  notes: '',
  is_active: true
});

const resetForm = () => {
  form.value = {
    name: '',
    academic_year: '',
    class_name: '',
    section: '',
    fee_type_id: '',
    amount: '',
    installments: 1,
    discount_percentage: 0,
    notes: '',
    is_active: true
  };
};

const fetchFeeStructures = async () => {
  isLoading.value = true;
  try {
    const response = await apiClient.feeStructures.getAll();
    feeStructures.value = response.data;
  } catch (error) {
    console.error('Error fetching fee structures:', error);
  } finally {
    isLoading.value = false;
  }
};

const fetchFeeTypes = async () => {
  try {
    const response = await apiClient.feeTypes.getAll();
    feeTypes.value = response.data.filter(type => type.is_active);
  } catch (error) {
    console.error('Error fetching fee types:', error);
  }
};

const openCreateModal = () => {
  resetForm();
  isEditing.value = false;
  showModal.value = true;
};

const editFeeStructure = (structure) => {
  form.value = {
    name: structure.name,
    academic_year: structure.academic_year,
    class_name: structure.class_name,
    section: structure.section || '',
    fee_type_id: structure.fee_type_id,
    amount: structure.amount,
    installments: structure.installments || 1,
    discount_percentage: structure.discount_percentage || 0,
    notes: structure.notes || '',
    is_active: structure.is_active
  };
  editingId.value = structure.id;
  isEditing.value = true;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  resetForm();
  editingId.value = null;
};

const saveFeeStructure = async () => {
  isSubmitting.value = true;
  try {
    const payload = {
      name: form.value.name,
      academic_year: form.value.academic_year,
      class_name: form.value.class_name,
      section: form.value.section || null,
      fee_type_id: parseInt(form.value.fee_type_id),
      amount: parseFloat(form.value.amount),
      installments: parseInt(form.value.installments),
      discount_percentage: parseFloat(form.value.discount_percentage),
      notes: form.value.notes || null,
      is_active: form.value.is_active
    };

    if (isEditing.value) {
      await apiClient.feeStructures.update(editingId.value, payload);
    } else {
      await apiClient.feeStructures.create(payload);
    }

    closeModal();
    await fetchFeeStructures();
  } catch (error) {
    console.error('Error saving fee structure:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const deleteFeeStructure = async (id) => {
  if (confirm('Are you sure you want to delete this fee structure?')) {
    try {
      await apiClient.feeStructures.delete(id);
      await fetchFeeStructures();
    } catch (error) {
      console.error('Error deleting fee structure:', error);
    }
  }
};

onMounted(async () => {
  await fetchFeeStructures();
  await fetchFeeTypes();
});
</script>

<style scoped>
/****************************************************
  Tailwind CSS styles are generated from utilities.
  Add custom styles here.
****************************************************/
</style>
