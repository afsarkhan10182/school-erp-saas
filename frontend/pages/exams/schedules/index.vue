<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Exam Schedules</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Manage exam schedules, timetables, and hall assignments
          </p>
        </div>
        <div class="mt-4 sm:mt-0">
          <button
            @click="$router.push('/exams/schedules/create')"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus class="h-4 w-4 mr-2" />
            Create Schedule
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Exam Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Exam
            </label>
            <EnhancedDropdown
              v-model="selectedExamId"
              :options="examOptions"
              placeholder="Select exam"
              :loading="examsLoading"
              @change="onExamChange"
            />
          </div>

          <!-- Class Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Class
            </label>
            <EnhancedDropdown
              v-model="selectedClassId"
              :options="classOptions"
              placeholder="Select class"
              :loading="classesLoading"
              @change="onClassChange"
            />
          </div>

          <!-- Date Range -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              From Date
            </label>
            <input
              v-model="fromDate"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              To Date
            </label>
            <input
              v-model="toDate"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div class="flex justify-end mt-4">
          <button
            @click="clearFilters"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <!-- Schedules Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div v-if="loading" class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading schedules...</p>
        </div>

        <div v-else-if="filteredSchedules.length === 0" class="p-8 text-center">
          <Calendar class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No schedules found</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating a new exam schedule
          </p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  #
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Subject Name
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
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Mark Distribution Details
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
                v-for="(schedule, index) in filteredSchedules"
                :key="schedule.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ index + 1 }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ schedule.subject?.name || 'N/A' }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {{ formatDate(schedule.exam_date) }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {{ formatTime(schedule.start_time) }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {{ formatTime(schedule.end_time) }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {{ schedule.hall?.name || 'N/A' }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {{ schedule.markDistribution?.name || 'N/A' }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end space-x-2">
                    <button
                      @click="editSchedule(schedule)"
                      class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      <Edit class="h-4 w-4" />
                    </button>
                    <button
                      @click="deleteSchedule(schedule)"
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { Plus, Calendar, Edit, Trash2, X, Filter, Clock, RotateCcw } from 'lucide-vue-next';
import Modal from '~/components/ui/Modal.vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { useToast } from '~/composables/useToast';
import { useAcademics } from '~/composables/useAcademics';
import { useExams } from '~/composables/useExams';
import { useAuth } from '~/composables/useAuth';
import { useBranches } from '~/composables/useBranches';
import { examScheduleApi } from '~/api/academic/exam-schedules';

// Composables
const { showToast } = useToast();
const { user } = useAuth();
const { branches, fetchBranches, loading: branchesLoading } = useBranches();
const { classes, classOptions, sectionOptions, sectionsLoading, fetchClasses, fetchSections } =
  useAcademics();
const { exams, examOptions, examsLoading, loadExams } = useExams();

// Reactive data
const loading = ref(false);
const schedules = ref([]);
const showModal = ref(false);
const saving = ref(false);
const editingSchedule = ref(null);

// Filters
const selectedExamId = ref('');
const selectedClassId = ref('');
const fromDate = ref('');
const toDate = ref('');

// Form data
const form = reactive({
  exam_id: '',
  class_id: '',
  section_id: '',
  subject_id: '',
  hall_id: '',
  exam_date: '',
  start_time: '',
  end_time: '',
  duration: '',
  distribution_type: 'combined',
  theory_marks: 0,
  practical_marks: 0,
  viva_marks: 0,
  assignment_marks: 0,
  total_marks: 100,
  pass_marks: 35
});

// Additional data
const halls = ref([]);
const hallsLoading = ref(false);
const classesLoading = ref(false);
const subjects = ref([]);
const subjectsLoading = ref(false);

// Hall capacity validation
const selectedHallCapacity = ref(0);
const classStudentCount = ref(0);
const hallCapacityWarning = computed(() => {
  return (
    selectedHallCapacity.value > 0 &&
    classStudentCount.value > 0 &&
    classStudentCount.value > selectedHallCapacity.value
  );
});

// Computed properties
const hallOptions = computed(() =>
  halls.value.map(hall => ({
    value: hall.id,
    label: `${hall.name} (Capacity: ${hall.capacity})`
  }))
);

const branchOptions = computed(() =>
  branches.value.map(branch => ({
    value: branch.id,
    label: branch.name
  }))
);

const subjectOptions = computed(() =>
  subjects.value.map(subject => ({
    value: subject.id,
    label: subject.name
  }))
);

const showSectionField = computed(() => {
  const selectedClass = classes.value.find(cls => cls.id === form.class_id);
  return selectedClass?.has_sections || false;
});

const filteredSchedules = computed(() => {
  let filtered = schedules.value;

  if (selectedExamId.value) {
    filtered = filtered.filter(schedule => schedule.exam_id === selectedExamId.value);
  }

  if (selectedClassId.value) {
    filtered = filtered.filter(schedule => schedule.class_id === selectedClassId.value);
  }

  if (fromDate.value) {
    filtered = filtered.filter(schedule => schedule.exam_date >= fromDate.value);
  }

  if (toDate.value) {
    filtered = filtered.filter(schedule => schedule.exam_date <= toDate.value);
  }

  return filtered;
});

// Methods
const loadSchedules = async () => {
  try {
    loading.value = true;
    const response = await examScheduleApi.getAll({
      school_id: user.value.school_id,
      branch_id: user.value.branch_id
    });
    schedules.value = response.data || [];
  } catch (error) {
    showToast('Failed to load schedules', 'error');
  } finally {
    loading.value = false;
  }
};

