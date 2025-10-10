<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    @click="$emit('close')"
  >
    <div
      class="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800"
      @click.stop
    >
      <div class="mt-3">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">Quick Fee Collection</h3>
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
                @keydown="handleKeydown"
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
          <div
            v-if="searchResults.length > 0"
            ref="searchResultsContainer"
            class="mt-2 max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 z-10 relative"
          >
            <div
              v-for="(student, index) in searchResults"
              :key="student.id"
              :ref="el => setStudentItemRef(el, index)"
              @click="selectStudent(student)"
              :class="[
                'px-3 py-2 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0',
                index === selectedIndex
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              ]"
            >
              <div class="font-medium">{{ getStudentFullName(student) }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                {{ student.admission_number }} - {{ student.current_class
                }}{{ student.section ? `-${student.section}` : '' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Selected Student Dues -->
        <div v-if="selectedStudent && studentDues && studentDues.summary" class="mb-6">
          <!-- Student Dues Summary -->
          <div
            v-if="studentDues?.summary"
            class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-600"
          >
            <h4 class="font-medium text-blue-900 dark:text-blue-100 mb-3">
              {{ getStudentFullName(selectedStudent) }}
            </h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span class="text-blue-600 dark:text-blue-300">Total Dues:</span>
                <div class="font-medium text-red-600">
                  ₹{{ formatCurrency(studentDues.summary.total_dues) }}
                </div>
              </div>
              <div>
                <span class="text-blue-600 dark:text-blue-300">Overdue:</span>
                <div class="font-medium text-red-600">
                  ₹{{ formatCurrency(studentDues.summary.overdue_amount) }}
                </div>
              </div>
              <div>
                <span class="text-blue-600 dark:text-blue-300">Total Amount:</span>
                <div class="font-medium text-blue-900 dark:text-blue-100">
                  ₹{{ formatCurrency(studentDues.summary.total_amount || 0) }}
                </div>
              </div>
              <div>
                <span class="text-blue-600 dark:text-blue-300">Total Paid:</span>
                <div class="font-medium text-green-600 dark:text-green-400">
                  ₹{{ formatCurrency(studentDues.summary.total_paid || 0) }}
                </div>
              </div>
            </div>

            <!-- Paid Months Summary -->
            <div
              v-if="groupedPayments.length > 0"
              class="mt-4 pt-3 border-t border-blue-200 dark:border-blue-600"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-blue-700 dark:text-blue-200"
                  >Paid Months:</span
                >
                <span class="text-xs text-blue-600 dark:text-blue-300">
                  {{
                    studentDues?.summary?.paid_months_count ||
                    groupedPayments.reduce((sum, p) => sum + p.months_covered, 0)
                  }}
                  month{{
                    (studentDues?.summary?.paid_months_count ||
                      groupedPayments.reduce((sum, p) => sum + p.months_covered, 0)) > 1
                      ? 's'
                      : ''
                  }}
                  paid
                </span>
              </div>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="payment in groupedPayments"
                  :key="payment.id"
                  class="inline-flex items-center px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full"
                  :title="`Paid: ₹${formatCurrency(payment.paid_amount)} on ${formatDate(payment.payment_date)}`"
                >
                  <!-- Display simplified month names -->
                  <span v-if="payment.month_names && payment.month_names.trim()">
                    {{ simplifyMonthNames(payment.month_names) }}
                  </span>
                  <span v-else-if="payment.month && payment.year">
                    {{ getMonthName(payment.month) }} {{ payment.year }}
                  </span>
                  <span v-else-if="payment.months_covered > 1">
                    {{ payment.months_covered }} months
                  </span>
                  <span v-else> Month {{ payment.month || 'N/A' }} </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Monthly Payments List -->
          <div
            v-if="studentDues?.monthly_payments && studentDues.monthly_payments.length > 0"
            class="space-y-3 mb-6"
          >
            <h5 class="font-medium text-gray-900 dark:text-white">Monthly Payments</h5>

            <!-- Simplified Pending Monthly Payments Summary -->
            <div v-if="studentDues?.summary?.pending_months_count > 0" class="space-y-2 mb-4">
              <h6 class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Pending Monthly Payments
              </h6>

              <!-- Summary Card -->
              <div
                class="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700"
              >
                <div class="flex items-center justify-between mb-2">
                  <div class="font-medium text-gray-900 dark:text-white">
                    {{ ungroupedPayments[0]?.feeStructure?.feeType?.name || 'Monthly Fee' }}
                  </div>
                  <span class="text-sm text-gray-500 dark:text-gray-400">
                    {{ studentDues.summary.pending_months_count }} month{{
                      studentDues.summary.pending_months_count > 1 ? 's' : ''
                    }}
                    pending
                  </span>
                </div>

                <!-- Common Values (shown once) -->
                <div class="grid grid-cols-3 gap-3 mb-2 text-sm">
                  <div>
                    <span class="text-gray-500 dark:text-gray-400">Monthly:</span>
                    <div class="font-medium">₹{{ formatCurrency(monthlyFeeAmount) }}</div>
                  </div>
                  <div>
                    <span class="text-gray-500 dark:text-gray-400">Total Due:</span>
                    <div class="font-medium">
                      ₹{{ formatCurrency(studentDues.summary.total_dues) }}
                    </div>
                  </div>
                  <div>
                    <span class="text-gray-500 dark:text-gray-400">Structure:</span>
                    <div class="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {{ ungroupedPayments[0]?.feeStructure?.name || 'Standard' }}
                    </div>
                  </div>
                </div>

                <!-- Pending Months List -->
                <div class="border-t border-gray-200 dark:border-gray-600 pt-2">
                  <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Pending Months:</div>
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="payment in ungroupedPayments"
                      :key="payment.id"
                      class="inline-flex items-center px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded"
                    >
                      {{ getMonthName(payment.month) }} {{ payment.year }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- No Pending Payments Message -->
            <div
              v-else-if="studentDues?.summary?.paid_months_count > 0"
              class="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-600"
            >
              <div class="text-sm text-green-800 dark:text-green-200 text-center">
                ✅ All monthly payments are up to date! No pending amounts.
              </div>
            </div>
          </div>

          <!-- Other Invoices Summary -->
          <div
            v-if="studentDues?.invoices && studentDues.invoices.length > 0"
            class="mb-4 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400"
          >
            Other: {{ studentDues.invoices.length }} invoices | ₹{{
              formatCurrency(studentDues.invoices.reduce((sum, inv) => sum + inv.balance_amount, 0))
            }}
          </div>

          <!-- Payment Form -->
          <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h5 class="font-medium text-gray-900 dark:text-white mb-2">Record Payment</h5>
            <div class="space-y-3">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                    :disabled="
                      !paymentForm.amount ||
                      paymentForm.amount <= 0 ||
                      isSubmitting ||
                      validationMessage.includes('⚠️')
                    "
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
              <div
                v-if="validationMessage"
                class="text-sm p-2 rounded-md"
                :class="{
                  'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-600':
                    validationMessage.includes('⚠️'),
                  'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-600':
                    validationMessage.includes('✅')
                }"
              >
                <p>{{ validationMessage }}</p>
              </div>

              <div class="text-xs text-gray-500 dark:text-gray-400">
                <p>
                  💡 System automatically picks earliest pending months first when you enter an
                  amount.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Receipt Display -->
        <div
          v-if="lastPaymentReceipt"
          class="mt-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-600 text-xs text-blue-800 dark:text-blue-200"
        >
          Receipt: {{ lastPaymentReceipt.receipt_number || 'N/A' }} | ₹{{
            formatCurrency(lastPaymentReceipt.receipt_data?.amount || lastPaymentReceipt.amount)
          }}
          |
          {{
            formatDate(
              lastPaymentReceipt.receipt_data?.payment_date || lastPaymentReceipt.payment_date
            )
          }}
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-8">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"
          ></div>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted, nextTick } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { X, Search, CreditCard, FileText } from 'lucide-vue-next';
import { Students, FeeInvoices } from '~/api';
import { useToast } from '~/composables/useToast';

const { showSuccess, showError, showInfo } = useToast();

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'payment-recorded', 'view-combined-receipt']);

