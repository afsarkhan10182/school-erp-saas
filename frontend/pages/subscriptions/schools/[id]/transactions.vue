<template>
  <div class="container mx-auto py-8 max-w-5xl">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Transaction History</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">All payments and transactions for this school</p>
      </div>
      <button class="btn-primary" @click="showAddModal = true">Add Manual Payment</button>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 items-end">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Status</label>
        <select v-model="filters.payment_status" class="input-field">
          <option value="">All</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method</label>
        <select v-model="filters.payment_method" class="input-field">
          <option value="">All</option>
          <option value="offline_cash">Cash</option>
          <option value="offline_cheque">Cheque</option>
          <option value="offline_bank_transfer">Bank Transfer</option>
          <option value="card">Card</option>
          <option value="upi">UPI</option>
        </select>
      </div>
      <div>
        <button class="btn-secondary" @click="fetchTransactions">Apply</button>
        <button class="btn-secondary ml-2" @click="clearFilters">Clear</button>
      </div>
    </div>

    <!-- Transactions Table -->
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600 dark:text-gray-400">Loading transactions...</p>
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
    <div v-else>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Currency</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Method</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Plan</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">By</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="txn in transactions" :key="txn.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{{ formatDate(txn.created_at) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">₹{{ txn.amount }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{{ txn.currency }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{{ formatMethod(txn.payment_method) }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="statusClass(txn.payment_status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                  {{ txn.payment_status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{{ txn.subscriptionPlan?.name || '-' }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white">{{ txn.description }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white">{{ txn.createdBy?.email || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination -->
      <div v-if="pagination && pagination.pages > 1" class="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6 mt-4">
        <div class="flex-1 flex justify-between sm:hidden">
          <button @click="changePage(pagination.page - 1)" :disabled="pagination.page <= 1" class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
          <button @click="changePage(pagination.page + 1)" :disabled="pagination.page >= pagination.pages" class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button v-for="page in getPageNumbers()" :key="page" @click="changePage(page)" :disabled="page === '...' || page === pagination.page" class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium" :class="page === pagination.page ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'">
                {{ page }}
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Manual Payment Modal -->
    <div v-if="showAddModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-lg">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Add Manual Payment</h3>
        <form @submit.prevent="handleAddPayment">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Amount *</label>
              <input v-model.number="form.amount" type="number" step="0.01" class="input-field" required />
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
              <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Payment Method *</label>
              <select v-model="form.payment_method" class="input-field" required>
                <option value="offline_cash">Cash</option>
                <option value="offline_cheque">Cheque</option>
                <option value="offline_bank_transfer">Bank Transfer</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
              </select>
            </div>
            <div>
              <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Billing Cycle</label>
              <select v-model="form.billing_cycle" class="input-field">
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="lifetime">Lifetime</option>
              </select>
            </div>
            <div class="md:col-span-2">
              <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Description</label>
              <textarea v-model="form.description" class="input-field" rows="2"></textarea>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-4">
            <button type="button" class="btn-secondary" @click="showAddModal = false">Cancel</button>
            <button type="submit" class="btn-primary" :disabled="addLoading">{{ addLoading ? 'Saving...' : 'Add Payment' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Toast Notifications -->
    <div v-if="showToast" :class="toastClasses" class="fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <svg v-if="toastType === 'success'" class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <svg v-else class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium">{{ toastMessage }}</p>
        </div>
        <div class="ml-auto pl-3">
          <button @click="hideToast" class="inline-flex text-gray-400 hover:text-gray-600">
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useSubscriptions } from '~/composables/useSubscriptions';

const route = useRoute();
const schoolId = route.params.id;
const { fetchSchoolTransactions, createManualTransaction } = useSubscriptions();

const transactions = ref([]);
const loading = ref(false);
const error = ref('');
const pagination = ref(null);

// Toast notification state
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');

const filters = ref({
  payment_status: '',
  payment_method: '',
  page: 1,
  limit: 10
});

// Toast notification methods
const showToastNotification = (message, type = 'success') => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => {
    hideToast();
  }, 5000);
};

const hideToast = () => {
  showToast.value = false;
};

const toastClasses = computed(() => {
  return toastType.value === 'success' 
    ? 'bg-green-50 border border-green-200 text-green-800' 
    : 'bg-red-50 border border-red-200 text-red-800';
});

const fetchTransactions = async () => {
  loading.value = true;
  error.value = '';
  try {
    const result = await fetchSchoolTransactions(schoolId, filters.value);
    if (result && result.transactions) {
      transactions.value = result.transactions;
      pagination.value = result.pagination;
    }
  } catch (e) {
    error.value = e?.message || 'Failed to load transactions';
    showToastNotification(error.value, 'error');
  } finally {
    loading.value = false;
  }
};

const clearFilters = () => {
  filters.value.payment_status = '';
  filters.value.payment_method = '';
  filters.value.page = 1;
  fetchTransactions();
};

const changePage = (page) => {
  filters.value.page = page;
  fetchTransactions();
};

const getPageNumbers = () => {
  if (!pagination.value) return [];
  const pages = [];
  const current = pagination.value.page;
  const total = pagination.value.pages;
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(total);
    } else if (current >= total - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = total - 4; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      for (let i = current - 1; i <= current + 1; i++) pages.push(i);
      pages.push('...');
      pages.push(total);
    }
  }
  return pages;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
};

const formatMethod = (method) => {
  switch (method) {
    case 'offline_cash': return 'Cash';
    case 'offline_cheque': return 'Cheque';
    case 'offline_bank_transfer': return 'Bank Transfer';
    case 'card': return 'Card';
    case 'upi': return 'UPI';
    default: return method;
  }
};

const statusClass = (status) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'failed': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// Add Manual Payment Modal
const showAddModal = ref(false);
const form = ref({
  amount: '',
  currency: 'INR',
  payment_method: 'offline_cash',
  billing_cycle: 'monthly',
  description: ''
});
const addLoading = ref(false);
const addError = ref('');

const handleAddPayment = async () => {
  addLoading.value = true;
  addError.value = '';
  try {
    await createManualTransaction({
      school_id: schoolId,
      amount: form.value.amount,
      currency: form.value.currency,
      payment_method: form.value.payment_method,
      billing_cycle: form.value.billing_cycle,
      description: form.value.description
    });
    showAddModal.value = false;
    form.value = { amount: '', currency: 'INR', payment_method: 'offline_cash', billing_cycle: 'monthly', description: '' };
    showToastNotification('Payment added successfully!', 'success');
    fetchTransactions();
  } catch (e) {
    addError.value = e?.message || 'Failed to add payment';
    showToastNotification(addError.value, 'error');
  } finally {
    addLoading.value = false;
  }
};

onMounted(fetchTransactions);
</script>

<style scoped>
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}
.btn-secondary {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500;
}
.input-field {
  @apply block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white sm:text-sm;
}
</style> 