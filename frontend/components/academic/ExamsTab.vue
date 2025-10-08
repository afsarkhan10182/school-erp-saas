<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Exams</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage exams and examination activities
        </p>
      </div>
      <button
        @click="openCreateModal"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Plus class="w-4 h-4 mr-2" />
        New Exam
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <BookOpen class="h-6 w-6 text-blue-600" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Total Exams
                </dt>
                <dd class="text-lg font-medium text-gray-900 dark:text-white">
                  {{ stats?.total_exams || 0 }}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <CheckCircle class="h-6 w-6 text-green-600" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Completed
                </dt>
                <dd class="text-lg font-medium text-gray-900 dark:text-white">
                  {{ stats?.completed_exams || 0 }}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <Calendar class="h-6 w-6 text-yellow-600" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Scheduled
                </dt>
                <dd class="text-lg font-medium text-gray-900 dark:text-white">
                  {{ stats?.scheduled_exams || 0 }}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <TrendingUp class="h-6 w-6 text-purple-600" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Avg Score
                </dt>
                <dd class="text-lg font-medium text-gray-900 dark:text-white">
                  {{ stats?.avg_score || 0 }}%
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Exams List -->
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading exams...</p>
    </div>

    <div v-else-if="exams.length === 0" class="text-center py-8">
      <BookOpen class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No exams</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Get started by creating a new exam.
      </p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="exam in exams"
        :key="exam.id"
        class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h4
              class="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
            >
              {{ exam.name }}
            </h4>
            <div class="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span class="flex items-center">
                <BookOpen class="w-4 h-4 mr-1" />
                {{ exam.class?.name }}
              </span>
              <span v-if="exam.subject?.name" class="flex items-center">
                <Tag class="w-4 h-4 mr-1" />
                {{ exam.subject.name }}
              </span>
              <span class="flex items-center">
                <Calendar class="w-4 h-4 mr-1" />
                {{ exam.schedules?.length || 0 }} schedule(s)
              </span>
            </div>
            <div class="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span class="flex items-center">
                <TrendingUp class="w-4 h-4 mr-1" />
                {{ exam.max_marks }} marks
              </span>
              <span class="flex items-center">
                <Users class="w-4 h-4 mr-1" />
                {{ exam.students_count || 0 }} students
              </span>
            </div>
            <div
              v-if="exam.instructions"
              class="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2"
            >
              {{ exam.instructions }}
            </div>
            <div class="mt-3 flex items-center justify-between">
              <button
                @click="scheduleExam(exam)"
                class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Calendar class="w-3 h-3 mr-1" />
                Schedule
              </button>
              <div class="flex items-center space-x-2">
                <button
                  @click="editExam(exam)"
                  class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  <Edit class="w-4 h-4" />
                </button>
                <button
                  @click="viewExam(exam)"
                  class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <Eye class="w-4 h-4" />
                </button>
                <button
                  @click="deleteExam(exam.id)"
                  class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Modal :show="showModal" @close="closeModal" size="lg">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          {{ editingExam ? 'Edit Exam' : 'Create New Exam' }}
        </h3>
      </template>

      <template #body>
        <form @submit.prevent="saveExam" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Exam Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Exam Name <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter exam name"
              />
            </div>

            <!-- Exam Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Exam Type <span class="text-red-500">*</span>
              </label>
              <EnhancedDropdown
                v-model="form.exam_type_id"
                :options="examTypeOptions"
                placeholder="Select exam type"
                :loading="examTypesLoading"
              />
            </div>

            <!-- Class -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Class <span class="text-red-500">*</span>
              </label>
              <EnhancedDropdown
                v-model="form.class_id"
                :options="classOptions"
                placeholder="Select class"
                :loading="loading"
                @update:model-value="loadSections"
              />
            </div>

            <!-- Section (show if class has sections) -->
            <div v-if="showSectionField">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Section
              </label>
              <EnhancedDropdown
                v-model="form.section_id"
                :options="sectionOptions"
                placeholder="All sections"
                :loading="loading"
              />
            </div>

            <!-- Stream (show if class has streams) -->
            <div v-if="showStreamField">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stream
              </label>
              <EnhancedDropdown
                v-model="form.stream_id"
                :options="streamOptions"
                placeholder="All streams"
                :loading="loading"
              />
            </div>

            <!-- Subject -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject
              </label>
              <EnhancedDropdown
                v-model="form.subject_id"
                :options="subjectOptions"
                placeholder="All subjects"
                :loading="loading"
              />
            </div>

            <!-- Max Marks -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Marks <span class="text-red-500">*</span>
              </label>
              <input
                v-model.number="form.max_marks"
                type="number"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="100"
              />
            </div>

            <!-- Weightage -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Weightage (%)
              </label>
              <input
                v-model.number="form.weightage"
                type="number"
                step="0.1"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="20.0"
              />
            </div>

            <!-- Instructions -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Instructions
              </label>
              <textarea
                v-model="form.instructions"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter exam instructions..."
              ></textarea>
            </div>
          </div>
        </form>
      </template>

      <template #footer>
        <div class="flex justify-end space-x-3">
          <button
            @click="closeModal"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            @click="saveExam"
            :disabled="saving"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="saving">Saving...</span>
            <span v-else>{{ editingExam ? 'Update' : 'Create' }}</span>
          </button>
        </div>
      </template>
    </Modal>

    <!-- Exam Results Modal -->
    <Modal :show="showExamResults" @close="closeExamResults" size="xl">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Exam Results - {{ selectedExam?.name }}
        </h3>
      </template>

      <template #body>
        <ExamResults v-if="selectedExam" :exam="selectedExam" @close="closeExamResults" />
      </template>
    </Modal>

    <!-- Exam Schedule Modal -->
    <ExamScheduleModal
      :show="showScheduleModal"
      :exam="selectedExamForSchedule"
      :branch-id="branchId"
      :school-id="schoolId"
      @close="closeScheduleModal"
      @success="handleScheduleSuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import {
  Plus,
  BookOpen,
  CheckCircle,
  Calendar,
  TrendingUp,
  Tag,
  Edit,
  Eye,
  Trash2,
  Users
} from 'lucide-vue-next';
import Modal from '~/components/ui/Modal.vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import ExamResults from '~/components/academic/ExamResults.vue';
import { useToast } from '~/composables/useToast';
import { useAcademics } from '~/composables/useAcademics';
import { useExamOptions } from '~/composables/useExamOptions';
import ExamScheduleModal from './ExamScheduleModal.vue';

