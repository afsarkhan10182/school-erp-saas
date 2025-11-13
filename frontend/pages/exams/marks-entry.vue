<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Mark Entries</h1>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Enter marks for students by exam, class, section, and subject
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Select Ground Section -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white border-b-2 border-red-500 pb-2 inline-block">
            Select Ground
          </h3>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <!-- Exam -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Exam <span class="text-red-500">*</span>
              </label>
              <EnhancedDropdown
                v-model="selectedExamId"
                :options="examOptions"
                placeholder="Select exam"
                :loading="examsLoading"
                @change="onExamChange"
              />
            </div>

            <!-- Class -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Class <span class="text-red-500">*</span>
              </label>
              <EnhancedDropdown
                v-model="selectedClassId"
                :options="classOptions"
                placeholder="Select class"
                :loading="classesLoading"
                @change="onClassChange"
              />
            </div>

            <!-- Section -->
            <div v-if="showSectionField">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Section <span class="text-red-500">*</span>
              </label>
              <EnhancedDropdown
                v-model="selectedSectionId"
                :options="sectionOptions"
                placeholder="Select section"
                :loading="sectionsLoading"
                @change="onSectionChange"
              />
            </div>

            <!-- Subject -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject <span class="text-red-500">*</span>
              </label>
              <EnhancedDropdown
                v-model="selectedSubjectId"
                :options="subjectOptions"
                placeholder="Select subject"
                :loading="subjectsLoading"
                @change="onSubjectChange"
              />
            </div>
          </div>

          <!-- Filter Button -->
          <div class="flex justify-end mt-4">
            <button
              @click="loadStudents"
              :disabled="!canLoadStudents || loadingStudents"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Filter class="h-4 w-4 mr-2" />
              {{ loadingStudents ? 'Loading...' : 'Filter' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Mark Entries Section -->
    <div v-if="students.length > 0" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center">
            <Users class="h-5 w-5 mr-2 text-gray-600 dark:text-gray-400" />
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white border-b-2 border-red-500 pb-2 inline-block">
              Mark Entries
            </h3>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Sl
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Student Name
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Category
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Register No
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Roll
                </th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  IsAbsent
                </th>
                <th
                  v-if="showPracticalField"
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Practical ({{ markDistribution?.practical_marks || 0 }})
                </th>
                <th
                  v-if="showWrittenField"
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Written ({{ markDistribution?.theory_marks || 0 }})
                </th>
                <th
                  v-if="showVivaField"
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Viva ({{ markDistribution?.viva_marks || 0 }})
                </th>
                <th
                  v-if="showAssignmentField"
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Assignment ({{ markDistribution?.assignment_marks || 0 }})
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="student in students"
                :key="student.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ student.serial_number }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ student.name }}
                  </div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {{ formatCategory(student.category) }}
                  </span>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ student.admission_number }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ student.roll_number }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-center">
                  <input
                    v-model="studentMarks[student.id].is_absent"
                    type="checkbox"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    @change="onAbsentChange(student.id)"
                  />
                </td>
                <td v-if="showPracticalField" class="px-4 py-4 whitespace-nowrap">
                  <input
                    v-model.number="studentMarks[student.id].practical_marks_obtained"
                    type="number"
                    min="0"
                    :max="markDistribution?.practical_marks || 0"
                    class="w-24 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    :disabled="studentMarks[student.id]?.is_absent"
                    placeholder="0"
                  />
                </td>
                <td v-if="showWrittenField" class="px-4 py-4 whitespace-nowrap">
                  <input
                    v-model.number="studentMarks[student.id].theory_marks_obtained"
                    type="number"
                    min="0"
                    :max="markDistribution?.theory_marks || 0"
                    class="w-24 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    :disabled="studentMarks[student.id]?.is_absent"
                    placeholder="0"
                  />
                </td>
                <td v-if="showVivaField" class="px-4 py-4 whitespace-nowrap">
                  <input
                    v-model.number="studentMarks[student.id].viva_marks_obtained"
                    type="number"
                    min="0"
                    :max="markDistribution?.viva_marks || 0"
                    class="w-24 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    :disabled="studentMarks[student.id]?.is_absent"
                    placeholder="0"
                  />
                </td>
                <td v-if="showAssignmentField" class="px-4 py-4 whitespace-nowrap">
                  <input
                    v-model.number="studentMarks[student.id].assignment_marks_obtained"
                    type="number"
                    min="0"
                    :max="markDistribution?.assignment_marks || 0"
                    class="w-24 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    :disabled="studentMarks[student.id]?.is_absent"
                    placeholder="0"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Save Button at Bottom Right -->
        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            @click="saveMarks"
            :disabled="saving || !hasChanges"
            class="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save class="h-4 w-4 mr-2" />
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
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
          Please select exam, class, section (if applicable), and subject, then click Filter to load students.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { Save, Users, Filter } from 'lucide-vue-next';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { useToast } from '~/composables/useToast';
