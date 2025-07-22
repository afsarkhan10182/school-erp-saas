<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Invoices & Payments</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">Manage student fee invoices and monthly payments</p>
        </div>
        <div class="mt-4 sm:mt-0 sm:flex sm:space-x-3">
          <button
            @click="showQuickCollectModal = true"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <CreditCard class="-ml-1 mr-2 h-5 w-5" />
            Quick Collect
          </button>
          <button
            @click="showGenerateModal = true"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus class="-ml-1 mr-2 h-5 w-5" />
            Generate Invoices/Payments
          </button>
          <button
            @click="showPaymentModal = true"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <CreditCard class="-ml-1 mr-2 h-5 w-5" />
            Record Payment
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <FileText class="h-6 w-6 text-gray-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Invoices</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ summary.totalInvoices || 0 }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <CheckCircle class="h-6 w-6 text-green-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Paid</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ summary.paidInvoices || 0 }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <AlertTriangle class="h-6 w-6 text-yellow-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Overdue</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ summary.overdueInvoices || 0 }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <DollarSign class="h-6 w-6 text-blue-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Collected</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">₹{{ formatCurrency(summary.totalCollected || 0) }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters Component -->
      <InvoiceFilters
        :filters="filters"
        :academic-years="academicYears"
        :classes="classes"
        :branches="branches"
        :is-loading="isLoading"
        @filter-change="onFilterChange"
        @clear-filters="clearFilters"
      />

      <!-- Invoices Table Component -->
      <InvoiceTable
        :invoices="invoices"
        :is-loading="isLoading"
        @view-invoice="viewInvoice"
        @record-payment="recordPayment"
        @generate-receipt="generateReceipt"
        @view-receipt="viewReceipt"
      />
      
      <!-- Pagination -->
      <div class="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6 rounded-b-lg">
        <div class="flex-1 flex justify-between sm:hidden">
          <button
            @click="previousPage"
            :disabled="currentPage === 1"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            @click="nextPage"
            :disabled="currentPage >= totalPages"
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700 dark:text-gray-300">
              Showing <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span> to <span class="font-medium">{{ Math.min(currentPage * pageSize, totalItems) }}</span> of <span class="font-medium">{{ totalItems }}</span> results
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                @click="previousPage"
                :disabled="currentPage === 1"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                @click="nextPage"
                :disabled="currentPage >= totalPages"
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Collect Modal -->
    <QuickCollectFeeModal
      :show="showQuickCollectModal"
      @close="showQuickCollectModal = false"
      @payment-recorded="onPaymentRecorded"
    />

    <!-- Generate Invoices Modal -->
    <GenerateInvoicesModal
      :show="showGenerateModal"
      :schools="schools"
      :branches="branches"
      :academic-years="academicYears"
      :classes="classes"
      :sections="sections"
      :monthly-fee-structures="monthlyFeeStructures"
      :is-generating="isGenerating"
      :schools-loading="schoolsLoading"
      :branches-loading="branchesLoading"
      @close="showGenerateModal = false"
      @generate="generateInvoices"
      @school-change="onModalSchoolChange"
      @branch-change="onModalBranchChange"
      @class-change="onModalClassChange"
    />
    
    <!-- Debug info -->
    <div v-if="showGenerateModal" class="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs z-50">
      <div>Schools: {{ schools?.length || 0 }}</div>
      <div>Branches: {{ branches?.length || 0 }}</div>
      <div>Academic Years: {{ academicYears?.length || 0 }}</div>
      <div>Classes: {{ classes?.length || 0 }}</div>
      <div>Sections: {{ sections?.length || 0 }}</div>
    </div>

    <!-- Payment Modal -->
    <div v-if="showPaymentModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Record Payment</h3>
          <form @submit.prevent="submitPayment">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Invoice Number</label>
                <input v-model="paymentForm.invoice_number" type="text" placeholder="Enter invoice number" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount *</label>
                <input v-model="paymentForm.amount" type="number" step="0.01" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
                <div class="relative">
                  <select 
                    v-model="paymentForm.payment_method" 
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                  <!-- Custom dropdown arrow -->
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg 
                      class="h-5 w-5 text-gray-400 dark:text-gray-500"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                <textarea v-model="paymentForm.notes" rows="3" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"></textarea>
              </div>
            </div>
            <div class="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                @click="showPaymentModal = false"
                class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isSubmittingPayment"
                class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {{ isSubmittingPayment ? 'Recording...' : 'Record Payment' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Receipt Modal -->
    <div v-if="showReceiptModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Payment Receipt</h3>
            <div class="flex items-center space-x-2">
              <!-- Print Button -->
              <button
                @click="printReceipt"
                class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Receipt
              </button>
              <!-- Download Button -->
              <button
                @click="downloadReceipt"
                class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
              >
                <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </button>
              <!-- Close Button -->
              <button
                @click="showReceiptModal = false"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div v-if="selectedReceipt" v-html="selectedReceipt.receipt_html" class="receipt-container print-friendly"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue';
import { 
  Plus, 
  CreditCard, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign,
  Search,
  GraduationCap,
  Calendar
} from 'lucide-vue-next';
import { apiClient } from '~/utils/api';
import { useAcademics } from '~/composables/useAcademics';
import { useToast } from '~/composables/useToast';
import { useAuthStore } from '~/stores/auth';
import QuickCollectFeeModal from '~/components/QuickCollectFeeModal.vue';
import InvoiceFilters from '~/components/InvoiceFilters.vue';
import InvoiceTable from '~/components/InvoiceTable.vue';
import GenerateInvoicesModal from '~/components/GenerateInvoicesModal.vue';

// Composables
const { showToast } = useToast();
const { 
  academicYears, 
  classes, 
  sections, 
  loading: academicsLoading,
  fetchAcademicYears, 
  fetchClasses, 
  fetchSections 
} = useAcademics();

// Import additional composables for the modal
import { useSchools } from '~/composables/useSchools';

const { schools, fetchSchools, loading: schoolsLoading } = useSchools();

// Auth store
const authStore = useAuthStore();

// State
const invoices = ref([]);
const summary = ref({});
const isLoading = ref(false);
const showGenerateModal = ref(false);
const showPaymentModal = ref(false);
const isGenerating = ref(false);
const isSubmittingPayment = ref(false);
const showQuickCollectModal = ref(false);
const showReceiptModal = ref(false);
const selectedReceipt = ref(null);

// Pagination
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);
const totalPages = ref(0);

// Filters
const filters = reactive({
  payment_model: '',
  branch_id: '',
  academic_year: '',
  class_name: '',
  status: '',
});

// Auto-set branch filter based on user role
const setDefaultBranchFilter = () => {
  if (authStore.isSchoolAdmin && branches.value?.length === 1) {
    // School admin with single branch - auto-set the branch filter
    filters.branch_id = branches.value[0]?.id;
  } else if (authStore.isBranchAdmin) {
    // Branch admin - auto-set their branch
    filters.branch_id = authStore.currentUser?.branch_id;
  }
};



const paymentForm = reactive({
  invoice_number: '',
  amount: '',
  payment_method: 'cash',
  notes: '',
  monthly_payment_id: null, // New field for monthly payment ID
});



// Methods
const fetchInvoices = async () => {
  isLoading.value = true;
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      ...filters
    };
    
    let allInvoices = [];
    let totalCount = 0;
    
    // Fetch based on payment model filter
    if (filters.payment_model === 'monthly' || filters.payment_model === '') {
      // Fetch monthly payments
      try {
        const monthlyResponse = await apiClient.monthlyPayments.getAll(params);
        const monthlyPayments = monthlyResponse.data.payments || [];
        allInvoices = [...allInvoices, ...monthlyPayments];
        totalCount += monthlyResponse.data.pagination?.total_count || 0;
      } catch (error) {
        console.error('Error fetching monthly payments:', error);
      }
    }
    
    if (filters.payment_model === 'installment' || filters.payment_model === '') {
      // Fetch fee invoices
      try {
        const invoiceResponse = await apiClient.feeInvoices.getAll(params);
        const feeInvoices = invoiceResponse.data.invoices || [];
        allInvoices = [...allInvoices, ...feeInvoices];
        totalCount += invoiceResponse.data.pagination?.total_count || 0;
      } catch (error) {
        console.error('Error fetching fee invoices:', error);
      }
    }
    
    // Sort combined results by date (newest first)
    allInvoices.sort((a, b) => {
      const dateA = new Date(a.due_date || a.created_at);
      const dateB = new Date(b.due_date || b.created_at);
      return dateB - dateA;
    });
    
    // Apply pagination to combined results
    const startIndex = (currentPage.value - 1) * pageSize.value;
    const endIndex = startIndex + pageSize.value;
    invoices.value = allInvoices.slice(startIndex, endIndex);
    
    totalItems.value = totalCount;
    totalPages.value = Math.ceil(totalCount / pageSize.value);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    showToast('Error fetching invoices', 'error');
  } finally {
    isLoading.value = false;
  }
};

