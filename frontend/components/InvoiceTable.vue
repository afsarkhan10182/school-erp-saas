<template>
  <div class="overflow-hidden">
    <!-- Header with Summary -->
    <div v-if="!isLoading && groupedInvoices.length > 0" class="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Fee Invoices & Payments</h3>
       </div>
    </div>

    <!-- Accordion Grouped Results -->
    <div v-if="!isLoading && viewMode === 'grouped' && groupedInvoices.length > 0" class="divide-y divide-gray-200 dark:divide-gray-700">
      <div v-for="studentGroup in groupedInvoices" :key="studentGroup.studentId" class="accordion-group bg-white dark:bg-gray-800">
        <!-- Student Header (Clickable) -->
        <div 
          @click="toggleStudent(studentGroup.studentId)"
          class="px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center justify-between"
          :class="{ 
            'bg-indigo-50 dark:bg-indigo-900/20': expandedStudents && expandedStudents.includes(studentGroup.studentId),
            'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500': newInvoiceStudents.has(studentGroup.studentId)
          }"
        >
          <div class="flex items-center space-x-4">
            <!-- Chevron Icon -->
            <svg 
              class="w-5 h-5 text-gray-400 transition-transform duration-200"
              :class="{ 'rotate-90': expandedStudents && expandedStudents.includes(studentGroup.studentId) }"
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
              <div class="text-sm font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                <span>{{ studentGroup.studentName }}</span>
                <!-- New invoice indicator -->
                <span 
                  v-if="newInvoiceStudents.has(studentGroup.studentId)"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                >
                  New
                </span>
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
                {{ studentGroup.totalInvoices }} invoices
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                Total: ₹{{ formatCurrency(studentGroup.totalAmount) }}
              </div>
            </div>
            
            <!-- Status Summary -->
            <div class="flex space-x-2">
              <!-- Payment Success Indicator -->
              <span v-if="paymentSuccessStates[studentGroup.studentId]" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 animate-pulse">
                ✅ Payment Updated
              </span>
              <span v-if="studentGroup.overdueCount > 0" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                {{ studentGroup.overdueCount }} Overdue
              </span>
              <span v-if="studentGroup.pendingCount > 0" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                {{ studentGroup.pendingCount }} Pending
              </span>
              <span v-if="studentGroup.partialCount > 0" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                Partial Paid
              </span>
              <span v-if="studentGroup.paidCount > 0" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                {{ studentGroup.paidCount }} Paid
              </span>
            </div>
          </div>
        </div>
        
        <!-- Invoices List (Collapsible) - Now with lazy loading -->
        <div v-show="expandedStudents && expandedStudents.includes(studentGroup.studentId)" class="bg-gray-50 dark:bg-gray-700/50">
          <div class="px-6 py-3 border-t border-gray-200 dark:border-gray-600">
            <!-- Loading state for accordion details -->
            <div v-if="loadingDetails && loadingDetails[studentGroup.studentId]" class="flex items-center justify-center py-8">
              <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading invoice details...</span>
            </div>
            
            <!-- Error state for accordion details -->
            <div v-else-if="detailErrors && detailErrors[studentGroup.studentId]" class="text-center py-8">
              <div class="text-red-600 dark:text-red-400 text-sm">
                {{ detailErrors[studentGroup.studentId] }}
              </div>
              <button 
                @click="loadStudentDetails(studentGroup.studentId)"
                class="mt-2 text-blue-600 dark:text-blue-400 text-sm hover:underline"
              >
                Try again
              </button>
            </div>
            
            <!-- Invoice details content -->
            <div v-else-if="studentDetails[studentGroup.studentId] && studentDetails[studentGroup.studentId].summary" class="space-y-4">
              <!-- All Invoices Table (including grouped and individual) -->
              <div v-if="(studentDetails[studentGroup.studentId].ungrouped_invoices?.length > 0 || studentDetails[studentGroup.studentId].grouped_invoices?.length > 0)" class="space-y-3">
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
                      <!-- Combined invoices (grouped + ungrouped) -->
                      <tr v-for="invoice in [...(studentDetails[studentGroup.studentId].ungrouped_invoices || []), ...(studentDetails[studentGroup.studentId].grouped_invoices || [])].filter(inv => inv != null)" :key="invoice.id" class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                        <!-- Invoice Number -->
                        <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          <div class="flex items-center space-x-2">
                            <span>{{ getInvoiceNumber(invoice) }}</span>
                            <!-- Show month for monthly invoices with styled badge -->
                            <div v-if="invoice.payment_model === 'monthly' && invoice.month && invoice.year && !invoice.is_grouped" class="flex items-center space-x-1">
                              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                {{ getMonthName(invoice.month) }}
                              </span>
                            </div>
                            <!-- Show grouped indicator with tooltip only -->
                            <div v-if="invoice.is_grouped" class="flex items-center space-x-1 text-xs text-purple-600 dark:text-purple-400 cursor-help" :title="getGroupedInvoiceTooltip(invoice)">
                              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                {{ invoice.months_covered || 'Multiple' }} months
                              </span>
                            </div>
                          </div>
                        </td>
                        
                        <!-- Payment Model -->
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" 
                                :class="getPaymentModelClasses(invoice.payment_model)">
                            {{ invoice.payment_model }}
                          </span>
                        </td>
                        
                        <!-- Branch -->
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {{ invoice.branch?.name || 'N/A' }}
                        </td>
                        
                        <!-- Class -->
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {{ invoice.class_name }}
                        </td>
                        
                        <!-- Amount -->
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          ₹{{ formatCurrency(invoice.total_amount) }}
                        </td>
                        
                        <!-- Paid Amount -->
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          ₹{{ formatCurrency(invoice.paid_amount) }}
                        </td>
                        
                        <!-- Status -->
                        <td class="px-4 py-3 whitespace-nowrap">
                          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" 
                                :class="getStatusClasses(invoice.status)">
                            {{ getStatusText(invoice.status) }}
                          </span>
                        </td>
                        
                        <!-- Actions -->
                        <td class="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <div class="flex space-x-2">
                            
                            <!-- Pay Now Button - Show for unpaid/partial invoices -->
                            <button
                              v-if="canRecordPayment(invoice)"
                              @click="handlePayNow(invoice)"
                              class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            >
                              Pay Now
                            </button>

                             <!-- View Button - Always show for all invoices -->
                             <button
                              @click="viewInvoice(invoice, studentGroup.studentId)"
                              class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              View
                            </button>
                            
                            <!-- View Receipt Button - Show for paid invoices -->
                            <button
                              v-if="canGenerateReceipt(invoice) && invoice.is_grouped"
                              @click="handleViewCombinedReceipt(invoice)"
                              class="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                            >
                              View Combined Receipt
                            </button>
                            <button
                              v-else-if="canGenerateReceipt(invoice)"
                              @click="handleViewReceipt(invoice)"
                              class="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                            >
                              View Receipt
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
import { ref, computed, onBeforeUnmount } from 'vue';
import { Students } from '~/api';

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
  },
  // Add current filters prop
  currentFilters: {
    type: Object,
    default: () => ({})
  }
});

