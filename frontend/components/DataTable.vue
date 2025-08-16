<template>
  <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
    <div v-if="loading" class="p-4 text-center">
      <div class="text-gray-500">Loading...</div>
    </div>
    <div v-else-if="items.length === 0" class="p-4 text-center">
      <div class="text-gray-500">No data found</div>
    </div>
    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th 
              v-for="column in columns" 
              :key="column.key"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr 
            v-for="(item, index) in paginatedItems" 
            :key="index" 
            class="hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <td 
              v-for="column in columns" 
              :key="column.key"
              class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
            >
              <span v-if="column.key.includes('.')">
                {{ getNestedValue(item, column.key) }}
              </span>
              <span v-else-if="column.key === 'date'">
                {{ formatDate(item[column.key]) }}
              </span>
              <span v-else-if="column.key === 'status'">
                <StatusBadge 
                  :status="item[column.key]" 
                  :type="getStatusType(item)"
                />
              </span>
              <span v-else>
                {{ item[column.key] || '-' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Pagination -->
    <div v-if="pagination && pagination.total > pagination.limit" class="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
      <div class="flex-1 flex justify-between sm:hidden">
        <button 
          @click="$emit('page-change', pagination.page - 1)"
          :disabled="pagination.page <= 1"
          class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button 
          @click="$emit('page-change', pagination.page + 1)"
          :disabled="pagination.page >= Math.ceil(pagination.total / pagination.limit)"
          class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
      <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-gray-700 dark:text-gray-300">
            Showing
            <span class="font-medium">{{ (pagination.page - 1) * pagination.limit + 1 }}</span>
            to
            <span class="font-medium">{{ Math.min(pagination.page * pagination.limit, pagination.total) }}</span>
            of
            <span class="font-medium">{{ pagination.total }}</span>
            results
          </p>
        </div>
        <div>
          <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button 
              @click="$emit('page-change', pagination.page - 1)"
              :disabled="pagination.page <= 1"
              class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button 
              v-for="page in paginationPages" 
              :key="page"
              @click="$emit('page-change', page)"
              :class="{
                'bg-blue-50 border-blue-500 text-blue-600': page === pagination.page,
                'bg-white border-gray-300 text-gray-500 hover:bg-gray-50': page !== pagination.page
              }"
              class="relative inline-flex items-center px-4 py-2 border text-sm font-medium"
            >
              {{ page }}
            </button>
            <button 
              @click="$emit('page-change', pagination.page + 1)"
              :disabled="pagination.page >= Math.ceil(pagination.total / pagination.limit)"
              class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import StatusBadge from '~/components/ui/StatusBadge.vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  columns: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  pagination: {
    type: Object,
    default: null
  }
});

defineEmits(['page-change']);

const paginatedItems = computed(() => {
  if (props.pagination) {
    return props.items;
  }
  return props.items;
});

const paginationPages = computed(() => {
  if (!props.pagination) return [];
  
  const totalPages = Math.ceil(props.pagination.total / props.pagination.limit);
  const currentPage = props.pagination.page;
  const pages = [];
  
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  return pages;
});

const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : '';
  }, obj);
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN');
}

const getStatusType = (item) => {
  // Determine status badge type based on item context
  if (item.attendance_type !== undefined) return 'attendance'
  if (item.invoice_id !== undefined) return 'invoice'
  if (item.payment_id !== undefined) return 'payment'
  return 'general'
}
</script>