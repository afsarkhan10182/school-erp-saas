<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Grading Systems</h2>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage grading systems for your school
        </p>
      </div>
      <button
        @click="openCreateModal"
        class="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <Plus class="w-4 h-4 mr-2" />
        Add Grading System
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <div class="animate-pulse">
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="i in 6" :key="i" class="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="gradingSystems.length === 0" class="text-center py-12">
      <div class="mx-auto h-12 w-12 text-gray-400">
        <BarChart3 class="w-full h-full" />
      </div>
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No grading systems</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Get started by creating your first grading system.
      </p>
      <div class="mt-6">
        <button
          @click="openCreateModal"
          class="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus class="w-4 h-4 mr-2" />
          Add Grading System
        </button>
      </div>
    </div>

    <!-- Grading Systems Table -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div class="overflow-x-auto">
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
                System Name
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Grade Point
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Min %
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Max %
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Description
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
              v-for="(system, index) in gradingSystems"
              :key="system.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ index + 1 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ system.branch?.name || 'N/A' }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ system.name }}
                  </div>
                  <span
                    v-if="system.is_default"
                    class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                  >
                    Default
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {{ system.grade_point || 'N/A' }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ system.min_percentage || 'N/A' }}%
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ system.max_percentage || 'N/A' }}%
                </div>
              </td>
              <td class="px-6 py-4">
                <div
                  class="text-sm text-gray-900 dark:text-white max-w-xs truncate"
                  :title="system.description"
                >
                  {{ system.description || 'No description' }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end space-x-2">
                  <button
                    @click="editSystem(system)"
                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    <Edit class="h-4 w-4" />
                  </button>
                  <button
                    @click="deleteSystem(system.id)"
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
      item-label="grading systems"
      @page-changed="goToPage"
      @page-size-changed="changePageSize"
    />

    <!-- Create/Edit Modal -->
    <GradingSystemForm
      v-if="showModal"
      :system="editingSystem"
      :loading="saving"
      @close="closeModal"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { Plus, BarChart3, Edit, Trash2 } from 'lucide-vue-next';
import { useToast } from '~/composables/useToast';
import { useGradingSystems } from '~/composables/useGradingSystems';
import GradingSystemForm from '~/components/forms/GradingSystemForm.vue';
import Pagination from '~/components/ui/Pagination.vue';

// Props
const props = defineProps({});

// Emits
const emit = defineEmits(['refresh', 'create', 'update', 'delete', 'success']);

// Composables
const { showToast } = useToast();
const {
  gradingSystems,
  loading,
  pagination,
  hasData,
  isEmpty,
  loadGradingSystems,
  createGradingSystem,
  updateGradingSystem,
  deleteGradingSystem,
  goToPage,
  changePageSize
} = useGradingSystems();

// Reactive data
const showModal = ref(false);
const saving = ref(false);
const editingSystem = ref(null);

// Methods
const openCreateModal = () => {
  editingSystem.value = null;
  showModal.value = true;
};

const editSystem = system => {
  editingSystem.value = system;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingSystem.value = null;
};

const closeModalOnSuccess = () => {
  closeModal();
  emit('success');
};

const handleSubmit = async systemData => {
  try {
    saving.value = true;

    if (editingSystem.value) {
      await updateGradingSystem(editingSystem.value.id, systemData);
      emit('update', { ...systemData, id: editingSystem.value.id });
    } else {
      await createGradingSystem(systemData);
      emit('create', systemData);
    }

    closeModal();
    emit('success');
  } catch (error) {
    // Error handling is done in the composable
  } finally {
    saving.value = false;
  }
};

const deleteSystem = async systemId => {
  if (confirm('Are you sure you want to delete this grading system?')) {
    try {
      await deleteGradingSystem(systemId);
      emit('delete', systemId);
      emit('success');
    } catch (error) {
      // Error handling is done in the composable
    }
  }
};

// Expose methods to parent component
const loadData = async () => {
  await loadGradingSystems();
};

defineExpose({
  loadData,
  closeModalOnSuccess
});

// Load data on mount
onMounted(async () => {
  await loadData();
});
</script>
