<template>
  <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Receipt No
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Student
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Amount
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Payment Method
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Date
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Status
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr
            v-for="collection in collections"
            :key="collection.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <td
              class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"
            >
              {{ collection.receipt_number }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10">
                  <UserAvatar
                    :image-url="collection.student?.photo"
                    :user="collection.student"
                    size="md"
                    alt=""
                    container-class="h-10 w-10"
                    image-class="h-10 w-10 rounded-full"
                    fallback-class="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center"
                    initials-class="text-sm font-medium text-gray-700 dark:text-gray-300"
                  />
                </div>
                <div class="ml-4">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ collection.student?.first_name }} {{ collection.student?.last_name }}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {{ collection.student?.admission_number }}
                  </div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              ₹{{ collection.amount?.toLocaleString() }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              <span class="capitalize">{{ collection.payment_method }}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              {{ formatDate(collection.payment_date) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                :class="{
                  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200':
                    collection.status === 'completed',
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200':
                    collection.status === 'pending',
                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200':
                    collection.status === 'failed'
                }"
                class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
              >
                {{ collection.status }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button
                @click="$emit('view', collection)"
                class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
              >
                View
              </button>
              <button
                @click="$emit('print', collection)"
                class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
              >
                Print
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import UserAvatar from '~/components/shared/UserAvatar.vue';

defineProps({
  collections: {
    type: Array,
    default: () => []
  }
});

defineEmits(['view', 'print']);

const formatDate = date => {
  return new Date(date).toLocaleDateString('en-IN');
};
</script>
