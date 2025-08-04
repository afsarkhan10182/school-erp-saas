<template>
  <div v-if="show" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" @click="$emit('close')">
    <div class="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800" @click.stop>
      <div class="mt-3">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              Quick Fee Collection
            </h3>
            <button
              @click="$emit('close')"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X class="h-6 w-6" />
            </button>
          </div>

        <!-- Student Selection -->
        <div class="mb-6 relative search-area">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Student
          </label>
          <div class="flex gap-4">
            <div class="flex-1 relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search by name or admission number..."
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                @input="debouncedSearch"
                @focus="searchStudents"
              />
              <!-- Clear button when student is selected -->
              <button
                v-if="selectedStudent"
                @click="clearSelection"
                class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Clear selection"
              >
                <X class="h-4 w-4" />
              </button>
            </div>
            <button
              @click="searchStudents"
              class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Search
            </button>
          </div>

          <!-- Student Results -->
          <div v-if="searchResults.length > 0" class="mt-2 max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 z-10 relative">
            <div
              v-for="student in searchResults"
              :key="student.id"
              @click="selectStudent(student)"
              class="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0"
            >
              <div class="font-medium">{{ getStudentFullName(student) }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                {{ student.admission_number }} - {{ student.current_class }}{{ student.section ? `-${student.section}` : '' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Selected Student Dues -->
        <div v-if="selectedStudent && studentDues && studentDues.summary" class="mb-6">
          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
            <h4 class="font-medium text-gray-900 dark:text-white mb-2">
                              {{ getStudentFullName(selectedStudent) }}
            </h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span class="text-gray-500 dark:text-gray-400">Total Dues:</span>
                <div class="font-medium text-red-600">₹{{ formatCurrency(studentDues.summary?.total_dues || 0) }}</div>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Overdue:</span>
                <div class="font-medium text-red-600">₹{{ formatCurrency(studentDues.summary?.overdue_amount || 0) }}</div>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Invoices:</span>
                <div class="font-medium">{{ studentDues.summary?.invoice_count || 0 }}</div>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Monthly Payments:</span>
                <div class="font-medium">{{ studentDues.summary?.monthly_payment_count || 0 }}</div>
              </div>
            </div>
          </div>

          <!-- Monthly Payments List -->
          <div v-if="studentDues?.monthly_payments && studentDues.monthly_payments.length > 0" class="space-y-3 mb-6">
            <h5 class="font-medium text-gray-900 dark:text-white">Monthly Payments</h5>
            
            <!-- Grouped Payments (Paid/Partial Paid) -->
            <div v-if="groupedPayments.length > 0" class="space-y-3">
              <h6 class="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Payments</h6>
              <div
                v-for="payment in groupedPayments"
                :key="payment.id"
                class="border border-green-200 dark:border-green-600 rounded-lg p-3 bg-green-50 dark:bg-green-900/20"
              >
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <div class="font-medium text-green-800 dark:text-green-200">
                      {{ payment.display_name || `${payment.feeStructure?.feeType?.name || 'Fee'} - Group Payment` }}
                    </div>
                    <div class="text-sm text-green-600 dark:text-green-300">
                      {{ payment.months_covered }} month{{ payment.months_covered > 1 ? 's' : '' }} covered: {{ payment.month_names }}
                    </div>
                    <div class="text-sm">
                      <span class="text-green-600 dark:text-green-300">Total Paid:</span>
                      <span class="font-medium text-green-800 dark:text-green-200">₹{{ formatCurrency(payment.paid_amount) }}</span>
                      <span class="text-green-600 dark:text-green-300 ml-2">Payment Date:</span>
                      <span class="font-medium">{{ formatDate(payment.payment_date) }}</span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <span
                      :class="getMonthlyStatusClass(payment.status)"
                      class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                    >
                      {{ getMonthlyStatusText(payment.status) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Ungrouped Payments (Sent/Overdue) -->
            <div v-if="ungroupedPayments.length > 0" class="space-y-3">
              <h6 class="text-sm font-medium text-gray-700 dark:text-gray-300">Pending Payments</h6>
              <div
                v-for="payment in ungroupedPayments"
                :key="payment.id"
                class="border border-gray-200 dark:border-gray-600 rounded-lg p-3"
              >
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <div class="font-medium">{{ payment.feeStructure?.feeType?.name || 'Fee' }}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ getMonthName(payment.month) }} {{ payment.year }} | 
                      {{ payment.feeStructure?.name || 'Fee Structure' }}
                    </div>
                    <div class="text-sm">
                      <span class="text-gray-500 dark:text-gray-400">Due:</span>
                      <span class="font-medium">₹{{ formatCurrency(payment.total_amount) }}</span>
                      <span class="text-gray-500 dark:text-gray-400 ml-2">Paid:</span>
                      <span class="font-medium">₹{{ formatCurrency(payment.paid_amount) }}</span>
                      <span class="text-gray-500 dark:text-gray-400 ml-2">Balance:</span>
                      <span class="font-medium text-red-600">₹{{ formatCurrency(payment.balance_amount) }}</span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <span
                      :class="getMonthlyStatusClass(payment.status)"
                      class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                    >
                      {{ getMonthlyStatusText(payment.status) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Invoice List -->
          <div v-if="studentDues?.invoices && studentDues.invoices.length > 0" class="space-y-3 mb-6">
            <h5 class="font-medium text-gray-900 dark:text-white">Installment Invoices</h5>
            <div
              v-for="invoice in studentDues.invoices"
              :key="invoice.id"
              class="border border-gray-200 dark:border-gray-600 rounded-lg p-3"
            >
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <div class="font-medium">{{ invoice.feeStructure?.feeType?.name || 'Fee' }}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    Due: {{ formatDate(invoice.due_date) }} | 
                    {{ invoice.feeStructure?.name || 'Fee Structure' }}
                  </div>
                  <div class="text-sm">
                    <span class="text-gray-500 dark:text-gray-400">Total:</span>
                    <span class="font-medium">₹{{ formatCurrency(invoice.total_amount) }}</span>
                    <span class="text-gray-500 dark:text-gray-400 ml-2">Paid:</span>
                    <span class="font-medium">₹{{ formatCurrency(invoice.paid_amount) }}</span>
                    <span class="text-gray-500 dark:text-gray-400 ml-2">Balance:</span>
                    <span class="font-medium text-red-600">₹{{ formatCurrency(invoice.balance_amount) }}</span>
                  </div>
                </div>
                <div class="ml-4">
                  <span
                    :class="getStatusClass(invoice.status)"
                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                  >
                    {{ getStatusText(invoice.status) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Payment Form -->
          <div class="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h5 class="font-medium text-gray-900 dark:text-white mb-3">Record Payment</h5>
            <div class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Payment Amount
                  </label>
                  <input
                    v-model="paymentForm.amount"
                    type="number"
                    step="0.01"
                    :max="studentDues.summary.total_dues"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Payment Method
                  </label>
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
                </div>
                <div class="flex items-end">
                  <button
                    @click="submitPayment"
                    :disabled="!paymentForm.amount || paymentForm.amount <= 0 || isSubmitting || validationMessage.includes('⚠️')"
                    class="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {{ isSubmitting ? 'Recording...' : 'Record Payment' }}
                  </button>
                </div>
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                <button
                  @click="paymentForm.amount = studentDues.summary.total_dues"
                  class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Pay Full Amount (₹{{ formatCurrency(studentDues.summary.total_dues) }})
                </button>
              </div>
              <!-- Validation Message -->
              <div v-if="validationMessage" class="text-sm p-2 rounded-md" :class="{
                'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-600': validationMessage.includes('⚠️'),
                'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-600': validationMessage.includes('✅')
              }">
                <p>{{ validationMessage }}</p>
              </div>
              
              <div class="text-xs text-gray-500 dark:text-gray-400">
                <p>💡 System automatically picks earliest pending months first when you enter an amount.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Receipt Display -->
        <div v-if="lastPaymentReceipt" class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-600">
          <h5 class="font-medium text-blue-900 dark:text-blue-100 mb-3">Payment Receipt</h5>
          <div class="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <div><strong>Receipt Number:</strong> {{ lastPaymentReceipt.receipt_number }}</div>
            <div><strong>Payment Date:</strong> {{ formatDate(lastPaymentReceipt.payment_date) }}</div>
            <div><strong>Amount:</strong> ₹{{ formatCurrency(lastPaymentReceipt.amount) }}</div>
            <div><strong>Method:</strong> {{ lastPaymentReceipt.payment_method }}</div>

          </div>

        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import { X, Search, CreditCard, FileText } from 'lucide-vue-next';
import { apiClient } from '~/utils/api';
import { useToast } from '~/composables/useToast';

const { showSuccess, showError, showInfo } = useToast();

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'payment-recorded','view-combined-receipt']);

// Reactive data
const searchQuery = ref('');
const searchResults = ref([]);
const selectedStudent = ref(null);
const studentDues = ref(null);
const isLoading = ref(false);
const isSubmitting = ref(false);
const lastPaymentReceipt = ref(null);

// Payment form
const paymentForm = ref({
  amount: '',
  payment_method: 'cash',
  payment_date: new Date().toISOString().split('T')[0],
  notes: ''
});

// Debounced search
let searchTimeout = null;
const debouncedSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    searchStudents();
  }, 300);
};

// Search students with debouncing
const searchStudents = async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    return;
  }

  try {
    const response = await apiClient.students.getAll({
      search: searchQuery.value,
      limit: 10
    });
    searchResults.value = response.data || [];
  } catch (error) {
    searchResults.value = [];
  }
};

