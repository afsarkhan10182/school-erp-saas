<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Stream Management</h1>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Manage academic streams for any class
            </p>
          </div>
          <button
            @click="openCreateModal"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              ></path>
            </svg>
            Add Stream
          </button>
        </div>
      </div>

      <!-- Streams Table -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Stream Name
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Code
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Class
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Branch
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Description
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
                v-for="stream in streams"
                :key="stream.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ stream.name }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">{{ stream.code }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {{ stream.class?.name }} ({{ stream.class?.code }})
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">{{ stream.branch?.name }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                    {{ stream.description || 'No description' }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      stream.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    ]"
                  >
                    {{ stream.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    @click="editStream(stream)"
                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    @click="toggleStatus(stream)"
                    class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3"
                  >
                    {{ stream.is_active ? 'Deactivate' : 'Activate' }}
                  </button>
                  <button
                    @click="deleteStream(stream)"
                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-if="streams.length === 0 && !loading" class="text-center py-12">
          <svg
            class="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No streams found</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating a new stream for any class.
          </p>
          <div class="mt-6">
            <button
              @click="openCreateModal"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                ></path>
              </svg>
              Add Stream
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading streams...</p>
        </div>
      </div>

      <!-- Pagination -->
      <Pagination
        v-if="pagination.total > 0"
        :pagination="{
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total
        }"
        item-label="streams"
        @page-changed="handlePageChange"
        @page-size-changed="onPageSizeChange"
      />
    </div>

    <!-- Create/Edit Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    >
      <div
        class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800"
      >
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ isEditing ? 'Edit Stream' : 'Create New Stream' }}
          </h3>

          <form @submit.prevent="handleSubmit">
            <!-- School Selection (Super Admin Only) - Create Mode Only -->
            <div v-if="userRole === 'super_admin' && !isEditing" class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >School *</label
              >
              <select
                v-model="form.school_id"
                @change="onSchoolChange"
                required
                :disabled="loading"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">{{ loading ? 'Loading schools...' : 'Select School' }}</option>
                <option v-for="school in schools" :key="school.id" :value="school.id">
                  {{ school.name }}
                </option>
              </select>
            </div>

            <!-- Branch Selection (Super Admin & School Admin) - Create Mode Only -->
            <div v-if="userRole !== 'branch_admin' && !isEditing" class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >Branch *</label
              >
              <select
                v-model="form.branch_id"
                @change="onBranchChange"
                required
                :disabled="loading"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">{{ loading ? 'Loading branches...' : 'Select Branch' }}</option>
                <option v-for="branch in availableBranches" :key="branch.id" :value="branch.id">
                  {{ branch.name }}
                </option>
              </select>
            </div>

            <!-- Class Selection - Create Mode Only -->
            <div v-if="!isEditing" class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >Class *</label
              >
              <select
                v-model="form.class_id"
                required
                :disabled="loading"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">{{ loading ? 'Loading classes...' : 'Select Class' }}</option>
                <option
                  v-for="classItem in availableClasses"
                  :key="classItem.id"
                  :value="classItem.id"
                >
                  {{ classItem.name }} ({{ classItem.code }})
                </option>
              </select>
            </div>

            <!-- Stream Information Display for Edit Mode -->
            <div
              v-if="isEditing"
              class="mb-6 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4"
            >
              <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                📍 Stream Information
              </h4>
              <div class="space-y-2">
                <div v-if="userRole === 'super_admin'">
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
                <div>
                  <label class="block text-xs font-medium text-gray-600 dark:text-gray-400"
                    >Class</label
                  >
                  <p class="text-sm text-gray-900 dark:text-white">
                    {{ getSelectedClassName() }}
                  </p>
                </div>
              </div>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >Stream Name *</label
              >
              <input
                v-model="form.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Science IT, Commerce General"
              />
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >Stream Code (Optional)</label
              >
              <input
                v-model="form.code"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Leave empty to auto-generate (e.g., SCI-IT, COM-GEN)"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Code will be auto-generated from the stream name if left empty
              </p>
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
                :disabled="submitting || !canSubmit"
                class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {{ submitting ? 'Saving...' : isEditing ? 'Update' : 'Create' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Apply settings check middleware for streams
definePageMeta({
  middleware: 'settings-check',
  settingsCheck: {
    setting: 'streams',
    redirectPath: '/academic/sections',
    errorMessage:
      'Streams feature is currently disabled. Please enable streams in Academic Settings to access this feature.',
    errorCode: 'streams_disabled'
  }
});

import { ref, reactive, onMounted, computed, onBeforeUnmount } from 'vue';
import { useToast } from '~/composables/useToast';
import { useAuth } from '~/composables/useAuth';
import { useSchools } from '~/composables/useSchools';
import { useBranches } from '~/composables/useBranches';
import { useAcademics } from '~/composables/useAcademics';
import { useAcademicSettings } from '~/utils/settings';
import { Streams } from '~/api';
import Pagination from '~/components/ui/Pagination.vue';

// Composables
const { showToast } = useToast();
const { user } = useAuth();
const { schools, fetchSchools } = useSchools();
const { branches, fetchAllBranches, fetchBranches } = useBranches();
const { classes, fetchClasses } = useAcademics();
const { isStreamsEnabled } = useAcademicSettings();

// Reactive data
const streams = ref<any[]>([]);
const loading = ref(false);
const submitting = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const editingStream = ref<any>(null);

// Pagination
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
});

