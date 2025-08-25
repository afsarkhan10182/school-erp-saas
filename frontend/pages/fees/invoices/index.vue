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
        :sections="sections"
        :streams="streams"
        :branches="branches"
        :is-loading="isLoading"
        @filter-change="onFilterChange"
        @clear-filters="clearFilters"
        @branch-change="onBranchChange"
        @class-change="onClassChange"
      />
      
      <!-- Invoices Table Component -->
      <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <InvoiceTable
          ref="invoiceTableRef"
          :invoices="invoices"
          :grouped-invoices="paginatedGroupedInvoices"
          :view-mode="viewMode"
          :is-loading="isLoading"
          :total-invoices="invoices.length"
          :current-filters="filters"
          @view-invoice="viewInvoice"
          @record-payment="recordPayment"
          @view-receipt="viewReceipt"
          @view-combined-receipt="viewCombinedReceipt"
        />
      </div>
      
      <!-- Pagination - Outside the overflow-hidden container -->
      <Pagination 
        v-if="totalStudentGroups > 0"
        :pagination="{
          page: currentPage,
          limit: pageSize,
          total: totalStudentGroups
        }"
        item-label="students"
        :additional-info="`${summary.totalInvoices || 0} total invoices`"
        @page-changed="goToPage"
        @page-size-changed="onPageSizeChange"
      />
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
          <div v-if="isLoadingReceipt" class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p class="mt-3 text-sm text-gray-600 dark:text-gray-400">Loading receipt...</p>
          </div>
          
          <div v-else-if="selectedReceipt">
            <ReceiptViewer 
              :receipt-data="selectedReceipt" 
              :school-data="schoolData"
              @close="showReceiptModal = false"
            />
          </div>
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
import Pagination from '~/components/Pagination.vue';
import ReceiptViewer from '~/components/ReceiptViewer.vue';

// Composables
const { showToast } = useToast();
const { 
  academicYears, 
  classes, 
  streams,
  sections, 
  loading: academicsLoading,
  fetchAcademicYears, 
  fetchClasses, 
  fetchStreams,
  fetchSections 
} = useAcademics();

// Import additional composables for the modal
import { useSchools } from '~/composables/useSchools';

const { schools, fetchSchools, loading: schoolsLoading } = useSchools();

// Auth store
const authStore = useAuthStore();

// State
const invoices = ref([]);
const studentsData = ref([]); // New: Store student data directly from API
const summary = ref({});
const isLoading = ref(false);
const showGenerateModal = ref(false); // Ensure modal starts closed
const showPaymentModal = ref(false);
const isGenerating = ref(false);
const isSubmittingPayment = ref(false);
const showQuickCollectModal = ref(false);
const showReceiptModal = ref(false);
const selectedReceipt = ref(null);
const isLoadingReceipt = ref(false);
const selectedInvoiceForPayment = ref(null);
const showMultiplePaymentsModal = ref(false);
const selectedMultiplePayments = ref(null);
const schoolData = ref({}); // Add school data for receipt viewer
const invoiceTableRef = ref(null); // Ref for InvoiceTable component

// Pagination
const currentPage = ref(1);
const pageSize = ref(10);

// View mode (only grouped)
const viewMode = ref('grouped');

// Filters - Start with empty filters
const filters = reactive({
  payment_model: '',
  branch_id: '',
  academic_year: '',
  class_id: '',
  section: '',
  stream: '',
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
  console.log('🔄 Computing groupedInvoices with students:', studentsData.value);
  
  if (!studentsData.value || studentsData.value.length === 0) {
    console.log('❌ No students to display');
    return [];
  }

  // Transform student data to match the expected format for the accordion
  const result = studentsData.value.map(student => ({
    studentId: student.student_id,
    studentName: student.student_name,
    admissionNumber: student.admission_number,
    className: student.class_name,
    studentPhoto: null, // Not available in current response
    // Use the detailed invoice data from the API response
    invoices: [...student.invoices, ...student.grouped_invoices, ...student.ungrouped_invoices],
    totalAmount: student.total_amount,
    paidAmount: student.paid_amount,
    balanceAmount: student.balance_amount,
    paidCount: student.paid_count,
    pendingCount: student.pending_count,
    overdueCount: student.overdue_count,
    partialCount: student.partial_count
  }));

  console.log('✅ Grouped students result:', result);
  return result;
});

// Paginated grouped results for display (frontend pagination by students)
const paginatedGroupedInvoices = computed(() => {
  // Since we're now using backend pagination, we don't need frontend pagination
  // The backend already returns the correct page of students
  return groupedInvoices.value;
});

