<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-start">
      <div class="space-y-2">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Marks Entry</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Enter and manage exam marks for students
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
          <EnhancedDropdown
            v-model="selectedExamType"
            :options="examTypeDropdownOptions"
            placeholder="All Exam Types"
            @update:model-value="loadExams"
          />
        </div>

        <!-- Class -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >Class</label
          >
          <EnhancedDropdown
            v-model="selectedClass"
            :options="classDropdownOptions"
            placeholder="All Classes"
            @update:model-value="loadExams"
          />
        </div>

        <!-- Academic Year -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >Academic Year</label
          >
          <EnhancedDropdown
            v-model="selectedAcademicYear"
            :options="academicYearDropdownOptions"
            placeholder="All Years"
            @update:model-value="loadExams"
          />
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

    <!-- Bulk Marks Entry Section -->
    <div
      v-if="selectedExam"
      class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <BulkMarksEntry
        :exam="selectedExam"
        :students="students"
        @marks-updated="loadStudentsForExam(selectedExam)"
      />
    </div>

    <!-- Optimized Results Management Section -->
    <div
      v-if="selectedExam && showResultsManagement"
      class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Results Management</h3>
        <button
          @click="showResultsManagement = false"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <ExamResults :exam="selectedExam" @close="showResultsManagement = false" />
    </div>

    <!-- Show Results Management Button -->
    <div
      v-if="selectedExam && !showResultsManagement"
      class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <div class="text-center">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          View Results Management
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Access optimized results processing, analytics, and management tools
        </p>
        <button
          @click="showResultsManagement = true"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Open Results Management
        </button>
      </div>
    </div>

    <!-- Marks Entry Section -->
    <div
      v-if="selectedExam && students.length > 0"
      class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">Enter Marks</h3>
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
            @click="markAllAbsent"
            class="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors text-sm flex items-center gap-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
            Mark All Absent
          </button>
          <button
            @click="markAllPresent"
            class="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm flex items-center gap-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            Mark All Present
          </button>
          <button
            @click="validateMarks"
            class="bg-yellow-600 text-white px-3 py-2 rounded-md hover:bg-yellow-700 transition-colors text-sm flex items-center gap-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            Validate
          </button>
          <button
            @click="saveMarks"
            :disabled="saving || !isValidToSave"
            class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm flex items-center gap-1 disabled:opacity-50"
          >
            <svg
              v-if="saving"
              class="animate-spin w-4 h-4"
              fill="none"
              stroke="currentColor"
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
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            {{ saving ? 'Saving...' : 'Save Marks' }}
          </button>
        </div>
      </div>

      <!-- Students Marks Table -->
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
              v-for="student in students"
              :key="student.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ student.first_name }} {{ student.last_name }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {{ student.admission_number }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ student.roll_number }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <input
                  v-model="studentMarks[student.id].marks_obtained"
                  type="number"
                  :max="selectedExam.max_marks"
                  min="0"
                  step="0.01"
                  class="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  :disabled="studentMarks[student.id].is_absent"
                  @input="calculateStudentResult(student.id)"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{
                  studentMarks[student.id].percentage
                    ? `${studentMarks[student.id].percentage.toFixed(2)}%`
                    : '-'
                }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  v-if="studentMarks[student.id].grade"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getGradeClass(studentMarks[student.id].grade)"
                >
                  {{ studentMarks[student.id].grade }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <label class="flex items-center">
                  <input
                    v-model="studentMarks[student.id].is_absent"
                    type="checkbox"
                    class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    @change="handleAbsentChange(student.id)"
                  />
                  <span class="ml-2 text-sm text-gray-900 dark:text-white">Absent</span>
                </label>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <input
                  v-model="studentMarks[student.id].remarks"
                  type="text"
                  placeholder="Optional remarks..."
                  class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Validation Errors -->
      <div
        v-if="validationErrors.length > 0"
        class="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
      >
        <h4 class="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Validation Errors</h4>
        <ul class="text-sm text-red-700 dark:text-red-300 space-y-1">
          <li v-for="error in validationErrors" :key="error" class="flex items-center">
            <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              ></path>
            </svg>
            {{ error }}
          </li>
        </ul>
      </div>

      <!-- Summary -->
      <div class="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Summary</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span class="text-gray-600 dark:text-gray-400">Total Students:</span>
            <span class="ml-2 font-medium text-gray-900 dark:text-white">{{
              students.length
            }}</span>
          </div>
          <div>
            <span class="text-gray-600 dark:text-gray-400">Present:</span>
            <span class="ml-2 font-medium text-green-600">{{ presentCount }}</span>
          </div>
          <div>
            <span class="text-gray-600 dark:text-gray-400">Absent:</span>
            <span class="ml-2 font-medium text-red-600">{{ absentCount }}</span>
          </div>
          <div>
            <span class="text-gray-600 dark:text-gray-400">Average:</span>
            <span class="ml-2 font-medium text-blue-600">{{ averagePercentage.toFixed(2) }}%</span>
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
import { useAcademics } from '~/composables/useAcademics';
import { Exams } from '~/api';
import { Students } from '~/api';
import BulkMarksEntry from '~/components/academic/BulkMarksEntry.vue';
import ExamResults from '~/components/academic/ExamResults.vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';

// Composables
const { showToast } = useToast();
const { examTypeOptions, loadAllExamOptions } = useExamOptions();
const { classOptions, academicYears, fetchClasses, fetchAcademicYears } = useAcademics();

// Reactive data
const loading = ref(false);
const saving = ref(false);
const exams = ref([]);
const students = ref([]);
const selectedExam = ref(null);
const studentMarks = ref({});

// Filters
const selectedExamType = ref('');
const selectedClass = ref('');
const selectedAcademicYear = ref('');
const showResultsManagement = ref(false);

// Dropdown options
const examTypeDropdownOptions = computed(() => [
  { value: '', label: 'Select Exam Type' },
  ...examTypeOptions.value
]);

const classDropdownOptions = computed(() => [
  { value: '', label: 'Select Class' },
  ...classOptions.value
]);

const academicYearDropdownOptions = computed(() => [
  { value: '', label: 'Select Academic Year' },
  ...academicYears.value.map(year => ({
    value: year.name,
    label: year.name + (year.is_current ? ' (Current)' : '')
  }))
]);

const presentCount = computed(
  () => students.value.filter(student => !studentMarks.value[student.id]?.is_absent).length
);

const absentCount = computed(
  () => students.value.filter(student => studentMarks.value[student.id]?.is_absent).length
);

const averagePercentage = computed(() => {
  const presentStudents = students.value.filter(
    student => !studentMarks.value[student.id]?.is_absent
  );
  if (presentStudents.length === 0) return 0;

  const totalPercentage = presentStudents.reduce((sum, student) => {
    return sum + (studentMarks.value[student.id]?.percentage || 0);
  }, 0);

  return totalPercentage / presentStudents.length;
});

const isValidToSave = computed(() => {
  if (!selectedExam.value || students.value.length === 0) return false;

  // Check if at least one student has marks entered
  const hasMarks = students.value.some(student => {
    const marks = studentMarks.value[student.id];
    return marks && (marks.marks_obtained > 0 || marks.is_absent);
  });

  return hasMarks;
});

const validationErrors = ref([]);

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
  await loadStudentsForExam(exam);
};

