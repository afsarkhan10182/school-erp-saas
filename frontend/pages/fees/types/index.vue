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
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Code</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
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
                  {{ feeType.code }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <span class="capitalize">{{ feeType.category }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  ₹{{ feeType.amount }}
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
      <div class="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ isEditing ? 'Edit Fee Type' : 'Create Fee Type' }}
          </h3>
          
          <form @submit.prevent="saveFeeType">
            <!-- School Selector for Super Admin -->
            <div v-if="user?.role === 'super_admin' && !isEditing" class="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">📍 Select School Context</h4>
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">School *</label>
                  <select
                    v-model="selectedSchoolId"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    @change="onSchoolChange"
                  >
                    <option value="">Select a school first</option>
                    <option v-for="school in availableSchools" :key="school.id" :value="school.id">
                      {{ school.name }} {{ school.code ? `(${school.code})` : '' }}
                    </option>
                  </select>
                </div>
                <div v-if="!selectedSchoolId" class="text-xs text-blue-600 dark:text-blue-400">
                  ⚠️ Please select a school before creating the fee type
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Basic Information -->
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name *</label>
                  <input
                    v-model="form.name"
                    type="text"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter fee type name"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Code *</label>
                  <input
                    v-model="form.code"
                    type="text"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., TUITION, TRANSPORT, HOSTEL"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category *</label>
                  <select
                    v-model="form.category"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="academic">Academic</option>
                    <option value="transport">Transport</option>
                    <option value="hostel">Hostel</option>
                    <option value="library">Library</option>
                    <option value="laboratory">Laboratory</option>
                    <option value="sports">Sports</option>
                    <option value="examination">Examination</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                  <textarea
                    v-model="form.description"
                    rows="3"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter description"
                  ></textarea>
                </div>
              </div>

              <!-- Settings -->
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Due Date (Days)</label>
                  <input
                    v-model="form.due_date_days"
                    type="number"
                    min="1"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="30"
                  />
                </div>

                <!-- Checkboxes -->
                <div class="space-y-3">
                  <label class="flex items-center">
                    <input
                      v-model="form.is_mandatory"
                      type="checkbox"
                      class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Mandatory</span>
                  </label>

                  <label class="flex items-center">
                    <input
                      v-model="form.is_refundable"
                      type="checkbox"
                      class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Refundable</span>
                  </label>

                  <label class="flex items-center">
                    <input
                      v-model="form.late_fee_applicable"
                      type="checkbox"
                      class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Late Fee Applicable</span>
                  </label>

                  <label class="flex items-center">
                    <input
                      v-model="form.tax_applicable"
                      type="checkbox"
                      class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Tax Applicable</span>
                  </label>
                </div>

                <!-- Late Fee Settings -->
                <div v-if="form.late_fee_applicable" class="space-y-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Late Fee Amount</label>
                    <input
                      v-model="form.late_fee_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Late Fee Type</label>
                    <select
                      v-model="form.late_fee_type"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="fixed">Fixed Amount</option>
                      <option value="percentage">Percentage</option>
                    </select>
                  </div>
                </div>

                <div v-if="form.tax_applicable">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tax Percentage (%)</label>
                  <input
                    v-model="form.tax_percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <!-- Status -->
            <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
              <label class="flex items-center">
                <input
                  v-model="form.is_active"
                  type="checkbox"
                  class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
              </label>
            </div>

            <div class="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isSubmitting || (user?.role === 'super_admin' && !isEditing && !selectedSchoolId)"
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
import { useAuth } from '~/composables/useAuth';
import { PlusIcon, BanknoteIcon } from 'lucide-vue-next';

// Get auth context
const { user } = useAuth();

const feeTypes = ref([]);
const isLoading = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const isSubmitting = ref(false);
const editingId = ref(null);

// School selector for super admin
const selectedSchoolId = ref('');
const availableSchools = ref([]);

const form = ref({
  name: '',
  code: '',
  description: '',
  category: 'academic',
  is_mandatory: true,
  is_refundable: false,
  due_date_days: 30,
  late_fee_applicable: false,
  late_fee_amount: 0,
  late_fee_type: 'fixed',
  tax_applicable: false,
  tax_percentage: 0,
  is_active: true
});

const resetForm = () => {
  form.value = {
    name: '',
    code: '',
    description: '',
    category: 'academic',
    is_mandatory: true,
    is_refundable: false,
    due_date_days: 30,
    late_fee_applicable: false,
    late_fee_amount: 0,
    late_fee_type: 'fixed',
    tax_applicable: false,
    tax_percentage: 0,
    is_active: true
  };
  selectedSchoolId.value = '';
};

// Fetch schools for super admin
const fetchSchools = async () => {
  if (user.value?.role !== 'super_admin') return;
  
  try {
    console.log('🔍 Fetching schools for super admin...');
    const response = await apiClient.schools.getAll();
    console.log('🔍 Schools API response:', response);
    
    // Handle both paginated and non-paginated responses
    if (response.data?.schools) {
      // API returns schools array directly
      availableSchools.value = response.data.schools;
    } else if (response.data?.items) {
      // Fallback for paginated response
      availableSchools.value = response.data.items;
    } else if (response.data) {
      // Direct array response
      availableSchools.value = response.data;
    } else {
      availableSchools.value = [];
    }
    
    console.log('✅ Schools loaded:', availableSchools.value.length);
  } catch (error) {
    console.error('❌ Error fetching schools:', error);
    availableSchools.value = [];
  }
};

// Handle school selection change
const onSchoolChange = () => {
  console.log('🔍 School changed to:', selectedSchoolId.value);
  // Reset form when school changes
  if (!isEditing.value) {
    resetForm();
  }
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
  
  // Load schools for super admin if not already loaded
  if (user.value?.role === 'super_admin' && availableSchools.value.length === 0) {
    fetchSchools();
  }
};

const editFeeType = (feeType) => {
  form.value = {
    name: feeType.name,
    code: feeType.code,
    description: feeType.description || '',
    category: feeType.category || 'academic',
    is_mandatory: feeType.is_mandatory !== false,
    is_refundable: feeType.is_refundable === true,
    due_date_days: feeType.due_date_days || 30,
    late_fee_applicable: feeType.late_fee_applicable === true,
    late_fee_amount: feeType.late_fee_amount || 0,
    late_fee_type: feeType.late_fee_type || 'fixed',
    tax_applicable: feeType.tax_applicable === true,
    tax_percentage: feeType.tax_percentage || 0,
    is_active: feeType.is_active !== false
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
      code: form.value.code,
      description: form.value.description,
      category: form.value.category,
      is_mandatory: form.value.is_mandatory,
      is_refundable: form.value.is_refundable,
      due_date_days: parseInt(form.value.due_date_days),
      late_fee_applicable: form.value.late_fee_applicable,
      late_fee_amount: parseFloat(form.value.late_fee_amount),
      late_fee_type: form.value.late_fee_type,
      tax_applicable: form.value.tax_applicable,
      tax_percentage: parseFloat(form.value.tax_percentage),
      is_active: form.value.is_active
    };

    // Add school_id for super admin users
    if (user.value?.role === 'super_admin') {
      if (isEditing.value) {
        // For editing, use the school_id from the existing fee type
        // This should be handled by the backend based on the fee type's existing school_id
      } else {
        // For creating, use the selected school
        if (selectedSchoolId.value) {
          payload.school_id = selectedSchoolId.value;
        } else {
          console.error('School ID is required for super admin');
          return;
        }
      }
    }

    console.log('🔍 Saving fee type with payload:', payload);

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

onMounted(async () => {
  // Load schools for super admin on component mount
  if (user.value?.role === 'super_admin') {
    await fetchSchools();
  }
  
  // Load fee types
  await fetchFeeTypes();
});
</script>

<style scoped>
/****************************************************
  Tailwind CSS styles are generated from utilities.
  Add custom styles here.
****************************************************/
</style>