// Total student groups for pagination - should come from API response
const totalStudentGroups = ref(0);

// Total pages for student groups
const totalPagesForGroups = computed(() => {
  const pages = Math.ceil(totalStudentGroups.value / pageSize.value);
  console.log('📖 Total Pages for Groups:', pages, '(Total Students:', totalStudentGroups.value, '/ PageSize:', pageSize.value, ')');
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
    // Build params object with filters for the new student-based endpoint
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    };
    
    // Add filters only if they have values
    if (filters.payment_model) params.payment_model = filters.payment_model;
    if (filters.branch_id) params.branch_id = filters.branch_id;
    if (filters.academic_year) params.academic_year = filters.academic_year;
    if (filters.class_id) params.class_id = filters.class_id;
    if (filters.section) params.section = filters.section;
    if (filters.stream) params.stream = filters.stream;
    if (filters.status) params.status = filters.status;
    
    // Use the new student-based paginated endpoint
    const response = await apiClient.invoices.getStudentSummary(params);
    
    // Extract student data from the response
    const studentsDataFromAPI = response.data.students || [];
    
    // Store student data directly
    studentsData.value = studentsDataFromAPI;
    
    // Update pagination data
    currentPage.value = response.data.current_page;
    totalStudentGroups.value = response.data.total_students || 0;
    
    // Calculate summary from the aggregated student data (not from individual invoices)
    const totalInvoices = studentsDataFromAPI.reduce((sum, student) => sum + (student.total_invoices || 0), 0);
    const paidInvoices = studentsDataFromAPI.reduce((sum, student) => sum + (student.paid_count || 0), 0);
    const overdueInvoices = studentsDataFromAPI.reduce((sum, student) => sum + (student.overdue_count || 0), 0);
    const totalCollected = studentsDataFromAPI.reduce((sum, student) => sum + parseFloat(student.paid_amount || 0), 0);
    
    summary.value = {
      totalInvoices,
      paidInvoices,
      overdueInvoices,
      totalCollected
    };
    
  } catch (error) {
    showToast('Error fetching invoices', 'error');
  } finally {
    isLoading.value = false;
  }
};



const closeGenerateModal = () => {
  showGenerateModal.value = false;
};

