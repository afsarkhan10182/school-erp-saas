<template>
  <div class="container mx-auto py-8 max-w-3xl">
    <h1 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">School Details</h1>
    <div v-if="loading" class="text-gray-500 dark:text-gray-400">Loading...</div>
    <div v-else-if="error" class="text-red-600 dark:text-red-400">{{ error }}</div>
    <div v-else-if="school" class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div class="mb-4">
        <div class="text-lg font-medium text-gray-900 dark:text-white mb-2">{{ school.name }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">Code: {{ school.code }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">Email: {{ school.email }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">Phone: {{ school.phone }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">Status: <span :class="school.status === 'active' ? 'text-green-600' : 'text-red-600'">{{ school.status }}</span></div>
      </div>
      <div class="flex gap-3 mt-4">
        <NuxtLink :to="`/subscriptions/schools/${school.id}/edit`" class="btn-primary">Edit</NuxtLink>
        <NuxtLink :to="`/subscriptions/schools/${school.id}/transactions`" class="btn-secondary">Transactions</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useSubscriptions } from '~/composables/useSubscriptions';

const route = useRoute();
const { fetchSchoolsWithSubscriptions } = useSubscriptions();
const school = ref(null);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  loading.value = true;
  error.value = '';
  try {
    const result = await fetchSchoolsWithSubscriptions({ id: route.params.id });
    school.value = result?.schools?.[0] || null;
    if (!school.value) error.value = 'School not found.';
  } catch (e) {
    error.value = 'Failed to load school details.';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}
.btn-secondary {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500;
}
</style> 