// Props received

const emit = defineEmits(['view-invoice', 'record-payment', 'generate-receipt', 'view-receipt', 'view-combined-receipt']);

// Expose methods to parent component
const clearStudentDetails = (studentId) => {
  // Add null checks to prevent unmounting errors
  if (!studentDetails.value || !loadingDetails.value || !detailErrors.value) {
    return;
  }
  
  if (studentId) {
    // Clear specific student details
    delete studentDetails.value[studentId];
    delete loadingDetails.value[studentId];
    delete detailErrors.value[studentId];
  } else {
    // Clear all student details
    studentDetails.value = {};
    loadingDetails.value = {};
    detailErrors.value = {};
  }
};

// Update specific invoice data after payment
const updateInvoiceAfterPayment = (studentId, invoiceId, updatedInvoiceData) => {
  // Show a brief loading state for the specific student
  if (loadingDetails.value && !loadingDetails.value[studentId]) {
    loadingDetails.value[studentId] = true;
    
    // Clear loading state after a short delay to show the update
    setTimeout(() => {
      if (loadingDetails.value) {
        loadingDetails.value[studentId] = false;
      }
      
      // Show success state briefly
      paymentSuccessStates.value[studentId] = true;
      setTimeout(() => {
        paymentSuccessStates.value[studentId] = false;
      }, 2000);
    }, 500);
  }
  
  // Add null checks to prevent unmounting errors
  if (!studentDetails.value || !studentDetails.value[studentId]) {
    return;
  }
  
  const studentData = studentDetails.value[studentId];
  
  // Ensure studentData has the required properties
  if (!studentData.ungrouped_invoices || !studentData.grouped_invoices) {
    return;
  }
  
  // Normalize the updated data to ensure consistency
  const normalizedData = {
    ...updatedInvoiceData,
    paid_amount: parseFloat(updatedInvoiceData.paid_amount || 0),
    balance_amount: parseFloat(updatedInvoiceData.balance_amount || 0),
    total_amount: parseFloat(updatedInvoiceData.total_amount || 0)
  };
  
  // Update in ungrouped invoices
  const ungroupedIndex = studentData.ungrouped_invoices.findIndex(inv => inv && inv.id === invoiceId);
  if (ungroupedIndex !== -1) {
    // Use Vue's reactivity by updating properties directly
    const invoice = studentData.ungrouped_invoices[ungroupedIndex];
    if (invoice) {
      // Update the invoice with new data
      Object.assign(invoice, normalizedData);
    }
  }
  
  // Update in grouped invoices
  const groupedIndex = studentData.grouped_invoices.findIndex(inv => inv && inv.id === invoiceId);
  if (groupedIndex !== -1) {
    // Use Vue's reactivity by updating properties directly
    const invoice = studentData.grouped_invoices[groupedIndex];
    if (invoice) {
      // Update the invoice with new data
      Object.assign(invoice, normalizedData);
    }
  }
  
  // Recalculate summary reactively
  updateStudentSummary(studentData);
  
  // Force Vue to re-render by triggering reactivity
  studentDetails.value = { ...studentDetails.value };
  
  // Also update the main grouped invoices list if this student is in the current view
  const mainGroupedInvoices = props.groupedInvoices || [];
  const mainStudentIndex = mainGroupedInvoices.findIndex(student => student.studentId === studentId);
  if (mainStudentIndex !== -1) {
    const mainStudent = mainGroupedInvoices[mainStudentIndex];
    
    // Update the main student summary as well
    if (mainStudent) {
      // This will trigger reactivity in the parent component
      console.log('🔄 Emitting update to parent component...');
      // Note: We can't directly modify props, but the parent should handle this
    }
  }
};

