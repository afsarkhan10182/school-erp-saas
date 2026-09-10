<template>
  <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-xs overflow-hidden">
    <div v-if="loading" class="py-12 text-center">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">Loading records...</p>
    </div>
    <div v-else-if="items.length === 0" class="py-12 text-center">
      <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center mx-auto mb-3 text-gray-400">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p class="text-sm font-medium text-gray-600 dark:text-gray-300">No records found</p>
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">There is no data to display right now.</p>
    </div>
    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700/80">
        <thead class="bg-gray-50/80 dark:bg-gray-700/50">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              class="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700/60">
          <tr
            v-for="(item, index) in paginatedItems"
            :key="index"
            class="hover:bg-gray-50/75 dark:hover:bg-gray-700/40 transition-colors"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              class="px-6 py-4 text-sm text-gray-900 dark:text-gray-100"
            >
              <span v-if="column.key.includes('.')">
                {{ getNestedValue(item, column.key) }}
              </span>
              <span v-else-if="column.key === 'date'">
                {{ formatDate(item[column.key]) }}
              </span>
              <span v-else-if="column.key === 'status'">
                <StatusBadge :status="item[column.key]" :type="getStatusType(item)" />
              </span>
              <span v-else>
                {{ item[column.key] || '-' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination using common component -->
    <Pagination
      v-if="pagination && pagination.total > 0"
      :pagination="pagination"
      @page-changed="$emit('page-change', $event)"
      @page-size-changed="$emit('page-size-change', $event)"
      item-label="records"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import StatusBadge from '~/components/ui/StatusBadge.vue';
import Pagination from '~/components/ui/Pagination.vue';

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

defineEmits(['page-change', 'page-size-change']);

const paginatedItems = computed(() => {
  if (props.pagination) {
    return props.items;
  }
  return props.items;
});

// Removed old pagination logic - now handled by common Pagination component

const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : '';
  }, obj);
};

const formatDate = date => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN');
};

const getStatusType = item => {
  // Determine status badge type based on item context
  if (
    item.attendance_type !== undefined ||
    item.session_id !== undefined ||
    (item.status && ['present', 'absent', 'late', 'excused'].includes(item.status))
  )
    return 'attendance';
  if (item.invoice_id !== undefined) return 'invoice';
  if (item.payment_id !== undefined) return 'payment';
  return 'general';
};
</script>
