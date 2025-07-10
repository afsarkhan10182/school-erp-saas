<template>
  <div class="container mx-auto py-8">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">School Subscriptions</h1>
        <p class="text-gray-600 mt-1">Manage all school subscriptions and billing</p>
      </div>
      <div class="flex gap-3">
        <NuxtLink to="/subscriptions/plans" class="btn-secondary">
          Manage Plans
        </NuxtLink>
        <NuxtLink to="/subscriptions/schools/create" class="btn-primary">
          Add School
        </NuxtLink>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white p-4 rounded-lg shadow mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            v-model="filters.search"
            type="text"
            placeholder="School name, code, or email"
            class="input-field"
            @input="debouncedSearch"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select v-model="filters.status" class="input-field" @change="fetchSchools">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="suspended">Suspended</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Plan</label>
          <select v-model="filters.subscription_plan" class="input-field" @change="fetchSchools">
            <option value="">All Plans</option>
            <option v-for="plan in plans" :key="plan.code" :value="plan.code">
              {{ plan.name }}
            </option>
          </select>
        </div>
        <div class="flex items-end">
          <button @click="clearFilters" class="btn-secondary w-full">
            Clear Filters
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600">Loading schools...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error</h3>
          <p class="mt-1 text-sm text-red-700">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Schools Table -->
    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                School
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plan
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Admin
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subscription Period
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="school in schools" :key="school.id" class="hover:bg-gray-50">
              <!-- School Info -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-gray-900">{{ school.name }}</div>
                  <div class="text-sm text-gray-500">{{ school.code }}</div>
                  <div class="text-sm text-gray-500">{{ school.email }}</div>
                </div>
              </td>

              <!-- Plan Info -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div v-if="school.plan_details">
                  <div class="text-sm font-medium text-gray-900">{{ school.plan_details.name }}</div>
                  <div class="text-sm text-gray-500">
                    ₹{{ school.plan_details.price }}/{{ school.plan_details.billing_cycle }}
                  </div>
                  <div class="text-xs text-gray-400">
                    {{ school.plan_details.max_students }} students, {{ school.plan_details.max_branches }} branches
                  </div>
                </div>
                <div v-else class="text-sm text-gray-500">{{ school.subscription_plan }}</div>
              </td>

              <!-- Admin Info -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div v-if="school.admin_user">
                  <div class="text-sm font-medium text-gray-900">
                    {{ school.admin_user.first_name }} {{ school.admin_user.last_name }}
                  </div>
                  <div class="text-sm text-gray-500">{{ school.admin_user.email }}</div>
                  <div class="text-sm text-gray-500">{{ school.admin_user.phone }}</div>
                </div>
                <div v-else class="text-sm text-gray-500">No admin assigned</div>
              </td>

              <!-- Subscription Period -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  <div>Start: {{ formatDate(school.subscription_start_date) }}</div>
                  <div>End: {{ formatDate(school.subscription_end_date) }}</div>
                </div>
                <div v-if="getDaysRemaining(school.subscription_end_date) <= 30" class="text-xs text-orange-600 font-medium">
                  {{ getDaysRemaining(school.subscription_end_date) }} days remaining
                </div>
              </td>

              <!-- Status -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getStatusClass(school.status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                  {{ school.status }}
                </span>
              </td>

              <!-- Actions -->
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                  <NuxtLink :to="`/subscriptions/schools/${school.id}`" class="text-blue-600 hover:text-blue-900">
                    View
                  </NuxtLink>
                  <NuxtLink :to="`/subscriptions/schools/${school.id}/edit`" class="text-indigo-600 hover:text-indigo-900">
                    Edit
                  </NuxtLink>
                  <NuxtLink :to="`/subscriptions/schools/${school.id}/transactions`" class="text-green-600 hover:text-green-900">
                    Transactions
                  </NuxtLink>
                  <button
                    v-if="school.status === 'active'"
                    @click="suspendSchoolAction(school.id)"
                    class="text-red-600 hover:text-red-900"
                  >
                    Suspend
                  </button>
                  <button
                    v-else-if="school.status === 'suspended'"
                    @click="reactivateSchoolAction(school.id)"
                    class="text-green-600 hover:text-green-900"
                  >
                    Reactivate
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="schools.length === 0 && !loading" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No schools found</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by creating a new school.</p>
        <div class="mt-6">
          <NuxtLink to="/subscriptions/schools/create" class="btn-primary">
            Add School
          </NuxtLink>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pagination && pagination.pages > 1" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div class="flex-1 flex justify-between sm:hidden">
          <button
            @click="changePage(pagination.page - 1)"
            :disabled="pagination.page <= 1"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            @click="changePage(pagination.page + 1)"
            :disabled="pagination.page >= pagination.pages"
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              Showing
              <span class="font-medium">{{ (pagination.page - 1) * pagination.limit + 1 }}</span>
              to
              <span class="font-medium">{{ Math.min(pagination.page * pagination.limit, pagination.total) }}</span>
              of
              <span class="font-medium">{{ pagination.total }}</span>
              results
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                @click="changePage(pagination.page - 1)"
                :disabled="pagination.page <= 1"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                v-for="page in getPageNumbers()"
                :key="page"
                @click="changePage(page)"
                :class="[
                  page === pagination.page
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50',
                  'relative inline-flex items-center px-4 py-2 border text-sm font-medium'
                ]"
              >
                {{ page }}
              </button>
              <button
                @click="changePage(pagination.page + 1)"
                :disabled="pagination.page >= pagination.pages"
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useSubscriptions } from '~/composables/useSubscriptions';

