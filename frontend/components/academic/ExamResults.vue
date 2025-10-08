<template>
  <div class="space-y-6">
    <!-- Exam Info -->
    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Exam</h4>
          <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ exam?.name }}</p>
        </div>
        <div>
          <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Date</h4>
          <p class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ formatDate(exam?.exam_date) }}
          </p>
        </div>
        <div>
          <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Max Marks</h4>
          <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ exam?.max_marks }}</p>
        </div>
      </div>
    </div>

    <!-- Summary Stats -->
    <div v-if="summary" class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div
        class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
      >
        <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {{ summary.total_students }}
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">Total Students</div>
      </div>
      <div
        class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
      >
        <div class="text-2xl font-bold text-green-600 dark:text-green-400">
          {{ summary.present_students }}
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">Present</div>
      </div>
      <div
        class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
      >
        <div class="text-2xl font-bold text-red-600 dark:text-red-400">
          {{ summary.absent_students }}
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">Absent</div>
      </div>
      <div
        class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
      >
        <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
          {{ summary.average_percentage?.toFixed(1) }}%
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">Average</div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-between items-center">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Exam Results</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">Manage student results and grades</p>
      </div>
      <div class="flex gap-2">
        <button
          v-if="exam?.status === 'scheduled' || exam?.status === 'in_progress'"
          @click="showBulkEntry = true"
          class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            ></path>
          </svg>
          Enter Results
        </button>
        <button
          @click="exportResults"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            ></path>
          </svg>
          Export
        </button>
      </div>
    </div>

    <!-- Results Table -->
    <div
      class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
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
          Loading results...
        </div>
      </div>

      <div v-else-if="results.length === 0" class="p-8 text-center">
        <svg
          class="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          ></path>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No results found</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Results haven't been entered yet.
        </p>
        <div class="mt-6">
          <button
            v-if="exam?.status === 'scheduled' || exam?.status === 'in_progress'"
            @click="showBulkEntry = true"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              ></path>
            </svg>
            Enter Results
          </button>
        </div>
      </div>

      <div v-else class="overflow-x-auto">
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
                Rank
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Status
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
              v-for="result in results"
              :key="result.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ result.student?.first_name }} {{ result.student?.last_name }}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {{ result.student?.admission_number }}
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">{{ result.marks_obtained }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">
                  {{ result.percentage?.toFixed(1) }}%
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getGradeColor(result.grade)"
                >
                  {{ result.grade || 'N/A' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">{{ result.rank || 'N/A' }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="{
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200':
                      !result.is_absent,
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': result.is_absent
                  }"
                >
                  {{ result.is_absent ? 'Absent' : 'Present' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  @click="editResult(result)"
                  class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  Edit
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Bulk Entry Modal -->
    <Modal v-if="showBulkEntry" @close="showBulkEntry = false" size="4xl">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Enter Exam Results - {{ exam?.name }}
        </h3>
      </template>

      <template #body>
        <BulkResultEntry
          :exam="exam"
          :students="students"
          @submit="handleBulkSubmit"
          @cancel="showBulkEntry = false"
        />
      </template>
    </Modal>

    <!-- Edit Result Modal -->
    <Modal v-if="showEditModal" @close="showEditModal = false">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Edit Result</h3>
      </template>

      <template #body>
        <ResultForm
          :result="editingResult"
          :exam="exam"
          @submit="handleResultSubmit"
          @cancel="showEditModal = false"
        />
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from '~/composables/useToast';
import examApi from '~/api/academic/exams';
import Modal from '~/components/ui/Modal.vue';
import BulkResultEntry from '~/components/academic/BulkResultEntry.vue';
import ResultForm from '~/components/forms/ResultForm.vue';

// Props
const props = defineProps({
  exam: {
    type: Object,
    required: true
  }
});

// Emits
const emit = defineEmits(['close']);

// Composables
const { showToast } = useToast();

// Reactive data
const loading = ref(false);
const results = ref([]);
const summary = ref(null);
const students = ref([]);
const showBulkEntry = ref(false);
const showEditModal = ref(false);
const editingResult = ref(null);

// Methods
const loadResults = async () => {
  try {
    loading.value = true;
    const response = await examApi.getResults(props.exam.id);
    results.value = response.data.results;
    summary.value = response.data.summary;
  } catch (error) {
    showToast('Failed to load exam results', 'error');
  } finally {
    loading.value = false;
  }
};

const loadStudents = async () => {
  try {
    // Load students for the exam class/section
    const Student = await import('~/api/students');
    const response = await Student.default.getAll({
      class_id: props.exam.class_id,
      section_id: props.exam.section_id,
      limit: 1000
    });
    students.value = response.data.students;
  } catch (error) {
    showToast('Failed to load students', 'error');
  }
};

const handleBulkSubmit = async resultsData => {
  try {
    await examApi.bulkCreateResults(props.exam.id, resultsData);
    showToast('success', 'Results saved successfully');
    showBulkEntry.value = false;
    await loadResults();
  } catch (error) {
    showToast('Failed to save results', 'error');
  }
};

const editResult = result => {
  editingResult.value = result;
  showEditModal.value = true;
};

const handleResultSubmit = async resultData => {
  try {
    await examApi.updateResult(editingResult.value.id, resultData);
    showToast('success', 'Result updated successfully');
    showEditModal.value = false;
    await loadResults();
  } catch (error) {
    showToast('Failed to update result', 'error');
  }
};

const exportResults = async () => {
  try {
    const response = await examApi.exportResults(props.exam.id, 'excel');
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `exam-results-${props.exam.name}-${props.exam.exam_date}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    showToast('Failed to export results', 'error');
  }
};

const getGradeColor = grade => {
  const colors = {
    'A+': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    A: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'B+': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    B: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'C+': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    C: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    D: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    F: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };
  return colors[grade] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
};

const formatDate = dateString => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Lifecycle
onMounted(async () => {
  await Promise.all([loadResults(), loadStudents()]);
});
</script>
