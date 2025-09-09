<template>
  <div class="container mx-auto py-8 max-w-7xl">
    <!-- Clean Header -->
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ schoolName }}</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          School subscription and module management
        </p>
      </div>
      <div class="flex gap-3">
        <NuxtLink :to="`/saas/schools/${$route.params.id}/modules`" class="btn-primary">
          🔧 Manage Modules
        </NuxtLink>
        <NuxtLink :to="`/saas/schools/${$route.params.id}/edit`" class="btn-secondary">
          Edit School
        </NuxtLink>
        <NuxtLink to="/saas" class="btn-secondary"> Back to List </NuxtLink>
      </div>
    </div>

    <SubscriptionDetails
      :school-id="$route.params.id"
      :edit-school-url="`/saas/schools/${$route.params.id}/edit`"
      :transactions-url="`/saas/schools/${$route.params.id}/transactions`"
      :title="null"
      :subtitle="null"
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
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '~/stores/auth';
import { useToast } from '~/composables/useToast';
import { useSubscriptions } from '~/composables/useSubscriptions';

// Page meta
definePageMeta({
  layout: 'default'
});

const route = useRoute();
const authStore = useAuthStore();
const { showError, showSuccess } = useToast();
const { getSchoolWithSubscription } = useSubscriptions();

// Reactive data
const school = ref(null);
const schoolName = ref('Loading...');

// Access control - only Super Admin can access subscription details
const user = authStore.user;
if (user?.role !== 'super_admin') {
  showError('Access denied. Only Super Admin can view subscription details.');
  await navigateTo('/dashboard');
}

// Load school details for the header
const loadSchoolDetails = async () => {
  try {
    const schoolData = await getSchoolWithSubscription(route.params.id);
    if (schoolData) {
      school.value = schoolData;
      schoolName.value = `${schoolData.name} - ${schoolData.code}`;
    } else {
      schoolName.value = 'School Not Found';
    }
  } catch (error) {
    console.error('Error loading school details:', error);
    schoolName.value = 'Error Loading School';
  }
};

// Event handlers
const handleDataLoaded = data => {
  console.log('Subscription data loaded:', data);
};

const handleRenewalRequested = data => {
  showSuccess('Renewal request submitted successfully');
  console.log('Renewal requested:', data);
};

// Load school details on mount
onMounted(() => {
  loadSchoolDetails();
});
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
