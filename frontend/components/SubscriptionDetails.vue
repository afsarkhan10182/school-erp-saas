<template>
  <div class="container mx-auto py-8 max-w-7xl">
    <!-- Header -->
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ title }}
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          {{ subtitle }}
        </p>
      </div>
      <div class="flex space-x-3">
        <button 
          v-if="canRequestRenewal" 
          @click="showRenewalModal = true" 
          class="btn-primary"
        >
          Request Renewal
        </button>
        <NuxtLink 
          v-if="editSchoolUrl" 
          :to="editSchoolUrl" 
          class="btn-secondary"
        >
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
            <h3 class="font-medium text-gray-900 dark:text-white mb-2">
              {{ planSectionTitle }}
            </h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Plan Name:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ school?.plan_details?.name || school?.subscription_plan || 'N/A' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Price:</span>
                <span class="font-medium text-gray-900 dark:text-white">₹{{ school?.plan_details?.price || 'N/A' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Billing Cycle:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ formatBillingCycle(school?.plan_details?.billing_cycle) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Status:</span>
                <span :class="statusClass(school?.status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                  {{ formatStatus(school?.status) }}
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
                <span :class="daysRemainingClass" class="font-medium">{{ daysRemaining }}</span>
              </div>
              <div v-if="school?.plan_details?.billing_cycle !== 'lifetime'" class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-400">Progress:</span>
                <div class="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    :class="progressBarClass" 
                    class="h-2 rounded-full transition-all duration-300"
                    :style="{ width: subscriptionProgress + '%' }"
                  ></div>
                </div>
                <span class="text-xs text-gray-500">{{ Math.round(subscriptionProgress) }}%</span>
              </div>
              <div v-else class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-400">Duration:</span>
                <span class="text-xs text-gray-500 font-medium">Lifetime</span>
              </div>
            </div>
          </div>

          <!-- Limits -->
          <div class="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg">
            <h3 class="font-medium text-gray-900 dark:text-white mb-2">
              {{ limitsSectionTitle }}
            </h3>
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
              <div v-if="school?.current_usage" class="pt-2 border-t border-gray-200 dark:border-gray-600">
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Current Usage:</span>
                  <span class="font-medium text-gray-900 dark:text-white">{{ school.current_usage.students || 0 }}/{{ school?.max_students || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modules -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {{ modulesSectionTitle }}
        </h2>
        <div v-if="availableModules.length === 0" class="text-center py-8">
          <div class="text-gray-400 mb-2">No modules available</div>
          <div class="text-sm text-gray-500">
            {{ user?.role === 'super_admin' ? 'This school has no modules enabled.' : 'Contact your administrator to enable modules.' }}
          </div>
        </div>
        <div v-else class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
        
        <!-- Module Upgrade Suggestions -->
        <div v-if="user?.role === 'school_admin' && availablePlans.length > 1" class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 class="text-md font-medium text-gray-900 dark:text-white mb-3">Available Plans</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div 
              v-for="plan in availablePlans" 
              :key="plan.code"
              class="p-4 border rounded-lg"
              :class="plan.isCurrentPlan ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'"
            >
              <div class="flex justify-between items-start mb-2">
                <h4 class="font-medium text-gray-900 dark:text-white">{{ plan.name }}</h4>
                <span v-if="plan.isCurrentPlan" class="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full">Current</span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">{{ plan.description }}</p>
              <div class="text-sm text-gray-900 dark:text-white font-medium mb-2">₹{{ plan.price }}/{{ formatBillingCycle(plan.billing_cycle) }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ plan.modules?.length || 0 }} modules included
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ transactionsSectionTitle }}
          </h2>
          <NuxtLink 
            v-if="transactionsUrl" 
            :to="transactionsUrl" 
            class="text-blue-600 hover:text-blue-700 text-sm"
          >
            View All
          </NuxtLink>
        </div>
        <div v-if="transactions.length === 0" class="text-center py-8 text-gray-500">
          <div v-if="user?.role === 'super_admin'">No transactions found</div>
          <div v-else>Transaction history is not available for school administrators</div>
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
              <tr v-for="transaction in transactions" :key="transaction.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ formatDate(transaction.created_at) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  ₹{{ transaction.amount }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ formatMethod(transaction.payment_method) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="statusClass(transaction.status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                    {{ formatStatus(transaction.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ transaction.description || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Renewal Requests -->
      <div v-if="renewalRequests.length > 0" class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ renewalRequestsSectionTitle }}
          </h2>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Requested Plan</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reason</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="request in renewalRequests" :key="request.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ request.created_at ? formatDate(request.created_at) : 'Not available' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white capitalize">
                  {{ formatRequestType(request.request_type) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ request.requested_plan_code }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="statusClass(request.status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                    {{ formatStatus(request.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {{ request.request_reason || 'No reason provided' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Renewal Request Modal -->
    <Modal :show="showRenewalModal" @close="showRenewalModal = false">
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Request Subscription Renewal</h3>
      </template>
      
      <template #body>
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
                {{ plan.name }} - ₹{{ plan.price }}/{{ formatBillingCycle(plan.billing_cycle) }}
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
        </form>
      </template>
      
      <template #footer>
        <button type="button" @click="showRenewalModal = false" class="btn-secondary">
          Cancel
        </button>
        <button 
          type="button" 
          @click="submitRenewalRequest" 
          :disabled="submitting || !isFormValid" 
          class="btn-primary"
        >
          <span v-if="submitting">Submitting...</span>
          <span v-else>Submit Request</span>
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useSubscriptions } from '~/composables/useSubscriptions';
import { useAuthStore } from '~/stores/auth';
import { useToast } from '~/composables/useToast';
import { Check, AlertCircle } from 'lucide-vue-next';
import { apiClient } from '~/utils/api';

// Types
interface School {
  id: string;
  name: string;
  code: string;
  status: string;
  subscription_plan: string;
  subscription_start_date: string;
  subscription_end_date: string;
  max_students: number;
  max_staff: number;
  max_branches: number;
  current_usage?: {
    students: number;
    staff: number;
    branches: number;
  };
  plan_details?: {
    name: string;
    price: number;
    billing_cycle: string;
    modules?: string[];
  };
  modules?: string[] | any[];
}

interface Transaction {
  id: string;
  amount: number;
  payment_method: string;
  status: string;
  description?: string;
  created_at: string;
}

interface RenewalRequest {
  id: string;
  request_type: string;
  requested_plan_code: string;
  status: string;
  request_reason?: string;
  created_at: string;
}

interface Plan {
  id: string;
  name: string;
  code: string;
  price: number;
  billing_cycle: string;
  description?: string;
  modules?: any[];
  isCurrentPlan?: boolean;
}

interface RenewalForm {
  request_type: string;
  requested_plan_code: string;
  billing_cycle: string;
  request_reason: string;
}

// Props
const props = defineProps<{
  schoolId: string;
  editSchoolUrl?: string;
  transactionsUrl?: string;
  // New props for role-agnostic behavior
  title?: string;
  subtitle?: string;
  planSectionTitle?: string;
  limitsSectionTitle?: string;
  modulesSectionTitle?: string;
  transactionsSectionTitle?: string;
  renewalRequestsSectionTitle?: string;
  canRequestRenewal?: boolean;
}>();

// Emits
const emit = defineEmits<{
  'data-loaded': [{ school: School; transactions: Transaction[]; renewalRequests: RenewalRequest[] }];
  'renewal-requested': [any];
}>();

const authStore = useAuthStore();
const { fetchSchoolsWithSubscriptions, fetchSchoolTransactions, fetchPlans, fetchRenewalRequests, fetchSchoolSubscriptionDetails, fetchSchoolRenewalRequests, createRenewalRequest } = useSubscriptions();
const { showSuccess, showError: toastError } = useToast();

// Reactive data
const loading = ref(true);
const error = ref('');
const school = ref<School | null>(null);
const transactions = ref<Transaction[]>([]);
const renewalRequests = ref<RenewalRequest[]>([]);
const availablePlans = ref<Plan[]>([]);
const showRenewalModal = ref(false);
const submitting = ref(false);

// Renewal form
const renewalForm = ref<RenewalForm>({
  request_type: 'renewal',
  requested_plan_code: '',
  billing_cycle: 'yearly',
  request_reason: '',
});

// Computed properties
const user = computed(() => authStore.user);

// Default values for props
const title = computed(() => props.title || 'Subscription Details');
const subtitle = computed(() => props.subtitle || 'Subscription overview');
const planSectionTitle = computed(() => props.planSectionTitle || 'Plan Information');
const limitsSectionTitle = computed(() => props.limitsSectionTitle || 'Plan Limits');
const modulesSectionTitle = computed(() => props.modulesSectionTitle || 'Available Modules');
const transactionsSectionTitle = computed(() => props.transactionsSectionTitle || 'Recent Transactions');
const renewalRequestsSectionTitle = computed(() => props.renewalRequestsSectionTitle || 'Renewal Requests');
const canRequestRenewal = computed(() => props.canRequestRenewal ?? false);

const daysRemaining = computed(() => {
  if (!school.value?.subscription_end_date) return 'Not set';
  
  const endDate = new Date(school.value.subscription_end_date).getTime();
  const now = new Date().getTime();
  const diffTime = endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 0) {
    return `${diffDays} days`;
  } else if (diffDays === 0) {
    return 'Expires today';
  } else {
    return `${Math.abs(diffDays)} days expired`;
  }
});

const daysRemainingClass = computed(() => {
  if (!school.value?.subscription_end_date) return 'text-gray-900 dark:text-white';
  const endDate = new Date(school.value.subscription_end_date).getTime();
  const now = new Date().getTime();
  const diffTime = endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) return 'text-red-600 dark:text-red-400';
  if (diffDays <= 30) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-green-600 dark:text-green-400';
});

const subscriptionProgress = computed(() => {
  if (!school.value?.subscription_start_date || !school.value?.subscription_end_date) return 0;
  
  const startDate = new Date(school.value.subscription_start_date).getTime();
  const endDate = new Date(school.value.subscription_end_date).getTime();
  const now = new Date().getTime();
  
  // Handle lifetime subscriptions
  if (school.value?.plan_details?.billing_cycle === 'lifetime') {
    return 0; // No progress bar for lifetime
  }
  
  const totalDuration = endDate - startDate;
  const elapsed = now - startDate;
  
  // Cap at 100% even if subscription is expired
  return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
});

const progressBarClass = computed(() => {
  // Don't show progress bar for lifetime subscriptions
  if (school.value?.plan_details?.billing_cycle === 'lifetime') {
    return 'hidden';
  }
  
  // Check if subscription is expired
  if (school.value?.subscription_end_date) {
    const endDate = new Date(school.value.subscription_end_date).getTime();
    const now = new Date().getTime();
    if (endDate < now) {
      return 'bg-red-500';
    }
  }
  
  if (subscriptionProgress.value > 80) return 'bg-red-500';
  if (subscriptionProgress.value > 60) return 'bg-yellow-500';
  return 'bg-green-500';
});

const availableModules = computed(() => {
  if (!school.value) return [];
  
  // Try to get modules from different possible locations
  let modules: any[] = [];
  
  // Check if modules exist in school.modules
  if (school.value.modules && Array.isArray(school.value.modules)) {
    modules = school.value.modules;
  }
  // Check if modules exist in plan_details.modules
  else if (school.value.plan_details?.modules && Array.isArray(school.value.plan_details.modules)) {
    modules = school.value.plan_details.modules;
  }
  
  // Transform modules to display format
  return modules.map((module: any) => {
    if (typeof module === 'string') {
      return {
        id: module,
        name: module.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      };
    } else if (typeof module === 'object') {
      return {
        id: module.code || module.id || module.name,
        name: module.name || module.code || module.id,
      };
    }
    return { id: module, name: String(module) };
  });
});

const isFormValid = computed(() => {
  return renewalForm.value.request_type && 
         renewalForm.value.requested_plan_code && 
         renewalForm.value.billing_cycle;
});

// Methods
const statusClass = (status: string | undefined) => {
  if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  const classes: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    trial: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    expired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    suspended: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };
  return classes[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
};

const formatStatus = (status: string | undefined) => {
  if (!status) return 'N/A';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'Not set';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid date';
  }
};

