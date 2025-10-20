<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Exam Management</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Create, manage, and track all exams
          </p>
        </div>
        <div class="mt-4 sm:mt-0">
          <button
            @click="openCreateModal"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus class="h-4 w-4 mr-2" />
            Create Exam
          </button>
        </div>
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
                    {{ exams.length }}
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
                    Active Exams
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ exams.filter(e => e.is_active).length }}
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
                <Globe class="h-6 w-6 text-purple-600" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Published
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ exams.filter(e => e.publish_status).length }}
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
                <BarChart3 class="h-6 w-6 text-orange-600" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Results Published
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ exams.filter(e => e.result_status).length }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Search -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search exams..."
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <!-- Exam Type Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Exam Type
            </label>
            <EnhancedDropdown
              v-model="selectedExamTypeId"
              :options="examTypeOptions"
              placeholder="All types"
              @change="onExamTypeChange"
            />
          </div>

          <!-- Term Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Term
            </label>
            <EnhancedDropdown
              v-model="selectedTermId"
              :options="termOptions"
              placeholder="All terms"
              :loading="termsLoading"
              @change="onTermChange"
            />
          </div>

          <!-- Status Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              v-model="statusFilter"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="published">Published</option>
              <option value="results_published">Results Published</option>
            </select>
          </div>
        </div>

        <div class="flex justify-end mt-4">
          <button
            @click="clearFilters"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <!-- Exams Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div v-if="loading" class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading exams...</p>
        </div>

        <div v-else-if="filteredExams.length === 0" class="p-8 text-center">
          <BookOpen class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No exams found</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating a new exam
          </p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  #
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Exam Name
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Term
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Exam Type
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Status
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
                v-for="(exam, index) in filteredExams"
                :key="exam.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ index + 1 }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ exam.name }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {{ exam.term?.name || 'No term' }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {{ getExamTypeLabel(exam.type_id) }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
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
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end space-x-2">
                    <button
                      @click="editExam(exam)"
                      class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      title="Edit Exam"
                    >
                      <Edit class="h-4 w-4" />
                    </button>
                    <button
                      @click="viewExam(exam)"
                      class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      title="View Details"
                    >
                      <Eye class="h-4 w-4" />
                    </button>
                    <button
                      @click="deleteExam(exam)"
                      class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      title="Delete Exam"
                    >
                      <Trash2 class="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
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
            <!--  - Exactly 6 fields as per specification -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Branch (conditional) -->
              <div v-if="showBranchDropdown">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Branch <span class="text-red-500">*</span>
                </label>
                <EnhancedDropdown
                  v-model="form.branch_id"
                  :options="branchOptions"
                  placeholder="Select branch"
                  :loading="branchesLoading"
                  @change="onBranchChange"
                />
              </div>

              <!-- Auto-selected branch info (when single branch) -->
              <div v-else-if="selectedBranch">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Branch
                </label>
                <div
                  class="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm text-gray-900 dark:text-white"
                >
                  {{ selectedBranch.name }}
                </div>
              </div>

              <!-- Name () -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  placeholder="e.g., Mid Term Exam"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
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

              <!-- Mark Distribution (Multi-select) -->
              <div>
                <EnhancedMultiSelect
                  v-model="form.mark_distribution_ids"
                  :options="markDistributionOptions"
                  placeholder="Select"
                  :loading="markDistributionsLoading"
                  label="Mark Distribution"
                  required
                />
              </div>

              <!-- Remarks () -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Remarks
                </label>
                <input
                  v-model="form.remarks"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter exam remarks..."
                />
              </div>
            </div>

            <!-- Form Actions -->
            <div
              class="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700"
            >
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 border border-transparent text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ saving ? 'Saving...' : editingExam ? 'Update Exam' : 'Create Exam' }}
              </button>
            </div>
          </form>
        </template>
      </Modal>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { Plus, BookOpen, CheckCircle, Globe, BarChart3, Edit, Eye, Trash2 } from 'lucide-vue-next';
import Modal from '~/components/ui/Modal.vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import EnhancedMultiSelect from '~/components/ui/EnhancedMultiSelect.vue';
import { useToast } from '~/composables/useToast';
import { useAuth } from '~/composables/useAuth';
import { useBranches } from '~/composables/useBranches';
import { useExams } from '~/composables/useExams';
import { examTermApi } from '~/api/academic/exam-terms';
import { markDistributionApi } from '~/api/academic/mark-distributions';

