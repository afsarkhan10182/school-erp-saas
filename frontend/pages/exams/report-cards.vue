<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-6">
          <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Report Cards</h1>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Generate and print student report cards
              </p>
            </div>
            <div class="flex space-x-3">
              <button
                @click="generateReportCardsHandler"
                :disabled="!canGenerate || generating"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText class="h-4 w-4 mr-2" />
                {{ generating ? 'Generating...' : 'Generate Report Cards' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="isSuperAdmin && !resolvedSchoolId"
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6"
    >
      <div
        class="rounded-md bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
      >
        Select a school from the global school selector to load its exams and report-card templates.
      </div>
    </div>

    <!-- Filters -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 mb-4">
          <h3
            class="text-lg font-semibold text-gray-900 dark:text-white border-b-2 border-red-500 pb-2 inline-block"
          >
            Select Exam and Class
          </h3>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <div v-if="canManageSetups && resolvedBranchId">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Report-card setup
            </label>
            <EnhancedDropdown
              v-model="selectedSetupId"
              :options="setupOptions"
              placeholder="Use one exam"
              :loading="setupsLoading"
              @change="onSetupChange"
            />
          </div>
          <!-- Exam Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ selectedSetupId ? 'Roster anchor exam' : 'Select Exam' }}
            </label>
            <EnhancedDropdown
              v-model="selectedExamId"
              :options="examOptions"
              placeholder="Choose exam"
              :loading="examsLoading"
              @change="onExamChange"
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

          <div>
            <label for="report-card-enrollment-scope" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Student register
            </label>
            <select
              id="report-card-enrollment-scope"
              v-model="enrollmentScope"
              class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              @change="onEnrollmentScopeChange"
            >
              <option value="currently_studying">Currently studying only</option>
              <option value="full_register">Full register (incl. promoted)</option>
            </select>
          </div>

          <!-- Load Students Button -->
          <div class="flex items-end">
            <button
              @click="loadStudents"
              :disabled="!canLoadStudents || reportCardsLoading"
              class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Users class="h-4 w-4 mr-2" />
              {{ reportCardsLoading ? 'Loading...' : 'Load Students' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Template Selection -->
    <div v-if="students.length > 0 && !selectedSetupId" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Report Card Template</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            v-for="template in templates"
            :key="template.id"
            @click="selectedTemplateId = template.id"
            :aria-pressed="selectedTemplateId === template.id"
            :class="[
              'w-full text-left border-2 rounded-lg p-4 cursor-pointer transition-all',
              selectedTemplateId === template.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
            ]"
          >
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <FileText class="h-8 w-8 text-blue-600" />
              </div>
              <div class="ml-3">
                <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ template.name }}
                </h4>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ template.description }}
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>

    <div v-if="students.length > 0 && selectedSetupId" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
      <p class="rounded-md bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
        {{ selectedSetupSummary }}
      </p>
    </div>

    <!-- Students Selection -->
    <div v-if="students.length > 0" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              Select Students for Report Cards
            </h3>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
              <button @click="selectAllStudents" class="text-sm text-blue-600 hover:text-blue-800">
                Select All
              </button>
              <button
                @click="deselectAllStudents"
                class="text-sm text-gray-600 hover:text-gray-800"
              >
                Deselect All
              </button>
            </div>
          </div>
        </div>

        <p class="px-4 pt-3 pb-1 text-xs text-gray-500 dark:text-gray-400 sm:hidden">
          Swipe the table horizontally to reach each student’s report-card action.
        </p>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  <input
                    v-model="selectAll"
                    type="checkbox"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    @change="toggleAllStudents"
                  />
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
                  Grade
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Status
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Action
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
                  <input
                    v-model="selectedStudents"
                    :value="student.id"
                    type="checkbox"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ student.name }}
                  </div>
                  <div v-if="student.is_promoted_since_exam" class="text-xs text-blue-600 dark:text-blue-300">
                    Included from the exam-year register
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
                  <span
                    :class="[
                      'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                      student.is_absent ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    ]"
                  >
                    {{ student.is_absent ? 'Absent' : 'Present' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    type="button"
                    :disabled="!canGenerateSingle || generating"
                    :aria-label="`Generate report card for ${student.name}`"
                    class="text-sm font-medium text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                    @click="generateSingleReportCard(student.id)"
                  >
                    Generate Report Card
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="students.length && canArchiveReportCards" class="max-w-7xl mx-auto px-4 pb-4">
      <label class="flex items-start gap-2 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
        <input v-model="archiveReportCards" type="checkbox" class="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600" />
        <span>Save an individual PDF copy in each generated student’s Student 360 archive.</span>
      </label>
    </div>

    <!-- Generation Options -->
    <div v-if="selectedStudents.length > 0" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Generation Options</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Output Format
            </label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  v-model="outputFormat"
                  value="pdf"
                  type="radio"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">PDF (Recommended)</span>
              </label>
              <label class="flex items-center">
                <input
                  v-model="outputFormat"
                  value="print"
                  type="radio"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">PDF for printing</span>
              </label>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Options
            </label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  v-model="emailToParents"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Email to parents
                </span>
              </label>
              <label class="flex items-center">
                <input
                  v-model="emailToStudents"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Email to students
                </span>
              </label>
            </div>
          </div>

        </div>
      </div>
    </div>

    <div v-if="generatedReportUrl" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
      <a
        :href="generatedReportUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
      >
        Open generated PDF
      </a>
    </div>

    <!-- No Students Message -->
    <div
      v-else-if="!reportCardsLoading && students.length === 0"
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
        <FileText class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No students found</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Please select an exam and class to load students.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { FileText, Users } from 'lucide-vue-next';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { useToast } from '~/composables/useToast';
import { useAcademics } from '~/composables/useAcademics';
import { useExams } from '~/composables/useExams';
import { useExamReports } from '~/composables/useExamReports';
import { useAuth } from '~/composables/useAuth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { reportCardSetupApi } from '~/api/academic/report-card-setups';

// Types
interface Student {
  id: string;
  name: string;
  roll_number: string;
  class?: { name: string };
  section?: { name: string };
  total_marks?: number;
  grade?: string;
  is_absent?: boolean;
  is_promoted_since_exam?: boolean;
}

interface Template {
  id: string;
  name: string;
  description: string;
}

// Composables
const { showToast } = useToast();
const { user } = useAuth();
const {
  public: { apiBase }
} = useRuntimeConfig();
const { selectedBranchId, currentBranch, currentSchool, isSuperAdmin } = useGlobalBranch();
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
const { exams, loadExams, resetState: resetExams, loading: examsLoading } = useExams();
const {
  fetchStudents: getStudentsForReportCards,
  fetchTemplates: getReportCardTemplates,
  generateReport: generateReportCards,
  loading: reportCardsLoading,
  error: reportCardsError
} = useExamReports();

const generating = computed(() => reportCardsLoading.value);

// Reactive data
const selectedExamId = ref('');
const selectedClassId = ref('');
const selectedSectionId = ref('');
const enrollmentScope = ref<'currently_studying' | 'full_register'>('currently_studying');
const students = ref<Student[]>([]);
const selectedStudents = ref<string[]>([]);
const selectedTemplateId = ref('');
const outputFormat = ref('pdf');
const emailToParents = ref(false);
const emailToStudents = ref(false);
const archiveReportCards = ref(false);
const templates = ref<Template[]>([]);
const generatedReportUrl = ref('');
const selectedSetupId = ref('');
const reportCardSetups = ref<any[]>([]);
const setupsLoading = ref(false);

const resolvedSchoolId = computed(() => currentSchool.value?.id || user.value?.school_id);
const resolvedBranchId = computed(() => currentBranch.value?.id || selectedBranchId.value || user.value?.branch_id || undefined);
const canManageSetups = computed(() => ['admin', 'branch_admin', 'super_admin'].includes(user.value?.role || ''));
const canArchiveReportCards = canManageSetups;
const setupOptions = computed(() => reportCardSetups.value.map(setup => ({ value: setup.id, label: setup.name })));
const selectedSetup = computed(() => reportCardSetups.value.find(setup => setup.id === selectedSetupId.value));
const selectedSetupSummary = computed(() => {
  const setup = selectedSetup.value;
  const exams = (setup?.examEntries || []).map((entry: any) => `${entry.exam?.name || 'Exam'} ${entry.weightage}%`).join(', ');
  return `Using “${setup?.name}” with ${setup?.template?.name}: ${exams}.`;
});

watch(
  [selectedBranchId, currentSchool],
  async ([newBranchId]) => {
    selectedExamId.value = '';
    selectedClassId.value = '';
    selectedSectionId.value = '';
    students.value = [];
    selectedStudents.value = [];
    selectedTemplateId.value = '';
    selectedSetupId.value = '';
    generatedReportUrl.value = '';
    classes.value = [];
    sections.value = [];
    templates.value = [];
    reportCardSetups.value = [];
    resetExams();

    if (!resolvedSchoolId.value) {
      return;
    }

    await Promise.all([
      fetchClasses({ schoolId: resolvedSchoolId.value, branchId: newBranchId || undefined }),
      loadExams({
        school_id: resolvedSchoolId.value,
        ...(newBranchId && { branch_id: newBranchId })
      }),
      loadTemplates(),
      loadReportCardSetups(newBranchId)
    ]);
  },
  { immediate: true }
);

// Computed properties
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
    resolvedSchoolId.value &&
    selectedExamId.value &&
    selectedClassId.value &&
    (!showSectionField.value || selectedSectionId.value)
  );
});

