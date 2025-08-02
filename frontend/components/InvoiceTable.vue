<template>
  <div class="overflow-hidden">
    <!-- Header with Summary -->
    <div v-if="!isLoading && groupedInvoices.length > 0" class="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Fee Invoices & Payments</h3>
        <div class="text-sm text-gray-600 dark:text-gray-400">
          {{ totalInvoices }} total invoices
        </div>
      </div>
    </div>

    <!-- Accordion Grouped Results -->
    <div v-if="!isLoading && viewMode === 'grouped' && groupedInvoices.length > 0" class="divide-y divide-gray-200 dark:divide-gray-700">
      <div v-for="studentGroup in groupedInvoices" :key="studentGroup.studentId" class="accordion-group bg-white dark:bg-gray-800">
        <!-- Student Header (Clickable) -->
        <div 
          @click="toggleStudent(studentGroup.studentId)"
          class="px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center justify-between"
          :class="{ 'bg-indigo-50 dark:bg-indigo-900/20': expandedStudents.includes(studentGroup.studentId) }"
        >
          <div class="flex items-center space-x-4">
            <!-- Chevron Icon -->
            <svg 
              class="w-5 h-5 text-gray-400 transition-transform duration-200"
              :class="{ 'rotate-90': expandedStudents.includes(studentGroup.studentId) }"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
            
            <!-- Student Avatar -->
            <div class="flex-shrink-0 h-10 w-10">
              <img v-if="studentGroup.studentPhoto" :src="studentGroup.studentPhoto" alt="" class="h-10 w-10 rounded-full object-cover" />
              <div v-else class="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                {{ studentGroup.studentName.charAt(0).toUpperCase() }}
              </div>
            </div>
            
            <!-- Student Info -->
            <div>
              <div class="text-sm font-medium text-gray-900 dark:text-white">
                {{ studentGroup.studentName }}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                Roll No: {{ studentGroup.admissionNumber }} • Admission: {{ studentGroup.admissionNumber }} • {{ studentGroup.className }}
              </div>
            </div>
          </div>
          
          <!-- Invoice Count and Summary -->
          <div class="flex items-center space-x-6">
            <div class="text-right">
              <div class="text-sm font-medium text-gray-900 dark:text-white">
                {{ studentGroup.invoices.length }} invoices
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                Total: ₹{{ formatCurrency(studentGroup.totalAmount) }}
              </div>
            </div>
            
            <!-- Status Summary -->
            <div class="flex space-x-2">
              <span v-if="studentGroup.overdueCount > 0" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                {{ studentGroup.overdueCount }} Overdue
              </span>
            </div>
          </div>
        </div>
        
        <!-- Invoices List (Collapsible) -->
        <div v-show="expandedStudents.includes(studentGroup.studentId)" class="bg-gray-50 dark:bg-gray-700/50">
          <div class="px-6 py-3 border-t border-gray-200 dark:border-gray-600">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead class="bg-gray-100 dark:bg-gray-600">
                  <tr>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-48">Invoice No</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">Model</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-20">Branch</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-16">Class</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-20">Amount</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-20">Paid</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-20">Status</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                  <tr v-for="invoice in studentGroup.invoices" :key="invoice.id" class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                    <!-- Invoice Number -->
                    <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      <div class="flex items-center space-x-2">
                        <span>{{ getInvoiceNumber(invoice) }}</span>
                        <span 
                          v-if="isGroupedPayment(invoice)" 
                          class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 cursor-help"
                          :title="getMonthsCovered(invoice)"
                        >
                          {{ getMonthsCoveredShort(invoice) }}
                        </span>
                        <span v-else-if="isMonthlyPayment(invoice)" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {{ getMonthLabel(invoice.month) }}
                        </span>
                      </div>
                    </td>

                    <!-- Payment Model -->
                    <td class="px-4 py-3 whitespace-nowrap">
                      <span :class="getPaymentModelClass(invoice)" class="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full">
                        <component :is="getPaymentModelIcon(invoice)" class="w-3 h-3 mr-1" />
                        {{ getPaymentModelText(invoice) }}
                      </span>
                    </td>



                    <!-- Branch -->
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div class="flex items-center space-x-2">
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          {{ getBranchName(invoice) }}
                        </span>
                      </div>
                    </td>

                    <!-- Class -->
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {{ getClassDisplay(invoice) }}
                    </td>

                    <!-- Amount -->
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ₹{{ formatCurrency(getAmount(invoice)) }}
                    </td>

                    <!-- Paid Amount -->
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ₹{{ formatCurrency(getPaidAmount(invoice)) }}
                    </td>
                    <!-- Status -->
                    <td class="px-4 py-3 whitespace-nowrap">
                      <span :class="getStatusClass(invoice.status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                        {{ getStatusText(invoice.status) }}
                      </span>
                    </td>

                    <!-- Actions -->
                    <td class="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <button
                        v-if="isGroupedPayment(invoice)"
                        @click.stop="viewCombinedReceipt(invoice)"
                        class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                      >
                        View Combined Receipt
                      </button>
                      <button
                        v-else-if="canGenerateReceipt(invoice)"
                        @click.stop="viewReceipt(invoice)"
                        class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                      >
                        View Receipt
                      </button>
                      <button
                        v-if="canRecordPayment(invoice)"
                        @click.stop="recordPayment(invoice)"
                        class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3"
                      >
                        Pay Now
                      </button>
                      <button
                        v-if="!isGroupedPayment(invoice)"
                        @click.stop="viewInvoice(invoice)"
                        class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>



    <!-- Footer Summary -->
    <div v-if="!isLoading && groupedInvoices.length > 0" class="px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-center">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Showing {{ groupedInvoices.length }} students ({{ totalInvoices }} total invoices)
      </p>
    </div>

    <!-- Loading State -->
    <div v-else-if="isLoading" class="px-6 py-12 text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
      <p class="text-gray-500 dark:text-gray-400">Loading invoices...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!isLoading && groupedInvoices.length === 0" class="px-6 py-12 text-center">
      <div class="text-gray-400 dark:text-gray-500 mb-4">
        <svg class="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p class="text-gray-500 dark:text-gray-400">No invoices found</p>
      <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters or generate new invoices</p>
    </div>
  </div>
