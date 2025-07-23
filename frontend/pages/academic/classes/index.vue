<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Class Management</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">Manage academic classes for each branch</p>
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

      <!-- Classes List -->
      <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">Academic Classes</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Class Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Code</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Branch</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sections</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="classItem in classes" :key="classItem.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {{ classItem.name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ classItem.code }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <div v-if="classItem.branch" class="flex items-center">
                    <div class="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span class="font-medium">{{ classItem.branch?.name }}</span>
                    <span v-if="classItem.branch?.code" class="text-gray-500 dark:text-gray-400 ml-1">({{ classItem.branch.code }})</span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ classItem.sections?.length || 0 }} sections
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="{
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': classItem.is_active,
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': !classItem.is_active,
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
      </div>

      <!-- Create/Edit Modal -->
      <div v-if="showModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[100]">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {{ isEditing ? 'Edit Class' : 'Create New Class' }}
            </h3>
            
            <form @submit.prevent="saveClass">
              <!-- School Selector for Super Admin -->
              <div v-if="authStore.user?.role === 'super_admin' && !isEditing" class="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">📍 Select School & Branch</h4>
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
                  <div v-if="selectedSchoolId">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Branch *</label>
                    <select
                      v-model="selectedBranchId"
                      required
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select a branch</option>
                      <option v-for="branch in availableBranches" :key="branch.id" :value="branch.id">
                        {{ branch.name }} {{ branch.code ? `(${branch.code})` : '' }}
                      </option>
                    </select>
                  </div>
                  <div v-if="!selectedSchoolId || !selectedBranchId" class="text-xs text-blue-600 dark:text-blue-400">
                    ⚠️ Please select both school and branch before creating the class
                  </div>
                </div>
              </div>

              <!-- Branch Selector for School Admin -->
              <div v-if="authStore.user?.role === 'school_admin' && !isEditing && availableBranches.length > 1" class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Branch *</label>
                    <select
                      v-model="selectedBranchId"
                      required
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select a branch</option>
                      <option v-for="branch in availableBranches" :key="branch.id" :value="branch.id">
                        {{ branch.name }} {{ branch.code ? `(${branch.code})` : '' }}
                      </option>
                    </select>
              </div>

              <!-- Branch Information Display for School Admin with Single Branch -->
              <div v-if="authStore.user?.role === 'school_admin' && !isEditing && availableBranches.length === 1" class="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">📍 Branch Information</h4>
                <div class="text-sm text-blue-800 dark:text-blue-200">
                  <strong>{{ availableBranches[0].name }}</strong>
                  <span v-if="availableBranches[0].code" class="text-blue-600 dark:text-blue-300"> ({{ availableBranches[0].code }})</span>
                  <span class="block text-xs text-blue-600 dark:text-blue-400 mt-1">This is your only branch - automatically selected</span>
                </div>
              </div>

              <!-- Branch Information Display for Edit Mode -->
              <div v-if="isEditing" class="mb-6 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">📍 Branch Information</h4>
                <div class="space-y-2">
                  <div v-if="authStore.user?.role === 'super_admin'">
                    <label class="block text-xs font-medium text-gray-600 dark:text-gray-400">School</label>
                    <p class="text-sm text-gray-900 dark:text-white">
                      {{ getSelectedSchoolName() }}
                    </p>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 dark:text-gray-400">Branch</label>
                    <p class="text-sm text-gray-900 dark:text-white">
                      {{ getSelectedBranchName() }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Class Name *</label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Class 1, Class 2, Class 3"
                />
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Code *</label>
                <input
                  v-model="form.code"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., C1, C2, C3"
                />
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  v-model="form.description"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter class description"
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
                  class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {{ isSubmitting ? 'Saving...' : (isEditing ? 'Update' : 'Create') }}
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
import { ref, reactive, onMounted } from 'vue';
import { apiClient } from '~/utils/api';
import { Plus } from 'lucide-vue-next';
import { useAuthStore } from '~/stores/auth';
import { useBranchContext } from '~/composables/useBranchContext';
import { useToast } from '~/composables/useToast';

const { showError, showWarning } = useToast();

const classes = ref([]);
const isLoading = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const isSubmitting = ref(false);
const editingId = ref(null);

const authStore = useAuthStore();
const { getBranchContext } = useBranchContext();

// School/Branch selection for super admin
const selectedSchoolId = ref('');
const selectedBranchId = ref('');
const availableSchools = ref([]);
const availableBranches = ref([]);

const form = reactive({
  name: '',
  code: '',
  description: '',
  is_active: true
});

const resetForm = () => {
  form.name = '';
  form.code = '';
  form.description = '';
  form.is_active = true;
  selectedSchoolId.value = '';
  selectedBranchId.value = '';
};

// Helper functions to get school and branch names
const getSelectedSchoolName = () => {
  if (!selectedSchoolId.value) return 'Not selected';
  const school = availableSchools.value.find(s => s.id === selectedSchoolId.value);
  return school ? `${school.name} ${school.code ? `(${school.code})` : ''}` : 'Unknown school';
};

const getSelectedBranchName = () => {
  if (!selectedBranchId.value) return 'Not selected';
  const branch = availableBranches.value.find(b => b.id === selectedBranchId.value);
  return branch ? `${branch.name} ${branch.code ? `(${branch.code})` : ''}` : 'Unknown branch';
};

// Fetch schools for super admin
const fetchSchools = async () => {
  if (authStore.user?.role !== 'super_admin') return;
  
  try {
    const response = await apiClient.schools.getAll();
    availableSchools.value = response.data?.schools || [];
  } catch (error) {
    console.error('Error fetching schools:', error);
    availableSchools.value = [];
  }
};

// Fetch branches when school is selected
const fetchBranchesForSchool = async (schoolId) => {
  if (!schoolId) {
    availableBranches.value = [];
    return;
  }
  
  try {
    const response = await apiClient.branches.getBySchool(schoolId);
    availableBranches.value = response.data?.branches || [];
  } catch (error) {
    console.error('Error fetching branches:', error);
    availableBranches.value = [];
  }
};

// Fetch branches for current user's school
const fetchBranchesForCurrentSchool = async () => {
  if (authStore.user?.role === 'super_admin') return; // Super admin uses school selection
  
  try {
    const schoolId = authStore.user?.school_id;
    if (!schoolId) {
      console.error('No school_id found for user:', authStore.user);
      return;
    }
    
    console.log('Fetching branches for school:', schoolId);
    const response = await apiClient.branches.getBySchool(schoolId);
    console.log('Branches response:', response);
    
    availableBranches.value = response.data?.branches || response.data?.items || [];
    
    // Auto-select the only branch for School Admin if there's only one
    if (authStore.user?.role === 'school_admin' && availableBranches.value.length === 1) {
      selectedBranchId.value = availableBranches.value[0].id;
      console.log('Auto-selected branch:', selectedBranchId.value);
    }
    
    console.log('Available branches after fetch:', availableBranches.value);
  } catch (error) {
    console.error('Error fetching branches for current school:', error);
    availableBranches.value = [];
  }
};

// Handle school selection change
const onSchoolChange = async () => {
  selectedBranchId.value = '';
  if (selectedSchoolId.value) {
    await fetchBranchesForSchool(selectedSchoolId.value);
  } else {
    availableBranches.value = [];
  }
};

// Handle branch selection change
const onBranchChange = async () => {
  await fetchClasses();
};

const fetchClasses = async () => {
  isLoading.value = true;
  try {
    const params = {};
    
    // Add branch filter if selected
    if (selectedBranchId.value) {
      params.branch_id = selectedBranchId.value;
    }
    
    const response = await apiClient.classes.getAll(params);
    classes.value = response.data || [];
  } catch (error) {
    console.error('Error fetching classes:', error);
  } finally {
    isLoading.value = false;
  }
};

const openCreateModal = () => {
  resetForm();
  isEditing.value = false;
  editingId.value = null;
  showModal.value = true;
};

const editClass = async (classItem) => {
  console.log('🔍 Editing class:', classItem);
  
  // Set editing mode first
  isEditing.value = true;
  editingId.value = classItem.id;
  
  // Set school and branch context for super admin
  if (authStore.user?.role === 'super_admin') {
    selectedSchoolId.value = classItem.school_id;
    // Load branches for the school
    if (classItem.school_id) {
      try {
        await fetchBranchesForSchool(classItem.school_id);
      } catch (error) {
        console.error('Error fetching branches for edit:', error);
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
      is_active: form.is_active
    };

    // Add school_id and branch_id for super admin when creating a new class
    if (!isEditing.value && authStore.user?.role === 'super_admin') {
      if (!selectedSchoolId.value || !selectedBranchId.value) {
        showWarning('Please select both school and branch first to create the class');
        return;
      }
      
      payload.school_id = selectedSchoolId.value;
      payload.branch_id = selectedBranchId.value;
    }

    // Add branch_id for school admin when creating a new class
    if (!isEditing.value && authStore.user?.role === 'school_admin') {
      // For School Admin, branch_id is always required
      if (availableBranches.length > 1 && !selectedBranchId.value) {
        showWarning('Please select a branch first to create the class');
        return;
      }
      
      if (selectedBranchId.value) {
        payload.branch_id = selectedBranchId.value;
      } else if (availableBranches.length === 1) {
        // Auto-select the only branch
        payload.branch_id = availableBranches[0].id;
      } else {
        // Fallback: try to get branch from user context
        const branchContext = getBranchContext();
        console.log('Branch context:', branchContext);
        console.log('Available branches:', availableBranches.value);
        console.log('Selected branch ID:', selectedBranchId.value);
        
        if (branchContext?.branchId) {
          payload.branch_id = branchContext.branchId;
        } else if (authStore.user?.branch_id) {
          // Use user's assigned branch as last resort
          payload.branch_id = authStore.user.branch_id;
        } else {
          showError('Unable to determine branch. Please refresh the page and try again.');
          return;
        }
      }
    }

    // Branch admin doesn't need to specify branch_id - it's automatically their branch

    if (isEditing.value) {
      await apiClient.classes.update(editingId.value, payload);
    } else {
      await apiClient.classes.create(payload);
    }

    closeModal();
    await fetchClasses();
    
    // Show success message
    if (import.meta.client) {
      console.log('Dispatching success toast event');
      const event = new CustomEvent('show-toast', {
        detail: {
          message: `Class ${isEditing.value ? 'updated' : 'created'} successfully!`,
          type: 'success',
          duration: 5000
        }
      });
      window.dispatchEvent(event);
      console.log('Success toast event dispatched');
    }
  } catch (error) {
    console.error('Error saving class:', error);
    // Show error message
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('show-toast', {
        detail: {
          message: 'Error saving class. Please try again.',
          type: 'error',
          duration: 5000
        }
      });
      window.dispatchEvent(event);
    }
  } finally {
    isSubmitting.value = false;
  }
};

const toggleStatus = async (classItem) => {
  try {
    await apiClient.classes.update(classItem.id, {
      is_active: !classItem.is_active
    });
    await fetchClasses();
    
    // Show success message
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('show-toast', {
        detail: {
          message: `Class ${classItem.is_active ? 'deactivated' : 'activated'} successfully!`,
          type: 'success',
          duration: 5000
        }
      });
      window.dispatchEvent(event);
    }
  } catch (error) {
    console.error('Error toggling class status:', error);
  }
};

const deleteClass = async (id) => {
  if (!confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
    return;
  }
  
  try {
    await apiClient.classes.delete(id);
    await fetchClasses();
    
    // Show success message
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('show-toast', {
        detail: {
          message: 'Class deleted successfully!',
          type: 'success',
          duration: 5000
        }
      });
      window.dispatchEvent(event);
    }
  } catch (error) {
    console.error('Error deleting class:', error);
    // Show error message
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('show-toast', {
        detail: {
          message: 'Error deleting class. Please try again.',
          type: 'error',
          duration: 5000
        }
      });
      window.dispatchEvent(event);
    }
  }
};

onMounted(async () => {
  fetchClasses();
  
  // Fetch schools for super admin
  if (authStore.user?.role === 'super_admin') {
    fetchSchools();
  }
  
  // Fetch branches for school admin
  if (authStore.user?.role === 'school_admin') {
    await fetchBranchesForCurrentSchool();
    console.log('Branches fetched for school admin:', availableBranches.value);
  }
});
</script> 