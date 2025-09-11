<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Name -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Term Name <span class="text-red-500">*</span>
      </label>
      <input
        v-model="form.name"
        type="text"
        :class="[
          'input-field',
          errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
        ]"
        placeholder="e.g., First Term, Semester 1"
        @blur="validateField('name')"
        @input="clearError('name')"
      />
      <div v-if="errors.name" class="mt-1 text-sm text-red-600 dark:text-red-400">
        {{ errors.name }}
      </div>
    </div>

    <!-- Description -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Description
      </label>
      <textarea
        v-model="form.description"
        :class="[
          'input-field',
          errors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
        ]"
        rows="3"
        placeholder="Optional description of this term"
        @blur="validateField('description')"
        @input="clearError('description')"
      ></textarea>
      <div v-if="errors.description" class="mt-1 text-sm text-red-600 dark:text-red-400">
        {{ errors.description }}
      </div>
    </div>

    <!-- Academic Year -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Academic Year <span class="text-red-500">*</span>
      </label>
      <select
        v-model="form.academic_year_id"
        :class="[
          'input-field',
          errors.academic_year_id ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
        ]"
        @blur="validateField('academic_year_id')"
        @change="clearError('academic_year_id')"
      >
        <option value="">Select Academic Year</option>
        <option v-for="year in academicYearOptions" :key="year.value" :value="year.value">
          {{ year.label }}
        </option>
      </select>
      <div v-if="errors.academic_year_id" class="mt-1 text-sm text-red-600 dark:text-red-400">
        {{ errors.academic_year_id }}
      </div>
    </div>

    <!-- Start Date -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Start Date <span class="text-red-500">*</span>
      </label>
      <input
        v-model="form.start_date"
        type="date"
        :class="[
          'input-field',
          errors.start_date ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
        ]"
        @blur="validateField('start_date')"
        @input="clearError('start_date')"
      />
      <div v-if="errors.start_date" class="mt-1 text-sm text-red-600 dark:text-red-400">
        {{ errors.start_date }}
      </div>
    </div>

    <!-- End Date -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        End Date <span class="text-red-500">*</span>
      </label>
      <input
        v-model="form.end_date"
        type="date"
        :class="[
          'input-field',
          errors.end_date ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
        ]"
        @blur="validateField('end_date')"
        @input="clearError('end_date')"
      />
      <div v-if="errors.end_date" class="mt-1 text-sm text-red-600 dark:text-red-400">
        {{ errors.end_date }}
      </div>
    </div>

    <!-- Status -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Status
      </label>
      <select
        v-model="form.status"
        :class="[
          'input-field',
          errors.status ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
        ]"
        @blur="validateField('status')"
        @change="clearError('status')"
      >
        <option value="upcoming">Upcoming</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <div v-if="errors.status" class="mt-1 text-sm text-red-600 dark:text-red-400">
        {{ errors.status }}
      </div>
    </div>

    <!-- Form Actions -->
    <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
      <button
        type="button"
        @click="$emit('cancel')"
        class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Cancel
      </button>
      <button
        type="submit"
        :disabled="isSubmitting"
        class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="isSubmitting" class="flex items-center">
          <svg
            class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
          {{ isEditing ? 'Updating...' : 'Creating...' }}
        </span>
        <span v-else>
          {{ isEditing ? 'Update Term' : 'Create Term' }}
        </span>
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useToast } from '~/composables/useToast';
import { validationRules, commonSchemas, validateForm } from '~/utils/validators';

// Props
const props = defineProps({
  term: {
    type: Object,
    default: null
  },
  academicYearOptions: {
    type: Array,
    default: () => []
  }
});

// Emits
const emit = defineEmits(['submit', 'cancel']);

// Composables
const { showToast } = useToast();

// Reactive data
const isSubmitting = ref(false);
const errors = ref({});

// Form data
const form = reactive({
  name: '',
  description: '',
  academic_year_id: '',
  start_date: '',
  end_date: '',
  status: 'upcoming'
});

// Computed
const isEditing = computed(() => !!props.term);

// Validation schema using common utilities
const validationSchema = {
  name: [
    val => validationRules.required(val, 'Term name'),
    val => validationRules.minLength(val, 2, 'Term name'),
    val => validationRules.maxLength(val, 100, 'Term name')
  ],
  description: [val => validationRules.maxLength(val, 500, 'Description')],
  academic_year_id: [
    val => validationRules.required(val, 'Academic year'),
    val => validationRules.uuid(val)
  ],
  start_date: [
    val => validationRules.required(val, 'Start date'),
    val => validationRules.date(val)
  ],
  end_date: [
    val => validationRules.required(val, 'End date'),
    val => validationRules.date(val),
    val => {
      if (val && form.start_date && new Date(val) <= new Date(form.start_date)) {
        return 'End date must be after start date';
      }
      return null;
    }
  ],
  status: [
    val => {
      const validStatuses = ['upcoming', 'active', 'completed', 'cancelled'];
      if (val && !validStatuses.includes(val)) {
        return 'Invalid status';
      }
      return null;
    }
  ]
};

// Methods
const validateField = fieldName => {
  const value = form[fieldName];
  const rules = validationSchema[fieldName] || [];

  for (const rule of rules) {
    const error = rule(value);
    if (error) {
      errors.value[fieldName] = error;
      return;
    }
  }

  delete errors.value[fieldName];
};

const validateFormData = () => {
  const formErrors = validateForm(form, validationSchema);
  errors.value = formErrors;
  return Object.keys(formErrors).length === 0;
};

const clearError = fieldName => {
  delete errors.value[fieldName];
};

const handleSubmit = async () => {
  if (!validateFormData()) {
    showToast('Please fix the validation errors', 'error');
    return;
  }

  isSubmitting.value = true;

  try {
    // Prepare form data
    const formData = {
      name: form.name.trim(),
      description: form.description?.trim() || null,
      academic_year_id: form.academic_year_id,
      start_date: form.start_date,
      end_date: form.end_date,
      status: form.status
    };

    emit('submit', formData);
  } catch (error) {
    console.error('Error in form submission:', error);
    showToast('An error occurred while processing the form', 'error');
  } finally {
    isSubmitting.value = false;
  }
};

const resetForm = () => {
  form.name = '';
  form.description = '';
  form.academic_year_id = '';
  form.start_date = '';
  form.end_date = '';
  form.status = 'upcoming';
  errors.value = {};
};

// Watch for prop changes
watch(
  () => props.term,
  newTerm => {
    if (newTerm) {
      form.name = newTerm.name || '';
      form.description = newTerm.description || '';
      form.academic_year_id = newTerm.academic_year_id || '';
      form.start_date = newTerm.start_date || '';
      form.end_date = newTerm.end_date || '';
      form.status = newTerm.status || 'upcoming';
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

// Initialize form
onMounted(() => {
  if (props.term) {
    form.name = props.term.name || '';
    form.description = props.term.description || '';
    form.academic_year_id = props.term.academic_year_id || '';
    form.start_date = props.term.start_date || '';
    form.end_date = props.term.end_date || '';
    form.status = props.term.status || 'upcoming';
  }
});
</script>
