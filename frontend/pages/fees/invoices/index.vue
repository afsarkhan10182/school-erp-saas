<template>
  <div class="bg-gray-50 dark:bg-gray-900 relative z-0">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-0">
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
            Generate Invoices
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
      
      <!-- Invoices Table Component with Pagination -->
      <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <InvoiceTable
          :invoices="invoices"
          :grouped-invoices="paginatedGroupedInvoices"
          :individual-invoices="[]"
          :view-mode="'grouped'"
          :is-loading="isLoading"
          :total-invoices="invoices.length"
          @view-invoice="viewInvoice"
          @record-payment="recordPayment"
          @generate-receipt="generateReceipt"
          @view-receipt="viewReceipt"
          @view-combined-receipt="viewCombinedReceipt"
        />
      </div>
        
        <!-- Pagination -->
        <div v-if="totalStudentGroups > 0" class="px-4 py-4 border-t border-gray-200 dark:border-gray-700 md:px-6">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <!-- Results Info and Page Size -->
            <div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <p class="text-sm text-gray-700 dark:text-gray-300">
                Showing <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span> to <span class="font-medium">{{ Math.min(currentPage * pageSize, totalStudentGroups) }}</span> of <span class="font-medium">{{ totalStudentGroups }}</span> students
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                ({{ invoices.length }} invoices)
              </p>
              
              <!-- Page Size Selector -->
              <div class="flex items-center space-x-2">
                <label class="text-sm text-gray-700 dark:text-gray-300">Show:</label>
                <select 
                  v-model="pageSize" 
                  @change="onPageSizeChange"
                  class="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <span class="text-sm text-gray-700 dark:text-gray-300">students per page</span>
              </div>
            </div>
            
            <!-- Navigation -->
            <div class="flex items-center justify-center sm:justify-end space-x-2">
              <!-- Previous Button -->
              <button
                @click="previousPage"
                :disabled="currentPage === 1"
                class="relative inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              
              <!-- Page Numbers -->
              <div v-if="totalPagesForGroups > 1" class="flex items-center space-x-1">
                <button
                  v-for="pageNum in getVisiblePages()"
                  :key="pageNum"
                  @click="goToPage(pageNum)"
                  :class="[
                    'px-3 py-2 text-sm font-medium rounded-md min-w-[40px]',
                    pageNum === currentPage
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 bg-white border border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  ]"
                  :disabled="pageNum === '...'"
                >
                  {{ pageNum }}
                </button>
              </div>
              
              <!-- Next Button -->
              <button
                @click="nextPage"
                :disabled="currentPage >= totalPagesForGroups"
                class="relative inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Collect Modal -->
    <QuickCollectFeeModal
      :show="showQuickCollectModal"
      @close="showQuickCollectModal = false"
      @payment-recorded="onPaymentRecorded"
      @view-combined-receipt="viewCombinedReceipt"
    />

    <!-- Generate Invoices Modal -->
    <GenerateInvoicesModal
      :show="showGenerateModal"
      :schools="schools"
      :branches="branches"
      :academic-years="academicYears"
      :classes="classes"
      :sections="sections"
      :monthly-fee-structures="allFeeStructures"
      :is-generating="isGenerating"
      :schools-loading="schoolsLoading"
      :branches-loading="false"
      @close="closeGenerateModal"
      @generate="generateInvoices"
      @school-change="onModalSchoolChange"
      @branch-change="onModalBranchChange"
      @class-change="onModalClassChange"
    />
    
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
                <!-- Month Information for Monthly Payments -->
                <div v-if="selectedInvoiceForPayment && selectedInvoiceForPayment.payment_model === 'monthly' && selectedInvoiceForPayment.month && selectedInvoiceForPayment.year" class="mt-2">
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    📅 Paying for: {{ getMonthName(selectedInvoiceForPayment.month) }} {{ selectedInvoiceForPayment.year }}
                  </p>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount *</label>
                <input v-model="paymentForm.amount" type="number" step="0.01" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white">
                <!-- Monthly Payment Info -->
                <div v-if="selectedInvoiceForPayment && selectedInvoiceForPayment.payment_model === 'monthly'" class="mt-2">
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Monthly amount: ₹{{ formatCurrency(selectedInvoiceForPayment.total_amount) }}
                  </p>
                </div>
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
                @click="closePaymentModal"
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

    <!-- Multiple Payments Modal -->
    <div v-if="showMultiplePaymentsModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-10 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Payment History & Receipts</h3>
            <button
              @click="showMultiplePaymentsModal = false"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div v-if="selectedMultiplePayments" class="space-y-6">
            <!-- Invoice Information -->
            <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 class="font-medium text-gray-900 dark:text-white mb-2">Invoice Details</h4>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Invoice:</span>
                  <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ selectedMultiplePayments.invoice.invoice_number }}</span>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Total Amount:</span>
                  <span class="ml-2 font-medium text-gray-900 dark:text-white">₹{{ formatCurrency(selectedMultiplePayments.invoice.total_amount) }}</span>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Paid Amount:</span>
                  <span class="ml-2 font-medium text-gray-900 dark:text-white">₹{{ formatCurrency(selectedMultiplePayments.invoice.paid_amount) }}</span>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Balance:</span>
                  <span class="ml-2 font-medium text-gray-900 dark:text-white">₹{{ formatCurrency(selectedMultiplePayments.invoice.balance_amount) }}</span>
                </div>
              </div>
            </div>

            <!-- Payments List -->
            <div>
              <h4 class="font-medium text-gray-900 dark:text-white mb-3">Payment History ({{ selectedMultiplePayments.total_payments }} payments)</h4>
              <div class="space-y-3">
                <div 
                  v-for="(paymentItem, index) in selectedMultiplePayments.payments" 
                  :key="paymentItem.payment.id"
                  class="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <div class="flex items-center justify-between mb-2">
                        <h5 class="font-medium text-gray-900 dark:text-white">
                          Payment #{{ paymentItem.payment.payment_number }}
                        </h5>
                        <span class="text-sm text-gray-500 dark:text-gray-400">
                          {{ formatDate(paymentItem.payment.payment_date) }}
                        </span>
                      </div>
                      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span class="text-gray-500 dark:text-gray-400">Amount:</span>
                          <span class="ml-2 font-medium text-gray-900 dark:text-white">₹{{ formatCurrency(paymentItem.payment.payment_amount) }}</span>
                        </div>
                        <div>
                          <span class="text-gray-500 dark:text-gray-400">Method:</span>
                          <span class="ml-2 font-medium text-gray-900 dark:text-white capitalize">{{ paymentItem.payment.payment_method }}</span>
                        </div>
                        <div>
                          <span class="text-gray-500 dark:text-gray-400">Receipt:</span>
                          <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ paymentItem.receipt.receipt_number }}</span>
                        </div>
                        <div>
                          <button
                            @click="viewPaymentReceipt(paymentItem)"
                            class="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                          >
                            <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Receipt
                          </button>
                        </div>
                      </div>
                    </div>
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
const showGenerateModal = ref(false); // Ensure modal starts closed
const showPaymentModal = ref(false);
const isGenerating = ref(false);
const isSubmittingPayment = ref(false);
const showQuickCollectModal = ref(false);
const showReceiptModal = ref(false);
const selectedReceipt = ref(null);
const selectedInvoiceForPayment = ref(null);
const showMultiplePaymentsModal = ref(false);
const selectedMultiplePayments = ref(null);

