<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Mark Distribution Types</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure mark distribution patterns for exams
        </p>
      </div>
      <button
        @click="openCreateModal"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <Plus class="h-4 w-4 mr-2" />
        Add Distribution
      </button>
    </div>



    <!-- Distributions Table -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div v-if="loading" class="p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading distributions...</p>
      </div>

      <div v-else-if="distributions.length === 0" class="p-8 text-center">
        <Calculator class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          No distributions found
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Get started by creating a new mark distribution
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
                Branch Name
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Distribution Name
              </th>
              <th
                class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="(distribution, index) in distributions"
              :key="distribution.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ index + 1 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ distribution.branch?.name || 'N/A' }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ distribution.name }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end space-x-2">
                  <button
                    @click="editDistribution(distribution)"
                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    <Edit class="h-4 w-4" />
                  </button>
                  <button
                    @click="handleDeleteDistribution(distribution)"
                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
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

    <!-- Pagination -->
    <Pagination
      v-if="hasData"
      :pagination="pagination"
      item-label="mark distributions"
      @page-changed="goToPage"
      @page-size-changed="changePageSize"
    />

    <!-- Create/Edit Modal -->
    <Modal :show="showModal" @close="closeModal" size="lg">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          {{ editingDistribution ? 'Edit Distribution' : 'Create New Distribution' }}
        </h3>
      </template>

      <template #body>
        <form @submit.prevent="saveDistribution" class="space-y-6">
          <!-- Only essential fields -->
          <div>
            <!-- Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                required
                placeholder="e.g., Standard Theory Exam"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
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
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="px-4 py-2 border border-transparent text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{
                saving
                  ? 'Saving...'
                  : editingDistribution
                    ? 'Update Distribution'
                    : 'Create Distribution'
              }}
            </button>
          </div>
        </form>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { Plus, Calculator, Edit, Trash2 } from 'lucide-vue-next';
import Modal from '~/components/ui/Modal.vue';
import Pagination from '~/components/ui/Pagination.vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { useToast } from '~/composables/useToast';
import { useAuth } from '~/composables/useAuth';
import { useBranches } from '~/composables/useBranches';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useMarkDistributions } from '~/composables/useMarkDistributions';

// Composables
const { showToast } = useToast();
const { user } = useAuth();
const { selectedBranchId } = useGlobalBranch();
const { branches, fetchBranches, loading: branchesLoading } = useBranches();
const {
  distributions,
  loading,
  pagination,
  hasData,
  isEmpty,
  loadMarkDistributions,
  createDistribution,
  updateDistribution,
  deleteDistribution,
  goToPage,
  changePageSize
} = useMarkDistributions();

// Reactive data
const showModal = ref(false);
const saving = ref(false);
const editingDistribution = ref(null);

// Form data - Only essential fields
const form = reactive({
  branch_id: selectedBranchId.value || '',
  name: ''
});

watch(selectedBranchId, () => {
  form.branch_id = selectedBranchId.value || '';
  loadDistributions();
});

// Computed properties

const branchOptions = computed(() =>
  branches.value.map(branch => ({
    value: branch.id,
    label: branch.name
  }))
);

// Methods
const loadDistributions = async () => {
  await loadMarkDistributions({
    school_id: user.value.school_id,
    ...(selectedBranchId.value ? { branch_id: selectedBranchId.value } : {})
  });
};

const openCreateModal = async () => {
  editingDistribution.value = null;
  resetForm();
  await fetchBranches();
  showModal.value = true;
};

const editDistribution = async distribution => {
  editingDistribution.value = distribution;
  form.branch_id = distribution.branch_id || '';
  form.name = distribution.name || '';
  await fetchBranches();
  showModal.value = true;
};

const handleDeleteDistribution = async distribution => {
  if (!confirm(`Are you sure you want to delete "${distribution.name}"?`)) {
    return;
  }

  try {
    await deleteDistribution(distribution.id);
  } catch (error) {
    // Error handling is done in the composable
  }
};

const saveDistribution = async () => {
  form.branch_id = form.branch_id || selectedBranchId.value || authStore.currentBranch?.id || branches.value?.[0]?.id || user.value?.branch_id;
  //  - Only validate essential fields
  if (!form.branch_id) {
    showToast('Branch is required', 'error');
    return;
  }
  if (!form.name.trim()) {
    showToast('Name is required', 'error');
    return;
  }

  try {
    saving.value = true;

    // Only send essential fields
    const distributionData = {
      branch_id: form.branch_id,
      name: form.name.trim()
    };

    if (editingDistribution.value) {
      await updateDistribution({ id: editingDistribution.value.id, ...distributionData });
    } else {
      await createDistribution(distributionData);
    }

    closeModal();
  } catch (error) {
    showToast(`Failed to ${editingDistribution.value ? 'update' : 'create'} distribution`, 'error');
  } finally {
    saving.value = false;
  }
};

const closeModal = () => {
  showModal.value = false;
  editingDistribution.value = null;
  resetForm();
};

const resetForm = () => {
  form.branch_id = '';
  form.name = '';
};

// Helper functions
const getTypeBadgeClass = type => {
  const classes = {
    theory_only: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    practical_only: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    theory_practical: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    comprehensive: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  };
  return `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${classes[type] || classes.theory_only}`;
};

const getTypeLabel = type => {
  const labels = {
    theory_only: 'Theory Only',
    practical_only: 'Practical Only',
    theory_practical: 'Theory + Practical',
    comprehensive: 'Comprehensive'
  };
  return labels[type] || 'Unknown';
};

// Expose methods to parent component
const loadData = async () => {
  await loadDistributions();
};

defineExpose({
  loadData
});

// Load initial data
onMounted(async () => {
  await fetchBranches();
  await loadData();
});
</script>