// Composables
const { showToast } = useToast();
const { user } = useAuth();
const { branches, fetchBranches, loading: branchesLoading } = useBranches();
const {
  exams,
  examOptions,
  examsLoading,
  loadExams,
  createExam,
  updateExam,
  deleteExam: deleteExamApi
} = useExams();
// Hardcoded exam types - no need for API calls
import { EXAM_TYPES, getExamTypeOptions, getExamTypeLabel } from '~/utils/exam-types';

const examTypeOptions = getExamTypeOptions();

// Reactive data
const loading = ref(false);
const showModal = ref(false);
const saving = ref(false);
const editingExam = ref(null);

// Filters
const searchQuery = ref('');
const selectedExamTypeId = ref('');
const selectedTermId = ref('');
const statusFilter = ref('');

// Terms data
const terms = ref([]);
const termsLoading = ref(false);

// Mark Distributions data
const markDistributions = ref([]);
const markDistributionsLoading = ref(false);

// Branch options
const branchOptions = computed(() =>
  branches.value.map(branch => ({
    value: branch.id,
    label: branch.name
  }))
);

// Branch logic for conditional display
const showBranchDropdown = computed(() => {
  return branches.value.length > 1;
});

const selectedBranch = computed(() => {
  if (branches.value.length === 1) {
    return branches.value[0];
  }
  if (form.branch_id && branches.value.length > 1) {
    return branches.value.find(branch => branch.id === form.branch_id);
  }
  return null;
});

// Filtered terms and mark distributions based on selected branch
const filteredTerms = computed(() => {
  if (!form.branch_id) return terms.value;
  return terms.value.filter(term => term.branch_id === form.branch_id);
});

const filteredMarkDistributions = computed(() => {
  if (!form.branch_id) return markDistributions.value;
  return markDistributions.value.filter(dist => dist.branch_id === form.branch_id);
});

// Update term and mark distribution options based on filtered data
const termOptions = computed(() =>
  filteredTerms.value.map(term => ({
    value: term.id,
    label: term.name
  }))
);

const markDistributionOptions = computed(() => {
  return filteredMarkDistributions.value.map(distribution => ({
    value: distribution.id,
    label: distribution.name
  }));
});

// Form data
const form = reactive({
  branch_id: '',
  name: '',
  term_id: '',
  type_id: '',
  mark_distribution_ids: [],
  remarks: ''
});

// Computed properties
const filteredExams = computed(() => {
  let filtered = exams.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      exam =>
        exam.name.toLowerCase().includes(query) || exam.description?.toLowerCase().includes(query)
    );
  }

  if (selectedExamTypeId.value) {
    filtered = filtered.filter(exam => exam.type_id === selectedExamTypeId.value);
  }

  if (selectedTermId.value) {
    filtered = filtered.filter(exam => exam.term_id === selectedTermId.value);
  }

  if (statusFilter.value) {
    switch (statusFilter.value) {
      case 'active':
        filtered = filtered.filter(exam => exam.is_active);
        break;
      case 'inactive':
        filtered = filtered.filter(exam => !exam.is_active);
        break;
      case 'published':
        filtered = filtered.filter(exam => exam.publish_status);
        break;
      case 'results_published':
        filtered = filtered.filter(exam => exam.result_status);
        break;
    }
  }

  return filtered;
});

// Methods
const loadTerms = async () => {
  try {
    termsLoading.value = true;
    const response = await examTermApi.getAll({
      is_active: true
    });
    terms.value = response.data?.terms || [];
  } catch (error) {
    showToast('Failed to load terms', 'error');
  } finally {
    termsLoading.value = false;
  }
};

const loadMarkDistributions = async () => {
  try {
    markDistributionsLoading.value = true;
    console.log('Loading mark distributions...');
    const response = await markDistributionApi.getAll({
      is_active: true
    });
    console.log('Mark distributions response:', response);
    markDistributions.value = response.data?.distributions || [];
    console.log('Mark distributions loaded:', markDistributions.value);
  } catch (error) {
    console.error('Error loading mark distributions:', error);
    showToast('Failed to load mark distributions', 'error');
  } finally {
    markDistributionsLoading.value = false;
  }
};

