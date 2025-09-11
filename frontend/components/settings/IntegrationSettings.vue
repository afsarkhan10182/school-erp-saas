<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <span class="ml-3 text-gray-600 dark:text-gray-400">Loading integration settings...</span>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <div class="text-center py-12">
        <div
          class="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6"
        >
          <Link class="w-12 h-12 text-gray-400" />
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Integration Settings</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          Connect with external services and third-party applications
        </p>
        <div
          class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
        >
          <p class="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Coming Soon:</strong> Integration with payment gateways, SMS providers, email
            services, and other third-party applications will be available in a future update.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Link } from 'lucide-vue-next';

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