// Reactive data
const searchQuery = ref('');
const searchResults = ref([]);
const selectedStudent = ref(null);
const studentDues = ref(null);
const isLoading = ref(false);
const isSubmitting = ref(false);
const lastPaymentReceipt = ref(null);
const selectedIndex = ref(-1); // Track selected item index for keyboard navigation
const searchResultsContainer = ref(null);
const studentItemRefs = ref([]);

// Payment form
const paymentForm = ref({
  amount: '',
  payment_method: 'cash',
  payment_date: new Date().toISOString().split('T')[0],
  notes: ''
});

// VueUse debounced search
const debouncedSearch = useDebounceFn(() => {
  searchStudents();
}, 300);

// Search students with debouncing
const searchStudents = async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    selectedIndex.value = -1;
    studentItemRefs.value = [];
    return;
  }

  try {
    const response = await Students.getAll({
      search: searchQuery.value,
      limit: 10
    });
    searchResults.value = response.data || [];
    selectedIndex.value = -1; // Reset selection when new results come in
    studentItemRefs.value = []; // Clear refs for new results
  } catch (error) {
    searchResults.value = [];
    selectedIndex.value = -1;
    studentItemRefs.value = [];
  }
};

// Set student item refs for scrolling (Vue 3 template ref pattern)
const setStudentItemRef = (el, index) => {
  if (el) {
    studentItemRefs.value[index] = el;
  } else {
    // Clean up ref when element is removed
    delete studentItemRefs.value[index];
  }
};

