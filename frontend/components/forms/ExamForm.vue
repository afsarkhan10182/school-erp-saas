<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Exam Name -->
      <div class="md:col-span-2">
        <FormField id="exam-name" label="Exam Name" :errorMessage="errors.name" required>
          <input
            v-model="form.name"
            type="text"
            placeholder="Enter exam name"
            class="input-field"
          />
        </FormField>
      </div>

      <!-- Exam Type -->
      <div>
        <ExamTypeDropdown
          v-model="form.exam_type_id"
          label="Exam Type"
          :error="errors.exam_type_id"
          required
          placeholder="Select exam type"
        />
      </div>

      <!-- Academic Year -->
      <div>
        <FormField
          id="academic-year"
          label="Academic Year"
          :errorMessage="errors.academic_year"
          required
        >
          <select v-model="form.academic_year" class="input-field">
            <option value="">Select academic year</option>
            <option v-for="option in academicYearOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </FormField>
      </div>

      <!-- Class -->
      <div>
        <FormField id="class" label="Class" :errorMessage="errors.class_id" required>
          <select v-model="form.class_id" class="input-field" @change="handleClassChange">
            <option value="">Select class</option>
            <option v-for="option in classOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </FormField>
      </div>

      <!-- Section -->
      <div>
        <FormField id="section" label="Section (Optional)" :errorMessage="errors.section_id">
          <select v-model="form.section_id" class="input-field">
            <option value="">All sections</option>
            <option v-for="option in sectionOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </FormField>
      </div>

      <!-- Subject -->
      <div>
        <FormField id="subject" label="Subject (Optional)" :errorMessage="errors.subject_id">
          <select v-model="form.subject_id" class="input-field">
            <option value="">All subjects</option>
            <option v-for="option in subjectOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </FormField>
      </div>

      <!-- Max Marks -->
      <div>
        <FormField id="max-marks" label="Maximum Marks" :errorMessage="errors.max_marks" required>
          <input
            v-model="form.max_marks"
            type="number"
            placeholder="100"
            class="input-field"
            min="1"
          />
        </FormField>
      </div>

      <!-- Weightage -->
      <div>
        <FormField id="weightage" label="Weightage (%)" :errorMessage="errors.weightage" required>
          <input
            v-model="form.weightage"
            type="number"
            placeholder="100"
            class="input-field"
            min="0"
            max="100"
            step="0.01"
          />
        </FormField>
      </div>

      <!-- Exam Date -->
      <div>
        <FormField id="exam-date" label="Exam Date" :errorMessage="errors.exam_date" required>
          <input v-model="form.exam_date" type="date" class="input-field" />
        </FormField>
      </div>

      <!-- Duration Type -->
      <div>
        <FormField id="duration-type" label="Duration Type" :errorMessage="errors.duration_type">
          <select v-model="durationType" class="input-field" @change="handleDurationTypeChange">
            <option v-for="option in durationTypeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </FormField>
      </div>

      <!-- Start Time (for time range) -->
      <div v-if="durationType === 'time_range'">
        <FormField id="start-time" label="Start Time" :errorMessage="errors.start_time">
          <input v-model="form.start_time" type="time" class="input-field" />
        </FormField>
      </div>

      <!-- End Time (for time range) -->
      <div v-if="durationType === 'time_range'">
        <FormField id="end-time" label="End Time" :errorMessage="errors.end_time">
          <input v-model="form.end_time" type="time" class="input-field" />
        </FormField>
      </div>

      <!-- Duration in Minutes (for duration) -->
      <div v-if="durationType === 'duration'">
        <FormField
          id="duration-minutes"
          label="Duration (Minutes)"
          :errorMessage="errors.duration_minutes"
          required
        >
          <input
            v-model="form.duration_minutes"
            type="number"
            placeholder="120"
            class="input-field"
            min="1"
          />
        </FormField>
      </div>

      <!-- Status -->
      <div>
        <FormField id="status" label="Status" :errorMessage="errors.status" required>
          <select v-model="form.status" class="input-field">
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </FormField>
      </div>
    </div>

    <!-- Instructions -->
    <div>
      <FormField
        id="instructions"
        label="Instructions (Optional)"
        :errorMessage="errors.instructions"
      >
        <textarea
          v-model="form.instructions"
          placeholder="Enter exam instructions..."
          class="input-field"
          rows="4"
        ></textarea>
      </FormField>
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
        <span v-else>{{ exam ? 'Update Exam' : 'Create Exam' }}</span>
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useToast } from '~/composables/useToast';
import { useDropdowns } from '~/composables/useDropdowns';
import { useExamOptions } from '~/composables/useExamOptions';
import { useAcademics } from '~/composables/useAcademics';
import FormField from '~/components/ui/FormField.vue';
import ExamTypeDropdown from '~/components/forms/ExamTypeDropdown.vue';
import {
  FileText,
  Award,
  Calendar,
  Trophy,
  Target,
  ClipboardCheck,
  FileEdit,
  FolderOpen
} from 'lucide-vue-next';