/**
 * Generate invoices with automatic batching for large student sets
 * - Processes students in batches of 50 for better performance
 * - Shows progress updates during batch processing
 * - Handles errors gracefully and continues with remaining batches
 * - Falls back to single API call for small student sets (< 50)
 */
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
    // Check if we have student_ids in formData for batching
    const studentIds = formData.student_ids || [];
    
    // If less than 50 students, use existing flow
    if (studentIds.length < 50) {
      const response = await apiClient.feeInvoices.generateInvoices(formData);
      
      // Show detailed success information
      const totalGenerated = response.data.total_generated || 0;
      const errors = response.data.errors || [];
      
      if (errors.length > 0) {
        showToast(`Partial success: Generated ${totalGenerated} invoices. ${errors.length} students had existing invoices.`, 'warning');
      } else {
        showToast(`Successfully generated ${totalGenerated} invoices!`, 'success');
      }
    } else {
      // Batch processing for 50+ students
      const batchSize = 50;
      let total = studentIds.length;
      let completed = 0;
      let totalGenerated = 0;
      let totalErrors = [];

      // Show initial message
      showToast(`Starting invoice generation for ${total} students...`, 'info');

      for (let i = 0; i < total; i += batchSize) {
        const batch = studentIds.slice(i, i + batchSize);
        
        try {
          // Create batch-specific form data
          const batchFormData = {
            ...formData,
            student_ids: batch
          };
          
          const response = await apiClient.feeInvoices.generateInvoices(batchFormData);
          
          completed += batch.length;
          totalGenerated += response.data.total_generated || 0;
          
          // Collect errors from this batch
          if (response.data.errors && response.data.errors.length > 0) {
            totalErrors.push(...response.data.errors);
          }
          
          // Show progress
          showToast(`${completed} done out of ${total}`, 'info');
          
          // Small delay between batches to prevent overwhelming the server
          if (i + batchSize < total) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (err) {
          console.error('Batch failed:', err);
          completed += batch.length; // Count as processed even if failed
          
          // Show more specific error message
          const batchNumber = Math.floor(i / batchSize) + 1;
          const errorMessage = err.response?.data?.message || err.message || 'Unknown error';
          showToast(`Error in invoice generation for ${batchNumber}: ${errorMessage}`, 'warning');
        }
      }

      // Show final result
      if (totalErrors.length > 0) {
        showToast(`✅ Complete: Generated ${totalGenerated} invoices. ${totalErrors.length} students had existing invoices.`, 'warning');
      } else {
        showToast(`✅ Invoice generation complete: ${totalGenerated} invoices generated`, 'success');
      }
    }
    
    showGenerateModal.value = false;
    
    // Store current expanded accordions before refreshing
    const currentlyExpanded = invoiceTableRef.value ? invoiceTableRef.value.getExpandedStudents() : [];
    
    await fetchInvoices();
    
    // Clear cached student details so that when users expand accordions,
    // they will see the newly generated invoices
    if (invoiceTableRef.value) {
      invoiceTableRef.value.clearStudentDetails();
      
      // Restore expanded accordions after a short delay to ensure new data is loaded
      if (currentlyExpanded.length > 0) {
        setTimeout(() => {
          currentlyExpanded.forEach(studentId => {
            // Check if the student still exists in the new data
            const studentExists = studentsData.value.some(student => student.student_id === studentId);
            if (studentExists) {
              invoiceTableRef.value.toggleStudent(studentId);
            }
          });
        }, 100);
      }
      
      // Highlight students who received new invoices (visual indicator)
      if (formData.student_ids && formData.student_ids.length > 0) {
        // Store the list of students who received new invoices for highlighting
        const newInvoiceStudents = new Set(formData.student_ids);
        
        // Pass this information to the InvoiceTable component
        if (invoiceTableRef.value) {
          invoiceTableRef.value.setNewInvoiceStudents(newInvoiceStudents);
        }
      }
      
      // Show a helpful toast message
      const newStudentsCount = formData.student_ids ? formData.student_ids.length : 0;
      if (newStudentsCount > 0) {
        const message = newStudentsCount === 1 
          ? '1 student received new invoices. Click on the student row to view details.'
          : `${newStudentsCount} students received new invoices. Click on student rows to view details.`;
        showToast(message, 'success');
      }
    }
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
    let invoice = selectedInvoiceForPayment.value;
    
    // Check if we have a selected invoice from the accordion
    if (invoice && invoice.invoice_number === paymentForm.invoice_number) {
      // Record payment for fee invoice (works for both installment and monthly)
      response = await apiClient.feeInvoices.recordPayment(invoice.id, {
        payment_amount: paymentForm.amount,
        payment_method: paymentForm.payment_method,
        notes: paymentForm.notes
      });
    } else {
      // Manual invoice number entry - we need to fetch the invoice first
      // This is a fallback for manual entry, but the preferred way is through the accordion
      showToast('Please use the "Pay Now" button from the student accordion for better experience', 'warning');
      return;
    }
    
    closePaymentModal();
    
    // Update the specific invoice data immediately without full refresh
    if (response.data && response.data.updated_invoice) {
      // Update the specific student's invoice data
      if (invoiceTableRef.value) {
        invoiceTableRef.value.updateInvoiceAfterPayment(
          invoice.student_id, 
          invoice.id, 
          response.data.updated_invoice
        );
      }
      
      // Also update the main students data if available
      updateStudentDataAfterPayment(invoice.student_id, response.data.updated_invoice);
    }
    
    // Update local data immediately based on payment amount
    updateLocalInvoiceData(invoice.id, parseFloat(paymentForm.amount));
    
    // Refresh the specific student's details without closing accordion
    if (invoiceTableRef.value && invoice.student_id) {
      invoiceTableRef.value.forceRefreshStudentDetails(invoice.student_id);
    }
    
    // Refresh the invoice table in background (non-blocking)
    fetchInvoices().catch(error => {
      console.error('Error refreshing invoices after payment:', error);
    });
    
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
  fetchInvoices(); // Fetch new data with filters
};

const onBranchChange = async (branchId) => {
  // Reset class filter when branch changes
  filters.class_id = '';
  filters.section = '';
  filters.stream = '';
  
  // Refresh classes for the new branch
  const schoolId = authStore.currentUser?.school_id;
  if (branchId && branchId !== '') {
    // Specific branch selected - fetch classes for that branch
    await fetchClasses(schoolId, branchId);
  } else {
    // "All Branches" selected or no branch - fetch all classes
    await fetchClasses(schoolId);
  }
};

