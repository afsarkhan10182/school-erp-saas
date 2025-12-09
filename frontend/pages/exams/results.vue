<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Exam Results</h1>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Browse and view exam results across all exams
              </p>
            </div>
            <div class="flex space-x-3">
              <button
                v-if="examsWithResults.length > 0"
                @click="handleExportSummary"
                :disabled="exporting"
                class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download class="h-4 w-4 mr-2" />
                {{ exporting ? 'Exporting...' : 'Export Summary' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters Section -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3
            class="text-lg font-semibold text-gray-900 dark:text-white border-b-2 border-red-500 pb-2 inline-block"
          >
            Select Ground
          </h3>
        </div>
        <div class="p-6">
          <div
            :class="[
              'grid grid-cols-1 gap-4',
              showBranchDropdown ? 'md:grid-cols-5' : 'md:grid-cols-4'
            ]"
          >
            <!-- Branch Selection -->
            <div v-if="showBranchDropdown">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Branch
              </label>
              <EnhancedDropdown
                v-model="selectedBranchId"
                :options="branchOptions"
                placeholder="Choose branch"
                :loading="branchesLoading"
                @change="onBranchChange"
              />
            </div>

            <!-- Exam Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
          </div>

          <!-- Filter Button -->
          <div class="flex justify-end mt-4">
            <button
              @click="loadResults"
              :disabled="loading"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Filter class="h-4 w-4 mr-2" />
              {{ loading ? 'Loading...' : 'Filter' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary Statistics Cards -->
    <div v-if="examsWithResults.length > 0" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Exams</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ examsWithResults.length }}
          </p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Students</p>
          <p class="text-2xl font-bold text-blue-600">{{ totalStudents }}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p class="text-sm text-gray-500 dark:text-gray-400">Overall Pass Rate</p>
          <p class="text-2xl font-bold text-green-600">{{ overallPassRate.toFixed(1) }}%</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p class="text-sm text-gray-500 dark:text-gray-400">Average Percentage</p>
          <p class="text-2xl font-bold text-purple-600">{{ overallAverage.toFixed(2) }}%</p>
        </div>
      </div>
    </div>

    <!-- Results Table -->
    <div v-if="examsWithResults.length > 0" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center">
            <BarChart3 class="h-5 w-5 mr-2 text-gray-600 dark:text-gray-400" />
            <h3
              class="text-lg font-semibold text-gray-900 dark:text-white border-b-2 border-red-500 pb-2 inline-block"
            >
              Exam Results Summary
            </h3>
          </div>
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
    </div>

    <!-- No Results Message -->
    <div
      v-else-if="!loading && examsWithResults.length === 0"
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
        <BarChart3 class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          No exam results found
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{
            hasFilters
              ? 'Try adjusting your filters or ensure marks have been entered for the selected exams.'
              : 'Please select filters and click Filter to load exam results.'
          }}
        </p>
      </div>
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
import { useBranches } from '~/composables/useBranches';
import { examApi } from '~/api/academic/exams';
import { examTermApi } from '~/api/academic/exam-terms';
import { getExamTypeLabel } from '~/utils/exam-types';

const router = useRouter();
const { showToast } = useToast();
const { user } = useAuth();
const { branches, fetchBranchesForUser, loading: branchesLoading } = useBranches();
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
const selectedBranchId = ref('');
const selectedExamId = ref('');
const selectedTermId = ref('');
const selectedClassId = ref('');
const selectedSectionId = ref('');
const loading = ref(false);
const exporting = ref(false);

// Results state
const examsWithResults = ref<any[]>([]);

// Computed properties
const branchOptions = computed(() =>
  branches.value.map(branch => ({
    value: branch.id,
    label: branch.name
  }))
);

const examOptions = computed(() =>
  exams.value.map(exam => ({
    value: exam.id,
    label: exam.name,
    description: exam.examType?.name
  }))
);

const showBranchDropdown = computed(() => branches.value.length > 1);

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

const onBranchChange = async () => {
  selectedExamId.value = '';
  selectedClassId.value = '';
  selectedSectionId.value = '';
  examsWithResults.value = [];

  if (selectedBranchId.value) {
    await Promise.all([
      fetchClasses({ branchId: selectedBranchId.value }),
      loadExams({ branch_id: selectedBranchId.value })
    ]);
  } else {
    classes.value = [];
    await loadExams();
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
        examsList = [examResponse.data];
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
              const passedCount = results.filter((r: any) => r.is_passed && !r.is_absent).length;
              const failedCount = results.filter((r: any) => !r.is_passed && !r.is_absent).length;
              const totalPercentage = results.reduce(
                (sum: number, r: any) => sum + (r.percentage || 0),
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
    // TODO: Implement export functionality
    showToast('Export functionality coming soon', 'info');
  } catch (error: any) {
    showToast(error?.message || 'Failed to export summary', 'error');
  } finally {
    exporting.value = false;
  }
};

// Initialize
onMounted(async () => {
  try {
    await fetchBranchesForUser();
    await loadTerms();

    // Auto-select branch if single branch
    if (branches.value.length === 1) {
      selectedBranchId.value = branches.value[0].id;
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

// Note: Sections are loaded in onClassChange handler, no need for separate watch
</script>
