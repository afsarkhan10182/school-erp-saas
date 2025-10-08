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

    <div v-else class="grid gap-4">
      <div
        v-for="hall in halls"
        :key="hall.id"
        class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-3 mb-2">
              <h4 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ hall.name }}
              </h4>
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  hall.is_active
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                ]"
              >
                {{ hall.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>

            <div class="flex items-center space-x-6">
              <div class="flex items-center space-x-2">
                <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Capacity:</span>
                <span class="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {{ hall.capacity }} seats
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center space-x-2 ml-4">
            <button
              @click="editHall(hall)"
              class="inline-flex items-center px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
              title="Edit exam hall"
            >
              <Edit class="w-4 h-4 mr-1" />
              Edit
            </button>
            <button
              @click="deleteHallConfirm(hall)"
              class="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded-md transition-colors"
              title="Delete exam hall"
            >
              <Trash2 class="w-4 h-4 mr-1" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

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
import ExamHallModal from './ExamHallModal.vue';
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
const { halls, loading, loadHalls, deleteHall } = useExamHalls();

// State
const showModal = ref(false);
const editingHall = ref<ExamHall | null>(null);

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
    await loadHalls();
    emit('success');
  }
};

const closeModal = () => {
  showModal.value = false;
  editingHall.value = null;
};

const handleSuccess = async () => {
  closeModal();
  await loadHalls();
  emit('success');
};

// Lifecycle
onMounted(() => {
  loadHalls();
});
</script>