const onClassChange = async (classId) => {
  console.log('🔍 onClassChange called with classId:', classId);
  
  // Reset section and stream filters when class changes
  filters.section = '';
  filters.stream = '';
  
  // Fetch streams and sections for the selected class
  const schoolId = authStore.currentUser?.school_id;
  const branchId = filters.branch_id || authStore.currentUser?.branch_id;
  
  console.log('🔍 Fetching streams/sections with:', { schoolId, branchId, classId });
  
  if (classId && classId !== '') {
    try {
      const [streamsResult, sectionsResult] = await Promise.all([
        fetchStreams(schoolId, branchId, classId),
        fetchSections(schoolId, branchId, classId)
      ]);
      
      console.log('🔍 Streams fetched:', streams.value.length, 'items:', streams.value);
      console.log('🔍 Sections fetched:', sections.value.length, 'items:', sections.value);
    } catch (error) {
      console.error('❌ Error fetching streams/sections:', error);
    }
  } else {
    // Clear streams and sections when no class is selected
    streams.value = [];
    sections.value = [];
    console.log('🔍 Cleared streams and sections');
  }
};

const clearFilters = () => {
  Object.keys(filters).forEach(key => {
    filters[key] = '';
  });
  currentPage.value = 1; // Reset to first page when filters are cleared
  
  // Clear streams and sections when filters are cleared
  streams.value = [];
  sections.value = [];
  
  fetchInvoices(); // Fetch new data without filters
};

// Pagination method
const goToPage = (page) => {
  if (page >= 1 && page <= totalPagesForGroups.value) {
    currentPage.value = page;
    fetchInvoices(); // Fetch new page from backend
  }
};