const fetchSummary = async () => {
  try {
    let totalInvoices = 0;
    let paidInvoices = 0;
    let overdueInvoices = 0;
    let totalCollected = 0;
    let totalAmount = 0;
    let totalBalance = 0;
    
    // Fetch fee invoices summary
    try {
      const invoiceResponse = await apiClient.feeInvoices.getSummary();
      const invoiceData = invoiceResponse.data || {};
      
      totalInvoices += invoiceData.invoice_counts?.total || 0;
      paidInvoices += invoiceData.invoice_counts?.paid || 0;
      overdueInvoices += invoiceData.invoice_counts?.overdue || 0;
      totalCollected += invoiceData.amounts?.total_paid || 0;
      totalAmount += invoiceData.amounts?.total_amount || 0;
      totalBalance += invoiceData.amounts?.total_balance || 0;
    } catch (error) {
      console.error('Error fetching fee invoices summary:', error);
    }
    
    // Fetch monthly payments summary (we'll need to create this endpoint or calculate from data)
    try {
      const monthlyResponse = await apiClient.monthlyPayments.getAll({ limit: 1000 });
      const monthlyPayments = monthlyResponse.data.payments || [];
      
      totalInvoices += monthlyPayments.length;
      paidInvoices += monthlyPayments.filter(p => p.status === 'paid').length;
      overdueInvoices += monthlyPayments.filter(p => p.status === 'overdue').length;
      
      monthlyPayments.forEach(payment => {
        totalCollected += parseFloat(payment.paid_amount || 0);
        totalAmount += parseFloat(payment.due_amount || 0);
        totalBalance += parseFloat(payment.balance_amount || 0);
      });
    } catch (error) {
      console.error('Error fetching monthly payments summary:', error);
    }
    
    // Transform backend data structure to frontend expected structure
    summary.value = {
      totalInvoices,
      paidInvoices,
      overdueInvoices,
      totalCollected,
      totalAmount,
      totalBalance,
      collectionPercentage: totalAmount > 0 ? (totalCollected / totalAmount) * 100 : 0
    };
  } catch (error) {
    console.error('Error fetching summary:', error);
    showToast('Error fetching summary', 'error');
  }
};

