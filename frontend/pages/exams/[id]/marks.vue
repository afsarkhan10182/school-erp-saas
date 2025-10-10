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
                Enter Marks
              </span>
            </div>
          </li>
        </ol>
      </nav>

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Enter Marks</h1>
        <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Enter marks for students by class, section, and subject
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
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Select Class & Subject
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Class <span class="text-red-500">*</span>
            </label>
            <EnhancedDropdown
              v-model="filters.class_id"
              :options="classOptions"
              placeholder="Select class"
              :loading="classesLoading"
              @update:model-value="onClassChange"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Section <span class="text-red-500">*</span>
            </label>
            <EnhancedDropdown
              v-model="filters.section_id"
              :options="sectionOptions"
              placeholder="Select section"
              :loading="sectionsLoading"
              @update:model-value="onSectionChange"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject <span class="text-red-500">*</span>
            </label>
            <EnhancedDropdown
              v-model="filters.subject_id"
              :options="subjectOptions"
              placeholder="Select subject"
              :loading="subjectsLoading"
            />
          </div>
        </div>

        <div class="mt-4 flex justify-end">
          <button
            @click="loadStudents"
            :disabled="
              !filters.class_id || !filters.section_id || !filters.subject_id || loadingStudents
            "
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Users class="w-4 h-4 mr-2" />
            Load Students
          </button>
        </div>
      </div>

      <!-- Students Marks Table -->
      <div v-if="examStudents.length > 0" class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              Students Marks ({{ examStudents.length }} students)
            </h3>
            <div class="flex items-center space-x-4">
              <span class="text-sm text-gray-500 dark:text-gray-400">
                Max Marks: {{ maxMarks.practical + maxMarks.written }}
              </span>
              <button
                @click="saveAllMarks"
                :disabled="saving"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                <Save class="w-4 h-4 mr-2" />
                Save All Marks
              </button>
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
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
                  Practical Marks
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  Written Marks
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  Total
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  Absent
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="student in examStudents" :key="student.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ student.roll_number }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ student.first_name }} {{ student.last_name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <input
                    v-model.number="student.practical_marks"
                    type="number"
                    min="0"
                    :max="maxMarks.practical"
                    :disabled="student.is_absent"
                    class="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                    @input="calculateTotal(student)"
                  />
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <input
                    v-model.number="student.written_marks"
                    type="number"
                    min="0"
                    :max="maxMarks.written"
                    :disabled="student.is_absent"
                    class="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                    @input="calculateTotal(student)"
                  />
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <span :class="getTotalClass(student.total_marks)">
                    {{ student.total_marks }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <input
                    v-model="student.is_absent"
                    type="checkbox"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    @change="onAbsentChange(student)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Summary -->
        <div
          class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700"
        >
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span class="text-gray-500 dark:text-gray-400">Total Students:</span>
              <span class="ml-2 font-medium text-gray-900 dark:text-white">{{
                examStudents.length
              }}</span>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Present:</span>
              <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ presentCount }}</span>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Absent:</span>
              <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ absentCount }}</span>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Average:</span>
              <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ averageMarks }}</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            @click="navigateTo('/exams')"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            @click="completeMarksEntry"
            :disabled="saving || !allMarksEntered"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            <CheckCircle class="w-4 h-4 mr-2" />
            Complete Marks Entry
          </button>
        </div>
      </div>

      <!-- No Students Message -->
      <div
        v-else-if="!loadingStudents && examStudents.length === 0"
        class="bg-white dark:bg-gray-800 shadow rounded-lg p-12 text-center"
      >
        <Users class="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No students found</h3>
        <p class="text-gray-500 dark:text-gray-400">
          Please select a class, section, and subject to load students.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { navigateTo } from '#app';
import { BookOpen, ChevronRight, Users, Save, CheckCircle } from 'lucide-vue-next';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { useToast } from '~/composables/useToast';
import { useAcademics } from '~/composables/useAcademics';
import { useStudents } from '~/composables/useStudents';

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
const { students, loading: studentsLoading, fetchStudents } = useStudents();

