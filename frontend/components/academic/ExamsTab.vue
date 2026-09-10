<template>
  <div>
    <!-- Simple Header with Stats and Actions -->
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-6">
          <div class="flex items-center space-x-2">
            <BookOpen class="h-5 w-5 text-blue-600" />
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
              >{{ exams.length }} Exams</span
            >
          </div>
          <div class="flex items-center space-x-2">
            <CheckCircle class="h-5 w-5 text-green-600" />
            <span class="text-sm text-gray-600 dark:text-gray-400"
              >{{ exams.filter(e => e.is_active).length }} Active</span
            >
          </div>
        </div>
        <button
          @click="openCreateModal"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus class="h-4 w-4 mr-2" />
          New Exam
        </button>
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

    <div v-else>
      <!-- Simple Search Bar -->
      <div class="mb-6">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search exams by name..."
          class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="exam in filteredExams"
          :key="exam.id"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center justify-between mb-2">
                <h4
                  class="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                >
                  {{ exam.name }}
                </h4>
                <div class="flex flex-col space-y-1">
                  <span :class="getStatusBadgeClass('active', exam.is_active)">
                    {{ exam.is_active ? 'Active' : 'Inactive' }}
                  </span>
                  <span :class="getStatusBadgeClass('published', exam.publish_status)">
                    {{ exam.publish_status ? 'Published' : 'Draft' }}
                  </span>
                  <span :class="getStatusBadgeClass('results', exam.result_status)">
                    {{ exam.result_status ? 'Results Published' : 'Results Hidden' }}
                  </span>
                </div>
              </div>
              <div
                class="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400"
              >
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

              <!-- Mark Distribution and Remarks -->
              <div
                v-if="exam.mark_distribution_ids?.length > 0 || exam.instructions"
                class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600"
              >
                <div v-if="exam.mark_distribution_ids?.length > 0" class="mb-2">
                  <span class="text-xs font-medium text-gray-600 dark:text-gray-400"
                    >Mark Distribution:</span
                  >
                  <span class="text-xs text-gray-500 dark:text-gray-400 ml-1">
                    {{ getMarkDistributionNames(exam.mark_distribution_ids) }}
                  </span>
                </div>
                <div v-if="exam.instructions" class="mb-1">
                  <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Remarks:</span>
                  <span
                    class="text-xs text-gray-500 dark:text-gray-400 ml-1 truncate block"
                    :title="exam.instructions"
                  >
                    {{ exam.instructions }}
                  </span>
                </div>
              </div>
              <div
                class="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400"
              >
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
              <!-- Action Buttons Based on Status -->
              <div class="mt-3 flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <!-- Status-based action buttons -->
                  <button
                    v-if="exam.status === 'draft'"
                    @click="scheduleExam(exam)"
                    class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Calendar class="w-3 h-3 mr-1" />
                    Schedule
                  </button>

                  <button
                    v-if="exam.status === 'scheduled'"
                    @click="enterMarks(exam)"
                    class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <Users class="w-3 h-3 mr-1" />
                    Enter Marks
                  </button>

                  <button
                    v-if="exam.status === 'marks_entered'"
                    @click="calculateGrades(exam)"
                    class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    <Award class="w-3 h-3 mr-1" />
                    Calculate Grades
                  </button>

                  <button
                    v-if="exam.status === 'grades_calculated'"
                    @click="generateReports(exam)"
                    class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    <FileText class="w-3 h-3 mr-1" />
                    Generate Reports
                  </button>

                  <button
                    v-if="exam.status === 'completed'"
                    @click="viewAll(exam)"
                    class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    <Eye class="w-3 h-3 mr-1" />
                    View All
                  </button>
                </div>

                <div class="flex items-center space-x-2">
                  <button
                    @click="editExam(exam)"
                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                    title="Edit Exam"
                  >
                    <Edit class="w-4 h-4" />
                  </button>
                  <button
                    @click="viewExam(exam)"
                    class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    title="View Details"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <button
                    @click="deleteExam(exam.id)"
                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    title="Delete Exam"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
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
          <!--  - Only 6 fields -->
          <!-- Only essential fields -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Name -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Mid Term Exam"
              />
            </div>

            <!-- Term () -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Term <span class="text-red-500">*</span>
              </label>
              <EnhancedDropdown
                v-model="form.term_id"
                :options="termOptions"
                placeholder="Select term"
                :loading="termsLoading"
              />
            </div>

            <!-- Exam Type (Hardcoded) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Exam Type <span class="text-red-500">*</span>
              </label>
              <EnhancedDropdown
                v-model="form.type_id"
                :options="examTypeOptions"
                placeholder="Select exam type"
              />
            </div>

            <!-- Mark Distribution () -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mark Distribution <span class="text-red-500">*</span>
              </label>
              <EnhancedDropdown
                v-model="form.mark_distribution_id"
                :options="markDistributionOptions"
                placeholder="Select mark distribution"
                :loading="markDistributionsLoading"
              />
            </div>

            <!-- Remarks () -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Remarks
              </label>
              <textarea
                v-model="form.remarks"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter any remarks..."
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { navigateTo } from '#app';
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
  Users,
  Award,
  FileText,
  Building2
} from 'lucide-vue-next';
import Modal from '~/components/ui/Modal.vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { useToast } from '~/composables/useToast';
import { useAcademics } from '~/composables/useAcademics';
import { useExamOptions } from '~/composables/useExamOptions';
import { useBranches } from '~/composables/useBranches';
import { useMarkDistributions } from '~/composables/useMarkDistributions';
import { useAuth } from '~/composables/useAuth';
import { examTermApi } from '~/api/academic/exam-terms';

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
  currentAcademicYear,
  fetchAcademicYears,
  fetchClasses,
  fetchSections,
  fetchSubjects,
  fetchStreams
} = useAcademics();
// Hardcoded exam types - no need for API calls
import { getExamTypeOptions, getExamTypeLabel } from '~/utils/exam-types';

