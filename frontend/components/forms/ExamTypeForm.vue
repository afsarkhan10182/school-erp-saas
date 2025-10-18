<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- CodeIgniter Style - Only 2 fields -->
    <div class="space-y-4">
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
        <p v-if="errors.branch_id" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ errors.branch_id }}
        </p>
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
          placeholder="e.g., Unit Test, Mid Term, Final Exam"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          @blur="validateField('name')"
          @input="clearError('name')"
        />
        <p v-if="errors.name" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ errors.name }}
        </p>
      </div>
    </div>

    <!-- Hidden fields (keep in data but don't show in UI) -->
    <div style="display: none">
      <input v-model="form.code" type="text" />
      <input v-model="form.weightage" type="number" />
      <input v-model="form.is_active" type="checkbox" />
      <input v-model="form.description" type="text" />
      <input v-model="form.created_by" type="text" />
      <input v-model="form.updated_by" type="text" />
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
      <button
        type="button"
        @click="$emit('cancel')"
        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
      >
        Cancel
      </button>
      <button
        type="submit"
        :disabled="loading"
        class="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg
          v-if="loading"
          class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span v-if="loading">Saving...</span>
        <span v-else>{{ examType ? 'Update Exam Type' : 'Create Exam Type' }}</span>
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useToast } from '~/composables/useToast';
import { useBranches } from '~/composables/useBranches';
import FormField from '~/components/ui/FormField.vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';

// Props
const props = defineProps({
  examType: {
    type: Object,
    default: null
  }
});

// Emits
const emit = defineEmits(['submit', 'cancel']);

// Composables
const { showToast } = useToast();
const { branches, fetchBranches, loading: branchesLoading } = useBranches();

// Reactive data
const loading = ref(false);
const errors = ref({});

// Form data
const form = ref({
  branch_id: '',
  name: '',
  // Hidden fields with defaults (CodeIgniter style)
  code: '',
  weightage: 25,
  is_active: true,
  description: '',
  created_by: '',
  updated_by: ''
});

// Computed properties
const branchOptions = computed(() =>
  branches.value.map(branch => ({
    value: branch.id,
    label: branch.name
  }))
);

// Methods
const validateForm = () => {
  errors.value = {};

  // CodeIgniter Style - Only validate essential fields
  if (!form.value.branch_id) {
    errors.value.branch_id = 'Branch is required';
  }

  if (!form.value.name?.trim()) {
    errors.value.name = 'Name is required';
  } else if (form.value.name.length < 2) {
    errors.value.name = 'Name must be at least 2 characters';
  } else if (form.value.name.length > 50) {
    errors.value.name = 'Name is too long (max 50 characters)';
  }

  return Object.keys(errors.value).length === 0;
};

const validateField = field => {
  const fieldValidations = {
    branch_id: () => {
      if (!form.value.branch_id) {
        errors.value.branch_id = 'Branch is required';
      } else {
        delete errors.value.branch_id;
      }
    },
    name: () => {
      if (!form.value.name?.trim()) {
        errors.value.name = 'Name is required';
      } else if (form.value.name.length < 2) {
        errors.value.name = 'Name must be at least 2 characters';
      } else if (form.value.name.length > 50) {
        errors.value.name = 'Name cannot exceed 50 characters';
      } else {
        delete errors.value.name;
      }
    }
  };

  if (fieldValidations[field]) {
    fieldValidations[field]();
  }
};

const clearError = field => {
  delete errors.value[field];
};

const handleSubmit = async () => {
  if (!validateForm()) {
    showToast('Please fix the errors in the form', 'error');
    return;
  }

  loading.value = true;

  try {
    // Set default values for hidden fields (CodeIgniter style)
    const submitData = {
      branch_id: form.value.branch_id,
      name: form.value.name.trim(),
      // Set defaults for hidden fields
      code: form.value.code || `ET${Date.now()}`, // Auto-generate if empty
      weightage: form.value.weightage || 25,
      is_active: form.value.is_active !== false,
      description: form.value.description || '',
      created_by: form.value.created_by || '',
      updated_by: form.value.updated_by || ''
    };

    emit('submit', submitData);
  } catch (error) {
    showToast('Failed to save exam type', 'error');
  } finally {
    loading.value = false;
  }
};

// Initialize form with exam type data if editing
const initializeForm = () => {
  if (props.examType) {
    form.value = {
      branch_id: props.examType.branch_id || '',
      name: props.examType.name || '',
      code: props.examType.code || '',
      weightage: props.examType.weightage || 25,
      is_active: props.examType.is_active !== false,
      description: props.examType.description || '',
      created_by: props.examType.created_by || '',
      updated_by: props.examType.updated_by || ''
    };
  } else {
    form.value = {
      branch_id: '',
      name: '',
      code: '',
      weightage: 25,
      is_active: true,
      description: '',
      created_by: '',
      updated_by: ''
    };
  }
};

// Lifecycle
onMounted(async () => {
  await fetchBranches();
  initializeForm();
});

// Watch for exam type prop changes
watch(
  () => props.examType,
  () => {
    initializeForm();
  },
  { immediate: true }
);
</script>
