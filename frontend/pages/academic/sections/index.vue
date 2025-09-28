<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Streams Disabled Alert -->
      <div
        v-if="$route.query.error === 'streams_disabled'"
        class="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
      >
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Streams Feature Disabled
            </h3>
            <p class="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
              {{
                $route.query.message ||
                'Streams feature is currently disabled. Please enable streams in Academic Settings to access the streams management page.'
              }}
            </p>
          </div>
        </div>
      </div>

      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Section Management</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Manage academic sections for each class and branch
          </p>
        </div>
        <div class="mt-4 sm:mt-0 sm:flex sm:space-x-3">
          <button
            @click="openCreateModal"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus class="-ml-1 mr-2 h-5 w-5" />
            Add Section
          </button>
        </div>
      </div>

      <!-- Sections List -->
      <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Section Name
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Class
                </th>
                <th
                  v-if="streamsEnabled"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Stream
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Branch
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Capacity
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
                v-for="section in sections"
                :key="section.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"
                >
                  {{ section.name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ section.class?.name }} ({{ section.class?.code }})
                </td>
                <td
                  v-if="streamsEnabled"
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                >
                  <span
                    v-if="section.stream"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                  >
                    {{ section.stream.name }} ({{ section.stream.code }})
                  </span>
                  <span v-else class="text-gray-400 dark:text-gray-500 text-xs">No Stream</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <div class="flex items-center">
                    <span class="font-medium">{{ section.branch?.name }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ section.capacity }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="{
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200':
                        section.is_active,
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200':
                        !section.is_active
                    }"
                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  >
                    {{ section.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    @click="editSection(section)"
                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    @click="toggleStatus(section)"
                    class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3"
                  >
                    {{ section.is_active ? 'Deactivate' : 'Activate' }}
                  </button>
                  <button
                    @click="deleteSection(section.id)"
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
      <div
        v-if="showModal"
        class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      >
        <div
          class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800"
        >
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {{ isEditing ? 'Edit Section' : 'Create New Section' }}
            </h3>

            <form @submit.prevent="saveSection">
              <!-- School Selection (Super Admin Only) - Create Mode Only -->
              <div v-if="userRole === 'super_admin' && !isEditing" class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >School *</label
                >
                <select
                  v-model="selectedSchoolId"
                  @change="onSchoolChange"
                  required
                  :disabled="loadingSchools"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">
                    {{ loadingSchools ? 'Loading schools...' : 'Select School' }}
                  </option>
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
                  v-model="selectedBranchId"
                  @change="onBranchChange"
                  required
                  :disabled="!selectedSchoolId || loadingBranches"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">
                    {{ loadingBranches ? 'Loading branches...' : 'Select Branch' }}
                  </option>
                  <option v-for="branch in branches" :key="branch.id" :value="branch.id">
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
                  v-model="selectedClassId"
                  required
                  :disabled="!selectedBranchId || loadingClasses"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  @change="onClassChange"
                >
                  <option value="">
                    {{ loadingClasses ? 'Loading classes...' : 'Select Class' }}
                  </option>
                  <option
                    v-for="classItem in availableClasses"
                    :key="classItem.id"
                    :value="classItem.id"
                  >
                    {{ classItem.name }} ({{ classItem.code }})
                  </option>
                </select>
              </div>

              <!-- Stream Selection - Only if streams are enabled and class has streams -->
              <div v-if="streamsEnabled && !isEditing && hasStreams" class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Stream *</label
                >
                <select
                  v-model="selectedStreamId"
                  required
                  :disabled="!selectedClassId || loadingStreams"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  @change="onStreamChange"
                >
                  <option value="">
                    {{ loadingStreams ? 'Loading streams...' : 'Select Stream' }}
                  </option>
                  <option v-for="stream in availableStreams" :key="stream.id" :value="stream.id">
                    {{ stream.name }} ({{ stream.code }})
                  </option>
                </select>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Stream is required for this class
                </p>
              </div>

              <!-- Branch and Class Information Display for Edit Mode -->
              <div
                v-if="isEditing"
                class="mb-6 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4"
              >
                <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  📍 Section Information
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
                  <div v-if="streamsEnabled && hasStreams">
                    <label class="block text-xs font-medium text-gray-600 dark:text-gray-400"
                      >Stream</label
                    >
                    <p class="text-sm text-gray-900 dark:text-white">
                      {{ getSelectedStreamName() }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >Section Name *</label
                >
                <input
                  v-model="form.name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., A, B, C"
                />
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >Capacity</label
                >
                <input
                  v-model="form.capacity"
                  type="number"
                  min="1"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="30"
                />
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
                  :disabled="isSubmitting || !canSubmit"
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
import { Sections } from '~/api';
import { Plus } from 'lucide-vue-next';
import { useAuth } from '~/composables/useAuth';
import { useAcademics } from '~/composables/useAcademics';
import { useBranches } from '~/composables/useBranches';
import { useSchools } from '~/composables/useSchools';
import { useAcademicSettings } from '~/utils/settings';
import { useToast } from '~/composables/useToast';
import { Streams } from '~/api';

const { showError, showSuccess } = useToast();

const sections = ref([]);
const isLoading = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const isSubmitting = ref(false);
const editingId = ref(null);

// Auth and user context
const { user, isSuperAdmin, isSchoolAdmin, isBranchAdmin } = useAuth();
const userRole = computed(() => user.value?.role);

// Academic settings
const { isStreamsEnabled } = useAcademicSettings();
const streamsEnabled = ref(false);

// Composables
const { classes: availableClasses, fetchClasses, loading: loadingClasses } = useAcademics();
const { branches, fetchBranches, loading: loadingBranches } = useBranches();
const { schools, fetchSchools, loading: loadingSchools } = useSchools();

// Selection state
const selectedSchoolId = ref('');
const selectedBranchId = ref('');
const selectedClassId = ref('');
const selectedStreamId = ref('');

// Streams data
const streams = ref([]);
const loadingStreams = ref(false);

// Form data
const form = reactive({
  name: '',
  capacity: 30,
  is_active: true
});

// Computed property to check if form can be submitted
const canSubmit = computed(() => {
  const hasBasicFields = form.name && selectedClassId.value;

  if (userRole.value === 'super_admin') {
    if (!selectedSchoolId.value || !selectedBranchId.value) return false;
  } else if (userRole.value === 'school_admin') {
    if (!selectedBranchId.value) return false;
  }

  // For classes with streams, stream is required (only if streams are enabled)
  if (streamsEnabled.value && hasStreams.value && !selectedStreamId.value) {
    return false;
  }

  return hasBasicFields;
});

// Helper functions to get school, branch, and class names
const getSelectedSchoolName = () => {
  if (userRole.value === 'super_admin') {
    return selectedSchoolId.value
      ? schools.value.find(s => s.id === selectedSchoolId.value)?.name
      : 'N/A';
  } else {
    return user.value?.school_id
      ? schools.value.find(s => s.id === user.value?.school_id)?.name
      : 'N/A';
  }
};

const getSelectedBranchName = () => {
  if (userRole.value === 'super_admin') {
    return selectedBranchId.value
      ? branches.value.find(b => b.id === selectedBranchId.value)?.name
      : 'N/A';
  } else {
    return selectedBranchId.value
      ? branches.value.find(b => b.id === selectedBranchId.value)?.name
      : 'N/A';
  }
};

const getSelectedClassName = () => {
  return selectedClassId.value
    ? availableClasses.value.find(c => c.id === selectedClassId.value)?.name
    : 'N/A';
};

const getSelectedStreamName = () => {
  return selectedStreamId.value
    ? streams.value.find(s => s.id === selectedStreamId.value)?.name
    : 'N/A';
};

// Check if selected class has streams
const hasStreams = computed(() => {
  if (!selectedClassId.value) return false;
  return availableStreams.value.length > 0;
});

// Available streams for the selected class
const availableStreams = computed(() => {
  if (!selectedClassId.value) return [];
  return streams.value.filter(stream => stream.class_id === selectedClassId.value);
});

const resetForm = () => {
  form.name = '';
  form.capacity = 30;
  form.is_active = true;
  selectedClassId.value = '';
  selectedStreamId.value = '';
  if (userRole.value === 'super_admin') {
    selectedSchoolId.value = '';
    selectedBranchId.value = '';
  } else if (userRole.value === 'school_admin') {
    selectedBranchId.value = '';
  }
};

// School change handler (Super Admin only)
const onSchoolChange = async () => {
  selectedBranchId.value = '';
  selectedClassId.value = '';
  if (selectedSchoolId.value) {
    await fetchBranches(selectedSchoolId.value);
  }
};

// Branch change handler (Super Admin & School Admin)
const onBranchChange = async () => {
  selectedClassId.value = '';
  if (selectedBranchId.value) {
    await fetchClasses({
      schoolId: selectedSchoolId.value || user.value?.school_id,
      branchId: selectedBranchId.value
    });
  }
};

// Load streams for the selected class
const loadStreamsForClass = async classId => {
  if (!classId || !streamsEnabled.value) {
    streams.value = [];
    return;
  }

  loadingStreams.value = true;
  try {
    const params = {
      class_id: classId,
      is_active: 'true'
    };

    // Add role-based filters
    if (userRole.value === 'super_admin') {
      if (selectedSchoolId.value) params.school_id = selectedSchoolId.value;
      if (selectedBranchId.value) params.branch_id = selectedBranchId.value;
    } else if (userRole.value === 'school_admin') {
      params.school_id = user.value?.school_id;
      if (selectedBranchId.value) params.branch_id = selectedBranchId.value;
    } else if (userRole.value === 'branch_admin') {
      params.school_id = user.value?.school_id;
      params.branch_id = user.value?.branch_id;
    }

    const response = await Streams.getAll(params);
    streams.value = response.data || [];
  } catch (error) {
    streams.value = [];
  } finally {
    loadingStreams.value = false;
  }
};

// Class change handler
const onClassChange = async () => {
  // Reset form when class changes (only in create mode)
  if (!isEditing.value) {
    form.name = '';
    form.capacity = 30;
    selectedStreamId.value = '';
  }

  // Load streams for the selected class (only if streams are enabled)
  if (streamsEnabled.value) {
    await loadStreamsForClass(selectedClassId.value);
  }
};

// Stream change handler
const onStreamChange = () => {
  // Reset form when stream changes (only in create mode)
  if (!isEditing.value) {
    form.name = '';
    form.capacity = 30;
  }
};

const fetchSections = async () => {
  isLoading.value = true;
  try {
    const params = {
      sort_by: 'sort_order',
      sort_order: 'ASC'
    };

    // Add role-based filters
    if (userRole.value === 'super_admin') {
      // Super admin can see all sections
    } else if (userRole.value === 'school_admin') {
      // School admin sees only their school's sections
      params.school_id = user.value?.school_id;
    } else if (userRole.value === 'branch_admin') {
      // Branch admin sees only their branch's sections
      params.branch_id = user.value?.branch_id;
    }

    const response = await Sections.getAll(params);
    sections.value = response.data || [];
  } catch (error) {
    // Error handling
  } finally {
    isLoading.value = false;
  }
};

const openCreateModal = async () => {
  resetForm();
  isEditing.value = false;
  editingId.value = null;

  // Initialize based on user role
  if (userRole.value === 'super_admin') {
    // Load schools for super admin
    await fetchSchools();
  } else if (userRole.value === 'school_admin') {
    // Set school and load branches for school admin
    selectedSchoolId.value = user.value?.school_id;
    await fetchBranches(user.value?.school_id);
  } else if (userRole.value === 'branch_admin') {
    // Set school and branch for branch admin, load classes
    selectedSchoolId.value = user.value?.school_id;
    selectedBranchId.value = user.value?.branch_id;
    await fetchClasses({
      schoolId: user.value?.school_id,
      branchId: user.value?.branch_id
    });
  }

  showModal.value = true;
};

const editSection = async section => {
  isEditing.value = true;
  editingId.value = section.id;

  // Set context based on section data
  if (userRole.value === 'super_admin') {
    selectedSchoolId.value = section.branch?.school_id;
    await fetchBranches(section.branch?.school_id);
    selectedBranchId.value = section.branch_id;
  } else if (userRole.value === 'school_admin') {
    selectedSchoolId.value = user.value?.school_id;
    await fetchBranches(user.value?.school_id);
    selectedBranchId.value = section.branch_id;
  } else {
    selectedSchoolId.value = user.value?.school_id;
    selectedBranchId.value = user.value?.branch_id;
  }

  // Load classes for the branch
  await fetchClasses({
    schoolId: selectedSchoolId.value,
    branchId: selectedBranchId.value
  });

  // Set form values
  selectedClassId.value = section.class_id;
  selectedStreamId.value = section.stream_id || '';

  // Load streams for the section's class (only if streams are enabled)
  if (streamsEnabled.value) {
    await loadStreamsForClass(section.class_id);
  }

  form.name = section.name;
  form.capacity = section.capacity;
  form.is_active = section.is_active;

  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  resetForm();
  editingId.value = null;
  isEditing.value = false;
};

const saveSection = async () => {
  isSubmitting.value = true;
  try {
    const payload = {
      name: form.name,
      capacity: form.capacity,
      is_active: form.is_active,
      class_id: selectedClassId.value
    };

    // Add stream_id if stream is selected and streams are enabled
    if (streamsEnabled.value && selectedStreamId.value) {
      payload.stream_id = selectedStreamId.value;
    }

    if (isEditing.value) {
      await Sections.update(editingId.value, payload);
    } else {
      await Sections.create(payload);
    }

    closeModal();
    await fetchSections();

    // Show success message
    showSuccess(`Section ${isEditing.value ? 'updated' : 'created'} successfully!`);
  } catch (error) {
    // Show error message
    showError('Error saving section. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};

const toggleStatus = async section => {
  try {
    await Sections.update(section.id, {
      is_active: !section.is_active
    });
    await fetchSections();

    // Show success message
    showSuccess(`Section ${section.is_active ? 'deactivated' : 'activated'} successfully!`);
  } catch (error) {
    // Error handling
  }
};

const deleteSection = async id => {
  if (!confirm('Are you sure you want to delete this section? This action cannot be undone.')) {
    return;
  }

  try {
    await Sections.delete(id);
    await fetchSections();

    // Show success message
    showSuccess('Section deleted successfully!');
  } catch (error) {
    // Show error message
    showError('Error deleting section. Please try again.');
  }
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

onMounted(async () => {
  await loadStreamsSetting();
  fetchSections();
});
</script>

<style scoped>
.container {
  max-width: 1024px;
}
</style>