// Form data
const form = reactive({
  school_id: '',
  branch_id: '',
  class_id: '',
  name: '',
  code: '',
  is_active: true
});

// Computed properties
const userRole = computed(() => user.value?.role);
const modalTitle = computed(() => (isEditing.value ? 'Edit Stream' : 'Create New Stream'));

// Computed property to check if form can be submitted
const canSubmit = computed(() => {
  const hasBasicFields = form.name && form.class_id;

  if (userRole.value === 'super_admin') {
    if (!form.school_id || !form.branch_id) return false;
  } else if (userRole.value === 'school_admin') {
    if (!form.branch_id) return false;
  }

  return hasBasicFields;
});

// Available data based on user role and selections
const availableBranches = computed(() => {
  if (userRole.value === 'super_admin') {
    return branches.value.filter(branch => !form.school_id || branch.school_id === form.school_id);
  } else if (userRole.value === 'school_admin') {
    return branches.value.filter(branch => branch.school_id === user.value?.school_id);
  } else {
    return branches.value.filter(branch => branch.id === user.value?.branch_id);
  }
});

const availableClasses = computed(() => {
  console.log('🔍 Available classes - All classes:', classes.value);

  // If no classes loaded yet, return empty array
  if (!classes.value || classes.value.length === 0) {
    console.log('🔍 No classes loaded yet');
    return [];
  }

  // Show all available classes - let user choose which class to add streams to
  const filteredClasses = classes.value.filter(classItem => {
    console.log(`🔍 Class ${classItem.name} (${classItem.code}): ✅ Available for streams`);
    return true; // Show all classes
  });
  console.log('🔍 Available classes - Filtered:', filteredClasses);
  return filteredClasses;
});

// Methods
const loadStreams = async () => {
  loading.value = true;
  try {
    // Check if user is authenticated
    if (!user.value) {
      console.error('User not authenticated');
      showToast('Please log in to access streams', 'error');
      return;
    }

    // Check if user has required role
    const allowedRoles = ['super_admin', 'school_admin', 'branch_admin'];
    if (!allowedRoles.includes(user.value.role)) {
      console.error('User role not allowed:', user.value.role);
      showToast('You do not have permission to access streams', 'error');
      return;
    }

    console.log('Loading streams with user:', {
      id: user.value.id,
      role: user.value.role,
      school_id: user.value.school_id,
      branch_id: user.value.branch_id
    });

    const params = {
      page: pagination.page,
      limit: pagination.limit
    };

    console.log('Streams API params:', params);
    const response = await Streams.getAll(params);
    console.log('Streams API response:', response);

    if (response.success) {
      // Handle paginated response structure
      if (response.data && typeof response.data === 'object' && 'items' in response.data) {
        // Paginated response
        streams.value = Array.isArray(response.data.items) ? response.data.items : [];
        pagination.total = response.data.total || 0;
        pagination.totalPages = response.data.totalPages || 0;
      } else {
        // Direct array response
        streams.value = Array.isArray(response.data) ? response.data : [];
      }
      console.log('Streams loaded successfully:', streams.value.length);
    } else {
      console.error('Streams API error:', response);
      showToast(response.message || 'Failed to load streams', 'error');
    }
  } catch (error: any) {
    console.error('Error loading streams:', error);
    if (error.response?.status === 401) {
      showToast('Please log in again', 'error');
    } else if (error.response?.status === 403) {
      showToast('You do not have permission to access streams', 'error');
    } else {
      showToast('Failed to load streams', 'error');
    }
  } finally {
    loading.value = false;
  }
};

