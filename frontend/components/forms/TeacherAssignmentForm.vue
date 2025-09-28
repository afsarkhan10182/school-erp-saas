<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <!-- Teacher -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Teacher <span class="text-red-500">*</span>
      </label>
      <EnhancedDropdown
        v-model="form.teacher_id"
        :options="teachers"
        placeholder="Select Teacher"
        :required="true"
        :error="errors.teacher_id"
        @blur="validateField('teacher_id')"
        @change="clearError('teacher_id')"
      />
    </div>

    <!-- Subject -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Subject <span class="text-red-500">*</span>
      </label>
      <EnhancedDropdown
        v-model="form.subject_id"
        :options="subjects"
        placeholder="Select Subject"
        :required="true"
        :error="errors.subject_id"
        @blur="validateField('subject_id')"
        @change="clearError('subject_id')"
      />
    </div>

    <!-- Class -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Class <span class="text-red-500">*</span>
      </label>
      <EnhancedDropdown
        v-model="form.class_id"
        :options="classOptions"
        placeholder="Select Class"
        :required="true"
        :error="errors.class_id"
        @blur="validateField('class_id')"
        @change="onClassChange"
      />
      <!-- Debug info -->
      <div v-if="classOptions.length === 0" class="text-sm text-red-500 mt-1">
        No classes available. Please check if classes are loaded for this branch.
      </div>
    </div>

    <!-- Stream Selection (if streams exist) -->
    <div v-if="showStreams">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Stream
      </label>
      <EnhancedDropdown
        v-model="form.stream_id"
        :options="streamOptions"
        placeholder="Select Stream"
        @change="onStreamChange"
      />
    </div>

    <!-- Section Selection -->
    <div v-if="showSections">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Section
      </label>
      <EnhancedDropdown
        v-model="form.section_id"
        :options="sectionOptions"
        placeholder="All Sections"
        @change="clearError('section_id')"
      />
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
        class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { Streams } from '~/api/academic/streams';
import { Sections } from '~/api/academic/sections';

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
  },
  schoolId: {
    type: String,
    default: ''
  },
  branchId: {
    type: String,
    default: ''
  }
});

// Emits
const emit = defineEmits(['submit', 'cancel']);

// Composables
const { showToast } = useToast();

// Reactive data
const isSubmitting = ref(false);
const errors = ref({});

// Reactive data for cascading dropdowns
const availableStreams = ref([]);
const availableSections = ref([]);
const showStreams = ref(false);
const showSections = ref(false);

// Computed
const classOptions = computed(() => {
  if (!props.classes || props.classes.length === 0) {
    return [];
  }
  // Classes are already formatted by TeacherAssignmentTab
  return props.classes;
});

const streamOptions = computed(() => {
  return availableStreams.value.map(stream => ({
    value: stream.id,
    label: stream.name
  }));
});

const sectionOptions = computed(() => {
  return availableSections.value.map(section => ({
    value: section.id,
    label: section.name
  }));
});

// Form data
const form = reactive({
  teacher_id: '',
  subject_id: '',
  class_id: '',
  stream_id: '',
  section_id: '',
  is_primary: false
});

// Validation schema
const validationSchema = {
  teacher_id: [val => validationRules.required(val, 'Teacher')],
  subject_id: [val => validationRules.required(val, 'Subject')],
  class_id: [val => validationRules.required(val, 'Class')]
  // academic_year is auto-set, no validation needed
};