// Add back the missing methods
const viewInvoice = (invoice) => {
  // Handle both regular invoices and group invoices
  let studentId;
  
  if (invoice.is_grouped) {
    // For group invoices, try to get student ID from multiple sources
    studentId = invoice.student?.id || invoice.student_id;
    console.log('🔍 Group invoice - studentId from student object:', studentId);
    
    // If still not found, try to find the student from the parent data
    if (!studentId && studentsData.value) {
      // Look for a student that has this grouped invoice
      const parentStudent = studentsData.value.find(student => 
        student.grouped_invoices && student.grouped_invoices.some(group => group.id === invoice.id)
      );
      studentId = parentStudent?.student_id;
      console.log('🔍 Group invoice - studentId from parent data:', studentId);
    }
  } else {
    // For regular invoices, student ID is directly on the invoice
    studentId = invoice.student_id;
    console.log('🔍 Regular invoice - studentId from invoice:', studentId);
  }
  
  if (!studentId) {
    console.log('❌ No student ID found for invoice:', invoice);
    showToast('Student information not available for this invoice', 'error');
    return;
  }
  
  console.log('✅ Navigating to student fee ledger for studentId:', studentId);
  // Navigate to student fee ledger page for this invoice's student
  navigateTo(`/students/${studentId}/fee-ledger`);
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

// Update local invoice data immediately after payment
const updateLocalInvoiceData = (invoiceId, paymentAmount) => {
  // Update in studentsData
  studentsData.value.forEach(student => {
    const allInvoices = [...(student.invoices || []), ...(student.grouped_invoices || []), ...(student.ungrouped_invoices || [])];
    const invoice = allInvoices.find(inv => inv && inv.id === invoiceId);
    
    if (invoice) {
      console.log('✅ Found invoice in student data, updating locally');
      const oldPaidAmount = invoice.paid_amount || 0;
      const newPaidAmount = oldPaidAmount + paymentAmount;
      const newBalanceAmount = Math.max(0, (invoice.total_amount || 0) - newPaidAmount);
      
      invoice.paid_amount = newPaidAmount;
      invoice.balance_amount = newBalanceAmount;
      invoice.status = newBalanceAmount <= 0 ? 'paid' : 'partial';
      
    }
  });
};

// Update main student data after payment to refresh summary instantly
const updateStudentDataAfterPayment = (studentId, updatedInvoiceData) => {
  console.log('🔄 Parent: updateStudentDataAfterPayment called with:', { studentId, updatedInvoiceData });
  
  const studentIndex = studentsData.value.findIndex(student => student.student_id === studentId);
  if (studentIndex !== -1) {
    const student = studentsData.value[studentIndex];
    console.log('✅ Found student in main data:', student.student_name);
    
    // Normalize the updated invoice data
    const normalizedInvoiceData = {
      ...updatedInvoiceData,
      paid_amount: parseFloat(updatedInvoiceData.paid_amount || 0),
      balance_amount: parseFloat(updatedInvoiceData.balance_amount || 0),
      total_amount: parseFloat(updatedInvoiceData.total_amount || 0)
    };
    
    // Update the specific invoice in the student's invoice arrays
    const allInvoices = [...(student.invoices || []), ...(student.grouped_invoices || []), ...(student.ungrouped_invoices || [])];
    const invoiceIndex = allInvoices.findIndex(inv => inv && inv.id === updatedInvoiceData.id);
    
    if (invoiceIndex !== -1) {
      console.log('✅ Found invoice in student data, updating...');
      
      // Update the invoice data
      const oldStatus = allInvoices[invoiceIndex].status;
      const oldPaidAmount = allInvoices[invoiceIndex].paid_amount;
      const oldBalanceAmount = allInvoices[invoiceIndex].balance_amount;
      
      Object.assign(allInvoices[invoiceIndex], normalizedInvoiceData);
      
      console.log('✅ Updated invoice in main data:', {
        oldStatus,
        newStatus: allInvoices[invoiceIndex].status,
        oldPaidAmount,
        newPaidAmount: allInvoices[invoiceIndex].paid_amount,
        oldBalanceAmount,
        newBalanceAmount: allInvoices[invoiceIndex].balance_amount
      });
      
      // Recalculate student summary
      const totalAmount = allInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
      const totalPaid = allInvoices.reduce((sum, inv) => sum + parseFloat(inv.paid_amount || 0), 0);
      const totalBalance = allInvoices.reduce((sum, inv) => sum + parseFloat(inv.balance_amount || 0), 0);
      
      const paidCount = allInvoices.filter(inv => inv && inv.status === 'paid').length;
      const pendingCount = allInvoices.filter(inv => inv && inv.status === 'sent').length;
      const overdueCount = allInvoices.filter(inv => inv && inv.status === 'overdue').length;
      const partialCount = allInvoices.filter(inv => inv && inv.status === 'partial_paid').length;
      
      // Update student summary
      const oldTotalPaid = student.paid_amount;
      const oldTotalBalance = student.balance_amount;
      
      student.total_amount = totalAmount;
      student.paid_amount = totalPaid;
      student.balance_amount = totalBalance;
      student.paid_count = paidCount;
      student.pending_count = pendingCount;
      student.overdue_count = overdueCount;
      student.partial_count = partialCount;
     
    } else {
      console.log('❌ Invoice not found in student data');
    }
  } else {
    console.log('❌ Student not found in main data');
  }
};

const onPaymentRecorded = async () => {
  // Refresh all expanded student details without closing accordions
  if (invoiceTableRef.value) {
    // Get all currently expanded students and refresh their details
    const expandedStudents = invoiceTableRef.value.getExpandedStudents?.() || [];
    
    // Refresh each expanded student's details
    for (const studentId of expandedStudents) {
      await invoiceTableRef.value.forceRefreshStudentDetails(studentId);
    }
  }
  
  // Refresh the invoice table in background (non-blocking)
  fetchInvoices().catch(error => {
    console.error('Error refreshing invoices after payment:', error);
  });
};

const viewReceipt = async (invoice) => {
  isLoadingReceipt.value = true;
  try {
    const response = await apiClient.feeInvoices.getInvoiceReceiptData(invoice.id);
    
    if (response.data) {
      // For installment payments with multiple payments, show combined receipt
      if (invoice.payment_model === 'installment' && invoice.paid_amount > 0 && invoice.balance_amount > 0) {
        // This is an installment payment with partial payments - show combined receipt
        selectedReceipt.value = response.data;
        showReceiptModal.value = true;
      } else if (response.data.has_multiple_payments && response.data.payments && response.data.payments.length > 0) {
        // Show multiple payments modal for other payment types
        selectedMultiplePayments.value = response.data;
        showMultiplePaymentsModal.value = true;
      } else {
        // Single receipt - show receipt modal with structured data
        selectedReceipt.value = response.data;
        showReceiptModal.value = true;
      }
    } else {
      showToast('No receipt found for this invoice', 'error');
    }
  } catch (error) {
    showToast('Error fetching receipt', 'error');
  } finally {
    isLoadingReceipt.value = false;
  }
};

const viewPaymentReceipt = async (paymentItem) => {
  isLoadingReceipt.value = true;
  try {
    const response = await apiClient.feeInvoices.getPaymentReceiptData(paymentItem.payment.id);
    if (response.data) {
      selectedReceipt.value = {
        ...response.data,
        payment: paymentItem.payment,
        invoice: selectedMultiplePayments.value.invoice,
      };
      showMultiplePaymentsModal.value = false;
      showReceiptModal.value = true;
    } else {
      showToast('No receipt found for this payment', 'error');
    }
  } catch (error) {
    showToast('Error viewing payment receipt', 'error');
  } finally {
    isLoadingReceipt.value = false;
  }
};

const viewCombinedReceipt = async (combinedInvoice) => {
  isLoadingReceipt.value = true;
  try {
    // Check if we already have receipt data from the payment response
    if (combinedInvoice.combined_receipt) {
      // Extract receipt data from the combined_receipt structure
      const receiptData = combinedInvoice.combined_receipt.receipt_data || combinedInvoice.combined_receipt;
      
      // Use the receipt data directly from the payment response
      selectedReceipt.value = {
        ...receiptData,
        receipt_number: combinedInvoice.receipt_group_id || combinedInvoice.id,
        payment_date: combinedInvoice.applied_payments?.[0]?.payment_date || new Date(),
        payment_amount: combinedInvoice.total_payment_amount,
        payment_method: combinedInvoice.payment_method || 'cash'
      };
      showReceiptModal.value = true;
    } else if (combinedInvoice.receipt_group_id) {
      // Fallback: fetch receipt data from API using receipt_group_id
      console.log('🔍 Fetching receipt for group ID:', combinedInvoice.receipt_group_id)
      const response = await apiClient.feeInvoices.getCombinedReceipt(combinedInvoice.receipt_group_id);
      console.log('🔍 API Response:', response)
      if (response.data) {
        selectedReceipt.value = response.data;
        console.log('🔍 Selected Receipt Data:', selectedReceipt.value)
        showReceiptModal.value = true;
      } else {
        showToast('No receipt found for this combined invoice', 'error');
      }
    } else {
      // Last fallback: try with id
      console.log('🔍 Fetching receipt for ID:', combinedInvoice.id)
      const response = await apiClient.feeInvoices.getCombinedReceipt(combinedInvoice.id);
      console.log('🔍 API Response:', response)
      if (response.data) {
        selectedReceipt.value = response.data;
        console.log('🔍 Selected Receipt Data:', selectedReceipt.value)
        showReceiptModal.value = true;
      } else {
        showToast('No receipt found for this combined invoice', 'error');
      }
    }
  } catch (error) {
    console.error('Error viewing combined receipt:', error);
    if (error.response && error.response.data && error.response.data.message) {
      showToast(error.response.data.message, 'error');
    } else {
      showToast('Error fetching combined receipt', 'error');
    }
  } finally {
    isLoadingReceipt.value = false;
  }
};

const printReceipt = () => {
  if (!selectedReceipt.value) return;
  
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  const receiptData = selectedReceipt.value.receipt_data || selectedReceipt.value;
  
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
  
  // Helper functions for formatting
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN');
  };
  
  const formatCurrency = (amount) => {
    if (!amount) return '0';
    return parseFloat(amount).toLocaleString('en-IN');
  };
  
  const getMonthName = (month) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'Unknown';
  };
  
  const isJuniorCollege = receiptData.class_name && receiptData.class_name.toLowerCase().includes('junior');
  const schoolType = isJuniorCollege ? 'JUNIOR COLLEGE' : 'ENGLISH MEDIUM SCHOOL';
  const isMonthlyPayment = receiptData.payment_model === 'monthly';
  const isCombinedPayment = receiptData.payment_model === 'combined';
  
  // Helper function to parse paid months string
  const parsePaidMonths = (paidMonthsString) => {
    if (!paidMonthsString) return [];
    return paidMonthsString.split(',').map(month => {
      const [monthNum, year] = month.trim().split(' ');
      return {
        month: parseInt(monthNum),
        year: parseInt(year),
        monthName: getMonthName(parseInt(monthNum))
      };
    });
  };

  // Check if this is a smart payment response
  const isSmartPayment = receiptData.summary && receiptData.receipt_group_id;
  
  // Parse paid months for smart payment
  const paidMonths = isSmartPayment ? parsePaidMonths(receiptData.summary.paid_months) : [];
  
  // Generate HTML from structured data
  const receiptHtml = `
    <div class="receipt">
      <div class="header">
        <div class="trust-name" style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 5px;">HAJI OMAR MOOSA EDUCATIONAL TRUST</div>
        <div class="school-name" style="font-size: 16px; font-weight: bold; color: #000; margin-bottom: 5px; text-transform: uppercase;">${receiptData.school_name || 'School Name'}</div>
        <div class="school-type" style="font-size: 12px; color: #666; margin-bottom: 5px;">ENGLISH MEDIUM SCHOOL</div>
        <div class="school-address" style="font-size: 11px; color: #666; margin-bottom: 10px;">${receiptData.school_address || '27, 5th Nizampura, Kotergate, Opp. Ram Bhavan Hotel, Bhiwandi.'}</div>
      </div>
      
      <div class="receipt-title" style="text-align: center; font-size: 18px; font-weight: bold; color: #000; margin: 15px 0; text-transform: uppercase;">
        MULTIPLE MONTHS PAYMENT RECEIPT
      </div>
      
      <div class="receipt-info" style="padding: 15px;">
        <div class="info-row" style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px;">
          <span class="info-label" style="font-weight: bold; color: #333;">Invoice No:</span>
          <span class="info-value" style="color: #000;">${isSmartPayment ? receiptData.receipt_group_id : (receiptData.invoice_number || receiptData.receipt_number || 'N/A')}</span>
        </div>
        <div class="info-row" style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px;">
          <span class="info-label" style="font-weight: bold; color: #333;">Date:</span>
          <span class="info-value" style="color: #000;">${formatDate(new Date())}</span>
        </div>
        <div class="info-row" style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px;">
          <span class="info-label" style="font-weight: bold; color: #333;">Name of the Pupil:</span>
          <span class="info-value" style="color: #000;">${isSmartPayment ? receiptData.student_name : (receiptData.student_name || 'N/A')}</span>
        </div>
        <div class="info-row" style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px;">
          <span class="info-label" style="font-weight: bold; color: #333;">Std. & Div.:</span>
          <span class="info-value" style="color: #000;">C12</span>
        </div>
        <div class="info-row" style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px;">
          <span class="info-label" style="font-weight: bold; color: #333;">Roll No:</span>
          <span class="info-value" style="color: #000;">3246</span>
        </div>
        <div class="info-row" style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px;">
          <span class="info-label" style="font-weight: bold; color: #333;">G.R. No:</span>
          <span class="info-value" style="color: #000;">3246</span>
        </div>
        
        ${isSmartPayment && paidMonths.length > 0 ? `
        <div class="info-row" style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px;">
          <span class="info-label" style="font-weight: bold; color: #333;">Months Covered:</span>
          <span class="info-value" style="color: #000;">${paidMonths.map(m => `${m.monthName} ${m.year}`).join(', ')}</span>
        </div>
        ` : ''}
        
        ${isSmartPayment && paidMonths.length > 0 ? `
        <table class="fee-table" style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <thead>
            <tr>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; background-color: #f8f9fa; font-weight: bold;">Month</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; background-color: #f8f9fa; font-weight: bold;">Fee Type</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; background-color: #f8f9fa; font-weight: bold;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${paidMonths.map(month => {
              const amountPerMonth = receiptData.summary.total_applied_amount / receiptData.summary.months_covered;
              return `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px;">${month.monthName} ${month.year}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px;">TUITION FEES</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px;">₹${formatCurrency(amountPerMonth)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        ` : `
        <table class="fee-table" style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <thead>
            <tr>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; background-color: #f8f9fa; font-weight: bold;">Particulars</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; background-color: #f8f9fa; font-weight: bold;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px;">${receiptData.fee_type_name || 'Tuition Fees'}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px;">${formatCurrency(receiptData.payment_amount || 0)}</td>
            </tr>
          </tbody>
        </table>
        `}
        
        <div class="summary-section" style="margin: 15px 0; padding: 10px; background-color: #f8f9fa; border: 1px solid #ddd;">
          <div class="info-row" style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px;">
            <span class="info-label" style="font-weight: bold; color: #333;">Total Amount:</span>
            <span class="info-value" style="color: #000;">₹${formatCurrency(isSmartPayment ? receiptData.summary.total_applied_amount : (receiptData.payment_amount || 0))}</span>
          </div>
          <div class="info-row" style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px;">
            <span class="info-label" style="font-weight: bold; color: #333;">Payment Method:</span>
            <span class="info-value" style="color: #000;">${isSmartPayment ? receiptData.summary.payment_mode.toUpperCase() : (receiptData.payment_method || 'cash').toUpperCase()}</span>
          </div>
        </div>
        
        ${isSmartPayment ? `
        <div class="remaining-info" style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 15px 0; border-radius: 5px;">
          <div class="remaining-title" style="font-weight: bold; color: #856404; margin-bottom: 5px;">Monthly Payment Summary</div>
          <div class="info-row" style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px;">
            <span class="info-label" style="font-weight: bold; color: #333;">Remaining Months:</span>
            <span class="info-value" style="color: #000;">${receiptData.summary.remaining_invoices} months</span>
          </div>
          <div class="info-row" style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px;">
            <span class="info-label" style="font-weight: bold; color: #333;">Remaining Balance:</span>
            <span class="info-value" style="color: #000;">₹${formatCurrency(receiptData.summary.remaining_balance)}</span>
          </div>
        </div>
        ` : `
        <div class="remaining-info" style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 15px 0; border-radius: 5px;">
          <div class="remaining-title" style="font-weight: bold; color: #856404; margin-bottom: 5px;">Outstanding Balance</div>
          <div class="info-row" style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px;">
            <span class="info-label" style="font-weight: bold; color: #333;">Remaining Amount:</span>
            <span class="info-value" style="color: #000;">₹${formatCurrency(receiptData.remaining_balance || 0)}</span>
          </div>
        </div>
        `}
      </div>
      
      <div class="signature-section" style="display: flex; justify-content: space-between; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd;">
        <div class="signature" style="text-align: center; font-size: 11px;">
          <div class="signature-line" style="width: 100px; border-top: 1px solid #000; margin: 5px auto;"></div>
          ${isJuniorCollege ? 'Cashier Signature' : 'Receiver\'s Signature'}
        </div>
        <div class="signature" style="text-align: center; font-size: 11px;">
          <div class="signature-line" style="width: 100px; border-top: 1px solid #000; margin: 5px auto;"></div>
          Date
        </div>
      </div>
    </div>
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
  // For grouped invoices, check branch directly
  if (invoice.branch?.name) {
    return invoice.branch.name;
  }
  // For individual invoices, check student's branch
  if (invoice.student?.branch?.name) {
    return invoice.student.branch.name;
  }
  // Fallback to branch_name field
  if (invoice.branch_name) {
    return invoice.branch_name;
  }
  return 'N/A';
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
    console.log('🔍 Fetching monthly fee structures...');
    const response = await apiClient.feeStructures.getWithContext({ payment_model: 'monthly' });
    console.log('📊 Monthly fee structures response:', response);
    monthlyFeeStructures.value = response.data.fee_structures || [];
    console.log('✅ Loaded monthly fee structures:', monthlyFeeStructures.value.length);
  } catch (error) {
    console.error('❌ Error loading monthly fee structures:', error);
    showToast('Error loading monthly fee structures', 'error');
    monthlyFeeStructures.value = [];
  }
};

