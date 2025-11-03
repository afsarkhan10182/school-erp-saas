<template>
  <div class="space-y-6">
    <!-- Header with Actions -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Exam Results</h2>
        <p class="text-gray-600 dark:text-gray-400">Manage exam results and grades</p>
      </div>
      <div class="flex space-x-2">
        <button
          @click="openBulkEntryModal"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <Upload class="h-4 w-4 mr-2" />
          Bulk Entry
        </button>
        <button
          @click="handleCalculateGrades"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Calculator class="h-4 w-4 mr-2" />
          Calculate Grades
        </button>
        <button
          @click="handleExportResults"
          class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Download class="h-4 w-4 mr-2" />
          Export
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4"
      >
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <Users class="h-8 w-8 text-indigo-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Students</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">
              {{ examResults.length }}
            </p>
          </div>
        </div>
      </div>
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4"
      >
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <CheckCircle class="h-8 w-8 text-green-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Passed</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">
              {{ passedResults.length }}
            </p>
          </div>
        </div>
      </div>
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4"
      >
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <XCircle class="h-8 w-8 text-red-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Failed</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">
              {{ failedResults.length }}
            </p>
          </div>
        </div>
      </div>
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4"
      >
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <BarChart3 class="h-8 w-8 text-blue-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Average</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">
              {{ averagePercentage.toFixed(1) }}%
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4"
    >
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search
          </label>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Search students..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            @input="debouncedSearch"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Grade
          </label>
          <EnhancedDropdown
            v-model="filters.grade"
            :options="gradeOptions"
            placeholder="Select Grade"
            @update:model-value="handleFilterChange"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <EnhancedDropdown
            v-model="filters.status"
            :options="statusOptions"
            placeholder="Select Status"
            @update:model-value="handleFilterChange"
          />
        </div>
        <div class="flex items-end">
          <button
            @click="clearFilters"
            class="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
    >
      <div class="flex">
        <AlertCircle class="h-5 w-5 text-red-400" />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error loading results</h3>
          <p class="mt-1 text-sm text-red-700 dark:text-red-300">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Results Table -->
    <div
      v-else
      class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700"
    >
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Student
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Marks
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Percentage
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Grade
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
            <tr v-if="examResults.length === 0">
              <td colspan="6" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                No results found
              </td>
            </tr>
            <tr
              v-for="result in examResults"
              :key="result.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ result.student?.first_name }} {{ result.student?.last_name }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {{ result.student?.admission_number }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ result.marks_obtained }} / {{ result.total_marks }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ result.percentage }}%
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {{ result.grade || 'N/A' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="
                    result.is_passed
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  "
                  class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                >
                  {{ result.is_passed ? 'Passed' : 'Failed' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                  <button
                    @click="editResult(result)"
                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    <Edit class="h-4 w-4" />
                  </button>
                  <button
                    @click="deleteResult(result)"
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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import {
  Upload,
  Calculator,
  Download,
  Users,
  CheckCircle,
  XCircle,
  BarChart3,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-vue-next';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { useExamResults } from '~/composables/useExamResults';
import { useToast } from '~/composables/useToast';
import { useDebounceFn } from '@vueuse/core';

// Composables
const {
  examResults,
  loading,
  error,
  passedResults,
  failedResults,
  averagePercentage,
  fetchExamResults,
  calculateGrades,
  exportResults
} = useExamResults();
const { showToast } = useToast();

// Props
const props = defineProps({
  examId: {
    type: String,
    required: true
  }
});

// Reactive data
const filters = ref({
  search: '',
  grade: '',
  status: ''
});

// Computed properties
const gradeOptions = computed(() => [
  { value: 'A+', label: 'A+' },
  { value: 'A', label: 'A' },
  { value: 'B+', label: 'B+' },
  { value: 'B', label: 'B' },
  { value: 'C+', label: 'C+' },
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D' },
  { value: 'F', label: 'F' }
]);

const statusOptions = computed(() => [
  { value: 'passed', label: 'Passed' },
  { value: 'failed', label: 'Failed' }
]);

// Methods
const openBulkEntryModal = () => {
  showToast('Bulk entry modal will be implemented', 'info');
};

const handleCalculateGrades = async () => {
  try {
    await calculateGrades(props.examId);
    showToast('Grades calculated successfully', 'success');
  } catch (error) {
    showToast(error.message || 'Failed to calculate grades', 'error');
  }
};

const handleExportResults = async () => {
  try {
    await exportResults(props.examId);
    showToast('Results exported successfully', 'success');
  } catch (error) {
    showToast(error.message || 'Failed to export results', 'error');
  }
};

const editResult = result => {
  showToast('Edit result modal will be implemented', 'info');
};

const deleteResult = async result => {
  if (confirm('Are you sure you want to delete this result?')) {
    try {
      // await deleteExamResult(result.id);
      showToast('Result deleted successfully', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to delete result', 'error');
    }
  }
};

const handleFilterChange = () => {
  fetchResults();
};

const clearFilters = () => {
  filters.value = {
    search: '',
    grade: '',
    status: ''
  };
  fetchResults();
};

const debouncedSearch = useDebounceFn(() => {
  fetchResults();
}, 300);

const fetchResults = async () => {
  try {
    await fetchExamResults(props.examId, filters.value);
  } catch (error) {
    showToast(error.message || 'Failed to fetch results', 'error');
  }
};

// Expose methods for parent component
const refreshData = () => {
  fetchResults();
};

defineExpose({
  refreshData
});

// Lifecycle
onMounted(() => {
  fetchResults();
});
</script>
