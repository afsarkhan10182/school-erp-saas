<template>
  <div class="container mx-auto py-8">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Subscription Plans</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">Manage all available subscription plans</p>
      </div>
      <NuxtLink to="/saas/plans/create" class="btn btn-primary">Add Plan</NuxtLink>
    </div>

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
              <div class="text-sm font-medium text-gray-900 dark:text-white">{{ plan.name }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">{{ plan.code }}</div>
            </td>
            <td>₹{{ plan.price }}</td>
            <td>{{ plan.billing_cycle }}</td>
            <td>
              <div v-if="plan.modules && plan.modules.length > 0">
                <div v-for="module in plan.modules" :key="module.id">{{ module.name }}</div>
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
                :class="plan.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'"
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
        </tbody>
      </table>
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

const formatLimit = (value) => {
  if (value === -1 || value === null || value === undefined) {
    return 'Unlimited';
  }
  return value;
};

const fetchAllPlans = async () => {
  await fetchPlans();
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

