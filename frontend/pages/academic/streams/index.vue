<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Stream Management</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage academic streams for each class
        </p>
      </div>
      <div>
        <button
          @click="openCreateModal"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-150"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50/80 dark:bg-gray-900/40">
            <tr>
              <th
                class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Stream Name
              </th>
              <th
                class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Code
              </th>
              <th
                class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Class
              </th>
              <th
                class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Branch
              </th>
              <th
                class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Description
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
              v-for="stream in streams"
              :key="stream.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
            >
              <td class="px-5 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {{ stream.name }}
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                {{ stream.code }}
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                {{ stream.class?.name }} ({{ stream.class?.code }})
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                <span class="font-medium">{{ stream.branch?.name || '-' }}</span>
              </td>
              <td class="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                {{ stream.description || '—' }}
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                    stream.is_active
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                  ]"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="stream.is_active ? 'bg-emerald-500' : 'bg-rose-500'"
                  ></span>
                  {{ stream.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap text-right text-sm font-medium">
                <button
                  @click="editStream(stream)"
                  class="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3 hover:underline"
                >
                  Edit
                </button>
                <button
                  @click="toggleStatus(stream)"
                  class="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 mr-3 hover:underline"
                >
                  {{ stream.is_active ? 'Deactivate' : 'Activate' }}
                </button>
                <button
                  @click="deleteStream(stream)"
                  class="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:underline"
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
        <p class="text-base font-medium text-gray-900 dark:text-white">No streams found</p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Get started by creating a new stream for any class.
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mx-auto"></div>
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

    <!-- Create/Edit Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 w-full max-w-md shadow-xl space-y-4"
      >
        <h3 class="text-lg font-bold text-gray-900 dark:text-white">
          {{ isEditing ? 'Edit Stream' : 'Create New Stream' }}
        </h3>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Class Selection - Create Mode Only -->
          <div v-if="!isEditing">
            <EnhancedDropdown
              v-model="form.class_id"
              label="Class"
              :options="classDropdownOptions"
              placeholder="Select Class"
              :required="true"
              :disabled="loading"
              :loading="loading"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >Stream Name <span class="text-rose-500">*</span></label
            >
            <input
              v-model="form.name"
              type="text"
              required
              class="input-field"
              placeholder="e.g., Science IT, Commerce General"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >Stream Code (Optional)</label
            >
            <input
              v-model="form.code"
              type="text"
              class="input-field"
              placeholder="Leave empty to auto-generate (e.g., SCI-IT, COM-GEN)"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Code will be auto-generated from the stream name if left empty
            </p>
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
              :disabled="submitting || !canSubmit"
              class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {{ submitting ? 'Saving...' : isEditing ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    <ConfirmDialog
      :open="deleteDialog.open"
      title="Delete stream"
      message="Are you sure you want to delete this stream?"
      confirm-label="Delete"
      @confirm="confirmDeleteStream"
      @cancel="deleteDialog.open = false"
    />
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

import { ref, reactive, onMounted, computed, onBeforeUnmount, watch } from 'vue';
import { useToast } from '~/composables/useToast';
import { useAuth } from '~/composables/useAuth';
import { useAuthStore } from '~/stores/auth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useSchools } from '~/composables/useSchools';
import { useBranches } from '~/composables/useBranches';
import { useAcademics } from '~/composables/useAcademics';
import { Streams } from '~/api';
import Pagination from '~/components/ui/Pagination.vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue';

// Composables
const authStore = useAuthStore();
const deleteDialog = reactive({ open: false, id: '', name: '' });
const { selectedBranchId: globalBranchId } = useGlobalBranch();
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
const filterBranchId = ref('');

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
  description: '',
  is_active: true
});

// Computed properties
const userRole = computed(() => user.value?.role);
const modalTitle = computed(() => (isEditing.value ? 'Edit Stream' : 'Create New Stream'));

const classDropdownOptions = computed(() =>
  (classes.value || []).map(c => ({
    label: `${c.name} (${c.code})`,
    value: c.id
  }))
);

// Computed property to check if form can be submitted
const canSubmit = computed(() => {
  const hasBasicFields = form.name && form.class_id;

  if (userRole.value === 'super_admin') {
    if (!form.school_id || !form.branch_id) return false;
  } else if (userRole.value === 'admin') {
    if (!form.branch_id) return false;
  }

  return hasBasicFields;
});

// Available data based on user role and selections
const availableBranches = computed(() => {
  if (userRole.value === 'super_admin') {
    return branches.value.filter(branch => !form.school_id || branch.school_id === form.school_id);
  } else if (userRole.value === 'admin') {
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
    const allowedRoles = ['super_admin', 'admin', 'branch_admin'];
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

    const params: any = {
      page: pagination.page,
      limit: pagination.limit
    };
    const activeBranchId = globalBranchId.value || filterBranchId.value;
    if (activeBranchId) params.branch_id = activeBranchId;
    if (authStore.currentSchool?.id) params.school_id = authStore.currentSchool.id;

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

  if (globalBranchId.value) {
    form.branch_id = globalBranchId.value;
  }
  if (authStore.currentSchool?.id) {
    form.school_id = authStore.currentSchool.id;
  }

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
  } else if (userRole.value === 'admin') {
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
  deleteDialog.id = stream.id;
  deleteDialog.name = stream.name;
  deleteDialog.open = true;
};

const confirmDeleteStream = async () => {
  try {
    const response = await Streams.delete(deleteDialog.id);

    if (response.success) {
      showToast('Stream deleted successfully', 'success');
      loadStreams();
    } else {
      showToast(response.message || 'Failed to delete stream', 'error');
    }
  } catch (error) {
    console.error('Error deleting stream:', error);
    showToast('Failed to delete stream', 'error');
  } finally {
    deleteDialog.open = false;
    deleteDialog.id = '';
    deleteDialog.name = '';
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
    } else if (userRole.value === 'admin') {
      // For school admin, load classes for their school
      classesResult = await Promise.allSettled([
        fetchClasses({ schoolId: user.value?.school_id })
      ]).then(results => results[0]);
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

watch(globalBranchId, async () => {
  pagination.page = 1;
  await loadStreams();
});
</script>

<style scoped>
.container {
  max-width: 1024px;
}
</style>
