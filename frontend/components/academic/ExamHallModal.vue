<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 overflow-y-auto"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
    >
      <!-- Background overlay -->
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        aria-hidden="true"
        @click="closeModal"
      ></div>

      <!-- Modal panel -->
      <div
        class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
      >
        <form @submit.prevent="saveHall">
          <!-- Header -->
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                {{ isEditing ? 'Edit Exam Hall' : 'Create Exam Hall' }}
              </h3>
              <button
                type="button"
                @click="closeModal"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X class="h-6 w-6" />
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="bg-white dark:bg-gray-800 px-4 pb-4 sm:p-6">
            <div class="space-y-4">
              <!-- Name -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hall Name <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Hall A, Science Lab, Computer Room"
                />
              </div>

              <!-- Capacity -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Capacity <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.capacity"
                  type="number"
                  required
                  min="1"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="30"
                />
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Maximum number of students that can sit in this hall
                </p>
              </div>

              <!-- Active Status -->
              <div class="flex items-center">
                <input
                  v-model="form.is_active"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label class="ml-2 text-sm text-gray-700 dark:text-gray-300"> Active </label>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              :disabled="saving || loading"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {{ saving ? 'Saving...' : isEditing ? 'Update Hall' : 'Create Hall' }}
            </button>
            <button
              type="button"
              @click="closeModal"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { X } from 'lucide-vue-next';
import { useExamHalls } from '~/composables/useExamHalls';
import { useToast } from '~/composables/useToast';
import type { ExamHall } from '~/api/academic/exam-halls';

// Props
const props = defineProps<{
  show: boolean;
  hall?: ExamHall | null;
}>();

// Emits
const emit = defineEmits<{
  close: [];
  success: [];
}>();

// Composables
const { showToast } = useToast();
const { createHall, updateHall } = useExamHalls();

// State
const saving = ref(false);
const loading = ref(false);

// Form
const form = ref({
  name: '',
  capacity: 30,
  is_active: true
});

// Computed
const isEditing = computed(() => !!props.hall);

// Methods
const closeModal = () => {
  emit('close');
  resetForm();
};

const resetForm = () => {
  form.value = {
    name: '',
    capacity: 30,
    is_active: true
  };
};

const loadFormData = () => {
  if (props.hall) {
    form.value = {
      name: props.hall.name,
      capacity: props.hall.capacity,
      is_active: props.hall.is_active
    };
  }
};

const saveHall = async () => {
  if (!form.value.name.trim()) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  try {
    saving.value = true;

    const hallData = {
      name: form.value.name.trim(),
      capacity: form.value.capacity,
      is_active: form.value.is_active
    };

    if (isEditing.value && props.hall) {
      await updateHall(props.hall.id, hallData);
    } else {
      await createHall(hallData);
    }

    emit('success');
    closeModal();
  } catch (error) {
    showToast('Failed to save exam hall', 'error');
  } finally {
    saving.value = false;
  }
};

// Watchers
watch(
  () => props.show,
  show => {
    if (show) {
      loadFormData();
    }
  }
);

// Lifecycle
onMounted(() => {
  if (props.show) {
    loadFormData();
  }
});
</script>
