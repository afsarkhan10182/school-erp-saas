<template>
  <div
    v-if="pagination.total > 0"
    class="bg-white dark:bg-gray-800 px-4 py-4 border-t border-gray-200 dark:border-gray-700 md:px-6"
  >
    <!-- Desktop Layout: All in one line -->
    <div class="hidden sm:flex items-center justify-between">
      <!-- Page Size Selector (Left) -->
      <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-700 dark:text-gray-300">Show</span>
        <EnhancedDropdown
          v-model="localPageSize"
          :options="pageSizeOptions"
          :aria-label="`Items per page`"
          class="w-20"
          @change="onPageSizeChange"
        />
        <span class="text-sm text-gray-700 dark:text-gray-300">{{ itemLabel }} per page</span>
      </div>

      <!-- Page Info (Center) -->
      <div class="text-center">
        <p class="text-sm text-gray-700 dark:text-gray-300">
          Showing <span class="font-medium">{{ startItem }}</span> to
          <span class="font-medium">{{ endItem }}</span> of
          <span class="font-medium">{{ pagination.total }}</span> {{ itemLabel
          }}{{ additionalInfo ? ` (${additionalInfo})` : '' }}
        </p>
      </div>

      <!-- Pagination Navigation (Right) -->
      <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
        <button
          @click="previousPage"
          :disabled="pagination.page === 1"
          class="relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          Previous
        </button>

        <template v-for="page in visiblePages" :key="page">
          <button
            v-if="page !== '...'"
            @click="goToPage(page)"
            :class="[
              page === pagination.page
                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600 dark:bg-indigo-900 dark:border-indigo-400 dark:text-indigo-300'
                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700',
              'relative inline-flex items-center px-4 py-2 border text-sm font-medium'
            ]"
          >
            {{ page }}
          </button>
          <span
            v-else
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
          >
            ...
          </span>
        </template>

        <button
          @click="nextPage"
          :disabled="pagination.page >= totalPages"
          class="relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          Next
        </button>
      </nav>
    </div>

    <!-- Mobile Layout: Stacked vertically -->
    <div class="sm:hidden space-y-4">
      <!-- Page Size Selector -->
      <div class="flex items-center justify-center">
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-700 dark:text-gray-300">Show</span>
          <EnhancedDropdown
            v-model="localPageSize"
            :options="pageSizeOptions"
            :aria-label="`Items per page`"
            class="w-20"
            @change="onPageSizeChange"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">{{ itemLabel }} per page</span>
        </div>
      </div>

      <!-- Page Info -->
      <div class="text-center">
        <p class="text-sm text-gray-700 dark:text-gray-300">
          Showing <span class="font-medium">{{ startItem }}</span> to
          <span class="font-medium">{{ endItem }}</span> of
          <span class="font-medium">{{ pagination.total }}</span> {{ itemLabel
          }}{{ additionalInfo ? ` (${additionalInfo})` : '' }}
        </p>
      </div>

      <!-- Pagination Navigation -->
      <div class="flex justify-center">
        <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
          <button
            @click="previousPage"
            :disabled="pagination.page === 1"
            class="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Previous
          </button>

          <template v-for="page in visiblePages" :key="page">
            <button
              v-if="page !== '...'"
              @click="goToPage(page)"
              :class="[
                page === pagination.page
                  ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600 dark:bg-indigo-900 dark:border-indigo-400 dark:text-indigo-300'
                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700',
                'relative inline-flex items-center px-3 py-2 border text-sm font-medium'
              ]"
            >
              {{ page }}
            </button>
            <span
              v-else
              class="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
            >
              ...
            </span>
          </template>

          <button
            @click="nextPage"
            :disabled="pagination.page >= totalPages"
            class="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Next
          </button>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import EnhancedDropdown from './EnhancedDropdown.vue';

const props = defineProps({
  pagination: {
    type: Object,
    required: true
  },
  itemLabel: {
    type: String,
    default: 'items'
  },
  additionalInfo: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['page-changed', 'page-size-changed']);

// Local page size state - ensure it's a valid option value
const getInitialPageSize = () => {
  const limit = parseInt(props.pagination.limit) || 10;
  // Ensure it's one of the valid options: 10, 25, 50, 100
  const validOptions = [10, 25, 50, 100];
  return validOptions.includes(limit) ? limit : 10;
};

const localPageSize = ref(getInitialPageSize());
const pageSizeOptions = [10, 25, 50, 100].map(value => ({ value, label: String(value) }));

// Watch for external page size changes
watch(
  () => props.pagination.limit,
  newLimit => {
    const newPageSize = getInitialPageSize();
    localPageSize.value = newPageSize;
  }
);

const totalPages = computed(() => {
  return props.pagination.totalPages || Math.ceil(props.pagination.total / props.pagination.limit);
});

const visiblePages = computed(() => {
  const current = props.pagination.page;
  const total = totalPages.value;
  const pages = [];

  if (total <= 7) {
    // For small page counts, show all pages
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    // For larger page counts, show: 1, 2, 3, 4, 5, ..., last
    for (let i = 1; i <= 5; i++) {
      pages.push(i);
    }
    if (total > 5) {
      pages.push('...');
      pages.push(total);
    }
  }

  return pages;
});

const startItem = computed(() => {
  return (props.pagination.page - 1) * props.pagination.limit + 1;
});

const endItem = computed(() => {
  return Math.min(props.pagination.page * props.pagination.limit, props.pagination.total);
});

const previousPage = () => {
  if (props.pagination.page > 1) {
    emit('page-changed', props.pagination.page - 1);
  }
};

const nextPage = () => {
  if (props.pagination.page < totalPages.value) {
    emit('page-changed', props.pagination.page + 1);
  }
};

const goToPage = page => {
  if (page !== props.pagination.page) {
    emit('page-changed', page);
  }
};

const onPageSizeChange = () => {
  emit('page-size-changed', parseInt(localPageSize.value));
};
</script>