const openCreateModal = () => {
  isEditing.value = false;
  editingStream.value = null;
  resetForm();
  showModal.value = true;
};

const editStream = (stream: any) => {
  isEditing.value = true;
  editingStream.value = stream;

  // Populate form
  form.school_id = stream.school_id;
  form.branch_id = stream.branch_id;
  form.class_id = stream.class_id;
  form.name = stream.name;
  form.code = stream.code;
  form.is_active = stream.is_active;

  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  resetForm();
};

const resetForm = () => {
  form.name = '';
  form.code = '';
  form.is_active = true;
  form.class_id = '';
  if (userRole.value === 'super_admin') {
    form.school_id = '';
    form.branch_id = '';
  } else if (userRole.value === 'school_admin') {
    form.branch_id = '';
  }
};

const onSchoolChange = async () => {
  form.branch_id = '';
  // Don't clear class_id - allow class selection regardless of school/branch
  if (form.school_id) {
    await fetchBranches(form.school_id);
  }
};

const onBranchChange = async () => {
  // Don't clear class_id - allow class selection regardless of branch
  if (form.branch_id) {
    const schoolId = userRole.value === 'super_admin' ? form.school_id : user.value?.school_id;
    console.log('🔍 Fetching classes for school:', schoolId, 'branch:', form.branch_id);
    await fetchClasses({
      schoolId: schoolId,
      branchId: form.branch_id
    });
  }
};

const handleSubmit = async () => {
  submitting.value = true;
  try {
    console.log('🔍 Submitting stream form:', form);
    console.log('🔍 User role:', userRole.value);
    console.log('🔍 User data:', user.value);

    const streamData = {
      name: form.name,
      code: form.code,
      class_id: form.class_id,
      school_id: (userRole.value === 'super_admin' ? form.school_id : user.value?.school_id) || '',
      branch_id: userRole.value === 'branch_admin' ? user.value?.branch_id : form.branch_id
    };

    console.log('🔍 Final stream data to submit:', streamData);

    let response;
    if (isEditing.value && editingStream.value) {
      console.log('🔍 Updating stream with ID:', editingStream.value.id);
      response = await Streams.update(editingStream.value.id, streamData);
    } else {
      console.log('🔍 Creating new stream');
      response = await Streams.create(streamData);
    }

    console.log('🔍 Stream API response:', response);

    if (response.success) {
      showToast(`Stream ${isEditing.value ? 'updated' : 'created'} successfully`, 'success');
      closeModal();
      loadStreams();
    } else {
      showToast(
        response.message || `Failed to ${isEditing.value ? 'update' : 'create'} stream`,
        'error'
      );
    }
  } catch (error) {
    console.error('Error submitting stream:', error);
    showToast(`Failed to ${isEditing.value ? 'update' : 'create'} stream`, 'error');
  } finally {
    submitting.value = false;
  }
};

const toggleStatus = async (stream: any) => {
  try {
    const response = await Streams.update(stream.id, {
      name: stream.name,
      code: stream.code,
      class_id: stream.class_id,
      school_id: stream.school_id,
      branch_id: stream.branch_id,
      is_active: !stream.is_active
    });

    if (response.success) {
      showToast(`Stream ${stream.is_active ? 'deactivated' : 'activated'} successfully`, 'success');
      loadStreams();
    } else {
      showToast(response.message || 'Failed to toggle stream status', 'error');
    }
  } catch (error) {
    console.error('Error toggling stream status:', error);
    showToast('Failed to toggle stream status', 'error');
  }
};