// Pagination - Set to exactly 10 records
const currentPage = ref(1);
const pageSize = ref(10);
const totalPages = ref(0);

// View mode (only grouped)
const viewMode = ref('grouped');

// Filters - Start with empty filters
const filters = reactive({
  payment_model: '',
  branch_id: '',
  academic_year: '',
  class_name: '',
  status: '',
});

// Use existing data from composables - no need to redeclare

// Role-based computed properties
const isSuperAdmin = computed(() => authStore.currentUser?.role === 'super_admin');
const isSchoolAdmin = computed(() => authStore.currentUser?.role === 'school_admin');
const isBranchAdmin = computed(() => authStore.currentUser?.role === 'branch_admin');

// Check if any filters are applied (for debugging purposes)
const hasAppliedFilters = computed(() => {
  return Object.values(filters).some(value => value !== '');
});

// Computed properties for accordion grouping
const groupedInvoices = computed(() => {
  console.log('🔄 Computing groupedInvoices with:', invoices.value);
  
  if (!invoices.value || invoices.value.length === 0) {
    console.log('❌ No invoices to group');
    return [];
  }



  // Group invoices by student
  const grouped = {};
  
  invoices.value.forEach(invoice => {
    const studentId = invoice.student?.id || invoice.student_id;
    

    
    const studentName = invoice.student?.first_name && invoice.student?.last_name 
      ? `${invoice.student.first_name} ${invoice.student.last_name}`
      : invoice.student?.first_name 
        ? invoice.student.first_name
        : invoice.student?.name || 'Unknown Student';
    const admissionNumber = invoice.student?.admission_number || 'N/A';
    const className = invoice.class_name || invoice.student?.current_class || 'N/A';
    const studentPhoto = invoice.student?.photo_url || null;

    if (!grouped[studentId]) {
      grouped[studentId] = {
        studentId,
        studentName,
        admissionNumber,
        className,
        studentPhoto,
        invoices: [],
        totalAmount: 0,
        paidCount: 0,
        pendingCount: 0,
        overdueCount: 0
      };
    }

    // Add invoice to student group
    grouped[studentId].invoices.push(invoice);
    
    // Update totals
    grouped[studentId].totalAmount += parseFloat(invoice.total_amount || 0);
    
    // Update status counts
    if (invoice.status === 'paid') {
      grouped[studentId].paidCount++;
    } else if (invoice.status === 'overdue') {
      grouped[studentId].overdueCount++;
    } else {
      grouped[studentId].pendingCount++;
    }
  });

  // Convert to array and sort by student name
  const result = Object.values(grouped).sort((a, b) => a.studentName.localeCompare(b.studentName));
  console.log('✅ Grouped invoices result:', result);
  return result;
});

