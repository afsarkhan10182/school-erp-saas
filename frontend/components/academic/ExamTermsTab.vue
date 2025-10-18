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

    <!-- CodeIgniter Style - No filters, simple approach -->

    <!-- Terms Table -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div v-if="loading" class="p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading terms...</p>
      </div>

      <div v-else-if="terms.length === 0" class="p-8 text-center">
        <Calendar class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No terms found</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Get started by creating a new term
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
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Date Updated
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
              v-for="(term, index) in terms"
              :key="term.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ index + 1 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ term.branch?.name || 'N/A' }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ term.name }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-600 dark:text-gray-300">
                  {{ formatDate(term.updated_at) }}
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
          <!-- CodeIgniter Style - Only 2 fields -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Branch (CodeIgniter Style) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Branch <span class="text-red-500">*</span>
              </label>
              <EnhancedDropdown
                v-model="form.branch_id"
                :options="branchOptions"
                placeholder="Select branch"
                :loading="branchesLoading"
              />
            </div>

            <!-- Name (CodeIgniter Style) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., First Term, Second Term, Final"
              />
            </div>
          </div>

          <!-- Hidden fields (keep in data but don't show in UI) -->
          <div style="display: none">
            <input v-model="form.code" type="text" />
            <input v-model="form.description" type="text" />
            <input v-model="form.start_date" type="date" />
            <input v-model="form.end_date" type="date" />
            <input v-model="form.academic_year" type="text" />
            <input v-model="form.is_active" type="checkbox" />
            <input v-model="form.sort_order" type="number" />
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
import { ref, reactive, computed } from 'vue';
import { Plus, Edit, Trash2, Calendar } from 'lucide-vue-next';
import Modal from '~/components/ui/Modal.vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { useToast } from '~/composables/useToast';
import { useBranches } from '~/composables/useBranches';
import { termApi } from '~/api/academic/terms';

// Props
const props = defineProps({
  terms: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['refresh', 'create', 'update', 'delete', 'success']);

// Composables
const { showToast } = useToast();
const { branches, fetchBranches, loading: branchesLoading } = useBranches();

// Reactive data
const showModal = ref(false);
const saving = ref(false);
const editingTerm = ref(null);

// Form data - CodeIgniter Style: Only 2 essential fields
const form = reactive({
  branch_id: '',
  name: ''
});

// Computed properties
const branchOptions = computed(() =>
  branches.value.map(branch => ({
    value: branch.id,
    label: branch.name
  }))
);

// Methods
const openCreateModal = async () => {
  editingTerm.value = null;
  resetForm();
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
    await termApi.delete(term.id);
    showToast('Term deleted successfully', 'success');
    emit('delete', term);
  } catch (error) {
    showToast('Failed to delete term', 'error');
  }
};

const saveTerm = async () => {
  try {
    saving.value = true;

    // CodeIgniter Style - Only validate essential fields
    if (!form.branch_id) {
      showToast('Branch is required', 'error');
      return;
    }
    if (!form.name.trim()) {
      showToast('Name is required', 'error');
      return;
    }

    // CodeIgniter Style - Only send essential fields
    const termData = {
      branch_id: form.branch_id,
      name: form.name.trim()
    };

    if (editingTerm.value) {
      console.log('Updating term with ID:', editingTerm.value.id);
      console.log('Update data:', termData);
      console.log('ID type:', typeof editingTerm.value.id);
      console.log('ID stringified:', String(editingTerm.value.id));

      // Ensure ID is a string
      const termId = String(editingTerm.value.id);
      await termApi.update(termId, termData);
      showToast('Term updated successfully', 'success');
      emit('update', { ...termData, id: termId });
    } else {
      await termApi.create(termData);
      showToast('Term created successfully', 'success');
      emit('create', termData);
    }

    closeModal();
    emit('success');
  } catch (error) {
    showToast(`Failed to ${editingTerm.value ? 'update' : 'create'} term`, 'error');
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

// Format date for display
const formatDate = dateString => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// CodeIgniter Style - Simple and clean
</script>
