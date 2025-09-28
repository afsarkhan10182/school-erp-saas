<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <!-- Section -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Section
        </label>
        <select
          v-model="form.section_id"
          :class="[
            'input-field',
            errors.section_id ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
          ]"
          @blur="validateField('section_id')"
          @change="clearError('section_id')"
        >
          <option value="">All Sections</option>
          <option v-for="section in sections" :key="section.value" :value="section.value">
            {{ section.label }}
          </option>
        </select>
        <div v-if="errors.section_id" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ errors.section_id }}
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

      <!-- Primary Teacher -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Primary Teacher
        </label>
        <div class="flex items-center space-x-4">
          <label class="flex items-center">
            <input
              v-model="form.is_primary"
              type="radio"
              :value="true"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Yes</span>
          </label>
          <label class="flex items-center">
            <input
              v-model="form.is_primary"
              type="radio"
              :value="false"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">No</span>
          </label>
        </div>
        <div v-if="errors.is_primary" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ errors.is_primary }}
        </div>
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
        {{
          isSubmitting ? 'Saving...' : props.assignment ? 'Update Assignment' : 'Create Assignment'
        }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useToast } from '~/composables/useToast';
import { useAcademics } from '~/composables/useAcademics';
import { Subjects } from '~/api';

// Props
const props = defineProps({
  assignment: {
    type: Object,
    default: null
  },
  subjects: {
    type: Array,
    default: () => []
  },
  teachers: {
    type: Array,
    default: () => []
  },
  classes: {
    type: Array,
    default: () => []
  },
  sections: {
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
const { 
  sectionOptions, academicYears,
  fetchSections, fetchAcademicYears
} = useAcademics();

// Reactive data
const isSubmitting = ref(false);
const errors = ref({});

// Form data
const form = reactive({
  subject_id: '',
  teacher_id: '',
  class_id: '',
  section_id: '',
  academic_year: '',
  is_primary: false
});

// Computed
const sections = computed(() => {
  if (!form.class_id) return [];
  return sectionOptions.value.filter(section => section.class_id === form.class_id);
});

// Validation rules
const validationRules = {
  subject_id: value => {
    if (!value) {
      return 'Subject is required';
    }
    return null;
  },
  teacher_id: value => {
    if (!value) {
      return 'Teacher is required';
    }
    return null;
  },
  academic_year: value => {
    if (!value) {
      return 'Academic year is required';
    }
    return null;
  },
  class_id: value => {
    if (value && !isValidUUID(value)) {
      return 'Invalid class ID format';
    }
    return null;
  },
  section_id: value => {
    if (value && !isValidUUID(value)) {
      return 'Invalid section ID format';
    }
    return null;
  }
};

// Methods
const validateField = fieldName => {
  const value = form[fieldName];
  const error = validationRules[fieldName] ? validationRules[fieldName](value) : null;

  if (error) {
    errors.value[fieldName] = error;
  } else {
    delete errors.value[fieldName];
  }
};

const validateForm = () => {
  const fieldNames = Object.keys(validationRules);
  fieldNames.forEach(fieldName => {
    validateField(fieldName);
  });

  return Object.keys(errors.value).length === 0;
};

const clearError = fieldName => {
  delete errors.value[fieldName];
};

const isValidUUID = uuid => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const handleSubmit = async () => {
  if (!validateForm()) {
    showToast('Please fix the validation errors', 'error');
    return;
  }

  isSubmitting.value = true;

  try {
    // Prepare form data
    const formData = {
      subject_id: form.subject_id,
      teacher_id: form.teacher_id,
      class_id: form.class_id || null,
      section_id: form.section_id || null,
      academic_year: form.academic_year,
      is_primary: form.is_primary
    };

    emit('submit', formData);
  } catch (error) {
    console.error('Error in form submission:', error);
    showToast('An error occurred while saving', 'error');
  } finally {
    isSubmitting.value = false;
  }
};

const resetForm = () => {
  Object.assign(form, {
    subject_id: '',
    teacher_id: '',
    class_id: '',
    section_id: '',
    academic_year: '',
    is_primary: false
  });
  errors.value = {};
};

const populateForm = assignment => {
  if (assignment) {
    Object.assign(form, {
      subject_id: assignment.subject_id || '',
      teacher_id: assignment.teacher_id || '',
      class_id: assignment.class_id || '',
      section_id: assignment.section_id || '',
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
onMounted(async () => {
  await Promise.all([loadSections(), fetchAcademicYears()]);
  populateForm(props.assignment);
});
</script>

<style scoped>
.input-field {
  @apply block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white sm:text-sm;
}
</style>
