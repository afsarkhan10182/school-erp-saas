<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6"
  >
    <!-- Header -->
    <div class="flex items-center mb-4" v-if="title || $slots.header">
      <div class="flex items-center">
        <svg
          class="w-5 h-5 text-blue-600 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          ></path>
        </svg>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          {{ title || 'Filter Options' }}
        </h3>
      </div>
      <slot name="header" />
    </div>

    <!-- Description -->
    <p v-if="description" class="text-sm text-gray-600 dark:text-gray-400 mb-4">
      {{ description }}
    </p>

    <!-- Filter Content -->
    <div class="space-y-4">
      <slot />
    </div>

    <!-- Actions -->
    <div
      v-if="$slots.actions"
      class="flex items-center justify-between pt-4 mt-4 border-t border-gray-200 dark:border-gray-700"
    >
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
  description?: string;
}

withDefaults(defineProps<Props>(), {
  title: 'Filter Options'
});
</script>

<style scoped>
/* Additional filter card styling if needed */
</style>
