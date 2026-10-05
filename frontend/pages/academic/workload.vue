<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Teacher Workload</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          View and manage teacher subject assignments and workload distribution
        </p>
      </div>
    </div>

    <!-- Filters -->
    <div
      class="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <!-- Teacher Filter -->
        <div>
          <EnhancedDropdown
            v-model="filters.teacher_id"
            label="Teacher"
            :options="[{ label: 'All Teachers', value: '' }, ...teacherOptions]"
            placeholder="All Teachers"
            @update:model-value="loadWorkload"
          />
        </div>

        <!-- Academic Year Filter -->
        <div>
          <EnhancedDropdown
            v-model="filters.academic_year"
            label="Academic Year"
            :options="[{ label: 'All Years', value: '' }, ...academicYearOptions]"
            placeholder="All Years"
            @update:model-value="loadWorkload"
          />
        </div>

        <!-- Class Filter -->
        <div>
          <EnhancedDropdown
            v-model="filters.class_id"
            label="Class"
            :options="[{ label: 'All Classes', value: '' }, ...classOptions]"
            placeholder="All Classes"
            @update:model-value="loadWorkload"
          />
        </div>

        <!-- Clear Filters -->
        <div>
          <button
            @click="clearFilters"
            class="h-[46px] w-full px-4 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>

    <!-- Workload Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
        <div class="flex items-center">
          <div class="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <UsersIcon class="h-6 w-6" />
          </div>
          <div class="ml-4 flex-1">
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Total Teachers
            </p>
            <p class="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
              {{ stats.totalTeachers || 0 }}
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
        <div class="flex items-center">
          <div class="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
            <BookOpen class="h-6 w-6" />
          </div>
          <div class="ml-4 flex-1">
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Total Assignments
            </p>
            <p class="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
              {{ stats.totalAssignments || 0 }}
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
        <div class="flex items-center">
          <div class="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle class="h-6 w-6" />
          </div>
          <div class="ml-4 flex-1">
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Primary Assignments
            </p>
            <p class="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
              {{ stats.primaryAssignments || 0 }}
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
        <div class="flex items-center">
          <div class="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
            <Clock class="h-6 w-6" />
          </div>
          <div class="ml-4 flex-1">
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Avg. Workload
            </p>
            <p class="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
              {{ stats.averageWorkload || 0 }} subjects
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Teacher Workload Table -->
    <div
      class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
    >
      <div class="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-base font-bold text-gray-900 dark:text-white">
          Teacher Workload Distribution
        </h3>
      </div>

      <div v-if="loading" class="p-8 text-center text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
        <span class="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
        Loading workload data...
      </div>

      <div v-else-if="workloadData.length === 0" class="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
        No teacher assignments found for the selected filters.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50/80 dark:bg-gray-900/40">
            <tr>
              <th
                class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Teacher
              </th>
              <th
                class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Total Subjects
              </th>
              <th
                class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Primary Subjects
              </th>
              <th
                class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Classes
              </th>
              <th
                class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Workload Status
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
              v-for="teacher in workloadData"
              :key="teacher.teacher_id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
            >
              <td class="px-5 py-3.5 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-9 w-9">
                    <div
                      class="h-9 w-9 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs"
                    >
                      {{ getInitials(teacher.teacher_name) }}
                    </div>
                  </div>
                  <div class="ml-3">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ teacher.teacher_name }}
                    </div>
                    <div class="text-xs text-gray-400 dark:text-gray-500">
                      {{ teacher.teacher_email }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                {{ teacher.total_subjects }}
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                {{ teacher.primary_subjects }}
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                {{ teacher.classes.join(', ') || 'All Classes' }}
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap">
                <span
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                  :class="{
                    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900':
                      teacher.workload_status === 'balanced',
                    'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900':
                      teacher.workload_status === 'moderate',
                    'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900':
                      teacher.workload_status === 'heavy'
                  }"
                >
                  {{ teacher.workload_status?.toUpperCase() || 'UNKNOWN' }}
                </span>
              </td>
              <td class="px-5 py-3.5 whitespace-nowrap text-right text-sm font-medium">
                <button
                  @click="viewTeacherDetails(teacher)"
                  class="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline"
                >
                  View Details
                </button>
              </td>
            </tr>
          </tbody>
        </table>
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
import { useAcademics } from '~/composables/useAcademics';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { SubjectTeachers, Users } from '~/api';
import Modal from '~/components/ui/Modal.vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { Users as UsersIcon, BookOpen, CheckCircle, Clock } from 'lucide-vue-next';

// Composables
const { showToast } = useToast();
const { classOptions, academicYears, fetchClasses, fetchAcademicYears } = useAcademics();
const { selectedBranchId, branchScopeParams: scopeParams } = useGlobalBranch();

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
    const response = await SubjectTeachers.getWorkload({ ...filters.value, ...scopeParams.value });
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
    const response = await Users.getAll({ role: 'teacher', ...scopeParams.value });
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

const loadScopedOptions = async () => {
  filters.value.teacher_id = '';
  filters.value.class_id = '';
  await Promise.all([
    fetchClasses({ branchId: selectedBranchId.value || undefined }),
    loadTeachers()
  ]);
  await loadWorkload();
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
  await Promise.all([
    fetchClasses({ branchId: selectedBranchId.value || undefined }),
    fetchAcademicYears(),
    loadTeachers()
  ]);
  await loadWorkload();
});

watch(selectedBranchId, async () => {
  await loadScopedOptions();
});
</script>
