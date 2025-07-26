<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">Subscription Limits</h3>
      <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-500 dark:text-gray-400">Current Plan:</span>
        <span class="px-2 py-1 text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
          {{ usageData?.current_plan || 'Unknown' }}
        </span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading subscription data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
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

    <!-- Usage Data -->
    <div v-else-if="usageData" class="space-y-6">
      <!-- Current Usage -->
      <div>
        <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">Current Usage</h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Students -->
          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Students</span>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ usageData.current_usage.students }} / {{ usageData.plan_details.max_students === -1 ? '∞' : usageData.plan_details.max_students }}
              </span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div 
                class="h-2 rounded-full transition-all duration-300"
                :class="getUsageBarClass(usageData.usage_percentages.students, usageData.limits_exceeded.students)"
                :style="{ width: `${Math.min(usageData.usage_percentages.students, 100)}%` }"
              ></div>
            </div>
            <div class="flex items-center justify-between mt-2">
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ usageData.usage_percentages.students }}% used</span>
              <span v-if="usageData.limits_exceeded.students" class="text-xs text-red-600 dark:text-red-400 font-medium">Limit Exceeded</span>
            </div>
          </div>

          <!-- Staff -->
          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Staff</span>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ usageData.current_usage.users }} / {{ usageData.plan_details.max_staff === -1 ? '∞' : usageData.plan_details.max_staff }}
              </span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div 
                class="h-2 rounded-full transition-all duration-300"
                :class="getUsageBarClass(usageData.usage_percentages.users, usageData.limits_exceeded.users)"
                :style="{ width: `${Math.min(usageData.usage_percentages.users, 100)}%` }"
              ></div>
            </div>
            <div class="flex items-center justify-between mt-2">
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ usageData.usage_percentages.users }}% used</span>
              <span v-if="usageData.limits_exceeded.users" class="text-xs text-red-600 dark:text-red-400 font-medium">Limit Exceeded</span>
            </div>
          </div>

          <!-- Branches -->
          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Branches</span>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ usageData.current_usage.branches }} / {{ usageData.plan_details.max_branches === -1 ? '∞' : usageData.plan_details.max_branches }}
              </span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div 
                class="h-2 rounded-full transition-all duration-300"
                :class="getUsageBarClass(usageData.usage_percentages.branches, usageData.limits_exceeded.branches)"
                :style="{ width: `${Math.min(usageData.usage_percentages.branches, 100)}%` }"
              ></div>
            </div>
            <div class="flex items-center justify-between mt-2">
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ usageData.usage_percentages.branches }}% used</span>
              <span v-if="usageData.limits_exceeded.branches" class="text-xs text-red-600 dark:text-red-400 font-medium">Limit Exceeded</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Subscription Status -->
      <div v-if="usageData.subscription_status" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-600 rounded-lg p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg v-if="usageData.subscription_status.status === 'lifetime'" class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <svg v-else class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium" :class="{
              'text-green-800 dark:text-green-200': usageData.subscription_status.status === 'lifetime',
              'text-blue-800 dark:text-blue-200': usageData.subscription_status.status === 'active',
              'text-yellow-800 dark:text-yellow-200': usageData.subscription_status.status === 'expiring_soon',
              'text-red-800 dark:text-red-200': usageData.subscription_status.status === 'expired'
            }">
              {{ usageData.subscription_status.status === 'lifetime' ? 'Lifetime Subscription' : 
                 usageData.subscription_status.status === 'active' ? 'Subscription Active' : 
                 usageData.subscription_status.status === 'expiring_soon' ? 'Subscription Expiring Soon' :
                 'Subscription Issue' }}
            </h3>
            <p class="mt-1 text-sm" :class="{
              'text-green-700 dark:text-green-300': usageData.subscription_status.status === 'lifetime',
              'text-blue-700 dark:text-blue-300': usageData.subscription_status.status === 'active',
              'text-yellow-700 dark:text-yellow-300': usageData.subscription_status.status === 'expiring_soon',
              'text-red-700 dark:text-red-300': usageData.subscription_status.status === 'expired'
            }">
              {{ usageData.subscription_status.message }}
            </p>
          </div>
        </div>
      </div>

      <!-- Upgrade Suggestions -->
      <div v-if="usageData.upgrade_suggestions && usageData.upgrade_suggestions.length > 0">
        <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">Upgrade Suggestions</h4>
        <div class="space-y-3">
          <div 
            v-for="suggestion in usageData.upgrade_suggestions" 
            :key="suggestion.plan_key"
            class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-600 rounded-lg p-4"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h5 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  {{ suggestion.plan_name }} - ₹{{ suggestion.price }}/month
                </h5>
                <ul class="mt-2 space-y-1">
                  <li 
                    v-for="reason in suggestion.reasons" 
                    :key="reason"
                    class="text-sm text-yellow-700 dark:text-yellow-300 flex items-center"
                  >
                    <svg class="h-4 w-4 mr-2 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    {{ reason }}
                  </li>
                </ul>
              </div>
              <button
                @click="requestUpgrade(suggestion.plan_key)"
                class="ml-4 px-3 py-1 text-sm font-medium text-yellow-800 dark:text-yellow-200 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-600 rounded-md hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
              >
                Request Upgrade
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- No Upgrade Needed -->
      <div v-else class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-600 rounded-lg p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-green-800 dark:text-green-200">All Good!</h3>
            <p class="mt-1 text-sm text-green-700 dark:text-green-300">
              Your current plan meets your needs. No upgrade required at this time.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { apiClient } from '~/utils/api';
import { useToast } from '~/composables/useToast';

const { showSuccess, showError } = useToast();

const loading = ref(false);
const error = ref(null);
const usageData = ref(null);

const fetchUsageData = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await apiClient.subscriptions.getUsage();
    usageData.value = response.data;
  } catch (err) {
    console.error('Error fetching usage data:', err);
    error.value = err.response?.data?.message || 'Failed to load subscription data';
  } finally {
    loading.value = false;
  }
};

const getUsageBarClass = (percentage, exceeded) => {
  if (exceeded) return 'bg-red-500';
  if (percentage >= 80) return 'bg-yellow-500';
  if (percentage >= 60) return 'bg-orange-500';
  return 'bg-green-500';
};

const requestUpgrade = async (planKey) => {
  try {
    await apiClient.subscriptions.createRenewalRequest({
      requested_plan_code: planKey,
      request_type: 'upgrade',
      request_reason: 'Requested upgrade based on usage limits'
    });
    showSuccess('Upgrade request submitted successfully!');
  } catch (err) {
    console.error('Error requesting upgrade:', err);
    showError(err.response?.data?.message || 'Failed to submit upgrade request');
  }
};

onMounted(() => {
  fetchUsageData();
});
</script> 