// Paginated grouped results for display (frontend pagination by students)
const paginatedGroupedInvoices = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  const result = groupedInvoices.value.slice(startIndex, endIndex);
  
  console.log('📄 Pagination Debug:', {
    currentPage: currentPage.value,
    pageSize: pageSize.value,
    totalGroups: groupedInvoices.value.length,
    startIndex,
    endIndex,
    resultLength: result.length,
    totalPages: totalPagesForGroups.value,
    allStudents: groupedInvoices.value.map(s => s.studentName),
    paginatedStudents: result.map(s => s.studentName)
  });
  
  return result;
});

// Total student groups for pagination
const totalStudentGroups = computed(() => groupedInvoices.value.length);

// Total pages for student groups
const totalPagesForGroups = computed(() => {
  const pages = Math.ceil(totalStudentGroups.value / pageSize.value);
  console.log('📖 Total Pages for Groups:', pages, '(Groups:', totalStudentGroups.value, '/ PageSize:', pageSize.value, ')');
  return pages;
});





// Auto-set branch filter based on user role
const setDefaultBranchFilter = () => {
  if (authStore.currentUser?.role === 'branch_admin') {
    // Branch admin should be restricted to their branch
    filters.branch_id = authStore.currentUser.branch_id;
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
    // Build params object with filters (no pagination - get all invoices)
    const params = {
      limit: 1000 // Set a high limit to get all invoices
    };
    
    // Add filters only if they have values
    if (filters.payment_model) params.payment_model = filters.payment_model;
    if (filters.branch_id) params.branch_id = filters.branch_id;
    if (filters.academic_year) params.academic_year = filters.academic_year;
    if (filters.class_name) params.class_name = filters.class_name;
    if (filters.status) params.status = filters.status;
    
    console.log('🔍 Fetching all invoices with params:', params);
    
    // Use the existing invoices.getAll API - get all invoices without pagination
    const response = await apiClient.invoices.getAll(params);
    
    console.log('📊 API Response:', response);
    console.log('📋 Invoices data:', response.data);
    console.log('📄 Invoices array:', response.data.invoices);
    
    // The API client returns response.data, so we access the data directly
    invoices.value = response.data.invoices || [];
    
    console.log('✅ Assigned invoices:', invoices.value);
    console.log('📊 Total invoices:', invoices.value.length);
    
    // Reset pagination to first page when new data is loaded
    currentPage.value = 1;
    
    // Calculate summary from the actual invoice data
    const totalInvoices = invoices.value.length;
    
    // Count paid invoices (including grouped invoices which are paid)
    const paidInvoices = invoices.value.filter(inv => 
      inv.status === 'paid' || inv.is_grouped
    ).length;
    
    // Count overdue invoices
    const overdueInvoices = invoices.value.filter(inv => inv.status === 'overdue').length;
    
    // Calculate total collected amount
    const totalCollected = invoices.value.reduce((sum, inv) => {
      return sum + parseFloat(inv.paid_amount || 0);
    }, 0);
    
    summary.value = {
      totalInvoices,
      paidInvoices,
      overdueInvoices,
      totalCollected
    };
    
    console.log('📈 Summary:', summary.value);
    
  } catch (error) {
    console.error('❌ Error fetching invoices:', error);
    showToast('Error fetching invoices', 'error');
  } finally {
    isLoading.value = false;
  }
};