// Handle clicking outside search area
const handleClickOutside = (event) => {
  // Close search results when clicking outside the search area
  if (!event.target.closest('.search-area')) {
    searchResults.value = [];
  }
};

// Clear student selection and allow new search
const clearSelection = () => {
  selectedStudent.value = null;
  studentDues.value = null;
  searchQuery.value = '';
  searchResults.value = [];
  lastPaymentReceipt.value = null;
};

// Select student and load dues
const selectStudent = async (student) => {
  selectedStudent.value = student;
  searchResults.value = []; // Clear search results
  searchQuery.value = getStudentFullName(student);
  
  await loadStudentDues(student.id);
};

// Load student dues
const loadStudentDues = async (studentId) => {
  isLoading.value = true;
  try {
    const response = await apiClient.feeInvoices.getStudentDues({
      student_id: studentId
    });
    
    // Ensure we have a proper structure with fallbacks
    studentDues.value = {
      summary: {
        total_dues: 0,
        overdue_amount: 0,
        invoice_count: 0,
        monthly_payment_count: 0,
        ...response.data?.summary
      },
      invoices: response.data?.invoices || [],
      monthly_payments: response.data?.monthly_payments || []
    };
    
  } catch (error) {
    // Set default structure on error
    studentDues.value = {
      summary: {
        total_dues: 0,
        overdue_amount: 0,
        invoice_count: 0,
        monthly_payment_count: 0
      },
      invoices: [],
      monthly_payments: []
    };
  } finally {
    isLoading.value = false;
  }
};



