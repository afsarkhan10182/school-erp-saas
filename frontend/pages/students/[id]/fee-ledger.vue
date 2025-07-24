<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Student Fee Ledger</h1>
            <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
              Complete payment history for {{ student?.first_name }} {{ student?.last_name }}
            </p>
          </div>
          <div class="flex space-x-3">
            <button
              @click="showAllReceiptsModal = true"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <FileText class="h-4 w-4 mr-2" />
              View All Receipts
            </button>
            <button
              @click="$router.back()"
              class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Back
            </button>
          </div>
        </div>

        <!-- Student Info -->
        <div v-if="student" class="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                {{ student.first_name }} {{ student.last_name }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Admission: {{ student.admission_number }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Class</p>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ student.current_class }}{{ student.section ? `-${student.section}` : '' }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Academic Year</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ student.academic_year }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <span
                :class="{
                  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': student.status === 'active',
                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': student.status !== 'active',
                }"
                class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
              >
                {{ student.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div v-if="ledgerData" class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <FileText class="h-6 w-6 text-blue-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Invoices</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ ledgerData.summary.total_invoices }}</dd>
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
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Paid Invoices</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ ledgerData.summary.paid_invoices }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <DollarSign class="h-6 w-6 text-green-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Paid</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">₹{{ formatCurrency(ledgerData.summary.total_paid) }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <AlertTriangle class="h-6 w-6 text-red-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Outstanding</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">₹{{ formatCurrency(ledgerData.summary.total_balance) }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
        <div class="px-4 py-5 sm:p-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Academic Year</label>
              <select v-model="filters.academic_year" @change="fetchLedger" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                <option value="">All Years</option>
                <option value="2024-25">2024-25</option>
                <option value="2023-24">2023-24</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <select v-model="filters.status" @change="fetchLedger" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                <option value="">All Status</option>
                <option value="paid">Paid</option>
                <option value="partial_paid">Partial Paid</option>
                <option value="overdue">Overdue</option>
                <option value="sent">Sent</option>
              </select>
            </div>
            <div class="flex items-end">
              <button
                @click="fetchLedger"
                class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Search class="-ml-1 mr-2 h-4 w-4" />
                Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Ledger Table -->
      <div v-if="isLoading" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading fee ledger...</p>
      </div>

      <div v-else-if="ledgerData && ledgerData.invoices.length > 0" class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">Fee Ledger</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Invoice</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fee Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paid</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Balance</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="invoice in (ledgerData?.invoices || [])" :key="invoice.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {{ invoice.invoice_number || 'N/A' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ invoice.feeStructure?.feeType?.name || 'Unknown' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ formatDate(invoice.due_date) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  ₹{{ formatCurrency(invoice.total_amount) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  ₹{{ formatCurrency(invoice.paid_amount) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  ₹{{ formatCurrency(invoice.balance_amount) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getStatusClass(invoice.status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                    {{ getStatusText(invoice.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    v-if="(invoice.balance_amount || 0) > 0"
                    @click="recordPayment(invoice)"
                    class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3"
                  >
                    Pay
                  </button>
                  <button
                    v-if="(invoice.paid_amount || 0) > 0"
                    @click="showPaymentHistory(invoice)"
                    class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                  >
                    Payment History
                  </button>
                  <button
                    @click="adjustInvoice(invoice)"
                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    Adjust
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <div v-if="ledgerData.pagination.total_pages > 1" class="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
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
              :disabled="currentPage >= ledgerData.pagination.total_pages"
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700 dark:text-gray-300">
                Showing <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span> to <span class="font-medium">{{ Math.min(currentPage * pageSize, ledgerData.pagination.total_count) }}</span> of <span class="font-medium">{{ ledgerData.pagination.total_count }}</span> results
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
                  :disabled="currentPage >= ledgerData.pagination.total_pages"
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="ledgerData && ledgerData.invoices.length === 0" class="text-center py-8">
        <FileText class="mx-auto h-12 w-12 text-gray-400" />
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">No invoices found for this student.</p>
      </div>
    </div>

    <!-- Payment Modal -->
    <div v-if="showPaymentModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Record Payment</h3>
          
          <form @submit.prevent="submitPayment">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Amount</label>
              <input
                v-model="paymentForm.amount"
                type="number"
                step="0.01"
                :max="selectedInvoice?.balance_amount"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
              <select
                v-model="paymentForm.payment_method"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
              <textarea
                v-model="paymentForm.notes"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              ></textarea>
            </div>

            <div class="flex justify-end space-x-3">
              <button
                type="button"
                @click="showPaymentModal = false"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {{ isSubmitting ? 'Recording...' : 'Record Payment' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Adjustment Modal -->
    <div v-if="showAdjustmentModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Adjust Invoice</h3>
          
          <form @submit.prevent="submitAdjustment">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Adjustment Type</label>
              <select
                v-model="adjustmentForm.adjustment_type"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="waive">Waive</option>
                <option value="add">Add</option>
              </select>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
              <input
                v-model="adjustmentForm.adjustment_amount"
                type="number"
                step="0.01"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason</label>
              <textarea
                v-model="adjustmentForm.adjustment_reason"
                rows="3"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              ></textarea>
            </div>

            <div class="flex justify-end space-x-3">
              <button
                type="button"
                @click="showAdjustmentModal = false"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {{ isSubmitting ? 'Adjusting...' : 'Adjust Invoice' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Payment History Modal -->
    <div v-if="showPaymentHistoryModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              Payment History - {{ selectedInvoice?.invoice_number }}
            </h3>
            <button
              @click="showPaymentHistoryModal = false"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X class="h-6 w-6" />
            </button>
          </div>

          <div v-if="isLoadingPayments" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading payment history...</p>
          </div>

          <div v-else-if="paymentHistory && paymentHistory.payments.length > 0" class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Payment #</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Receipt #</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Method</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="payment in paymentHistory.payments" :key="payment.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {{ payment.payment_number }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {{ payment.receipt_number }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {{ formatDate(payment.payment_date) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ₹{{ formatCurrency(payment.payment_amount) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {{ formatPaymentMethod(payment.payment_method) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="getPaymentStatusClass(payment.payment_status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                      {{ getPaymentStatusText(payment.payment_status) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      @click="viewReceipt(payment)"
                      class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View Receipt
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="text-center py-8">
            <CreditCard class="mx-auto h-12 w-12 text-gray-400" />
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">No payment history found for this invoice.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Receipt Modal -->
    <div v-if="showReceiptModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              Payment Receipt - {{ selectedPayment?.receipt_number }}
            </h3>
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
                <X class="h-6 w-6" />
              </button>
            </div>
          </div>

          <div v-if="selectedPayment" class="receipt-content print-friendly" v-html="selectedPayment.receipt_html"></div>
        </div>
      </div>
    </div>

    <!-- All Receipts Modal - Redesigned for Better UX -->
    <div v-if="showAllReceiptsModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-5 mx-auto p-6 border w-full max-w-7xl shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <!-- Header -->
          <div class="flex justify-between items-center mb-6">
            <div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                Payment History
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {{ student?.first_name }} {{ student?.last_name }} - {{ student?.admission_number }}
              </p>
            </div>
            <div class="flex items-center space-x-3">
              <!-- Outstanding Balance Badge -->
              <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                <div class="text-xs text-amber-600 dark:text-amber-400 font-medium">Outstanding</div>
                <div class="text-sm font-semibold text-amber-700 dark:text-amber-300">
                  ₹{{ formatCurrency(student?.outstanding_balance || 0) }}
                </div>
              </div>
              <!-- Close Button -->
              <button
                @click="showAllReceiptsModal = false"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X class="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <!-- Loading State -->
          <div v-if="isLoadingReceipts" class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p class="mt-3 text-sm text-gray-600 dark:text-gray-400">Loading payment history...</p>
          </div>
          
          <!-- Empty State -->
          <div v-else-if="allReceipts.length === 0" class="text-center py-12">
            <FileText class="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No Payment History</h4>
            <p class="text-gray-500 dark:text-gray-400">No receipts found for this student.</p>
          </div>
          
          <!-- Receipts Content -->
          <div v-else class="flex gap-6">
            <!-- Receipt List Panel -->
            <div class="w-1/3 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div class="flex items-center justify-between mb-4">
                <h4 class="font-medium text-gray-900 dark:text-white">Receipts ({{ allReceipts.length }})</h4>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  Total: ₹{{ formatCurrency(allReceipts.reduce((sum, r) => sum + parseFloat(r.payment_amount || 0), 0)) }}
                </div>
              </div>
              
              <!-- Receipt Cards -->
              <div class="space-y-3 max-h-96 overflow-y-auto">
                <div
                  v-for="receipt in allReceipts"
                  :key="receipt.id"
                  class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3 cursor-pointer transition-all hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600"
                  :class="{
                    'ring-2 ring-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-900/20': selectedPayment?.id === receipt.id
                  }"
                  @click="viewReceipt(receipt)"
                >
                  <div class="flex justify-between items-start mb-2">
                    <div class="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {{ receipt.receipt_number }}
                    </div>
                    <span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                      {{ formatDate(receipt.payment_date) }}
                    </span>
                  </div>
                  <div class="flex justify-between items-center">
                    <div class="text-sm font-semibold text-gray-900 dark:text-white">
                      ₹{{ formatCurrency(receipt.payment_amount) }}
                    </div>
                    <span class="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                      {{ formatPaymentMethod(receipt.payment_method) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Receipt Detail Panel -->
            <div class="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div v-if="!selectedPayment" class="flex items-center justify-center h-96">
                <div class="text-center">
                  <FileText class="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Select a Receipt</h4>
                  <p class="text-gray-500 dark:text-gray-400">Choose a receipt from the list to view its details</p>
                </div>
              </div>
              
              <div v-else-if="isLoadingReceiptContent" class="flex items-center justify-center h-96">
                <div class="text-center">
                  <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                  <p class="text-gray-500 dark:text-gray-400">Loading receipt...</p>
                </div>
              </div>
              
              <div v-else class="p-6">
                <!-- Receipt Header -->
                <div class="flex justify-between items-start mb-6">
                  <div>
                    <h4 class="text-lg font-semibold text-gray-900 dark:text-white">
                      Receipt Details
                    </h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      {{ selectedPayment.receipt_number }}
                    </p>
                  </div>
                  <div class="flex items-center space-x-2">
                    <!-- Print Button -->
                    <button
                      @click="printReceipt"
                      class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print
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
                  </div>
                </div>
                
                <!-- Receipt Content -->
                <div class="receipt-content print-friendly border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden" v-html="selectedPayment.receipt_html"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { FileText, CheckCircle, DollarSign, AlertTriangle, Search, X } from 'lucide-vue-next';
import { apiClient } from '~/utils/api';
import { useToast } from '~/composables/useToast';

const route = useRoute();
const studentId = route.params.id;
const { showSuccess, showError } = useToast();

const student = ref(null);
const ledgerData = ref(null);
const isLoading = ref(false);
const isSubmitting = ref(false);
const currentPage = ref(1);
const pageSize = ref(50);
const showPaymentModal = ref(false);
const showAdjustmentModal = ref(false);
const showPaymentHistoryModal = ref(false);
const showReceiptModal = ref(false);
const showAllReceiptsModal = ref(false);
const selectedInvoice = ref(null);
const paymentHistory = ref(null);
const isLoadingPayments = ref(false);
const selectedPayment = ref(null);
const allReceipts = ref([]);
const isLoadingReceipts = ref(false);
const isLoadingReceiptContent = ref(false);

const filters = ref({
  academic_year: '',
  status: ''
});

const paymentForm = ref({
  amount: '',
  payment_method: 'cash',
  payment_date: new Date().toISOString().split('T')[0],
  notes: ''
});

const adjustmentForm = ref({
  adjustment_type: 'waive',
  adjustment_amount: '',
  adjustment_reason: '',
  notes: ''
});

// Fetch student details
const fetchStudent = async () => {
  try {
    const response = await apiClient.students.getById(studentId);
    student.value = response.data;
  } catch (error) {
    console.error('Error fetching student:', error);
    if (error.response && error.response.data && error.response.data.message) {
      showError(error.response.data.message);
    } else {
      showError('Error fetching student details. Please try again.');
    }
  }
};

// Fetch ledger data
const fetchLedger = async () => {
  if (!studentId) {
    console.error('Student ID is undefined');
    return;
  }
  
  isLoading.value = true;
  try {
    const response = await apiClient.feeInvoices.getStudentLedger({
      student_id: studentId,
      academic_year: filters.value.academic_year,
      page: currentPage.value,
      limit: pageSize.value
    });
    ledgerData.value = response.data;
  } catch (error) {
    console.error('Error fetching ledger:', error);
    if (error.response && error.response.data && error.response.data.message) {
      showError(error.response.data.message);
    } else {
      showError('Error fetching fee ledger. Please try again.');
    }
  } finally {
    isLoading.value = false;
  }
};

// Record payment
const recordPayment = (invoice) => {
  selectedInvoice.value = invoice;
  paymentForm.value.amount = invoice.balance_amount;
  showPaymentModal.value = true;
};

const submitPayment = async () => {
  isSubmitting.value = true;
  try {
    await apiClient.feeInvoices.recordPayment(selectedInvoice.value.id, paymentForm.value);
    showPaymentModal.value = false;
    await fetchLedger();
    showSuccess('Payment recorded successfully!');
  } catch (error) {
    console.error('Error recording payment:', error);
    console.log('Error response:', error.response);
    console.log('Error response data:', error.response?.data);
    console.log('Error message:', error.response?.data?.message);
    
    if (error.response && error.response.data && error.response.data.message) {
      console.log('Showing error toast with message:', error.response.data.message);
      showError(error.response.data.message);
    } else {
      console.log('Showing generic error toast');
      showError('Error recording payment. Please try again.');
    }
  } finally {
    isSubmitting.value = false;
  }
};

// Adjust invoice
const adjustInvoice = (invoice) => {
  selectedInvoice.value = invoice;
  adjustmentForm.value.adjustment_amount = '';
  adjustmentForm.value.adjustment_reason = '';
  showAdjustmentModal.value = true;
};

const submitAdjustment = async () => {
  isSubmitting.value = true;
  try {
    await apiClient.feeInvoices.adjustInvoice(selectedInvoice.value.id, adjustmentForm.value);
    showAdjustmentModal.value = false;
    await fetchLedger();
    showSuccess('Invoice adjusted successfully!');
  } catch (error) {
    console.error('Error adjusting invoice:', error);
    if (error.response && error.response.data && error.response.data.message) {
      showError(error.response.data.message);
    } else {
      showError('Error adjusting invoice. Please try again.');
    }
  } finally {
    isSubmitting.value = false;
  }
};

// Show payment history
const showPaymentHistory = (invoice) => {
  selectedInvoice.value = invoice;
  isLoadingPayments.value = true;
  apiClient.feeInvoices.getInvoicePayments(invoice.id)
    .then(response => {
      paymentHistory.value = response.data;
    })
    .catch(error => {
      console.error('Error fetching payment history:', error);
      if (error.response && error.response.data && error.response.data.message) {
        showError(error.response.data.message);
      } else {
        showError('Error fetching payment history. Please try again.');
      }
    })
    .finally(() => {
      showPaymentHistoryModal.value = true;
      isLoadingPayments.value = false;
    });
};

// View receipt
const viewReceipt = async (payment) => {
  isLoadingReceiptContent.value = true;
  selectedPayment.value = payment;
  
  // Small delay to show loading state for better UX
  setTimeout(() => {
    isLoadingReceiptContent.value = false;
  }, 200);
};

// Fetch all receipts for student
const fetchAllReceipts = async () => {
  if (!studentId) return;
  
  isLoadingReceipts.value = true;
  try {
    const response = await apiClient.feeInvoices.getStudentPayments(studentId);
    allReceipts.value = response.data.payments || [];
    
    // Auto-select the first receipt if available
    if (allReceipts.value.length > 0 && !selectedPayment.value) {
      selectedPayment.value = allReceipts.value[0];
    }
  } catch (error) {
    console.error('Error fetching receipts:', error);
    if (error.response && error.response.data && error.response.data.message) {
      showError(error.response.data.message);
    } else {
      showError('Error fetching receipts. Please try again.');
    }
  } finally {
    isLoadingReceipts.value = false;
  }
};

// Watch for modal opening to fetch receipts
watch(showAllReceiptsModal, (newValue) => {
  if (newValue) {
    fetchAllReceipts();
  }
});

// Print receipt
const printReceipt = () => {
  if (!selectedPayment.value) return;
  
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  const receiptHtml = selectedPayment.value.receipt_html;
  
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

// Download receipt
const downloadReceipt = () => {
  if (!selectedPayment.value) return;

  const receiptHtml = selectedPayment.value.receipt_html;
  const receiptBlob = new Blob([receiptHtml], { type: 'text/html' });
  const receiptUrl = URL.createObjectURL(receiptBlob);
  const a = document.createElement('a');
  a.href = receiptUrl;
  a.download = `receipt_${selectedPayment.value.receipt_number}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(receiptUrl);
};

// Pagination
const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchLedger();
  }
};

const nextPage = () => {
  if (currentPage.value < ledgerData.value.pagination.total_pages) {
    currentPage.value++;
    fetchLedger();
  }
};

// Utility functions
const formatCurrency = (amount) => {
  return parseFloat(amount || 0).toLocaleString('en-IN');
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN');
};

const formatPaymentMethod = (method) => {
  const methods = {
    cash: 'Cash',
    card: 'Card',
    upi: 'UPI',
    bank_transfer: 'Bank Transfer',
    cheque: 'Cheque',
  };
  return methods[method] || method;
};

const getStatusClass = (status) => {
  const classes = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    partial_paid: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
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
  };
  return texts[status] || status;
};

const getPaymentStatusClass = (status) => {
  const classes = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    refunded: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return classes[status] || classes.pending;
};

const getPaymentStatusText = (status) => {
  const texts = {
    pending: 'Pending',
    completed: 'Completed',
    refunded: 'Refunded',
    failed: 'Failed',
  };
  return texts[status] || status;
};

onMounted(() => {
  fetchStudent();
  fetchLedger();
});
</script>

<style scoped>
/* Dark mode improvements for receipt */
.receipt-content :deep(.receipt) {
  background: white !important;
  color: #000 !important;
}

.receipt-content :deep(.header) {
  background: #f8f9fa !important;
  color: #000 !important;
}

.receipt-content :deep(.trust-name),
.receipt-content :deep(.school-name),
.receipt-content :deep(.school-type),
.receipt-content :deep(.school-address) {
  color: #000 !important;
}

.receipt-content :deep(.receipt-title) {
  color: #000 !important;
}

.receipt-content :deep(.info-label),
.receipt-content :deep(.info-value) {
  color: #000 !important;
}

.receipt-content :deep(.fee-table th),
.receipt-content :deep(.fee-table td) {
  color: #000 !important;
  border-color: #000 !important;
}

.receipt-content :deep(.summary-section) {
  background: #f8f9fa !important;
  color: #000 !important;
}

.receipt-content :deep(.remaining-info) {
  background: #fff3cd !important;
  color: #856404 !important;
}

.receipt-content :deep(.signature-line) {
  border-color: #000 !important;
}

/* Print-friendly styles */
@media print {
  .receipt-content {
    max-height: none !important;
    overflow: visible !important;
  }
  
  .receipt-content :deep(.receipt) {
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    box-shadow: none !important;
    border: none !important;
  }
}
</style> 