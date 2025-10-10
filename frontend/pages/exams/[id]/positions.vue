<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Breadcrumb -->
      <nav class="flex mb-6" aria-label="Breadcrumb">
        <ol class="inline-flex items-center space-x-1 md:space-x-3">
          <li class="inline-flex items-center">
            <NuxtLink
              to="/exams"
              class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
            >
              <BookOpen class="w-4 h-4 mr-2" />
              Exams
            </NuxtLink>
          </li>
          <li>
            <div class="flex items-center">
              <ChevronRight class="w-4 h-4 text-gray-400" />
              <span class="ml-1 text-sm font-medium text-gray-500 md:ml-2 dark:text-gray-400">
                {{ exam?.name || 'Loading...' }}
              </span>
            </div>
          </li>
          <li aria-current="page">
            <div class="flex items-center">
              <ChevronRight class="w-4 h-4 text-gray-400" />
              <span class="ml-1 text-sm font-medium text-gray-700 md:ml-2 dark:text-gray-300">
                Positions & Ranks
              </span>
            </div>
          </li>
        </ol>
      </nav>

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Positions & Ranks</h1>
        <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Calculate and view student positions and ranks
        </p>
      </div>

      <!-- Exam Details Card -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Exam Details</h3>
        <div v-if="loading" class="text-center py-4">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
        <div v-else-if="exam" class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Exam Name</span>
            <p class="mt-1 text-sm font-medium text-gray-900 dark:text-white">{{ exam.name }}</p>
          </div>
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Exam Type</span>
            <p class="mt-1 text-sm font-medium text-gray-900 dark:text-white">
              {{ exam.exam_type?.name || 'N/A' }}
            </p>
          </div>
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Academic Year</span>
            <p class="mt-1 text-sm font-medium text-gray-900 dark:text-white">
              {{ exam.academic_year || 'N/A' }}
            </p>
          </div>
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Status</span>
            <span
              :class="[
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                getStatusBadgeClass(exam.status)
              ]"
            >
              {{ getStatusText(exam.status) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Filter Section -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Filter Positions</h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Class
            </label>
            <EnhancedDropdown
              v-model="filters.class_id"
              :options="classOptions"
              placeholder="All classes"
              :loading="classesLoading"
              @update:model-value="onClassChange"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Section
            </label>
            <EnhancedDropdown
              v-model="filters.section_id"
              :options="sectionOptions"
              placeholder="All sections"
              :loading="sectionsLoading"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject
            </label>
            <EnhancedDropdown
              v-model="filters.subject_id"
              :options="subjectOptions"
              placeholder="All subjects"
              :loading="subjectsLoading"
            />
          </div>
        </div>

        <div class="mt-4 flex justify-between">
          <button
            @click="loadPositions"
            :disabled="loadingPositions"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Search class="w-4 h-4 mr-2" />
            Load Positions
          </button>

          <div class="flex space-x-2">
            <button
              @click="calculatePositions"
              :disabled="calculating || positions.length === 0"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              <Award class="w-4 h-4 mr-2" />
              Calculate Positions
            </button>

            <button
              @click="exportPositions"
              :disabled="positions.length === 0"
              class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <Download class="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      <!-- Positions Summary -->
      <div v-if="positions.length > 0" class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <Users class="h-6 w-6 text-blue-600" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Students
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ positions.length }}
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
                <Trophy class="h-6 w-6 text-yellow-600" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Topper
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ topper?.student?.first_name }} {{ topper?.student?.last_name }}
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
                <TrendingUp class="h-6 w-6 text-green-600" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Highest %
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ highestPercentage }}%
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
                <BarChart3 class="h-6 w-6 text-purple-600" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Average %
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ averagePercentage }}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Positions Table -->
      <div v-if="positions.length > 0" class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Student Positions ({{ positions.length }} students)
          </h3>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  Rank
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  Roll No
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  Student Name
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  Class & Section
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  Total Marks
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  Percentage
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  Grade
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  Position Change
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="(position, index) in filteredPositions" :key="position.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <div class="flex items-center">
                    <span :class="getRankClass(index + 1)">
                      {{ index + 1 }}
                    </span>
                    <Trophy v-if="index < 3" class="w-4 h-4 ml-2 text-yellow-500" />
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ position.student?.roll_number }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ position.student?.first_name }} {{ position.student?.last_name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ position.class?.name }} - {{ position.section?.name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ position.total_marks || 0 }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <span :class="getPercentageClass(position.percentage)">
                    {{ position.percentage?.toFixed(1) || 0 }}%
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <span :class="getGradeClass(position.grade)">
                    {{ position.grade || 'N/A' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <span :class="getPositionChangeClass(position.position_change)">
                    {{ getPositionChangeText(position.position_change) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Actions -->
        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            @click="navigateTo('/exams')"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Back to Exams
          </button>
          <button
            @click="completePositionCalculation"
            :disabled="calculating"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            <CheckCircle class="w-4 h-4 mr-2" />
            Complete Position Calculation
          </button>
        </div>
      </div>

      <!-- No Positions Message -->
      <div
        v-else-if="!loadingPositions && positions.length === 0"
        class="bg-white dark:bg-gray-800 shadow rounded-lg p-12 text-center"
      >
        <Award class="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No positions found</h3>
        <p class="text-gray-500 dark:text-gray-400">Load positions to view student rankings.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { navigateTo } from '#app';
import {
  BookOpen,
  ChevronRight,
  Users,
  Trophy,
  TrendingUp,
  BarChart3,
  Search,
  Award,
  Download,
  CheckCircle
} from 'lucide-vue-next';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { useToast } from '~/composables/useToast';
import { useAcademics } from '~/composables/useAcademics';

const route = useRoute();
const { showToast } = useToast();

// Composables
const {
  classes,
  sections,
  subjects,
  loading: classesLoading,
  sectionsLoading,
  subjectsLoading,
  fetchClasses,
  fetchSections,
  fetchSubjects
} = useAcademics();

// State
const exam = ref(null);
const positions = ref([]);
const loading = ref(false);
const loadingPositions = ref(false);
const calculating = ref(false);

// Filters
const filters = reactive({
  class_id: '',
  section_id: '',
  subject_id: ''
});

// Computed
const classOptions = computed(() =>
  classes.value.map(cls => ({
    value: cls.id,
    label: cls.name
  }))
);

const sectionOptions = computed(() =>
  sections.value.map(section => ({
    value: section.id,
    label: section.name
  }))
);

const subjectOptions = computed(() =>
  subjects.value.map(subject => ({
    value: subject.id,
    label: subject.name
  }))
);

const filteredPositions = computed(() => {
  let filtered = positions.value;

  if (filters.class_id) {
    filtered = filtered.filter(p => p.class_id === filters.class_id);
  }
  if (filters.section_id) {
    filtered = filtered.filter(p => p.section_id === filters.section_id);
  }
  if (filters.subject_id) {
    filtered = filtered.filter(p => p.subject_id === filters.subject_id);
  }

  return filtered;
});

const topper = computed(() => positions.value[0]);

const highestPercentage = computed(() => {
  if (positions.value.length === 0) return 0;
  return Math.max(...positions.value.map(p => p.percentage || 0)).toFixed(1);
});

const averagePercentage = computed(() => {
  if (positions.value.length === 0) return 0;
  const total = positions.value.reduce((sum, p) => sum + (p.percentage || 0), 0);
  return (total / positions.value.length).toFixed(1);
});

// Methods
const loadExam = async () => {
  loading.value = true;
  try {
    const { examApi } = await import('~/api/academic/exams');
    const response = await examApi.getById(route.params.id);
    exam.value = response.data;
  } catch (error) {
    showToast('Failed to load exam', 'error');
    navigateTo('/exams');
  } finally {
    loading.value = false;
  }
};

const onClassChange = async () => {
  filters.section_id = '';

  if (filters.class_id) {
    await fetchSections({ classId: filters.class_id });
  }
};

const loadPositions = async () => {
  loadingPositions.value = true;
  try {
    const { examPositionApi } = await import('~/api/academic/exam-positions');
    const response = await examPositionApi.getByExamId(route.params.id, filters);
    positions.value = response.data || [];
  } catch (error) {
    showToast('Failed to load positions', 'error');
  } finally {
    loadingPositions.value = false;
  }
};

const calculatePositions = async () => {
  try {
    calculating.value = true;

    const { examPositionApi } = await import('~/api/academic/exam-positions');
    const response = await examPositionApi.calculatePositions(route.params.id);

    if (response.success) {
      showToast('Positions calculated successfully', 'success');
      await loadPositions();
    }
  } catch (error) {
    showToast('Failed to calculate positions', 'error');
  } finally {
    calculating.value = false;
  }
};

const exportPositions = async () => {
  try {
    const { examPositionApi } = await import('~/api/academic/exam-positions');
    const response = await examPositionApi.exportPositions(route.params.id, filters);

    // Create download link
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `exam-positions-${exam.value?.name || 'positions'}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);

    showToast('Positions exported successfully', 'success');
  } catch (error) {
    showToast('Failed to export positions', 'error');
  }
};

const completePositionCalculation = async () => {
  try {
    calculating.value = true;

    const { examApi } = await import('~/api/academic/exams');
    const response = await examApi.update(route.params.id, { status: 'completed' });

    if (response.success) {
      showToast('Position calculation completed successfully', 'success');
      navigateTo('/exams');
    }
  } catch (error) {
    showToast('Failed to complete position calculation', 'error');
  } finally {
    calculating.value = false;
  }
};

const getRankClass = rank => {
  if (rank === 1) return 'text-yellow-600 font-bold text-lg';
  if (rank === 2) return 'text-gray-500 font-bold text-lg';
  if (rank === 3) return 'text-orange-600 font-bold text-lg';
  return 'text-gray-700 font-medium';
};

const getPercentageClass = percentage => {
  if (percentage >= 80) return 'text-green-600 font-medium';
  if (percentage >= 60) return 'text-blue-600 font-medium';
  if (percentage >= 40) return 'text-yellow-600 font-medium';
  return 'text-red-600 font-medium';
};

const getGradeClass = grade => {
  const classes = {
    'A+': 'text-green-600 font-bold',
    A: 'text-green-600 font-medium',
    'B+': 'text-blue-600 font-medium',
    B: 'text-blue-600 font-medium',
    'C+': 'text-yellow-600 font-medium',
    C: 'text-yellow-600 font-medium',
    D: 'text-orange-600 font-medium',
    F: 'text-red-600 font-medium'
  };
  return classes[grade] || 'text-gray-500';
};

const getPositionChangeClass = change => {
  if (change > 0) return 'text-green-600 font-medium';
  if (change < 0) return 'text-red-600 font-medium';
  return 'text-gray-500';
};

const getPositionChangeText = change => {
  if (change > 0) return `+${change}`;
  if (change < 0) return `${change}`;
  return 'No change';
};

const getStatusBadgeClass = status => {
  const classes = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    marks_entered: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    grades_calculated: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  };
  return classes[status] || classes.draft;
};

const getStatusText = status => {
  const texts = {
    draft: 'Draft',
    scheduled: 'Scheduled',
    marks_entered: 'Marks Entered',
    grades_calculated: 'Grades Calculated',
    completed: 'Completed'
  };
  return texts[status] || 'Unknown';
};

// Lifecycle
onMounted(async () => {
  await Promise.all([loadExam(), fetchClasses(), fetchSubjects()]);
});
</script>