const closeGenerateModal = () => {
  showGenerateModal.value = false;
};

const generateInvoices = async (formData) => {
  // Validate form based on payment model
  if (!formData.fee_structure_ids || formData.fee_structure_ids.length === 0) {
    showToast('Please select at least one fee structure', 'error');
    return;
  }

  if (formData.payment_model === 'monthly') {
    if (!formData.months || formData.months.length === 0) {
      showToast('Please select at least one month for monthly payments', 'error');
      return;
    }
    if (!formData.year) {
      showToast('Please select a year for monthly payments', 'error');
      return;
    }
  } else if (formData.payment_model === 'installment') {
    // Due date validation removed - it comes from fee structure
  }

  isGenerating.value = true;
  try {
    // Unified approach - use the same API for both monthly and installment payments
    const response = await apiClient.feeInvoices.generateInvoices(formData);
    
    // Show detailed success information
    const totalGenerated = response.data.total_generated || 0;
    const errors = response.data.errors || [];
    
    if (errors.length > 0) {
      showToast(`Partial success: Generated ${totalGenerated} invoices. ${errors.length} students had existing invoices.`, 'warning');
    } else {
      showToast(`Successfully generated ${totalGenerated} invoices!`, 'success');
    }
    
    showGenerateModal.value = false;
    await fetchInvoices();
  } catch (error) {
    if (error.response && error.response.data) {
      const responseData = error.response.data;
      
      if (responseData.errors && responseData.errors.length > 0) {
        // Show detailed error information
        const totalErrors = responseData.errors.length;
        const totalGenerated = responseData.total_generated || 0;
        
        if (totalGenerated > 0) {
          showToast(`Partial success: Generated ${totalGenerated} invoices. ${totalErrors} students had existing invoices.`, 'warning');
        } else {
          showToast(`No invoices generated. ${totalErrors} students already have invoices for this period.`, 'error');
        }
        
        // Log detailed errors for debugging
        console.log('Invoice generation errors:', responseData.errors);
      } else if (responseData.message) {
        showToast(responseData.message, 'error');
      } else {
        showToast('Error generating invoices', 'error');
      }
    } else {
      showToast('Error generating invoices', 'error');
    }
  } finally {
    isGenerating.value = false;
  }
};

const submitPayment = async () => {
  isSubmittingPayment.value = true;
  try {
    let response;
    
        // Find invoice by number for regular invoices
    const invoice = invoices.value.find(inv => inv.invoice_number === paymentForm.invoice_number);
    if (!invoice) {
      showToast('Invoice not found!', 'error');
      return;
    }
    
    // Record payment for fee invoice (works for both installment and monthly)
    response = await apiClient.feeInvoices.recordPayment(invoice.id, {
      payment_amount: paymentForm.amount,
      payment_method: paymentForm.payment_method,
      notes: paymentForm.notes
    });
    
    closePaymentModal();
    await fetchInvoices();
    showToast('Payment recorded successfully!', 'success');
    
    // Automatically show receipt after successful payment
    if (response.data && response.data.receipt) {
      selectedReceipt.value = response.data.receipt;
      showReceiptModal.value = true;
    }
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      showToast(error.response.data.message, 'error');
    } else {
      showToast('Error recording payment', 'error');
    }
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

// Update pagination methods for grouped students (frontend pagination)
const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    // No need to fetch from backend - just update the page
  }
};

const nextPage = () => {
  if (currentPage.value < totalPagesForGroups.value) {
    currentPage.value++;
    // No need to fetch from backend - just update the page
  }
};

const goToPage = (page) => {
  if (page >= 1 && page <= totalPagesForGroups.value) {
    currentPage.value = page;
    // No need to fetch from backend - just update the page
  }
};

