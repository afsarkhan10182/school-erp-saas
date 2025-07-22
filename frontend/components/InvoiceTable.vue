<template>
  <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
    <div class="px-4 py-5 sm:px-6">
      <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">Fee Invoices & Payments</h3>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Invoice/Payment</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Model</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Branch</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Class</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paid</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due Date</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-if="isLoading" class="hover:bg-gray-50 dark:hover:bg-gray-700">
            <td colspan="9" class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Loading invoices...
            </td>
          </tr>
          <tr v-else-if="invoices.length === 0" class="hover:bg-gray-50 dark:hover:bg-gray-700">
            <td colspan="9" class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              No invoices found
            </td>
          </tr>
          <tr v-else v-for="invoice in invoices" :key="invoice.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
            <!-- Invoice/Payment Number -->
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
              <div class="flex items-center space-x-2">
                <span>{{ getInvoiceNumber(invoice) }}</span>
                <span v-if="isMonthlyPayment(invoice)" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {{ getMonthLabel(invoice.month) }}
                </span>
              </div>
            </td>

            <!-- Payment Model -->
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="getPaymentModelClass(invoice)" class="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full">
                <component :is="getPaymentModelIcon(invoice)" class="w-3 h-3 mr-1" />
                {{ getPaymentModelText(invoice) }}
              </span>
            </td>

            <!-- Student -->
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              {{ invoice.student?.first_name }} {{ invoice.student?.last_name }}
            </td>

            <!-- Branch -->
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              <div class="flex items-center space-x-2">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  {{ getBranchName(invoice) }}
                </span>
              </div>
            </td>

            <!-- Class -->
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              {{ getClassDisplay(invoice) }}
            </td>

            <!-- Amount -->
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              ₹{{ formatCurrency(getAmount(invoice)) }}
            </td>

            <!-- Paid Amount -->
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              ₹{{ formatCurrency(getPaidAmount(invoice)) }}
            </td>

            <!-- Due Date -->
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              {{ formatDate(invoice.due_date) }}
            </td>

            <!-- Status -->
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="getStatusClass(invoice.status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                {{ getStatusText(invoice.status) }}
              </span>
            </td>

            <!-- Actions -->
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button
                @click="viewInvoice(invoice)"
                class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
              >
                View
              </button>
              <button
                v-if="canRecordPayment(invoice)"
                @click="recordPayment(invoice)"
                class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3"
              >
                Pay
              </button>
              <button
                v-if="canGenerateReceipt(invoice)"
                @click="generateReceipt(invoice)"
                class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
              >
                {{ invoice.status === 'paid' ? 'Generate Receipt' : 'Generate Receipt (Partial)' }}
              </button>
              <button
                v-if="invoice.receipt_number"
                @click="viewReceipt(invoice)"
                class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
              >
                View Receipt
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { Calendar, CreditCard } from 'lucide-vue-next';

const props = defineProps({
  invoices: {
    type: Array,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['view-invoice', 'record-payment', 'generate-receipt', 'view-receipt']);

// Helper functions to determine payment model
const isMonthlyPayment = (invoice) => {
  return invoice.month !== undefined && invoice.year !== undefined;
};

const isInstallmentPayment = (invoice) => {
  return !isMonthlyPayment(invoice) && invoice.invoice_number;
};

const getInvoiceNumber = (invoice) => {
  if (isMonthlyPayment(invoice)) {
    return `MP-${invoice.id.slice(-8).toUpperCase()}`;
  }
  return invoice.invoice_number;
};

const getAmount = (invoice) => {
  if (isMonthlyPayment(invoice)) {
    return invoice.due_amount || 0;
  }
  return invoice.total_amount || 0;
};

const getPaidAmount = (invoice) => {
  if (isMonthlyPayment(invoice)) {
    return invoice.paid_amount || 0;
  }
  return invoice.paid_amount || 0;
};

const getPaymentModelText = (invoice) => {
  if (isMonthlyPayment(invoice)) {
    return 'Monthly';
  }
  return 'Installment';
};

const getPaymentModelClass = (invoice) => {
  if (isMonthlyPayment(invoice)) {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  }
  return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
};

const getPaymentModelIcon = (invoice) => {
  if (isMonthlyPayment(invoice)) {
    return Calendar;
  }
  return CreditCard;
};

const getMonthLabel = (month) => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return months[month - 1] || month;
};

const getBranchName = (invoice) => {
  // Check if branch data is available
  if (invoice.branch?.name) {
    return invoice.branch.name;
  }
  if (invoice.student?.branch?.name) {
    return invoice.student.branch.name;
  }
  if (invoice.branch_name) {
    return invoice.branch_name;
  }
  return 'N/A';
};

const getClassDisplay = (invoice) => {
  // Check if class and section data is available
  if (invoice.student?.current_class) {
    const classInfo = invoice.student.current_class;
    const section = invoice.student.section;
    return section ? `${classInfo}-${section}` : classInfo;
  }
  if (invoice.class_name) {
    return invoice.class_name;
  }
  return 'N/A';
};

const getStatusClass = (status) => {
  const classes = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    partial_paid: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    pending: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  };
  return classes[status] || classes.draft;
};

const getStatusText = (status) => {
  const texts = {
    draft: 'Draft',
    sent: 'Sent',
    paid: 'Paid',
    partial_paid: 'Partial Paid',
    overdue: 'Overdue',
    cancelled: 'Cancelled',
    pending: 'Pending',
    partial: 'Partial',
  };
  return texts[status] || status;
};

const canRecordPayment = (invoice) => {
  const unpaidStatuses = ['draft', 'sent', 'partial_paid', 'overdue', 'pending', 'partial'];
  return unpaidStatuses.includes(invoice.status);
};

const canGenerateReceipt = (invoice) => {
  // Allow receipt generation for paid invoices and partial payments
  const hasPayments = parseFloat(invoice.paid_amount || 0) > 0;
  const notFullyPaid = invoice.status !== 'paid';
  const noReceiptYet = !invoice.receipt_number;
  
  return hasPayments && noReceiptYet;
};

const formatCurrency = (amount) => {
  return parseFloat(amount || 0).toLocaleString('en-IN');
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN');
};

// Event handlers
const viewInvoice = (invoice) => {
  emit('view-invoice', invoice);
};

const recordPayment = (invoice) => {
  emit('record-payment', invoice);
};

const generateReceipt = (invoice) => {
  emit('generate-receipt', invoice);
};

const viewReceipt = (invoice) => {
  emit('view-receipt', invoice);
};
</script> 