<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Position Management</h1>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Calculate and manage student positions and rankings
              </p>
            </div>
            <div class="flex space-x-3">
              <button
                @click="calculatePositions"
                :disabled="!canCalculate || calculating"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calculator class="h-4 w-4 mr-2" />
                {{ calculating ? 'Calculating...' : 'Calculate Positions' }}
              </button>
              <button
                @click="savePositions"
                :disabled="!hasChanges || saving"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save class="h-4 w-4 mr-2" />
                {{ saving ? 'Saving...' : 'Save Positions' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Branch Selection () -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Branch
            </label>
            <EnhancedDropdown
              v-model="selectedBranchId"
              :options="branchOptions"
              placeholder="Choose branch"
              :loading="branchesLoading"
              @change="onBranchChange"
            />
          </div>

          <!-- Class Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Class
            </label>
            <EnhancedDropdown
              v-model="selectedClassId"
              :options="classOptions"
              placeholder="Choose class"
              :loading="classesLoading"
              @change="onClassChange"
            />
          </div>

          <!-- Section Selection -->
          <div v-if="showSectionField">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Section
            </label>
            <EnhancedDropdown
              v-model="selectedSectionId"
              :options="sectionOptions"
              placeholder="Choose section"
              :loading="sectionsLoading"
              @change="onSectionChange"
            />
          </div>

          <!-- Exam Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Exam
            </label>
            <EnhancedDropdown
              v-model="selectedExamId"
              :options="examOptions"
              placeholder="Choose exam"
              :loading="examsLoading"
              @change="onExamChange"
            />
          </div>
        </div>

        <!-- Load Students Button -->
        <div class="mt-4">
          <button
            @click="loadStudents"
            :disabled="!selectedBranchId || !selectedClassId || !selectedExamId || positionsLoading"
            class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Users class="h-4 w-4 mr-2" />
            {{ positionsLoading ? 'Loading...' : 'Load Students' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Position Settings -->
    <div v-if="students.length > 0" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Position Calculation Settings
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Calculation Method
            </label>
            <select
              v-model="calculationMethod"
              class="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="total_marks">Total Marks</option>
              <option value="percentage">Percentage</option>
              <option value="grade_points">Grade Points</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tie Breaking
            </label>
            <select
              v-model="tieBreakingMethod"
              class="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="average">Average of tied positions</option>
              <option value="first">First occurrence</option>
              <option value="manual">Manual override</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Include Absent Students
            </label>
            <div class="mt-2">
              <label class="flex items-center">
                <input
                  v-model="includeAbsent"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Include absent students in ranking
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Students Positions Table -->
    <div v-if="students.length > 0" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              Student Positions ({{ students.length }} students)
            </h3>
            <div class="flex space-x-2">
              <button @click="resetToAuto" class="text-sm text-blue-600 hover:text-blue-800">
                Reset to Auto
              </button>
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Position
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Student
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Roll Number
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Total Marks
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
                  Teacher Comment
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Principal Comment
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="(student, index) in students"
                :key="student.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <input
                      v-model="student.position"
                      type="number"
                      min="1"
                      :max="students.length"
                      class="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-blue-500 focus:border-blue-500"
                      @change="onPositionChange(student, index)"
                    />
                    <span class="ml-2 text-sm text-gray-500">
                      {{ getPositionSuffix(student.position) }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ student.name }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {{ student.roll_number }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ student.total_marks || 0 }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {{ student.percentage || 0 }}%
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                      getGradeClass(student.grade)
                    ]"
                  >
                    {{ student.grade || 'N/A' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <textarea
                    v-model="student.teacher_comment"
                    rows="2"
                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Teacher comment..."
                    @change="onCommentChange(student)"
                  />
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <textarea
                    v-model="student.principal_comment"
                    rows="2"
                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Principal comment..."
                    @change="onCommentChange(student)"
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
      v-else-if="!positionsLoading && students.length === 0"
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
        <Calculator class="mx-auto h-12 w-12 text-gray-400" />
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
import { Calculator, Users, Save } from 'lucide-vue-next';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { useToast } from '~/composables/useToast';
import { useAcademics } from '~/composables/useAcademics';
import { useExams } from '~/composables/useExams';
import { useExamPositions } from '~/composables/useExamPositions';
import { useAuth } from '~/composables/useAuth';
import { useBranches } from '~/composables/useBranches';

// Types
interface Student {
  id: string;
  name: string;
  roll_number: string;
  total_marks?: number;
  percentage?: number;
  grade?: string;
  position: number;
  teacher_comment?: string;
  principal_comment?: string;
  is_absent?: boolean;
  original_position?: number;
}

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
const {
  getStudentsForPositions,
  calculatePositions: calculatePositionsAPI,
  savePositions: savePositionsAPI,
  loading: positionsLoading,
  calculating,
  saving
} = useExamPositions();

// Reactive data
const selectedBranchId = ref('');
const selectedExamId = ref('');
const selectedClassId = ref('');
const selectedSectionId = ref('');
const students = ref<Student[]>([]);
const calculationMethod = ref('total_marks');
const tieBreakingMethod = ref('average');
const includeAbsent = ref(false);

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

const canCalculate = computed(() => {
  return selectedExamId.value && selectedClassId.value && students.value.length > 0;
});

const hasChanges = computed(() => {
  return students.value.some(
    student =>
      student.position !== student.original_position ||
      student.teacher_comment ||
      student.principal_comment
  );
});

// Methods
const onBranchChange = () => {
  selectedExamId.value = '';
  selectedClassId.value = '';
  selectedSectionId.value = '';
  students.value = [];
};

const onExamChange = () => {
  selectedClassId.value = '';
  selectedSectionId.value = '';
  students.value = [];
};

const onClassChange = () => {
  selectedSectionId.value = '';
  students.value = [];
};

const onSectionChange = () => {
  students.value = [];
};

const loadStudents = async () => {
  try {
    const params = {
      exam_id: selectedExamId.value,
      class_id: selectedClassId.value,
      school_id: user.value?.school_id,
      branch_id: selectedBranchId.value || user.value?.branch_id
    };

    if (selectedSectionId.value) {
      params.section_id = selectedSectionId.value;
    }

    const response = (await getStudentsForPositions(params)) as any;

    if (response.success) {
      students.value = response.data.map((student: any, index: number) => ({
        ...student,
        position: student.position || index + 1,
        original_position: student.position || index + 1
      }));
      showToast('Students loaded successfully', 'success');
    }
  } catch (error) {
    showToast('Failed to load students', 'error');
  }
};

const calculatePositions = async () => {
  try {
    const requestData = {
      exam_id: selectedExamId.value,
      class_id: selectedClassId.value,
      calculation_method: calculationMethod.value,
      tie_breaking_method: tieBreakingMethod.value,
      include_absent: includeAbsent.value
    };

    const response = (await calculatePositionsAPI(requestData)) as any;

    if (response.success) {
      // Update positions in the UI
      students.value = students.value.map((student, index) => {
        const newPosition =
          response.data.find((s: any) => s.student_id === student.id)?.position || index + 1;
        return {
          ...student,
          position: newPosition,
          original_position: newPosition
        };
      });

      showToast('Positions calculated successfully', 'success');
    }
  } catch (error) {
    showToast('Failed to calculate positions', 'error');
  }
};

const onPositionChange = (student: Student, index: number) => {
  // Validate position
  if (student.position < 1) student.position = 1;
  if (student.position > students.value.length) student.position = students.value.length;

  // Check for duplicates and adjust
  const duplicateIndex = students.value.findIndex(
    (s, i) => s.id !== student.id && s.position === student.position
  );

  if (duplicateIndex !== -1) {
    students.value[duplicateIndex].position = index + 1;
  }
};

const onCommentChange = (student: Student) => {
  // Mark as changed
  student.original_position = student.original_position;
};

const resetToAuto = () => {
  students.value = students.value.map((student, index) => ({
    ...student,
    position: index + 1,
    original_position: index + 1
  }));
};

const savePositions = async () => {
  try {
    const requestData = {
      exam_id: selectedExamId.value,
      class_id: selectedClassId.value,
      positions: students.value.map(student => ({
        student_id: student.id,
        position: student.position,
        teacher_comment: student.teacher_comment,
        principal_comment: student.principal_comment
      }))
    };

    const response = (await savePositionsAPI(requestData)) as any;

    if (response.success) {
      // Update original positions
      students.value = students.value.map(student => ({
        ...student,
        original_position: student.position
      }));

      showToast('Positions saved successfully', 'success');
    }
  } catch (error) {
    showToast('Failed to save positions', 'error');
  }
};

const getPositionSuffix = (position: number) => {
  if (position % 100 >= 11 && position % 100 <= 13) {
    return 'th';
  }
  switch (position % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
};

const getGradeClass = (grade: string) => {
  if (!grade) return 'bg-gray-100 text-gray-800';

  const gradeNum = parseInt(grade);
  if (gradeNum >= 90) return 'bg-green-100 text-green-800';
  if (gradeNum >= 80) return 'bg-blue-100 text-blue-800';
  if (gradeNum >= 70) return 'bg-yellow-100 text-yellow-800';
  if (gradeNum >= 60) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
};

// Load initial data
onMounted(async () => {
  await Promise.all([fetchBranches(), loadExams(), fetchClasses()]);
});
</script>
