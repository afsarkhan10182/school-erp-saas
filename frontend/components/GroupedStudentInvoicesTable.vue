<template>
  <div class="grouped-student-invoices-table">
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading student invoices...</p>
    </div>

    <div v-else-if="error" class="text-center py-8">
      <div class="text-red-600 dark:text-red-400">
        <svg class="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p class="text-lg font-medium">{{ error }}</p>
      </div>
    </div>

    <div v-else class="space-y-6">
      <!-- Student Info -->
      <div v-if="student" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 class="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
          {{ student.name }}
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span class="text-blue-700 dark:text-blue-300">Admission No:</span>
            <span class="ml-2 font-medium text-blue-900 dark:text-blue-100">{{ student.admission_number }}</span>
          </div>
          <div>
            <span class="text-blue-700 dark:text-blue-300">Class:</span>
            <span class="ml-2 font-medium text-blue-900 dark:text-blue-100">{{ student.current_class }}</span>
          </div>
          <div>
            <span class="text-blue-700 dark:text-blue-300">Section:</span>
            <span class="ml-2 font-medium text-blue-900 dark:text-blue-100">{{ student.section }}</span>
          </div>
          <div>
            <span class="text-blue-700 dark:text-blue-300">Total Balance:</span>
            <span class="ml-2 font-medium text-blue-900 dark:text-blue-100">₹{{ formatCurrency(summary?.total_balance || 0) }}</span>
          </div>
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Invoices</div>
          <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ summary?.total_invoices || 0 }}</div>
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="text-sm font-medium text-gray-500 dark:text-gray-400">Grouped Payments</div>
          <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ summary?.total_grouped || 0 }}</div>
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Invoices</div>
          <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">{{ summary?.total_ungrouped || 0 }}</div>
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Paid</div>
          <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">₹{{ formatCurrency(summary?.total_paid || 0) }}</div>
        </div>
      </div>

      <!-- Grouped Invoices -->
      <div v-if="groupedInvoices.length > 0" class="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Grouped Payments ({{ groupedInvoices.length }})
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
                  Months Covered
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total Paid
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Payment Method
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="group in groupedInvoices"
                :key="group.receipt_group_id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ group.display_name }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    ID: {{ group.receipt_group_id.slice(-8) }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {{ formatDate(group.payment_date) }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {{ group.months_covered }} month(s)
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ group.month_names }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-green-600 dark:text-green-400">
                    ₹{{ formatCurrency(group.total_paid) }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    of ₹{{ formatCurrency(group.total_amount) }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="getPaymentMethodClass(group.payment_method)"
                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                  >
                    {{ formatPaymentMethod(group.payment_method) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="getStatusClass(group.status)"
                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                  >
                    {{ formatStatus(group.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    @click="viewReceipt(group)"
                    class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-3"
                  >
                    View Receipt
                  </button>
                  <button
                    @click="downloadReceipt(group)"
                    class="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                  >
                    Download
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Ungrouped (Pending) Invoices -->
      <div v-if="ungroupedInvoices.length > 0" class="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Pending Invoices ({{ ungroupedInvoices.length }})
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Individual invoices awaiting payment
          </p>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Invoice
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Month/Year
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Due Date
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Amount
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="invoice in ungroupedInvoices"
                :key="invoice.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ invoice.invoice_number }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ invoice.fee_type_name }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {{ invoice.month }}/{{ invoice.year }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {{ formatDate(invoice.due_date) }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    ₹{{ formatCurrency(invoice.total_amount) }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    Balance: ₹{{ formatCurrency(invoice.balance_amount) }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="getStatusClass(invoice.status)"
                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                  >
                    {{ formatStatus(invoice.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    @click="collectPayment(invoice)"
                    class="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 mr-3"
                  >
                    Collect
                  </button>
                  <button
                    @click="viewInvoice(invoice)"
                    class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                  >
                    View
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="groupedInvoices.length === 0 && ungroupedInvoices.length === 0" class="text-center py-8">
        <div class="text-gray-500 dark:text-gray-400">
          <svg class="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-lg font-medium">No invoices found</p>
          <p class="text-sm">Invoices will appear here once they are generated</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useToast } from '~/composables/useToast';

const { showToast } = useToast();

const props = defineProps({
  studentId: {
    type: String,
    required: true
  },
  academicYear: {
    type: String,
    default: null
  },
  status: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['collect-payment', 'view-invoice', 'view-receipt']);

const loading = ref(false);
const error = ref(null);
const student = ref(null);
const groupedInvoices = ref([]);
const ungroupedInvoices = ref([]);
const summary = ref(null);

const fetchGroupedInvoices = async () => {
  if (!props.studentId) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    const config = useRuntimeConfig();
    const token = useCookie('auth-token').value;
    
    const params = new URLSearchParams({
      student_id: props.studentId
    });
    
    if (props.academicYear) {
      params.append('academic_year', props.academicYear);
    }
    
    if (props.status) {
      params.append('status', props.status);
    }
    
    const response = await fetch(`${config.public.apiBase}/fee-invoices/grouped-student-invoices?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      student.value = data.data.student;
      groupedInvoices.value = data.data.grouped_invoices || [];
      ungroupedInvoices.value = data.data.ungrouped_invoices || [];
      summary.value = data.data.summary;
    } else {
      error.value = data.message || 'Failed to fetch invoices';
    }
  } catch (err) {
    console.error('Error fetching grouped invoices:', err);
    error.value = 'Failed to load invoices';
    showToast('Error loading invoices', 'error');
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-IN');
};

const formatCurrency = (amount) => {
  if (!amount) return '0';
  return parseFloat(amount).toLocaleString('en-IN');
};

const formatPaymentMethod = (method) => {
  const methods = {
    cash: 'Cash',
    cheque: 'Cheque',
    bank_transfer: 'Bank Transfer',
    card: 'Card',
    upi: 'UPI',
    online: 'Online'
  };
  return methods[method] || method;
};

const formatStatus = (status) => {
  const statuses = {
    draft: 'Draft',
    sent: 'Sent',
    paid: 'Paid',
    partial_paid: 'Partial Paid',
    overdue: 'Overdue',
    cancelled: 'Cancelled',
    pending: 'Pending'
  };
  return statuses[status] || status;
};

const getPaymentMethodClass = (method) => {
  const classes = {
    cash: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    cheque: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    bank_transfer: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    card: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    upi: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    online: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
  };
  return classes[method] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
};

const getStatusClass = (status) => {
  const classes = {
    paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    partial_paid: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    pending: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };
  return classes[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
};

const viewReceipt = (group) => {
  emit('view-receipt', group);
};

const downloadReceipt = (group) => {
  // Implement download functionality
  showToast('Download functionality coming soon', 'info');
};

const collectPayment = (invoice) => {
  emit('collect-payment', invoice);
};

const viewInvoice = (invoice) => {
  emit('view-invoice', invoice);
};

// Watch for prop changes
watch(() => props.studentId, fetchGroupedInvoices);
watch(() => props.academicYear, fetchGroupedInvoices);
watch(() => props.status, fetchGroupedInvoices);

onMounted(() => {
  if (props.studentId) {
    fetchGroupedInvoices();
  }
});

// Expose refresh method
defineExpose({
  refresh: fetchGroupedInvoices
});
</script>

<style scoped>
.grouped-student-invoices-table {
  @apply w-full;
}
</style> 