// Check for duplicate assignment
const checkDuplicateAssignment = () => {
  if (form.teacher_id && form.subject_id && form.class_id) {
    // This is a simple frontend check - the backend will do the actual validation
    // We could add more sophisticated checking here if needed
    return false; // Let backend handle the validation
  }
  return false;
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

// Cascading dropdown methods
const onClassChange = async () => {
  // Clear any existing class_id validation errors
  clearError('class_id');

  // Reset dependent fields
  form.stream_id = '';
  form.section_id = '';

  if (!form.class_id) {
    showStreams.value = false;
    showSections.value = false;
    return;
  }

  try {
    // Load streams for the class using dropdown API
    const streamsResponse = await Streams.getForDropdown({
      school_id: props.schoolId,
      branch_id: props.branchId,
      class_id: form.class_id
    });

    if (streamsResponse.data && streamsResponse.data.length > 0) {
      // Show streams first
      availableStreams.value = streamsResponse.data;
      showStreams.value = true;
      showSections.value = false;
    } else {
      // No streams, show sections directly
      await loadSectionsForClass();
    }
  } catch (error) {
    console.error('Error loading streams:', error);
    // Fallback: try to load sections directly
    await loadSectionsForClass();
  }
};

const onStreamChange = async () => {
  form.section_id = '';

  if (!form.stream_id) {
    showSections.value = false;
    return;
  }

  // Load sections for selected stream
  await loadSectionsForStream();
};

const loadSectionsForClass = async () => {
  try {
    const params = new URLSearchParams({
      school_id: props.schoolId,
      branch_id: props.branchId,
      class_id: form.class_id
    });

    const sectionsResponse = await Sections.getDropdown(params.toString());

    if (sectionsResponse.data && sectionsResponse.data.length > 0) {
      availableSections.value = sectionsResponse.data;
      showSections.value = true;
    } else {
      showSections.value = false;
    }
  } catch (error) {
    console.error('Error loading sections for class:', error);
    showSections.value = false;
  }
};

const loadSectionsForStream = async () => {
  try {
    const params = new URLSearchParams({
      school_id: props.schoolId,
      branch_id: props.branchId,
      class_id: form.class_id,
      stream_id: form.stream_id
    });

    const sectionsResponse = await Sections.getDropdown(params.toString());

    if (sectionsResponse.data && sectionsResponse.data.length > 0) {
      availableSections.value = sectionsResponse.data;
      showSections.value = true;
    } else {
      showSections.value = false;
    }
  } catch (error) {
    console.error('Error loading sections for stream:', error);
    showSections.value = false;
  }
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
    // Get current academic year automatically
    const currentYear = props.academicYears.find(year => year.is_current);
    const academicYear = currentYear ? currentYear.name : '';

    const assignmentData = {
      teacher_id: form.teacher_id,
      subject_id: form.subject_id,
      class_id: form.class_id,
      academic_year: academicYear,
      is_primary: form.is_primary
    };

    // Only include stream_id and section_id if they have valid values
    if (form.stream_id && form.stream_id.trim() !== '') {
      assignmentData.stream_id = form.stream_id;
    }
    if (form.section_id && form.section_id.trim() !== '') {
      assignmentData.section_id = form.section_id;
    }

    console.log('Submitting assignment data:', assignmentData);
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
    stream_id: '',
    section_id: '',
    is_primary: false
  });
  errors.value = {};
  showStreams.value = false;
  showSections.value = false;
  availableStreams.value = [];
  availableSections.value = [];
};

const loadStreamsAndSectionsForEdit = async () => {
  try {
    // Load streams for the class
    const streamsResponse = await Streams.getForDropdown({
      school_id: props.schoolId,
      branch_id: props.branchId,
      class_id: form.class_id
    });

    if (streamsResponse.data && streamsResponse.data.length > 0) {
      availableStreams.value = streamsResponse.data;
      showStreams.value = true;

      // If we have a stream_id, load sections for that stream
      if (form.stream_id) {
        await loadSectionsForStream();
      }
    } else {
      // No streams, load sections directly for the class
      await loadSectionsForClass();
    }
  } catch (error) {
    console.error('Error loading streams and sections for edit:', error);
    // Fallback: try to load sections directly
    await loadSectionsForClass();
  }
};

const populateForm = async assignment => {
  if (assignment) {
    Object.assign(form, {
      teacher_id: assignment.teacher_id || '',
      subject_id: assignment.subject_id || '',
      class_id: assignment.class_id || '',
      stream_id: assignment.stream_id || '',
      section_id: assignment.section_id || '',
      is_primary: assignment.is_primary || false
    });

    // If editing and we have a class_id, load the streams and sections
    if (assignment.class_id) {
      await loadStreamsAndSectionsForEdit();
    }
  } else {
    resetForm();
  }
};

// Watchers
watch(
  () => props.assignment,
  async newAssignment => {
    await populateForm(newAssignment);
  },
  { immediate: true }
);

// Lifecycle
onMounted(async () => {
  await populateForm(props.assignment);
});
</script>