// Scroll selected item into view (cross-browser compatible)
const scrollToSelectedItem = () => {
  if (
    selectedIndex.value >= 0 &&
    studentItemRefs.value[selectedIndex.value] &&
    searchResultsContainer.value
  ) {
    const selectedElement = studentItemRefs.value[selectedIndex.value];
    const container = searchResultsContainer.value;

    if (!selectedElement || !container) return;

    // Get element and container positions
    const elementRect = selectedElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Check if element is visible in container
    const isElementVisible =
      elementRect.top >= containerRect.top && elementRect.bottom <= containerRect.bottom;

    if (!isElementVisible) {
      // Use scrollIntoView with fallback for older browsers
      if (selectedElement.scrollIntoView) {
        try {
          selectedElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
          });
        } catch (error) {
          // Fallback for browsers that don't support smooth scrolling
          selectedElement.scrollIntoView(false);
        }
      } else {
        // Manual scroll calculation as fallback
        const elementTop = selectedElement.offsetTop;
        const containerTop = container.scrollTop;
        const containerHeight = container.clientHeight;
        const elementHeight = selectedElement.offsetHeight;

        if (elementTop < containerTop) {
          container.scrollTop = elementTop;
        } else if (elementTop + elementHeight > containerTop + containerHeight) {
          container.scrollTop = elementTop + elementHeight - containerHeight;
        }
      }
    }
  }
};

// Handle keyboard navigation
const handleKeydown = event => {
  if (searchResults.value.length === 0) return;

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      selectedIndex.value = Math.min(selectedIndex.value + 1, searchResults.value.length - 1);
      // Use nextTick to ensure DOM is updated before scrolling
      nextTick(() => {
        scrollToSelectedItem();
      });
      break;
    case 'ArrowUp':
      event.preventDefault();
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1);
      // Use nextTick to ensure DOM is updated before scrolling
      nextTick(() => {
        scrollToSelectedItem();
      });
      break;
    case 'Enter':
      event.preventDefault();
      if (selectedIndex.value >= 0 && selectedIndex.value < searchResults.value.length) {
        selectStudent(searchResults.value[selectedIndex.value]);
      }
      break;
    case 'Escape':
      event.preventDefault();
      searchResults.value = [];
      selectedIndex.value = -1;
      break;
  }
};

// Handle clicking outside search area
const handleClickOutside = event => {
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
  selectedIndex.value = -1;
  studentItemRefs.value = [];
  lastPaymentReceipt.value = null;
};

// Select student and load dues
const selectStudent = async student => {
  selectedStudent.value = student;
  searchResults.value = []; // Clear search results
  selectedIndex.value = -1; // Reset selection index
  studentItemRefs.value = []; // Clear refs
  searchQuery.value = getStudentFullName(student);

  await loadStudentDues(student.id);
};

