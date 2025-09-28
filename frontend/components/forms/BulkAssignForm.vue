<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Class Selection -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Select Class <span class="text-red-500">*</span>
      </label>
      <select
        v-model="form.class_id"
        @change="onClassChange"
        class="input-field"
        :disabled="classesLoading"
      >
        <option value="">
          {{ classesLoading ? 'Loading classes...' : 'Select Class' }}
        </option>
        <option v-for="cls in classes" :key="cls.value" :value="cls.value">
          {{ cls.label }}
        </option>
      </select>
      <div v-if="errors.class_id" class="mt-1 text-sm text-red-600 dark:text-red-400">
        {{ errors.class_id }}
      </div>
    </div>

    <!-- Stream Selection - Only if class has streams -->
    <div v-if="hasStreams">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Select Stream <span class="text-red-500">*</span>
      </label>
      <select
        v-model="form.stream_id"
        @change="onStreamChange"
        class="input-field"
        :disabled="!form.class_id || streamsLoading"
      >
        <option value="">
          {{ streamsLoading ? 'Loading streams...' : 'Select Stream' }}
        </option>
        <option v-for="stream in activeStreamsForClass" :key="stream.value" :value="stream.value">
          {{ stream.label }}
        </option>
      </select>
      <div v-if="errors.stream_id" class="mt-1 text-sm text-red-600 dark:text-red-400">
        {{ errors.stream_id }}
      </div>
    </div>

    <!-- Section Selection - Only if class/stream has sections -->
    <div v-if="hasSections">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Select Section <span class="text-red-500">*</span>
      </label>
      <select
        v-model="form.section_id"
        class="input-field"
        :disabled="!form.class_id || sectionsLoading"
      >
        <option value="">
          {{ sectionsLoading ? 'Loading sections...' : 'Select Section' }}
        </option>
        <option
          v-for="section in activeSectionsFiltered"
          :key="section.value"
          :value="section.value"
        >
          {{ section.label }}
        </option>
      </select>
      <div v-if="errors.section_id" class="mt-1 text-sm text-red-600 dark:text-red-400">
        {{ errors.section_id }}
      </div>
    </div>

    <!-- Subject Selection -->
    <div>
      <div class="flex items-center justify-between mb-1">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Select Subjects <span class="text-red-500">*</span>
        </label>
        <div class="flex space-x-2">
          <button
            type="button"
            @click="selectAllSubjects"
            class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
          >
            Select All
          </button>
          <button
            type="button"
            @click="clearAll"
            class="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
          >
            Clear All
          </button>
        </div>
      </div>
      <div
        class="space-y-2 max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3"
      >
        <div v-if="subjects.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
          No subjects available
        </div>
        <div v-else>
          <div v-for="subject in subjects" :key="subject.value" class="flex items-center space-x-2">
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
        :disabled="isSubmitting || !form.class_id || form.subject_ids.length === 0"
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ isSubmitting ? 'Creating...' : 'Create Assignments' }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useToast } from '~/composables/useToast';
import { validationRules } from '~/utils/validators';

// Props
const props = defineProps({
  classes: {
    type: Array,
    default: () => []
  },
  subjects: {
    type: Array,
    default: () => []
  },
  streams: {
    type: Array,
    default: () => []
  },
  sections: {
    type: Array,
    default: () => []
  },
  academicYear: {
    type: String,
    required: true
  }
});

// Emits
const emit = defineEmits(['submit', 'cancel']);

// Composables
const { showToast } = useToast();

// Reactive data
const isSubmitting = ref(false);
const errors = ref({});
const classesLoading = ref(false);
const streamsLoading = ref(false);
const sectionsLoading = ref(false);

// Form data
const form = reactive({
  class_id: '',
  stream_id: '',
  section_id: '',
  subject_ids: []
});

// Computed properties for hierarchical dropdowns
const hasStreams = computed(() => {
  if (!form.class_id) return false;
  return activeStreamsForClass.value.length > 0;
});

const hasSections = computed(() => {
  if (!form.class_id) return false;
  return activeSectionsFiltered.value.length > 0;
});

const activeStreamsForClass = computed(() => {
  if (!form.class_id) return [];
  return props.streams.filter(stream => stream.class_id === form.class_id);
});

const activeSectionsFiltered = computed(() => {
  let filteredSections = props.sections.filter(section => section.class_id === form.class_id);

  // If a stream is selected, filter sections by stream
  if (form.stream_id) {
    filteredSections = filteredSections.filter(section => section.stream_id === form.stream_id);
  }

  return filteredSections;
});

// Validation schema
const validationSchema = {
  class_id: [
    val => {
      if (!val) {
        return 'Please select a class';
      }
      return null;
    }
  ],
  stream_id: [
    val => {
      if (hasStreams.value && !val) {
        return 'Please select a stream';
      }
      return null;
    }
  ],
  section_id: [
    val => {
      if (hasSections.value && !val) {
        return 'Please select a section';
      }
      return null;
    }
  ],
  subject_ids: [
    val => {
      if (!val || val.length === 0) {
        return 'Please select at least one subject';
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
    const bulkData = {
      class_id: form.class_id,
      stream_id: form.stream_id && form.stream_id !== '' ? form.stream_id : null,
      section_id: form.section_id && form.section_id !== '' ? form.section_id : null,
      subject_ids: form.subject_ids,
      academic_year: props.academicYear
    };

    emit('submit', bulkData);
  } catch (error) {
    console.error('Error in form submission:', error);
    showToast('An error occurred while creating assignments', 'error');
  } finally {
    isSubmitting.value = false;
  }
};

const selectAllSubjects = () => {
  form.subject_ids = props.subjects.map(subject => subject.value);
};

const onClassChange = () => {
  // Clear dependent fields when class changes
  form.stream_id = '';
  form.section_id = '';
  clearError('class_id');
  clearError('stream_id');
  clearError('section_id');
};

const onStreamChange = () => {
  // Clear section when stream changes
  form.section_id = '';
  clearError('stream_id');
  clearError('section_id');
};

const clearAll = () => {
  form.subject_ids = [];
};
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