const deleteStream = async (stream: any) => {
  if (!confirm(`Are you sure you want to delete the stream "${stream.name}"?`)) {
    return;
  }

  try {
    const response = await Streams.delete(stream.id);

    if (response.success) {
      showToast('Stream deleted successfully', 'success');
      loadStreams();
    } else {
      showToast(response.message || 'Failed to delete stream', 'error');
    }
  } catch (error) {
    console.error('Error deleting stream:', error);
    showToast('Failed to delete stream', 'error');
  }
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  loadStreams();
};

const onPageSizeChange = (limit: number) => {
  pagination.limit = limit;
  loadStreams();
};

// Helper functions for edit mode display
const getSelectedSchoolName = () => {
  if (!editingStream.value?.school_id) return 'N/A';
  const school = schools.value.find(s => s.id === editingStream.value.school_id);
  return school ? school.name : 'N/A';
};

const getSelectedBranchName = () => {
  if (!editingStream.value?.branch_id) return 'N/A';
  const branch = branches.value.find(b => b.id === editingStream.value.branch_id);
  return branch ? branch.name : 'N/A';
};

const getSelectedClassName = () => {
  if (!editingStream.value?.class_id) return 'N/A';
  const classItem = classes.value.find(c => c.id === editingStream.value.class_id);
  return classItem ? `${classItem.name} (${classItem.code})` : 'N/A';
};

// Load initial data
onMounted(async () => {
  try {
    // Check streams setting first (fallback check)
    console.log('🔍 Fallback: Checking streams setting...');
    try {
      const streamsEnabled = await isStreamsEnabled();
      if (!streamsEnabled) {
        console.log('🚫 Streams are disabled, redirecting to sections...');
        showToast('Streams feature is disabled. Please enable it in Academic Settings.', 'error');
        await navigateTo({
          path: '/academic/sections',
          query: {
            error: 'streams_disabled',
            message:
              'Streams feature is currently disabled. Please enable streams in Academic Settings to access this feature.'
          }
        });
        return;
      }
      console.log('✅ Streams are enabled');
    } catch (error) {
      console.error('❌ Error checking streams setting:', error);
      showToast('Unable to verify streams setting. Please try again.', 'error');
      await navigateTo({
        path: '/academic/sections',
        query: {
          error: 'streams_check_failed',
          message: 'Unable to verify streams setting. Please try again.'
        }
      });
      return;
    }

    // Check authentication first
    console.log('🔍 Checking authentication status...');
    console.log('User:', user.value);
    console.log('Is logged in:', !!user.value);

    if (!user.value) {
      console.log('❌ User not authenticated, redirecting to login...');
      showToast('Please log in to access streams', 'error');
      // Wait a moment then redirect
      setTimeout(() => {
        navigateTo('/auth/login');
      }, 2000);
      return;
    }

    console.log('✅ User authenticated:', {
      id: user.value.id,
      role: user.value.role,
      email: user.value.email,
      school_id: user.value.school_id,
      branch_id: user.value.branch_id
    });

    // Load schools and branches first
    const [schoolsResult, branchesResult] = await Promise.allSettled([
      fetchSchools(),
      fetchAllBranches()
    ]);

    // Load classes based on user context
    let classesResult;
    if (userRole.value === 'super_admin') {
      // For super admin, we'll load classes when they select a school/branch
      classesResult = { status: 'fulfilled', value: [] };
    } else if (userRole.value === 'school_admin') {
      // For school admin, load classes for their school
      classesResult = await Promise.allSettled([fetchClasses({ schoolId: user.value?.school_id })]).then(
        results => results[0]
      );
    } else if (userRole.value === 'branch_admin') {
      // For branch admin, load classes for their branch
      classesResult = await Promise.allSettled([
        fetchClasses({
          schoolId: user.value?.school_id,
          branchId: user.value?.branch_id
        })
      ]).then(results => results[0]);
    } else {
      classesResult = { status: 'fulfilled', value: [] };
    }

    console.log('🔍 Data loading results:');
    console.log('Schools result:', schoolsResult);
    console.log('Branches result:', branchesResult);
    console.log('Classes result:', classesResult);
    console.log('🔍 Current classes value:', classes.value);

    // Load streams after other data is loaded
    await loadStreams();
  } catch (error) {
    console.error('Error loading initial data:', error);
    showToast('Failed to load initial data', 'error');
  }
});
</script>

<style scoped>
.container {
  max-width: 1024px;
}
</style>