const loadHalls = async () => {
  try {
    hallsLoading.value = true;
    // TODO: Implement hall API
    halls.value = [];
  } catch (error) {
    showToast('Failed to load halls', 'error');
  } finally {
    hallsLoading.value = false;
  }
};

const loadSubjects = async () => {
  try {
    subjectsLoading.value = true;
    // TODO: Implement subject API
    subjects.value = [];
  } catch (error) {
    showToast('Failed to load subjects', 'error');
  } finally {
    subjectsLoading.value = false;
  }
};

const onBranchChange = async () => {
  form.class_id = '';
  form.section_id = '';
  form.exam_id = '';

  if (form.branch_id) {
    await fetchClasses({ branchId: form.branch_id });
    await loadExams({ branch_id: form.branch_id });
  }
};

const onExamChange = () => {
  // Handle exam change if needed
};

const openCreateModal = async () => {
  editingSchedule.value = null;
  resetForm();
  await Promise.all([
    fetchBranches(),
    loadExams(),
    fetchClasses({ branchId: user.value.branch_id }),
    loadHalls(),
    loadSubjects()
  ]);
  showModal.value = true;
};

const editSchedule = async schedule => {
  editingSchedule.value = schedule;
  form.exam_id = schedule.exam_id || '';
  form.class_id = schedule.class_id || '';
  form.section_id = schedule.section_id || '';
  form.subject_id = schedule.subject_id || '';
  form.hall_id = schedule.hall_id || '';
  form.exam_date = schedule.exam_date || '';
  form.start_time = schedule.start_time || '';
  form.end_time = schedule.end_time || '';
  form.duration = schedule.duration || '';
  form.distribution_type = schedule.distribution_type || 'combined';
  form.theory_marks = schedule.theory_marks || 0;
  form.practical_marks = schedule.practical_marks || 0;
  form.viva_marks = schedule.viva_marks || 0;
  form.assignment_marks = schedule.assignment_marks || 0;
  form.total_marks = schedule.total_marks || 100;
  form.pass_marks = schedule.pass_marks || 35;

  await Promise.all([
    loadExams(),
    fetchClasses({ branchId: user.value.branch_id }),
    loadHalls(),
    loadSubjects()
  ]);
  showModal.value = true;
};

const deleteSchedule = async schedule => {
  if (!confirm(`Are you sure you want to delete this schedule?`)) {
    return;
  }

  try {
    await examScheduleApi.delete(schedule.id);
    showToast('Schedule deleted successfully', 'success');
    await loadSchedules();
  } catch (error) {
    showToast('Failed to delete schedule', 'error');
  }
};

const saveSchedule = async () => {
  try {
    saving.value = true;

    const scheduleData = {
      ...form,
      school_id: user.value.school_id,
      branch_id: user.value.branch_id
    };

    if (editingSchedule.value) {
      await examScheduleApi.update(editingSchedule.value.id, scheduleData);
      showToast('Schedule updated successfully', 'success');
    } else {
      await examScheduleApi.create(scheduleData);
      showToast('Schedule created successfully', 'success');
    }

    closeModal();
    await loadSchedules();
  } catch (error) {
    showToast(`Failed to ${editingSchedule.value ? 'update' : 'create'} schedule`, 'error');
  } finally {
    saving.value = false;
  }
};

const closeModal = () => {
  showModal.value = false;
  editingSchedule.value = null;
  resetForm();
};

const resetForm = () => {
  form.exam_id = '';
  form.class_id = '';
  form.section_id = '';
  form.subject_id = '';
  form.hall_id = '';
  form.exam_date = '';
  form.start_time = '';
  form.end_time = '';
  form.duration = '';
  form.distribution_type = 'combined';
  form.theory_marks = 0;
  form.practical_marks = 0;
  form.viva_marks = 0;
  form.assignment_marks = 0;
  form.total_marks = 100;
  form.pass_marks = 35;
  selectedHallCapacity.value = 0;
  classStudentCount.value = 0;
};

const clearFilters = () => {
  selectedExamId.value = '';
  selectedClassId.value = '';
  fromDate.value = '';
  toDate.value = '';
};

const onClassChange = async () => {
  if (form.class_id) {
    await fetchSections({ classId: form.class_id });
    // TODO: Get student count for capacity validation
    classStudentCount.value = 0; // Placeholder
  }
};

const onHallChange = () => {
  if (form.hall_id) {
    const selectedHall = halls.value.find(hall => hall.id === form.hall_id);
    selectedHallCapacity.value = selectedHall?.capacity || 0;
  } else {
    selectedHallCapacity.value = 0;
  }
};

// Helper functions
const formatDate = date => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString();
};

const formatTime = time => {
  if (!time) return 'N/A';
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
  return `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${classes[status] || classes.scheduled}`;
};

const getStatusLabel = status => {
  const labels = {
    scheduled: 'Scheduled',
    ongoing: 'Ongoing',
    completed: 'Completed',
    cancelled: 'Cancelled'
  };
  return labels[status] || 'Unknown';
};

// Load initial data
onMounted(async () => {
  await Promise.all([
    loadSchedules(),
    loadExams(),
    fetchClasses({ branchId: user.value.branch_id })
  ]);
});
</script>
