<template>
  <div>
    <SubscriptionDetails 
      :school-id="$route.params.id"
      :edit-school-url="`/saas/schools/${$route.params.id}`"
      :transactions-url="`/saas/schools/${$route.params.id}/transactions`"
      title="Subscription Details"
      :subtitle="`${school?.name} - ${school?.code}`"
      plan-section-title="Plan Information"
      limits-section-title="Plan Limits"
      modules-section-title="Available Modules"
      transactions-section-title="Recent Transactions"
      renewal-requests-section-title="Renewal Requests"
      :can-request-renewal="false"
      @data-loaded="handleDataLoaded"
      @renewal-requested="handleRenewalRequested"
    />
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router';
import { useAuthStore } from '~/stores/auth';
import { useToast } from '~/composables/useToast';

// Page meta
definePageMeta({
  layout: 'default'
});

const route = useRoute();
const authStore = useAuthStore();
const { showError, showSuccess } = useToast();

// Access control - only Super Admin can access subscription details
const user = authStore.user;
if (user?.role !== 'super_admin') {
  showError('Access denied. Only Super Admin can view subscription details.');
  await navigateTo('/dashboard');
}

// Event handlers
const handleDataLoaded = (data) => {
  console.log('Subscription data loaded:', data);
};

const handleRenewalRequested = (data) => {
  showSuccess('Renewal request submitted successfully');
  console.log('Renewal requested:', data);
};
</script>

<style scoped>
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500;
}

.input-field {
  @apply block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white sm:text-sm;
}
</style> 