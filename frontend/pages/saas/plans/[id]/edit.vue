<template>
  <div class="container mx-auto py-8 max-w-2xl">
    <h1 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Edit Subscription Plan</h1>
    <form
      v-if="loaded"
      @submit.prevent="handleSubmit"
      class="space-y-6 bg-white dark:bg-gray-800 p-6 rounded shadow"
    >
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
          <input
            v-model.number="form.price"
            type="number"
            step="0.01"
            class="input-field"
            required
          />
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
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
            >Billing Cycle *</label
          >
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
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
            >Max Students *</label
          >
          <input v-model.number="form.max_students" type="number" class="input-field" required />
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Max Staff *</label>
          <input v-model.number="form.max_staff" type="number" class="input-field" required />
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
            >Max Branches *</label
          >
          <input v-model.number="form.max_branches" type="number" class="input-field" required />
        </div>
      </div>
      <div>
        <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
          >Modules Enabled *</label
        >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            v-for="module in availableModules"
            :key="module.key"
            class="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <input
              type="checkbox"
              :id="module.key"
              v-model="form.modules"
              :value="module.key"
              class="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label :for="module.key" class="flex-1 cursor-pointer">
              <div class="flex items-center">
                <span class="text-lg mr-2">{{ module.icon }}</span>
                <div>
                  <div class="font-medium text-gray-900 dark:text-white">{{ module.name }}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {{ module.description }}
                  </div>
                </div>
              </div>
            </label>
          </div>
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
        <NuxtLink to="/saas/plans" class="btn-secondary">Cancel</NuxtLink>
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Saving...' : 'Save Changes' }}
        </button>
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
const { showError, showSuccess } = useToast();

// Access control - only Super Admin can access subscription plans
const user = authStore.user;
if (user?.role !== 'super_admin') {
  showError('Access denied. Only Super Admin can manage subscription plans.');
  await navigateTo('/dashboard');
}

const route = useRoute();
const { updatePlan, getPlanById, loading, error, fetchAvailableModules } = useSubscriptions();

const allModules = ref([]);
const availableModules = ref([]);
const loaded = ref(false);

// Load available modules
const loadAvailableModules = async () => {
  try {
    const modulesData = await fetchAvailableModules();
    if (modulesData) {
      availableModules.value = modulesData;
      allModules.value = modulesData.map(m => m.key);
    }
  } catch (error) {
    console.error('Error loading available modules:', error);
    showError('Failed to load available modules');
  }
};

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

// Load single plan by ID using the proper API client
onMounted(async () => {
  await loadAvailableModules();
  await loadPlan();
});

const loadPlan = async () => {
  try {
    const planData = await getPlanById(route.params.id);
    if (planData) {
      // Extract module codes from the modules array
      const moduleCodes = planData.modules
        ? planData.modules.map(module => module.code || module.key)
        : [];

      form.value = {
        name: planData.name,
        code: planData.code,
        price: planData.price,
        currency: planData.currency,
        billing_cycle: planData.billing_cycle,
        max_students: planData.max_students,
        max_staff: planData.max_staff,
        max_branches: planData.max_branches,
        modules: moduleCodes,
        description: planData.description,
        is_active: planData.is_active,
        sort_order: planData.sort_order
      };
      loaded.value = true;
    }
  } catch (error) {
    console.error('Error loading plan:', error);
    showError('Failed to load plan');
  }
};

const handleSubmit = async () => {
  const result = await updatePlan(route.params.id, form.value);
  if (result) {
    // Show success toast and redirect
    showSuccess('Subscription plan updated successfully!');
    // Redirect to list page
    await navigateTo('/saas/plans');
  }
};
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
