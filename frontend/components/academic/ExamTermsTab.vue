<template>
  <div class="space-y-6">
    <!-- Header with Actions -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Exam Terms</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Manage exam periods within the school year
        </p>
      </div>
      <button
        @click="openCreateModal"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Plus class="h-4 w-4 mr-2" />
        Add Term
      </button>
    </div>

    <!-- Terms Table -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div v-if="loading" class="p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading terms...</p>
      </div>

      <div v-else-if="isEmpty" class="p-8 text-center">
        <Calendar class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No exam terms found</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Get started by creating a new exam term
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
                Term Name
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
              v-for="(term, index) in terms"
              :key="term.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ index + 1 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ term.branch?.name || term.branch_name || 'N/A' }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ term.name || term.term_name || 'N/A' }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end space-x-2">
                  <button
                    @click="editTerm(term)"
                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    <Edit class="h-4 w-4" />
                  </button>
                  <button
                    @click="deleteTerm(term)"
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

      <!-- Pagination -->
      <Pagination
        v-if="hasData"
        :pagination="pagination"
        item-label="exam terms"
        @page-changed="goToPage"
        @page-size-changed="changePageSize"
      />
    </div>

    <!-- Create/Edit Modal -->
    <Modal :show="showModal" @close="closeModal" size="lg">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          {{ editingTerm ? 'Edit Exam Term' : 'Create New Exam Term' }}
        </h3>
      </template>

      <template #body>
        <form @submit.prevent="saveTerm" class="space-y-6">
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
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g. Term 1, Mid Term"
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
              {{ saving ? 'Saving...' : editingTerm ? 'Update Exam Term' : 'Create Exam Term' }}
            </button>
          </div>
        </form>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { Plus, Edit, Trash2, Calendar } from 'lucide-vue-next';
import Modal from '~/components/ui/Modal.vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { useToast } from '~/composables/useToast';
import { useBranches } from '~/composables/useBranches';
import { useExamTerms } from '~/composables/useExamTerms';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import Pagination from '~/components/ui/Pagination.vue';

// Props - No longer needed since we manage our own data
const props = defineProps({});

// Emits
const emit = defineEmits(['refresh', 'create', 'update', 'delete', 'success']);

// Composables
const { showToast } = useToast();
const { branches, fetchBranches, loading: branchesLoading } = useBranches();
const { selectedBranchId } = useGlobalBranch();
const {
  examTerms: terms,
  loading,
  pagination,
  hasData,
  isEmpty,
  fetchExamTerms,
  createExamTerm,
  updateExamTerm,
  deleteExamTerm,
  goToPage,
  changePageSize
} = useExamTerms();

// Reactive data
const showModal = ref(false);
const saving = ref(false);
const editingTerm = ref(null);

// Form data: Only 2 essential fields
const form = reactive({
  branch_id: selectedBranchId.value || '',
  name: ''
});

watch(selectedBranchId, () => {
  loadData();
});

// Computed properties

// Methods
const loadData = async () => {
  await fetchExamTerms(selectedBranchId.value ? { branch_id: selectedBranchId.value } : {});
};

const openCreateModal = async () => {
  editingTerm.value = null;
  resetForm();
  form.branch_id = selectedBranchId.value || '';
  await fetchBranches();
  showModal.value = true;
};

const editTerm = async term => {
  console.log('Edit term called with:', term);
  console.log('Term ID:', term.id, 'Type:', typeof term.id);

  editingTerm.value = term;
  form.branch_id = term.branch_id || '';
  form.name = term.name || '';

  await fetchBranches();
  showModal.value = true;
};

const deleteTerm = async term => {
  if (!confirm(`Are you sure you want to delete the term "${term.name}"?`)) {
    return;
  }

  try {
    await deleteExamTerm(term.id);
    emit('delete', term);
  } catch (error) {
    // Error handling is done in the composable
  }
};

const saveTerm = async () => {
  try {
    saving.value = true;
    form.branch_id =
      form.branch_id ||
      selectedBranchId.value ||
      authStore.currentBranch?.id ||
      branches.value?.[0]?.id ||
      user.value?.branch_id;

    // Only validate essential fields
    if (!form.branch_id) {
      showToast('Branch is required', 'error');
      return;
    }
    if (!form.name.trim()) {
      showToast('Name is required', 'error');
      return;
    }

    // Only send essential fields
    const termData = {
      branch_id: form.branch_id,
      name: form.name.trim()
    };

    if (editingTerm.value) {
      const termId = String(editingTerm.value.id);
      await updateExamTerm(termId, termData);
      emit('update', { ...termData, id: termId });
      closeModal();
      emit('success');
    } else {
      await createExamTerm(termData);
      emit('create', termData);
      closeModal();
      emit('success');
    }
  } catch (error) {
    // Don't show a generic error message here - let the composable handle it
    console.error('Error in saveTerm:', error);
    // The composable will show the proper error message
  } finally {
    saving.value = false;
  }
};

const closeModal = () => {
  showModal.value = false;
  editingTerm.value = null;
  resetForm();
};

const resetForm = () => {
  form.branch_id = '';
  form.name = '';
};

// Expose methods to parent component
defineExpose({
  loadData
});

// Load data on mount
onMounted(async () => {
  await fetchBranches();
  if (branches.value.length === 1) selectedBranchId.value = branches.value[0].id;
  await loadData();
});

// Simple and clean
</script>