const selectAll = computed({
  get: () => selectedStudents.value.length === students.value.length && students.value.length > 0,
  set: (value: boolean) => {
    if (value) {
      selectedStudents.value = students.value.map(s => s.id);
    } else {
      selectedStudents.value = [];
    }
  }
});

const canGenerate = computed(() => {
  return selectedStudents.value.length > 0 && (selectedSetupId.value || selectedTemplateId.value) && selectedExamId.value;
});
const canGenerateSingle = computed(() =>
  !!(selectedExamId.value && (selectedSetupId.value || selectedTemplateId.value))
);

// Methods
const onExamChange = () => {
  generatedReportUrl.value = '';
  // Exam is independent of class, so don't clear class selection
  // Only clear students since exam changed
  students.value = [];
  selectedStudents.value = [];
  selectedTemplateId.value = '';
};

const onSetupChange = () => {
  const setup = selectedSetup.value;
  selectedExamId.value = setup?.examEntries?.[0]?.exam_id || '';
  selectedClassId.value = '';
  selectedSectionId.value = '';
  students.value = [];
  selectedStudents.value = [];
  selectedTemplateId.value = '';
  generatedReportUrl.value = '';
};

const onClassChange = async () => {
  generatedReportUrl.value = '';
  selectedSectionId.value = '';
  students.value = [];
  selectedStudents.value = [];
  selectedTemplateId.value = '';

  if (selectedClassId.value) {
    await fetchSections({
      schoolId: resolvedSchoolId.value,
      branchId: resolvedBranchId.value,
      classId: selectedClassId.value
    });
  }
};