const examTypeOptions = getExamTypeOptions();
const { branches, fetchBranches, loading: branchesLoading } = useBranches();
const {
  markDistributions,
  fetchMarkDistributions,
  loading: markDistributionsLoading
} = useMarkDistributions();
const { user } = useAuth();

// Terms data
const terms = ref([]);
const termsLoading = ref(false);
const termOptions = computed(() =>
  terms.value.map(term => ({
    value: term.id,
    label: `${term.name} (${term.code})`,
    description: term.description
  }))
);

// Branch options
const branchOptions = computed(() =>
  branches.value.map(branch => ({
    value: branch.id,
    label: branch.name
  }))
);

// Mark distribution options
const markDistributionOptions = computed(() =>
  markDistributions.value.map(distribution => ({
    value: distribution.id,
    label: distribution.name
  }))
);

// Helper function to validate UUID
const isValidUUID = uuid => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Reactive data
const showModal = ref(false);
const searchQuery = ref('');
const statusFilter = ref('');
const classFilter = ref('');
const saving = ref(false);
const editingExam = ref(null);

// Use the branch context from props
const currentBranchId = computed(() => {
  return props.branchId || user.value?.branch_id;
});

// Computed properties
const filteredExams = computed(() => {
  let filtered = props.exams;

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      exam =>
        exam.name.toLowerCase().includes(query) ||
        exam.subject?.name?.toLowerCase().includes(query) ||
        exam.class?.name?.toLowerCase().includes(query)
    );
  }

  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter(exam => exam.status === statusFilter.value);
  }

  // Class filter
  if (classFilter.value) {
    filtered = filtered.filter(exam => exam.class_id === classFilter.value);
  }

  return filtered;
});

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
  branch_id: '',
  name: '',
  term_id: '',
  type_id: '',
  mark_distribution_id: '',
  remarks: ''
});

// Methods
const loadTerms = async () => {
  try {
    termsLoading.value = true;
    const response = await examTermApi.getAll({
      school_id: props.schoolId,
      branch_id: props.branchId,
      academic_year: currentAcademicYear.value?.name,
      is_active: true
    });
    terms.value = response.data || [];
  } catch (error) {
    console.error('Error loading terms:', error);
    showToast('Failed to load terms', 'error');
  } finally {
    termsLoading.value = false;
  }
};

const openCreateModal = async () => {
  editingExam.value = null;
  resetForm();

  // Only load data if not already loaded
  const loadPromises = [];
  if (branches.value.length === 0) {
    loadPromises.push(fetchBranches());
  }
  if (terms.value.length === 0) {
    loadPromises.push(loadTerms());
  }
  if (markDistributions.value.length === 0) {
    loadPromises.push(fetchMarkDistributions());
  }

  if (loadPromises.length > 0) {
    try {
      await Promise.all(loadPromises);
    } catch (error) {
      showToast('Failed to load form data', 'error');
    }
  }

  form.branch_id = currentBranchId.value || '';
  showModal.value = true;
};