// Helper function to update student summary
const updateStudentSummary = (studentData) => {
  // Add null checks to prevent unmounting errors
  if (!studentData || !studentData.ungrouped_invoices || !studentData.grouped_invoices || !studentData.summary) {
    return;
  }
  
  // Combine both ungrouped and grouped invoices for calculations
  const allInvoices = [...studentData.ungrouped_invoices, ...studentData.grouped_invoices].filter(inv => inv != null);
  
  const totalAmount = allInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
  const totalPaid = allInvoices.reduce((sum, inv) => sum + parseFloat(inv.paid_amount || 0), 0);
  const totalBalance = allInvoices.reduce((sum, inv) => sum + parseFloat(inv.balance_amount || 0), 0);
  
  const paidCount = allInvoices.filter(inv => inv && inv.status === 'paid').length;
  const pendingCount = allInvoices.filter(inv => inv && inv.status === 'sent').length;
  const overdueCount = allInvoices.filter(inv => inv && inv.status === 'overdue').length;
  const partialCount = allInvoices.filter(inv => inv && inv.status === 'partial_paid').length;
  
  // Update summary reactively
  Object.assign(studentData.summary, {
    total_amount: totalAmount,
    total_paid: totalPaid,
    total_balance: totalBalance,
    total_invoices: allInvoices.length,
    paid_count: paidCount,
    pending_count: pendingCount,
    overdue_count: overdueCount,
    partial_count: partialCount
  });
};



// Cleanup function to prevent unmounting errors
const cleanup = () => {
  // Clear all reactive data
  expandedStudents.value = [];
  studentDetails.value = {};
  loadingDetails.value = {};
  detailErrors.value = {};
  newInvoiceStudents.value.clear();
};

