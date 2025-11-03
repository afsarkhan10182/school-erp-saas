<template>
  <div class="space-y-6">
    <!-- Header with Actions -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Exam Schedules</h2>
        <p class="text-gray-600 dark:text-gray-400">Manage exam schedules and timetables</p>
      </div>
      <div class="flex space-x-3">
        <button
          @click="$router.push('/exams/schedules/create')"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus class="h-4 w-4 mr-2" />
          Add Schedule
        </button>
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
            placeholder="Search schedules..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            @input="debouncedSearch"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Exam
          </label>
          <EnhancedDropdown
            v-model="filters.exam_id"
            :options="examOptions"
            placeholder="Select Exam"
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
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
            Error loading schedules
          </h3>
          <p class="mt-1 text-sm text-red-700 dark:text-red-300">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Schedules Table -->
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
                Exam
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Class & Subject
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Date & Time
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Duration
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Hall
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
            <tr v-if="schedules.length === 0">
              <td colspan="7" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                No schedules found
              </td>
            </tr>
            <tr
              v-for="schedule in schedules"
              :key="schedule.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ schedule.exam?.name || 'N/A' }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {{ schedule.exam?.exam_type?.name || 'N/A' }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ schedule.class?.name || 'N/A' }} - {{ schedule.section?.name || 'N/A' }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {{ schedule.subject?.name || 'All Subjects' }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">
                  {{ formatDate(schedule.exam_date || schedule.schedule_date) }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {{ formatTime(schedule.start_time) }} - {{ formatTime(schedule.end_time) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ schedule.duration_minutes || schedule.duration }} min
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ schedule.exam_hall?.name || schedule.hall?.name || 'N/A' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="getStatusBadgeClass(schedule.status)"
                  class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                >
                  {{ getStatusText(schedule.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                  <button
                    @click="viewSchedule(schedule)"
                    class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    title="View Details"
                  >
                    <Eye class="h-4 w-4" />
                  </button>
                  <button
                    @click="editSchedule(schedule)"
                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                    title="Edit Schedule"
                  >
                    <Edit class="h-4 w-4" />
                  </button>
                  <button
                    @click="deleteSchedule(schedule)"
                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    title="Delete Schedule"
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
      <div
        v-if="pagination.total > 0"
        class="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6"
      >
        <div class="flex items-center justify-between">
          <div class="flex-1 flex justify-between sm:hidden">
            <button
              @click="previousPage"
              :disabled="pagination.page === 1"
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              @click="nextPage"
              :disabled="pagination.page === pagination.pages"
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700 dark:text-gray-300">
                Showing {{ (pagination.page - 1) * pagination.limit + 1 }} to
                {{ Math.min(pagination.page * pagination.limit, pagination.total) }} of
                {{ pagination.total }} results
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  @click="previousPage"
                  :disabled="pagination.page === 1"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft class="h-5 w-5" />
                </button>
                <button
                  @click="nextPage"
                  :disabled="pagination.page === pagination.pages"
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight class="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Schedule Modal -->
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import {
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Eye
} from 'lucide-vue-next';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { useExamSchedules } from '~/composables/useExamSchedules';
import { useExams } from '~/composables/useExams';
import { useToast } from '~/composables/useToast';
import { useDebounceFn } from '@vueuse/core';

// Props
const props = defineProps({
  schoolId: {
    type: String,
    default: ''
  }
});

// Composables
const {
  schedules,
  loading,
  error,
  pagination,
  fetchExamSchedules,
  createExamSchedule,
  updateExamSchedule,
  deleteExamSchedule
} = useExamSchedules();
const { exams, fetchExams } = useExams();
const { showToast } = useToast();

// Reactive data
const filters = ref({
  search: '',
  exam_id: '',
  status: ''
});

// Modal states

// Computed properties
const examOptions = computed(() =>
  exams.value.map(exam => ({
    value: exam.id,
    label: exam.name
  }))
);

const statusOptions = computed(() => [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
]);

// Methods

const viewSchedule = schedule => {
  // TODO: Implement view modal or navigate to details page
  showToast('View schedule functionality will be implemented', 'info');
};

const editSchedule = schedule => {
  // TODO: Implement edit modal
  showToast('Edit schedule modal will be implemented', 'info');
};

const deleteSchedule = async schedule => {
  if (confirm('Are you sure you want to delete this schedule?')) {
    try {
      await deleteExamSchedule(schedule.id);
      showToast('Schedule deleted successfully', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to delete schedule', 'error');
    }
  }
};

const handleFilterChange = () => {
  fetchSchedules();
};

const clearFilters = () => {
  filters.value = {
    search: '',
    exam_id: '',
    status: ''
  };
  fetchSchedules();
};

const debouncedSearch = useDebounceFn(() => {
  fetchSchedules();
}, 300);

const fetchSchedules = async () => {
  try {
    await fetchExamSchedules(filters.value);
  } catch (error) {
    showToast(error.message || 'Failed to fetch schedules', 'error');
  }
};

const previousPage = () => {
  if (pagination.value.page > 1) {
    filters.value.page = pagination.value.page - 1;
    fetchSchedules();
  }
};

const nextPage = () => {
  if (pagination.value.page < pagination.value.pages) {
    filters.value.page = pagination.value.page + 1;
    fetchSchedules();
  }
};

// Utility functions
const formatDate = date => {
  return new Date(date).toLocaleDateString();
};

const formatTime = time => {
  return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusBadgeClass = status => {
  const classes = {
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    ongoing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };
  return classes[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
};

const getStatusText = status => {
  const texts = {
    scheduled: 'Scheduled',
    ongoing: 'Ongoing',
    completed: 'Completed',
    cancelled: 'Cancelled'
  };
  return texts[status] || 'Unknown';
};

// Expose methods for parent component
const refreshData = () => {
  fetchSchedules();
};

defineExpose({
  refreshData
});

// Lifecycle
onMounted(async () => {
  await fetchExams();
  await fetchSchedules();
});
</script>
