<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Exam Schedule</h1>
        </div>
        <div class="mt-4 sm:mt-0">
          <button
            @click="$router.push('/exams/schedules/create')"
            :disabled="!effectiveBranchId"
            :title="effectiveBranchId ? 'Create an exam schedule' : 'Select a branch first'"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            :class="{ 'cursor-not-allowed opacity-50': !effectiveBranchId }"
          >
            <Plus class="h-4 w-4 mr-2" />
            Create Schedule
          </button>
        </div>
      </div>
      <p v-if="!effectiveBranchId" class="-mt-4 mb-6 text-sm text-amber-700 dark:text-amber-300">
        Select a branch from the global selector before creating a schedule.
      </p>

      <!-- Schedule filters -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select filters</h2>
        <div class="flex items-end gap-4">
          <!-- Class Selection -->
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Class <span class="text-red-500">*</span>
            </label>
            <EnhancedDropdown
              v-model="selectedClassId"
              :options="filteredClassOptions"
              placeholder="Select class"
              :loading="classesLoading"
              :disabled="classesLoading || filteredClassOptions.length === 0"
              @change="onClassChange"
            />
          </div>

          <!-- Section Selection -->
          <div v-if="showSectionField && sectionOptions.length > 0" class="flex-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Section <span class="text-red-500">*</span>
            </label>
            <EnhancedDropdown
              v-model="selectedSectionId"
              :options="sectionOptions"
              placeholder="Select section"
              :loading="sectionsLoading"
              @change="onSectionChange"
            />
          </div>

          <!-- Filter Button -->
          <div>
            <button
              @click="applyFilter"
              :disabled="!canApplyFilter"
              class="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Filter class="h-5 w-5 mr-2" />
              Filter
            </button>
          </div>
        </div>
      </div>

      <!-- Schedule List Section -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div
          class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
        >
          <div class="flex items-center">
            <Calendar class="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Schedule List</h3>
          </div>
          <div class="flex items-center gap-4">
            <!-- Search -->
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search..."
                class="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white w-64"
              />
              <Search
                class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
              />
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading schedules...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="groupedExams.length === 0" class="p-8 text-center">
          <Calendar class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No schedules found</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Select a class and section, then click Filter to view schedules
          </p>
        </div>

        <!-- Schedules Table -->
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Sl.
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Exam Name
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="(examGroup, index) in filteredGroupedExams"
                :key="examGroup.examId"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ index + 1 }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ examGroup.examName }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex items-center space-x-3">
                    <button
                      @click="viewScheduleDetails(examGroup)"
                      class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                      title="View Details"
                    >
                      <Eye class="h-4 w-4" />
                    </button>
                    <button
                      @click="editScheduleGroup(examGroup)"
                      class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                      title="Edit"
                    >
                      <Edit class="h-4 w-4" />
                    </button>
                    <button
                      @click="deleteScheduleGroup(examGroup)"
                      class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Delete"
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
          v-if="groupedExams.length > 0"
          class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between"
        >
          <div class="flex items-center text-sm text-gray-700 dark:text-gray-300">
            <span
              >Showing 1 to {{ filteredGroupedExams.length }} of
              {{ groupedExams.length }} entries</span
            >
            <EnhancedDropdown
              v-model="rowsPerPage"
              :options="rowsPerPageOptions"
              class="ml-4 w-24"
              aria-label="Rows per page"
            />
            <span class="ml-2">rows per page</span>
          </div>
          <div class="flex items-center space-x-2">
            <button
              @click="currentPage = 1"
              :disabled="currentPage === 1"
              class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft class="h-5 w-5" />
            </button>
            <span class="px-3 py-1 bg-indigo-600 text-white rounded">{{ currentPage }}</span>
            <button
              @click="currentPage++"
              :disabled="currentPage >= totalPages"
              class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Schedule Details Modal -->
    <div
      v-if="showDetailsModal"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
      @click="closeDetailsModal"
    >
      <div
        class="relative top-20 mx-auto p-6 border w-full max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800"
        @click.stop
      >
        <div class="mb-4">
          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center">
              <Calendar class="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Schedule Details</h3>
            </div>
            <div class="flex items-center space-x-3">
              <button
                @click="printScheduleDetails"
                class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                title="Print"
              >
                <Printer class="h-4 w-4 mr-2" />
                Print
              </button>
              <button
                @click="closeDetailsModal"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X class="h-6 w-6" />
              </button>
            </div>
          </div>

          <!-- Exam Information -->
          <div class="mb-6 space-y-2">
            <div class="text-sm text-gray-700 dark:text-gray-300">
              <span class="font-semibold">Exam :</span>
              <span class="ml-2">{{ selectedScheduleGroup?.examName || 'N/A' }}</span>
            </div>
            <div class="text-sm text-gray-700 dark:text-gray-300">
              <span class="font-semibold">Class :</span>
              <span class="ml-2">
                {{ selectedScheduleGroup?.className || 'N/A'
                }}{{
                  selectedScheduleGroup?.sectionName ? `(${selectedScheduleGroup.sectionName})` : ''
                }}
              </span>
            </div>
          </div>

          <!-- Schedule Table -->
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Subject
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Starting Time
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Ending Time
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Hall Room
                  </th>
                </tr>
              </thead>
              <tbody
                class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
              >
                <tr
                  v-for="schedule in selectedScheduleGroup?.schedules || []"
                  :key="schedule.id"
                  class="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {{ schedule.subject?.name || 'N/A' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {{ formatDate(schedule.exam_date) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {{ formatTime(schedule.start_time) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {{ formatTime(schedule.end_time) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {{ schedule.examHall?.name || schedule.hall?.name || 'N/A' }}
                  </td>
                </tr>
                <tr
                  v-if="
                    !selectedScheduleGroup?.schedules ||
                    selectedScheduleGroup.schedules.length === 0
                  "
                >
                  <td
                    colspan="5"
                    class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No schedules found
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Footer -->
          <div class="mt-6 flex justify-end">
            <button
              @click="closeDetailsModal"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <ConfirmDialog
      :show="Boolean(scheduleToDelete)"
      title="Delete schedules"
      :message="`Delete all schedules for ${scheduleToDelete?.examName || 'this exam'}? This cannot be undone.`"
      confirm-label="Delete schedules"
      @close="scheduleToDelete = null"
      @confirm="confirmDeleteScheduleGroup"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Plus,
  Calendar,
  Edit,
  Trash2,
  X,
  Filter,
  Clock,
  RotateCcw,
  Eye,
  Printer,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next';
