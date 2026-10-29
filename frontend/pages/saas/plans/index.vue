<template>
  <div class="container mx-auto py-8">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Subscription Plans</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">Manage all available subscription plans</p>
      </div>
      <NuxtLink to="/saas/plans/create" class="btn btn-primary">Add Plan</NuxtLink>
    </div>

    <section class="mb-5 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800" aria-label="Filter subscription plans">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <label class="xl:col-span-2">
          <span class="sr-only">Search plans</span>
          <input v-model="filters.search" type="search" class="form-input w-full" placeholder="Search plan name or code" @keydown.enter.prevent="applyFilters" />
        </label>
        <label>
          <span class="sr-only">Plan status</span>
          <select v-model="filters.is_active" class="form-select w-full" aria-label="Plan status" @change="applyFilters">
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </label>
        <label>
          <span class="sr-only">Billing cycle</span>
          <select v-model="filters.billing_cycle" class="form-select w-full" aria-label="Billing cycle" @change="applyFilters">
            <option value="">All cycles</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="lifetime">Lifetime</option>
          </select>
        </label>
        <label>
          <span class="sr-only">Popularity</span>
          <select v-model="filters.is_popular" class="form-select w-full" aria-label="Popularity" @change="applyFilters">
            <option value="">All plans</option>
            <option value="true">Popular</option>
            <option value="false">Not popular</option>
          </select>
        </label>
      </div>
      <div class="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex flex-wrap items-center gap-2">
          <button type="button" class="btn btn-primary" :disabled="loading" @click="applyFilters">Search</button>
          <button type="button" class="btn btn-secondary" :disabled="loading" @click="clearFilters">Clear</button>
          <span class="text-sm text-gray-500" aria-live="polite">{{ pagination.total }} plans</span>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            Sort
            <select v-model="filters.sort_by" class="form-select" aria-label="Sort plans" @change="applyFilters">
              <option value="sort_order">Default</option>
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="price-asc">Price low–high</option>
              <option value="price-desc">Price high–low</option>
            </select>
          </label>
          <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            Rows
            <select v-model.number="filters.limit" class="form-select" aria-label="Plans per page" @change="changePageSize">
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </label>
        </div>
      </div>
    </section>

    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600 dark:text-gray-400">Loading plans...</p>
    </div>
    <div v-else-if="error" class="alert alert-danger mb-6">
      <p class="mb-0 text-sm">{{ error }}</p>
    </div>
    <div v-else class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Cycle</th>
            <th>Modules</th>
            <th>Limits</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="plan in plans" :key="plan.id">
            <td>
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-sm font-medium text-gray-900 dark:text-white">{{ plan.name }}</span>
                <span v-if="plan.is_popular" class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">Popular</span>
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">{{ plan.code }}</div>
            </td>
            <td>₹{{ plan.price }}</td>
            <td>{{ plan.billing_cycle }}</td>
            <td>
              <div
                v-if="plan.modules && plan.modules.length > 0"
                :aria-label="`Enabled modules: ${plan.modules.map(module => module.name).join(', ')}`"
                :title="plan.modules.map(module => module.name).join(', ')"
              >
                {{ plan.modules.slice(0, 2).map(module => module.name).join(', ') }}
                <span v-if="plan.modules.length > 2" class="text-gray-500 dark:text-gray-400">
                  +{{ plan.modules.length - 2 }} more
                </span>
              </div>
              <div v-else class="text-gray-500 dark:text-gray-400">No modules</div>
            </td>
            <td>
              <div>Students: {{ formatLimit(plan.max_students) }}</div>
              <div>Branches: {{ formatLimit(plan.max_branches) }}</div>
              <div>Staff: {{ formatLimit(plan.max_staff) }}</div>
            </td>
            <td>
              <span
                :class="
                  plan.is_active
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                "
                class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
              >
                {{ plan.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>
              <div class="flex space-x-2">
                <NuxtLink
                  :to="`/saas/plans/${plan.id}/edit`"
                  class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                  >Edit</NuxtLink
                >
                <button
                  @click="deletePlanConfirm(plan.id)"
                  class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!plans.length">
            <td colspan="7" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">No subscription plans match these filters.</td>
          </tr>
        </tbody>
      </table>
      <div v-if="pagination.pages > 1" class="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700">
        <span class="text-sm text-gray-500">Page {{ pagination.page }} of {{ pagination.pages }}</span>
        <div class="flex gap-2">
          <button type="button" class="btn btn-secondary" :disabled="loading || pagination.page <= 1" @click="fetchPage(pagination.page - 1)">Previous</button>
          <button type="button" class="btn btn-secondary" :disabled="loading || pagination.page >= pagination.pages" @click="fetchPage(pagination.page + 1)">Next</button>
        </div>
      </div>
    </div>
    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay">
      <div class="modal-content">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Delete Plan?</h3>
        <p class="text-gray-700 dark:text-gray-300 mb-4">
          Are you sure you want to delete this plan? This action cannot be undone.
        </p>
        <div class="flex justify-end gap-3">
          <button @click="showDeleteModal = false" class="btn btn-secondary">Cancel</button>
          <button @click="deletePlanAction" class="btn btn-primary">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { useSubscriptions } from '~/composables/useSubscriptions';
import { useAuthStore } from '~/stores/auth';
import { useToast } from '~/composables/useToast';

const authStore = useAuthStore();
const { showError } = useToast();

// Access control - only Super Admin can access subscription plans
const user = authStore.user;
if (user?.role !== 'super_admin') {
  showError('Access denied. Only Super Admin can manage subscription plans.');
  await navigateTo('/dashboard');
}

const { plans, loading, error, fetchPlans, deletePlan } = useSubscriptions();
const showDeleteModal = ref(false);
const planToDelete = ref(null);
const pagination = ref({ page: 1, limit: 10, total: 0, pages: 0 });
const filters = ref({ search: '', is_active: '', billing_cycle: '', is_popular: '', sort_by: 'sort_order', page: 1, limit: 10 });

const formatLimit = value => {
  if (value === -1 || value === null || value === undefined) {
    return 'Unlimited';
  }
  return value;
};

const fetchAllPlans = async () => {
  const sort = filters.value.sort_by.split('-');
  const response = await fetchPlans({
    ...filters.value,
    sort_by: sort[0],
    sort_order: sort[1] || 'ASC'
  });
  if (response?.data?.pagination) pagination.value = response.data.pagination;
};

const applyFilters = () => {
  filters.value.page = 1;
  fetchAllPlans();
};
const fetchPage = page => {
  filters.value.page = page;
  fetchAllPlans();
};
const changePageSize = () => applyFilters();
const clearFilters = () => {
  filters.value = { search: '', is_active: '', billing_cycle: '', is_popular: '', sort_by: 'sort_order', page: 1, limit: 10 };
  fetchAllPlans();
};

const deletePlanConfirm = id => {
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
</script>
