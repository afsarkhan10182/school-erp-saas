<template>
  <nav
    v-if="items.length > 0"
    class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4 overflow-x-auto scrollbar-hide"
    aria-label="Breadcrumb"
  >
    <template v-for="(item, index) in items" :key="index">
      <div class="flex items-center gap-2 flex-shrink-0">
        <NuxtLink
          v-if="item.path && index !== items.length - 1"
          :to="item.path"
          class="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5"
        >
          <Home v-if="index === 0" class="w-4 h-4" />
          <span v-else>{{ item.label }}</span>
        </NuxtLink>
        <span v-else class="text-gray-900 dark:text-white font-medium flex items-center gap-1.5">
          <Home v-if="index === 0" class="w-4 h-4" />
          <span v-else>{{ item.label }}</span>
        </span>
        <ChevronRight
          v-if="index < items.length - 1"
          class="w-4 h-4 text-gray-300 dark:text-gray-600"
        />
      </div>
    </template>
  </nav>
</template>

<script setup>
import { Home, ChevronRight } from 'lucide-vue-next';

defineProps({
  items: {
    type: Array,
    default: () => []
  }
});
</script>