// Load student dues
const loadStudentDues = async studentId => {
  isLoading.value = true;
  try {
    const response = await FeeInvoices.getStudentDues({
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
    const response = await FeeInvoices.recordSmartPayment({
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
    // Use the full combined_receipt object which contains receipt_number and receipt_data
    lastPaymentReceipt.value = data.combined_receipt || data;

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
const formatCurrency = amount => {
  return parseFloat(amount || 0).toLocaleString('en-IN');
};

const formatDate = date => {
  return new Date(date).toLocaleDateString('en-IN');
};

const getStatusClass = status => {
  const classes = {
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    partial_paid: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };
  return classes[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
};

const getStatusText = status => {
  const texts = {
    sent: 'Sent',
    partial_paid: 'Partial Paid',
    paid: 'Paid',
    overdue: 'Overdue'
  };
  return texts[status] || status;
};

const getMonthlyStatusClass = status => {
  const classes = {
    pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    partial_paid: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };
  return classes[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
};

const getMonthlyStatusText = status => {
  const texts = {
    pending: 'Pending',
    partial_paid: 'Partial Paid',
    paid: 'Paid',
    overdue: 'Overdue'
  };
  return texts[status] || status;
};

// Helper function to get student full name
const getStudentFullName = student => {
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

const getMonthName = monthNumber => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  return months[monthNumber - 1];
};

// Helper function to simplify month names (e.g., "July 2025, August 2025" -> "Jul-Aug 2025")
const simplifyMonthNames = monthNamesString => {
  if (!monthNamesString) return '';

  const monthYearPairs = monthNamesString.split(', ');
  if (monthYearPairs.length === 1) {
    return monthYearPairs[0]; // Single month, return as is
  }

  // Extract months and year
  const months = monthYearPairs.map(pair => {
    const parts = pair.trim().split(' ');
    return parts[0]; // Just the month name
  });

  const year = monthYearPairs[0].split(' ')[1]; // Get year from first pair

  // Create abbreviated month names
  const abbreviatedMonths = months.map(month => month.substring(0, 3));

  if (abbreviatedMonths.length === 2) {
    return `${abbreviatedMonths[0]}-${abbreviatedMonths[1]} ${year}`;
  } else {
    // For more than 2 months, show first and last with ellipsis
    return `${abbreviatedMonths[0]}-${abbreviatedMonths[abbreviatedMonths.length - 1]} ${year}`;
  }
};

// Watch for show prop changes
watch(
  () => props.show,
  newValue => {
    if (newValue) {
      // Reset form when modal opens
      searchQuery.value = '';
      searchResults.value = [];
      selectedStudent.value = null;
      studentDues.value = null;
      selectedIndex.value = -1;
      studentItemRefs.value = [];
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
  }
);

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

  const filteredPayments = studentDues.value.monthly_payments.filter(
    payment => payment.status === 'paid' || payment.status === 'partial_paid'
  );

  return filteredPayments;
});

const ungroupedPayments = computed(() => {
  if (!studentDues.value?.monthly_payments) return [];

  // Get all monthly payments
  const allMonthlyPayments = studentDues.value.monthly_payments;

  // Get paid months from grouped payments
  const paidMonths = new Set();
  groupedPayments.value.forEach(payment => {
    // Add each month-year combination that's been paid
    if (payment.month_names) {
      const monthList = payment.month_names.split(', ');
      monthList.forEach(monthYear => {
        paidMonths.add(monthYear.trim());
      });
    }
    // Also add individual month-year if month_names is not available
    if (payment.month && payment.year) {
      const monthYear = `${getMonthName(payment.month)} ${payment.year}`;
      paidMonths.add(monthYear);
    }
  });

  // Filter out months that are already paid and only show pending ones
  return allMonthlyPayments.filter(payment => {
    if (payment.is_grouped) return false; // Skip grouped payments

    const monthYear = `${getMonthName(payment.month)} ${payment.year}`;
    const isPaid = paidMonths.has(monthYear);

    // Only show invoices that are not fully paid
    return (
      !isPaid &&
      (payment.status === 'sent' ||
        payment.status === 'overdue' ||
        (payment.status === 'partial_paid' && payment.balance_amount > 0))
    );
  });
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
