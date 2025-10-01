<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <!-- Class Selection -->
    <div>
      <EnhancedDropdown
        v-model="form.class_id"
        :options="classOptions"
        label="Class"
        placeholder="Select Class"
        :required="true"
        :error="errors.class_id"
        @update:model-value="onClassChange"
      />
    </div>

    <!-- Stream Selection (if streams exist) -->
    <div v-if="showStreams">
      <EnhancedDropdown
        v-model="form.stream_id"
        :options="streamOptions"
        label="Stream"
        placeholder="Select Stream"
        @update:model-value="onStreamChange"
      />
    </div>

    <!-- Section Selection -->
    <div v-if="showSections">
      <EnhancedDropdown
        v-model="form.section_id"
        :options="sectionOptions"
        label="Section"
        placeholder="All Sections"
      />
    </div>

    <!-- Teacher Selection -->
    <div>
      <EnhancedDropdown
        v-model="form.teacher_id"
        :options="teacherOptions"
        label="Class Teacher"
        placeholder="Select Teacher"
        :required="true"
        :error="errors.teacher_id"
      />
    </div>

    <!-- Form Actions -->
    <div class="flex justify-end space-x-3 pt-3 border-t border-gray-200 dark:border-gray-700">
      <button type="button" @click="$emit('cancel')" class="btn-secondary">Cancel</button>
      <button type="submit" :disabled="isSubmitting" class="btn-primary">
        {{ isSubmitting ? 'Saving...' : props.allocation ? 'Update' : 'Assign' }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useToast } from '~/composables/useToast';
import { Streams } from '~/api/academic/streams';
import { Sections } from '~/api/academic/sections';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';

// Props
const props = defineProps({
  allocation: {
    type: Object,
    default: null
  },
  classes: {
    type: Array,
    default: () => []
  },
  sections: {
    type: Array,
    default: () => []
  },
  streams: {
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
  branchId: {
    type: String,
    default: ''
  },
  schoolId: {
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

// Form data
const form = reactive({
  class_id: '',
  stream_id: '',
  section_id: '',
  teacher_id: ''
});

// Reactive data for cascading dropdowns
const availableStreams = ref([]);
const availableSections = ref([]);
const showStreams = ref(false);
const showSections = ref(false);

// Computed options for EnhancedDropdown
const classOptions = computed(() => {
  return props.classes.map(cls => ({
    value: cls.id,
    label: cls.name
  }));
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

const teacherOptions = computed(() => {
  return props.teachers.map(teacher => ({
    value: teacher.value,
    label: teacher.label
  }));
});

// Methods
const handleSubmit = async () => {
  // Clear previous errors
  errors.value = {};

  // Client-side validation
  if (!form.class_id) {
    errors.value.class_id = 'Class is required';
  }
  if (!form.teacher_id) {
    errors.value.teacher_id = 'Teacher is required';
  }

  // If there are validation errors, don't submit
  if (Object.keys(errors.value).length > 0) {
    return;
  }

  isSubmitting.value = true;

  try {
    // Get current academic year automatically
    const currentYear = props.academicYears.find(year => year.is_current);
    const academicYear = currentYear ? currentYear.name : '';

    const allocationData = {
      class_id: form.class_id,
      section_id: form.section_id && form.section_id !== '' ? form.section_id : null,
      stream_id: form.stream_id && form.stream_id !== '' ? form.stream_id : null,
      teacher_id: form.teacher_id,
      academic_year: academicYear,
      branch_id: props.branchId
    };

    // Include id for update operations
    if (props.allocation && props.allocation.id) {
      allocationData.id = props.allocation.id;
    }

    emit('submit', allocationData);
  } catch (error) {
    console.error('Error in form submission:', error);
    showToast('An error occurred while saving', 'error');
  } finally {
    isSubmitting.value = false;
  }
};

// Cascading dropdown methods
const onClassChange = async () => {
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
    const response = await Sections.getDropdown(
      `school_id=${props.schoolId}&branch_id=${props.branchId}&class_id=${form.class_id}`
    );
    availableSections.value = response.data || [];
    // Only show sections dropdown if there are sections available
    showSections.value = availableSections.value.length > 0;
  } catch (error) {
    console.error('Error loading sections:', error);
    availableSections.value = [];
    showSections.value = false;
  }
};

const loadSectionsForStream = async () => {
  try {
    const response = await Sections.getDropdown(
      `school_id=${props.schoolId}&branch_id=${props.branchId}&class_id=${form.class_id}&stream_id=${form.stream_id}`
    );
    availableSections.value = response.data || [];
    // Only show sections dropdown if there are sections available
    showSections.value = availableSections.value.length > 0;
  } catch (error) {
    console.error('Error loading sections for stream:', error);
    availableSections.value = [];
    showSections.value = false;
  }
};

const resetForm = () => {
  Object.assign(form, {
    class_id: '',
    stream_id: '',
    section_id: '',
    teacher_id: ''
  });
  showStreams.value = false;
  showSections.value = false;
  availableStreams.value = [];
  availableSections.value = [];
  errors.value = {};
};

const setBackendErrors = backendErrors => {
  errors.value = {};

  if (backendErrors) {
    // Map backend field names to form field names
    if (backendErrors.class_id) {
      errors.value.class_id = backendErrors.class_id;
    }
    if (backendErrors.teacher_id) {
      errors.value.teacher_id = backendErrors.teacher_id;
    }
    if (backendErrors.section_id) {
      errors.value.section_id = backendErrors.section_id;
    }
    if (backendErrors.stream_id) {
      errors.value.stream_id = backendErrors.stream_id;
    }
  }
};

const populateForm = allocation => {
  if (allocation) {
    Object.assign(form, {
      class_id: allocation.class_id || '',
      stream_id: allocation.stream_id || '',
      section_id: allocation.section_id || '',
      teacher_id: allocation.teacher_id || ''
    });

    // Trigger cascading dropdowns if class is selected
    if (allocation.class_id) {
      onClassChange();
    }
  } else {
    resetForm();
  }
};

// Watchers
watch(
  () => props.allocation,
  newAllocation => {
    populateForm(newAllocation);
  },
  { immediate: true }
);

// Expose methods for parent component
defineExpose({
  setBackendErrors,
  resetForm
});

// Lifecycle
onMounted(() => {
  populateForm(props.allocation);
});
</script>
