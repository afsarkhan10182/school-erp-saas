<template>
  <div class="container mx-auto py-8 max-w-7xl">
    <!-- Header -->
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Subscription Details</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">{{ school?.name }} - {{ school?.code }}</p>
      </div>
      <div class="flex space-x-3">
        <button 
          v-if="canRequestRenewal" 
          @click="showRenewalModal = true" 
          class="btn-primary"
        >
          Request Renewal
        </button>
        <NuxtLink :to="`/subscriptions/schools/${$route.params.id}`" class="btn-secondary">
          Edit School
        </NuxtLink>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600 dark:text-gray-400">Loading subscription details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8">
      <div class="text-red-600 dark:text-red-400 mb-4">
        <AlertCircle class="w-12 h-12 mx-auto" />
      </div>
      <p class="text-gray-600 dark:text-gray-400">{{ error }}</p>
      <button @click="loadData" class="btn-primary mt-4">Retry</button>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Current Plan Overview -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Plan</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Plan Details -->
          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg">
            <h3 class="font-medium text-gray-900 dark:text-white mb-2">Plan Information</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Plan Name:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ school?.plan_details?.name || school?.subscription_plan }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Price:</span>
                <span class="font-medium text-gray-900 dark:text-white">₹{{ school?.plan_details?.price || 'N/A' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Billing Cycle:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ school?.plan_details?.billing_cycle || 'N/A' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Status:</span>
                <span :class="statusClass(school?.status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                  {{ school?.status }}
                </span>
              </div>
            </div>
          </div>

          <!-- Subscription Dates -->
          <div class="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg">
            <h3 class="font-medium text-gray-900 dark:text-white mb-2">Subscription Period</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Start Date:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ formatDate(school?.subscription_start_date) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">End Date:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ formatDate(school?.subscription_end_date) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Days Remaining:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ daysRemaining }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Progress:</span>
                <div class="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    :class="progressBarClass" 
                    class="h-2 rounded-full transition-all duration-300"
                    :style="{ width: subscriptionProgress + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Limits -->
          <div class="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg">
            <h3 class="font-medium text-gray-900 dark:text-white mb-2">Plan Limits</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Max Students:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ school?.max_students || 'N/A' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Max Staff:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ school?.max_staff || 'N/A' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Max Branches:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ school?.max_branches || 'N/A' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modules -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Available Modules</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div 
            v-for="module in availableModules" 
            :key="module.id"
            class="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div class="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Check class="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <span class="ml-3 text-sm font-medium text-gray-900 dark:text-white capitalize">{{ module.name }}</span>
          </div>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
          <NuxtLink :to="`/subscriptions/schools/${$route.params.id}/transactions`" class="text-blue-600 hover:text-blue-700 text-sm">
            View All
          </NuxtLink>
        </div>
        <div v-if="transactions.length === 0" class="text-center py-8 text-gray-500">
          No transactions found
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Method</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="txn in transactions.slice(0, 5)" :key="txn.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{{ formatDate(txn.created_at) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">₹{{ txn.amount }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{{ formatMethod(txn.payment_method) }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="statusClass(txn.payment_status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                    {{ txn.payment_status }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">{{ txn.description }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Renewal Requests -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Renewal Requests</h2>
          <button v-if="canRequestRenewal" @click="showRenewalModal = true" class="btn-primary">New Request</button>
        </div>
        <div v-if="renewalRequests.length === 0" class="text-center py-8 text-gray-500">
          No renewal requests found
        </div>
        <div v-else class="space-y-4">
          <div 
            v-for="request in renewalRequests" 
            :key="request.id"
            class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <div class="flex items-center space-x-3 mb-2">
                  <span class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ request.request_type }} Request
                  </span>
                  <span :class="statusClass(request.status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                    {{ request.status }}
                  </span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span class="text-gray-600 dark:text-gray-400">From:</span>
                    <span class="ml-2 text-gray-900 dark:text-white">{{ request.current_plan_code }}</span>
                  </div>
                  <div>
                    <span class="text-gray-600 dark:text-gray-400">To:</span>
                    <span class="ml-2 text-gray-900 dark:text-white">{{ request.requested_plan_code }}</span>
                  </div>
                  <div>
                    <span class="text-gray-600 dark:text-gray-400">Billing:</span>
                    <span class="ml-2 text-gray-900 dark:text-white">{{ request.billing_cycle }}</span>
                  </div>
                </div>
                <div v-if="request.request_reason" class="mt-2">
                  <span class="text-gray-600 dark:text-gray-400">Reason:</span>
                  <span class="ml-2 text-gray-900 dark:text-white">{{ request.request_reason }}</span>
                </div>
                <div v-if="request.admin_response" class="mt-2">
                  <span class="text-gray-600 dark:text-gray-400">Admin Response:</span>
                  <span class="ml-2 text-gray-900 dark:text-white">{{ request.admin_response }}</span>
                </div>
              </div>
              <div class="text-right text-sm text-gray-500">
                {{ formatDate(request.created_at) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Renewal Request Modal -->
    <Modal v-if="showRenewalModal" @close="showRenewalModal = false" title="Request Subscription Renewal">
      <form @submit.prevent="submitRenewalRequest" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Request Type</label>
          <select v-model="renewalForm.request_type" required class="input-field">
            <option value="renewal">Renewal</option>
            <option value="upgrade">Upgrade</option>
            <option value="downgrade">Downgrade</option>
            <option value="change_plan">Change Plan</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Requested Plan</label>
          <select v-model="renewalForm.requested_plan_code" required class="input-field">
            <option value="">Select Plan</option>
            <option v-for="plan in availablePlans" :key="plan.id" :value="plan.code">
              {{ plan.name }} - ₹{{ plan.price }}/{{ plan.billing_cycle }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Billing Cycle</label>
          <select v-model="renewalForm.billing_cycle" required class="input-field">
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="lifetime">Lifetime</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason for Request</label>
          <textarea 
            v-model="renewalForm.request_reason" 
            rows="3" 
            class="input-field"
            placeholder="Please explain why you need this change..."
          ></textarea>
        </div>

        <div class="flex justify-end space-x-3 pt-4">
          <button type="button" @click="showRenewalModal = false" class="btn-secondary">
            Cancel
          </button>
          <button type="submit" :disabled="submitting" class="btn-primary">
            <span v-if="submitting">Submitting...</span>
            <span v-else>Submit Request</span>
          </button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useSubscriptions } from '~/composables/useSubscriptions';
import { useAuthStore } from '~/stores/auth';
import { useToast } from '~/composables/useToast';
import { Check, AlertCircle } from 'lucide-vue-next';

// Page meta
definePageMeta({
  // Global auth middleware handles authentication
  layout: 'default'
});

const authStore = useAuthStore();
const { showError } = useToast();

// Access control - only Super Admin can access subscription details
const user = authStore.user;
if (user?.role !== 'super_admin') {
  showError('Access denied. Only Super Admin can view subscription details.');
  await navigateTo('/dashboard');
}

const route = useRoute();
const { fetchSchoolsWithSubscriptions, fetchSchoolTransactions, fetchPlans, fetchRenewalRequests, createRenewalRequest } = useSubscriptions();
const { showSuccess, showError: toastError } = useToast();

// Reactive data
const loading = ref(true);
const error = ref('');
const school = ref(null);
const transactions = ref([]);
const renewalRequests = ref([]);
const availablePlans = ref([]);
const showRenewalModal = ref(false);
const submitting = ref(false);

// Renewal form
const renewalForm = ref({
  request_type: 'renewal',
  requested_plan_code: '',
  billing_cycle: 'yearly',
  request_reason: '',
});

// Computed properties
const canRequestRenewal = computed(() => {
  return ['school_admin', 'branch_admin'].includes(user.value?.role);
});

const daysRemaining = computed(() => {
  if (!school.value?.subscription_end_date) return 'N/A';
  const endDate = new Date(school.value.subscription_end_date);
  const now = new Date();
  const diffTime = endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? `${diffDays} days` : 'Expired';
});

const subscriptionProgress = computed(() => {
  if (!school.value?.subscription_start_date || !school.value?.subscription_end_date) return 0;
  const startDate = new Date(school.value.subscription_start_date);
  const endDate = new Date(school.value.subscription_end_date);
  const now = new Date();
  const totalDuration = endDate - startDate;
  const elapsed = now - startDate;
  return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
});

const progressBarClass = computed(() => {
  if (subscriptionProgress.value > 80) return 'bg-red-500';
  if (subscriptionProgress.value > 60) return 'bg-yellow-500';
  return 'bg-green-500';
});

const availableModules = computed(() => {
  if (!school.value?.modules) return [];
  return school.value.modules.map(module => ({
    id: module,
    name: module.replace('_', ' '),
  }));
});

// Methods
const statusClass = (status) => {
  const classes = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    trial: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    expired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    suspended: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };
  return classes[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

const formatMethod = (method) => {
  const methods = {
    offline_cash: 'Cash',
    offline_cheque: 'Cheque',
    offline_bank_transfer: 'Bank Transfer',
    card: 'Card',
    upi: 'UPI',
    online: 'Online',
  };
  return methods[method] || method;
};

const loadData = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const schoolId = route.params.id;
    
    // Load school details using the composable
    const schoolResponse = await fetchSchoolsWithSubscriptions({ id: schoolId });
    if (schoolResponse && schoolResponse.data.schools.length > 0) {
      school.value = schoolResponse.data.schools[0];
    } else {
      throw new Error('School not found');
    }
    
    // Load transactions using the composable
    const transactionsResponse = await fetchSchoolTransactions(schoolId, { limit: 5 });
    if (transactionsResponse) {
      transactions.value = transactionsResponse.data.transactions;
    }
    
    // Load renewal requests using composable
    try {
      const requestsResponse = await fetchRenewalRequests({ school_id: schoolId });
      if (requestsResponse) {
        renewalRequests.value = requestsResponse.requests;
      }
    } catch (e) {
      console.warn('Could not load renewal requests:', e);
    }
    
    // Load available plans using the composable
    const plansResponse = await fetchPlans({ is_active: true });
    if (plansResponse.success) {
      availablePlans.value = plansResponse.data.plans;
    }
    
  } catch (err) {
    console.error('Error loading data:', err);
    error.value = 'Failed to load subscription details';
    toastError('Failed to load subscription details');
  } finally {
    loading.value = false;
  }
};

const submitRenewalRequest = async () => {
  submitting.value = true;
  
  try {
    const response = await createRenewalRequest(renewalForm.value);
    
    if (response) {
      showSuccess('Renewal request submitted successfully');
      showRenewalModal.value = false;
      renewalForm.value = {
        request_type: 'renewal',
        requested_plan_code: '',
        billing_cycle: 'yearly',
        request_reason: '',
      };
      await loadData(); // Reload data to show new request
    } else {
      toastError('Failed to submit renewal request');
    }
  } catch (err) {
    console.error('Error submitting renewal request:', err);
    toastError('Failed to submit renewal request');
  } finally {
    submitting.value = false;
  }
};

// Initialize
onMounted(() => {
  loadData();
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