const generateInvoices = async (formData) => {
  // Validate form based on payment model
  if (formData.payment_model === 'monthly') {
    if (!formData.fee_structure_id) {
      showToast('Please select a fee structure for monthly payments', 'error');
      return;
    }
    if (formData.months.length === 0) {
      showToast('Please select at least one month for monthly payments', 'error');
      return;
    }
  }

  isGenerating.value = true;
  try {
    if (formData.payment_model === 'monthly') {
      // Call monthly payments API
      await apiClient.monthlyPayments.generatePayments(formData);
      showToast('Monthly payments generated successfully!', 'success');
    } else {
      // Call regular invoices API
      await apiClient.feeInvoices.generateInvoices(formData);
      showToast('Invoices generated successfully!', 'success');
    }
    
    showGenerateModal.value = false;
    await fetchInvoices();
    await fetchSummary();
  } catch (error) {
    console.error('Error generating invoices:', error);
    showToast(error.message || 'Error generating invoices', 'error');
  } finally {
    isGenerating.value = false;
  }
};

const submitPayment = async () => {
  isSubmittingPayment.value = true;
  try {
    let response;
    
    if (paymentForm.monthly_payment_id) {
      // Record payment for monthly payment
      response = await apiClient.monthlyPayments.recordPayment(paymentForm.monthly_payment_id, {
        payment_amount: paymentForm.amount,
        payment_method: paymentForm.payment_method,
        notes: paymentForm.notes
      });
    } else {
      // Find invoice by number for regular invoices
      const invoice = invoices.value.find(inv => inv.invoice_number === paymentForm.invoice_number);
      if (!invoice) {
        showToast('Invoice not found!', 'error');
        return;
      }
      
      // Record payment for fee invoice
      response = await apiClient.feeInvoices.recordPayment(invoice.id, {
        payment_amount: paymentForm.amount,
        payment_method: paymentForm.payment_method,
        notes: paymentForm.notes
      });
    }
    
    showPaymentModal.value = false;
    await fetchInvoices();
    await fetchSummary();
    showToast('Payment recorded successfully!', 'success');
    
    // Automatically show receipt after successful payment
    if (response.data && response.data.receipt) {
      selectedReceipt.value = response.data.receipt;
      showReceiptModal.value = true;
    }
    
    // Reset form
    paymentForm.invoice_number = '';
    paymentForm.amount = '';
    paymentForm.payment_method = 'cash';
    paymentForm.notes = '';
    paymentForm.monthly_payment_id = null;
  } catch (error) {
    console.error('Error recording payment:', error);
    showToast(error.message || 'Error recording payment', 'error');
  } finally {
    isSubmittingPayment.value = false;
  }
};

