<template>
  <div class="container mx-auto py-8 max-w-2xl">
    <h1 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Edit Subscription Plan</h1>
    <form v-if="loaded" @submit.prevent="handleSubmit" class="space-y-6 bg-white dark:bg-gray-800 p-6 rounded shadow">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Plan Name *</label>
          <input v-model="form.name" type="text" class="input-field" required />
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Plan Code *</label>
          <input v-model="form.code" type="text" class="input-field" required />
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Price *</label>
          <input v-model.number="form.price" type="number" step="0.01" class="input-field" required />
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Currency *</label>
          <select v-model="form.currency" class="input-field" required>
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Billing Cycle *</label>
          <select v-model="form.billing_cycle" class="input-field" required>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="lifetime">Lifetime</option>
          </select>
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Sort Order</label>
          <input v-model.number="form.sort_order" type="number" class="input-field" />
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Max Students *</label>
          <input v-model.number="form.max_students" type="number" class="input-field" required />
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Max Staff *</label>
          <input v-model.number="form.max_staff" type="number" class="input-field" required />
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Max Branches *</label>
          <input v-model.number="form.max_branches" type="number" class="input-field" required />
        </div>
      </div>
      <div>
        <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Modules Enabled *</label>
        <div class="flex flex-wrap gap-2">
          <label v-for="module in allModules" :key="module" class="inline-flex items-center text-gray-700 dark:text-gray-300">
            <input type="checkbox" v-model="form.modules" :value="module" class="mr-1" />
            {{ module }}
          </label>
        </div>
      </div>
      <div>
        <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Description</label>
        <textarea v-model="form.description" class="input-field" rows="2"></textarea>
      </div>
      <div>
        <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Active</label>
        <input type="checkbox" v-model="form.is_active" class="mr-2" />
        <span class="text-gray-700 dark:text-gray-300">{{ form.is_active ? 'Yes' : 'No' }}</span>
      </div>
      <div class="flex justify-end gap-3">
        <NuxtLink to="/subscriptions/plans" class="btn-secondary">Cancel</NuxtLink>
        <button type="submit" class="btn-primary" :disabled="loading">{{ loading ? 'Saving...' : 'Save Changes' }}</button>
      </div>
    </form>
    <div v-if="error" class="text-red-600 dark:text-red-400 mt-4">{{ error }}</div>
    <div v-else-if="!loaded" class="text-gray-500 dark:text-gray-400">Loading...</div>
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

const route = useRoute();
const { updatePlan, getPlanById, loading, error } = useSubscriptions();

const allModules = [
  'students', 'fees', 'attendance', 'exams', 'library', 'transport', 'hr', 'reports', 'settings'
];

const form = ref({
  name: '',
  code: '',
  price: 0,
  currency: 'INR',
  billing_cycle: 'monthly',
  max_students: 100,
  max_staff: 20,
  max_branches: 1,
  modules: [],
  description: '',
  is_active: true,
  sort_order: 1
});
const loaded = ref(false);

// Load single plan by ID using the proper API client
const loadPlan = async () => {
  try {
    const result = await getPlanById(route.params.id);
    if (result) {
      Object.assign(form.value, result);
      loaded.value = true;
    } else {
      error.value = 'Failed to load plan';
    }
  } catch (e) {
    error.value = 'Network error';
  }
};

const handleSubmit = async () => {
  const result = await updatePlan(route.params.id, form.value);
  if (result) {
    // Show success toast and redirect
    if (typeof window !== 'undefined') {
      // Create and dispatch a custom event for toast notification
      const event = new CustomEvent('show-toast', {
        detail: {
          message: 'Subscription plan updated successfully!',
          type: 'success'
        }
      });
      window.dispatchEvent(event);
    }
    // Redirect to list page
    await navigateTo('/subscriptions/plans');
  }
};

onMounted(loadPlan);
</script>
<style scoped>
.input-field {
  @apply block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white sm:text-sm;
}
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}
.btn-secondary {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500;
}
</style> 