// Submit smart payment
const submitPayment = async () => {
  if (!selectedStudent.value || !paymentForm.value.amount) {
    return;
  }

  isSubmitting.value = true;
  try {
    const response = await apiClient.feeInvoices.recordSmartPayment({
      student_id: selectedStudent.value.id,
      payment_amount: parseFloat(paymentForm.value.amount),
      payment_method: paymentForm.value.payment_method,
      payment_date: paymentForm.value.payment_date,
      notes: paymentForm.value.notes
    });
    
    // Reset form
    paymentForm.value = {
      amount: '',
      payment_method: 'cash',
      payment_date: new Date().toISOString().split('T')[0],
      notes: ''
    };
    
    // Store receipt data (without months info)
    const data = response.data;
    lastPaymentReceipt.value = {
      receipt_number: data.receipt_group_id,
      payment_date: data.applied_payments[0]?.payment_date || new Date(),
      amount: data.total_payment_amount,
      payment_method: paymentForm.value.payment_method,
      receipt_data: data.combined_receipt.receipt_data
    };
    
    // Show simple success message
    showSuccess(`Payment recorded successfully! ₹${data.total_payment_amount.toLocaleString()}`);
    
    // Show receipt first, then close modal and update listing
    emit('view-combined-receipt', data);
    
    // Close modal after showing receipt
    setTimeout(() => {
      emit('close');
      // Emit payment recorded event to update listing after receipt is shown
      emit('payment-recorded');
    }, 100);
    
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      showError(error.response.data.message);
    } else {
      showError('Error recording payment');
    }
  } finally {
    isSubmitting.value = false;
  }
};

