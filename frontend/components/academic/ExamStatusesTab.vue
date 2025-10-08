<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Exam Statuses</h2>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage exam statuses for your school
        </p>
      </div>
      <button
        @click="openCreateModal"
        class="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <Plus class="w-4 h-4 mr-2" />
        Add Status
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
    <div v-else-if="examStatuses.length === 0" class="text-center py-12">
      <div class="mx-auto h-12 w-12 text-gray-400">
        <Tag class="w-full h-full" />
      </div>
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No exam statuses</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Get started by creating your first exam status.
      </p>
      <div class="mt-6">
        <button
          @click="openCreateModal"
          class="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus class="w-4 h-4 mr-2" />
          Add Status
        </button>
      </div>
    </div>

    <!-- Exam Statuses Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="status in examStatuses"
        :key="status.id"
        class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-2 mb-2">
              <div
                class="w-3 h-3 rounded-full"
                :style="{ backgroundColor: status.color || '#6B7280' }"
              ></div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ status.name }}
              </h3>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {{ status.code }}
            </p>
            <p v-if="status.description" class="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {{ status.description }}
            </p>
            <div class="flex items-center space-x-4">
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  status.is_active
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                ]"
              >
                {{ status.is_active ? 'Active' : 'Inactive' }}
              </span>
              <span
                v-if="status.is_system"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
              >
                System
              </span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-4 flex items-center justify-between">
          <div class="text-xs text-gray-500 dark:text-gray-400">Sort: {{ status.sort_order }}</div>
          <div class="flex items-center space-x-2">
            <button
              v-if="!status.is_system"
              @click="editStatus(status)"
              class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium"
            >
              Edit
            </button>
            <button
              v-if="!status.is_system"
              @click="deleteStatus(status.id)"
              class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <ExamStatusForm
      v-if="showModal"
      :status="editingStatus"
      :loading="saving"
      @close="closeModal"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { Plus, Tag } from 'lucide-vue-next';
import { useToast } from '~/composables/useToast';
import ExamStatusForm from '~/components/forms/ExamStatusForm.vue';

// Props
const props = defineProps({
  examStatuses: {
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

// Reactive data
const showModal = ref(false);
const saving = ref(false);
const editingStatus = ref(null);

// Methods
const openCreateModal = () => {
  editingStatus.value = null;
  showModal.value = true;
};

const editStatus = status => {
  editingStatus.value = status;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingStatus.value = null;
};

const closeModalOnSuccess = () => {
  closeModal();
  emit('success');
};

const handleSubmit = async statusData => {
  try {
    saving.value = true;

    if (editingStatus.value) {
      emit('update', { ...statusData, id: editingStatus.value.id });
    } else {
      emit('create', statusData);
    }

    // Don't close modal here - let the parent component handle success/error
    // closeModal() will be called from the parent when the operation succeeds
  } catch (error) {
    showToast('Failed to save exam status', 'error');
  } finally {
    saving.value = false;
  }
};

const deleteStatus = async statusId => {
  if (confirm('Are you sure you want to delete this exam status?')) {
    emit('delete', statusId);
  }
};

// Expose methods to parent component
defineExpose({
  closeModalOnSuccess
});
</script>
