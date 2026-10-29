<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Coins class="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          Collections Management
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          View, search, and manage fee payment receipts and history.
        </p>
      </div>

      <div>
        <button
          @click="refreshCollections"
          class="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <RefreshCw class="w-4 h-4" />
          Refresh
        </button>
      </div>
    </div>

    <!-- Filters Card -->
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5"
    >
      <div class="flex flex-wrap gap-4 items-center justify-between">
        <div class="flex-1 min-w-[240px]">
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            Search
          </label>
          <div class="relative">
            <input
              v-model="filters.search"
              @input="fetchCollections"
              type="text"
              placeholder="Search collections by receipt number, student name..."
              class="input-field pl-10"
            />
            <div
              class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400"
            >
              <Search class="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Table Card -->
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
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

    <Teleport to="body">
      <div
        v-if="showReceiptModal"
        class="fixed inset-0 z-[100000] overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label="Payment receipt"
      >
        <div class="mx-auto mt-6 w-full max-w-4xl rounded-md bg-white p-5 shadow-xl dark:bg-gray-800">
          <div v-if="isLoadingReceipt" class="py-12 text-center text-sm text-gray-600 dark:text-gray-300">
            Loading receipt…
          </div>
          <ReceiptViewer
            v-else-if="selectedReceipt"
            :receipt-data="selectedReceipt"
            @close="closeReceipt"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, defineAsyncComponent } from 'vue';
import { useRouter } from 'vue-router';
import { Coins, RefreshCw, Search } from 'lucide-vue-next';
import { fetchCollectionsAPI } from '~/api';
import { FeeInvoices } from '~/api/students/fee-invoices';
import CollectionTable from '~/components/financial/CollectionTable.vue';
import Pagination from '~/components/ui/Pagination.vue';
import { useToast } from '~/composables/useToast';
import { useGlobalBranch } from '~/composables/useGlobalBranch';

const router = useRouter();
const { showError } = useToast();
const { selectedBranchId, branchScopeParams } = useGlobalBranch();
const collections = ref([]);
const ReceiptViewer = defineAsyncComponent(() => import('~/components/financial/ReceiptViewer.vue'));
const showReceiptModal = ref(false);
const isLoadingReceipt = ref(false);
const selectedReceipt = ref(null);
const pagination = reactive({ page: 1, limit: 10, total: 0 });
const filters = reactive({ search: '', branch_id: selectedBranchId.value || '' });

watch(selectedBranchId, newBranchId => {
  filters.branch_id = newBranchId || '';
  pagination.page = 1;
  fetchCollections();
});

const fetchCollections = async () => {
  try {
    const response = await fetchCollectionsAPI({ ...branchScopeParams.value, ...filters }, pagination);
    collections.value = response.data;
    pagination.total = response.pagination.total;
  } catch (error) {
    if (
      error?.message === 'Authentication required' ||
      (import.meta.client && window.location.pathname === '/auth/login')
    ) return;

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

const handlePrintCollection = async collection => {
  if (!collection?.id) {
    showError('Payment information is unavailable for this receipt.');
    return;
  }

  showReceiptModal.value = true;
  isLoadingReceipt.value = true;
  selectedReceipt.value = null;
  try {
    const response = await FeeInvoices.getPaymentReceiptData(collection.id);
    if (!response.data) throw new Error('Receipt data is unavailable.');
    selectedReceipt.value = response.data;
  } catch (error) {
    showReceiptModal.value = false;
    showError(error.response?.data?.message || 'Unable to load this payment receipt.');
  } finally {
    isLoadingReceipt.value = false;
  }
};

const closeReceipt = () => {
  showReceiptModal.value = false;
  selectedReceipt.value = null;
};

const onPageSizeChange = newLimit => {
  pagination.limit = newLimit;
  fetchCollections();
};

onMounted(() => {
  fetchCollections();
});
</script>

<style scoped>
.container {
  max-width: 1024px;
}
</style>
