<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Name -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Mapping Name <span class="text-red-500">*</span>
      </label>
      <input
        v-model="form.name"
        type="text"
        :class="[
          'input-field',
          errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
        ]"
        placeholder="e.g., Grade 10 Core Subjects"
        @blur="validateField('name')"
        @input="clearError('name')"
      />
      <div v-if="errors.name" class="mt-1 text-sm text-red-600 dark:text-red-400">
        {{ errors.name }}
      </div>
    </div>

    <!-- Code -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Mapping Code <span class="text-red-500">*</span>
      </label>
      <input
        v-model="form.code"
        type="text"
        :class="[
          'input-field',
          errors.code ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
        ]"
        placeholder="e.g., G10-CORE"
        @blur="validateField('code')"
        @input="clearError('code')"
      />
      <div v-if="errors.code" class="mt-1 text-sm text-red-600 dark:text-red-400">
        {{ errors.code }}
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
        placeholder="Optional description of this subject mapping"
        @blur="validateField('description')"
        @input="clearError('description')"
      ></textarea>
      <div v-if="errors.description" class="mt-1 text-sm text-red-600 dark:text-red-400">
        {{ errors.description }}
      </div>
    </div>

    <!-- Class -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Class <span class="text-red-500">*</span>
      </label>
      <select
        v-model="form.class_id"
        :class="[
          'input-field',
          errors.class_id ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
        ]"
        @blur="validateField('class_id')"
        @change="clearError('class_id')"
      >
        <option value="">Select Class</option>
        <option
          v-for="classOption in classOptions"
          :key="classOption.value"
          :value="classOption.value"
        >
          {{ classOption.label }}
        </option>
      </select>
      <div v-if="errors.class_id" class="mt-1 text-sm text-red-600 dark:text-red-400">
        {{ errors.class_id }}
      </div>
    </div>

    <!-- Academic Year -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Academic Year <span class="text-red-500">*</span>
      </label>
      <select
        v-model="form.academic_year"
        :class="[
          'input-field',
          errors.academic_year ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
        ]"
        @blur="validateField('academic_year')"
        @change="clearError('academic_year')"
      >
        <option value="">Select Academic Year</option>
        <option v-for="year in academicYearOptions" :key="year.value" :value="year.value">
          {{ year.label }}
        </option>
      </select>
      <div v-if="errors.academic_year" class="mt-1 text-sm text-red-600 dark:text-red-400">
        {{ errors.academic_year }}
      </div>
    </div>

    <!-- Total Credit Hours -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Total Credit Hours
      </label>
      <input
        v-model.number="form.total_credit_hours"
        type="number"
        min="0"
        max="100"
        :class="[
          'input-field',
          errors.total_credit_hours ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
        ]"
        placeholder="0"
        @blur="validateField('total_credit_hours')"
        @input="clearError('total_credit_hours')"
      />
      <div v-if="errors.total_credit_hours" class="mt-1 text-sm text-red-600 dark:text-red-400">
        {{ errors.total_credit_hours }}
      </div>
    </div>

    <!-- Subjects -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Subjects
      </label>
      <div
        class="space-y-2 max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3"
      >
        <div v-if="subjectOptions.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
          No subjects available
        </div>
        <div v-else>
          <div
            v-for="subject in subjectOptions"
            :key="subject.value"
            class="flex items-center space-x-2"
          >
            <input
              :id="`subject-${subject.value}`"
              v-model="form.subject_ids"
              :value="subject.value"
              type="checkbox"
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label
              :for="`subject-${subject.value}`"
              class="text-sm text-gray-700 dark:text-gray-300"
            >
              {{ subject.label }} ({{ subject.code }})
            </label>
          </div>
        </div>
      </div>
      <div v-if="errors.subject_ids" class="mt-1 text-sm text-red-600 dark:text-red-400">
        {{ errors.subject_ids }}
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
          {{ isEditing ? 'Update Mapping' : 'Create Mapping' }}
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
  mapping: {
    type: Object,
    default: null
  },
  classOptions: {
    type: Array,
    default: () => []
  },
  subjectOptions: {
    type: Array,
    default: () => []
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
  code: '',
  description: '',
  class_id: '',
  academic_year: '',
  total_credit_hours: 0,
  subject_ids: []
});

// Computed
const isEditing = computed(() => !!props.mapping);

// Validation schema using common utilities
const validationSchema = {
  name: [
    val => validationRules.required(val, 'Mapping name'),
    val => validationRules.minLength(val, 2, 'Mapping name'),
    val => validationRules.maxLength(val, 100, 'Mapping name')
  ],
  code: [...commonSchemas.code, val => validationRules.required(val, 'Mapping code')],
  description: [val => validationRules.maxLength(val, 500, 'Description')],
  class_id: [val => validationRules.required(val, 'Class'), val => validationRules.uuid(val)],
  academic_year: [
    val => validationRules.required(val, 'Academic year'),
    val => validationRules.academicYear(val)
  ],
  total_credit_hours: [
    val => {
      if (val && (val < 0 || val > 100)) {
        return 'Total credit hours must be between 0 and 100';
      }
      return null;
    }
  ],
  subject_ids: [
    val => {
      if (val && !Array.isArray(val)) {
        return 'Subject IDs must be an array';
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
      code: form.code.trim(),
      description: form.description?.trim() || null,
      class_id: form.class_id,
      academic_year: form.academic_year,
      total_credit_hours: form.total_credit_hours || 0,
      subject_ids: form.subject_ids || []
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
  form.code = '';
  form.description = '';
  form.class_id = '';
  form.academic_year = '';
  form.total_credit_hours = 0;
  form.subject_ids = [];
  errors.value = {};
};

// Watch for prop changes
watch(
  () => props.mapping,
  newMapping => {
    if (newMapping) {
      form.name = newMapping.name || '';
      form.code = newMapping.code || '';
      form.description = newMapping.description || '';
      form.class_id = newMapping.class_id || '';
      form.academic_year = newMapping.academic_year || '';
      form.total_credit_hours = newMapping.total_credit_hours || 0;
      form.subject_ids = newMapping.subjects?.map(s => s.id) || [];
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

// Initialize form
onMounted(() => {
  if (props.mapping) {
    form.name = props.mapping.name || '';
    form.code = props.mapping.code || '';
    form.description = props.mapping.description || '';
    form.class_id = props.mapping.class_id || '';
    form.academic_year = props.mapping.academic_year || '';
    form.total_credit_hours = props.mapping.total_credit_hours || 0;
    form.subject_ids = props.mapping.subjects?.map(s => s.id) || [];
  }
});
</script>
