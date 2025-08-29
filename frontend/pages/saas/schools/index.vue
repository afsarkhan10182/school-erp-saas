<template>
  <div class="container mx-auto py-8">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Schools with Subscriptions</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">Manage school subscriptions and billing</p>
      </div>
      <NuxtLink to="/saas/schools/create" class="btn-primary">
        <Plus class="w-4 h-4 mr-2" />
        Add New School
      </NuxtLink>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
          <input
            type="text"
            placeholder="Search schools..."
            class="input-field w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
          <select class="input-field w-full">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan</label>
          <select class="input-field w-full">
            <option value="">All Plans</option>
            <option v-for="plan in plans" :key="plan.code" :value="plan.code">
              {{ plan.name }}
            </option>
          </select>
        </div>
        <div class="flex items-end">
          <button class="btn-secondary w-full">
            <Search class="w-4 h-4 mr-2" />
            Filter
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
      <p class="text-gray-500 dark:text-gray-400 mt-2">Loading schools...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <div class="flex">
        <AlertCircle class="w-5 h-5 text-red-400 mr-2 mt-0.5" />
        <div>
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error loading schools</h3>
          <p class="text-sm text-red-700 dark:text-red-300 mt-1">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Schools Table -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                School
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Plan
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Admin
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Subscription
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="school in schools" :key="school.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <img
                      v-if="school.system_logo"
                      :src="`/uploads/${school.system_logo}`"
                      :alt="school.name"
                      class="h-10 w-10 rounded-lg object-cover"
                    />
                    <div v-else class="h-10 w-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <School class="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">{{ school.name }}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">{{ school.email }}</div>
                    <div class="text-xs text-gray-400 dark:text-gray-500">Code: {{ school.code }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div v-if="school.plan_details" class="text-sm text-gray-900 dark:text-white">
                  {{ school.plan_details.name }}
                </div>
                <div v-else class="text-sm text-gray-500 dark:text-gray-400">No plan</div>
                <div v-if="school.plan_details" class="text-xs text-gray-500 dark:text-gray-400">
                  ₹{{ school.plan_details.price }}/{{ school.plan_details.billing_cycle }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="{
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': school.status === 'active',
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': school.status === 'trial',
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': school.status === 'suspended',
                    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200': school.status === 'inactive'
                  }"
                >
                  {{ school.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                <div v-if="school.admin_user">
                  {{ school.admin_user.first_name }} {{ school.admin_user.last_name }}
                </div>
                <div v-else class="text-gray-500 dark:text-gray-400">No admin</div>
                <div v-if="school.admin_user" class="text-xs text-gray-500 dark:text-gray-400">
                  {{ school.admin_user.email }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                <div v-if="school.subscription_start_date">
                  <div>Start: {{ formatDate(school.subscription_start_date) }}</div>
                  <div v-if="school.subscription_end_date" class="text-xs text-gray-500 dark:text-gray-400">
                    End: {{ formatDate(school.subscription_end_date) }}
                  </div>
                </div>
                <div v-else class="text-gray-500 dark:text-gray-400">No dates</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                  <NuxtLink
                    :to="`/saas/schools/${school.id}`"
                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    View
                  </NuxtLink>
                  <NuxtLink
                    :to="`/saas/schools/${school.id}/edit`"
                    class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Edit
                  </NuxtLink>
                  <NuxtLink
                    :to="`/saas/schools/${school.id}/transactions`"
                    class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                  >
                    Transactions
                  </NuxtLink>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && !error && schools.length === 0" class="text-center py-12">
        <School class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No schools found</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Get started by creating a new school with subscription.
        </p>
        <div class="mt-6">
          <NuxtLink to="/saas/schools/create" class="btn-primary">
            <Plus class="w-4 h-4 mr-2" />
            Add New School
          </NuxtLink>
        </div>
      </div>
    </div>


  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { apiClient } from '~/utils/api';
import { useSubscriptions } from '~/composables/useSubscriptions';
import { useAuthStore } from '~/stores/auth';
import { useToast } from '~/composables/useToast';
import { 
  Plus, 
  Search, 
  AlertCircle, 
  School 
} from 'lucide-vue-next';

// Page meta
definePageMeta({
  // Global auth middleware handles authentication
  layout: 'default'
});

const authStore = useAuthStore();
const { showError } = useToast();

// Access control - only Super Admin can access schools subscription management
const user = authStore.user;
if (user?.role !== 'super_admin') {
  showError('Access denied. Only Super Admin can manage school subscriptions.');
  await navigateTo('/dashboard');
}

const { schools, loading, error, fetchSchoolsWithSubscriptions, suspendSchool, reactivateSchool, plans } = useSubscriptions();

// Load plans for filter dropdown
const loadPlans = async () => {
  try {
    const result = await apiClient.saas.getPlans();
    if (result.success) {
      plans.value = result.data.plans || [];
    }
  } catch (err) {
    console.error('Failed to load plans:', err);
  }
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString();
};

// Initialize
onMounted(async () => {
  await Promise.all([fetchSchoolsWithSubscriptions(), loadPlans()]);
});
</script>

<style scoped>
.btn-primary {
  @apply bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200;
}

.btn-secondary {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200;
}

.input-field {
  @apply block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm;
}
</style> 