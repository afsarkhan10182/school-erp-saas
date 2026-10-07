<template>
  <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
    <!-- Icon -->
    <div
      class="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4"
    >
      <slot name="icon">
        <component v-if="icon" :is="icon" class="w-10 h-10 text-gray-400" />
        <svg
          v-else
          class="w-10 h-10 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </slot>
    </div>

    <!-- Title -->
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      {{ title }}
    </h3>

    <!-- Description -->
    <p class="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
      {{ description }}
    </p>

    <!-- Action -->
    <div v-if="$slots.action || actionLabel" class="flex items-center gap-3">
      <slot name="action">
        <button v-if="actionLabel" @click="$emit('action')" class="btn btn-primary">
          <Plus v-if="showActionIcon" class="w-4 h-4" />
          {{ actionLabel }}
        </button>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { Plus } from 'lucide-vue-next';

defineProps({
  title: {
    type: String,
    default: 'No records found'
  },
  description: {
    type: String,
    default: 'Click the button above to add your first record.'
  },
  actionLabel: {
    type: String,
    default: ''
  },
  showActionIcon: {
    type: Boolean,
    default: true
  },
  icon: {
    type: [Object, Function],
    default: null
  }
});

defineEmits(['action']);
</script>