// Props
const props = defineProps({
  exams: {
    type: Array,
    default: () => []
  },
  stats: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  },
  branchId: {
    type: String,
    default: ''
  },
  schoolId: {
    type: String,
    default: ''
  }
});

// Emits
const emit = defineEmits(['refresh', 'create', 'update', 'delete', 'success']);

// Composables
const { showToast } = useToast();
const {
  classes,
  classOptions,
  sectionOptions,
  subjectOptions,
  streamOptions,
  fetchClasses,
  fetchSections,
  fetchSubjects,
  fetchStreams
} = useAcademics();
const { examTypeOptions, loading: examTypesLoading, loadExamTypes } = useExamOptions();

// Helper function to validate UUID
const isValidUUID = uuid => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Reactive data
const showModal = ref(false);
const showExamResults = ref(false);
const showScheduleModal = ref(false);
const saving = ref(false);
const editingExam = ref(null);
const selectedExam = ref(null);
const selectedExamForSchedule = ref(null);

// Computed properties for dynamic form fields
const selectedClass = computed(() => {
  return classes.value.find(cls => cls.id === form.class_id);
});

const showStreamField = computed(() => {
  return selectedClass.value?.has_streams || false;
});

const showSectionField = computed(() => {
  return selectedClass.value?.has_sections || false;
});

const form = reactive({
  name: '',
  exam_type_id: '',
  class_id: '',
  section_id: '',
  stream_id: '',
  subject_id: '',
  max_marks: 100,
  weightage: 20.0,
  instructions: ''
});

// Methods
const openCreateModal = async () => {
  editingExam.value = null;
  resetForm();
  showModal.value = true;

  // Load all required data when modal opens
  try {
    await Promise.all([
      loadExamTypes(),
      fetchClasses({ branchId: props.branchId }),
      fetchSubjects({ branchId: props.branchId })
    ]);

    // Debug: Check if subjects were loaded
    if (subjectOptions.value.length === 0) {
      showToast('No subjects found for this branch', 'warning');
    }
  } catch (error) {
    showToast('Failed to load form data', 'error');
  }
};

