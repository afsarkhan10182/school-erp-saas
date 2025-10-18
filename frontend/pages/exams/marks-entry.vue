<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Marks Entry</h1>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Enter marks for students in bulk
              </p>
            </div>
            <div class="flex space-x-3">
              <button
                @click="saveMarks"
                :disabled="saving || !hasChanges"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save class="h-4 w-4 mr-2" />
                {{ saving ? 'Saving...' : 'Save Marks' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Selection Fields (CodeIgniter Style - 4 fields) -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Selection Fields</h3>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Branch (CodeIgniter Style) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Branch
            </label>
            <EnhancedDropdown
              v-model="selectedBranchId"
              :options="branchOptions"
              placeholder="Select branch"
              :loading="branchesLoading"
              @change="onBranchChange"
            />
          </div>

          <!-- Class (CodeIgniter Style) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Class
            </label>
            <EnhancedDropdown
              v-model="selectedClassId"
              :options="classOptions"
              placeholder="Select class"
              :loading="classesLoading"
              @change="onClassChange"
            />
          </div>

          <!-- Section (CodeIgniter Style) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Section
            </label>
            <EnhancedDropdown
              v-model="selectedSectionId"
              :options="sectionOptions"
              placeholder="Select section"
              :loading="sectionsLoading"
              @change="onSectionChange"
            />
          </div>

          <!-- Exam (CodeIgniter Style) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Exam
            </label>
            <EnhancedDropdown
              v-model="selectedExamId"
              :options="examOptions"
              placeholder="Select exam"
              :loading="examsLoading"
              @change="onExamChange"
            />
          </div>
        </div>

        <!-- Load Students Button -->
        <div class="flex justify-end mt-4">
          <button
            @click="loadStudents"
            :disabled="!selectedExamId || !selectedClassId || loadingStudents"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Users class="h-4 w-4 mr-2" />
            {{ loadingStudents ? 'Loading...' : 'Load Students' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div v-if="summary" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <Users class="h-8 w-8 text-blue-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Students</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">
                {{ summary.total_students }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <CheckCircle class="h-8 w-8 text-green-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Marks Entered</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">
                {{ summary.marks_entered }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <XCircle class="h-8 w-8 text-red-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Absent</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">
                {{ summary.absent_students }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <Clock class="h-8 w-8 text-yellow-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">
                {{ summary.pending }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mark Distribution Info -->
    <div v-if="markDistribution" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Mark Distribution</h3>
        <div class="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div class="text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">Theory</p>
            <p class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ markDistribution.theory_marks }}
            </p>
          </div>
          <div class="text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">Practical</p>
            <p class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ markDistribution.practical_marks }}
            </p>
          </div>
          <div class="text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">Viva</p>
            <p class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ markDistribution.viva_marks }}
            </p>
          </div>
          <div class="text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">Assignment</p>
            <p class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ markDistribution.assignment_marks }}
            </p>
          </div>
          <div class="text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">Total</p>
            <p class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ markDistribution.total_marks }}
            </p>
          </div>
          <div class="text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">Pass</p>
            <p class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ markDistribution.pass_marks }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Students Grid -->
    <div v-if="students.length > 0" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">Students Marks Entry</h3>
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
                  Theory
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Practical
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Viva
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Assignment
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Total
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Absent
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
                      {{ student.name }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      Roll: {{ student.roll_number }}
                    </div>
                  </div>
                </td>

                <!-- Theory Marks -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <input
                    v-model.number="studentMarks[student.id].theory_marks_obtained"
                    type="number"
                    min="0"
                    :max="markDistribution?.theory_marks || 0"
                    class="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    :disabled="studentMarks[student.id]?.is_absent"
                  />
                </td>

                <!-- Practical Marks -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <input
                    v-model.number="studentMarks[student.id].practical_marks_obtained"
                    type="number"
                    min="0"
                    :max="markDistribution?.practical_marks || 0"
                    class="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    :disabled="studentMarks[student.id]?.is_absent"
                  />
                </td>

                <!-- Viva Marks -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <input
                    v-model.number="studentMarks[student.id].viva_marks_obtained"
                    type="number"
                    min="0"
                    :max="markDistribution?.viva_marks || 0"
                    class="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    :disabled="studentMarks[student.id]?.is_absent"
                  />
                </td>

                <!-- Assignment Marks -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <input
                    v-model.number="studentMarks[student.id].assignment_marks_obtained"
                    type="number"
                    min="0"
                    :max="markDistribution?.assignment_marks || 0"
                    class="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    :disabled="studentMarks[student.id]?.is_absent"
                  />
                </td>

                <!-- Total Marks (Auto-calculated) -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ calculateTotalMarks(student.id) }}
                  </span>
                </td>

                <!-- Absent Checkbox -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <input
                    v-model="studentMarks[student.id].is_absent"
                    type="checkbox"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    @change="onAbsentChange(student.id)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- No Students Message -->
    <div
      v-else-if="!loadingStudents && students.length === 0"
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
        <Users class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No students found</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Please select an exam and class to load students.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { Save, Users, CheckCircle, XCircle, Clock } from 'lucide-vue-next';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { useToast } from '~/composables/useToast';