const onSectionChange = () => {
  generatedReportUrl.value = '';
  students.value = [];
  selectedStudents.value = [];
  selectedTemplateId.value = '';
};

const onEnrollmentScopeChange = () => {
  generatedReportUrl.value = '';
  students.value = [];
  selectedStudents.value = [];
};

const loadStudents = async () => {
  try {
    const params: any = {
      exam_id: selectedExamId.value,
      class_id: selectedClassId.value,
      school_id: resolvedSchoolId.value,
      branch_id: resolvedBranchId.value,
      enrollment_scope: enrollmentScope.value
    };

    if (selectedSectionId.value) {
      params.section_id = selectedSectionId.value;
    }

    const response = (await getStudentsForReportCards(params)) as any;

    if (response.success) {
      students.value = response.data.students || response.data || [];
      showToast('Students loaded successfully', 'success');
    }
  } catch (error: any) {
    console.error('Error loading students:', error);
    showToast(error?.message || 'Failed to load students', 'error');
  }
};

const selectAllStudents = () => {
  selectedStudents.value = students.value.map(s => s.id);
};

const deselectAllStudents = () => {
  selectedStudents.value = [];
};

const toggleAllStudents = () => {
  if (selectAll.value) {
    selectAllStudents();
  } else {
    deselectAllStudents();
  }
};