const onPageSizeChange = () => {
  currentPage.value = 1; // Reset to first page when page size changes
  // No need to fetch from backend - just update the page size
};



const getVisiblePages = () => {
  const pages = [];
  const totalPagesValue = totalPagesForGroups.value;
  const current = currentPage.value;
  
  if (totalPagesValue <= 7) {
    // Show all pages if total is 7 or less
    for (let i = 1; i <= totalPagesValue; i++) {
      pages.push(i);
    }
  } else {
    // Show first page, last page, current page, and pages around current
    if (current <= 4) {
      // Near the beginning
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPagesValue);
    } else if (current >= totalPagesValue - 3) {
      // Near the end
      pages.push(1);
      pages.push('...');
      for (let i = totalPagesValue - 4; i <= totalPagesValue; i++) {
        pages.push(i);
      }
    } else {
      // In the middle
      pages.push(1);
      pages.push('...');
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPagesValue);
    }
  }
  
  return pages;
};

// Add back the missing methods
const viewInvoice = (invoice) => {
  // Navigate to student fee ledger page for this invoice's student
  navigateTo(`/students/${invoice.student_id}/fee-ledger`);
};

const recordPayment = (invoice) => {
  // Unified approach - works for both installment and monthly invoices
  paymentForm.invoice_number = invoice.invoice_number;
  paymentForm.amount = invoice.balance_amount;
  selectedInvoiceForPayment.value = invoice; // Store the invoice for payment suggestions
  showPaymentModal.value = true;
};

// Helper function to determine if it's a monthly payment
const isMonthlyPayment = (invoice) => {
  // Simplified - only check payment_model field since we have unified approach
  return invoice.payment_model === 'monthly';
};

const onPaymentRecorded = async () => {
  // Clear any filters that might be causing "no results" after payment
  // This ensures the user can see the updated invoice status
  Object.keys(filters).forEach(key => {
    filters[key] = '';
  });
  
  await fetchInvoices();
};

const generateReceipt = async (invoice) => {
  try {
    // For invoices that have payments but no receipt, we should view the existing receipt
    // The "Generate Receipt" button should actually be "View Receipt" for paid invoices
    const response = await apiClient.feeInvoices.getReceipt(invoice.id);
    
    if (response.data && response.data.receipt_html) {
      // Show receipt modal - the receipt data is directly in response.data
      selectedReceipt.value = response.data;
      showReceiptModal.value = true;
    } else {
      showToast('No receipt found for this invoice', 'error');
    }
  } catch (error) {
    console.error('Error fetching receipt:', error);
    if (error.response && error.response.data && error.response.data.message) {
      showToast(error.response.data.message, 'error');
    } else {
      showToast('Error fetching receipt', 'error');
    }
  }
};

const viewReceipt = async (invoice) => {
  try {
    // Unified approach - use feeInvoices API for both monthly and installment invoices
    const response = await apiClient.feeInvoices.getReceipt(invoice.id);
    
    if (response.data) {
      // Check if this is a multiple payments response
      if (response.data.has_multiple_payments && response.data.payments && response.data.payments.length > 0) {
        // Show multiple payments modal
        selectedMultiplePayments.value = response.data;
        showMultiplePaymentsModal.value = true;
      } else if (response.data.receipt_html) {
        // Single receipt - show receipt modal
        selectedReceipt.value = response.data;
        showReceiptModal.value = true;
      } else {
        showToast('No receipt found for this invoice', 'error');
      }
    } else {
      showToast('No receipt found for this invoice', 'error');
    }
  } catch (error) {
    showToast('Error fetching receipt', 'error');
  }
};

const viewPaymentReceipt = (paymentItem) => {
  try {
    // Show the individual payment receipt
    selectedReceipt.value = {
      receipt_number: paymentItem.receipt.receipt_number,
      receipt_html: paymentItem.receipt.receipt_html,
      receipt_data: paymentItem.receipt.receipt_data,
      payment: paymentItem.payment,
      invoice: selectedMultiplePayments.value.invoice,
    };
    
    // Close multiple payments modal and show receipt modal
    showMultiplePaymentsModal.value = false;
    showReceiptModal.value = true;
  } catch (error) {
    showToast('Error viewing payment receipt', 'error');
  }
};