import { useAcademics } from '~/composables/useAcademics';
import { useExams } from '~/composables/useExams';
import { useMarksEntry } from '~/composables/useMarksEntry';
import { useAuth } from '~/composables/useAuth';
import { useBranches } from '~/composables/useBranches';
import { classSubjectAssignmentApi } from '~/api/academic/class-subject-assignment';

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

// Subject options (loaded dynamically based on class)
const subjectOptions = ref<Array<{ value: string; label: string }>>([]);
const subjectsLoading = ref(false);
const { exams, loadExams, loading: examsLoading } = useExams();
const { getStudentsForMarksEntry, saveMarks: saveMarksAPI, getMarksEntrySummary } = useMarksEntry();

// Types
interface Student {
  id: string;
  serial_number: number;
  name: string;
  roll_number: string;
  admission_number: string;
  category: string;
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
const selectedSubjectId = ref('');
const students = ref<Student[]>([]);
const studentMarks = reactive<Record<string, StudentMarks>>({});
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

const canLoadStudents = computed(() => {
  return !!(
    selectedExamId.value &&
    selectedClassId.value &&
    selectedSubjectId.value &&
    (!showSectionField.value || selectedSectionId.value)
  );
});

const hasChanges = computed(() => {
  return Object.keys(studentMarks).length > 0;
});

// Dynamic mark type visibility
const showPracticalField = computed(() => {
  return (markDistribution.value?.practical_marks || 0) > 0;
});

const showWrittenField = computed(() => {
  return (markDistribution.value?.theory_marks || 0) > 0;
});

const showVivaField = computed(() => {
  return (markDistribution.value?.viva_marks || 0) > 0;
});

const showAssignmentField = computed(() => {
  return (markDistribution.value?.assignment_marks || 0) > 0;
});

// Methods
const formatCategory = (category: string) => {
  const categoryMap: Record<string, string> = {
    general: 'General',
    obc: 'OBC',
    sc: 'SC',
    st: 'ST',
    other: 'Other'
  };
  return categoryMap[category] || 'General';
};

const loadSubjectsForClass = async () => {
  if (!selectedClassId.value) {
    selectedSubjectId.value = '';
    subjectOptions.value = [];
    return;
  }

  try {
    subjectsLoading.value = true;
    const params: any = {
      class_id: selectedClassId.value,
      limit: 1000,
      page: 1
    };

    if (user.value?.school_id) {
      params.school_id = user.value.school_id;
    }
    if (selectedBranchId.value || user.value?.branch_id) {
      params.branch_id = selectedBranchId.value || user.value?.branch_id;
    }
    if (selectedSectionId.value) {
      params.section_id = selectedSectionId.value;
    }

    const response = await classSubjectAssignmentApi.getAll(params);

    let assignments = [];
    if (response?.assignments && Array.isArray(response.assignments)) {
      assignments = response.assignments;
    } else if (response?.data?.assignments && Array.isArray(response.data.assignments)) {
      assignments = response.data.assignments;
    } else if (Array.isArray(response?.data)) {
      assignments = response.data;
    }

    // Extract unique subjects from assignments
    const uniqueSubjects = new Map();
    assignments.forEach((assignment: any) => {
      if (assignment.subject && !uniqueSubjects.has(assignment.subject.id)) {
        uniqueSubjects.set(assignment.subject.id, {
          id: assignment.subject.id,
          name: assignment.subject.name,
          code: assignment.subject.code
        });
      }
    });

    // Update subject options
    const subjectsArray = Array.from(uniqueSubjects.values());
    subjectOptions.value = subjectsArray.map((subject: any) => ({
      value: subject.id,
      label: `${subject.name}${subject.code ? ` (${subject.code})` : ''}`
    }));
  } catch (error) {
    console.error('Error loading subjects for class:', error);
    showToast('Failed to load subjects', 'error');
    subjectOptions.value = [];
  } finally {
    subjectsLoading.value = false;
  }
};

const onBranchChange = () => {
  selectedExamId.value = '';
  selectedClassId.value = '';
  selectedSectionId.value = '';
  selectedSubjectId.value = '';
  students.value = [];
  Object.keys(studentMarks).forEach(key => delete studentMarks[key]);
  markDistribution.value = null;
};

const onExamChange = () => {
  selectedClassId.value = '';
  selectedSectionId.value = '';
  selectedSubjectId.value = '';
  students.value = [];
  Object.keys(studentMarks).forEach(key => delete studentMarks[key]);
  markDistribution.value = null;
};

const onClassChange = async () => {
  selectedSectionId.value = '';
  selectedSubjectId.value = '';
  students.value = [];
  Object.keys(studentMarks).forEach(key => delete studentMarks[key]);
  markDistribution.value = null;

  if (selectedClassId.value) {
    await fetchSections({
      schoolId: user.value?.school_id,
      branchId: selectedBranchId.value || user.value?.branch_id,
      classId: selectedClassId.value
    });
    await loadSubjectsForClass();
  }
};

const onSectionChange = async () => {
  selectedSubjectId.value = '';
  students.value = [];
  Object.keys(studentMarks).forEach(key => delete studentMarks[key]);
  markDistribution.value = null;

  if (selectedClassId.value) {
    await loadSubjectsForClass();
  }
};

const onSubjectChange = () => {
  students.value = [];
  Object.keys(studentMarks).forEach(key => delete studentMarks[key]);
  markDistribution.value = null;
};

const loadStudents = async () => {
  if (!canLoadStudents.value) {
    showToast('Please select all required fields', 'warning');
    return;
  }

  try {
    loadingStudents.value = true;

    const params: any = {
      exam_id: selectedExamId.value,
      class_id: selectedClassId.value,
      subject_id: selectedSubjectId.value,
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
          studentMarks[student.id] = {
            theory_marks_obtained: student.existing_marks.theory_marks_obtained || 0,
            practical_marks_obtained: student.existing_marks.practical_marks_obtained || 0,
            viva_marks_obtained: student.existing_marks.viva_marks_obtained || 0,
            assignment_marks_obtained: student.existing_marks.assignment_marks_obtained || 0,
            is_absent: student.existing_marks.is_absent || false
          };
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

      showToast('Students loaded successfully', 'success');
    }
  } catch (error) {
    console.error('Error loading students:', error);
    showToast('Failed to load students', 'error');
  } finally {
    loadingStudents.value = false;
  }
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
      // Reload students to show updated data
      await loadStudents();
    }
  } catch (error) {
    console.error('Error saving marks:', error);
    showToast('Failed to save marks', 'error');
  } finally {
    saving.value = false;
  }
};

// Watch for class changes to load subjects
watch(selectedClassId, async newClassId => {
  if (newClassId) {
    await loadSubjectsForClass();
  }
});

// Watch for section changes to reload subjects
watch(selectedSectionId, async () => {
  if (selectedClassId.value) {
    await loadSubjectsForClass();
  }
});

// Load initial data
onMounted(async () => {
  await Promise.all([fetchBranches(), loadExams()]);
  
  // Load classes if branch is already set
  if (user.value?.branch_id) {
    selectedBranchId.value = user.value.branch_id;
    await fetchClasses({
      branchId: user.value.branch_id
    });
  }
});
</script>