const onFilterChange = (newFilters) => {
  Object.assign(filters, newFilters);
  currentPage.value = 1; // Reset to first page when filters change
  fetchInvoices();
};

const clearFilters = () => {
  Object.keys(filters).forEach(key => {
    filters[key] = '';
  });
  currentPage.value = 1;
  fetchInvoices();
};

const viewInvoice = (invoice) => {
  // Navigate to student fee ledger page for this invoice's student
  navigateTo(`/students/${invoice.student_id}/fee-ledger`);
};

const recordPayment = (invoice) => {
  if (isMonthlyPayment(invoice)) {
    // For monthly payments, navigate to a payment modal or use a different approach
    paymentForm.invoice_number = `MP-${invoice.id.slice(-8).toUpperCase()}`;
    paymentForm.amount = invoice.balance_amount;
    paymentForm.monthly_payment_id = invoice.id; // Store the monthly payment ID
    showPaymentModal.value = true;
  } else {
    // For regular invoices
    paymentForm.invoice_number = invoice.invoice_number;
    paymentForm.amount = invoice.balance_amount;
    paymentForm.monthly_payment_id = null; // Clear monthly payment ID
    showPaymentModal.value = true;
  }
};

// Helper function to determine if it's a monthly payment
const isMonthlyPayment = (invoice) => {
  return invoice.month !== undefined && invoice.year !== undefined;
};

const onPaymentRecorded = async () => {
  await fetchInvoices();
  await fetchSummary();
};

const generateReceipt = async (invoice) => {
  try {
    let response;
    
    if (isMonthlyPayment(invoice)) {
      // Generate receipt for monthly payment
      response = await apiClient.monthlyPayments.generateReceipt(invoice.id);
    } else {
      // Generate receipt for fee invoice
      response = await apiClient.feeInvoices.generateReceipt(invoice.id);
    }
    
    showToast('Receipt generated successfully!', 'success');
    await fetchInvoices(); // Refresh to show updated receipt_number
    if (response.data.receipt) {
      // Show receipt modal
      selectedReceipt.value = response.data.receipt;
      showReceiptModal.value = true;
    }
  } catch (error) {
    console.error('Error generating receipt:', error);
    showToast(error.message || 'Error generating receipt', 'error');
  }
};

const viewReceipt = async (invoice) => {
  try {
    let response;
    
    if (isMonthlyPayment(invoice)) {
      // Get receipt for monthly payment
      response = await apiClient.monthlyPayments.generateReceipt(invoice.id);
    } else {
      // Get receipt for fee invoice
      response = await apiClient.feeInvoices.getReceipt(invoice.id);
    }
    
    if (response.data.receipt) {
      selectedReceipt.value = response.data.receipt;
      showReceiptModal.value = true;
    }
  } catch (error) {
    console.error('Error fetching receipt:', error);
    showToast('Error fetching receipt', 'error');
  }
};