const { schools, plans, loading, error, fetchSchoolsWithSubscriptions, fetchPlans, suspendSchool, reactivateSchool } = useSubscriptions();

const filters = ref({
  search: '',
  status: '',
  subscription_plan: '',
  page: 1,
  limit: 10
});

const pagination = ref(null);

// Debounced search
let searchTimeout;
const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    filters.value.page = 1;
    fetchSchools();
  }, 300);
};

// Fetch schools with current filters
const fetchSchools = async () => {
  const result = await fetchSchoolsWithSubscriptions(filters.value);
  if (result) {
    pagination.value = result.pagination;
  }
};

// Fetch plans for filter dropdown
const fetchPlansData = async () => {
  await fetchPlans({ is_active: true });
};

// Change page
const changePage = (page) => {
  filters.value.page = page;
  fetchSchools();
};

// Clear filters
const clearFilters = () => {
  filters.value = {
    search: '',
    status: '',
    subscription_plan: '',
    page: 1,
    limit: 10
  };
  fetchSchools();
};

// Get page numbers for pagination
const getPageNumbers = () => {
  if (!pagination.value) return [];
  
  const pages = [];
  const current = pagination.value.page;
  const total = pagination.value.pages;
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(total);
    } else if (current >= total - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = total - 4; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      pages.push('...');
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(total);
    }
  }
  
  return pages;
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

// Get days remaining
const getDaysRemaining = (dateString) => {
  if (!dateString) return 0;
  const endDate = new Date(dateString);
  const today = new Date();
  const diffTime = endDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Get status class
const getStatusClass = (status) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'trial':
      return 'bg-blue-100 text-blue-800';
    case 'suspended':
      return 'bg-red-100 text-red-800';
    case 'expired':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const suspendSchoolAction = async (schoolId) => {
  if (confirm('Are you sure you want to suspend this school?')) {
    await suspendSchool(schoolId);
    fetchSchools();
  }
};

const reactivateSchoolAction = async (schoolId) => {
  if (confirm('Are you sure you want to reactivate this school?')) {
    await reactivateSchool(schoolId);
    fetchSchools();
  }
};

onMounted(() => {
  fetchSchools();
  fetchPlansData();
});

// Set page title
useHead({
  title: 'School Subscriptions - School ERP'
});
</script>

<style scoped>
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}

.btn-secondary {
  @apply bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500;
}

.input-field {
  @apply block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm;
}
</style> 