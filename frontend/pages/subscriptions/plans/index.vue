<template>
  <div class="container mx-auto py-8">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Subscription Plans</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">Manage all available subscription plans</p>
      </div>
      <NuxtLink to="/subscriptions/plans/create" class="btn-primary">Add Plan</NuxtLink>
    </div>

    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600 dark:text-gray-400">Loading plans...</p>
    </div>
    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
          <p class="mt-1 text-sm text-red-700 dark:text-red-300">{{ error }}</p>
        </div>
      </div>
    </div>
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cycle</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Limits</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="plan in plans" :key="plan.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">{{ plan.name }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">{{ plan.code }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">₹{{ plan.price }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{{ plan.billing_cycle }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                <div>Students: {{ plan.max_students }}</div>
                <div>Branches: {{ plan.max_branches }}</div>
                <div>Staff: {{ plan.max_staff }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="plan.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                  {{ plan.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                  <NuxtLink :to="`/subscriptions/plans/${plan.id}/edit`" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300">Edit</NuxtLink>
                  <button @click="deletePlanConfirm(plan.id)" class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Delete Plan?</h3>
        <p class="text-gray-700 dark:text-gray-300 mb-4">Are you sure you want to delete this plan? This action cannot be undone.</p>
        <div class="flex justify-end gap-3">
          <button @click="showDeleteModal = false" class="btn-secondary">Cancel</button>
          <button @click="deletePlanAction" class="btn-primary">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { useSubscriptions } from '~/composables/useSubscriptions';

const { plans, loading, error, fetchPlans, deletePlan } = useSubscriptions();
const showDeleteModal = ref(false);
const planToDelete = ref(null);

const fetchAllPlans = async () => {
  await fetchPlans();
};

const deletePlanConfirm = (id) => {
  planToDelete.value = id;
  showDeleteModal.value = true;
};

const deletePlanAction = async () => {
  if (planToDelete.value) {
    await deletePlan(planToDelete.value);
    showDeleteModal.value = false;
    planToDelete.value = null;
    fetchAllPlans();
  }
};

onMounted(fetchAllPlans);

useHead({ title: 'Subscription Plans - School ERP' });
</script>
<style scoped>
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}
.btn-secondary {
  @apply bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500;
}
</style> 