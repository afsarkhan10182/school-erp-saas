<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Class Management</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Manage academic classes for each branch
          </p>
        </div>
        <div class="mt-4 sm:mt-0 sm:flex sm:space-x-3">
          <button
            @click="openCreateModal"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus class="-ml-1 mr-2 h-5 w-5" />
            Add Class
          </button>
        </div>
      </div>

      <!-- Branch Filter for Admin -->
      <div
        v-if="isAdmin && branches.length > 1"
        class="bg-white dark:bg-gray-800 shadow rounded-md mb-6"
      >
        <div class="px-4 py-5 sm:px-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Filter by Branch
              </h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Select a branch to view its classes
              </p>
            </div>
            <div class="flex items-center space-x-3">
              <label
                for="branch-filter"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Branch:
              </label>
              <EnhancedDropdown
                v-model="selectedBranchId"
                :options="branchOptions"
                placeholder="All Branches"
                @update:model-value="onBranchChange"
                class="w-40"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Classes List -->
      <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Class Name
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Code
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Branch
                </th>
                <th
                  v-if="streamsEnabled"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Streams
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Sections
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
                v-for="classItem in classes"
                :key="classItem.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"
                >
                  {{ classItem.name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ classItem.code }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <div v-if="classItem.branch" class="flex items-center">
                    <span class="font-medium">{{ classItem.branch?.name }}</span>
                  </div>
                </td>
                <td
                  v-if="streamsEnabled"
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                >
                  <span
                    v-if="classItem.has_stream"
                    class="text-blue-600 dark:text-blue-400 font-medium"
                  >
                    {{ classItem.streams?.length || 0 }} streams
                  </span>
                  <span v-else class="text-gray-500 dark:text-gray-400"> No streams </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ classItem.sections?.length || 0 }} sections
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="{
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200':
                        classItem.is_active,
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200':
                        !classItem.is_active
                    }"
                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  >
                    {{ classItem.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    @click="editClass(classItem)"
                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    @click="toggleStatus(classItem)"
                    class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3"
                  >
                    {{ classItem.is_active ? 'Deactivate' : 'Activate' }}
                  </button>
                  <button
                    @click="deleteClass(classItem.id)"
                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <Pagination
          v-if="pagination.total > 0"
          :pagination="{
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total
          }"
          item-label="classes"
          @page-changed="goToPage"
          @page-size-changed="changeLimit"
        />
      </div>

      <!-- Create/Edit Modal -->
      <div
        v-if="showModal"
        class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[100]"
      >
        <div
          class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800"
        >
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {{ isEditing ? 'Edit Class' : 'Create New Class' }}
            </h3>

            <form @submit.prevent="saveClass">
              <!-- School Selector for Super Admin -->
              <div
                v-if="isSuperAdmin && !isEditing"
                class="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
              >
                <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
                  📍 Select School & Branch
                </h4>
                <div class="space-y-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >School *</label
                    >
                    <EnhancedDropdown
                      v-model="selectedSchoolId"
                      :options="schoolOptions"
                      placeholder="Select a school first"
                      required
                      @update:model-value="onSchoolChange"
                    />
                  </div>
                  <div v-if="selectedSchoolId">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >Branch *</label
                    >
                    <EnhancedDropdown
                      v-model="selectedBranchId"
                      :options="branchOptions"
                      placeholder="Select a branch"
                      required
                    />
                  </div>
                  <div
                    v-if="!selectedSchoolId || !selectedBranchId"
                    class="text-xs text-blue-600 dark:text-blue-400"
                  >
                    ⚠️ Please select both school and branch before creating the class
                  </div>
                </div>
              </div>

              <!-- Branch Selector for Admin -->
              <div v-if="isAdmin && !isEditing && branches.length > 1" class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Branch *</label
                >
                <EnhancedDropdown
                  v-model="selectedBranchId"
                  :options="branchOptions"
                  placeholder="Select a branch"
                  required
                />
              </div>

              <!-- Branch Information Display for Admin with Single Branch -->
              <div
                v-if="isAdmin && !isEditing && branches.length === 1"
                class="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
              >
                <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  📍 Branch Information
                </h4>
                <div class="text-sm text-blue-800 dark:text-blue-200">
                  <strong>{{ branches[0].name }}</strong>
                  <span class="block text-xs text-blue-600 dark:text-blue-400 mt-1"
                    >This is your only branch - automatically selected</span
                  >
                </div>
              </div>

              <!-- Branch Information Display for Edit Mode -->
              <div
                v-if="isEditing"
                class="mb-6 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4"
              >
                <div class="space-y-2">
                  <div v-if="isSuperAdmin">
                    <label class="block text-xs font-medium text-gray-600 dark:text-gray-400"
                      >School</label
                    >
                    <p class="text-sm text-gray-900 dark:text-white">
                      {{ getSelectedSchoolName() }}
                    </p>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 dark:text-gray-400"
                      >Branch</label
                    >
                    <p class="text-sm text-gray-900 dark:text-white">
                      {{ getSelectedBranchName() }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >Class Name *</label
                >
                <input
                  v-model="form.name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Class 1, Class 2, Class 3"
                />
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >Code *</label
                >
                <input
                  v-model="form.code"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., C1, C2, C3"
                />
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >Description</label
                >
                <textarea
                  v-model="form.description"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter class description"
                ></textarea>
              </div>

              <div class="mb-4">
                <label class="flex items-center">
                  <input
                    v-model="form.is_active"
                    type="checkbox"
                    class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
                </label>
              </div>

              <div v-if="streamsEnabled" class="mb-6">
                <label class="flex items-center">
                  <input
                    v-model="form.has_stream"
                    type="checkbox"
                    class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                    >This class has streams</span
                  >
                </label>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Enable this for classes that have different streams (e.g., Class 11, 12 with
                  Science, Commerce, Arts)
                </p>
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
                  class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {{ isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { Classes } from '~/api';
import { Plus } from 'lucide-vue-next';
import { useAuth } from '~/composables/useAuth';
import { useSchools } from '~/composables/useSchools';
import { useBranches } from '~/composables/useBranches';
import { useToast } from '~/composables/useToast';
import { useAcademicSettings } from '~/utils/settings';
import { useAcademics } from '~/composables/useAcademics';
import Pagination from '~/components/ui/Pagination.vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';

const { isStreamsEnabled } = useAcademicSettings();
const { showError, showWarning, showSuccess } = useToast();
const { schools, fetchSchools } = useSchools();
const { branches, fetchBranches, availableBranches } = useBranches();
const { classes, fetchClasses } = useAcademics();

const showModal = ref(false);
const isEditing = ref(false);
const isSubmitting = ref(false);
const editingId = ref(null);
const streamsEnabled = ref(false);

// Pagination
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
});

const { user, isSuperAdmin, isAdmin } = useAuth();

// Dropdown options
const schoolOptions = computed(() => [
  ...schools.value.map(school => ({
    value: school.id,
    label: school.name
  }))
]);

const branchOptions = computed(() => [
  ...branches.value.map(branch => ({
    value: branch.id,
    label: branch.name
  }))
]);

// School/Branch selection for super admin
const selectedSchoolId = ref('');
const selectedBranchId = ref('');

const form = reactive({
  name: '',
  code: '',
  description: '',
  is_active: true,
  has_stream: false
});

const resetForm = () => {
  form.name = '';
  form.code = '';
  form.description = '';
  form.is_active = true;
  form.has_stream = false;
  selectedSchoolId.value = '';
  selectedBranchId.value = '';
};

// Load streams setting on component mount
const loadStreamsSetting = async () => {
  try {
    const result = await isStreamsEnabled(true);
    streamsEnabled.value = result;
  } catch (error) {
    streamsEnabled.value = false;
  }
};

// Helper functions to get school and branch names
const getSelectedSchoolName = () => {
  if (!selectedSchoolId.value) return 'Not selected';
  const school = schools.value.find(s => s.id === selectedSchoolId.value);
  return school ? `${school.name} ${school.code ? `(${school.code})` : ''}` : 'Unknown school';
};

const getSelectedBranchName = () => {
  if (!selectedBranchId.value) return 'All Branches';
  const branch = branches.value.find(b => b.id === selectedBranchId.value);
  return branch ? branch.name : 'Unknown branch';
};

// Load schools for super admin
const loadSchoolsData = async () => {
  if (!isSuperAdmin.value) return;

  try {
    await fetchSchools();
    if (schools.value.length === 0) {
      showWarning('No schools found');
    }
  } catch (error) {
    showError('Failed to load schools');
  }
};

// Load branches when school is selected
const loadBranchesData = async schoolId => {
  if (!schoolId) {
    return;
  }

  try {
    await fetchBranches(schoolId);
    if (branches.value.length === 0) {
      showWarning('No branches found for this school');
    }
  } catch (error) {
    showError('Failed to load branches');
  }
};

// Load branches for current user's school
const loadBranchesForCurrentSchool = async () => {
  if (isSuperAdmin.value) return; // Super admin uses school selection

  try {
    const schoolId = user.value?.school_id;
    if (!schoolId) {
      return;
    }

    await fetchBranches(schoolId);

    // Auto-select the only branch for Admin if there's only one
    if (isAdmin.value && branches.value.length === 1) {
      selectedBranchId.value = branches.value[0].id;
    }
  } catch (error) {
    showError('Failed to load branches for current school');
  }
};

// Handle school selection change
const onSchoolChange = async () => {
  selectedBranchId.value = '';
  if (selectedSchoolId.value) {
    await loadBranchesData(selectedSchoolId.value);
  }
};

// Handle branch selection change
const onBranchChange = async () => {
  pagination.page = 1; // Reset to first page when branch changes
  await loadClasses();
};

// Pagination functions
const goToPage = async page => {
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  if (page >= 1 && page <= totalPages) {
    pagination.page = page;
    await loadClasses();
  }
};

const changeLimit = async newLimit => {
  pagination.limit = newLimit;
  pagination.page = 1; // Reset to first page
  await loadClasses();
};

const loadClasses = async () => {
  try {
    const options = {
      sort_by: 'sort_order',
      sort_order: 'ASC',
      page: pagination.page,
      limit: pagination.limit,
      useTableData: true // Use table data endpoint
    };

    // Add branch filter if selected
    if (selectedBranchId.value) {
      options.branchId = selectedBranchId.value;
    }

    const response = await fetchClasses(options);

    // Update pagination info from response
    if (response.pagination) {
      pagination.total = response.pagination.total;
    }
  } catch (error) {
    showError('Failed to fetch classes');
  }
};

const openCreateModal = () => {
  resetForm();
  isEditing.value = false;
  editingId.value = null;
  showModal.value = true;
};

const editClass = async classItem => {
  // Set editing mode first
  isEditing.value = true;
  editingId.value = classItem.id;

  // Set school and branch context for super admin
  if (isSuperAdmin.value) {
    selectedSchoolId.value = classItem.school_id;
    // Load branches for the school
    if (classItem.school_id) {
      try {
        await fetchBranches(classItem.school_id);
      } catch (error) {
        showError('Failed to fetch branches for edit');
      }
    }
  }

  // Set branch context for all roles
  selectedBranchId.value = classItem.branch_id;

  // Set form values
  form.name = classItem.name;
  form.code = classItem.code;
  form.description = classItem.description || '';
  form.is_active = classItem.is_active;
  form.has_stream = classItem.has_stream || false;

  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  resetForm();
  editingId.value = null;
  isEditing.value = false;
};

const saveClass = async () => {
  isSubmitting.value = true;
  try {
    const payload = {
      name: form.name,
      code: form.code,
      description: form.description,
      is_active: form.is_active,
      has_stream: form.has_stream
    };

    // Add school_id and branch_id for super admin when creating a new class
    if (!isEditing.value && isSuperAdmin.value) {
      if (!selectedSchoolId.value || !selectedBranchId.value) {
        showWarning('Please select both school and branch first to create the class');
        return;
      }

      payload.school_id = selectedSchoolId.value;
      payload.branch_id = selectedBranchId.value;
    }

    // Add branch_id for school admin when creating a new class
    if (!isEditing.value && isAdmin.value) {
      if (branches.value.length > 1 && !selectedBranchId.value) {
        showWarning('Please select a branch first to create the class');
        return;
      }

      if (selectedBranchId.value) {
        payload.branch_id = selectedBranchId.value;
      } else if (branches.value.length === 1) {
        // Auto-select the only branch
        payload.branch_id = branches.value[0].id;
      } else {
        showError('Please select a branch to create the class');
        return;
      }
    }

    if (isEditing.value) {
      await Classes.update(editingId.value, payload);
    } else {
      await Classes.create(payload);
    }

    closeModal();
    await loadClasses();

    // Show success message
    showSuccess(`Class ${isEditing.value ? 'updated' : 'created'} successfully!`);
  } catch (error) {
    showError('Error saving class. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};

const toggleStatus = async classItem => {
  try {
    await Classes.update(classItem.id, {
      is_active: !classItem.is_active
    });
    await loadClasses();

    // Show success message
    showSuccess(`Class ${classItem.is_active ? 'deactivated' : 'activated'} successfully!`);
  } catch (error) {
    showError('Failed to toggle class status');
  }
};

const deleteClass = async id => {
  if (!confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
    return;
  }

  try {
    await Classes.delete(id);
    await loadClasses();

    // Show success message
    showSuccess('Class deleted successfully!');
  } catch (error) {
    showError('Error deleting class. Please try again.');
  }
};

onMounted(async () => {
  // Load streams setting
  await loadStreamsSetting();

  // Initialize data based on user role
  if (isSuperAdmin.value) {
    await loadSchoolsData();
  } else {
    await loadBranchesForCurrentSchool();
  }

  await loadClasses();
});
</script>
