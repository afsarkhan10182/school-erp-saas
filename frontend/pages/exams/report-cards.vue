<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-6">
          <div class="flex items-center justify-between">
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

    <!-- Filters -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Exam Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Exam
            </label>
            <EnhancedDropdown
              v-model="selectedExamId"
              :options="examOptions"
              placeholder="Choose exam"
              :loading="false"
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
              :loading="false"
              @change="onSectionChange"
            />
          </div>

          <!-- Load Students Button -->
          <div class="flex items-end">
            <button
              @click="loadStudents"
              :disabled="!selectedExamId || !selectedClassId || reportCardsLoading"
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
    <div v-if="students.length > 0" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Report Card Template</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            v-for="template in templates"
            :key="template.id"
            @click="selectedTemplateId = template.id"
            :class="[
              'border-2 rounded-lg p-4 cursor-pointer transition-all',
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
          </div>
        </div>
      </div>
    </div>

    <!-- Students Selection -->
    <div v-if="students.length > 0" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              Select Students for Report Cards
            </h3>
            <div class="flex space-x-2">
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
              </tr>
            </tbody>
          </table>
        </div>
      </div>
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
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Print Directly</span>
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
import { ref, reactive, computed, onMounted } from 'vue';
import { FileText, Users } from 'lucide-vue-next';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { useToast } from '~/composables/useToast';
import { useAcademics } from '~/composables/useAcademics';
import { useExams } from '~/composables/useExams';
import { useExamReports } from '~/composables/useExamReports';
import { useAuth } from '~/composables/useAuth';

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
  classes,
  sections,
  classOptions,
  sectionOptions,
  fetchClasses,
  fetchSections,
  loading: classesLoading
} = useAcademics();
const { exams, loadExams } = useExams();
const {
  getStudentsForReportCards,
  getReportCardTemplates,
  generateReportCards,
  loading: reportCardsLoading,
  generating
} = useExamReports();

// Reactive data
const selectedExamId = ref('');
const selectedClassId = ref('');
const selectedSectionId = ref('');
const students = ref<Student[]>([]);
const selectedStudents = ref<string[]>([]);
const selectedTemplateId = ref('');
const outputFormat = ref('pdf');
const emailToParents = ref(false);
const emailToStudents = ref(false);
const templates = ref<Template[]>([]);

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
  return selectedClass?.has_stream || false;
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
  return selectedStudents.value.length > 0 && selectedTemplateId.value && selectedExamId.value;
});

// Methods
const onExamChange = () => {
  selectedClassId.value = '';
  selectedSectionId.value = '';
  students.value = [];
  selectedStudents.value = [];
  selectedTemplateId.value = '';
};

const onClassChange = () => {
  selectedSectionId.value = '';
  students.value = [];
  selectedStudents.value = [];
  selectedTemplateId.value = '';
};

const onSectionChange = () => {
  students.value = [];
  selectedStudents.value = [];
  selectedTemplateId.value = '';
};

const loadStudents = async () => {
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

    const response = (await getStudentsForReportCards(params)) as any;

    if (response.success) {
      students.value = response.data;
      showToast('Students loaded successfully', 'success');
    }
  } catch (error) {
    showToast('Failed to load students', 'error');
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

const generateReportCardsHandler = async () => {
  try {
    const requestData = {
      exam_id: selectedExamId.value,
      student_ids: selectedStudents.value,
      template_id: selectedTemplateId.value,
      output_format: outputFormat.value,
      email_options: {
        to_parents: emailToParents.value,
        to_students: emailToStudents.value
      }
    };

    const response = (await generateReportCards(requestData)) as any;

    if (response.success) {
      showToast(`Report cards generated for ${selectedStudents.value.length} students`, 'success');

      // If PDF, trigger download
      if (outputFormat.value === 'pdf' && response.data.download_url) {
        window.open(response.data.download_url, '_blank');
      }
    }
  } catch (error) {
    showToast('Failed to generate report cards', 'error');
  }
};

const loadTemplates = async () => {
  try {
    const response = (await getReportCardTemplates({
      school_id: user.value?.school_id,
      branch_id: user.value?.branch_id
    })) as any;

    if (response.success) {
      templates.value = response.data;
    }
  } catch (error) {
    showToast('Failed to load templates', 'error');
  }
};

// Load initial data
onMounted(async () => {
  await Promise.all([loadExams(), fetchClasses(), loadTemplates()]);
});
</script>
