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
import Pagination from '~/components/Pagination.vue';

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