import Modal from '~/components/ui/Modal.vue';
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { useToast } from '~/composables/useToast';
import { useAuth } from '~/composables/useAuth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useAcademics } from '~/composables/useAcademics';
import { useExams } from '~/composables/useExams';
import { examScheduleApi } from '~/api/academic/exam-schedules';

// Composables
const router = useRouter();
const { showToast } = useToast();
const { user } = useAuth();
const { selectedBranchId, effectiveBranchId, currentSchool, isSuperAdmin } = useGlobalBranch();
const {
  classes,
  classOptions,
  sectionOptions,
  sectionsLoading,
  loading: classesLoading,
  fetchClasses,
  fetchSections
} = useAcademics();
const { exams, loadExams } = useExams();

// Reactive data
const loading = ref(false);
const schedules = ref([]);
const showDetailsModal = ref(false);
const selectedScheduleGroup = ref(null);
const scheduleToDelete = ref(null);

// Filters
const selectedClassId = ref('');
const selectedSectionId = ref('');
const filterApplied = ref(false);
const searchQuery = ref('');

const schoolId = computed(() =>
  isSuperAdmin.value ? currentSchool.value?.id : user.value?.school_id
);

watch(
  [selectedBranchId, schoolId],
  async ([newBranchId, newSchoolId]) => {
    selectedClassId.value = '';
    selectedSectionId.value = '';
    schedules.value = [];
    filterApplied.value = false;
    if (!newSchoolId) {
      classes.value = [];
      exams.value = [];
      return;
    }

    const scope = { school_id: newSchoolId, ...(newBranchId && { branch_id: newBranchId }) };
    await Promise.all([
      loadExams(scope),
      fetchClasses({ schoolId: newSchoolId, branchId: newBranchId || undefined })
    ]);
  },
  { immediate: true }
);

// Pagination
const currentPage = ref(1);
const rowsPerPage = ref(25);
const rowsPerPageOptions = [
  { value: 10, label: '10' },
  { value: 25, label: '25' },
  { value: 50, label: '50' },
  { value: 100, label: '100' }
];

// Computed properties
const showSectionField = computed(() => {
  return sectionOptions.value.some(section => section.class_id === selectedClassId.value);
});

const filteredClassOptions = computed(() => {
  return classOptions.value.map(option => {
    if (selectedBranchId.value) return option;
    const classItem = classes.value.find(item => item.id === option.value);
    return {
      ...option,
      label: `${option.label} (${classItem?.branch?.name || 'Branch'})`
    };
  });
});

const canApplyFilter = computed(() => {
  // If branch dropdown is shown, branch must be selected
  // Class is always required
  if (!selectedClassId.value) return false;
  // Section is required if class has sections and sections are available
  if (showSectionField.value && sectionOptions.value.length > 0) {
    return !!selectedSectionId.value;
  }
  return true;
});

// Branch options

// Group schedules by exam, class, and section
const groupedExams = computed(() => {
  if (!filterApplied.value || schedules.value.length === 0) return [];

  const grouped = {};
  schedules.value.forEach(schedule => {
    const key = `${schedule.exam_id}_${schedule.class_id}_${schedule.section_id || 'no_section'}`;
    if (!grouped[key]) {
      grouped[key] = {
        examId: schedule.exam_id,
        examName: schedule.exam?.name || 'Unknown Exam',
        classId: schedule.class_id,
        className: schedule.class?.name || 'Unknown Class',
        sectionId: schedule.section_id,
        sectionName: schedule.section?.name,
        schedules: []
      };
    }
    grouped[key].schedules.push(schedule);
  });

  return Object.values(grouped).sort((a, b) => a.examName.localeCompare(b.examName));
});

