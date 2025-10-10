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
                Results & Grades
              </span>
            </div>
          </li>
        </ol>
      </nav>

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Results & Grades</h1>
        <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
          View results, calculate grades, and manage student performance
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
              {{ getExamStatusText(exam.status) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Filter Section -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Filter Results</h3>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Grade
            </label>
            <EnhancedDropdown
              v-model="filters.grade"
              :options="gradeOptions"
              placeholder="All grades"
            />
          </div>
        </div>

        <div class="mt-4 flex justify-between">
          <button
            @click="loadResults"
            :disabled="loadingResults"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Search class="w-4 h-4 mr-2" />
            Load Results
          </button>

          <div class="flex space-x-2">
            <button
              @click="calculateGrades"
              :disabled="calculating || results.length === 0"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              <Award class="w-4 h-4 mr-2" />
              Calculate Grades
            </button>

            <button
              @click="exportResults"
              :disabled="results.length === 0"
              class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <Download class="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      <!-- Results Summary -->
      <div v-if="results.length > 0" class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
                    {{ results.length }}
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
                <CheckCircle class="h-6 w-6 text-green-600" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Passed
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ passedCount }}
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
                <XCircle class="h-6 w-6 text-red-600" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Failed
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ failedCount }}
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
                <TrendingUp class="h-6 w-6 text-purple-600" />
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

      <!-- Results Table -->
      <div v-if="results.length > 0" class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Student Results ({{ results.length }} students)
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
                  Practical
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  Written
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  Total
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  %
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  Grade
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="(result, index) in filteredResults" :key="result.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ index + 1 }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ result.student?.roll_number }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ result.student?.first_name }} {{ result.student?.last_name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ result.class?.name }} - {{ result.section?.name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ result.practical_marks || 0 }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ result.written_marks || 0 }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ result.total_marks || 0 }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <span :class="getPercentageClass(result.percentage)">
                    {{ result.percentage?.toFixed(1) || 0 }}%
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <span :class="getGradeClass(result.grade)">
                    {{ result.grade || 'N/A' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <span :class="getStatusClass(result.is_absent, result.percentage)">
                    {{ getStatusText(result.is_absent, result.percentage) }}
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
            @click="completeGradeCalculation"
            :disabled="calculating || !gradesCalculated"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            <CheckCircle class="w-4 h-4 mr-2" />
            Complete Grade Calculation
          </button>
        </div>
      </div>

      <!-- No Results Message -->
      <div
        v-else-if="!loadingResults && results.length === 0"
        class="bg-white dark:bg-gray-800 shadow rounded-lg p-12 text-center"
      >
        <Award class="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No results found</h3>
        <p class="text-gray-500 dark:text-gray-400">Load results to view student performance.</p>
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
  CheckCircle,
  XCircle,
  TrendingUp,
  Search,
  Award,
  Download
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
const results = ref([]);
const loading = ref(false);
const loadingResults = ref(false);
const calculating = ref(false);

// Filters
const filters = reactive({
  class_id: '',
  section_id: '',
  subject_id: '',
  grade: ''
});

// Grade options
const gradeOptions = [
  { value: 'A+', label: 'A+' },
  { value: 'A', label: 'A' },
  { value: 'B+', label: 'B+' },
  { value: 'B', label: 'B' },
  { value: 'C+', label: 'C+' },
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D' },
  { value: 'F', label: 'F' }
];

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

const filteredResults = computed(() => {
  let filtered = results.value;

  if (filters.class_id) {
    filtered = filtered.filter(r => r.class_id === filters.class_id);
  }
  if (filters.section_id) {
    filtered = filtered.filter(r => r.section_id === filters.section_id);
  }
  if (filters.subject_id) {
    filtered = filtered.filter(r => r.subject_id === filters.subject_id);
  }
  if (filters.grade) {
    filtered = filtered.filter(r => r.grade === filters.grade);
  }

  return filtered;
});

const passedCount = computed(
  () => results.value.filter(r => !r.is_absent && r.percentage >= 40).length
);

const failedCount = computed(
  () => results.value.filter(r => !r.is_absent && r.percentage < 40).length
);

const averagePercentage = computed(() => {
  const presentResults = results.value.filter(r => !r.is_absent && r.percentage > 0);
  if (presentResults.length === 0) return 0;

  const total = presentResults.reduce((sum, r) => sum + r.percentage, 0);
  return (total / presentResults.length).toFixed(1);
});

const gradesCalculated = computed(() => results.value.every(r => r.grade && r.grade !== 'N/A'));

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

const loadResults = async () => {
  loadingResults.value = true;
  try {
    const { examResultApi } = await import('~/api/academic/exam-results');
    const response = await examResultApi.getByExamId(route.params.id, filters);
    results.value = response.data || [];
  } catch (error) {
    showToast('Failed to load results', 'error');
  } finally {
    loadingResults.value = false;
  }
};

const calculateGrades = async () => {
  try {
    calculating.value = true;

    const { examResultApi } = await import('~/api/academic/exam-results');
    const response = await examResultApi.calculateGrades(route.params.id);

    if (response.success) {
      showToast('Grades calculated successfully', 'success');
      await loadResults();
    }
  } catch (error) {
    showToast('Failed to calculate grades', 'error');
  } finally {
    calculating.value = false;
  }
};

const exportResults = async () => {
  try {
    const { examResultApi } = await import('~/api/academic/exam-results');
    const response = await examResultApi.exportResults(route.params.id, filters);

    // Create download link
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `exam-results-${exam.value?.name || 'results'}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);

    showToast('Results exported successfully', 'success');
  } catch (error) {
    showToast('Failed to export results', 'error');
  }
};

const completeGradeCalculation = async () => {
  try {
    calculating.value = true;

    const { examApi } = await import('~/api/academic/exams');
    const response = await examApi.update(route.params.id, { status: 'grades_calculated' });

    if (response.success) {
      showToast('Grade calculation completed successfully', 'success');
      navigateTo('/exams');
    }
  } catch (error) {
    showToast('Failed to complete grade calculation', 'error');
  } finally {
    calculating.value = false;
  }
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

const getStatusClass = (isAbsent, percentage) => {
  if (isAbsent) return 'text-gray-500';
  if (percentage >= 40) return 'text-green-600 font-medium';
  return 'text-red-600 font-medium';
};

const getStatusText = (isAbsent, percentage) => {
  if (isAbsent) return 'Absent';
  if (percentage >= 40) return 'Pass';
  return 'Fail';
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

const getExamStatusText = status => {
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