const fetchInstallmentFeeStructures = async () => {
  try {
    console.log('🔍 Fetching installment fee structures...');
    const response = await apiClient.feeStructures.getWithContext({ payment_model: 'installment' });
    console.log('📊 Installment fee structures response:', response);
    installmentFeeStructures.value = response.data.fee_structures || [];
    console.log('✅ Loaded installment fee structures:', installmentFeeStructures.value.length);
  } catch (error) {
    console.error('❌ Error loading installment fee structures:', error);
    showToast('Error loading installment fee structures', 'error');
    installmentFeeStructures.value = [];
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
    
    // Load academic years and classes for filters with individual error handling
    const promises = [];
    
    // Academic years
    promises.push(
      fetchAcademicYears(schoolId).catch(error => {
        console.error('Error fetching academic years:', error);
        return null;
      })
    );
    
    // Classes - Load all classes initially, not filtered by branch
    promises.push(
      fetchClasses(schoolId).catch(error => {
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

// Load school data for receipt viewer
const loadSchoolData = async () => {
  try {
    const schoolId = authStore.currentUser?.school_id;
    if (schoolId) {
      const response = await apiClient.schools.getById(schoolId);
      if (response.data) {
        schoolData.value = response.data;
      }
    }
  } catch (error) {
    console.error('Error loading school data:', error);
    // Set default school data
    schoolData.value = {
      name: 'School',
      trust_name: 'HAJI OMAR MOOSA EDUCATIONAL TRUST',
      address: '27, 5th Nizampura, Kotergate, Opp. Ram Bhavan Hotel, Bhiwandi.'
    };
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
    
    // Load academic data first (including all classes)
    await loadAcademicData();
    
    // Set default branch filter based on user role AFTER classes are loaded
    setDefaultBranchFilter();
    
    // Load school data for receipt viewer
    await loadSchoolData();
    
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

// Watch pageSize to ensure it's always a number
watch(pageSize, (newValue) => {
  if (typeof newValue === 'string') {
    pageSize.value = parseInt(newValue);
  }
}, { immediate: false }); // Don't trigger immediately on component mount

const onPageSizeChange = (newPageSize) => {
  pageSize.value = newPageSize;
  localStorage.setItem('invoicesPageSize', pageSize.value);
  currentPage.value = 1; // Reset to first page when page size changes
  // Only fetch invoices if we're not in the initial loading state
  if (!isLoading.value) {
    fetchInvoices(); // Fetch with new page size
  }
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

