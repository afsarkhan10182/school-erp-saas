<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Fee Types</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage fee types and categories for your institution
        </p>
      </div>
      <div>
        <button
          @click="openCreateModal"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-150"
        >
          <PlusIcon class="h-4 w-4" />
          Add Fee Type
        </button>
      </div>
    </div>

    <!-- Fee Types List -->
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl overflow-hidden">
      <div v-if="isLoading" class="p-8 text-center text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
        <span class="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
        Loading fee types...
      </div>

      <div v-else-if="feeTypes.length === 0" class="p-8 text-center">
        <BanknoteIcon class="mx-auto h-12 w-12 text-gray-400" />
        <p class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No fee types found.</p>
        <button
          @click="openCreateModal"
          class="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 rounded-lg transition-colors"
        >
          <PlusIcon class="h-3.5 w-3.5" />
          Create your first fee type
        </button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50/80 dark:bg-gray-900/40">
            <tr>
              <th
                class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Name
              </th>
              <th
                class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Code
              </th>
              <th
                class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Category
              </th>
              <th
                class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Branch
              </th>
              <th
                class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                class="px-5 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="feeType in feeTypes"
              :key="feeType.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
            >
              <td class="px-5 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {{ feeType.name }}
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                {{ feeType.code }}
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap">
                <span
                  class="inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full capitalize"
                  :class="{
                    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900':
                      feeType.category === 'academic',
                    'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900':
                      feeType.category === 'transport',
                    'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-900':
                      feeType.category === 'hostel',
                    'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900':
                      feeType.category === 'other'
                  }"
                >
                  {{ feeType.category }}
                </span>
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                <span class="font-medium">{{ feeType.branch?.name || 'All Branches' }}</span>
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                    feeType.is_active
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                  ]"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="feeType.is_active ? 'bg-emerald-500' : 'bg-rose-500'"
                  ></span>
                  {{ feeType.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap text-right text-sm font-medium">
                <button
                  @click="editFeeType(feeType)"
                  class="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3 hover:underline"
                >
                  Edit
                </button>
                <button
                  @click="deleteFeeType(feeType.id)"
                  class="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 w-full max-w-lg shadow-xl space-y-4"
      >
        <h3 class="text-lg font-bold text-gray-900 dark:text-white">
          {{ isEditing ? 'Edit Fee Type' : 'Create Fee Type' }}
        </h3>

        <form @submit.prevent="saveFeeType" class="space-y-4">
          <!-- Validation Errors Display -->
          <div
            v-if="validationErrors.general"
            class="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300"
          >
            {{ validationErrors.general }}
          </div>

          <!-- Fee Type Form -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >Name <span class="text-rose-500">*</span></label
            >
            <input
              v-model="form.name"
              type="text"
              required
              class="input-field"
              placeholder="Enter fee type name"
            />
            <div
              v-if="validationErrors.name"
              class="mt-1 text-xs text-rose-600 dark:text-rose-400"
            >
              {{ validationErrors.name }}
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >Code <span class="text-rose-500">*</span></label
            >
            <input
              v-model="form.code"
              type="text"
              required
              class="input-field"
              placeholder="e.g., TUITION, TRANSPORT, HOSTEL"
            />
            <div
              v-if="validationErrors.code"
              class="mt-1 text-xs text-rose-600 dark:text-rose-400"
            >
              {{ validationErrors.code }}
            </div>
          </div>

          <div>
            <EnhancedDropdown
              v-model="form.category"
              label="Category"
              :options="categoryOptions"
              placeholder="Select Category"
              :required="true"
              :error="validationErrors.category"
            />
            <div
              v-if="validationErrors.category"
              class="mt-1 text-xs text-rose-600 dark:text-rose-400"
            >
              {{ validationErrors.category }}
            </div>
          </div>

          <div>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Schools, FeeTypes } from '~/api';
import { useAuth } from '~/composables/useAuth';
import { useSchools } from '~/composables/useSchools';
import { useToast } from '~/composables/useToast';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { PlusIcon, BanknoteIcon, ChevronDown } from 'lucide-vue-next';

// SSR-safe window check
const isClient = import.meta.client;

// Get auth context
const { user } = useAuth();
const { showSuccess, showError } = useToast();
const { schools, fetchSchools } = useSchools();
const { selectedBranchId: globalBranchId } = useGlobalBranch();
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

// Dropdown options
const schoolOptions = computed(() => [
  ...schools.value.map(school => ({
    value: school.id,
    label: school.name
  }))
]);


const categoryOptions = [
  { value: 'academic', label: 'Academic' },
  { value: 'transport', label: 'Transport' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'library', label: 'Library' },
  { value: 'sports', label: 'Sports' },
  { value: 'other', label: 'Other' }
];

// Branch selector for school admin (only for modal)
const selectedBranchId = ref('');
const availableBranches = ref([]);

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

// Fetch schools for super admin - using composable
const loadSchools = async () => {
  if (user.value?.role !== 'super_admin') return;
  await fetchSchools();
};

// Handle school selection change
const onSchoolChange = async () => {
  selectedBranchId.value = ''; // Reset branch selection
  if (selectedSchoolId.value) {
    try {
      const branches = []; // Removed unfinished statement
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

// Force reload branches for school admin

// Watch for user data changes to load branches
watch(
  user,
  async newUser => {
    if (newUser?.role === 'admin' && newUser?.school_id && availableBranches.value.length === 0) {
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
    const branchId = globalBranchId.value || selectedBranchId.value;
    if (branchId) {
      params.branch_id = branchId;
    }
    const response = await FeeTypes.getAll(params);
    feeTypes.value = response.data;
  } catch (error) {
    console.error('Error fetching fee types:', error);
  } finally {
    isLoading.value = false;
  }
};

watch(globalBranchId, () => {
  fetchFeeTypes();
});

const openCreateModal = async () => {
  resetForm();
  isEditing.value = false;
  showModal.value = true;

  // Load schools for super admin
  if (user.value?.role === 'super_admin') {
    await fetchSchools();
  }

  // Load branches for school admin (always load to ensure fresh data)
  if (user.value?.role === 'admin' && user.value?.school_id) {
  }

  // Pre-fill branch from global context
  if (globalBranchId.value) {
    selectedBranchId.value = globalBranchId.value;
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
    if (user.value?.role === 'admin') {
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
