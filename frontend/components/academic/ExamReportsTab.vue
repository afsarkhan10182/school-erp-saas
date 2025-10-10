<template>
  <div class="space-y-6">
    <!-- Header with Actions -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Exam Reports</h2>
        <p class="text-gray-600 dark:text-gray-400">Generate and manage exam reports</p>
      </div>
      <button
        @click="openGenerateModal"
        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <Plus class="h-4 w-4 mr-2" />
        Generate Report
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4"
      >
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <FileBarChart class="h-8 w-8 text-indigo-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Reports</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">
              {{ examReports.length }}
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
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">
              {{ completedReports.length }}
            </p>
          </div>
        </div>
      </div>
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4"
      >
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <Clock class="h-8 w-8 text-yellow-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">
              {{ pendingReports.length }}
            </p>
          </div>
        </div>
      </div>
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4"
      >
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <Download class="h-8 w-8 text-blue-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Downloads</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ totalDownloads }}</p>
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
            placeholder="Search reports..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            @input="debouncedSearch"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Report Type
          </label>
          <EnhancedDropdown
            v-model="filters.report_type"
            :options="reportTypeOptions"
            placeholder="Select Type"
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
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error loading reports</h3>
          <p class="mt-1 text-sm text-red-700 dark:text-red-300">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Reports Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-if="examReports.length === 0" class="col-span-full text-center py-12">
        <FileBarChart class="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No reports found</h3>
        <p class="text-gray-500 dark:text-gray-400">Generate your first report to get started.</p>
      </div>

      <div
        v-for="report in examReports"
        :key="report.id"
        class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {{ report.title }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {{ report.description || 'No description' }}
            </p>
            <div class="flex items-center space-x-2">
              <span
                :class="getStatusBadgeClass(report.status)"
                class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
              >
                {{ report.status }}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatDate(report.created_at) }}
              </span>
            </div>
          </div>
        </div>

        <div class="space-y-2 mb-4">
          <div class="flex justify-between text-sm">
            <span class="text-gray-500 dark:text-gray-400">Type:</span>
            <span class="text-gray-900 dark:text-white">{{
              formatReportType(report.report_type)
            }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500 dark:text-gray-400">Downloads:</span>
            <span class="text-gray-900 dark:text-white">{{ report.download_count || 0 }}</span>
          </div>
          <div v-if="report.file_size" class="flex justify-between text-sm">
            <span class="text-gray-500 dark:text-gray-400">Size:</span>
            <span class="text-gray-900 dark:text-white">{{
              formatFileSize(report.file_size)
            }}</span>
          </div>
        </div>

        <div class="flex space-x-2">
          <button
            v-if="report.status === 'completed'"
            @click="handleDownloadReport(report)"
            class="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Download class="h-4 w-4 mr-2" />
            Download
          </button>
          <button
            v-else
            disabled
            class="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
          >
            <Clock class="h-4 w-4 mr-2" />
            {{ report.status === 'generating' ? 'Generating...' : 'Pending' }}
          </button>
          <button
            @click="deleteReport(report)"
            class="inline-flex items-center px-3 py-2 border border-red-300 dark:border-red-600 text-sm font-medium rounded-md text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import {
  Plus,
  FileBarChart,
  CheckCircle,
  Clock,
  Download,
  Trash2,
  AlertCircle
} from 'lucide-vue-next';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { useExamReports } from '~/composables/useExamReports';
import { useToast } from '~/composables/useToast';
import { useDebounceFn } from '@vueuse/core';

// Composables
const {
  examReports,
  loading,
  error,
  completedReports,
  pendingReports,
  reportTypes,
  fetchExamReports,
  downloadReport,
  deleteExamReport
} = useExamReports();
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
  report_type: '',
  status: ''
});

// Computed properties
const reportTypeOptions = computed(() => [
  { value: 'class_wise', label: 'Class Wise' },
  { value: 'subject_wise', label: 'Subject Wise' },
  { value: 'student_wise', label: 'Student Wise' },
  { value: 'position_wise', label: 'Position Wise' },
  { value: 'summary', label: 'Summary' },
  { value: 'detailed', label: 'Detailed' }
]);

const statusOptions = computed(() => [
  { value: 'pending', label: 'Pending' },
  { value: 'generating', label: 'Generating' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' }
]);

const totalDownloads = computed(() =>
  examReports.value.reduce((sum, report) => sum + (report.download_count || 0), 0)
);

// Methods
const openGenerateModal = () => {
  showToast('Generate report modal will be implemented', 'info');
};

const handleDownloadReport = async report => {
  try {
    await downloadReport(report.id);
    showToast('Report downloaded successfully', 'success');
  } catch (error) {
    showToast(error.message || 'Failed to download report', 'error');
  }
};

const deleteReport = async report => {
  if (confirm('Are you sure you want to delete this report?')) {
    try {
      await deleteExamReport(report.id);
      showToast('Report deleted successfully', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to delete report', 'error');
    }
  }
};

const handleFilterChange = () => {
  fetchReports();
};

const clearFilters = () => {
  filters.value = {
    search: '',
    report_type: '',
    status: ''
  };
  fetchReports();
};

const debouncedSearch = useDebounceFn(() => {
  fetchReports();
}, 300);

const fetchReports = async () => {
  try {
    await fetchExamReports(props.examId, filters.value);
  } catch (error) {
    showToast(error.message || 'Failed to fetch reports', 'error');
  }
};

// Utility functions
const formatDate = date => {
  return new Date(date).toLocaleDateString();
};

const formatFileSize = bytes => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatReportType = type => {
  return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const getStatusBadgeClass = status => {
  const classes = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    generating: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };
  return classes[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
};

// Expose methods for parent component
const refreshData = () => {
  fetchReports();
};

defineExpose({
  refreshData
});

// Lifecycle
onMounted(() => {
  fetchReports();
});
</script>
