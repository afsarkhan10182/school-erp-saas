<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Exam Type Management</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Manage exam types and their weightages for your school
          </p>
        </div>
        <div class="mt-4 sm:mt-0 sm:flex sm:space-x-3">
          <button
            @click="openCreateModal"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus class="-ml-1 mr-2 h-5 w-5" />
            Add Exam Type
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <FileText class="h-6 w-6 text-gray-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Exam Types
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ stats.total || 0 }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <CheckCircle class="h-6 w-6 text-green-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Active Types
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ stats.active || 0 }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <XCircle class="h-6 w-6 text-red-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Inactive Types
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ stats.inactive || 0 }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <Tag class="h-6 w-6 text-blue-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Custom Types
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ stats.custom || 0 }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6"
      >
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Search -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >Search</label
            >
            <input
              v-model="filters.search"
              type="text"
              placeholder="Search exam type name, code..."
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              @input="debouncedSearch"
            />
          </div>

          <!-- Status -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >Status</label
            >
            <select
              v-model="filters.is_active"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              @change="loadExamTypes"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <!-- Actions -->
          <div class="flex items-end">
            <button
              @click="clearFilters"
              class="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Exam Types Table -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Exam Types</h3>
        </div>

        <div v-if="loading" class="p-8 text-center">
          <div
            class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500 hover:bg-blue-400 transition ease-in-out duration-150 cursor-not-allowed"
          >
            <svg
              class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading exam types...
          </div>
        </div>

        <div v-else-if="examTypes.length === 0" class="p-8 text-center">
          <div class="text-gray-500 dark:text-gray-400">
            <FileText class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No exam types found
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating your first exam type.
            </p>
            <div class="mt-6">
              <button
                @click="openCreateModal"
                class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus class="-ml-1 mr-2 h-5 w-5" />
                Add Exam Type
              </button>
            </div>
          </div>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Exam Type
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Code
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Weightage
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Sort Order
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
                v-for="examType in examTypes"
                :key="examType.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ examType.name }}
                    </div>
                    <div
                      v-if="examType.description"
                      class="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs"
                    >
                      {{ examType.description }}
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  >
                    {{ examType.code }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ examType.weightage }}%
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ examType.sort_order }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="{
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200':
                        examType.is_active,
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200':
                        !examType.is_active
                    }"
                  >
                    {{ examType.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex space-x-2">
                    <button
                      @click="editExamType(examType)"
                      class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      Edit
                    </button>
                    <button
                      @click="deleteExamType(examType)"
                      class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <Pagination
            :current-page="filters.page"
            :total-pages="totalPages"
            :total-items="totalItems"
            @page-change="handlePageChange"
          />
        </div>
      </div>
    </div>

    <!-- Create/Edit Exam Type Modal -->
    <Modal :show="showModal" @close="closeModal">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          {{ isEditing ? 'Edit Exam Type' : 'Create New Exam Type' }}
        </h3>
      </template>

      <template #body>
        <ExamTypeForm
          :examType="editingExamType"
          @submit="handleExamTypeSubmit"
          @cancel="closeModal"
        />
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from '~/composables/useToast';
import { ExamTypes } from '~/api';
import Modal from '~/components/Modal.vue';
import Pagination from '~/components/Pagination.vue';
import ExamTypeForm from '~/components/forms/ExamTypeForm.vue';
import { Plus, FileText, CheckCircle, XCircle, Tag } from 'lucide-vue-next';

// Composables
const { showToast } = useToast();

// Reactive data
const loading = ref(false);
const examTypes = ref([]);
const stats = ref({});
const totalItems = ref(0);
const totalPages = ref(0);
const showModal = ref(false);
const isEditing = ref(false);
const editingExamType = ref(null);

// Filters
const filters = ref({
  page: 1,
  limit: 10,
  search: '',
  is_active: ''
});

// Methods
const loadExamTypes = async () => {
  try {
    loading.value = true;
    const response = await ExamTypes.getAll(filters.value);
    examTypes.value = response.data.exam_types || response.data.rows || [];
    totalItems.value = response.data.pagination?.total || 0;
    totalPages.value = response.data.pagination?.totalPages || 0;
  } catch (error) {
    showToast('Failed to load exam types', 'error');
    console.error('Error loading exam types:', error);
  } finally {
    loading.value = false;
  }
};

const loadStats = async () => {
  try {
    // Calculate stats from loaded data
    const total = examTypes.value.length;
    const active = examTypes.value.filter(et => et.is_active).length;
    const inactive = total - active;
    const custom = examTypes.value.filter(et => et.school_id).length; // School-specific types

    stats.value = { total, active, inactive, custom };
  } catch (error) {
    console.error('Error loading stats:', error);
  }
};

let searchTimeout = null;
const debouncedSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    filters.value.page = 1;
    loadExamTypes();
  }, 300);
};

const clearFilters = () => {
  filters.value = {
    page: 1,
    limit: 10,
    search: '',
    is_active: ''
  };
  loadExamTypes();
};

const handlePageChange = page => {
  filters.value.page = page;
  loadExamTypes();
};

const openCreateModal = () => {
  isEditing.value = false;
  editingExamType.value = null;
  showModal.value = true;
};

const editExamType = examType => {
  isEditing.value = true;
  editingExamType.value = examType;
  showModal.value = true;
};

const deleteExamType = async examType => {
  if (!confirm(`Are you sure you want to delete "${examType.name}"?`)) return;

  try {
    await ExamTypes.delete(examType.id);
    showToast('Exam type deleted successfully', 'success');
    loadExamTypes();
    loadStats();
  } catch (error) {
    showToast('Failed to delete exam type', 'error');
    console.error('Error deleting exam type:', error);
  }
};

const handleExamTypeSubmit = async examTypeData => {
  try {
    if (editingExamType.value) {
      await ExamTypes.update(editingExamType.value.id, examTypeData);
      showToast('Exam type updated successfully', 'success');
    } else {
      await ExamTypes.create(examTypeData);
      showToast('Exam type created successfully', 'success');
    }
    closeModal();
    loadExamTypes();
    loadStats();
  } catch (error) {
    showToast(error.response?.data?.message || 'Failed to save exam type', 'error');
    console.error('Error in handleExamTypeSubmit:', error);
  }
};

const closeModal = () => {
  showModal.value = false;
  editingExamType.value = null;
  isEditing.value = false;
};

// Lifecycle
onMounted(async () => {
  await Promise.all([loadExamTypes(), loadStats()]);
});
</script>
