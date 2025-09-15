<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Teacher Workload</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
            View and manage teacher subject assignments and workload distribution
          </p>
        </div>
      </div>

      <!-- Filters -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6"
      >
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Teacher Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >Teacher</label
            >
            <select
              v-model="filters.teacher_id"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              @change="loadWorkload"
            >
              <option value="">All Teachers</option>
              <option v-for="teacher in teacherOptions" :key="teacher.value" :value="teacher.value">
                {{ teacher.label }}
              </option>
            </select>
          </div>

          <!-- Academic Year Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >Academic Year</label
            >
            <select
              v-model="filters.academic_year"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              @change="loadWorkload"
            >
              <option value="">All Years</option>
              <option v-for="year in academicYearOptions" :key="year.value" :value="year.value">
                {{ year.label }}
              </option>
            </select>
          </div>

          <!-- Class Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >Class</label
            >
            <select
              v-model="filters.class_id"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              @change="loadWorkload"
            >
              <option value="">All Classes</option>
              <option v-for="cls in classOptions" :key="cls.value" :value="cls.value">
                {{ cls.label }}
              </option>
            </select>
          </div>

          <!-- Clear Filters -->
          <div class="flex items-end">
            <button
              @click="clearFilters"
              class="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Workload Summary -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <Users class="h-6 w-6 text-gray-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Teachers
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ stats.totalTeachers || 0 }}
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
                <BookOpen class="h-6 w-6 text-blue-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Assignments
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ stats.totalAssignments || 0 }}
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
                    Primary Assignments
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ stats.primaryAssignments || 0 }}
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
                <Clock class="h-6 w-6 text-yellow-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Avg. Workload
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ stats.averageWorkload || 0 }} subjects
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Teacher Workload Table -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Teacher Workload Distribution
          </h3>
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
            Loading workload data...
          </div>
        </div>

        <div v-else-if="workloadData.length === 0" class="p-8 text-center">
          <div class="text-gray-500 dark:text-gray-400">
            <Users class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No workload data found
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No teacher assignments found for the selected filters.
            </p>
          </div>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Teacher
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Total Subjects
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Primary Subjects
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Classes
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Workload Status
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
                v-for="teacher in workloadData"
                :key="teacher.teacher_id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div
                        class="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center"
                      >
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {{ getInitials(teacher.teacher_name) }}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ teacher.teacher_name }}
                      </div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">
                        {{ teacher.teacher_email }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ teacher.total_subjects }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ teacher.primary_subjects }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ teacher.classes.join(', ') || 'All Classes' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="{
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200':
                        teacher.workload_status === 'balanced',
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200':
                        teacher.workload_status === 'moderate',
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200':
                        teacher.workload_status === 'heavy'
                    }"
                  >
                    {{ teacher.workload_status?.toUpperCase() || 'UNKNOWN' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    @click="viewTeacherDetails(teacher)"
                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Teacher Details Modal -->
    <Modal :show="showDetailsModal" @close="closeDetailsModal">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Teacher Assignment Details
        </h3>
      </template>

      <template #body>
        <div v-if="selectedTeacher" class="space-y-4">
          <div class="flex items-center space-x-4">
            <div
              class="h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center"
            >
              <span class="text-lg font-medium text-gray-700 dark:text-gray-300">
                {{ getInitials(selectedTeacher.teacher_name) }}
              </span>
            </div>
            <div>
              <h4 class="text-lg font-medium text-gray-900 dark:text-white">
                {{ selectedTeacher.teacher_name }}
              </h4>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ selectedTeacher.teacher_email }}
              </p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >Total Subjects</label
              >
              <p class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ selectedTeacher.total_subjects }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >Primary Subjects</label
              >
              <p class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ selectedTeacher.primary_subjects }}
              </p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >Subject Assignments</label
            >
            <div class="space-y-2">
              <div
                v-for="assignment in selectedTeacher.assignments"
                :key="assignment.id"
                class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ assignment.subject_name }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ assignment.class_name || 'All Classes' }}
                  </p>
                </div>
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="{
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200':
                      assignment.is_primary,
                    'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300':
                      !assignment.is_primary
                  }"
                >
                  {{ assignment.is_primary ? 'Primary' : 'Secondary' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from '~/composables/useToast';
import { useDropdowns } from '~/composables/useDropdowns';
import { useAcademics } from '~/composables/useAcademics';
import { SubjectTeachers, Users } from '~/api';
import Modal from '~/components/ui/Modal.vue';
import { Users as UsersIcon, BookOpen, CheckCircle, Clock } from 'lucide-vue-next';

// Composables
const { showToast } = useToast();
const { classOptions, loadClasses } = useDropdowns();
const { academicYears, fetchAcademicYears } = useAcademics();

// Reactive data
const loading = ref(false);
const workloadData = ref([]);
const teacherOptions = ref([]);
const stats = ref({});
const showDetailsModal = ref(false);
const selectedTeacher = ref(null);

// Filters
const filters = ref({
  teacher_id: '',
  academic_year: '',
  class_id: ''
});

// Computed
const academicYearOptions = computed(() => {
  return academicYears.value.map(year => ({
    value: year.name,
    label: year.name + (year.is_current ? ' (Current)' : '')
  }));
});

// Methods
const loadWorkload = async () => {
  try {
    loading.value = true;
    const response = await SubjectTeachers.getWorkload(filters.value);
    workloadData.value = response.data.workload || [];
    stats.value = response.data.stats || {};
  } catch (error) {
    showToast('Failed to load workload data', 'error');
    console.error('Error loading workload data:', error);
  } finally {
    loading.value = false;
  }
};

const loadTeachers = async () => {
  try {
    const response = await Users.getAll({ role: 'teacher' });
    teacherOptions.value = (response.data.users || response.data.rows || []).map(teacher => ({
      value: teacher.id,
      label: `${teacher.first_name} ${teacher.last_name} (${teacher.email})`
    }));
  } catch (error) {
    console.error('Error loading teachers:', error);
  }
};

const clearFilters = () => {
  filters.value = {
    teacher_id: '',
    academic_year: '',
    class_id: ''
  };
  loadWorkload();
};

const viewTeacherDetails = teacher => {
  selectedTeacher.value = teacher;
  showDetailsModal.value = true;
};

const closeDetailsModal = () => {
  showDetailsModal.value = false;
  selectedTeacher.value = null;
};

const getInitials = name => {
  if (!name) return '??';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Lifecycle
onMounted(async () => {
  await Promise.all([loadClasses(), fetchAcademicYears(), loadTeachers()]);
  await loadWorkload();
});
</script>