import { useAcademics } from '~/composables/useAcademics';
import { useExams } from '~/composables/useExams';
import { useMarksEntry } from '~/composables/useMarksEntry';
import { useAuth } from '~/composables/useAuth';
import { useBranches } from '~/composables/useBranches';

// Composables
const { showToast } = useToast();
const { user } = useAuth();
const { branches, fetchBranches, loading: branchesLoading } = useBranches();
const {
  classes,
  sections,
  classOptions,
  sectionOptions,
  fetchClasses,
  fetchSections,
  loading: classesLoading,
  sectionsLoading
} = useAcademics();
const { exams, loadExams, loading: examsLoading } = useExams();
const { getStudentsForMarksEntry, saveMarks: saveMarksAPI, getMarksEntrySummary } = useMarksEntry();

// Types
interface Student {
  id: string;
  name: string;
  roll_number: string;
  class?: { name: string };
  section?: { name: string };
  existing_marks?: {
    theory_marks_obtained?: number;
    practical_marks_obtained?: number;
    viva_marks_obtained?: number;
    assignment_marks_obtained?: number;
    marks_obtained?: number;
    is_absent?: boolean;
  };
}

interface StudentMarks {
  theory_marks_obtained: number;
  practical_marks_obtained: number;
  viva_marks_obtained: number;
  assignment_marks_obtained: number;
  is_absent: boolean;
}

interface Summary {
  total_students: number;
  marks_entered: number;
  absent_students: number;
  pending: number;
}

interface MarkDistribution {
  theory_marks: number;
  practical_marks: number;
  viva_marks: number;
  assignment_marks: number;
  total_marks: number;
  pass_marks: number;
}

// Reactive data
const selectedBranchId = ref('');
const selectedExamId = ref('');
const selectedClassId = ref('');
const selectedSectionId = ref('');
const students = ref<Student[]>([]);
const studentMarks = reactive<Record<string, StudentMarks>>({});
const summary = ref<Summary | null>(null);
const markDistribution = ref<MarkDistribution | null>(null);
const loadingStudents = ref(false);
const saving = ref(false);

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

const showSectionField = computed(() => {
  const selectedClass = classes.value.find(c => c.id === selectedClassId.value);
  return selectedClass?.has_sections || false;
});

const hasChanges = computed(() => {
  return Object.keys(studentMarks).length > 0;
});

// Methods
const onBranchChange = () => {
  selectedExamId.value = '';
  selectedClassId.value = '';
  selectedSectionId.value = '';
  students.value = [];
  Object.keys(studentMarks).forEach(key => delete studentMarks[key]);
  summary.value = null;
  markDistribution.value = null;
};