const viewCombinedReceipt = async (combinedInvoice) => {
  try {
    // Use receipt_group_id instead of id for grouped receipts
    const receiptGroupId = combinedInvoice.receipt_group_id || combinedInvoice.id;
    const response = await apiClient.feeInvoices.getCombinedReceipt(receiptGroupId);

    if (response.data && response.data.receipt_html) {
      selectedReceipt.value = response.data;
      showReceiptModal.value = true;
    } else {
      showToast('No receipt found for this combined invoice', 'error');
    }
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      showToast(error.response.data.message, 'error');
    } else {
      showToast('Error fetching combined receipt', 'error');
    }
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

// Add missing methods referenced in template
const getInvoiceNumber = (invoice) => {
  return invoice.invoice_number || invoice.id;
};

const isGroupedPayment = (invoice) => {
  return invoice.payment_model === 'installment';
};

const getMonthsCovered = (invoice) => {
  if (invoice.months_covered) {
    return invoice.months_covered;
  }
  return 'N/A';
};

const getPaymentModelClass = (invoice) => {
  if (isMonthlyPayment(invoice)) {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  } else if (isGroupedPayment(invoice)) {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  }
  return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
};

const getPaymentModelIcon = (invoice) => {
  if (isMonthlyPayment(invoice)) {
    return Calendar;
  } else if (isGroupedPayment(invoice)) {
    return GraduationCap;
  }
  return FileText;
};

const getPaymentModelText = (invoice) => {
  if (isMonthlyPayment(invoice)) {
    return 'Monthly';
  } else if (isGroupedPayment(invoice)) {
    return 'Installment';
  }
  return 'Single';
};

const getStudentName = (invoice) => {
  if (invoice.student?.first_name && invoice.student?.last_name) {
    return `${invoice.student.first_name} ${invoice.student.last_name}`;
  }
  return invoice.student?.name || 'Unknown Student';
};

const getBranchName = (invoice) => {
  return invoice.student?.branch?.name || invoice.branch_name || 'N/A';
};

const getClassDisplay = (invoice) => {
  return invoice.class_name || invoice.student?.current_class || 'N/A';
};

const getAmount = (invoice) => {
  return parseFloat(invoice.total_amount || 0);
};

const getPaidAmount = (invoice) => {
  return parseFloat(invoice.paid_amount || 0);
};

const getStatusClass = (status) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'partial_paid':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'overdue':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'unpaid':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'paid':
      return 'Paid';
    case 'partial_paid':
      return 'Partial Paid';
    case 'overdue':
      return 'Overdue';
    case 'unpaid':
      return 'Unpaid';
    default:
      return 'Unknown';
  }
};

const formatCurrency = (amount) => {
  return parseFloat(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN');
};

const getMonthLabel = (month) => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return months[month - 1] || 'Unknown';
};

const getMonthName = (month) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || 'Unknown';
};

// Simplified academic data loading - only load when modal is opened
const loadAcademicDataForModal = async () => {
  try {
    // Only fetch when modal is opened
    await Promise.all([
      fetchAcademicYears(),
      fetchClasses(),
      fetchSchools()
    ]);
  } catch (error) {
    // Error loading academic data
  }
};

// Fetch monthly fee structures
const monthlyFeeStructures = ref([]);
const installmentFeeStructures = ref([]);

const fetchMonthlyFeeStructures = async () => {
  try {
    const response = await apiClient.feeStructures.getWithContext({ payment_model: 'monthly' });
    monthlyFeeStructures.value = response.data.fee_structures || [];
  } catch (error) {
    showToast('Error loading monthly fee structures', 'error');
    monthlyFeeStructures.value = [];
  }
};

const fetchInstallmentFeeStructures = async () => {
  try {
    const response = await apiClient.feeStructures.getWithContext({ payment_model: 'installment' });
    installmentFeeStructures.value = response.data.fee_structures || [];
  } catch (error) {
    showToast('Error loading installment fee structures', 'error');
  }
};

// Simplified fee structures fetch - only when modal is opened
const fetchFeeStructuresForModal = async () => {
  try {
    await Promise.all([
      fetchMonthlyFeeStructures(),
      fetchInstallmentFeeStructures()
    ]);
  } catch (error) {
    // Error fetching fee structures
  }
};

// Combined fee structures for the modal
const allFeeStructures = computed(() => {
  return [...monthlyFeeStructures.value, ...installmentFeeStructures.value];
});