const loadStudentsForExam = async exam => {
  try {
    loading.value = true;

    // Load students for the exam's class and section
    const params = {
      class_id: exam.class_id,
      section_id: exam.section_id || undefined,
      is_active: true
    };

    const response = await Students.getAll(params);
    students.value = response.data.students || response.data.rows || [];

    // Initialize student marks
    students.value.forEach(student => {
      studentMarks.value[student.id] = {
        marks_obtained: 0,
        percentage: 0,
        grade: '',
        is_absent: false,
        remarks: ''
      };
    });
  } catch (error) {
    console.error('Error loading students:', error);
    showToast('Failed to load students', 'error');
  } finally {
    loading.value = false;
  }
};

const calculateStudentResult = async studentId => {
  const marks = studentMarks.value[studentId];
  if (marks.marks_obtained && selectedExam.value.max_marks > 0) {
    marks.percentage = (marks.marks_obtained / selectedExam.value.max_marks) * 100;

    // Calculate grade using backend service
    try {
      const gradeResponse = await Exams.calculateGrade(marks.percentage);
      marks.grade = gradeResponse.data.grade;
    } catch (error) {
      console.warn('Failed to calculate grade:', error);
      // Fallback to basic grade calculation
      marks.grade = calculateBasicGrade(marks.percentage);
    }
  } else {
    marks.percentage = 0;
    marks.grade = '';
  }
};

const calculateBasicGrade = percentage => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  if (percentage >= 35) return 'D';
  return 'F';
};

const handleAbsentChange = studentId => {
  const marks = studentMarks.value[studentId];
  if (marks.is_absent) {
    marks.marks_obtained = 0;
    marks.percentage = 0;
    marks.grade = '';
  }
};

const markAllAbsent = () => {
  students.value.forEach(student => {
    studentMarks.value[student.id].is_absent = true;
    studentMarks.value[student.id].marks_obtained = 0;
    studentMarks.value[student.id].percentage = 0;
    studentMarks.value[student.id].grade = '';
  });
  showToast('All students marked as absent', 'info');
};

const markAllPresent = () => {
  students.value.forEach(student => {
    studentMarks.value[student.id].is_absent = false;
    if (!studentMarks.value[student.id].marks_obtained) {
      studentMarks.value[student.id].marks_obtained = 0;
    }
  });
  showToast('All students marked as present', 'info');
};

const validateMarks = () => {
  const errors = [];

  students.value.forEach(student => {
    const marks = studentMarks.value[student.id];
    if (!marks.is_absent) {
      const marksObtained = parseFloat(marks.marks_obtained);

      if (isNaN(marksObtained) || marksObtained < 0) {
        errors.push(`${student.first_name} ${student.last_name}: Invalid marks entered`);
      } else if (marksObtained > selectedExam.value.max_marks) {
        errors.push(
          `${student.first_name} ${student.last_name}: Marks exceed maximum (${selectedExam.value.max_marks})`
        );
      }
    }
  });

  validationErrors.value = errors;

  if (errors.length === 0) {
    showToast('All marks are valid', 'success');
  } else {
    showToast(`Found ${errors.length} validation errors`, 'error');
  }

  return errors.length === 0;
};

const saveMarks = async () => {
  try {
    saving.value = true;

    // Validate marks before saving
    if (!validateMarks()) {
      showToast('Please fix validation errors before saving', 'error');
      return;
    }

    const results = students.value.map(student => {
      const marks = studentMarks.value[student.id];
      return {
        student_id: student.id,
        marks_obtained: marks.is_absent ? 0 : parseFloat(marks.marks_obtained) || 0,
        is_absent: marks.is_absent,
        remarks: marks.remarks || ''
      };
    });

    await Exams.bulkCreateResults(selectedExam.value.id, results);
    showToast('Marks saved successfully', 'success');

    // Clear validation errors after successful save
    validationErrors.value = [];
  } catch (error) {
    console.error('Error saving marks:', error);
    showToast('Failed to save marks', 'error');
  } finally {
    saving.value = false;
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

const getStatusClass = status => {
  const classes = {
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
