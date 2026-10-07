<template>
  <div class="space-y-6">
    <!-- Streams Disabled Alert -->
    <div
      v-if="$route.query.error === 'streams_disabled'"
      class="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-3 text-amber-800 dark:text-amber-200 text-sm"
    >
      <p>
        {{
          $route.query.message ||
          'Streams feature is currently disabled. Please enable streams in Academic Settings to access the streams management page.'
        }}
      </p>
    </div>

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Section Management</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage academic sections for each class and branch
        </p>
      </div>
      <div>
        <button
          @click="openCreateModal"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-150"
        >
          <Plus class="w-4 h-4" />
          Add Section
        </button>
      </div>
    </div>

    <!-- Sections List -->
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50/80 dark:bg-gray-900/40">
            <tr>
              <th
                class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Section Name
              </th>
              <th
                class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Class
              </th>
              <th
                v-if="streamsEnabled"
                class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Stream
              </th>
              <th
                class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Branch
              </th>
              <th
                class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Capacity
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
              v-for="section in sections"
              :key="section.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
            >
              <td
                class="px-5 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"
              >
                {{ section.name }}
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                {{ section.class?.name }} ({{ section.class?.code }})
              </td>
              <td
                v-if="streamsEnabled"
                class="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300"
              >
                <span
                  v-if="section.stream"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-900"
                >
                  {{ section.stream.name }} ({{ section.stream.code }})
                </span>
                <span v-else class="text-gray-400 dark:text-gray-500 text-xs">No Stream</span>
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                <span class="font-medium">{{ section.branch?.name || '-' }}</span>
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                {{ section.capacity }}
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                    section.is_active
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                  ]"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="section.is_active ? 'bg-emerald-500' : 'bg-rose-500'"
                  ></span>
                  {{ section.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap text-right text-sm font-medium">
                <button
                  @click="editSection(section)"
                  class="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3 hover:underline"
                >
                  Edit
                </button>
                <button
                  @click="toggleStatus(section)"
                  class="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 mr-3 hover:underline"
                >
                  {{ section.is_active ? 'Deactivate' : 'Activate' }}
                </button>
                <button
                  @click="deleteSection(section.id)"
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
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 w-full max-w-md shadow-xl space-y-4"
      >
        <h3 class="text-lg font-bold text-gray-900 dark:text-white">
          {{ isEditing ? 'Edit Section' : 'Create New Section' }}
        </h3>

        <form @submit.prevent="saveSection" class="space-y-4">
          <!-- Class Selection - Create Mode Only -->
          <div v-if="!isEditing">
            <EnhancedDropdown
              v-model="selectedClassId"
              label="Class"
              :options="classDropdownOptions"
              placeholder="Select Class"
              :required="true"
              :disabled="!selectedBranchId || loadingClasses"
              :loading="loadingClasses"
              @update:model-value="onClassChange"
            />
          </div>

          <!-- Stream Selection - Only if streams are enabled and class has streams -->
          <div v-if="streamsEnabled && !isEditing && hasStreams">
            <EnhancedDropdown
              v-model="selectedStreamId"
              label="Stream"
              :options="streamDropdownOptions"
              placeholder="Select Stream"
              :required="true"
              :disabled="!selectedClassId || loadingStreams"
              :loading="loadingStreams"
              @update:model-value="onStreamChange"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Stream is required for this class
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >Section Name <span class="text-rose-500">*</span></label
            >
            <input
              v-model="form.name"
              type="text"
              required
              class="input-field"
              placeholder="e.g., A, B, C"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >Capacity</label
            >
            <input
              v-model="form.capacity"
              type="number"
              min="1"
              class="input-field"
              placeholder="30"
            />
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
              :disabled="isSubmitting || !canSubmit"
              class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {{ isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    <ConfirmDialog
      :open="deleteDialog.open"
      title="Delete section"
      message="Are you sure you want to delete this section? This action cannot be undone."
      confirm-label="Delete"
      @confirm="confirmDeleteSection"
      @cancel="deleteDialog.open = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { Sections } from '~/api';
import { Plus, ChevronDown } from 'lucide-vue-next';
import { useAuth } from '~/composables/useAuth';
import { useAuthStore } from '~/stores/auth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useAcademics } from '~/composables/useAcademics';
import { useBranches } from '~/composables/useBranches';
import { useSchools } from '~/composables/useSchools';
import { Streams } from '~/api';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue';

const authStore = useAuthStore();
const deleteDialog = reactive({ open: false, id: '' });
const { selectedBranchId: globalBranchId } = useGlobalBranch();
const { showError, showSuccess } = useToast();

const sections = ref([]);
const isLoading = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const isSubmitting = ref(false);
const editingId = ref(null);

// Auth and user context
const { user, isSuperAdmin, isAdmin, isBranchAdmin } = useAuth();
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

const classDropdownOptions = computed(() =>
  availableClasses.value.map(c => ({
    label: `${c.name} (${c.code})`,
    value: c.id
  }))
);

const streamDropdownOptions = computed(() =>
  availableStreams.value.map(s => ({
    label: `${s.name} (${s.code})`,
    value: s.id
  }))
);

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
  } else if (userRole.value === 'admin') {
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
  } else if (userRole.value === 'admin') {
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

// Branch change handler (Super Admin & Admin)
const onBranchChange = async () => {
  selectedClassId.value = '';
  if (selectedBranchId.value) {
    await fetchClasses({
      schoolId: selectedSchoolId.value || user.value?.school_id,
      branchId: selectedBranchId.value
    });
  }
};

const onBranchFilterChange = async () => {
  selectedClassId.value = '';
  if (selectedBranchId.value) {
    await fetchClasses({
      schoolId: selectedSchoolId.value || user.value?.school_id,
      branchId: selectedBranchId.value
    });
  }
  await fetchSections();
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
    } else if (userRole.value === 'admin') {
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

    const activeBranchId = globalBranchId.value || selectedBranchId.value;

    // Add role-based filters
    if (userRole.value === 'super_admin') {
      if (activeBranchId) params.branch_id = activeBranchId;
      if (authStore.currentSchool?.id) params.school_id = authStore.currentSchool.id;
    } else if (userRole.value === 'admin') {
      // School admin sees only their school's sections
      params.school_id = user.value?.school_id;
      if (activeBranchId) params.branch_id = activeBranchId;
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

  // Set context from global branch / school
  selectedSchoolId.value = authStore.currentSchool?.id || user.value?.school_id || '';
  selectedBranchId.value =
    globalBranchId.value || authStore.currentBranch?.id || user.value?.branch_id || '';

  // Load classes for the active branch
  await fetchClasses({
    schoolId: selectedSchoolId.value,
    branchId: selectedBranchId.value
  });

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
  } else if (userRole.value === 'admin') {
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
  deleteDialog.id = id;
  deleteDialog.open = true;
};

const confirmDeleteSection = async () => {
  try {
    await Sections.delete(deleteDialog.id);
    await fetchSections();

    // Show success message
    showSuccess('Section deleted successfully!');
  } catch (error) {
    // Show error message
    showError('Error deleting section. Please try again.');
  } finally {
    deleteDialog.open = false;
    deleteDialog.id = '';
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
  if (userRole.value === 'admin') {
    selectedSchoolId.value = user.value?.school_id;
    await fetchBranches(user.value?.school_id);
  }
  fetchSections();
});

watch(globalBranchId, async () => {
  await fetchSections();
});
</script>

<style scoped>
.container {
  max-width: 1024px;
}
</style>
