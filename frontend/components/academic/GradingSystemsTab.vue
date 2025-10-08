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

    <!-- Grading Systems Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="system in gradingSystems"
        :key="system.id"
        class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-2 mb-2">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ system.name }}
              </h3>
              <span
                v-if="system.is_default"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
              >
                Default
              </span>
            </div>
            <p v-if="system.description" class="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {{ system.description }}
            </p>
            <div class="flex items-center space-x-4">
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  system.is_active
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                ]"
              >
                {{ system.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Grade Scales Preview -->
        <div v-if="system.gradeScales && system.gradeScales.length > 0" class="mt-4">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Grade Scales</h4>
          <div class="space-y-1">
            <div
              v-for="scale in system.gradeScales.slice(0, 3)"
              :key="scale.id"
              class="flex items-center justify-between text-xs"
            >
              <span class="text-gray-600 dark:text-gray-400">{{ scale.grade }}</span>
              <span class="text-gray-500 dark:text-gray-400">
                {{ scale.min_percentage }}% - {{ scale.max_percentage }}%
              </span>
            </div>
            <div
              v-if="system.gradeScales.length > 3"
              class="text-xs text-gray-500 dark:text-gray-400"
            >
              +{{ system.gradeScales.length - 3 }} more
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-4 flex items-center justify-between">
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ system.gradeScales?.length || 0 }} grades
          </div>
          <div class="flex items-center space-x-2">
            <button
              @click="editSystem(system)"
              class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium"
            >
              Edit
            </button>
            <button
              @click="deleteSystem(system.id)"
              class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

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
import { Plus, BarChart3 } from 'lucide-vue-next';
import { useToast } from '~/composables/useToast';
import GradingSystemForm from '~/components/forms/GradingSystemForm.vue';

// Props
const props = defineProps({
  gradingSystems: {
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
      emit('update', { ...systemData, id: editingSystem.value.id });
    } else {
      emit('create', systemData);
    }

    // Don't close modal here - let the parent component handle success/error
    // closeModal() will be called from the parent when the operation succeeds
  } catch (error) {
    showToast('Failed to save grading system', 'error');
  } finally {
    saving.value = false;
  }
};

const deleteSystem = async systemId => {
  if (confirm('Are you sure you want to delete this grading system?')) {
    emit('delete', systemId);
  }
};

// Expose methods to parent component
defineExpose({
  closeModalOnSuccess
});
</script>