// Cleanup on component unmount
onBeforeUnmount(() => {
  cleanup();
});

// Accordion state for grouped invoices
const expandedStudents = ref([]);

// Lazy loading state for student details
const studentDetails = ref({});
const loadingDetails = ref({});
const detailErrors = ref({});
const paymentSuccessStates = ref({}); // Track payment success states

// Track students who received new invoices for highlighting
const newInvoiceStudents = ref(new Set());

// Accordion methods with lazy loading
const toggleStudent = async (studentId) => {
  // Add null checks to prevent unmounting errors
  if (!studentId || !expandedStudents.value) {
    return;
  }
  
  const index = expandedStudents.value.indexOf(studentId);
  if (index > -1) {
    // Collapse - remove from expanded list
    expandedStudents.value.splice(index, 1);
  } else {
    // Expand - add to expanded list and load details if not already loaded
    expandedStudents.value.push(studentId);
    if (!studentDetails.value?.[studentId] && !loadingDetails.value?.[studentId]) {
      await loadStudentDetails(studentId);
    }
  }
};

// Load student invoice details
const loadStudentDetails = async (studentId) => {
  // Add null checks to prevent unmounting errors
  if (!studentId || !loadingDetails.value || loadingDetails.value[studentId]) {
    return; // Prevent duplicate requests or invalid calls
  }
  
  loadingDetails.value[studentId] = true;
  detailErrors.value[studentId] = null;
  
  try {
    // Use current filters from props
    const params = {
      academic_year: props.currentFilters?.academic_year,
      status: props.currentFilters?.status,
      payment_model: props.currentFilters?.payment_model,
      _t: Date.now(), // Add cache-busting timestamp
    };
    
    // Only include non-empty filters
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => {
        if (!value) return false;
        // Handle both string and non-string values
        if (typeof value === 'string') {
          return value.trim() !== '';
        }
        return true; // Keep non-string values (numbers, booleans, etc.)
      })
    );
    
    console.log('🔍 Loading student details with filters:', filteredParams);
    const response = await Students.getInvoiceBreakdown(studentId, filteredParams);
    
    if (response.success && response.data) {
      studentDetails.value[studentId] = response.data;
    } else {
      throw new Error(response.message || 'Failed to load invoice details');
    }
  } catch (error) {
    detailErrors.value[studentId] = error.message || 'Failed to load invoice details';
  } finally {
    if (loadingDetails.value) {
      loadingDetails.value[studentId] = false;
    }
  }
};

// Method to set students who received new invoices
const setNewInvoiceStudents = (studentIds) => {
  newInvoiceStudents.value = new Set(studentIds);
  
  // Clear the highlighting after 30 seconds
  setTimeout(() => {
    newInvoiceStudents.value.clear();
  }, 30000);
};

// Method to close all accordions
const closeAllAccordions = () => {
  expandedStudents.value = [];
  // Clear cached student details to force fresh data when reopened
  Object.keys(studentDetails.value).forEach(key => {
    delete studentDetails.value[key];
  });
  Object.keys(loadingDetails.value).forEach(key => {
    delete loadingDetails.value[key];
  });
  Object.keys(detailErrors.value).forEach(key => {
    delete detailErrors.value[key];
  });
};

// Computed properties
const isAllAccordionsClosed = computed(() => {
  return expandedStudents.value.length === 0;
});

// Expose methods to parent (after all functions are defined)
defineExpose({
  clearStudentDetails,
  updateInvoiceAfterPayment,
  refreshStudentDetails: loadStudentDetails,
  getExpandedStudents: () => expandedStudents.value || [],
  toggleStudent, // Expose the toggle function
  setNewInvoiceStudents, // Expose the highlighting function
  closeAllAccordions, // Expose the close all accordions function
  isAllAccordionsClosed: () => isAllAccordionsClosed.value, // Expose accordion state
  forceRefreshStudentDetails: async (studentId) => {
    // Force refresh by clearing cache and reloading
    if (studentDetails.value && studentDetails.value[studentId]) {
      delete studentDetails.value[studentId];
    }
    if (loadingDetails.value && loadingDetails.value[studentId]) {
      delete loadingDetails.value[studentId];
    }
    if (detailErrors.value && detailErrors.value[studentId]) {
      delete detailErrors.value[studentId];
    }
    await loadStudentDetails(studentId);
  }
});

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