const onExamChange = () => {
  selectedClassId.value = '';
  selectedSectionId.value = '';
  students.value = [];
  Object.keys(studentMarks).forEach(key => delete studentMarks[key]);
  summary.value = null;
  markDistribution.value = null;
};

const onClassChange = () => {
  selectedSectionId.value = '';
  students.value = [];
  Object.keys(studentMarks).forEach(key => delete studentMarks[key]);
  summary.value = null;
  markDistribution.value = null;
};

const onSectionChange = () => {
  students.value = [];
  Object.keys(studentMarks).forEach(key => delete studentMarks[key]);
  summary.value = null;
  markDistribution.value = null;
};

const loadStudents = async () => {
  try {
    loadingStudents.value = true;

    const params: any = {
      exam_id: selectedExamId.value,
      class_id: selectedClassId.value,
      school_id: user.value?.school_id,
      branch_id: selectedBranchId.value || user.value?.branch_id
    };

    if (selectedSectionId.value) {
      params.section_id = selectedSectionId.value;
    }

    const response = (await getStudentsForMarksEntry(params)) as any;

    if (response.success) {
      students.value = response.data.students;
      markDistribution.value = response.data.mark_distribution;

      // Initialize student marks
      students.value.forEach((student: Student) => {
        if (student.existing_marks) {
          studentMarks[student.id] = { ...student.existing_marks };
        } else {
          studentMarks[student.id] = {
            theory_marks_obtained: 0,
            practical_marks_obtained: 0,
            viva_marks_obtained: 0,
            assignment_marks_obtained: 0,
            is_absent: false
          };
        }
      });

      // Load summary
      await loadSummary();

      showToast('Students loaded successfully', 'success');
    }
  } catch (error) {
    console.error('Error loading students:', error);
    showToast('Failed to load students', 'error');
  } finally {
    loadingStudents.value = false;
  }
};

const loadSummary = async () => {
  try {
    const params: any = {
      exam_id: selectedExamId.value,
      class_id: selectedClassId.value,
      school_id: user.value?.school_id,
      branch_id: user.value?.branch_id
    };

    if (selectedSectionId.value) {
      params.section_id = selectedSectionId.value;
    }

    const response = (await getMarksEntrySummary(params)) as any;

    if (response.success) {
      summary.value = response.data;
    }
  } catch (error) {
    console.error('Error loading summary:', error);
  }
};

const calculateTotalMarks = (studentId: string) => {
  const marks = studentMarks[studentId];
  if (!marks || marks.is_absent) return 0;

  return (
    (marks.theory_marks_obtained || 0) +
    (marks.practical_marks_obtained || 0) +
    (marks.viva_marks_obtained || 0) +
    (marks.assignment_marks_obtained || 0)
  );
};

const onAbsentChange = (studentId: string) => {
  const marks = studentMarks[studentId];
  if (marks.is_absent) {
    // Clear all marks when marked absent
    marks.theory_marks_obtained = 0;
    marks.practical_marks_obtained = 0;
    marks.viva_marks_obtained = 0;
    marks.assignment_marks_obtained = 0;
  }
};

const saveMarks = async () => {
  try {
    saving.value = true;

    const marksData = Object.keys(studentMarks).map(studentId => ({
      student_id: studentId,
      ...studentMarks[studentId]
    }));

    const response = (await saveMarksAPI({
      exam_id: selectedExamId.value,
      marks_data: marksData
    })) as any;

    if (response.success) {
      showToast(`Marks saved for ${response.data.successful.length} students`, 'success');
      await loadSummary(); // Refresh summary
    }
  } catch (error) {
    console.error('Error saving marks:', error);
    showToast('Failed to save marks', 'error');
  } finally {
    saving.value = false;
  }
};

// Load initial data
onMounted(async () => {
  await Promise.all([fetchBranches(), loadExams(), fetchClasses()]);
});
</script>