const printReceipt = () => {
  if (!selectedReceipt.value) return;
  
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  const receiptHtml = selectedReceipt.value.receipt_html;
  
  // Add print-specific styles
  const printStyles = `
    <style>
      @media print {
        body { margin: 0; padding: 0; }
        .receipt { 
          width: 100% !important; 
          max-width: none !important; 
          margin: 0 !important; 
          box-shadow: none !important; 
          border: none !important; 
        }
        .header { 
          background: #f8f9fa !important; 
          color: #000 !important; 
        }
        .trust-name, .school-name, .school-type, .school-address { 
          color: #000 !important; 
        }
        .receipt-title { 
          color: #000 !important; 
        }
        .info-label, .info-value { 
          color: #000 !important; 
        }
        .fee-table th, .fee-table td { 
          color: #000 !important; 
          border-color: #000 !important; 
        }
        .summary-section { 
          background: #f8f9fa !important; 
          color: #000 !important; 
        }
        .remaining-info { 
          background: #fff3cd !important; 
          color: #856404 !important; 
        }
        .signature-line { 
          border-color: #000 !important; 
        }
      }
      body { 
        font-family: Arial, sans-serif; 
        margin: 0; 
        padding: 20px; 
        background-color: #ffffff;
        color: #000000;
      }
      .receipt {
        width: 400px;
        background: white;
        border: 1px solid #ddd;
        margin: 0 auto;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      .header {
        text-align: center;
        padding: 15px;
        border-bottom: 2px solid #333;
        background: #f8f9fa;
        color: #000;
      }
      .trust-name, .school-name, .school-type, .school-address {
        color: #000 !important;
      }
      .receipt-title {
        color: #000 !important;
      }
      .info-label, .info-value {
        color: #000 !important;
      }
      .fee-table th, .fee-table td {
        color: #000 !important;
        border-color: #000 !important;
      }
      .summary-section {
        background: #f8f9fa !important;
        color: #000 !important;
      }
      .remaining-info {
        background: #fff3cd !important;
        color: #856404 !important;
      }
    </style>
  `;
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Receipt - Print</title>
      ${printStyles}
    </head>
    <body>
      ${receiptHtml}
    </body>
    </html>
  `);
  
  printWindow.document.close();
  printWindow.focus();
  
  // Wait for content to load then print
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
};

// Download receipt as HTML file
const downloadReceipt = () => {
  if (!selectedReceipt.value) return;

  const receiptHtml = selectedReceipt.value.receipt_html;
  const receiptBlob = new Blob([receiptHtml], { type: 'text/html' });
  const receiptUrl = URL.createObjectURL(receiptBlob);
  const a = document.createElement('a');
  a.href = receiptUrl;
  a.download = `receipt_${selectedReceipt.value.receipt_number || Date.now()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(receiptUrl);
};

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchInvoices();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchInvoices();
  }
};

const formatCurrency = (amount) => {
  return parseFloat(amount || 0).toLocaleString('en-IN');
};

// Load academic data
const loadAcademicData = async () => {
  try {
    await Promise.all([
      fetchAcademicYears(),
      fetchClasses(),
      fetchSchools() // Fetch schools for super admin
    ]);
    
    // Set current academic year as default
    if (academicYears.value.length > 0) {
      const currentYear = academicYears.value.find(y => y.is_current) || academicYears.value[0];
      if (currentYear) {
        filters.academic_year = currentYear.name;
      }
    }
  } catch (error) {
    console.error('Error loading academic data:', error);
    showToast('Error loading academic data', 'error');
  }
};

// Fetch monthly fee structures
const monthlyFeeStructures = ref([]);
const fetchMonthlyFeeStructures = async () => {
  try {
    const response = await apiClient.feeInvoices.getMonthlyFeeStructures();
    monthlyFeeStructures.value = response.data || [];
  } catch (error) {
    console.error('Error fetching monthly fee structures:', error);
    showToast('Error fetching monthly fee structures', 'error');
  }
};

