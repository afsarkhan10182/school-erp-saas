<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Class Management</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage academic classes for each branch
        </p>
      </div>
      <div>
        <button
          @click="openCreateModal"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-150"
        >
          <Plus class="w-4 h-4" />
          Add Class
        </button>
      </div>
    </div>

    <!-- Classes List -->
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50/80 dark:bg-gray-900/40">
            <tr>
              <th
                class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Class Name
              </th>
              <th
                class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Code
              </th>
              <th
                class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Branch
              </th>
              <th
                v-if="streamsEnabled"
                class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Streams
              </th>
              <th
                class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Sections
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
              v-for="classItem in classes"
              :key="classItem.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
            >
              <td
                class="px-5 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"
              >
                {{ classItem.name }}
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                {{ classItem.code }}
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                <span class="font-medium">{{ classItem.branch?.name || '-' }}</span>
              </td>
              <td
                v-if="streamsEnabled"
                class="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300"
              >
                <span
                  v-if="classItem.has_stream"
                  class="text-indigo-600 dark:text-indigo-400 font-medium"
                >
                  {{ classItem.streams?.length || 0 }} streams
                </span>
                <span v-else class="text-gray-400 dark:text-gray-500"> No streams </span>
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                {{ classItem.sections?.length || 0 }} sections
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                    classItem.is_active
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                  ]"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="classItem.is_active ? 'bg-emerald-500' : 'bg-rose-500'"
                  ></span>
                  {{ classItem.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap text-right text-sm font-medium">
                <button
                  @click="editClass(classItem)"
                  class="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3 hover:underline"
                >
                  Edit
                </button>
                <button
                  @click="toggleStatus(classItem)"
                  class="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 mr-3 hover:underline"
                >
                  {{ classItem.is_active ? 'Deactivate' : 'Activate' }}
                </button>
                <button
                  @click="deleteClass(classItem.id)"
                  class="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:underline"
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
      class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 w-full max-w-md shadow-xl space-y-4"
      >
        <h3 class="text-lg font-bold text-gray-900 dark:text-white">
          {{ isEditing ? 'Edit Class' : 'Create New Class' }}
        </h3>

        <form @submit.prevent="saveClass" class="space-y-4">
          <!-- Context Info -->
          <div
            v-if="currentBranch || currentSchool"
            class="bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-lg p-3 flex items-center justify-between"
          >
            <div class="flex items-center space-x-2">
              <span
                class="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs"
              >
                {{
                  (currentBranch?.name || currentSchool?.name || 'B').charAt(0).toUpperCase()
                }}
              </span>
              <span class="text-xs font-semibold text-gray-900 dark:text-white">
                {{ currentBranch?.name || 'Active Branch' }}
              </span>
            </div>
            <span class="text-xs text-gray-400 italic">Current Workspace</span>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >Class Name <span class="text-rose-500">*</span></label
            >
            <input
              v-model="form.name"
              type="text"
              required
              class="input-field"
              placeholder="e.g., Class 1, Class 2, Class 3"
            />
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
              placeholder="e.g., C1, C2, C3"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >Description</label
            >
            <textarea
              v-model="form.description"
              rows="3"
              class="input-field"
              placeholder="Enter class description"
            ></textarea>
          </div>

          <div class="space-y-2 pt-1">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="form.is_active"
                type="checkbox"
                class="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
              />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
            </label>

            <label v-if="streamsEnabled" class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="form.has_stream"
                type="checkbox"
                class="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
              />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >This class has streams</span
              >
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
    <ConfirmDialog
      :open="deleteDialog.open"
      title="Delete class"
      message="Are you sure you want to delete this class? This action cannot be undone."
      confirm-label="Delete"
      @confirm="confirmDeleteClass"
      @cancel="deleteDialog.open = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { Classes } from '~/api';
import { Plus } from 'lucide-vue-next';
import { useAuth } from '~/composables/useAuth';
import { useAuthStore } from '~/stores/auth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useToast } from '~/composables/useToast';
import { useAcademicSettings } from '~/utils/settings';
import { useAcademics } from '~/composables/useAcademics';
import Pagination from '~/components/ui/Pagination.vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue';

const authStore = useAuthStore();
const deleteDialog = reactive({ open: false, id: '' });
const { currentBranch, currentSchool, selectedBranchId, branchScopeParams } = useGlobalBranch();
const { isStreamsEnabled } = useAcademicSettings();
const { showError, showWarning, showSuccess } = useToast();
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

// School/Branch selection for super admin

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

    // Add branch filter from global selection if present
    const activeBranchId = selectedBranchId.value;
    if (activeBranchId) {
      options.branchId = activeBranchId;
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

    // Add school_id and branch_id when creating a new class
    if (!isEditing.value) {
      payload.school_id = currentSchool.value?.id || user.value?.school_id;
      payload.branch_id = selectedBranchId.value || user.value?.branch_id;
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
  deleteDialog.id = id;
  deleteDialog.open = true;
};

const confirmDeleteClass = async () => {
  try {
    await Classes.delete(deleteDialog.id);
    await loadClasses();

    // Show success message
    showSuccess('Class deleted successfully!');
  } catch (error) {
    showError('Error deleting class. Please try again.');
  } finally {
    deleteDialog.open = false;
    deleteDialog.id = '';
  }
};

onMounted(async () => {
  // Load streams setting
  await loadStreamsSetting();

  await loadClasses();
});

// Watch global branch selection and reload classes
watch(selectedBranchId, async () => {
  pagination.page = 1;
  await loadClasses();
});
</script>
