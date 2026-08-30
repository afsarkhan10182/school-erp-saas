<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Exam Halls</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage exam halls for your school
        </p>
      </div>
      <button
        @click="openCreateModal"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Plus class="w-4 h-4 mr-2" />
        New Hall
      </button>
    </div>

    <select
      v-if="branches.length > 1"
      v-model="selectedBranchId"
      class="border rounded-md px-3 py-2 text-sm mb-6 dark:bg-gray-800 dark:border-gray-700"
      @change="loadData"
    >
      <option value="">All Branches</option>
      <option v-for="branch in branches" :key="branch.id" :value="branch.id">
        {{ branch.name }}
      </option>
    </select>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div
          class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
        ></div>
        <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading exam halls...</p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="halls.length === 0" class="text-center py-12">
      <div
        class="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4"
      >
        <Building class="w-12 h-12 text-gray-400" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No exam halls found</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Get started by creating your first exam hall to organize your examinations.
      </p>
      <button
        @click="openCreateModal"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Plus class="w-4 h-4 mr-2" />
        Create First Exam Hall
      </button>
    </div>

    <!-- Halls Table -->
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
                Hall Name
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Capacity
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
              v-for="(hall, index) in halls"
              :key="hall.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ index + 1 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ hall.branch?.name || 'N/A' }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ hall.name }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {{ hall.capacity }} seats
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end space-x-2">
                  <button
                    @click="editHall(hall)"
                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    <Edit class="h-4 w-4" />
                  </button>
                  <button
                    @click="deleteHallConfirm(hall)"
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
      item-label="exam halls"
      @page-changed="goToPage"
      @page-size-changed="changePageSize"
    />

    <!-- Create/Edit Modal -->
    <ExamHallModal
      :show="showModal"
      :hall="editingHall"
      @close="closeModal"
      @success="handleSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Plus, Building, Edit, Trash2 } from 'lucide-vue-next';
import { useExamHalls } from '~/composables/useExamHalls';
import { useToast } from '~/composables/useToast';
import { useBranches } from '~/composables/useBranches';
import ExamHallModal from './ExamHallModal.vue';
import Pagination from '~/components/ui/Pagination.vue';
import type { ExamHall } from '~/api/academic/exam-halls';

// Props - No longer needed since exam halls are school-wide
const props = defineProps<{}>();

// Emits
const emit = defineEmits<{
  refresh: [];
  success: [];
}>();

// Composables
const { showToast } = useToast();
const { branches, fetchBranches } = useBranches();
const {
  halls,
  loading,
  pagination,
  hasData,
  isEmpty,
  loadExamHalls,
  deleteHall,
  goToPage,
  changePageSize
} = useExamHalls();

// State
const showModal = ref(false);
const editingHall = ref<ExamHall | null>(null);
const selectedBranchId = ref('');

// Methods
const openCreateModal = () => {
  editingHall.value = null;
  showModal.value = true;
};

const editHall = (hall: ExamHall) => {
  editingHall.value = hall;
  showModal.value = true;
};

const deleteHallConfirm = async (hall: ExamHall) => {
  if (confirm(`Are you sure you want to delete "${hall.name}"? This action cannot be undone.`)) {
    await deleteHall(hall.id);
    // Reload halls after deletion
    await loadData();
    emit('success');
  }
};

const closeModal = () => {
  showModal.value = false;
  editingHall.value = null;
};

const handleSuccess = async () => {
  closeModal();
  // Reload halls after create/update
  await loadData();
  emit('success');
};

// Expose methods to parent component
const loadData = async () => {
  await loadExamHalls(selectedBranchId.value ? { branch_id: selectedBranchId.value } : {});
};

defineExpose({
  loadData
});

// Lifecycle
onMounted(async () => {
  await fetchBranches();
  if (branches.value.length === 1) selectedBranchId.value = branches.value[0].id;
  await loadData();
});
</script>
