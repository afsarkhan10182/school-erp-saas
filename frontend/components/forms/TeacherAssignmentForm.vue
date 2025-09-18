<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Teacher -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Teacher <span class="text-red-500">*</span>
        </label>
        <select
          v-model="form.teacher_id"
          required
          :class="[
            'input-field',
            errors.teacher_id ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
          ]"
          @blur="validateField('teacher_id')"
          @change="clearError('teacher_id')"
        >
          <option value="">Select Teacher</option>
          <option v-for="teacher in teachers" :key="teacher.value" :value="teacher.value">
            {{ teacher.label }}
          </option>
        </select>
        <div v-if="errors.teacher_id" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ errors.teacher_id }}
        </div>
      </div>

      <!-- Subject -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Subject <span class="text-red-500">*</span>
        </label>
        <select
          v-model="form.subject_id"
          required
          :class="[
            'input-field',
            errors.subject_id ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
          ]"
          @blur="validateField('subject_id')"
          @change="clearError('subject_id')"
        >
          <option value="">Select Subject</option>
          <option v-for="subject in subjects" :key="subject.value" :value="subject.value">
            {{ subject.label }}
          </option>
        </select>
        <div v-if="errors.subject_id" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ errors.subject_id }}
        </div>
      </div>

      <!-- Class -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Class
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
          <option value="">All Classes</option>
          <option v-for="cls in classes" :key="cls.value" :value="cls.value">
            {{ cls.label }}
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
          required
          :class="[
            'input-field',
            errors.academic_year ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
          ]"
          @blur="validateField('academic_year')"
          @change="clearError('academic_year')"
        >
          <option value="">Select Academic Year</option>
          <option v-for="year in academicYears" :key="year.value" :value="year.value">
            {{ year.label }}
          </option>
        </select>
        <div v-if="errors.academic_year" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ errors.academic_year }}
        </div>
      </div>
    </div>

    <!-- Primary Teacher Toggle -->
    <div>
      <label class="flex items-center">
        <input
          v-model="form.is_primary"
          type="checkbox"
          class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
          Set as primary teacher for this subject
        </span>
      </label>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Primary teachers are the main instructors for the subject
      </p>
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
        {{ isSubmitting ? 'Saving...' : props.assignment ? 'Update Assignment' : 'Assign Teacher' }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useToast } from '~/composables/useToast';
import { validationRules } from '~/utils/validators';

// Props
const props = defineProps({
  assignment: {
    type: Object,
    default: null
  },
  classes: {
    type: Array,
    default: () => []
  },
  subjects: {
    type: Array,
    default: () => []
  },
  teachers: {
    type: Array,
    default: () => []
  },
  academicYears: {
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
  teacher_id: '',
  subject_id: '',
  class_id: '',
  academic_year: '',
  is_primary: false
});

// Validation schema
const validationSchema = {
  teacher_id: [val => validationRules.required(val, 'Teacher')],
  subject_id: [val => validationRules.required(val, 'Subject')],
  class_id: [
    val => {
      if (val && !validationRules.uuid(val)) {
        return 'Invalid class ID format';
      }
      return null;
    }
  ],
  academic_year: [val => validationRules.required(val, 'Academic Year')]
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
    const assignmentData = {
      teacher_id: form.teacher_id,
      subject_id: form.subject_id,
      class_id: form.class_id || null,
      academic_year: form.academic_year,
      is_primary: form.is_primary
    };

    emit('submit', assignmentData);
  } catch (error) {
    console.error('Error in form submission:', error);
    showToast('An error occurred while saving', 'error');
  } finally {
    isSubmitting.value = false;
  }
};

const resetForm = () => {
  Object.assign(form, {
    teacher_id: '',
    subject_id: '',
    class_id: '',
    academic_year: '',
    is_primary: false
  });
  errors.value = {};
};

const populateForm = assignment => {
  if (assignment) {
    Object.assign(form, {
      teacher_id: assignment.teacher_id || '',
      subject_id: assignment.subject_id || '',
      class_id: assignment.class_id || '',
      academic_year: assignment.academic_year || '',
      is_primary: assignment.is_primary || false
    });
  } else {
    resetForm();
  }
};

// Watchers
watch(
  () => props.assignment,
  newAssignment => {
    populateForm(newAssignment);
  },
  { immediate: true }
);

// Lifecycle
onMounted(() => {
  populateForm(props.assignment);
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