</template>

<script setup>
import { Calendar, CreditCard } from 'lucide-vue-next';
import { ref, computed } from 'vue';

const props = defineProps({
  invoices: {
    type: Array,
    default: () => []
  },
  groupedInvoices: {
    type: Array,
    default: () => []
  },
  viewMode: {
    type: String,
    default: 'grouped'
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  totalInvoices: {
    type: Number,
    default: 0
  }
});

// Debug logging for props
console.log('📋 InvoiceTable props:', {
  invoices: props.invoices,
  groupedInvoices: props.groupedInvoices,
  viewMode: props.viewMode,
  isLoading: props.isLoading,
  totalInvoices: props.totalInvoices
});

const emit = defineEmits(['view-invoice', 'record-payment', 'generate-receipt', 'view-receipt', 'view-combined-receipt']);

// Accordion state for grouped invoices
const expandedStudents = ref([]);

// Accordion methods
const toggleStudent = (studentId) => {
  const index = expandedStudents.value.indexOf(studentId);
  if (index > -1) {
    expandedStudents.value.splice(index, 1);
  } else {
    expandedStudents.value.push(studentId);
  }
};

// Helper functions to determine payment types
const isMonthlyPayment = (invoice) => {
  return invoice.payment_model === 'monthly';
};

const isGroupedPayment = (invoice) => {
  return invoice.is_grouped === true;
};

const isInstallmentPayment = (invoice) => {
  return !isMonthlyPayment(invoice) && !isGroupedPayment(invoice) && invoice.invoice_number;
};

const getInvoiceNumber = (invoice) => {
  // Both single and grouped invoices now use unified INV- pattern
  return invoice.invoice_number || `INV-${invoice.id?.slice(-8).toUpperCase() || 'UNKNOWN'}`;
};

const getMonthsCovered = (invoice) => {
  if (isGroupedPayment(invoice)) {
    // For grouped payments, show month names with years
    if (invoice.month_names) {
      return invoice.month_names;
    }
    if (invoice.month_range && invoice.year) {
      // Convert month range to readable format
      const months = invoice.month_range.split(' - ');
      if (months.length === 2) {
        const startMonth = getMonthName(parseInt(months[0]));
        const endMonth = getMonthName(parseInt(months[1]));
        return `${startMonth} ${invoice.year} - ${endMonth} ${invoice.year}`;
      } else {
        const month = getMonthName(parseInt(months[0]));
        return `${month} ${invoice.year}`;
      }
    }
    return `${invoice.months_covered} month(s)`;
  }
  return '';
};

const getMonthsCoveredShort = (invoice) => {
  if (isGroupedPayment(invoice)) {
    // Show month count for multiple months, month name for single month
    if (invoice.months_covered > 1) {
      // Special case for 12 months - show "12 months"
      if (invoice.months_covered === 12) {
        return '12 months';
      }
      return `${invoice.months_covered} months`;
    } else if (invoice.months_covered === 1) {
      // For single month, show the month name
      if (invoice.month_range && invoice.year) {
        const months = invoice.month_range.split(' - ');
        if (months.length > 0) {
          const month = getMonthName(parseInt(months[0]));
          return month;
        }
      }
      return '1 month';
    }
    return `${invoice.months_covered} months`;
  }
  return '';
};

const getMonthName = (month) => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return months[month - 1] || month;
};

const getMonthLabel = (month) => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return months[month - 1] || month;
};

const getAmount = (invoice) => {
  return invoice.total_amount || 0;
};

const getPaidAmount = (invoice) => {
  return invoice.paid_amount || 0;
};

const getPaymentModelText = (invoice) => {
  if (isGroupedPayment(invoice)) {
    return 'Monthly';
  }
  if (isMonthlyPayment(invoice)) {
    return 'Monthly';
  }
  return 'Installment';
};

const getPaymentModelClass = (invoice) => {
  if (isGroupedPayment(invoice)) {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  }
  if (isMonthlyPayment(invoice)) {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  }
  return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
};

const getPaymentModelIcon = (invoice) => {
  if (isGroupedPayment(invoice) || isMonthlyPayment(invoice)) {
    return Calendar;
  }
  return CreditCard;
};

const getStudentName = (invoice) => {
  if (invoice.student) {
    return `${invoice.student.first_name} ${invoice.student.last_name ? invoice.student.last_name : ''}`;
  }
  return 'N/A';
};

const getBranchName = (invoice) => {
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
  const hasPayments = parseFloat(invoice.paid_amount || 0) > 0;
  return hasPayments && !isGroupedPayment(invoice);
};

const formatCurrency = (amount) => {
  return parseFloat(amount || 0).toLocaleString('en-IN');
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN');
};

// Event handlers
const viewInvoice = (invoice) => {
  emit('view-invoice', invoice);
};

const recordPayment = (invoice) => {
  emit('record-payment', invoice);
};

const viewReceipt = (invoice) => {
  emit('view-receipt', invoice);
};

const viewCombinedReceipt = (invoice) => {
  emit('view-combined-receipt', invoice);
};
</script> 