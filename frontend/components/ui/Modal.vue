<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    @click="$emit('close')"
  >
    <div
      class="relative top-20 mx-auto p-5 border w-full shadow-lg rounded-md bg-white dark:bg-gray-800"
      :class="sizeClasses"
      @click.stop
    >
      <div class="mt-3">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex-1">
            <slot name="header"></slot>
          </div>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="mb-4">
          <slot name="body"></slot>
        </div>

        <!-- Footer -->
        <div class="flex justify-end space-x-3">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'md',
    validator: value =>
      ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl'].includes(value)
  }
});

defineEmits(['close']);

// Computed property for size classes
const sizeClasses = computed(() => {
  const sizes = {
    sm: 'max-w-sm', // 384px
    md: 'max-w-md', // 448px
    lg: 'max-w-lg', // 512px
    xl: 'max-w-xl', // 576px
    '2xl': 'max-w-2xl', // 672px
    '3xl': 'max-w-3xl', // 768px
    '4xl': 'max-w-4xl', // 896px
    '5xl': 'max-w-5xl', // 1024px
    '6xl': 'max-w-6xl', // 1152px
    '7xl': 'max-w-7xl' // 1280px
  };
  return sizes[props.size] || sizes.md;
});
</script>