const openCreateModal = async () => {
  editingExam.value = null;
  resetForm();
  await Promise.all([fetchBranches(), loadTerms(), loadMarkDistributions()]);

  // Auto-select branch if user has only one branch
  if (branches.value.length === 1) {
    form.branch_id = branches.value[0].id;
    // Load filtered data for the single branch
    await loadFilteredData();
  }

  showModal.value = true;
};

// Handle branch change and filter data accordingly
const onBranchChange = async branchId => {
  form.branch_id = branchId;
  // Clear dependent fields when branch changes
  form.term_id = '';
  form.mark_distribution_ids = [];
  // Load filtered data for the selected branch
  await loadFilteredData();
};

// Load filtered terms and mark distributions based on selected branch
const loadFilteredData = async () => {
  if (!form.branch_id) return;

  try {
    // Load terms for the selected branch
    const termsResponse = await examTermApi.getAll({
      is_active: true,
      branch_id: form.branch_id
    });
    terms.value = termsResponse.data?.terms || [];

    // Load mark distributions for the selected branch
    const distributionsResponse = await markDistributionApi.getAll({
      is_active: true,
      branch_id: form.branch_id
    });
    markDistributions.value = distributionsResponse.data?.distributions || [];
  } catch (error) {
    console.error('Error loading filtered data:', error);
    showToast('Failed to load data for selected branch', 'error');
  }
};

const editExam = async exam => {
  editingExam.value = exam;
  form.branch_id = exam.branch_id || '';
  form.name = exam.name || '';
  form.term_id = exam.term_id || '';
  form.type_id = exam.type_id || '';
  form.mark_distribution_ids = exam.mark_distribution_ids || [];
  form.remarks = exam.remarks || '';

  await Promise.all([fetchBranches(), loadTerms(), loadMarkDistributions()]);

  // Load filtered data for the exam's branch
  if (form.branch_id) {
    await loadFilteredData();
  }

  showModal.value = true;
};

const viewExam = exam => {
  // TODO: Implement exam details view
  showToast('Exam details view coming soon', 'info');
};

const deleteExam = async exam => {
  if (!confirm(`Are you sure you want to delete "${exam.name}"?`)) {
    return;
  }

  try {
    await deleteExamApi(exam.id);
    showToast('Exam deleted successfully', 'success');
    await loadExams();
  } catch (error) {
    showToast('Failed to delete exam', 'error');
  }
};

const saveExam = async () => {
  //  - Only validate essential fields
  if (!form.branch_id) {
    showToast('Branch is required', 'error');
    return;
  }
  if (!form.name.trim()) {
    showToast('Name is required', 'error');
    return;
  }
  if (!form.type_id) {
    showToast('Exam type is required', 'error');
    return;
  }
  if (!form.term_id) {
    showToast('Term is required', 'error');
    return;
  }
  if (!form.academic_year.trim()) {
    showToast('Academic Year is required', 'error');
    return;
  }

  try {
    saving.value = true;

    // Prepare form data for backend
    const examData = {
      branch_id: form.branch_id,
      name: form.name.trim(),
      term_id: form.term_id,
      type_id: form.type_id,
      mark_distribution_ids: form.mark_distribution_ids,
      remarks: form.remarks || '',
      school_id: user.value.school_id
    };

    if (editingExam.value) {
      await updateExam(editingExam.value.id, examData);
      showToast('Exam updated successfully', 'success');
    } else {
      await createExam(examData);
      showToast('Exam created successfully', 'success');
    }

    closeModal();
    await loadExams();
  } catch (error) {
    showToast(`Failed to ${editingExam.value ? 'update' : 'create'} exam`, 'error');
  } finally {
    saving.value = false;
  }
};

const closeModal = () => {
  showModal.value = false;
  editingExam.value = null;
  resetForm();
};

const resetForm = () => {
  form.branch_id = '';
  form.name = '';
  form.term_id = '';
  form.type_id = '';
  form.mark_distribution_ids = [];
  form.remarks = '';
};

const clearFilters = () => {
  searchQuery.value = '';
  selectedExamTypeId.value = '';
  selectedTermId.value = '';
  statusFilter.value = '';
};

const onExamTypeChange = () => {
  // Handle exam type change if needed
};

const onTermChange = () => {
  // Handle term change if needed
};

// Helper functions
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

// Load initial data
onMounted(async () => {
  await Promise.all([loadExams(), loadTerms()]);
});
</script>
