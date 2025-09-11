<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <span class="ml-3 text-gray-600 dark:text-gray-400">Loading academic settings...</span>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Basic Attendance Settings -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Attendance Settings
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
              >Minimum Attendance %</label
            >
            <input
              v-model="attendanceSettings.minimumPercentage"
              type="number"
              :class="['input-field', fieldErrors.minimumPercentage ? 'border-red-500' : '']"
              min="0"
              max="100"
              placeholder="75"
            />
            <p v-if="fieldErrors.minimumPercentage" class="mt-1 text-xs text-red-600">
              {{ fieldErrors.minimumPercentage }}
            </p>
            <p v-else class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Minimum attendance required for students
            </p>
          </div>
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
              >Attendance Cut-off Time</label
            >
            <input
              v-model="attendanceSettings.cutoffTime"
              type="time"
              :class="['input-field', fieldErrors.cutoffTime ? 'border-red-500' : '']"
            />
            <p v-if="fieldErrors.cutoffTime" class="mt-1 text-xs text-red-600">
              {{ fieldErrors.cutoffTime }}
            </p>
            <p v-else class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Latest time to mark attendance
            </p>
          </div>
        </div>

        <!-- Simple Rules -->
        <div class="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
          <h4 class="text-md font-medium text-gray-900 dark:text-white mb-3">Attendance Rules</h4>
          <div class="space-y-3">
            <div class="flex items-center">
              <input
                v-model="attendanceSettings.enforceCutoffTime"
                type="checkbox"
                class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Enforce cut-off time (prevent late attendance marking)
              </label>
            </div>
            <div class="flex items-center">
              <input
                v-model="attendanceSettings.enforceWorkingDays"
                type="checkbox"
                class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Enforce working days (prevent weekend attendance marking)
              </label>
            </div>
          </div>
        </div>

        <!-- Working Days (only show if enforce working days is checked) -->
        <div
          v-if="attendanceSettings.enforceWorkingDays"
          class="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4"
        >
          <h4 class="text-md font-medium text-gray-900 dark:text-white mb-3">
            School Working Days
          </h4>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Select which days your school operates
          </p>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="flex items-center">
              <input
                v-model="attendanceSettings.workingDays.monday"
                type="checkbox"
                class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label class="ml-2 text-sm text-gray-700 dark:text-gray-300">Monday</label>
            </div>
            <div class="flex items-center">
              <input
                v-model="attendanceSettings.workingDays.tuesday"
                type="checkbox"
                class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label class="ml-2 text-sm text-gray-700 dark:text-gray-300">Tuesday</label>
            </div>
            <div class="flex items-center">
              <input
                v-model="attendanceSettings.workingDays.wednesday"
                type="checkbox"
                class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label class="ml-2 text-sm text-gray-700 dark:text-gray-300">Wednesday</label>
            </div>
            <div class="flex items-center">
              <input
                v-model="attendanceSettings.workingDays.thursday"
                type="checkbox"
                class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label class="ml-2 text-sm text-gray-700 dark:text-gray-300">Thursday</label>
            </div>
            <div class="flex items-center">
              <input
                v-model="attendanceSettings.workingDays.friday"
                type="checkbox"
                class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label class="ml-2 text-sm text-gray-700 dark:text-gray-300">Friday</label>
            </div>
            <div class="flex items-center">
              <input
                v-model="attendanceSettings.workingDays.saturday"
                type="checkbox"
                class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label class="ml-2 text-sm text-gray-700 dark:text-gray-300">Saturday</label>
            </div>
            <div class="flex items-center">
              <input
                v-model="attendanceSettings.workingDays.sunday"
                type="checkbox"
                class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label class="ml-2 text-sm text-gray-700 dark:text-gray-300">Sunday</label>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Summary -->
      <div v-if="hasErrors" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 class="text-sm font-medium text-red-800 mb-2">Please correct the following errors:</h4>
        <ul class="text-sm text-red-700 space-y-1">
          <li v-for="(error, field) in fieldErrors" :key="field">• {{ error }}</li>
        </ul>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end">
        <button @click="saveSettings" class="btn-primary" :disabled="isSaving || hasErrors">
          <span
            v-if="isSaving"
            class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
          ></span>
          {{ isSaving ? 'Saving...' : 'Save Settings' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useFormValidation } from '~/composables/useFormValidation';
import { validationRules, validateForm } from '~/utils/validators';

// Props
const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['save', 'update:loading']);

// Validation
const { fieldErrors, hasErrors, clearErrors, setFieldError, handleApiError } = useFormValidation();

// Reactive data
const attendanceSettings = reactive({
  minimumPercentage: 75,
  cutoffTime: '09:00',
  enforceCutoffTime: true,
  enforceWorkingDays: true,
  workingDays: {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false
  }
});

const isSaving = ref(false);

// Validation schema
const validationSchema = {
  minimumPercentage: [
    val => validationRules.required(val, 'Minimum Attendance Percentage'),
    val => {
      if (val < 0 || val > 100) {
        return 'Minimum attendance percentage must be between 0 and 100';
      }
      return null;
    }
  ],
  cutoffTime: [val => validationRules.required(val, 'Cut-off Time')]
};

// Methods
const saveSettings = async () => {
  // Clear previous errors
  clearErrors();

  // Validate form data
  const errors = validateForm(attendanceSettings, validationSchema);

  if (Object.keys(errors).length > 0) {
    // Set field errors
    Object.entries(errors).forEach(([field, message]) => {
      setFieldError(field, message);
    });
    return;
  }

  isSaving.value = true;
  try {
    const settingsData = {
      attendanceSettings
    };
    await emit('save', settingsData);
  } catch (error) {
    handleApiError(error);
  } finally {
    isSaving.value = false;
  }
};

// Expose methods for parent component
defineExpose({
  attendanceSettings,
  saveSettings
});
</script>