// Format currency helper
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN').format(amount || 0);
};

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-IN');
};

// Status helpers
const getStatusText = (status) => {
  const statusMap = {
    'paid': 'Paid',
    'sent': 'Unpaid', // 'sent' status represents unpaid invoices
    'partial_paid': 'Partial',
    'overdue': 'Overdue',
    'draft': 'Draft',
    'cancelled': 'Cancelled'
  };
  return statusMap[status] || status;
};

const getStatusClasses = (status) => {
  const classMap = {
    'paid': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'sent': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', // 'sent' = unpaid
    'partial_paid': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'overdue': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'draft': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };
  return classMap[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
};

const getPaymentModelClasses = (paymentModel) => {
  const classMap = {
    'monthly': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'installment': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  };
  return classMap[paymentModel] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
};

// Action handlers
const handlePayNow = (invoice) => {
  emit('record-payment', invoice);
};

const handleViewReceipt = (invoice) => {
  emit('view-receipt', invoice);
};

const handleViewCombinedReceipt = (invoice) => {
  emit('view-combined-receipt', invoice);
};

// Helper function to get tooltip for grouped invoices
const getGroupedInvoiceTooltip = (invoice) => {
  if (invoice.is_grouped) {
    if (invoice.month_names) {
      return `Months covered: ${invoice.month_names}`;
    }
    if (invoice.month_range && invoice.year) {
      return `Months covered: ${invoice.month_range} ${invoice.year}`;
    }
    if (invoice.months_covered) {
      return `${invoice.months_covered} months covered`;
    }
    return 'Multiple months covered';
  }
  return '';
};



// Legacy helper functions (kept for compatibility)
const getMonthsCovered = (invoice) => {
  if (isGroupedPayment(invoice)) {
    if (invoice.month_names) {
      return invoice.month_names;
    }
    if (invoice.month_range && invoice.year) {
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
    if (invoice.months_covered > 1) {
      if (invoice.months_covered === 12) {
        return '12 months';
      }
      return `${invoice.months_covered} months`;
    } else if (invoice.months_covered === 1) {
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
  return invoice.payment_model === 'monthly' ? 'Monthly' : 'Installment';
};

const getPaymentModelClass = (invoice) => {
  return invoice.payment_model === 'monthly' 
    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
    : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
};

const getPaymentModelIcon = (invoice) => {
  return invoice.payment_model === 'monthly' ? Calendar : CreditCard;
};

const getStudentName = (invoice) => {
  if (invoice.student) {
    const firstName = invoice.student.first_name || '';
    const lastName = invoice.student.last_name || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else {
      return 'Unknown Student';
    }
  }
  return 'N/A';
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
  return invoice.class_name || 'N/A';
};

const getStatusClass = (status) => {
  const classMap = {
    'paid': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'sent': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', // 'sent' = unpaid
    'partial_paid': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'overdue': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'draft': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };
  return classMap[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
};

const canRecordPayment = (invoice) => {
  return invoice.balance_amount > 0 && ['sent', 'partial_paid', 'overdue'].includes(invoice.status);
};

const canGenerateReceipt = (invoice) => {
  // For installment payments, only show receipt when fully paid
  if (invoice.payment_model === 'installment') {
    return false;
  }
  // For other payment models (monthly, grouped), show receipt if any amount is paid
  return invoice.paid_amount > 0;
};

const viewInvoice = (invoice, studentId = null) => {
  // If we have a studentId from context, use it; otherwise try to get it from the invoice
  const finalStudentId = studentId || invoice.student?.id || invoice.student_id;
  
  if (finalStudentId) {
    // Create a modified invoice object with the student ID
    const invoiceWithStudentId = {
      ...invoice,
      student_id: finalStudentId,
      student: invoice.student || { id: finalStudentId }
    };
    emit('view-invoice', invoiceWithStudentId);
  } else {
    emit('view-invoice', invoice);
  }
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