// Modal event handlers for dynamic data loading
const onModalSchoolChange = async (schoolId) => {
  console.log('🔍 Modal school change:', schoolId);
  if (schoolId) {
    // For super admin, filter branches by selected school
    if (authStore.isSuperAdmin) {
      await fetchBranches();
    }
  }
};

const onModalBranchChange = async (branchId) => {
  console.log('🔍 Modal branch change:', branchId);
  if (branchId) {
    // Fetch classes for the selected branch
    await fetchClasses();
  }
};

const onModalClassChange = async (className) => {
  console.log('🔍 Modal class change:', className);
  if (className) {
    const classItem = classes.value.find(c => c.name === className);
    if (classItem) {
      // Get the current branch ID from the modal form or user context
      const branchId = authStore.currentUser?.branch_id;
      await fetchSections(
        authStore.currentUser?.school_id, 
        branchId, 
        classItem.id
      );
    }
  }
};

// Branches state and fetch function
const branches = ref([]);

// Debug logging for data loading
watch([schools, branches, academicYears, classes, sections], ([newSchools, newBranches, newAcademicYears, newClasses, newSections]) => {
  console.log('🔍 Data updated:', {
    schools: newSchools?.length || 0,
    branches: newBranches?.length || 0,
    academicYears: newAcademicYears?.length || 0,
    classes: newClasses?.length || 0,
    sections: newSections?.length || 0
  });
});

const fetchBranches = async () => {
  try {
    let response;
    
    if (authStore.isSuperAdmin) {
      // Super admin can see all branches
      response = await apiClient.branches.getAll();
    } else if (authStore.isSchoolAdmin) {
      // School admin sees only their school's branches
      response = await apiClient.branches.getBySchool(authStore.currentUser?.school_id);
    } else if (authStore.isBranchAdmin) {
      // Branch admin sees only their branch
      response = await apiClient.branches.getById(authStore.currentUser?.branch_id);
      branches.value = response.data ? [response.data] : [];
      return;
    } else {
      // Default fallback
      response = await apiClient.branches.getAll();
    }
    
    branches.value = response.data.branches || response.data || [];
  } catch (error) {
    console.error('Error fetching branches:', error);
    showToast('Error fetching branches', 'error');
  }
};


onMounted(async () => {
  try {
    await loadAcademicData();
    await fetchBranches();
    setDefaultBranchFilter(); // Set default branch filter based on role
    await fetchInvoices();
    await fetchSummary();
    await fetchMonthlyFeeStructures();
  } catch (error) {
    console.error('Error during component initialization:', error);
    showToast('Error initializing component', 'error');
  }
});
</script>

<style scoped>
/****************************************************
  Tailwind CSS styles are generated from utilities.
  Add custom styles here.
****************************************************/

.receipt-container {
  max-height: 70vh;
  overflow-y: auto;
}

/* Dark mode improvements for receipt */
.receipt-container :deep(.receipt) {
  background: white !important;
  color: #000 !important;
}

.receipt-container :deep(.header) {
  background: #f8f9fa !important;
  color: #000 !important;
}

.receipt-container :deep(.trust-name),
.receipt-container :deep(.school-name),
.receipt-container :deep(.school-type),
.receipt-container :deep(.school-address) {
  color: #000 !important;
}

.receipt-container :deep(.receipt-title) {
  color: #000 !important;
}

.receipt-container :deep(.info-label),
.receipt-container :deep(.info-value) {
  color: #000 !important;
}

.receipt-container :deep(.fee-table th),
.receipt-container :deep(.fee-table td) {
  color: #000 !important;
  border-color: #000 !important;
}

.receipt-container :deep(.summary-section) {
  background: #f8f9fa !important;
  color: #000 !important;
}

.receipt-container :deep(.remaining-info) {
  background: #fff3cd !important;
  color: #856404 !important;
}

.receipt-container :deep(.signature-line) {
  border-color: #000 !important;
}

/* Print-friendly styles */
@media print {
  .receipt-container {
    max-height: none !important;
    overflow: visible !important;
  }
  
  .receipt-container :deep(.receipt) {
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    box-shadow: none !important;
    border: none !important;
  }
}
</style>

