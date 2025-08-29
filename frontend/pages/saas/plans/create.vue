<template>
  <div class="container mx-auto py-6 max-w-4xl">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Create Subscription Plan</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">Add a new subscription plan for schools</p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Basic Information -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan Name *</label>
            <input v-model="form.name" type="text" class="input-field" placeholder="e.g., Basic Plan" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan Code *</label>
            <input v-model="form.code" type="text" class="input-field" placeholder="e.g., basic" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price *</label>
            <div class="relative">
              <input v-model.number="form.price" type="number" step="0.01" class="input-field pr-12" placeholder="0.00" required />
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span class="text-gray-500 text-sm">{{ form.currency }}</span>
              </div>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Billing Cycle *</label>
            <select v-model="form.billing_cycle" class="input-field" required>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="lifetime">Lifetime</option>
            </select>
          </div>
        </div>
        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea v-model="form.description" class="input-field" rows="2" placeholder="Brief description of this plan"></textarea>
        </div>
      </div>

      <!-- Limits -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Usage Limits</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Students</label>
            <input v-model.number="form.max_students" type="number" class="input-field" placeholder="100" required />
            <p class="text-xs text-gray-500 mt-1">Use -1 for unlimited</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Staff</label>
            <input v-model.number="form.max_staff" type="number" class="input-field" placeholder="20" required />
            <p class="text-xs text-gray-500 mt-1">Use -1 for unlimited</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Branches</label>
            <input v-model.number="form.max_branches" type="number" class="input-field" placeholder="1" required />
            <p class="text-xs text-gray-500 mt-1">Use -1 for unlimited</p>
          </div>
        </div>
      </div>

      <!-- Modules -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Enabled Modules</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            v-for="module in availableModules"
            :key="module.key"
            class="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
                <span class="text-lg mr-3">{{ module.icon }}</span>
                <div>
                  <div class="font-medium text-gray-900 dark:text-white">{{ module.name }}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">{{ module.description }}</div>
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <NuxtLink to="/saas/plans" class="btn-secondary">Cancel</NuxtLink>
        <button type="submit" class="btn-primary" :disabled="loading">
          <span v-if="loading" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating...
          </span>
          <span v-else>Create Plan</span>
        </button>
      </div>
    </form>

    <div v-if="error" class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <p class="text-red-600 dark:text-red-400">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useSubscriptions } from '~/composables/useSubscriptions';
import { useAuthStore } from '~/stores/auth';
import { useToast } from '~/composables/useToast';

const authStore = useAuthStore();
const { showSuccess, showError } = useToast();

// Access control - only Super Admin can access subscription plans
const user = authStore.user;
if (user?.role !== 'super_admin') {
  showError('Access denied. Only Super Admin can manage subscription plans.');
  await navigateTo('/dashboard');
}

const { createPlan, loading, error, fetchAvailableModules } = useSubscriptions();
const router = useRouter();

const availableModules = ref([]);

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

const loadAvailableModules = async () => {
  try {
    const modulesData = await fetchAvailableModules();
    if (modulesData) {
      availableModules.value = modulesData;
    }
  } catch (error) {
    console.error('Error loading available modules:', error);
    showError('Failed to load available modules');
  }
};

// Set default modules when available modules are loaded
watch(availableModules, (modules) => {
  if (modules.length > 0) {
    // Set core modules by default
    const coreModules = modules.filter(m => m.is_core).map(m => m.key);
    form.value.modules = coreModules;
  }
}, { immediate: true });

const handleSubmit = async () => {
  if (!form.value.modules.length) {
    showError('Please select at least one module');
    return;
  }

  const result = await createPlan(form.value);
  if (result) {
    showSuccess('Subscription plan created successfully!');
    router.push('/saas/plans');  
  }
};

onMounted(() => {
  loadAvailableModules();
});
</script>

<style scoped>
.input-field {
  @apply block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm;
}

.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500;
}
</style> 