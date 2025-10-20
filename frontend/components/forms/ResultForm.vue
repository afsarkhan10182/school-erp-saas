<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Student Info -->
    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
      <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Student</h4>
      <p class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ result?.student?.first_name }} {{ result?.student?.last_name }}
      </p>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        {{ result?.student?.admission_number }}
      </p>
    </div>

    <!-- Marks -->
    <div>
      <FormField
        v-model="form.marks_obtained"
        label="Marks Obtained"
        type="number"
        :max="exam.max_marks"
        min="0"
        step="0.01"
        :error="errors.marks_obtained"
        required
        :disabled="form.is_absent"
      />
    </div>

    <!-- Absent Status -->
    <div>
      <label class="flex items-center">
        <input
          v-model="form.is_absent"
          type="checkbox"
          class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          @change="handleAbsentChange"
        />
        <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >Student was absent</span
        >
      </label>
    </div>

    <!-- Remarks -->
    <div>
      <FormField
        v-model="form.remarks"
        label="Remarks (Optional)"
        type="textarea"
        placeholder="Enter any remarks about the student's performance..."
        :error="errors.remarks"
        rows="3"
      />
    </div>

    <!-- Form Actions -->
    <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
      <button
        type="button"
        @click="$emit('cancel')"
        class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Cancel
      </button>
      <button
        type="submit"
        :disabled="loading"
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="loading" class="inline-flex items-center">
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
          Saving...
        </span>
        <span v-else>Update Result</span>
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useToast } from '~/composables/useToast';
import FormField from '~/components/ui/FormField.vue';

// Props
const props = defineProps({
  result: {
    type: Object,
    default: null
  },
  exam: {
    type: Object,
    required: true
  }
});

// Emits
const emit = defineEmits(['submit', 'cancel']);

// Composables
const { showToast } = useToast();

// Reactive data
const loading = ref(false);
const errors = ref({});

// Form data
const form = ref({
  marks_obtained: 0,
  is_absent: false,
  remarks: ''
});

// Methods
const validateForm = () => {
  errors.value = {};

  if (
    !form.value.is_absent &&
    (form.value.marks_obtained === null || form.value.marks_obtained === undefined)
  ) {
    errors.value.marks_obtained = 'Marks are required when student is present';
  }

  if (form.value.marks_obtained < 0) {
    errors.value.marks_obtained = 'Marks cannot be negative';
  }

  if (form.value.marks_obtained > props.exam.max_marks) {
    errors.value.marks_obtained = `Marks cannot exceed ${props.exam.max_marks}`;
  }

  return Object.keys(errors.value).length === 0;
};

const handleSubmit = async () => {
  if (!validateForm()) {
    showToast('error', 'Please fix the errors in the form');
    return;
  }

  loading.value = true;

  try {
    // Calculate percentage and grade
    const percentage = form.value.is_absent
      ? 0
      : (form.value.marks_obtained / props.exam.max_marks) * 100;
    const grade = calculateGrade(percentage);
    const grade_points = calculateGradePoints(grade);

    const submitData = {
      ...form.value,
      percentage,
      grade,
      grade_points
    };

    emit('submit', submitData);
  } catch (error) {
    showToast('error', 'Failed to save result');
    console.error('Error saving result:', error);
  } finally {
    loading.value = false;
  }
};

const handleAbsentChange = () => {
  if (form.value.is_absent) {
    form.value.marks_obtained = 0;
  }
};

const calculateGrade = percentage => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  if (percentage >= 35) return 'D';
  return 'F';
};

const calculateGradePoints = grade => {
  const gradePoints = {
    'A+': 4.0,
    A: 3.75,
    'B+': 3.5,
    B: 3.25,
    'C+': 3.0,
    C: 2.75,
    D: 2.5,
    F: 0.0
  };
  return gradePoints[grade] || 0.0;
};

// Initialize form with result data
const initializeForm = () => {
  if (props.result) {
    form.value = {
      marks_obtained: props.result.marks_obtained || 0,
      is_absent: props.result.is_absent || false,
      remarks: props.result.remarks || ''
    };
  }
};

// Watch for result prop changes
watch(
  () => props.result,
  () => {
    initializeForm();
  },
  { immediate: true }
);
</script>
