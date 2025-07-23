<template>
  <div class="grouped-receipts-table">
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading grouped receipts...</p>
    </div>

    <div v-else-if="error" class="text-center py-8">
      <div class="text-red-600 dark:text-red-400">
        <svg class="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p class="text-lg font-medium">{{ error }}</p>
      </div>
    </div>

    <div v-else-if="groupedReceipts.length === 0" class="text-center py-8">
      <div class="text-gray-500 dark:text-gray-400">
        <svg class="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-lg font-medium">No grouped receipts found</p>
        <p class="text-sm">Receipts will appear here after payments are recorded</p>
      </div>
    </div>

    <div v-else class="space-y-4">
      <div class="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Grouped Receipts ({{ groupedReceipts.length }})
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Invoices grouped by receipt for cleaner viewing
          </p>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Receipt Group
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Payment Date
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Invoices Covered
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total Paid
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Payment Method
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="receipt in groupedReceipts"
                :key="receipt.receipt_group_id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ receipt.receipt_group_id }}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {{ receipt.fee_type }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {{ formatDate(receipt.payment_date) }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {{ receipt.months_covered.length }} invoices
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ receipt.months_covered.join(', ') }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-green-600 dark:text-green-400">
                    ₹{{ formatCurrency(receipt.total_paid) }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="getPaymentMethodClass(receipt.payment_method)"
                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                  >
                    {{ formatPaymentMethod(receipt.payment_method) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    @click="viewReceipt(receipt)"
                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                  >
                    View Receipt
                  </button>
                  <button
                    @click="downloadReceipt(receipt)"
                    class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                  >
                    Download
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Receipt Modal -->
    <div
      v-if="showReceiptModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    >
      <div class="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              Receipt Details
            </h3>
            <button
              @click="showReceiptModal = false"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div v-if="selectedReceipt" class="space-y-4">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-500 dark:text-gray-400">Receipt Group:</span>
                <div class="font-medium">{{ selectedReceipt.receipt_group_id }}</div>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Payment Date:</span>
                <div class="font-medium">{{ formatDate(selectedReceipt.payment_date) }}</div>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Total Paid:</span>
                <div class="font-medium text-green-600">₹{{ formatCurrency(selectedReceipt.total_paid) }}</div>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Payment Method:</span>
                <div class="font-medium">{{ formatPaymentMethod(selectedReceipt.payment_method) }}</div>
              </div>
            </div>
            
            <div>
              <span class="text-gray-500 dark:text-gray-400">Invoices Covered:</span>
              <div class="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div class="text-sm">{{ selectedReceipt.months_covered.join(', ') }}</div>
              </div>
            </div>
            
            <div>
              <span class="text-gray-500 dark:text-gray-400">Fee Details:</span>
              <div class="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div class="text-sm">
                  <div><strong>Fee Type:</strong> {{ selectedReceipt.fee_type }}</div>
                  <div><strong>Class:</strong> {{ selectedReceipt.class_name }}</div>
                  <div v-if="selectedReceipt.section"><strong>Section:</strong> {{ selectedReceipt.section }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { apiClient } from '~/utils/api';
import { useToast } from '~/composables/useToast';

const { showSuccess, showError } = useToast();

const props = defineProps({
  studentId: {
    type: String,
    required: true
  },
  academicYear: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['receipt-viewed', 'receipt-downloaded']);

const groupedReceipts = ref([]);
const loading = ref(false);
const error = ref(null);
const showReceiptModal = ref(false);
const selectedReceipt = ref(null);

// Load grouped receipts
const loadGroupedReceipts = async () => {
  if (!props.studentId) return;

  loading.value = true;
  error.value = null;

  try {
    const response = await apiClient.feeInvoices.getGroupedReceipts({
      student_id: props.studentId,
      academic_year: props.academicYear
    });

    groupedReceipts.value = response.data.grouped_receipts || [];
  } catch (err) {
    console.error('Error loading grouped receipts:', err);
    error.value = err.response?.data?.message || 'Error loading grouped receipts';
  } finally {
    loading.value = false;
  }
};

// View receipt details
const viewReceipt = (receipt) => {
  selectedReceipt.value = receipt;
  showReceiptModal.value = true;
  emit('receipt-viewed', receipt);
};

// Download receipt
const downloadReceipt = async (receipt) => {
  try {
    // This would typically call an API to generate and download the receipt
    console.log('Downloading receipt:', receipt.receipt_group_id);
    emit('receipt-downloaded', receipt);
    
    // For now, just show a success message
    showSuccess(`Receipt ${receipt.receipt_group_id} download started`);
  } catch (err) {
    console.error('Error downloading receipt:', err);
    showError('Error downloading receipt');
  }
};

// Utility functions
const formatCurrency = (amount) => {
  return parseFloat(amount || 0).toLocaleString('en-IN');
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN');
};

const formatPaymentMethod = (method) => {
  const methods = {
    cash: 'Cash',
    card: 'Card',
    upi: 'UPI',
    bank_transfer: 'Bank Transfer',
    cheque: 'Cheque',
    online: 'Online'
  };
  return methods[method] || method;
};

const getPaymentMethodClass = (method) => {
  const classes = {
    cash: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    card: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    upi: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    bank_transfer: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    cheque: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    online: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  };
  return classes[method] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
};

// Watch for prop changes
watch(() => props.studentId, () => {
  if (props.studentId) {
    loadGroupedReceipts();
  }
});

watch(() => props.academicYear, () => {
  if (props.studentId) {
    loadGroupedReceipts();
  }
});

// Load receipts on mount
onMounted(() => {
  if (props.studentId) {
    loadGroupedReceipts();
  }
});

// Expose refresh method
defineExpose({
  refresh: loadGroupedReceipts
});
</script> 