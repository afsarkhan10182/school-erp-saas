<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <div class="flex items-center space-x-2 mb-2">
            <button
              @click="$router.push('/exams')"
              class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft class="h-5 w-5" />
            </button>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Exam Results</h1>
          </div>
          <p v-if="exam" class="text-sm text-gray-600 dark:text-gray-400">
            {{ exam.name }} - {{ exam.term?.name || 'N/A' }}
          </p>
        </div>
        <div class="mt-4 sm:mt-0 flex items-center space-x-3">
          <button
            v-if="exam && examResults.length > 0 && !exam.result_status"
            @click="handleCalculateGrades"
            :disabled="calculatingGrades"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Award class="h-4 w-4 mr-2" />
            {{ calculatingGrades ? 'Calculating...' : 'Calculate Grades' }}
          </button>
          <button
            v-if="examResults.length > 0"
            @click="handleExport"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            <Download class="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      <!-- Exam Info Card -->
      <div v-if="exam" class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Max Marks</p>
            <p class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ exam.max_marks || 'N/A' }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Status</p>
            <p class="text-lg font-semibold text-gray-900 dark:text-white">
              <span
                :class="exam.result_status ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'"
              >
                {{ exam.result_status ? 'Published' : 'Hidden' }}
              </span>
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Total Results</p>
            <p class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ pagination.total || 0 }}
            </p>
          </div>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div v-if="examResults.length > 0" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Students</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ examResults.length }}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p class="text-sm text-gray-500 dark:text-gray-400">Passed</p>
          <p class="text-2xl font-bold text-green-600">{{ passedCount }}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p class="text-sm text-gray-500 dark:text-gray-400">Failed</p>
          <p class="text-2xl font-bold text-red-600">{{ failedCount }}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p class="text-sm text-gray-500 dark:text-gray-400">Average %</p>
          <p class="text-2xl font-bold text-indigo-600">{{ averagePercentage.toFixed(2) }}%</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div class="flex items-end gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <div class="relative">
              <Search
                class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
              />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search by name, admission number..."
                class="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                @input="handleSearch"
              />
            </div>
          </div>
          <div class="w-48">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Grade Filter
            </label>
            <EnhancedDropdown
              v-model="gradeFilter"
              :options="gradeOptions"
              placeholder="All Grades"
              @change="handleFilter"
            />
          </div>
          <div class="w-48">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort By
            </label>
            <EnhancedDropdown
              v-model="sortBy"
              :options="sortOptions"
              placeholder="Sort results"
              @change="handleFilter"
            />
          </div>
        </div>
      </div>

      <!-- Results Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div v-if="loading" class="text-center py-12">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
          ></div>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading results...</p>
        </div>

        <div v-else-if="filteredResults.length === 0" class="text-center py-12">
          <BarChart3 class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No results found</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{
              searchQuery || gradeFilter
                ? 'Try adjusting your filters'
                : 'No results available for this exam'
            }}
          </p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Rank
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Student
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Admission No.
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Roll No.
                </th>
                <th
                  class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Marks Obtained
                </th>
                <th
                  class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Max Marks
                </th>
                <th
                  class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Percentage
                </th>
                <th
                  class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Grade
                </th>
                <th
                  class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="(result, index) in filteredResults"
                :key="result.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"
                >
                  {{ result.rank || index + 1 }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ getStudentName(result.student) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ result.student?.admission_number || 'N/A' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ result.student?.roll_number || 'N/A' }}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white"
                >
                  {{ result.is_absent ? 'Absent' : result.marks_obtained || 0 }}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400"
                >
                  {{ result.exam?.max_marks || exam?.max_marks || 'N/A' }}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white"
                >
                  {{ result.is_absent ? '-' : Number(result.percentage ?? 0).toFixed(2) }}%
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <span
                    v-if="result.grade"
                    :class="getGradeClass(result.grade)"
                    class="px-2 py-1 rounded-full text-xs font-medium"
                  >
                    {{ result.grade }}
                  </span>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <span
                    :class="
                      result.is_absent || result.is_passed == null
                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        : result.is_passed
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    "
                    class="px-2 py-1 rounded-full text-xs font-medium"
                  >
                    {{
                      result.is_absent
                        ? 'Absent'
                        : result.is_passed == null
                          ? 'N/A'
                          : result.is_passed
                            ? 'Passed'
                            : 'Failed'
                    }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {{ result.remarks || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          v-if="pagination.totalPages > 1"
          class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between"
        >
          <div class="flex items-center">
            <span class="text-sm text-gray-700 dark:text-gray-300">
              Showing {{ (pagination.page - 1) * pagination.limit + 1 }} to
              {{ Math.min(pagination.page * pagination.limit, pagination.total) }} of
              {{ pagination.total }} results
            </span>
          </div>
          <div class="flex items-center space-x-2">
            <button
              @click="loadPage(pagination.page - 1)"
              :disabled="pagination.page === 1"
              class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft class="h-5 w-5" />
            </button>
            <span class="px-3 py-1 bg-indigo-600 text-white rounded">{{ pagination.page }}</span>
            <button
              @click="loadPage(pagination.page + 1)"
              :disabled="pagination.page >= pagination.pages"
              class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowLeft,
  Award,
  Download,
  Search,
  BarChart3,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next';
import { useExamResults } from '~/composables/useExamResults';
import { examApi } from '~/api/academic/exams';
import { examResultApi } from '~/api/academic/exam-results';
import { useToast } from '~/composables/useToast';
import { createApiInstance } from '~/utils/api';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';

const route = useRoute();
const router = useRouter();
const { showToast } = useToast();
const examId = route.params.id;

const {
  examResults,
  loading,
  error,
  passedResults,
  failedResults,
  averagePercentage,
  fetchExamResults,
  calculateGrades
} = useExamResults();

const exam = ref(null);
const searchQuery = ref('');
const gradeFilter = ref('');
const sortBy = ref('marks_obtained');
const calculatingGrades = ref(false);
const pagination = ref({
  page: 1,
  limit: 50,
  total: 0,
  pages: 0
});

// Computed properties
const uniqueGrades = computed(() => {
  const grades = new Set();
  examResults.value.forEach(result => {
    if (result.grade) grades.add(result.grade);
  });
  return Array.from(grades).sort();
});
const gradeOptions = computed(() => [
  ...uniqueGrades.value.map(grade => ({ value: grade, label: grade }))
]);
const sortOptions = [
  { value: 'marks_obtained', label: 'Marks (High to Low)' },
  { value: 'percentage', label: 'Percentage (High to Low)' },
  { value: 'grade', label: 'Grade' },
  { value: 'student.first_name', label: 'Name (A-Z)' }
];

const passedCount = computed(() => {
  return examResults.value.filter(r => r.is_passed && !r.is_absent).length;
});

const failedCount = computed(() => {
  return examResults.value.filter(r => r.is_passed === false && !r.is_absent).length;
});

const filteredResults = computed(() => {
  let filtered = [...examResults.value];

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(result => {
      const student = result.student;
      const name = `${student?.first_name || ''} ${student?.last_name || ''}`.toLowerCase();
      const admissionNo = student?.admission_number?.toLowerCase() || '';
      const rollNo = student?.roll_number?.toLowerCase() || '';
      return name.includes(query) || admissionNo.includes(query) || rollNo.includes(query);
    });
  }

  // Apply grade filter
  if (gradeFilter.value) {
    filtered = filtered.filter(result => result.grade === gradeFilter.value);
  }

  // Apply sorting
  if (sortBy.value === 'marks_obtained') {
    filtered.sort((a, b) => (b.marks_obtained || 0) - (a.marks_obtained || 0));
  } else if (sortBy.value === 'percentage') {
    filtered.sort((a, b) => (b.percentage || 0) - (a.percentage || 0));
  } else if (sortBy.value === 'grade') {
    filtered.sort((a, b) => {
      if (!a.grade && !b.grade) return 0;
      if (!a.grade) return 1;
      if (!b.grade) return -1;
      return a.grade.localeCompare(b.grade);
    });
  } else if (sortBy.value === 'student.first_name') {
    filtered.sort((a, b) => {
      const nameA = getStudentName(a.student).toLowerCase();
      const nameB = getStudentName(b.student).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }

  return filtered;
});

// Methods
const loadExam = async () => {
  try {
    const response = await examApi.getById(examId);
    if (response.success) {
      exam.value = response.data?.exam || response.data;
    }
  } catch (err) {
    showToast(err?.message || 'Failed to load exam details', 'error');
  }
};

const loadResults = async () => {
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      search: searchQuery.value || undefined,
      grade: gradeFilter.value || undefined,
      sort_by: sortBy.value,
      sort_order: 'DESC'
    };

    const response = await fetchExamResults(examId, params);
    if (response.success && response.data) {
      pagination.value = {
        page: response.data.pagination?.page || pagination.value.page,
        limit: response.data.pagination?.limit || pagination.value.limit,
        total: response.data.pagination?.total || 0,
        pages: response.data.pagination?.totalPages ?? response.data.pagination?.pages ?? 0
      };
    }
  } catch (err) {
    showToast(err?.message || 'Failed to load results', 'error');
  }
};

const handleCalculateGrades = async () => {
  if (!confirm('Are you sure you want to calculate grades for all students?')) {
    return;
  }

  calculatingGrades.value = true;
  try {
    const response = await calculateGrades(examId);
    if (response.success) {
      showToast('Grades calculated successfully', 'success');
      await loadResults();
      await loadExam();
    }
  } catch (err) {
    showToast(err?.message || 'Failed to calculate grades', 'error');
  } finally {
    calculatingGrades.value = false;
  }
};

const handleExport = async () => {
  try {
    const api = createApiInstance();
    const response = await api.get(`/exams/${examId}/results/export?format=csv`, {
      responseType: 'blob'
    });

    // Extract filename from content-disposition header or use default
    let filename = `exam-results-${examId}.csv`;
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Create download link
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    showToast('Results exported successfully', 'success');
  } catch (err) {
    showToast(err?.message || 'Failed to export results', 'error');
  }
};

const handleSearch = () => {
  // Debounce search - reload after user stops typing
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1;
    loadResults();
  }, 500);
};

let searchTimeout = null;

const handleFilter = () => {
  pagination.value.page = 1;
  loadResults();
};

const loadPage = page => {
  if (page >= 1 && page <= pagination.value.pages) {
    pagination.value.page = page;
    loadResults();
  }
};

const getStudentName = student => {
  if (!student) return 'N/A';
  return `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'N/A';
};

const getGradeClass = grade => {
  // Common grade color mapping
  const gradeColors = {
    A: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    B: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    C: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    D: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    F: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  };

  // Check if grade starts with any of these letters
  for (const [key, value] of Object.entries(gradeColors)) {
    if (grade.toUpperCase().startsWith(key)) {
      return value;
    }
  }

  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
};

// Lifecycle
onMounted(async () => {
  await loadExam();
  await loadResults();
});
</script>