// State
const exam = ref(null);
const examStudents = ref([]);
const loading = ref(false);
const loadingStudents = ref(false);
const saving = ref(false);

// Filters
const filters = reactive({
  class_id: '',
  section_id: '',
  subject_id: ''
});

// Marks configuration
const maxMarks = ref({
  practical: 40,
  written: 60
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

const presentCount = computed(() => examStudents.value.filter(s => !s.is_absent).length);

const absentCount = computed(() => examStudents.value.filter(s => s.is_absent).length);

const averageMarks = computed(() => {
  const presentStudents = examStudents.value.filter(s => !s.is_absent && s.total_marks > 0);
  if (presentStudents.length === 0) return '0';

  const total = presentStudents.reduce((sum, s) => sum + s.total_marks, 0);
  return (total / presentStudents.length).toFixed(1);
});

const allMarksEntered = computed(() => {
  const presentStudents = examStudents.value.filter(s => !s.is_absent);
  return presentStudents.every(s => s.practical_marks >= 0 && s.written_marks >= 0);
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
  filters.subject_id = '';

  if (filters.class_id) {
    await fetchSections({ classId: filters.class_id });
    await fetchSubjects({ classId: filters.class_id });
  }
};

const onSectionChange = async () => {
  // Reset subject if needed
  if (!filters.section_id) {
    filters.subject_id = '';
  }
};

const loadStudents = async () => {
  if (!filters.class_id || !filters.section_id || !filters.subject_id) {
    showToast('Please select class, section, and subject', 'error');
    return;
  }

  loadingStudents.value = true;
  try {
    const response = await fetchStudents({
      classId: filters.class_id,
      sectionId: filters.section_id
    });

    // Initialize students with marks data
    examStudents.value = response.map(student => ({
      ...student,
      practical_marks: 0,
      written_marks: 0,
      total_marks: 0,
      is_absent: false
    }));
  } catch (error) {
    showToast('Failed to load students', 'error');
  } finally {
    loadingStudents.value = false;
  }
};

const calculateTotal = student => {
  if (student.is_absent) {
    student.practical_marks = 0;
    student.written_marks = 0;
    student.total_marks = 0;
  } else {
    student.total_marks = (student.practical_marks || 0) + (student.written_marks || 0);
  }
};

const onAbsentChange = student => {
  if (student.is_absent) {
    student.practical_marks = 0;
    student.written_marks = 0;
    student.total_marks = 0;
  }
};

const getTotalClass = total => {
  const maxTotal = maxMarks.value.practical + maxMarks.value.written;
  const percentage = (total / maxTotal) * 100;

  if (percentage >= 80) return 'text-green-600 font-medium';
  if (percentage >= 60) return 'text-blue-600 font-medium';
  if (percentage >= 40) return 'text-yellow-600 font-medium';
  return 'text-red-600 font-medium';
};

const saveAllMarks = async () => {
  try {
    saving.value = true;

    const marksData = examStudents.value.map(student => ({
      student_id: student.id,
      practical_marks: student.practical_marks || 0,
      written_marks: student.written_marks || 0,
      total_marks: student.total_marks || 0,
      is_absent: student.is_absent
    }));

    const { examResultApi } = await import('~/api/academic/exam-results');
    const response = await examResultApi.createBulk(route.params.id, {
      class_id: filters.class_id,
      section_id: filters.section_id,
      subject_id: filters.subject_id,
      marks: marksData
    });

    if (response.success) {
      showToast('Marks saved successfully', 'success');
    }
  } catch (error) {
    showToast('Failed to save marks', 'error');
  } finally {
    saving.value = false;
  }
};

const completeMarksEntry = async () => {
  try {
    saving.value = true;

    const { examApi } = await import('~/api/academic/exams');
    const response = await examApi.update(route.params.id, { status: 'marks_entered' });

    if (response.success) {
      showToast('Marks entry completed successfully', 'success');
      navigateTo('/exams');
    }
  } catch (error) {
    showToast('Failed to complete marks entry', 'error');
  } finally {
    saving.value = false;
  }
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
