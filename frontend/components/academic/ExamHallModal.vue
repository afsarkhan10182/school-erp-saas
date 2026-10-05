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
            <!-- Only essential fields -->
            <div class="space-y-4">
              <!-- Hall No () -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hall No <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Hall A, Hall B, Lab 1"
                />
              </div>

              <!-- No of Seats () -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  No of Seats <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.capacity"
                  type="number"
                  required
                  min="1"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="30"
                />
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
import { useBranches } from '~/composables/useBranches';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useToast } from '~/composables/useToast';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
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
const { branches, fetchBranches, loading: branchesLoading } = useBranches();
const { selectedBranchId } = useGlobalBranch();

// State
const saving = ref(false);
const loading = ref(false);

// Form - Only essential fields
const form = ref({
  branch_id: selectedBranchId.value || '',
  name: '',
  capacity: 30
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
    branch_id: selectedBranchId.value || '',
    name: '',
    capacity: 30
  };
};

const loadFormData = () => {
  if (props.hall) {
    form.value = {
      branch_id: props.hall.branch_id || '',
      name: props.hall.name,
      capacity: props.hall.capacity
    };
  }
};

const saveHall = async () => {
  form.value.branch_id =
    form.value.branch_id ||
    selectedBranchId.value ||
    authStore.currentBranch?.id ||
    branches.value?.[0]?.id ||
    user.value?.branch_id;
  //  - Only validate essential fields
  if (!form.value.branch_id) {
    showToast('Branch is required', 'error');
    return;
  }
  if (!form.value.name.trim()) {
    showToast('Hall No is required', 'error');
    return;
  }
  if (!form.value.capacity || form.value.capacity < 1) {
    showToast('No of Seats is required', 'error');
    return;
  }

  try {
    saving.value = true;

    // Prepare form data for backend
    const hallData = {
      branch_id: form.value.branch_id,
      name: form.value.name.trim(),
      capacity: form.value.capacity,
      // Default values for backend
      code: form.value.code || `H${Date.now()}`, // Auto-generate if empty
      location: form.value.location || '',
      description: form.value.description || '',
      is_active: form.value.is_active !== false,
      created_by: form.value.created_by || '',
      updated_by: form.value.updated_by || ''
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
  async show => {
    if (show) {
      await fetchBranches();
      loadFormData();
    }
  }
);

// Lifecycle
onMounted(async () => {
  if (props.show) {
    await fetchBranches();
    loadFormData();
  }
});
</script>