const formatMethod = (method: string | undefined) => {
  if (!method) return 'Not specified';
  
  const methods: Record<string, string> = {
    offline_cash: 'Cash',
    offline_cheque: 'Cheque',
    offline_bank_transfer: 'Bank Transfer',
    card: 'Card',
    upi: 'UPI',
    online: 'Online',
  };
  
  return methods[method] || method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ');
};

const formatBillingCycle = (cycle: string | undefined) => {
  if (!cycle) return 'Not set';
  
  const cycles: Record<string, string> = {
    monthly: 'Month',
    yearly: 'Year',
    lifetime: 'Lifetime',
  };
  
  return cycles[cycle] || cycle.charAt(0).toUpperCase() + cycle.slice(1);
};

const formatRequestType = (type: string | undefined) => {
  if (!type) return 'Not specified';
  
  const types: Record<string, string> = {
    renewal: 'Renewal',
    upgrade: 'Upgrade',
    downgrade: 'Downgrade',
    change_plan: 'Change Plan',
  };
  
  return types[type] || type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
};

const loadData = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const schoolId = props.schoolId;
    const userRole = user.value?.role;
    
    // Load school details based on user role
    if (userRole === 'super_admin') {
      // Super admin: use the schools with subscriptions endpoint
      const schoolResponse = await fetchSchoolsWithSubscriptions({ id: schoolId });
      if (schoolResponse && schoolResponse.data.schools.length > 0) {
        school.value = schoolResponse.data.schools[0];
      } else {
        throw new Error('School not found');
      }
      
      // Load transactions for super admin
      const transactionsResponse = await fetchSchoolTransactions(schoolId, { limit: 5 });
      if (transactionsResponse) {
        transactions.value = transactionsResponse.data.transactions;
      }
      
      // Load renewal requests for super admin
      try {
        const requestsResponse = await fetchRenewalRequests({ school_id: schoolId });
        if (requestsResponse) {
          renewalRequests.value = requestsResponse.requests;
        }
      } catch (e) {
        console.warn('Could not load renewal requests:', e);
      }
      
      // Load available plans for super admin
      const plansResponse = await fetchPlans({ is_active: true });
      if (plansResponse?.success) {
        availablePlans.value = plansResponse.data.plans;
      }
    } else {
      // School admin: use the simple usage endpoint (like SubscriptionLimits.vue)
      const schoolResponse = await fetchSchoolSubscriptionDetails();
      if (schoolResponse) {
        // Transform the data to match the expected format (like SubscriptionLimits.vue does)
        school.value = {
          id: schoolId,
          name: user.value?.school_name || 'My School',
          code: user.value?.school_id || '',
          status: schoolResponse.subscription_status?.status || 'active',
          subscription_plan: schoolResponse.current_plan,
          subscription_start_date: new Date().toISOString(), // Default to current date
          subscription_end_date: new Date().toISOString(), // Default to current date
          max_students: schoolResponse.plan_details?.max_students,
          max_staff: schoolResponse.plan_details?.max_staff,
          max_branches: schoolResponse.plan_details?.max_branches,
          current_usage: schoolResponse.current_usage,
          plan_details: schoolResponse.plan_details,
          modules: schoolResponse.plan_details?.modules || []
        };
        
        // No transaction data for school admins
        transactions.value = [];
        
        // Load renewal requests for school admin
        try {
          const requestsResponse = await fetchSchoolRenewalRequests({ limit: 10 });
          if (requestsResponse) {
            renewalRequests.value = requestsResponse.requests || [];
          }
        } catch (e) {
          console.warn('Could not load renewal requests:', e);
        }
        
        // Load available plans for school admin
        try {
          const plansResponse = await apiClient.saas.getActivePlansForSchools();
          if (plansResponse?.success) {
            availablePlans.value = plansResponse.data.plans;
          }
        } catch (e) {
          console.warn('Could not load active plans:', e);
          availablePlans.value = [];
        }
      } else {
        throw new Error('Failed to load subscription details');
      }
    }
    
    if (school.value) {
      emit('data-loaded', { school: school.value, transactions: transactions.value, renewalRequests: renewalRequests.value });
    }
    
  } catch (err: any) {
    console.error('Error loading data:', err);
    error.value = err.message || 'Failed to load subscription details';
    toastError('Failed to load subscription details');
  } finally {
    loading.value = false;
  }
};

const submitRenewalRequest = async () => {
  if (!isFormValid.value) {
    toastError('Please fill in all required fields');
    return;
  }

  submitting.value = true;
  
  try {
    const schoolId = props.schoolId;
    
    const response = await createRenewalRequest({
      school_id: schoolId,
      ...renewalForm.value
    });
    
    if (response?.success) {
      showSuccess('Renewal request submitted successfully');
      showRenewalModal.value = false;
      emit('renewal-requested', response.data);
      
      // Reset form
      renewalForm.value = {
        request_type: 'renewal',
        requested_plan_code: '',
        billing_cycle: 'yearly',
        request_reason: '',
      };
      
      await loadData(); // Reload to show the new request
    } else {
      toastError(response?.message || 'Failed to submit renewal request');
    }
  } catch (err: any) {
    console.error('Error submitting renewal request:', err);
    toastError(err.message || 'Failed to submit renewal request');
  } finally {
    submitting.value = false;
  }
};

// Expose methods for parent components
defineExpose({
  loadData,
  submitRenewalRequest
});

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn-secondary {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 
}
.input-field {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white;
}
</style>
