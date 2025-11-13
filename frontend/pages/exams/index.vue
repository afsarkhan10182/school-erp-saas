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

      <!-- Filters -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 mb-6"
      >
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-2">
              <Filter class="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
            </div>
            <button
              @click="clearFilters"
              class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
            >
              <X class="h-4 w-4 mr-1" />
              Clear All
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Search -->
            <div class="space-y-2">
              <label class="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                <Search class="h-4 w-4 mr-2 text-gray-500" />
                Search Exams
              </label>
              <div class="relative">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search by name, description..."
                  class="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                />
                <Search
                  class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                />
              </div>
            </div>

            <!-- Exam Type Filter -->
            <div class="space-y-2">
              <label class="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                <BookOpen class="h-4 w-4 mr-2 text-gray-500" />
                Exam Type
              </label>
              <div class="relative">
                <EnhancedDropdown
                  v-model="selectedExamTypeId"
                  :options="examTypeOptions"
                  placeholder="All types"
                  @change="onExamTypeChange"
                />
              </div>
            </div>

            <!-- Term Filter -->
            <div class="space-y-2">
              <label class="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                <Calendar class="h-4 w-4 mr-2 text-gray-500" />
                Term
              </label>
              <div class="relative">
                <EnhancedDropdown
                  v-model="selectedTermId"
                  :options="termOptions"
                  placeholder="All terms"
                  :loading="termsLoading"
                  @change="onTermChange"
                />
              </div>
            </div>

            <!-- Status Filter -->
            <div class="space-y-2">
              <label class="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                <Activity class="h-4 w-4 mr-2 text-gray-500" />
                Status
              </label>
              <div class="relative">
                <select
                  v-model="statusFilter"
                  class="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="published">Published</option>
                  <option value="results_published">Results Published</option>
                </select>
                <ChevronDown
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none transition-colors duration-200"
                />
              </div>
            </div>
          </div>
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
                  Branch
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
                  Mark Distribution
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Remarks
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
                    {{ exam.branch?.name || 'No branch' }}
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
                  <div class="text-sm text-gray-900 dark:text-white">
                    {{ getMarkDistributionNames(exam.mark_distribution_ids) }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div
                    class="text-sm text-gray-900 dark:text-white max-w-xs truncate"
                    :title="exam.instructions"
                  >
                    {{ exam.instructions || 'No remarks' }}
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
import {
  Plus,
  Edit,
  Eye,
  Trash2,
  Filter,
  X,
  Search,
  BookOpen,
  Calendar,
  Activity,
  ChevronDown
} from 'lucide-vue-next';
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
        filtered = filtered.filter(exam => exam.is_active === true);
        break;
      case 'inactive':
        filtered = filtered.filter(exam => exam.is_active === false);
        break;
      case 'published':
        filtered = filtered.filter(exam => exam.publish_status === true);
        break;
      case 'results_published':
        filtered = filtered.filter(exam => exam.result_status === true);
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
      is_active: true,
      school_id: user.value.school_id
      // Don't filter by branch_id - load all distributions for the school
    });
    console.log('Mark distributions response:', response);
    markDistributions.value = response.data?.distributions || [];
    console.log('Mark distributions loaded:', markDistributions.value);
    console.log(
      'Mark distribution IDs in exams:',
      exams.value.map(exam => ({
        name: exam.name,
        mark_distribution_ids: exam.mark_distribution_ids
      }))
    );
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

  // Only load data if not already loaded
  const loadPromises = [];
  if (branches.value.length === 0) {
    loadPromises.push(fetchBranches());
  }
  if (terms.value.length === 0) {
    loadPromises.push(loadTerms());
  }
  if (markDistributions.value.length === 0) {
    loadPromises.push(loadMarkDistributions());
  }

  if (loadPromises.length > 0) {
    await Promise.all(loadPromises);
  }

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
  console.log('Edit exam data:', exam); // Debug: Log the exam object to see available fields

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
    loadPromises.push(loadMarkDistributions());
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

  // Debug: Check what mark distribution fields are available
  console.log('Mark distribution fields:', {
    mark_distribution_ids: exam.mark_distribution_ids,
    mark_distribution_id: exam.mark_distribution_id,
    mark_distributions: exam.mark_distributions
  });

  // Handle mark distribution field - convert single ID to array if needed
  let markDistributionIds = [];
  if (exam.mark_distribution_ids) {
    markDistributionIds = Array.isArray(exam.mark_distribution_ids)
      ? exam.mark_distribution_ids
      : [exam.mark_distribution_ids];
  } else if (exam.mark_distribution_id) {
    markDistributionIds = [exam.mark_distribution_id];
  } else if (exam.mark_distributions) {
    markDistributionIds = Array.isArray(exam.mark_distributions)
      ? exam.mark_distributions
      : [exam.mark_distributions];
  }

  form.mark_distribution_ids = markDistributionIds;
  form.remarks = exam.instructions || exam.remarks || exam.description || '';

  // Load filtered data for the exam's branch AFTER form is populated
  if (form.branch_id) {
    await loadFilteredData();
  }

  // Debug: Log the final form state
  console.log('Final form state:', {
    mark_distribution_ids: form.mark_distribution_ids,
    remarks: form.remarks,
    markDistributions: markDistributions.value.length
  });

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
  if (!form.name || !form.name.trim()) {
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
  if (!form.mark_distribution_ids || form.mark_distribution_ids.length === 0) {
    showToast('Mark distribution is required', 'error');
    return;
  }

  try {
    saving.value = true;

    // Prepare form data for backend
    const examData = {
      branch_id: form.branch_id,
      name: form.name?.trim() || '',
      exam_type_id: form.type_id, // Fixed: backend expects exam_type_id
      term_id: form.term_id, // Added: missing term_id
      mark_distribution_ids: form.mark_distribution_ids, // Added: missing mark_distribution_ids
      description: form.remarks || '',
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

const getMarkDistributionNames = markDistributionIds => {
  console.log('getMarkDistributionNames called with:', markDistributionIds);
  console.log('Available mark distributions:', markDistributions.value);
  console.log('Mark distributions count:', markDistributions.value.length);

  if (
    !markDistributionIds ||
    !Array.isArray(markDistributionIds) ||
    markDistributionIds.length === 0
  ) {
    console.log('No mark distribution IDs provided');
    return 'No distribution';
  }

  // Find matching mark distributions
  const matchingDistributions = markDistributions.value.filter(dist =>
    markDistributionIds.includes(dist.id)
  );

  console.log('Matching distributions:', matchingDistributions);
  console.log('Mark distribution IDs to match:', markDistributionIds);
  console.log(
    'Available distribution IDs:',
    markDistributions.value.map(d => d.id)
  );

  if (matchingDistributions.length === 0) {
    console.log('No matching distributions found');
    return 'Unknown distribution';
  }

  const result = matchingDistributions.map(dist => dist.name).join(', ');
  console.log('Final result:', result);
  return result;
};

const getBranchName = branchId => {
  if (!branchId) return 'No branch';
  const branch = branches.value.find(b => b.id === branchId);
  return branch ? branch.name : 'Unknown branch';
};

// Load initial data
onMounted(async () => {
  // Load mark distributions first, then exams
  await loadMarkDistributions();
  await Promise.all([loadExams(), loadTerms()]);
});
</script>
