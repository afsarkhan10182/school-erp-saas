<template>
  <div class="mb-4">
    <!-- Tab Navigation -->
    <div
      class="bg-white dark:bg-gray-800 rounded-t-lg border border-gray-200 dark:border-gray-700 border-b-0"
    >
      <div class="overflow-x-auto scrollbar-hide">
        <nav class="flex px-6 min-w-max relative" aria-label="Tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="$emit('tab-change', tab.id)"
            :disabled="loadingStates[tab.id]"
            :class="[
              'whitespace-nowrap py-3 px-4 font-medium text-sm flex items-center flex-shrink-0 relative border-b-2',
              'mr-6 last:mr-0',
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400',
              loadingStates[tab.id] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            ]"
          >
            <component :is="tab.icon" class="w-4 h-4 lg:w-5 lg:h-5 mr-2 flex-shrink-0" />
            <span class="truncate">{{ tab.name }}</span>
            <!-- Loading indicator -->
            <span
              v-if="loadingStates[tab.id]"
              class="ml-1 lg:ml-2 h-3 w-3 lg:h-4 lg:w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 flex-shrink-0"
            ></span>
          </button>
        </nav>
      </div>
      <!-- Bottom border line -->
      <div class="border-b border-gray-200 dark:border-gray-700"></div>
    </div>

    <!-- Content Container -->
    <div
      class="bg-white dark:bg-gray-800 rounded-b-lg border border-gray-200 dark:border-gray-700 border-t-0"
    >
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  tabs: {
    type: Array,
    required: true
  },
  activeTab: {
    type: String,
    required: true
  },
  loadingStates: {
    type: Object,
    default: () => ({})
  }
});

defineEmits(['tab-change']);
</script>

<style scoped>
/* Hide scrollbar but keep functionality */
.scrollbar-hide {
  -ms-overflow-style: none; /* Internet Explorer 10+ */
  scrollbar-width: none; /* Firefox */
  scroll-behavior: smooth; /* Smooth scrolling */
}
.scrollbar-hide::-webkit-scrollbar {
  display: none; /* Safari and Chrome */
}

/* Add subtle shadow to indicate scrollable content */
.overflow-x-auto {
  position: relative;
}

/* Gradient fade effect on the right to indicate more content */
.overflow-x-auto::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 20px;
  height: 100%;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.8));
  pointer-events: none;
  z-index: 1;
}

.dark .overflow-x-auto::after {
  background: linear-gradient(to right, transparent, rgba(31, 41, 55, 0.8));
}

/* Hide gradient when not needed */
@media (min-width: 1024px) {
  .overflow-x-auto::after {
    display: none;
  }
}

/* Make sure the border container has proper positioning */
nav {
  position: relative;
  z-index: 1;
}
</style>
