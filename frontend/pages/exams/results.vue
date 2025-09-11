<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-start">
      <div class="space-y-2">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Exam Results</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          View and analyze exam results with detailed statistics
        </p>
      </div>
    </div>

    <!-- Exam Selection -->
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Select Exam</h3>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Exam Type -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >Exam Type</label
          >
          <select
            v-model="selectedExamType"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            @change="loadExams"
          >
            <option value="">All Exam Types</option>
            <option v-for="type in examTypeOptions" :key="type.value" :value="type.value">
              {{ type.label }}
            </option>
          </select>
        </div>

        <!-- Class -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >Class</label
          >
          <select
            v-model="selectedClass"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            @change="loadExams"
          >
            <option value="">All Classes</option>
            <option v-for="cls in classOptions" :key="cls.value" :value="cls.value">
              {{ cls.label }}
            </option>
          </select>
        </div>

        <!-- Academic Year -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >Academic Year</label
          >
          <select
            v-model="selectedAcademicYear"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            @change="loadExams"
          >
            <option value="">All Years</option>
            <option v-for="year in academicYearOptions" :key="year.value" :value="year.value">
              {{ year.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- Exam List -->
      <div v-if="exams.length > 0" class="mt-6">
        <h4 class="text-md font-medium text-gray-900 dark:text-white mb-3">Available Exams</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="exam in exams"
            :key="exam.id"
            @click="selectExam(exam)"
            class="border border-gray-200 dark:border-gray-600 rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            :class="{
              'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20': selectedExam?.id === exam.id
            }"
          >
            <div class="flex items-center justify-between mb-2">
              <h5 class="font-medium text-gray-900 dark:text-white">{{ exam.name }}</h5>
              <span class="text-xs px-2 py-1 rounded-full" :class="getStatusClass(exam.status)">
                {{ exam.status }}
              </span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {{ exam.class?.name }} - {{ exam.subject?.name || 'All Subjects' }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-500">
              Date: {{ formatDate(exam.exam_date) }}
            </p>
          </div>
        </div>
      </div>

      <div v-else-if="!loading" class="mt-6 text-center text-gray-500 dark:text-gray-400">
        No exams found for the selected criteria
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <div
        class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500"
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
        Loading exams...
      </div>
    </div>

    <!-- Results Section -->
    <div
      v-if="selectedExam && examResults.length > 0"
      class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">Exam Results</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {{ selectedExam.name }} - {{ selectedExam.class?.name }}
            {{ selectedExam.section?.name ? `(${selectedExam.section.name})` : '' }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Max Marks: {{ selectedExam.max_marks }} | Date: {{ formatDate(selectedExam.exam_date) }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="exportResults"
            class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm flex items-center gap-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              ></path>
            </svg>
            Export Results
          </button>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg
                class="h-8 w-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                ></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-blue-600 dark:text-blue-400">Total Students</p>
              <p class="text-2xl font-semibold text-blue-900 dark:text-blue-100">
                {{ examResults.length }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg
                class="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-green-600 dark:text-green-400">Passed</p>
              <p class="text-2xl font-semibold text-green-900 dark:text-green-100">
                {{ passedCount }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg
                class="h-8 w-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-red-600 dark:text-red-400">Failed</p>
              <p class="text-2xl font-semibold text-red-900 dark:text-red-100">{{ failedCount }}</p>
            </div>
          </div>
        </div>

        <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg
                class="h-8 w-8 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                ></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-purple-600 dark:text-purple-400">Average</p>
              <p class="text-2xl font-semibold text-purple-900 dark:text-purple-100">
                {{ averagePercentage.toFixed(1) }}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Results Table -->
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
                Roll No
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
                Remarks
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
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
                {{ result.student?.roll_number }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ result.marks_obtained }}/{{ selectedExam.max_marks }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ result.percentage?.toFixed(2) }}%
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  v-if="result.grade"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getGradeClass(result.grade)"
                >
                  {{ result.grade }}
                </span>
                <span v-else class="text-gray-400">-</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getStatusClass(result.is_absent ? 'absent' : 'present')"
                >
                  {{ result.is_absent ? 'Absent' : 'Present' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ result.remarks || '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Grade Distribution -->
      <div class="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Grade Distribution</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div v-for="(count, grade) in gradeDistribution" :key="grade" class="text-center">
            <div class="text-lg font-semibold" :class="getGradeTextClass(grade)">{{ count }}</div>
            <div class="text-gray-600 dark:text-gray-400">{{ grade }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from '~/composables/useToast';
import { useExamOptions } from '~/composables/useExamOptions';
import { useDropdowns } from '~/composables/useDropdowns';
import { useAcademics } from '~/composables/useAcademics';
import { Exams } from '~/api';

// Composables
const { showToast } = useToast();
const { examTypeOptions, loadAllExamOptions } = useExamOptions();
const { classOptions, loadClasses } = useDropdowns();
const { academicYears, fetchAcademicYears } = useAcademics();

// Reactive data
const loading = ref(false);
const exams = ref([]);
const examResults = ref([]);
const selectedExam = ref(null);

// Filters
const selectedExamType = ref('');
const selectedClass = ref('');
const selectedAcademicYear = ref('');

// Computed
const academicYearOptions = computed(() => {
  return academicYears.value.map(year => ({
    value: year.name,
    label: year.name + (year.is_current ? ' (Current)' : '')
  }));
});

const passedCount = computed(() => {
  return examResults.value.filter(result => !result.is_absent && result.percentage >= 35).length;
});

const failedCount = computed(() => {
  return examResults.value.filter(result => !result.is_absent && result.percentage < 35).length;
});

const averagePercentage = computed(() => {
  const presentResults = examResults.value.filter(result => !result.is_absent);
  if (presentResults.length === 0) return 0;

  const totalPercentage = presentResults.reduce((sum, result) => {
    return sum + (result.percentage || 0);
  }, 0);

  return totalPercentage / presentResults.length;
});

const gradeDistribution = computed(() => {
  const distribution = {};
  examResults.value.forEach(result => {
    if (!result.is_absent && result.grade) {
      distribution[result.grade] = (distribution[result.grade] || 0) + 1;
    }
  });
  return distribution;
});

// Methods
const loadExams = async () => {
  try {
    loading.value = true;

    const filters = {};
    if (selectedExamType.value) filters.exam_type = selectedExamType.value;
    if (selectedClass.value) filters.class_id = selectedClass.value;
    if (selectedAcademicYear.value) filters.academic_year = selectedAcademicYear.value;

    const response = await Exams.getAll(filters);
    exams.value = response.data.exams || response.data.rows || [];
  } catch (error) {
    console.error('Error loading exams:', error);
    showToast('Failed to load exams', 'error');
  } finally {
    loading.value = false;
  }
};

const selectExam = async exam => {
  selectedExam.value = exam;
  await loadExamResults(exam.id);
};

const loadExamResults = async examId => {
  try {
    loading.value = true;
    const response = await Exams.getResults(examId);
    examResults.value = response.data.results || [];
  } catch (error) {
    console.error('Error loading exam results:', error);
    showToast('Failed to load exam results', 'error');
  } finally {
    loading.value = false;
  }
};

const exportResults = async () => {
  try {
    const response = await Exams.exportResults(selectedExam.value.id);

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `exam-results-${selectedExam.value.name}-${formatDate(selectedExam.value.exam_date)}.json`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    showToast('Results exported successfully', 'success');
  } catch (error) {
    console.error('Error exporting results:', error);
    showToast('Failed to export results', 'error');
  }
};

const getGradeClass = grade => {
  const gradeClasses = {
    'A+': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    A: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'B+': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    B: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'C+': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    C: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    D: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    F: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };
  return gradeClasses[grade] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
};

const getGradeTextClass = grade => {
  const gradeClasses = {
    'A+': 'text-green-600 dark:text-green-400',
    A: 'text-green-600 dark:text-green-400',
    'B+': 'text-blue-600 dark:text-blue-400',
    B: 'text-blue-600 dark:text-blue-400',
    'C+': 'text-yellow-600 dark:text-yellow-400',
    C: 'text-yellow-600 dark:text-yellow-400',
    D: 'text-orange-600 dark:text-orange-400',
    F: 'text-red-600 dark:text-red-400'
  };
  return gradeClasses[grade] || 'text-gray-600 dark:text-gray-400';
};

const getStatusClass = status => {
  const classes = {
    present: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    absent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };
  return classes[status] || classes.draft;
};

const formatDate = date => {
  return new Date(date).toLocaleDateString();
};

// Lifecycle
onMounted(async () => {
  await Promise.all([loadAllExamOptions(), loadClasses(), fetchAcademicYears()]);
});
</script>
