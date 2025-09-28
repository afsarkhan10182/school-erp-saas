<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-start">
      <div class="space-y-2">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Report Cards</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Generate and download student report cards
        </p>
      </div>
    </div>

    <!-- Filters -->
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Class -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >Class</label
          >
          <select
            v-model="filters.class_id"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            @change="loadStudents"
          >
            <option value="">Select Class</option>
            <option v-for="cls in classes" :key="cls.id" :value="cls.id">
              {{ cls.name }}
            </option>
          </select>
        </div>

        <!-- Section -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >Section</label
          >
          <select
            v-model="filters.section_id"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            @change="loadStudents"
          >
            <option value="">All Sections</option>
            <option v-for="sec in sections" :key="sec.id" :value="sec.id">
              {{ sec.name }}
            </option>
          </select>
        </div>

        <!-- Academic Year -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >Academic Year</label
          >
          <select
            v-model="filters.academic_year"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select Year</option>
            <option v-for="year in academicYears" :key="year" :value="year">
              {{ year }}
            </option>
          </select>
        </div>

        <!-- Format Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >Format</label
          >
          <select
            v-model="selectedFormat"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="html">HTML</option>
            <option value="pdf">PDF</option>
            <option value="json">JSON</option>
          </select>
        </div>

        <!-- Generate Button -->
        <div class="flex items-end">
          <button
            @click="generateReportCards"
            :disabled="!canGenerate || loading"
            class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="loading" class="inline-flex items-center">
              <svg
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
              Generating...
            </span>
            <span v-else>Generate Report Cards</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Students List -->
    <div
      v-if="students.length > 0"
      class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Students</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">{{ students.length }} students found</p>
      </div>

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
                Class
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
              v-for="student in students"
              :key="student.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ student.first_name }} {{ student.last_name }}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {{ student.admission_number }}
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">
                  {{ getClassName(student.class_id) }}
                </div>
                <div v-if="student.section_id" class="text-sm text-gray-500 dark:text-gray-400">
                  Section {{ getSectionName(student.section_id) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center gap-2">
                  <button
                    @click="previewReportCard(student)"
                    class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                    title="Preview Report Card"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      ></path>
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      ></path>
                    </svg>
                  </button>
                  <button
                    @click="generateIndividualReportCard(student)"
                    class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    title="Download Report Card"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      ></path>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!loading"
      class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center"
    >
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
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No students found</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Select a class to view students.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from '~/composables/useToast';
import { useAcademics } from '~/composables/useAcademics';
import { Exams } from '~/api/academic';
import { Students } from '~/api/students';

// Composables
const { showToast } = useToast();
const { classes, sections, fetchClasses, fetchSections } = useAcademics();

// Reactive data
const loading = ref(false);
const students = ref([]);

// Filters
const filters = ref({
  class_id: '',
  section_id: '',
  academic_year: ''
});

// Format selection
const selectedFormat = ref('html');

// Academic years (last 5 years + next 2 years)
const academicYears = computed(() => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 2; i <= currentYear + 2; i++) {
    years.push(`${i}-${i + 1}`);
  }
  return years;
});

// Computed
const canGenerate = computed(() => {
  return filters.value.class_id && filters.value.academic_year && students.value.length > 0;
});

// Methods
const loadStudents = async () => {
  if (!filters.value.class_id) {
    students.value = [];
    return;
  }

  try {
    loading.value = true;
    const response = await Students.getAll({
      class_id: filters.value.class_id,
      section_id: filters.value.section_id,
      limit: 1000
    });
    students.value = response.data.students;
  } catch (error) {
    showToast('error', 'Failed to load students');
    console.error('Error loading students:', error);
  } finally {
    loading.value = false;
  }
};

const generateReportCards = async () => {
  if (!canGenerate.value) return;

  try {
    loading.value = true;

    // Generate report cards for all students
    for (const student of students.value) {
      await generateIndividualReportCard(student, false);
    }

    showToast('success', 'Report cards generated successfully');
  } catch (error) {
    showToast('error', 'Failed to generate report cards');
    console.error('Error generating report cards:', error);
  } finally {
    loading.value = false;
  }
};

const previewReportCard = async student => {
  try {
    const response = await Exams.generateReportCard(student.id, {
      academic_year: filters.value.academic_year,
      format: 'html'
    });

    // Open in new window for preview
    const blob = new Blob([response.data], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');

    // Clean up URL after a delay
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    showToast(
      'error',
      `Failed to preview report card for ${student.first_name} ${student.last_name}`
    );
    console.error('Error previewing report card:', error);
  }
};

const generateIndividualReportCard = async (student, showSuccess = true) => {
  try {
    const response = await Exams.generateReportCard(student.id, {
      academic_year: filters.value.academic_year,
      format: selectedFormat.value
    });

    // Handle different formats
    const fileExtension =
      selectedFormat.value === 'json' ? 'json' : selectedFormat.value === 'pdf' ? 'pdf' : 'html';

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `report-card-${student.admission_number}-${filters.value.academic_year}.${fileExtension}`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    if (showSuccess) {
      showToast('success', 'Report card generated successfully');
    }
  } catch (error) {
    showToast(
      'error',
      `Failed to generate report card for ${student.first_name} ${student.last_name}`
    );
    console.error('Error generating report card:', error);
  }
};

const getClassName = classId => {
  const cls = classes.value.find(c => c.id === classId);
  return cls ? cls.name : 'Unknown';
};

const getSectionName = sectionId => {
  const sec = sections.value.find(s => s.id === sectionId);
  return sec ? sec.name : 'Unknown';
};

// Lifecycle
onMounted(async () => {
  await loadAllDropdowns();
});
</script>
