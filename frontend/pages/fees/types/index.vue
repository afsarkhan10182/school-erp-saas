<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Fee Management</h1>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage fee types for your institution
          </p>
        </div>
        <button
          @click="openCreateModal"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          <PlusIcon class="h-4 w-4 mr-2" />
          Add Fee Type
        </button>
      </div>

      <!-- Fee Types List -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-x-auto">
        <div v-if="isLoading" class="p-8 text-center">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"
          ></div>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading fee types...</p>
        </div>

        <div v-else-if="feeTypes.length === 0" class="p-8 text-center">
          <BanknoteIcon class="mx-auto h-12 w-12 text-gray-400" />
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">No fee types found.</p>
          <button
            @click="openCreateModal"
            class="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200 dark:text-indigo-400 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40"
          >
            <PlusIcon class="h-4 w-4 mr-2" />
            Create your first fee type
          </button>
        </div>

        <div v-else>
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Code
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Category
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Branch
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="feeType in feeTypes"
                :key="feeType.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ feeType.name }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-500 dark:text-gray-400">{{ feeType.code }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                    :class="{
                      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400':
                        feeType.category === 'academic',
                      'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400':
                        feeType.category === 'transport',
                      'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400':
                        feeType.category === 'hostel',
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400':
                        feeType.category === 'other'
                    }"
                  >
                    {{ feeType.category }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div v-if="feeType.branch" class="flex items-center">
                    <span class="font-medium">{{ feeType.branch.name }}</span>
                    <span v-if="feeType.branch.code" class="text-gray-500 dark:text-gray-400 ml-1"
                      >({{ feeType.branch.code }})</span
                    >
                  </div>
                  <div v-else class="text-sm text-gray-500 dark:text-gray-400">All Branches</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                    :class="{
                      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400':
                        feeType.is_active,
                      'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400':
                        !feeType.is_active
                    }"
                  >
                    {{ feeType.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    @click="editFeeType(feeType)"
                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
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
    <div
      v-if="showModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    >
      <div
        class="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800"
      >
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ isEditing ? 'Edit Fee Type' : 'Create Fee Type' }}
          </h3>

          <form @submit.prevent="saveFeeType">
            <!-- School Selector for Super Admin -->
            <div
              v-if="user?.role === 'super_admin' && !isEditing"
              class="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
            >
              <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
                📍 Select School Context
              </h4>
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >School *</label
                  >
                  <select
                    v-model="selectedSchoolId"
                    required
                    :class="[
                      'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white',
                      validationErrors.school_id
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600'
                    ]"
                    @change="onSchoolChange"
                  >
                    <option value="">Select a school first</option>
                    <option v-for="school in availableSchools" :key="school.id" :value="school.id">
                      {{ school.name }} {{ school.code ? `(${school.code})` : '' }}
                    </option>
                  </select>
                  <div
                    v-if="validationErrors.school_id"
                    class="mt-1 text-xs text-red-600 dark:text-red-400"
                  >
                    {{ validationErrors.school_id }}
                  </div>
                </div>

                <!-- Branch Selector for Super Admin -->
                <div v-if="selectedSchoolId">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >Branch *</label
                  >
                  <select
                    v-model="selectedBranchId"
                    required
                    :class="[
                      'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white',
                      validationErrors.branch_id
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600'
                    ]"
                  >
                    <option value="">Select a branch</option>
                    <option v-for="branch in availableBranches" :key="branch.id" :value="branch.id">
                      {{ branch.name }}
                    </option>
                  </select>
                  <div
                    v-if="validationErrors.branch_id"
                    class="mt-1 text-xs text-red-600 dark:text-red-400"
                  >
                    {{ validationErrors.branch_id }}
                  </div>
                </div>

                <div
                  v-if="!selectedSchoolId && !validationErrors.school_id"
                  class="text-xs text-blue-600 dark:text-blue-400"
                >
                  ⚠️ Please select a school before creating the fee type
                </div>
                <div
                  v-if="selectedSchoolId && !selectedBranchId && !validationErrors.branch_id"
                  class="text-xs text-blue-600 dark:text-blue-400"
                >
                  ⚠️ Please select a branch before creating the fee type
                </div>
              </div>
            </div>

            <!-- Branch Selector for School Admin -->
            <div
              v-if="user?.role === 'school_admin'"
              class="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
            >
              <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
                📍 {{ isEditing ? 'Branch Context (Read-only)' : 'Select Branch Context' }}
              </h4>
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >Branch *</label
                  >
                  <select
                    v-model="selectedBranchId"
                    :required="!isEditing"
                    :disabled="isEditing"
                    :class="[
                      'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white',
                      validationErrors.branch_id
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600',
                      isEditing ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''
                    ]"
                  >
                    <option value="">Select a branch</option>
                    <option v-for="branch in availableBranches" :key="branch.id" :value="branch.id">
                      {{ branch.name }}
                    </option>
                  </select>
                  <div
                    v-if="validationErrors.branch_id"
                    class="mt-1 text-xs text-red-600 dark:text-red-400"
                  >
                    {{ validationErrors.branch_id }}
                  </div>
                </div>
                <div
                  v-if="!selectedBranchId && !validationErrors.branch_id && !isEditing"
                  class="text-xs text-blue-600 dark:text-blue-400"
                >
                  ⚠️ Please select a branch before creating the fee type
                </div>
                <div v-if="isEditing" class="text-xs text-blue-600 dark:text-blue-400">
                  ℹ️ Branch cannot be changed when editing a fee type
                </div>
              </div>
            </div>

            <!-- Validation Errors Display -->
            <div
              v-if="validationErrors.general"
              class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md"
            >
              <div class="text-red-800 text-sm">{{ validationErrors.general }}</div>
            </div>

            <!-- Fee Type Form -->
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Name *</label
                >
                <input
                  v-model="form.name"
                  type="text"
                  required
                  :class="[
                    'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white',
                    validationErrors.name
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
                  ]"
                  placeholder="Enter fee type name"
                />
                <div
                  v-if="validationErrors.name"
                  class="mt-1 text-xs text-red-600 dark:text-red-400"
                >
                  {{ validationErrors.name }}
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Code *</label
                >
                <input
                  v-model="form.code"
                  type="text"
                  required
                  :class="[
                    'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white',
                    validationErrors.code
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
                  ]"
                  placeholder="e.g., TUITION, TRANSPORT, HOSTEL"
                />
                <div
                  v-if="validationErrors.code"
                  class="mt-1 text-xs text-red-600 dark:text-red-400"
                >
                  {{ validationErrors.code }}
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Category *</label
                >
                <select
                  v-model="form.category"
                  required
                  :class="[
                    'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white',
                    validationErrors.category
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
                  ]"
                >
                  <option value="academic">Academic</option>
                  <option value="transport">Transport</option>
                  <option value="hostel">Hostel</option>
                  <option value="other">Other</option>
                </select>
                <div
                  v-if="validationErrors.category"
                  class="mt-1 text-xs text-red-600 dark:text-red-400"
                >
                  {{ validationErrors.category }}
                </div>
              </div>

              <div class="flex items-center">
                <input
                  v-model="form.is_active"
                  type="checkbox"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label class="ml-2 block text-sm text-gray-900 dark:text-gray-300">Active</label>
              </div>
              <div
                v-if="validationErrors.is_active"
                class="mt-1 text-xs text-red-600 dark:text-red-400"
              >
                {{ validationErrors.is_active }}
              </div>
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
                :disabled="
                  isSubmitting ||
                  (user?.role === 'super_admin' &&
                    !isEditing &&
                    (!selectedSchoolId || !selectedBranchId)) ||
                  (user?.role === 'school_admin' && !isEditing && !selectedBranchId)
                "
                class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                {{ isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Schools, FeeTypes } from '~/api';
import { useAuth } from '~/composables/useAuth';
import { useBranches } from '~/composables/useBranches';
import { useToast } from '~/composables/useToast';
import { PlusIcon, BanknoteIcon } from 'lucide-vue-next';

// SSR-safe window check
const isClient = import.meta.client;

// Get auth context
const { user } = useAuth();
const { showSuccess, showError } = useToast();
const router = useRouter();
const route = useRoute();

const feeTypes = ref([]);
const isLoading = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const isSubmitting = ref(false);
const editingId = ref(null);

// School selector for super admin
const selectedSchoolId = ref('');
const availableSchools = ref([]);

// Branch selector for school admin (only for modal)
const selectedBranchId = ref('');
const availableBranches = ref([]);
const { fetchBranches } = useBranches();

const form = ref({
  name: '',
  code: '',
  category: 'academic',
  is_active: true
});

// Add validation errors state
const validationErrors = ref({});

const resetForm = () => {
  form.value = {
    name: '',
    code: '',
    category: 'academic',
    is_active: true
  };
  selectedSchoolId.value = '';
  selectedBranchId.value = '';
  // Clear validation errors
  validationErrors.value = {};
};

// Fetch schools for super admin
const fetchSchools = async () => {
  if (user.value?.role !== 'super_admin') return;

  try {
    const response = await Schools.getAll();

    // Handle both paginated and non-paginated responses
    if (response.data?.schools) {
      availableSchools.value = response.data.schools;
    } else if (response.data?.items) {
      availableSchools.value = response.data.items;
    } else if (response.data) {
      availableSchools.value = response.data;
    } else {
      availableSchools.value = [];
    }
  } catch (error) {
    console.error('❌ Error fetching schools:', error);
    availableSchools.value = [];
  }
};

// Handle school selection change
const onSchoolChange = async () => {
  selectedBranchId.value = ''; // Reset branch selection
  if (selectedSchoolId.value) {
    try {
      const branches = await fetchBranches(selectedSchoolId.value);

      // fetchBranches returns the branches array directly
      if (Array.isArray(branches)) {
        availableBranches.value = branches;
      } else {
        availableBranches.value = [];
      }

      // Auto-select if only one branch
      if (availableBranches.value.length === 1) {
        selectedBranchId.value = availableBranches.value[0].id;
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      availableBranches.value = [];
    }
  }

  // Reset form when school changes
  if (!isEditing.value) {
    resetForm();
  }
};

// Fetch branches for school admin
const fetchBranchesForSchoolAdmin = async () => {
  if (user.value?.role !== 'school_admin' || !user.value?.school_id) {
    return;
  }

  try {
    const branches = await fetchBranches(user.value.school_id);

    // fetchBranches returns the branches array directly
    if (Array.isArray(branches)) {
      availableBranches.value = branches;
    } else {
      availableBranches.value = [];
    }

    // Auto-select if only one branch
    if (availableBranches.value.length === 1) {
      selectedBranchId.value = availableBranches.value[0].id;
    }
  } catch (error) {
    console.error('Error fetching branches for school admin:', error);
    availableBranches.value = [];
  }
};

// Force reload branches for school admin
const forceReloadBranches = async () => {
  if (user.value?.role === 'school_admin' && user.value?.school_id) {
    await fetchBranchesForSchoolAdmin();
  }
};

// Watch for user data changes to load branches
watch(
  user,
  async newUser => {
    if (
      newUser?.role === 'school_admin' &&
      newUser?.school_id &&
      availableBranches.value.length === 0
    ) {
      await fetchBranchesForSchoolAdmin();
    }
  },
  { immediate: true }
);

const fetchFeeTypes = async () => {
  isLoading.value = true;
  try {
    const params = {};
    if (user.value?.school_id) {
      params.school_id = user.value.school_id;
    }
    const response = await FeeTypes.getAll(params);
    feeTypes.value = response.data;
  } catch (error) {
    console.error('Error fetching fee types:', error);
  } finally {
    isLoading.value = false;
  }
};

const openCreateModal = async () => {
  resetForm();
  isEditing.value = false;
  showModal.value = true;

  // Load schools for super admin
  if (user.value?.role === 'super_admin') {
    await fetchSchools();
  }

  // Load branches for school admin (always load to ensure fresh data)
  if (user.value?.role === 'school_admin' && user.value?.school_id) {
    await fetchBranchesForSchoolAdmin();
  }
};

const editFeeType = feeType => {
  form.value = {
    name: feeType.name,
    code: feeType.code,
    category: feeType.category || 'academic',
    is_active: feeType.is_active !== false
  };
  editingId.value = feeType.id;
  isEditing.value = true;
  showModal.value = true;

  // Set the branch ID for editing (so it's passed to the API)
  if (feeType.branch_id) {
    selectedBranchId.value = feeType.branch_id;
  }
};

const closeModal = () => {
  showModal.value = false;
  resetForm();
  editingId.value = null;
  // Clear branch selection when closing modal
  selectedBranchId.value = '';
};

const saveFeeType = async () => {
  isSubmitting.value = true;
  // Clear previous validation errors
  validationErrors.value = {};

  try {
    const feeTypeData = {
      ...form.value,
      // Only send school_id for super admin
      ...(user.value?.role === 'super_admin' && { school_id: selectedSchoolId.value }),
      // Send branch_id if selected or available
      ...(selectedBranchId.value && { branch_id: selectedBranchId.value })
    };

    // For editing, ensure branch_id is always sent if we have it
    if (isEditing.value && selectedBranchId.value) {
      feeTypeData.branch_id = selectedBranchId.value;
    }

    if (isEditing.value) {
      await FeeTypes.update(editingId.value, feeTypeData);
    } else {
      await FeeTypes.create(feeTypeData);
    }

    await fetchFeeTypes();
    closeModal();

    // Show success message
    showSuccess(`Fee type ${isEditing.value ? 'updated' : 'created'} successfully!`);
  } catch (error) {
    console.error('Error saving fee type:', error);

    // Handle validation errors from backend
    if (error.response?.data?.errors) {
      validationErrors.value = error.response.data.errors;
    } else if (error.response?.data?.message) {
      // Handle single error message
      validationErrors.value = { general: error.response.data.message };
    } else {
      // Handle generic error
      validationErrors.value = { general: 'An error occurred while saving the fee type' };
    }

    // Show error toast
    showError('Failed to save fee type. Please check the form for errors.');
  } finally {
    isSubmitting.value = false;
  }
};

const deleteFeeType = async id => {
  if (confirm('Are you sure you want to delete this fee type?')) {
    try {
      await FeeTypes.delete(id);
      await fetchFeeTypes();
    } catch (error) {
      console.error('Error deleting fee type:', error);
    }
  }
};

// Handle window resize
let resizeObserver;

// Add missing checkMobile function
const checkMobile = () => {
  // This function was referenced but not defined
  // For now, we'll leave it empty as it's not critical for dropdown functionality
};

onMounted(async () => {
  if (isClient) {
    // Load schools for super admin on component mount
    if (user.value?.role === 'super_admin') {
      await fetchSchools();
    }

    // Load branches for school admin on component mount
    if (user.value?.role === 'school_admin') {
      await fetchBranchesForSchoolAdmin();
    }

    // Load fee types
    await fetchFeeTypes();

    // Setup resize observer
    resizeObserver = new ResizeObserver(() => {
      checkMobile();
    });
    resizeObserver.observe(document.body);
  }
});

onBeforeUnmount(() => {
  if (isClient && resizeObserver) {
    resizeObserver.disconnect();
  }
});
</script>

<style scoped>
/****************************************************
  Tailwind CSS styles are generated from utilities.
  Add custom styles here.
****************************************************/
</style>