const editExam = exam => {
  editingExam.value = exam;
  form.name = exam.name;
  form.exam_type_id = exam.exam_type_id;
  form.class_id = exam.class_id;
  form.section_id = exam.section_id;
  form.stream_id = exam.stream_id || '';
  form.subject_id = exam.subject_id;
  form.max_marks = exam.max_marks;
  form.weightage = exam.weightage;
  form.instructions = exam.instructions;
  showModal.value = true;
};

const viewExam = exam => {
  selectedExam.value = exam;
  showExamResults.value = true;
};

const scheduleExam = exam => {
  selectedExamForSchedule.value = exam;
  showScheduleModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingExam.value = null;
  resetForm();
};

const closeModalOnSuccess = () => {
  closeModal();
  emit('success');
};

const closeExamResults = () => {
  showExamResults.value = false;
  selectedExam.value = null;
};

const closeScheduleModal = () => {
  showScheduleModal.value = false;
  selectedExamForSchedule.value = null;
};

const handleScheduleSuccess = () => {
  emit('refresh');
  closeScheduleModal();
};

const resetForm = () => {
  form.name = '';
  form.exam_type_id = '';
  form.class_id = '';
  form.section_id = '';
  form.stream_id = '';
  form.subject_id = '';
  form.max_marks = 100;
  form.weightage = 20.0;
  form.instructions = '';
};

const saveExam = async () => {
  try {
    saving.value = true;

    // Validate required fields
    if (!form.name.trim()) {
      showToast('Exam name is required', 'error');
      return;
    }
    if (!form.exam_type_id) {
      showToast('Exam type is required', 'error');
      return;
    }
    if (!form.class_id) {
      showToast('Class is required', 'error');
      return;
    }

    // Clean form data - only include valid UUIDs and remove empty strings
    const cleanForm = {
      ...form,
      // Map max_marks to total_marks for backend compatibility
      total_marks: form.max_marks,
      // Remove max_marks as it's not expected by backend
      max_marks: undefined,
      // Only include subject_id if it's a valid UUID and not empty
      subject_id:
        form.subject_id && form.subject_id.trim() && isValidUUID(form.subject_id)
          ? form.subject_id
          : undefined,
      // Only include section_id if it's a valid UUID and not empty
      section_id:
        form.section_id && form.section_id.trim() && isValidUUID(form.section_id)
          ? form.section_id
          : undefined,
      // Only include stream_id if it's a valid UUID and not empty
      stream_id:
        form.stream_id && form.stream_id.trim() && isValidUUID(form.stream_id)
          ? form.stream_id
          : undefined
    };

    // Remove undefined values to avoid sending them to the backend
    Object.keys(cleanForm).forEach(key => {
      if (cleanForm[key] === undefined || cleanForm[key] === '') {
        delete cleanForm[key];
      }
    });

    if (editingExam.value) {
      emit('update', { ...cleanForm, id: editingExam.value.id });
    } else {
      emit('create', cleanForm);
    }

    // Don't close modal here - let the parent component handle success/error
    // closeModal() will be called from the parent when the operation succeeds
  } catch (error) {
    showToast('Failed to save exam', 'error');
  } finally {
    saving.value = false;
  }
};

const deleteExam = async examId => {
  if (confirm('Are you sure you want to delete this exam?')) {
    emit('delete', examId);
  }
};

const loadSections = async () => {
  if (!form.class_id) {
    form.section_id = '';
    form.stream_id = '';
    return;
  }
  try {
    // Load sections for the selected class
    await fetchSections({
      branchId: props.branchId,
      classId: form.class_id
    });
    form.section_id = '';

    // Load streams for the selected class
    await fetchStreams({
      branchId: props.branchId,
      classId: form.class_id
    });
    form.stream_id = '';
  } catch (error) {
    showToast('Failed to load sections and streams', 'error');
  }
};

const formatDate = date => {
  return new Date(date).toLocaleDateString('en-IN');
};

const formatStatus = status => {
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const getStatusClass = status => {
  const classes = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  };
  return classes[status] || classes.draft;
};

// Expose methods to parent component
defineExpose({
  closeModalOnSuccess
});
</script>
