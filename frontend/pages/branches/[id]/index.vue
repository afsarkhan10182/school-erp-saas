<template>
  <div class="container mx-auto py-8 max-w-2xl">
    <div class="mb-6 flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Branch Details</h1>
      <NuxtLink :to="`/branches/${branchId}/edit`" class="btn-primary">Edit</NuxtLink>
    </div>
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600 dark:text-gray-400">Loading branch details...</p>
    </div>
    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
          <p class="mt-1 text-sm text-red-700 dark:text-red-300">{{ error }}</p>
        </div>
      </div>
    </div>
    <div v-else-if="branch" class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div class="mb-4">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-2">General Info</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><span class="font-medium text-gray-700 dark:text-gray-300">Branch Name:</span> <span class="text-gray-900 dark:text-white">{{ branch.name }}</span></div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">School:</span> <span class="text-gray-900 dark:text-white">{{ branch.school?.name || branch.school_name || '-' }}</span></div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">Email:</span> <span class="text-gray-900 dark:text-white">{{ branch.email }}</span></div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">Phone:</span> <span class="text-gray-900 dark:text-white">{{ branch.phone }}</span></div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">Currency:</span> <span class="text-gray-900 dark:text-white">{{ branch.currency }}</span></div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">Currency Symbol:</span> <span class="text-gray-900 dark:text-white">{{ branch.currency_symbol }}</span></div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">City:</span> <span class="text-gray-900 dark:text-white">{{ branch.city }}</span></div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">State:</span> <span class="text-gray-900 dark:text-white">{{ branch.state }}</span></div>
          <div class="md:col-span-2"><span class="font-medium text-gray-700 dark:text-gray-300">Address:</span> <span class="text-gray-900 dark:text-white">{{ branch.address }}</span></div>
        </div>
      </div>
      <div class="mb-4">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Logos & Files</h2>
        <div class="flex gap-4 flex-wrap">
          <div v-if="branch.system_logo">
            <div class="font-medium text-xs text-gray-700 dark:text-gray-300">System Logo</div>
            <img :src="branch.system_logo" alt="System Logo" class="w-16 h-16 rounded border" />
          </div>
          <div v-if="branch.text_logo">
            <div class="font-medium text-xs text-gray-700 dark:text-gray-300">Text Logo</div>
            <img :src="branch.text_logo" alt="Text Logo" class="w-16 h-16 rounded border" />
          </div>
          <div v-if="branch.printing_logo">
            <div class="font-medium text-xs text-gray-700 dark:text-gray-300">Printing Logo</div>
            <img :src="branch.printing_logo" alt="Printing Logo" class="w-16 h-16 rounded border" />
          </div>
          <div v-if="branch.report_card_design">
            <div class="font-medium text-xs text-gray-700 dark:text-gray-300">Report Card Design</div>
            <a :href="branch.report_card_design" target="_blank" class="text-blue-600 dark:text-blue-400 underline">Download/View</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useBranches } from '~/composables/useBranches';
import { useAuthStore } from '~/stores/auth';
import { useToast } from '~/composables/useToast';

const authStore = useAuthStore();
const { showError } = useToast();

// Access control - only Super Admin can access branches
const user = authStore.user;
if (user?.role !== 'super_admin') {
  showError('Access denied. Only Super Admin can manage branches.');
  await navigateTo('/dashboard');
}

const route = useRoute();
const branchId = route.params.id;
const { loading, error, getBranchById } = useBranches();
const branch = ref(null);

const fetchBranch = async () => {
  try {
    const token = useCookie('auth-token').value;
    const config = useRuntimeConfig();
    const apiBase = config.public.apiBase;
    const res = await fetch(`${apiBase}/branches/${branchId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    if (data.success) {
      branch.value = data.data.branch || data.data;
    }
  } catch (e) {
    // error handled by composable
  }
};

onMounted(fetchBranch);
</script>
<style scoped>
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}
</style> 