// Props
const props = defineProps({
  exam: {
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
  subjects: {
    type: Array,
    default: () => []
  }
});

// Emits
const emit = defineEmits(['submit', 'cancel']);

// Composables
const { showToast } = useToast();
const { examStatusOptions, durationTypeOptions, loadAllExamOptions } = useExamOptions();
const { academicYears, fetchAcademicYears } = useAcademics();
const { subjectOptions, loadSubjects, loadSections } = useDropdowns();

// Reactive data
const loading = ref(false);
const errors = ref({});
const durationType = ref('time_range');

// Form data
const form = ref({
  name: '',
  exam_type_id: '',
  academic_year: '',
  class_id: '',
  section_id: '',
  subject_id: '',
  max_marks: 100,
  weightage: 100,
  exam_date: '',
  start_time: '',
  end_time: '',
  duration_minutes: null,
  status: 'draft',
  instructions: ''
});

// Options - now loaded from database via composable
const statusOptions = examStatusOptions;

// Computed
const academicYearOptions = computed(() => {
  return academicYears.value.map(year => ({
    value: year.name,
    label: year.name + (year.is_current ? ' (Current)' : '')
  }));
});

const classOptions = computed(() => {
  return props.classes || [];
});

const sectionOptions = computed(() => {
  return [{ value: '', label: 'All Sections' }, ...(props.sections || [])];
});

// Use subjectOptions from useDropdowns composable

// Simple validation for exam type
const validateExamType = () => {
  if (!form.value.exam_type_id) {
    errors.value.exam_type_id = 'Exam type is required';
    return false;
  }
  return true;
};

// Methods
const validateForm = () => {
  errors.value = {};

  if (!form.value.name?.trim()) {
    errors.value.name = 'Exam name is required';
  }

  if (!form.value.exam_type_id) {
    errors.value.exam_type_id = 'Exam type is required';
  }

  if (!form.value.academic_year) {
    errors.value.academic_year = 'Academic year is required';
  }

  if (!form.value.class_id) {
    errors.value.class_id = 'Class is required';
  }

  if (!form.value.exam_date) {
    errors.value.exam_date = 'Exam date is required';
  }

  if (form.value.max_marks < 1) {
    errors.value.max_marks = 'Maximum marks must be at least 1';
  }

  if (form.value.weightage < 0 || form.value.weightage > 100) {
    errors.value.weightage = 'Weightage must be between 0 and 100';
  }

  if (durationType.value === 'time_range') {
    if (form.value.start_time && form.value.end_time) {
      if (form.value.start_time >= form.value.end_time) {
        errors.value.end_time = 'End time must be after start time';
      }
    }
  } else if (durationType.value === 'duration') {
    if (!form.value.duration_minutes || form.value.duration_minutes < 1) {
      errors.value.duration_minutes = 'Duration must be at least 1 minute';
    }
  }

  return Object.keys(errors.value).length === 0;
};

const handleSubmit = async () => {
  console.log('Form submission started');
  console.log('Form data:', form.value);

  if (!validateForm()) {
    console.log('Form validation failed:', errors.value);
    showToast('Please fix the errors in the form', 'error');
    return;
  }

  console.log('Form validation passed');
  loading.value = true;

  try {
    // Clean up form data
    const submitData = { ...form.value };

    // Remove empty optional fields
    if (!submitData.section_id) delete submitData.section_id;
    if (!submitData.subject_id) delete submitData.subject_id;
    if (!submitData.instructions?.trim()) delete submitData.instructions;

    // Handle duration type
    if (durationType.value === 'duration') {
      delete submitData.start_time;
      delete submitData.end_time;
    } else {
      delete submitData.duration_minutes;
    }

    console.log('Submitting data:', submitData);
    emit('submit', submitData);
  } catch (error) {
    console.error('Error in handleSubmit:', error);
    showToast('Failed to save exam', 'error');
  } finally {
    loading.value = false;
  }
};

const handleClassChange = () => {
  // Reset section when class changes
  form.value.section_id = '';
  // Load sections for the selected class
  loadSections({ classId: form.value.class_id });
  // Load subjects for the selected class
  loadSubjects({ classId: form.value.class_id });

  // Simple form initialization
  initializeForm();
};

const handleDurationTypeChange = () => {
  if (durationType.value === 'duration') {
    form.value.start_time = '';
    form.value.end_time = '';
  } else {
    form.value.duration_minutes = null;
  }
};

// Initialize form with exam data if editing
const initializeForm = () => {
  if (props.exam) {
    form.value = {
      name: props.exam.name,
      exam_type_id: props.exam.exam_type_id,
      academic_year: props.exam.academic_year,
      class_id: props.exam.class_id,
      section_id: props.exam.section_id || '',
      subject_id: props.exam.subject_id || '',
      max_marks: props.exam.max_marks,
      weightage: props.exam.weightage,
      exam_date: props.exam.exam_date,
      start_time: props.exam.start_time || '',
      end_time: props.exam.end_time || '',
      duration_minutes: props.exam.duration_minutes || null,
      status: props.exam.status,
      instructions: props.exam.instructions || ''
    };

    // Set duration type based on existing data
    if (props.exam.duration_minutes) {
      durationType.value = 'duration';
    } else {
      durationType.value = 'time_range';
    }
  } else {
    // Set default academic year to current year if available
    const currentYear = academicYears.value.find(year => year.is_current);
    if (currentYear) {
      form.value.academic_year = currentYear.name;
    } else if (academicYears.value.length > 0) {
      form.value.academic_year = academicYears.value[0].name;
    }
  }
};

// Lifecycle
onMounted(async () => {
  await Promise.all([fetchAcademicYears(), loadSubjects()]);
  initializeForm();
});

// Watch for exam prop changes
watch(
  () => props.exam,
  () => {
    initializeForm();
  },
  { immediate: true }
);
</script>
