<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Exam Types</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage exam types and their configurations
        </p>
      </div>
      <button
        @click="openCreateModal"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Plus class="w-4 h-4 mr-2" />
        New Exam Type
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div
          class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
        ></div>
        <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading exam types...</p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="examTypes.length === 0" class="text-center py-12">
      <div
        class="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4"
      >
        <Tag class="w-12 h-12 text-gray-400" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No exam types found</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Get started by creating your first exam type to organize your examinations.
      </p>
      <button
        @click="openCreateModal"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Plus class="w-4 h-4 mr-2" />
        Create First Exam Type
      </button>
    </div>

    <div v-else class="grid gap-4">
      <div
        v-for="examType in examTypes"
        :key="examType.id"
        class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-3 mb-2">
              <h4 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ examType.name }}
              </h4>
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  examType.is_active
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                ]"
              >
                {{ examType.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>

            <p v-if="examType.description" class="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {{ examType.description }}
            </p>

            <div class="flex items-center space-x-6">
              <div class="flex items-center space-x-2">
                <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Weightage:</span>
                <span class="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {{ examType.weightage || 0 }}%
                </span>
              </div>

              <div class="flex items-center space-x-2">
                <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Code:</span>
                <span
                  class="text-sm font-mono text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                >
                  {{ examType.code }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center space-x-2 ml-4">
            <button
              @click="editExamType(examType)"
              class="inline-flex items-center px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
              title="Edit exam type"
            >
              <Edit class="w-4 h-4 mr-1" />
              Edit
            </button>
            <button
              @click="deleteExamType(examType.id)"
              class="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded-md transition-colors"
              title="Delete exam type"
            >
              <Trash2 class="w-4 h-4 mr-1" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Modal :show="showModal" @close="closeModal" size="lg">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          {{ editingExamType ? 'Edit Exam Type' : 'Create New Exam Type' }}
        </h3>
      </template>

      <template #body>
        <ExamTypeForm :exam-type="editingExamType" @submit="handleSubmit" @cancel="closeModal" />
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Plus, Tag, Edit, Trash2 } from 'lucide-vue-next';
import Modal from '~/components/ui/Modal.vue';
import ExamTypeForm from '~/components/forms/ExamTypeForm.vue';
import { useToast } from '~/composables/useToast';

// Props
const props = defineProps({
  examTypes: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  branchId: {
    type: String,
    default: ''
  }
});

// Emits
const emit = defineEmits(['refresh', 'create', 'update', 'delete', 'success']);

// Composables
const { showToast } = useToast();

// Reactive data
const showModal = ref(false);
const editingExamType = ref(null);

// Methods
const openCreateModal = () => {
  editingExamType.value = null;
  showModal.value = true;
};

const editExamType = examType => {
  editingExamType.value = examType;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingExamType.value = null;
};

const closeModalOnSuccess = () => {
  closeModal();
  emit('success');
};

const handleSubmit = formData => {
  if (editingExamType.value) {
    emit('update', { ...formData, id: editingExamType.value.id });
  } else {
    emit('create', formData);
  }
  // Don't close modal here - let the parent component handle success/error
  // closeModal() will be called from the parent when the operation succeeds
};

const deleteExamType = async examTypeId => {
  if (confirm('Are you sure you want to delete this exam type?')) {
    emit('delete', examTypeId);
  }
};

// Expose methods to parent component
defineExpose({
  closeModalOnSuccess
});
</script>