const editExam = async exam => {
  // Reset form first to ensure clean state
  resetForm();

  editingExam.value = exam;

  // Only load data if not already loaded
  const loadPromises = [];
  if (branches.value.length === 0) {
    loadPromises.push(fetchBranches());
  }
  if (terms.value.length === 0) {
    loadPromises.push(loadTerms());
  }
  if (markDistributions.value.length === 0) {
    loadPromises.push(fetchMarkDistributions());
  }

  if (loadPromises.length > 0) {
    await Promise.all(loadPromises);
  }

  // Then populate form fields
  form.branch_id = exam.branch_id || '';
  form.name = exam.name || '';
  form.term_id = exam.term_id || '';
  // Fix: Use exam_type_id from API response, fallback to type_id for backward compatibility
  form.type_id = exam.exam_type_id || exam.type_id || '';
  // Handle mark distribution field - convert array to single ID if needed
  if (
    exam.mark_distribution_ids &&
    Array.isArray(exam.mark_distribution_ids) &&
    exam.mark_distribution_ids.length > 0
  ) {
    form.mark_distribution_id = exam.mark_distribution_ids[0];
  } else {
    form.mark_distribution_id = exam.mark_distribution_id || '';
  }
  form.remarks = exam.instructions || exam.remarks || exam.description || '';

  showModal.value = true;
};

const viewExam = exam => {
  // Navigate to exam details page instead of showing results
  navigateTo(`/exams/${exam.id}`);
};

const scheduleExam = exam => {
  navigateTo('/exams/schedules/create');
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

const resetForm = () => {
  form.branch_id = '';
  form.name = '';
  form.term_id = '';
  form.type_id = '';
  form.mark_distribution_id = '';
  form.remarks = '';
};

const saveExam = async () => {
  try {
    saving.value = true;
    form.branch_id = form.branch_id || selectedBranchId.value || authStore.currentBranch?.id || branches.value?.[0]?.id || user.value?.branch_id;

    // Only validate essential fields
    if (!form.branch_id) {
      showToast('Branch is required', 'error');
      return;
    }
    if (!form.name || !form.name.trim()) {
      showToast('Name is required', 'error');
      return;
    }
    if (!form.term_id) {
      showToast('Term is required', 'error');
      return;
    }
    if (!form.type_id) {
      showToast('Exam type is required', 'error');
      return;
    }
    if (!form.mark_distribution_id) {
      showToast('Mark distribution is required', 'error');
      return;
    }

    // Prepare form data for backend
    const cleanForm = {
      branch_id: form.branch_id,
      name: form.name?.trim() || '',
      exam_type_id: form.type_id, // Fixed: backend expects exam_type_id
      term_id: form.term_id, // Added: missing term_id
      mark_distribution_id: form.mark_distribution_id, // Added: missing mark_distribution_id
      description: form.remarks || '',
      school_id: props.schoolId
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

// Helper functions for status display
const getStatusBadgeClass = (type, value) => {
  const classes = {
    active: {
      true: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      false: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    },
    published: {
      true: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      false: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    },
    results: {
      true: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      false: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  };
  return `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${classes[type][value] || classes[type].false}`;
};

const getMarkDistributionNames = markDistributionIds => {
  console.log('ExamsTab getMarkDistributionNames called with:', markDistributionIds);
  console.log('ExamsTab Available mark distributions:', markDistributions.value);
  console.log('ExamsTab Mark distributions count:', markDistributions.value.length);

  if (
    !markDistributionIds ||
    !Array.isArray(markDistributionIds) ||
    markDistributionIds.length === 0
  ) {
    console.log('ExamsTab No mark distribution IDs provided');
    return 'No distribution';
  }

  // Find matching mark distributions
  const matchingDistributions = markDistributions.value.filter(dist =>
    markDistributionIds.includes(dist.id)
  );

  console.log('ExamsTab Matching distributions:', matchingDistributions);
  console.log('ExamsTab Mark distribution IDs to match:', markDistributionIds);
  console.log(
    'ExamsTab Available distribution IDs:',
    markDistributions.value.map(d => d.id)
  );

  if (matchingDistributions.length === 0) {
    console.log('ExamsTab No matching distributions found');
    return 'Unknown distribution';
  }

  const result = matchingDistributions.map(dist => dist.name).join(', ');
  console.log('ExamsTab Final result:', result);
  return result;
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

// New action methods for exam workflow
const enterMarks = exam => {
  navigateTo(`/exams/${exam.id}/marks`);
};

const calculateGrades = exam => {
  navigateTo(`/exams/${exam.id}/results`);
};

const generateReports = exam => {
  navigateTo(`/exams/${exam.id}/reports`);
};

const viewAll = exam => {
  navigateTo(`/exams/${exam.id}/results`);
};

const clearFilters = () => {
  searchQuery.value = '';
  statusFilter.value = '';
  classFilter.value = '';
};

// Load academic years on mount to get current academic year
onMounted(async () => {
  try {
    await fetchAcademicYears();
  } catch (error) {
    // Silent fail
  }
});

// Expose methods to parent component
defineExpose({
  closeModalOnSuccess
});
</script>