// Modal event handlers for dynamic data loading
const onModalSchoolChange = async (schoolId) => {
  if (schoolId) {
    // For super admin, filter branches by selected school
    if (authStore.isSuperAdmin) {
      await fetchBranches();
    }
  }
};

const onModalBranchChange = async (branchId) => {
  if (branchId) {
    // Fetch classes for the selected branch
    await fetchClasses();
  }
};

const onModalClassChange = async (className) => {
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

// Branches state - will be populated when modal opens
const branches = ref([]);

// Debug logging for data loading
watch([schools, branches, academicYears, classes, sections], ([newSchools, newBranches, newAcademicYears, newClasses, newSections]) => {
  // console.log('🔍 Data updated:', {
  //   schools: newSchools?.length || 0,
  //   branches: newBranches?.length || 0,
  //   academicYears: newAcademicYears?.length || 0,
  //   classes: newClasses?.length || 0,
  //   sections: newSections?.length || 0
  // });
});

const fetchBranches = async () => {
  try {
    let response;
    
    if (authStore.isSuperAdmin) {
      // Super admin can see all branches
      response = await apiClient.branches.getAll();
      branches.value = response.data?.branches || response.data || [];
    } else if (authStore.isSchoolAdmin) {
      // School admin sees only their school's branches
      response = await apiClient.branches.getBySchool(authStore.currentUser?.school_id);
      branches.value = response.data?.branches || response.data || [];
    } else if (authStore.isBranchAdmin) {
      // Branch admin sees only their branch
      response = await apiClient.branches.getById(authStore.currentUser?.branch_id);
      branches.value = response.data ? [response.data] : [];
    } else {
      // Default fallback
      response = await apiClient.branches.getAll();
      branches.value = response.data?.branches || response.data || [];
    }
    
  } catch (error) {
    console.error('Error fetching branches:', error);
    showToast('Error fetching branches', 'error');
    branches.value = [];
  }
};

// Load academic data on page load
const loadAcademicData = async () => {
  try {
    // Get user context for API calls
    const schoolId = authStore.currentUser?.school_id;
    const branchId = authStore.currentUser?.branch_id;
    
    // Load academic years and classes for filters with individual error handling
    const promises = [];
    
    // Academic years
    promises.push(
      fetchAcademicYears(schoolId).catch(error => {
        console.error('Error fetching academic years:', error);
        return null;
      })
    );
    
    // Classes
    promises.push(
      fetchClasses(schoolId, branchId).catch(error => {
        console.error('Error fetching classes:', error);
        return null;
      })
    );
    
    // Branches
    promises.push(
      fetchBranches().catch(error => {
        console.error('Error fetching branches:', error);
        return null;
      })
    );
    
    await Promise.all(promises);
    
    // Show warning if any data failed to load
    if (academicYears.value.length === 0) {
      console.warn('⚠️ No academic years loaded');
    }
    if (classes.value.length === 0) {
      console.warn('⚠️ No classes loaded');
    }
    if (branches.value.length === 0) {
      console.warn('⚠️ No branches loaded');
    }
    
  } catch (error) {
    console.error('Error loading academic data:', error);
    showToast('Error loading filter data', 'error');
  }
};


onMounted(async () => {
  try {
    // Load localStorage value on client-side
    if (import.meta.client) {
      const savedPageSize = localStorage.getItem('invoicesPageSize');
      if (savedPageSize) {
        pageSize.value = parseInt(savedPageSize);
      }
    }
    
    // Set default branch filter based on user role
    setDefaultBranchFilter();
    
    // Load academic data first
    await loadAcademicData();
    
    // Then fetch invoices (summary is included in the response)
    await fetchInvoices();
  } catch (error) {
    showToast('Error initializing component', 'error');
  }
});

// Watch for modal opening to load data
watch(showGenerateModal, async (isOpen) => {
  if (isOpen) {
    // Load data only when modal is opened
    await loadAcademicDataForModal();
    await fetchBranches();
    await fetchFeeStructuresForModal();
    
    // Add a small delay to ensure all data is loaded
    await new Promise(resolve => setTimeout(resolve, 100));
  }
});

const closePaymentModal = () => {
  showPaymentModal.value = false;
  paymentForm.invoice_number = '';
  paymentForm.amount = '';
  paymentForm.payment_method = 'cash';
  paymentForm.notes = '';
  selectedInvoiceForPayment.value = null;
};
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

