<template>
  <div v-if="show" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
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
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Student
          </label>
          <div class="flex gap-4">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by name or admission number..."
              class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              @input="searchStudents"
            />
            <button
              @click="searchStudents"
              class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Search
            </button>
          </div>

          <!-- Student Results -->
          <div v-if="searchResults.length > 0" class="mt-2 max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md">
            <div
              v-for="student in searchResults"
              :key="student.id"
              @click="selectStudent(student)"
              class="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0"
            >
              <div class="font-medium">{{ student.first_name }} {{ student.last_name }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                {{ student.admission_number }} - {{ student.current_class }}{{ student.section ? `-${student.section}` : '' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Selected Student Dues -->
        <div v-if="selectedStudent && studentDues" class="mb-6">
          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
            <h4 class="font-medium text-gray-900 dark:text-white mb-2">
              {{ selectedStudent.first_name }} {{ selectedStudent.last_name }}
            </h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span class="text-gray-500 dark:text-gray-400">Total Dues:</span>
                <div class="font-medium text-red-600">₹{{ formatCurrency(studentDues.summary.total_dues) }}</div>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Overdue:</span>
                <div class="font-medium text-red-600">₹{{ formatCurrency(studentDues.summary.overdue_amount) }}</div>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Invoices:</span>
                <div class="font-medium">{{ studentDues.summary.invoice_count }}</div>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Overdue Count:</span>
                <div class="font-medium text-red-600">{{ studentDues.summary.overdue_count }}</div>
              </div>
            </div>
          </div>

          <!-- Invoice List -->
          <div class="space-y-3">
            <h5 class="font-medium text-gray-900 dark:text-white">Pending Invoices</h5>
            <div
              v-for="invoice in studentDues.invoices"
              :key="invoice.id"
              class="border border-gray-200 dark:border-gray-600 rounded-lg p-3"
            >
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <div class="font-medium">{{ invoice.feeStructure.feeType.name }}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    Due: {{ formatDate(invoice.due_date) }} | 
                    {{ invoice.feeStructure.name }}
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

          <!-- Quick Payment -->
          <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <h5 class="font-medium text-blue-900 dark:text-blue-100 mb-3">Quick Payment</h5>
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
                  @click="recordPayment"
                  :disabled="!paymentForm.amount || paymentForm.amount <= 0 || isSubmitting"
                  class="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ isSubmitting ? 'Recording...' : 'Record Payment' }}
                </button>
              </div>
            </div>
            <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <button
                @click="paymentForm.amount = studentDues.summary.total_dues"
                class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Pay Full Amount (₹{{ formatCurrency(studentDues.summary.total_dues) }})
              </button>
            </div>
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
import { ref, watch } from 'vue';
import { X } from 'lucide-vue-next';
import { apiClient } from '~/utils/api';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'payment-recorded']);

const searchQuery = ref('');
const searchResults = ref([]);
const selectedStudent = ref(null);
const studentDues = ref(null);
const isLoading = ref(false);
const isSubmitting = ref(false);

const paymentForm = ref({
  amount: '',
  payment_method: 'cash',
  payment_date: new Date().toISOString().split('T')[0],
  notes: ''
});

// Search students
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
    console.error('Error searching students:', error);
    searchResults.value = [];
  }
};

// Select student and load dues
const selectStudent = async (student) => {
  selectedStudent.value = student;
  searchResults.value = [];
  searchQuery.value = `${student.first_name} ${student.last_name}`;
  
  await loadStudentDues(student.id);
};

// Load student dues
const loadStudentDues = async (studentId) => {
  isLoading.value = true;
  try {
    const response = await apiClient.feeInvoices.getStudentDues({
      student_id: studentId
    });
    studentDues.value = response.data;
  } catch (error) {
    console.error('Error loading student dues:', error);
    studentDues.value = null;
  } finally {
    isLoading.value = false;
  }
};

// Record payment
const recordPayment = async () => {
  if (!selectedStudent.value || !studentDues.value) return;

  isSubmitting.value = true;
  try {
    // Find the first unpaid invoice to record payment against
    const unpaidInvoice = studentDues.value.invoices.find(inv => inv.balance_amount > 0);
    
    if (!unpaidInvoice) {
      alert('No unpaid invoices found');
      return;
    }

    await apiClient.feeInvoices.recordPayment(unpaidInvoice.id, paymentForm.value);
    
    // Reload student dues
    await loadStudentDues(selectedStudent.value.id);
    
    // Reset payment form
    paymentForm.value.amount = '';
    
    emit('payment-recorded');
    alert('Payment recorded successfully!');
  } catch (error) {
    console.error('Error recording payment:', error);
    alert('Error recording payment. Please try again.');
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

// Watch for show prop changes
watch(() => props.show, (newVal) => {
  if (!newVal) {
    // Reset form when modal closes
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
  }
});
</script> 