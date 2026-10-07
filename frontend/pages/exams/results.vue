<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Exam Results
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Browse and view exam results across all exams
        </p>
      </div>
      <div class="flex shrink-0 gap-3">
        <button
          v-if="examsWithResults.length > 0"
          @click="handleExportSummary"
          :disabled="exporting"
          class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download class="h-4 w-4 mr-2" />
          {{ exporting ? 'Exporting...' : 'Export Summary' }}
        </button>
      </div>
    </div>

    <!-- Filters Section -->
    <div
      class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm"
    >
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">Filter Results</h3>
      </div>
      <div class="p-6">
        <div :class="['grid grid-cols-1 gap-4', 'md:grid-cols-4']">
          <!-- Exam Selection -->
          <div>
            <label
              class="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5"
            >
              Exam
            </label>
            <EnhancedDropdown
              v-model="selectedExamId"
              :options="examOptions"
              placeholder="All exams"
              :loading="examsLoading"
              @change="onExamChange"
            />
          </div>

          <!-- Term Selection -->
          <div>
            <label
              class="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5"
            >
              Term
            </label>
            <EnhancedDropdown
              v-model="selectedTermId"
              :options="termOptions"
              placeholder="All terms"
              :loading="termsLoading"
              @change="onTermChange"
            />
          </div>

          <!-- Class Selection -->
          <div>
            <label
              class="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5"
            >
              Class
            </label>
            <EnhancedDropdown
              v-model="selectedClassId"
              :options="classOptions"
              placeholder="All classes"
              :loading="classesLoading"
              @change="onClassChange"
            />
          </div>

          <!-- Section Selection -->
          <div v-if="showSectionField">
            <label
              class="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5"
            >
              Section
            </label>
            <EnhancedDropdown
              v-model="selectedSectionId"
              :options="sectionOptions"
              placeholder="All sections"
              :loading="classesLoading"
              @change="onSectionChange"
            />
          </div>
          <!-- Filter Button -->
          <div class="flex justify-end mt-4">
            <button
              @click="loadResults"
              :disabled="loading"
              class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Filter class="h-4 w-4 mr-2" />
              {{ loading ? 'Loading...' : 'Filter' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary Statistics Cards -->
    <div v-if="examsWithResults.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div
        class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm p-5"
      >
        <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Total Exams
        </p>
        <p class="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
          {{ examsWithResults.length }}
        </p>
      </div>
      <div
        class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm p-5"
      >
        <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Total Students
        </p>
        <p class="mt-2 text-2xl font-bold text-blue-600">{{ totalStudents }}</p>
      </div>
      <div
        class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm p-5"
      >
        <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Pass Rate
        </p>
        <p class="mt-2 text-2xl font-bold text-green-600">{{ overallPassRate.toFixed(1) }}%</p>
      </div>
      <div
        class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm p-5"
      >
        <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Avg Percentage
        </p>
        <p class="mt-2 text-2xl font-bold text-indigo-600">{{ overallAverage.toFixed(2) }}%</p>
      </div>
    </div>

    <!-- Results Table -->
    <div v-if="examsWithResults.length > 0" class="table-container">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
        <BarChart3 class="h-5 w-5 text-gray-500 dark:text-gray-400" />
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">Exam Results Summary</h3>
      </div>

      <div class="overflow-x-auto">
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
                Exam Name
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Term
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Class
              </th>
              <th
                class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Total Students
              </th>
              <th
                class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Passed
              </th>
              <th
                class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Failed
              </th>
              <th
                class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Average %
              </th>
              <th
                class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="(exam, index) in examsWithResults"
              :key="exam.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ index + 1 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ exam.name }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ getExamTypeLabel(exam.type_id) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ exam.term?.name || 'N/A' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ exam.class?.name || 'N/A' }}
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900 dark:text-white"
              >
                {{ exam.statistics?.total_students || 0 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <span class="text-sm font-medium text-green-600">
                  {{ exam.statistics?.passed_count || 0 }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <span class="text-sm font-medium text-red-600">
                  {{ exam.statistics?.failed_count || 0 }}
                </span>
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900 dark:text-white"
              >
                {{ exam.statistics?.average_percentage?.toFixed(2) || '0.00' }}%
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <span
                  :class="[
                    'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                    exam.result_status
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  ]"
                >
                  {{ exam.result_status ? 'Published' : 'Hidden' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  @click="viewDetailedResults(exam.id)"
                  class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  View Results
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- No Results Message -->
    <div
      v-else-if="!loading && examsWithResults.length === 0"
      class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm p-12 text-center"
    >
      <BarChart3 class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No exam results found</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{
          hasFilters
            ? 'Try adjusting your filters or ensure marks have been entered for the selected exams.'
            : 'Please select filters and click Filter to load exam results.'
        }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { BarChart3, Filter, Download } from 'lucide-vue-next';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { useToast } from '~/composables/useToast';
import { useAcademics } from '~/composables/useAcademics';
import { useExams } from '~/composables/useExams';
import { useAuth } from '~/composables/useAuth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { examApi } from '~/api/academic/exams';
import { examTermApi } from '~/api/academic/exam-terms';
import { getExamTypeLabel } from '~/utils/exam-types';

const router = useRouter();
const { showToast } = useToast();
const { user } = useAuth();
const { selectedBranchId } = useGlobalBranch();
const {
  classes,
  sections,
  classOptions,
  sectionOptions,
  fetchClasses,
  fetchSections,
  loading: classesLoading
} = useAcademics();
const { exams, isLoading: examsLoading, loadExams } = useExams();

// Filter state
const selectedExamId = ref('');
const selectedTermId = ref('');
const selectedClassId = ref('');
const selectedSectionId = ref('');
const loading = ref(false);
const exporting = ref(false);

watch(selectedBranchId, async newBranchId => {
  selectedExamId.value = '';
  selectedClassId.value = '';
  selectedSectionId.value = '';
  examsWithResults.value = [];
  if (newBranchId) {
    await Promise.all([
      fetchClasses({ branchId: newBranchId }),
      loadExams({ branch_id: newBranchId })
    ]);
  } else {
    await Promise.all([fetchClasses(), loadExams()]);
  }
});

// Results state
const examsWithResults = ref<any[]>([]);

// Computed properties
const examOptions = computed(() =>
  exams.value.map(exam => ({
    value: exam.id,
    label: exam.name,
    description: exam.examType?.name
  }))
);

const showSectionField = computed(() => {
  if (!selectedClassId.value) return false;
  const selectedClass = classes.value.find(c => c.id === selectedClassId.value);
  // Show section field if class doesn't have streams (has_stream === false)
  // or if sections exist for this class
  return selectedClass?.has_stream === false || sections.value.length > 0;
});

const hasFilters = computed(() => {
  return !!(
    selectedBranchId.value ||
    selectedExamId.value ||
    selectedTermId.value ||
    selectedClassId.value ||
    selectedSectionId.value
  );
});

// Terms options
const terms = ref<any[]>([]);
const termsLoading = ref(false);
const termOptions = computed(() =>
  terms.value.map(term => ({
    value: term.id,
    label: term.name
  }))
);

// Summary statistics
const totalStudents = computed(() => {
  return examsWithResults.value.reduce(
    (sum, exam) => sum + (exam.statistics?.total_students || 0),
    0
  );
});

const overallPassRate = computed(() => {
  if (totalStudents.value === 0) return 0;
  const totalPassed = examsWithResults.value.reduce(
    (sum, exam) => sum + (exam.statistics?.passed_count || 0),
    0
  );
  return (totalPassed / totalStudents.value) * 100;
});

const overallAverage = computed(() => {
  if (examsWithResults.value.length === 0) return 0;
  const sum = examsWithResults.value.reduce(
    (sum, exam) => sum + (exam.statistics?.average_percentage || 0),
    0
  );
  return sum / examsWithResults.value.length;
});

// Methods
const loadTerms = async () => {
  try {
    termsLoading.value = true;
    const response = await examTermApi.getAll();
    // examTermApi.getAll() returns { data: ExamTerm[], total, page, limit }
    if (response && response.data) {
      terms.value = Array.isArray(response.data) ? response.data : [];
    }
  } catch (error) {
    // Silent fail
  } finally {
    termsLoading.value = false;
  }
};

const onExamChange = () => {
  examsWithResults.value = [];
};

const onTermChange = () => {
  examsWithResults.value = [];
};

const onClassChange = async () => {
  selectedSectionId.value = '';
  examsWithResults.value = [];

  if (selectedClassId.value) {
    await fetchSections({
      schoolId: user.value?.school_id,
      branchId: selectedBranchId.value || user.value?.branch_id,
      classId: selectedClassId.value
    });
  }
};

const onSectionChange = () => {
  examsWithResults.value = [];
};

const loadResults = async () => {
  try {
    loading.value = true;
    examsWithResults.value = [];

    // Build filters for exams (exams don't have direct class/section relationship)
    const filters: any = {};
    if (selectedBranchId.value) filters.branch_id = selectedBranchId.value;
    if (selectedTermId.value) filters.term_id = selectedTermId.value;
    // Note: exam_id filter is handled separately below
    // class_id and section_id filters are applied when fetching results

    // Fetch exams
    let examsList: any[] = [];
    if (selectedExamId.value) {
      // If specific exam selected, fetch just that exam
      const examResponse = await examApi.getById(selectedExamId.value);
      if (examResponse.success && examResponse.data) {
        examsList = [examResponse.data.exam || examResponse.data];
      }
    } else {
      // Fetch all exams matching filters
      const response = await examApi.getAll(filters);
      if (response.success) {
        examsList = response.data?.exams || response.data || [];
      }
    }

    if (examsList.length === 0) {
      return;
    }

    // Build result filters (for class/section filtering)
    const resultFilters: any = {};
    if (selectedClassId.value) resultFilters.class_id = selectedClassId.value;
    if (selectedSectionId.value) resultFilters.section_id = selectedSectionId.value;

    // Fetch results for each exam and calculate statistics
    const examsWithStats = await Promise.all(
      examsList.map(async exam => {
        try {
          // Fetch results for this exam with class/section filters
          const resultsResponse = await examApi.getResults(exam.id);
          if (resultsResponse.success) {
            // Handle different response structures
            let results = Array.isArray(resultsResponse.data)
              ? resultsResponse.data
              : resultsResponse.data?.results || resultsResponse.data?.data || [];

            // Apply class/section filters on results if needed
            // (Results have student.class and student.section relationships)
            if (selectedClassId.value || selectedSectionId.value) {
              results = results.filter((r: any) => {
                const student = r.student;
                if (!student) return false;

                if (selectedClassId.value && student.class_id !== selectedClassId.value) {
                  return false;
                }
                if (selectedSectionId.value && student.section_id !== selectedSectionId.value) {
                  return false;
                }
                return true;
              });
            }

            // Only include exams that have results after filtering
            if (results.length > 0) {
              // Calculate statistics
              const totalStudents = results.length;
              const passedCount = results.filter(
                (r: any) => !r.is_absent && Number(r.percentage) >= 40
              ).length;
              const failedCount = results.filter(
                (r: any) => !r.is_absent && Number(r.percentage) < 40
              ).length;
              const totalPercentage = results.reduce(
                (sum: number, r: any) => sum + Number(r.percentage || 0),
                0
              );
              const averagePercentage = totalStudents > 0 ? totalPercentage / totalStudents : 0;

              // Get class name from first result's student (if available)
              const firstResult = results[0];
              const classInfo = firstResult?.student?.class || exam.class || null;

              return {
                ...exam,
                class: classInfo, // Add class info for display
                statistics: {
                  total_students: totalStudents,
                  passed_count: passedCount,
                  failed_count: failedCount,
                  average_percentage: averagePercentage
                }
              };
            }
          }
          return null;
        } catch (error) {
          // If results fetch fails, exam might not have results
          return null;
        }
      })
    );

    // Filter out null values (exams without results)
    examsWithResults.value = examsWithStats.filter(exam => exam !== null);
  } catch (error: any) {
    showToast(error?.message || 'Failed to load exam results', 'error');
  } finally {
    loading.value = false;
  }
};

const viewDetailedResults = (examId: string) => {
  router.push(`/exams/${examId}/results`);
};

const handleExportSummary = async () => {
  try {
    exporting.value = true;
    const headers = ['Exam', 'Class', 'Students', 'Passed', 'Failed', 'Average %'];
    const rows = examsWithResults.value.map(exam => [
      exam.name,
      exam.class?.name || '',
      exam.statistics?.total_students || 0,
      exam.statistics?.passed_count || 0,
      exam.statistics?.failed_count || 0,
      Number(exam.statistics?.average_percentage || 0).toFixed(2)
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `exam-results-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Exam summary exported', 'success');
  } catch (error: any) {
    showToast(error?.message || 'Failed to export summary', 'error');
  } finally {
    exporting.value = false;
  }
};

// Initialize
onMounted(async () => {
  try {
    await loadTerms();

    if (selectedBranchId.value) {
      await Promise.all([
        fetchClasses({ branchId: selectedBranchId.value }),
        loadExams({ branch_id: selectedBranchId.value })
      ]);
    } else {
      await loadExams();
    }
  } catch (error) {
    // Silent fail
  }
});

watch(selectedBranchId, async branchId => {
  selectedExamId.value = '';
  selectedClassId.value = '';
  selectedSectionId.value = '';
  examsWithResults.value = [];
  await Promise.all([
    fetchClasses(branchId ? { branchId: branchId } : {}),
    loadExams(branchId ? { branch_id: branchId } : {})
  ]);
  await loadResults();
});

// Note: Sections are loaded in onClassChange handler, no need for separate watch
</script>
