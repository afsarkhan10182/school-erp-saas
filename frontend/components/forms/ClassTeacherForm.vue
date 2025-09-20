<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <!-- Class Selection -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Class <span class="text-red-500">*</span>
      </label>
      <select v-model="form.class_id" required @change="onClassChange" class="input-field">
        <option value="">Select Class</option>
        <option v-for="cls in classes" :key="cls.id" :value="cls.id">
          {{ cls.name }}
        </option>
      </select>
    </div>

    <!-- Stream Selection (if streams exist) -->
    <div v-if="showStreams">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Stream
      </label>
      <select v-model="form.stream_id" @change="onStreamChange" class="input-field">
        <option value="">Select Stream</option>
        <option v-for="stream in availableStreams" :key="stream.id" :value="stream.id">
          {{ stream.name }}
        </option>
      </select>
    </div>

    <!-- Section Selection -->
    <div v-if="showSections">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Section
      </label>
      <select v-model="form.section_id" class="input-field">
        <option value="">All Sections</option>
        <option v-for="section in availableSections" :key="section.id" :value="section.id">
          {{ section.name }}
        </option>
      </select>
    </div>

    <!-- Teacher Selection -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Class Teacher <span class="text-red-500">*</span>
      </label>
      <select v-model="form.teacher_id" required class="input-field">
        <option value="">Select Teacher</option>
        <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
          {{ teacher.first_name }} {{ teacher.last_name }}
        </option>
      </select>
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

// Methods
const handleSubmit = async () => {
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
      academic_year: academicYear
    };

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

// Lifecycle
onMounted(() => {
  populateForm(props.allocation);
});
</script>

<style scoped>
.input-field {
  @apply block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white sm:text-sm;
}
</style>
