<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Exam Type Name -->
      <div class="md:col-span-2">
        <FormField id="exam-type-name" label="Exam Type Name" :errorMessage="errors.name" required>
          <input
            v-model="form.name"
            type="text"
            placeholder="e.g., Unit Test, Mid Term, Final Exam"
            class="input-field"
            @blur="validateField('name')"
            @input="clearError('name')"
          />
        </FormField>
      </div>

      <!-- Exam Type Code -->
      <div>
        <FormField id="exam-type-code" label="Exam Type Code" :errorMessage="errors.code" required>
          <input
            v-model="form.code"
            type="text"
            placeholder="e.g., unit_test, mid_term"
            class="input-field"
            @blur="validateField('code')"
            @input="clearError('code')"
          />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Use lowercase with underscores (e.g., unit_test, mid_term)
          </p>
        </FormField>
      </div>

      <!-- Weightage -->
      <div>
        <FormField id="weightage" label="Weightage (%)" :errorMessage="errors.weightage" required>
          <input
            v-model.number="form.weightage"
            type="number"
            placeholder="25"
            class="input-field"
            min="0"
            max="100"
            step="0.01"
            @blur="validateField('weightage')"
            @input="clearError('weightage')"
          />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            How much this exam type contributes to final grade
          </p>
        </FormField>
      </div>

      <!-- Active Status -->
      <div class="flex items-center">
        <input
          v-model="form.is_active"
          type="checkbox"
          id="is-active"
          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label for="is-active" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">
          Active
        </label>
        <p class="ml-2 text-xs text-gray-500 dark:text-gray-400">
          Inactive exam types won't appear in exam creation
        </p>
      </div>
    </div>

    <!-- Submit Button -->
    <div class="flex justify-end space-x-3">
      <button
        type="button"
        @click="$emit('cancel')"
        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Cancel
      </button>
      <button
        type="submit"
        :disabled="loading"
        class="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
import { ref, onMounted, watch } from 'vue';
import { useToast } from '~/composables/useToast';
import FormField from '~/components/ui/FormField.vue';

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

// Reactive data
const loading = ref(false);
const errors = ref({});

// Form data
const form = ref({
  name: '',
  code: '',
  weightage: 25,
  is_active: true
});

// Methods
const validateForm = () => {
  errors.value = {};

  if (!form.value.name?.trim()) {
    errors.value.name = 'Exam type name is required';
  } else if (form.value.name.length < 2) {
    errors.value.name = 'Exam type name must be at least 2 characters';
  } else if (form.value.name.length > 50) {
    errors.value.name = 'Exam type name cannot exceed 50 characters';
  }

  if (!form.value.code?.trim()) {
    errors.value.code = 'Exam type code is required';
  } else if (!/^[a-z_]+$/.test(form.value.code)) {
    errors.value.code = 'Code must contain only lowercase letters and underscores';
  } else if (form.value.code.length < 2) {
    errors.value.code = 'Exam type code must be at least 2 characters';
  } else if (form.value.code.length > 20) {
    errors.value.code = 'Exam type code cannot exceed 20 characters';
  }

  if (form.value.weightage < 0 || form.value.weightage > 100) {
    errors.value.weightage = 'Weightage must be between 0 and 100';
  }

  if (form.value.sort_order < 0) {
    errors.value.sort_order = 'Sort order cannot be negative';
  }

  if (form.value.description && form.value.description.length > 500) {
    errors.value.description = 'Description cannot exceed 500 characters';
  }

  return Object.keys(errors.value).length === 0;
};

const validateField = field => {
  const fieldValidations = {
    name: () => {
      if (!form.value.name?.trim()) {
        errors.value.name = 'Exam type name is required';
      } else if (form.value.name.length < 2) {
        errors.value.name = 'Exam type name must be at least 2 characters';
      } else if (form.value.name.length > 50) {
        errors.value.name = 'Exam type name cannot exceed 50 characters';
      } else {
        delete errors.value.name;
      }
    },
    code: () => {
      if (!form.value.code?.trim()) {
        errors.value.code = 'Exam type code is required';
      } else if (!/^[a-z_]+$/.test(form.value.code)) {
        errors.value.code = 'Code must contain only lowercase letters and underscores';
      } else if (form.value.code.length < 2) {
        errors.value.code = 'Exam type code must be at least 2 characters';
      } else if (form.value.code.length > 20) {
        errors.value.code = 'Exam type code cannot exceed 20 characters';
      } else {
        delete errors.value.code;
      }
    },
    weightage: () => {
      if (form.value.weightage < 0 || form.value.weightage > 100) {
        errors.value.weightage = 'Weightage must be between 0 and 100';
      } else {
        delete errors.value.weightage;
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
    // Clean up form data
    const submitData = { ...form.value };

    // Remove empty optional fields
    if (!submitData.description?.trim()) delete submitData.description;

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
      name: props.examType.name,
      code: props.examType.code,
      weightage: props.examType.weightage,
      is_active: props.examType.is_active !== false
    };
  } else {
    form.value = {
      name: '',
      code: '',
      weightage: 25,
      is_active: true
    };
  }
};

// Lifecycle
onMounted(() => {
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
