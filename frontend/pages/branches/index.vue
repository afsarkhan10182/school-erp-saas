<template>
  <div class="container mx-auto py-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Branches</h1>
      <NuxtLink to="/branches/create" class="btn-primary">Add Branch</NuxtLink>
    </div>
    <div class="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 items-end">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
        <input v-model="search" type="text" class="input-field" placeholder="Branch name, school, city..." @input="fetchList" />
      </div>
      <div>
        <button class="btn-secondary" @click="clearFilters">Clear</button>
      </div>
    </div>
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600">Loading branches...</p>
    </div>
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
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
    <div v-else class="bg-white rounded-lg shadow overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logos</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="branch in branches" :key="branch._id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">{{ branch.name }}</div>
              <div class="text-xs text-gray-500">{{ branch.email }}</div>
              <div class="text-xs text-gray-500">{{ branch.phone }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900">{{ branch.school?.name || branch.school_name || '-' }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">{{ branch.city }}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex gap-2">
                <img v-if="branch.system_logo" :src="branch.system_logo" alt="System Logo" class="w-8 h-8 rounded" />
                <img v-if="branch.text_logo" :src="branch.text_logo" alt="Text Logo" class="w-8 h-8 rounded" />
                <img v-if="branch.printing_logo" :src="branch.printing_logo" alt="Printing Logo" class="w-8 h-8 rounded" />
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <div class="flex space-x-2">
                <NuxtLink :to="`/branches/${branch._id}`" class="text-blue-600 hover:text-blue-900">View</NuxtLink>
                <NuxtLink :to="`/branches/${branch._id}/edit`" class="text-indigo-600 hover:text-indigo-900">Edit</NuxtLink>
                <button @click="confirmDelete(branch._id)" class="text-red-600 hover:text-red-900">Delete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="branches.length === 0 && !loading" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No branches found</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by creating a new branch.</p>
        <div class="mt-6">
          <NuxtLink to="/branches/create" class="btn-primary">Add Branch</NuxtLink>
        </div>
      </div>
    </div>
    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-medium text-gray-900 mb-2">Delete Branch?</h3>
        <p class="text-gray-700 mb-4">Are you sure you want to delete this branch? This action cannot be undone.</p>
        <div class="flex justify-end gap-3">
          <button @click="showDeleteModal = false" class="btn-secondary">Cancel</button>
          <button @click="deleteBranchAction" class="btn-primary">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { useBranches } from '~/composables/useBranches';

const { branches, loading, error, fetchAllBranches, deleteBranch } = useBranches();
const search = ref('');
const showDeleteModal = ref(false);
const branchToDelete = ref(null);

const fetchList = async () => {
  await fetchAllBranches(search.value ? { search: search.value } : {});
};

const clearFilters = () => {
  search.value = '';
  fetchList();
};

const confirmDelete = (id) => {
  branchToDelete.value = id;
  showDeleteModal.value = true;
};

const deleteBranchAction = async () => {
  if (branchToDelete.value) {
    await deleteBranch(branchToDelete.value);
    showDeleteModal.value = false;
    branchToDelete.value = null;
    fetchList();
  }
};

onMounted(fetchList);
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