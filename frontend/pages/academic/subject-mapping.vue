<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Class-Subject Mapping</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage subject mappings for different classes and academic years
        </p>
      </div>
      <button
        @click="showCreateModal = true"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <Plus class="-ml-1 mr-2 h-5 w-5" />
        Add Mapping
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Search -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search
          </label>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Search by name or code..."
            class="input-field"
            @input="debouncedSearch"
          />
        </div>

        <!-- Class Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Class
          </label>
          <select v-model="filters.class_id" class="input-field" @change="loadMappings">
            <option value="">All Classes</option>
            <option
              v-for="classOption in classOptions"
              :key="classOption.value"
              :value="classOption.value"
            >
              {{ classOption.label }}
            </option>
          </select>
        </div>

        <!-- Academic Year Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Academic Year
          </label>
          <select v-model="filters.academic_year" class="input-field" @change="loadMappings">
            <option value="">All Years</option>
            <option v-for="year in academicYearOptions" :key="year.value" :value="year.value">
              {{ year.label }}
            </option>
          </select>
        </div>

        <!-- Actions -->
        <div class="flex items-end space-x-2">
          <button
            @click="resetFilters"
            class="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Reset
          </button>
        </div>
      </div>
    </div>

    <!-- Mappings Table -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>

      <div v-else-if="mappings.length === 0" class="text-center py-12">
        <BookOpen class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No mappings found</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Get started by creating a new class-subject mapping.
        </p>
        <div class="mt-6">
          <button
            @click="showCreateModal = true"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus class="-ml-1 mr-2 h-5 w-5" />
            Add Mapping
          </button>
        </div>
      </div>

      <div v-else>
        <div class="overflow-x-auto">
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
                  Class
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Academic Year
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Subjects
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Credit Hours
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="mapping in mappings"
                :key="mapping.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ mapping.name }}
                  </div>
                  <div v-if="mapping.description" class="text-sm text-gray-500 dark:text-gray-400">
                    {{ mapping.description }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  >
                    {{ mapping.code }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {{ mapping.class?.name }}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {{ mapping.class?.code }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ mapping.academic_year }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {{ mapping.subjects?.length || 0 }} subjects
                  </div>
                  <div
                    v-if="mapping.subjects?.length"
                    class="text-xs text-gray-500 dark:text-gray-400"
                  >
                    {{
                      mapping.subjects
                        .slice(0, 2)
                        .map(s => s.name)
                        .join(', ')
                    }}
                    <span v-if="mapping.subjects.length > 2">...</span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ mapping.total_credit_hours }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getStatusBadgeClass(mapping.is_active ? 'active' : 'inactive')">
                    {{ mapping.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end space-x-2">
                    <button
                      @click="editMapping(mapping)"
                      class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      <Edit class="h-4 w-4" />
                    </button>
                    <button
                      @click="deleteMapping(mapping)"
                      class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 class="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <Pagination
          v-if="pagination.totalPages > 1"
          :current-page="pagination.page"
          :total-pages="pagination.totalPages"
          :total-items="pagination.total"
          :items-per-page="pagination.limit"
          @page-change="handlePageChange"
        />
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Modal :show="showCreateModal" @close="closeModal">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          {{ isEditing ? 'Edit Class-Subject Mapping' : 'Create Class-Subject Mapping' }}
        </h3>
      </template>

      <template #body>
        <ClassSubjectMappingForm
          :mapping="editingMapping"
          :class-options="classOptions"
          :subject-options="subjectOptions"
          :academic-year-options="academicYearOptions"
          @submit="handleMappingSubmit"
          @cancel="closeModal"
        />
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useToast } from '~/composables/useToast';
import { useDropdowns } from '~/composables/useDropdowns';
import { useAcademics } from '~/composables/useAcademics';
import { getStatusBadgeClass } from '~/utils/formatters';
import { classSubjectMappingApi } from '~/api/academic/class-subject-mapping';
import { subjectApi } from '~/api/academic/subjects';
import Modal from '~/components/ui/Modal.vue';
import Pagination from '~/components/ui/Pagination.vue';
import ClassSubjectMappingForm from '~/components/forms/ClassSubjectMappingForm.vue';
import { Plus, BookOpen, Edit, Trash2 } from 'lucide-vue-next';

// Composables
const { showToast } = useToast();
// getStatusBadgeClass imported directly from utils
const {
  classes: classOptions,
  loadClasses,
  subjects: subjectOptions,
  loadSubjects
} = useDropdowns();
const { academicYears, fetchAcademicYears } = useAcademics();

// Reactive data
const loading = ref(false);
const mappings = ref([]);
const showCreateModal = ref(false);
const isEditing = ref(false);
const editingMapping = ref(null);

// Filters
const filters = ref({
  search: '',
  class_id: '',
  academic_year: ''
});

// Pagination
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
});

// Computed
const academicYearOptions = computed(() => {
  return academicYears.value.map(year => ({
    value: year.name,
    label: year.name + (year.is_current ? ' (Current)' : '')
  }));
});

// Methods
const loadMappings = async () => {
  try {
    loading.value = true;
    const response = await classSubjectMappingApi.getAll({
      ...filters.value,
      page: pagination.value.page,
      limit: pagination.value.limit
    });

    mappings.value = response.data.mappings;
    pagination.value = response.data.pagination;
  } catch (error) {
    showToast('Failed to load class-subject mappings', 'error');
    console.error('Error loading mappings:', error);
  } finally {
    loading.value = false;
  }
};

const debouncedSearch = debounce(() => {
  pagination.value.page = 1;
  loadMappings();
}, 500);

const resetFilters = () => {
  filters.value = {
    search: '',
    class_id: '',
    academic_year: ''
  };
  pagination.value.page = 1;
  loadMappings();
};

const handlePageChange = page => {
  pagination.value.page = page;
  loadMappings();
};

const editMapping = mapping => {
  isEditing.value = true;
  editingMapping.value = mapping;
  showCreateModal.value = true;
};

const deleteMapping = async mapping => {
  if (!confirm(`Are you sure you want to delete the mapping "${mapping.name}"?`)) {
    return;
  }

  try {
    await classSubjectMappingApi.delete(mapping.id);
    showToast('Class-subject mapping deleted successfully', 'success');
    loadMappings();
  } catch (error) {
    showToast('Failed to delete class-subject mapping', 'error');
    console.error('Error deleting mapping:', error);
  }
};

const handleMappingSubmit = async formData => {
  try {
    if (isEditing.value) {
      await classSubjectMappingApi.update(editingMapping.value.id, formData);
      showToast('Class-subject mapping updated successfully', 'success');
    } else {
      await classSubjectMappingApi.create(formData);
      showToast('Class-subject mapping created successfully', 'success');
    }

    closeModal();
    loadMappings();
  } catch (error) {
    showToast(`Failed to ${isEditing.value ? 'update' : 'create'} class-subject mapping`, 'error');
    console.error('Error submitting mapping:', error);
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  isEditing.value = false;
  editingMapping.value = null;
};

// Debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize
onMounted(async () => {
  await Promise.all([loadClasses(), loadSubjects(), fetchAcademicYears(), loadMappings()]);
});
</script>