// Utility functions
const formatCurrency = (amount) => {
  return parseFloat(amount || 0).toLocaleString('en-IN');
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN');
};

const getStatusClass = (status) => {
  const classes = {
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    partial_paid: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return classes[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
};

const getStatusText = (status) => {
  const texts = {
    sent: 'Sent',
    partial_paid: 'Partial Paid',
    overdue: 'Overdue',
  };
  return texts[status] || status;
};

const getMonthlyStatusClass = (status) => {
  const classes = {
    pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return classes[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
};

const getMonthlyStatusText = (status) => {
  const texts = {
    pending: 'Pending',
    partial: 'Partial Paid',
    paid: 'Paid',
    overdue: 'Overdue',
  };
  return texts[status] || status;
};

// Helper function to get student full name
const getStudentFullName = (student) => {
  const firstName = student.first_name || '';
  const lastName = student.last_name || '';
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  } else if (firstName) {
    return firstName;
  } else if (lastName) {
    return lastName;
  } else {
    return 'Unknown Student';
  }
};

const getMonthName = (monthNumber) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthNumber - 1];
};



// Watch for show prop changes
watch(() => props.show, (newValue) => {
  if (newValue) {
    // Reset form when modal opens
    searchQuery.value = '';
    searchResults.value = [];
    selectedStudent.value = null;
    studentDues.value = null;
    paymentForm.value = {
      amount: '',
      payment_method: 'cash',
      payment_date: new Date().toISOString().split('T')[0],
      notes: ''
    };
    lastPaymentReceipt.value = null;
    
    // Add click outside listener
    document.addEventListener('click', handleClickOutside);
  } else {
    // Remove click outside listener when modal closes
    document.removeEventListener('click', handleClickOutside);
  }
});

// Watch for search query changes to trigger debounced search
watch(searchQuery, () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = [];
  } else {
    // Only search if no student is currently selected or if the query is different from selected student
    if (!selectedStudent.value || searchQuery.value !== getStudentFullName(selectedStudent.value)) {
      debouncedSearch();
    }
  }
});

// Computed properties
const groupedPayments = computed(() => {
  if (!studentDues.value?.monthly_payments) return [];
  
  return studentDues.value.monthly_payments
    .filter(payment => payment.status === 'paid' || payment.status === 'partial')
    .slice(0, 3); // Show only last 3 payments
});

const ungroupedPayments = computed(() => {
  if (!studentDues.value?.monthly_payments) return [];
  return studentDues.value.monthly_payments.filter(payment => payment.is_grouped !== true);
});

const monthlyFeeAmount = computed(() => {
  if (!studentDues.value?.monthly_payments) return 0;
  const firstPendingPayment = ungroupedPayments.value[0];
  return firstPendingPayment ? firstPendingPayment.total_amount : 0;
});

const validationMessage = computed(() => {
  if (!paymentForm.value.amount || !studentDues.value?.summary) {
    return '';
  }

  const amount = parseFloat(paymentForm.value.amount);
  const totalDues = studentDues.value.summary.total_dues;
  const monthlyFee = studentDues.value.summary.monthly_fee || 0;

  if (amount > totalDues) {
    return `⚠️ Amount exceeds total dues. Maximum amount: ₹${totalDues.toLocaleString()}`;
  }

  if (monthlyFee > 0) {
    const monthsCovered = Math.floor(amount / monthlyFee);
    if (monthsCovered > 0) {
      return `✅ Amount covers ${monthsCovered} month${monthsCovered > 1 ? 's' : ''} at ₹${monthlyFee} each`;
    }
  }
  
  return '';
});

// Cleanup event listeners on component unmount
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script> 