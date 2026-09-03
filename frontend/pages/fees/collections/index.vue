<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto space-y-6">
      
      <!-- Page Header -->
      <div class="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Coins class="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            Collections Management
          </h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            View, search, and manage fee payment receipts and history.
          </p>
        </div>

        <div class="mt-4 sm:mt-0 flex gap-3">
          <button
            @click="refreshCollections"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw class="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      <!-- Filters Card -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div class="flex flex-wrap gap-4 items-center justify-between">
          <div v-if="branchOptions.length > 1" class="w-full sm:w-64">
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Branch
            </label>
            <div class="relative">
              <select
                v-model="filters.branch_id"
                @change="fetchCollections"
                class="appearance-none w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all shadow-sm"
              >
                <option value="">All Branches</option>
                <option v-for="branch in branchOptions" :key="branch.id" :value="branch.id">
                  {{ branch.name }}
                </option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                <ChevronDown class="w-4 h-4" />
              </div>
            </div>
          </div>

          <div class="flex-1 min-w-[240px]">
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Search
            </label>
            <div class="relative">
              <input
                v-model="filters.search"
                @input="fetchCollections"
                type="text"
                placeholder="Search collections by receipt number, student name..."
                class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all shadow-sm"
              />
              <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <Search class="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Table Card -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <collection-table
          :collections="collections"
          @view="handleViewCollection"
          @print="handlePrintCollection"
        />

        <div class="p-4 border-t border-gray-200 dark:border-gray-700">
          <Pagination
            v-if="pagination.total > 0"
            :pagination="pagination"
            item-label="collections"
            @page-changed="fetchCollections"
            @page-size-changed="onPageSizeChange"
          />
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Coins, RefreshCw, Search, ChevronDown } from 'lucide-vue-next';
import { fetchCollectionsAPI } from '~/api';
import CollectionTable from '~/components/financial/CollectionTable.vue';
import Pagination from '~/components/ui/Pagination.vue';
import { useToast } from '~/composables/useToast';
import { useBranches } from '~/composables/useBranches';

const router = useRouter();
const { showError, showInfo } = useToast();
const { availableBranches: branchOptions, fetchBranchesForUser } = useBranches();
const collections = ref([]);
const pagination = reactive({ page: 1, limit: 10, total: 0 });
const filters = reactive({ search: '', branch_id: '' });

const fetchCollections = async () => {
  try {
    const response = await fetchCollectionsAPI(filters, pagination);
    collections.value = response.data;
    pagination.total = response.pagination.total;
  } catch (error) {
    console.error('Error fetching collections:', error);
    if (error.response && error.response.data && error.response.data.message) {
      showError(error.response.data.message);
    } else {
      showError('Error fetching collections. Please try again.');
    }
  }
};

const refreshCollections = () => {
  fetchCollections();
};

const handleViewCollection = collection => {
  // Navigate to student fee ledger if student ID is available
  if (collection.student?.id) {
    router.push(`/students/${collection.student.id}/fee-ledger`);
  } else {
    // Show error message if student ID is not available
    showError('Student information not available for this collection.');
  }
};

const handlePrintCollection = collection => {
  // Handle print functionality
  showInfo(`Printing receipt for collection ${collection.receipt_number}`);
};

const onPageSizeChange = newLimit => {
  pagination.limit = newLimit;
  fetchCollections();
};

onMounted(async () => {
  await fetchBranchesForUser();
  if (branchOptions.value.length === 1) filters.branch_id = branchOptions.value[0].id;
  fetchCollections();
});
</script>

<style scoped>
.container {
  max-width: 1024px;
}
</style>