const getGradeClass = (grade: string | undefined) => {
  if (!grade) return 'bg-gray-100 text-gray-800';

  const gradeNum = parseInt(grade);
  if (gradeNum >= 90) return 'bg-green-100 text-green-800';
  if (gradeNum >= 80) return 'bg-blue-100 text-blue-800';
  if (gradeNum >= 70) return 'bg-yellow-100 text-yellow-800';
  if (gradeNum >= 60) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
};

const generateReportCardsFor = async ({
  studentIds = selectedStudents.value,
  format = outputFormat.value,
  sendEmail = true
}: {
  studentIds?: string[];
  format?: 'pdf' | 'print';
  sendEmail?: boolean;
} = {}) => {
  try {
    generatedReportUrl.value = '';
    const requestData = {
      ...(selectedSetupId.value
        ? { setup_id: selectedSetupId.value }
        : { exam_id: selectedExamId.value, template_id: selectedTemplateId.value }),
      student_ids: studentIds,
      class_id: selectedClassId.value,
      ...(selectedSectionId.value && { section_id: selectedSectionId.value }),
      enrollment_scope: enrollmentScope.value,
      archive_report_cards: archiveReportCards.value,
      school_id: resolvedSchoolId.value,
      branch_id: resolvedBranchId.value,
      output_format: format,
      email_options: {
        to_parents: sendEmail && emailToParents.value,
        to_students: sendEmail && emailToStudents.value
      }
    };

    const response = (await generateReportCards(requestData)) as any;

    if (response.success) {
      const delivery = response.data.email_delivery;
      const emailRequested = sendEmail && (emailToParents.value || emailToStudents.value);
      const archivedCount = response.data.archived_students || 0;
      const message =
        emailRequested
          ? `Generated ${studentIds.length} report cards; ${delivery?.sent || 0} emails sent, ${delivery?.failed || 0} failed, ${delivery?.skipped_students || 0} students had no recipient email.${archivedCount ? ` Archived ${archivedCount} individual PDFs.` : ''}`
          : `Report cards generated for ${studentIds.length} students${archivedCount ? `; ${archivedCount} saved to Student 360.` : ''}`;
      showToast(message, delivery?.failed ? 'error' : 'success');

      // Open the generated PDF for download or printing.
      if (response.data.download_url) {
        generatedReportUrl.value = new URL(
          response.data.download_url,
          new URL(apiBase, window.location.origin)
        ).toString();
        window.open(generatedReportUrl.value, '_blank');
      }
    }
  } catch (error) {
    showToast('Failed to generate report cards', 'error');
  }
};

const generateReportCardsHandler = () => generateReportCardsFor();
const generateSingleReportCard = (studentId: string) =>
  generateReportCardsFor({ studentIds: [studentId], format: 'pdf', sendEmail: false });

async function loadTemplates() {
  try {
    const response = (await getReportCardTemplates({
      school_id: resolvedSchoolId.value,
      branch_id: resolvedBranchId.value
    })) as any;

    if (response.success) {
      templates.value = response.data;
    }
  } catch (error: any) {
    showToast(error?.message || 'Failed to load templates', 'error');
  }
}

async function loadReportCardSetups(branchId: string) {
  if (!branchId || !canManageSetups.value) return;
  setupsLoading.value = true;
  try {
    const response = (await reportCardSetupApi.getAll(branchId)) as any;
    reportCardSetups.value = (response.data || []).filter((setup: any) => setup.is_published);
  } catch {
    reportCardSetups.value = [];
  } finally {
    setupsLoading.value = false;
  }
}
</script>