const filteredGroupedExams = computed(() => {
  let filtered = groupedExams.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      group =>
        group.examName.toLowerCase().includes(query) ||
        group.className.toLowerCase().includes(query) ||
        (group.sectionName && group.sectionName.toLowerCase().includes(query))
    );
  }

  return filtered;
});

const totalPages = computed(() => {
  return Math.ceil(filteredGroupedExams.value.length / rowsPerPage.value);
});

// Methods
const loadSchedules = async () => {
  try {
    loading.value = true;
    const response = await examScheduleApi.getAll({
      school_id: schoolId.value,
      ...(selectedBranchId.value && { branch_id: selectedBranchId.value }),
      class_id: selectedClassId.value || undefined,
      section_id: selectedSectionId.value || undefined
    });

    let schedulesList = [];

    if (response?.data?.schedules && Array.isArray(response.data.schedules)) {
      schedulesList = response.data.schedules;
    } else if (response?.schedules && Array.isArray(response.schedules)) {
      schedulesList = response.schedules;
    } else if (Array.isArray(response?.data)) {
      schedulesList = response.data;
    } else if (Array.isArray(response)) {
      schedulesList = response;
    }

    schedules.value = schedulesList;
  } catch (error) {
    console.error('Error loading schedules:', error);
    showToast(error?.message || 'Failed to load schedules', 'error');
    schedules.value = [];
  } finally {
    loading.value = false;
  }
};

const onClassChange = async () => {
  selectedSectionId.value = '';
  if (selectedClassId.value) {
    const selectedClass = classes.value.find(cls => cls.id === selectedClassId.value);
    await fetchSections({
      schoolId: schoolId.value,
      branchId: selectedBranchId.value || selectedClass?.branch_id || selectedClass?.branch?.id,
      classId: selectedClassId.value
    });
  }
};

const onSectionChange = () => {
  // Handle section change if needed
};

const applyFilter = async () => {
  if (!canApplyFilter.value) {
    showToast('Please select class' + (showSectionField.value ? ' and section' : ''), 'warning');
    return;
  }

  filterApplied.value = true;
  await loadSchedules();
  showToast('Schedules loaded successfully', 'success');
};

const viewScheduleDetails = examGroup => {
  selectedScheduleGroup.value = {
    examName: examGroup.examName,
    className: examGroup.className,
    sectionName: examGroup.sectionName,
    schedules: examGroup.schedules.sort((a, b) => {
      if (a.exam_date !== b.exam_date) {
        return new Date(a.exam_date) - new Date(b.exam_date);
      }
      return (a.start_time || '').localeCompare(b.start_time || '');
    })
  };
  showDetailsModal.value = true;
};

const closeDetailsModal = () => {
  showDetailsModal.value = false;
  selectedScheduleGroup.value = null;
};

const editScheduleGroup = examGroup => {
  // Navigate to create page with pre-filled parameters for editing
  const query = {
    exam_id: examGroup.examId,
    class_id: examGroup.classId,
    edit_mode: 'true'
  };

  if (examGroup.sectionId) {
    query.section_id = examGroup.sectionId;
  }

  const classItem = classes.value.find(item => item.id === examGroup.classId);
  const classBranchId = classItem?.branch_id || classItem?.branch?.id;
  const branchId = selectedBranchId.value || classBranchId;
  if (branchId) query.branch_id = branchId;
  if (schoolId.value) query.school_id = schoolId.value;

  // Navigate to create page with query params
  router.push({
    path: '/exams/schedules/create',
    query: query
  });
};

const deleteScheduleGroup = async examGroup => {
  scheduleToDelete.value = examGroup;
};

const confirmDeleteScheduleGroup = async () => {
  const examGroup = scheduleToDelete.value;
  scheduleToDelete.value = null;
  if (!examGroup) return;
  try {
    // Delete all schedules in this group
    const deletePromises = examGroup.schedules.map(schedule => examScheduleApi.delete(schedule.id));
    await Promise.all(deletePromises);

    showToast('Schedules deleted successfully', 'success');
    await loadSchedules();
  } catch (error) {
    showToast('Failed to delete schedules', 'error');
    console.error('Error deleting schedules:', error);
  }
};

const printScheduleDetails = () => {
  window.print();
};

// Helper functions
const formatDate = date => {
  if (!date) return 'N/A';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return date;
  }
};

const formatTime = time => {
  if (!time) return 'N/A';
  try {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  } catch {
    return time;
  }
};

</script>

<style scoped>
@media print {
  .no-print {
    display: none !important;
  }
}
</style>
