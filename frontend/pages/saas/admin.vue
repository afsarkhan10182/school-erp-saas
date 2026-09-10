<template>
  <div class="container mx-auto py-8 max-w-4xl">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Subscription Management</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        Manage subscription plans and school statuses
      </p>
    </div>

    <!-- Status Update Section -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Bulk Status Updates</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Check and update subscription statuses for all schools based on their end dates.
      </p>

      <button
        @click="checkAllStatuses"
        :disabled="isChecking"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        <svg
          v-if="isChecking"
          class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        {{ isChecking ? 'Checking Statuses...' : 'Check All Subscription Statuses' }}
      </button>

      <!-- Results -->
      <div v-if="statusUpdateResult" class="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Update Results</h3>
        <div class="text-sm text-gray-600 dark:text-gray-400">
          <p>Total schools checked: {{ statusUpdateResult.totalChecked }}</p>
          <p>Schools updated: {{ statusUpdateResult.updatedCount }}</p>
          <p class="text-green-600 dark:text-green-400">{{ statusUpdateResult.message }}</p>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div class="space-y-3">
          <NuxtLink
            to="/saas/plans"
            class="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Manage Subscription Plans
          </NuxtLink>
          <NuxtLink
            to="/saas"
            class="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Manage Schools & Subscriptions
          </NuxtLink>
          <NuxtLink
            to="/saas/renewal-requests"
            class="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Review Renewal Requests
          </NuxtLink>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">System Information</h3>
        <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p><strong>Status Types:</strong></p>
          <ul class="list-disc list-inside space-y-1 ml-4">
            <li>
              <span class="text-indigo-600 dark:text-indigo-400">Trial:</span> Schools on trial plans
            </li>
            <li>
              <span class="text-green-600 dark:text-green-400">Active:</span> Schools with active
              subscriptions
            </li>
            <li>
              <span class="text-red-600 dark:text-red-400">Expired:</span> Schools with expired
              subscriptions
            </li>
            <li>
              <span class="text-purple-600 dark:text-purple-400">Lifetime:</span> Schools with
              lifetime plans
            </li>
            <li>
              <span class="text-yellow-600 dark:text-yellow-400">Suspended:</span> Manually
              suspended schools
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useSubscriptions } from '~/composables/useSubscriptions';
import { useAuth } from '~/composables/useAuth';
import { useToast } from '~/composables/useToast';

const { isSuperAdmin } = useAuth();
const { showSuccess, showError } = useToast();

// Access control - only Super Admin can access this page
if (!isSuperAdmin.value) {
  showError('Access denied. Only Super Admin can access subscription management.');
  await navigateTo('/dashboard');
}

const { checkAndUpdateAllStatuses } = useSubscriptions();
const isChecking = ref(false);
const statusUpdateResult = ref(null);

const checkAllStatuses = async () => {
  isChecking.value = true;
  try {
    const result = await checkAndUpdateAllStatuses();
    statusUpdateResult.value = result.data;
    showSuccess('Subscription statuses updated successfully!');
  } catch (error) {
    console.error('Error checking statuses:', error);
    showError('Failed to check subscription statuses. Please try again.');
  } finally {
    isChecking.value = false;
  }
};
</script>
