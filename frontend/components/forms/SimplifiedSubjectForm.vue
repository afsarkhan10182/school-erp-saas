<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Branch Context Display -->
    <div
      v-if="selectedBranch"
      class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3"
    >
      <div class="flex items-center">
        <Building2 class="h-4 w-4 text-blue-600 mr-2" />
        <div>
          <p class="text-sm font-medium text-blue-900 dark:text-blue-100">
            Creating subject for: {{ selectedBranch.name }}
          </p>
          <p v-if="selectedBranch.code" class="text-xs text-blue-700 dark:text-blue-300">
            Branch Code: {{ selectedBranch.code }}
          </p>
        </div>
      </div>
    </div>

    <!-- Debug info -->
    <div
      v-if="!selectedBranch"
      class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3"
    >
      <p class="text-sm text-yellow-800 dark:text-yellow-200">
        Debug: No branch selected. selectedBranch = {{ selectedBranch }}
      </p>
    </div>

    <!-- Subject Name -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Subject Name <span class="text-red-500">*</span>
      </label>
      <input
        v-model="form.name"
        type="text"
        required
        :class="[
          'input-field',
          errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
        ]"
        placeholder="Mathematics"
        @blur="validateField('name')"
        @input="clearError('name')"
      />
      <div v-if="errors.name" class="mt-1 text-sm text-red-600 dark:text-red-400">
        {{ errors.name }}
      </div>
    </div>

    <!-- Subject Code -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Subject Code
      </label>
      <input
        v-model="form.code"
        type="text"
        :class="[
          'input-field',
          errors.code ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
        ]"
        placeholder="MATH101 (optional)"
        @blur="validateField('code')"
        @input="clearError('code')"
      />
      <div v-if="errors.code" class="mt-1 text-sm text-red-600 dark:text-red-400">
        {{ errors.code }}
      </div>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Leave empty to auto-generate from subject name
      </p>
    </div>

    <!-- Category -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Category <span class="text-red-500">*</span>
      </label>
      <select
        v-model="form.category"
        required
        :class="[
          'input-field',
          errors.category ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
        ]"
        @blur="validateField('category')"
        @change="clearError('category')"
      >
        <option value="">Select Category</option>
        <option v-for="category in subjectCategories" :key="category.value" :value="category.value">
          {{ category.label }}
        </option>
      </select>
      <div v-if="errors.category" class="mt-1 text-sm text-red-600 dark:text-red-400">
        {{ errors.category }}
      </div>
    </div>

    <!-- Status -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Status
      </label>
      <div class="flex items-center space-x-4">
        <label class="flex items-center">
          <input
            v-model="form.is_active"
            type="radio"
            :value="true"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
          />
          <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
        </label>
        <label class="flex items-center">
          <input
            v-model="form.is_active"
            type="radio"
            :value="false"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
          />
          <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Inactive</span>
        </label>
      </div>
    </div>

    <!-- Form Actions -->
    <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
      <button
        type="button"
        @click="$emit('cancel')"
        class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Cancel
      </button>
      <button
        type="submit"
        :disabled="isSubmitting"
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ isSubmitting ? 'Saving...' : props.subject ? 'Update Subject' : 'Create Subject' }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useToast } from '~/composables/useToast';
import { validationRules } from '~/utils/validators';
import { Building2 } from 'lucide-vue-next';

// Props
const props = defineProps({
  subject: {
    type: Object,
    default: null
  },
  selectedBranch: {
    type: Object,
    default: null
  }
});

// Emits
const emit = defineEmits(['submit', 'cancel']);

// Composables
const { showToast } = useToast();

// Reactive data
const isSubmitting = ref(false);
const errors = ref({});

// Subject categories
const subjectCategories = ref([
  { value: 'core', label: 'Core' },
  { value: 'elective', label: 'Elective' },
  { value: 'extra_curricular', label: 'Extra Curricular' },
  { value: 'language', label: 'Language' },
  { value: 'science', label: 'Science' },
  { value: 'arts', label: 'Arts' },
  { value: 'commerce', label: 'Commerce' }
]);

// Form data
const form = reactive({
  name: '',
  code: '',
  category: 'core',
  is_active: true
});

// Validation schema
const validationSchema = {
  name: [
    val => validationRules.required(val, 'Subject name'),
    val => validationRules.minLength(val, 2, 'Subject name'),
    val => validationRules.maxLength(val, 100, 'Subject name')
  ],
  code: [
    val => {
      if (val && !validationRules.minLength(val, 2, 'Subject code')) {
        return 'Subject code must be at least 2 characters';
      }
      return null;
    },
    val => {
      if (val && !validationRules.maxLength(val, 20, 'Subject code')) {
        return 'Subject code must be less than 20 characters';
      }
      return null;
    }
  ],
  category: [val => validationRules.required(val, 'Category')]
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

const clearError = fieldName => {
  delete errors.value[fieldName];
};

const handleSubmit = async () => {
  // Validate all fields
  const fieldNames = Object.keys(validationSchema);
  let hasErrors = false;

  fieldNames.forEach(fieldName => {
    validateField(fieldName);
    if (errors.value[fieldName]) {
      hasErrors = true;
    }
  });

  if (hasErrors) {
    showToast('Please fix the validation errors', 'error');
    return;
  }

  isSubmitting.value = true;

  try {
    // Auto-generate code if not provided
    const subjectData = {
      name: form.name.trim(),
      code: form.code.trim() || generateCode(form.name),
      category: form.category,
      is_active: form.is_active
    };

    emit('submit', subjectData);
  } catch (error) {
    console.error('Error in form submission:', error);
    showToast('An error occurred while saving', 'error');
  } finally {
    isSubmitting.value = false;
  }
};

const generateCode = name => {
  // Simple code generation: first 3 letters + random number
  const prefix = name
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 3)
    .toUpperCase();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `${prefix}${random}`;
};

const resetForm = () => {
  Object.assign(form, {
    name: '',
    code: '',
    category: 'core',
    is_active: true
  });
  errors.value = {};
};

const populateForm = subject => {
  if (subject) {
    Object.assign(form, {
      name: subject.name || '',
      code: subject.code || '',
      category: subject.category || 'core',
      is_active: subject.is_active !== undefined ? subject.is_active : true
    });
  } else {
    resetForm();
  }
};

// Watchers
watch(
  () => props.subject,
  newSubject => {
    populateForm(newSubject);
  },
  { immediate: true }
);

// Lifecycle
onMounted(() => {
  populateForm(props.subject);
});
</script>

<style scoped>
.input-field {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  outline: none;
  background-color: white;
  color: #111827;
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.input-field:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.dark .input-field {
  border-color: #4b5563;
  background-color: #1f2937;
  color: white;
}

.dark .input-field:focus {
  border-color: #3b82f6;
}
</style>
