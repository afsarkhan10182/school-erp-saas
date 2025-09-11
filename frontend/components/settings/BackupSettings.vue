<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <span class="ml-3 text-gray-600 dark:text-gray-400">Loading backup settings...</span>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <div class="text-center py-12">
        <div
          class="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6"
        >
          <Download class="w-12 h-12 text-gray-400" />
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Backup & Export Settings
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          Manage data backups, exports, and system maintenance
        </p>
        <div
          class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
        >
          <p class="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Coming Soon:</strong> Automated backup scheduling, data export options, and
            system maintenance tools will be available in a future update.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Download } from 'lucide-vue-next';

// Props
const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['save', 'update:loading']);
</script>
