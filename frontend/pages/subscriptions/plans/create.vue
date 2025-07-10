<template>
  <div class="container mx-auto py-8 max-w-2xl">
    <h1 class="text-2xl font-bold mb-6">Add Subscription Plan</h1>
    <form @submit.prevent="handleSubmit" class="space-y-6 bg-white p-6 rounded shadow">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block font-medium mb-1">Plan Name *</label>
          <input v-model="form.name" type="text" class="input-field" required />
        </div>
        <div>
          <label class="block font-medium mb-1">Plan Code *</label>
          <input v-model="form.code" type="text" class="input-field" required />
        </div>
        <div>
          <label class="block font-medium mb-1">Price *</label>
          <input v-model.number="form.price" type="number" step="0.01" class="input-field" required />
        </div>
        <div>
          <label class="block font-medium mb-1">Currency *</label>
          <select v-model="form.currency" class="input-field" required>
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>
        <div>
          <label class="block font-medium mb-1">Billing Cycle *</label>
          <select v-model="form.billing_cycle" class="input-field" required>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="lifetime">Lifetime</option>
          </select>
        </div>
        <div>
          <label class="block font-medium mb-1">Sort Order</label>
          <input v-model.number="form.sort_order" type="number" class="input-field" />
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block font-medium mb-1">Max Students *</label>
          <input v-model.number="form.max_students" type="number" class="input-field" required />
        </div>
        <div>
          <label class="block font-medium mb-1">Max Staff *</label>
          <input v-model.number="form.max_staff" type="number" class="input-field" required />
        </div>
        <div>
          <label class="block font-medium mb-1">Max Branches *</label>
          <input v-model.number="form.max_branches" type="number" class="input-field" required />
        </div>
      </div>
      <div>
        <label class="block font-medium mb-1">Modules Enabled *</label>
        <div class="flex flex-wrap gap-2">
          <label v-for="module in allModules" :key="module" class="inline-flex items-center">
            <input type="checkbox" v-model="form.modules" :value="module" class="mr-1" />
            {{ module }}
          </label>
        </div>
      </div>
      <div>
        <label class="block font-medium mb-1">Description</label>
        <textarea v-model="form.description" class="input-field" rows="2"></textarea>
      </div>
      <div>
        <label class="block font-medium mb-1">Active</label>
        <input type="checkbox" v-model="form.is_active" class="mr-2" />
        <span>{{ form.is_active ? 'Yes' : 'No' }}</span>
      </div>
      <div class="flex justify-end gap-3">
        <NuxtLink to="/subscriptions/plans" class="btn-secondary">Cancel</NuxtLink>
        <button type="submit" class="btn-primary" :disabled="loading">{{ loading ? 'Saving...' : 'Save Plan' }}</button>
      </div>
    </form>
    <div v-if="error" class="text-red-600 mt-4">{{ error }}</div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSubscriptions } from '~/composables/useSubscriptions';

const { createPlan, loading, error } = useSubscriptions();
const router = useRouter();

const allModules = [
  'academics', 'attendance', 'fees', 'exams', 'library', 'hostel', 'transport', 'hr', 'accounting', 'alumni'
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
  modules: ['academics', 'attendance', 'fees'],
  description: '',
  is_active: true,
  sort_order: 1
});

const handleSubmit = async () => {
  const result = await createPlan(form.value);
  if (result) {
    router.push('/subscriptions/plans');
  }
};
</script>
<style scoped>
.input-field {
  @apply block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm;
}
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}
.btn-secondary {
  @apply bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500;
}
</style> 