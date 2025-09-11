<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <span class="ml-3 text-gray-600 dark:text-gray-400">Loading system preferences...</span>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Basic Preferences -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Preferences</h3>
        <div class="space-y-4">
          <div>
            <label class="block font-medium mb-2 text-gray-700 dark:text-gray-300"
              >Date Format</label
            >
            <select v-model="systemSettings.dateFormat" class="input-field">
              <option value="MM/DD/YYYY">MM/DD/YYYY (US Format)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (UK Format)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Format)</option>
            </select>
            <p class="text-sm text-gray-500 mt-1">
              How dates will be displayed throughout the system
            </p>
          </div>

          <div>
            <label class="block font-medium mb-2 text-gray-700 dark:text-gray-300"
              >Items Per Page</label
            >
            <select v-model="systemSettings.itemsPerPage" class="input-field">
              <option value="10">10 items</option>
              <option value="25">25 items</option>
              <option value="50">50 items</option>
            </select>
            <p class="text-sm text-gray-500 mt-1">Number of items to show in lists and tables</p>
          </div>

          <div class="flex items-center">
            <input
              v-model="systemSettings.showNotifications"
              type="checkbox"
              id="showNotifications"
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label for="showNotifications" class="ml-2 text-sm text-gray-700 dark:text-gray-300"
              >Show system notifications</label
            >
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end">
        <button @click="saveSettings" class="btn-primary" :disabled="isSaving">
          <span
            v-if="isSaving"
            class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
          ></span>
          {{ isSaving ? 'Saving...' : 'Save System Settings' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { Settings } from '~/api/administration/settings';

// Props
const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['save', 'update:loading']);

// Reactive data
const systemSettings = reactive({
  dateFormat: 'MM/DD/YYYY',
  itemsPerPage: 25,
  showNotifications: true
});

const isSaving = ref(false);
const isLoading = ref(false);

// Methods
const loadSystemSettings = async () => {
  try {
    isLoading.value = true;
    const response = await Settings.getSystemSettings();

    if (response.success && response.data) {
      const data = response.data;
      if (data.systemSettings) {
        Object.assign(systemSettings, data.systemSettings);
      }
    }
  } catch (error) {
    console.error('Error loading system settings:', error);
  } finally {
    isLoading.value = false;
  }
};

const saveSettings = async () => {
  isSaving.value = true;
  try {
    await emit('save', systemSettings);
  } finally {
    isSaving.value = false;
  }
};

// Load data on mount
onMounted(() => {
  loadSystemSettings();
});

// Expose methods for parent component
defineExpose({
  systemSettings,
  saveSettings,
  loadSystemSettings
});
</script>
