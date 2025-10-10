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
                {{ getStudentFullName(student) }}
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
                  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200':
                    student.status === 'active',
                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200':
                    student.status !== 'active'
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
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Invoices
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ ledgerData.summary.total_invoices }}
                  </dd>
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
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Paid Invoices
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ ledgerData.summary.paid_invoices }}
                  </dd>
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
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Paid
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    ₹{{ formatCurrency(ledgerData.summary.total_paid) }}
                  </dd>
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
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Outstanding
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    ₹{{ formatCurrency(ledgerData.summary.total_balance) }}
                  </dd>
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
            <div class="relative">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >Academic Year</label
              >
              <select v-model="filters.academic_year" @change="fetchLedger" class="input-field">
                <option value="">All Years</option>
                <option value="2024-2025">2024-2025</option>
                <option value="2023-24">2023-24</option>
              </select>
            </div>
            <div class="relative">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >Status</label
              >
              <select v-model="filters.status" @change="fetchLedger" class="input-field">
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
                class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
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
        <div
          class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"
        ></div>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading fee ledger...</p>
      </div>

      <div
        v-else-if="ledgerData && ledgerData.invoices.length > 0"
        class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md"
      >
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">Fee Ledger</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Invoice
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Fee Type
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Due Date
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Total
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Paid
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Balance
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="invoice in ledgerData?.invoices"
                :key="invoice.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"
                >
                  <div>
                    <div class="font-medium">{{ getInvoiceNumber(invoice) }}</div>
                    <div
                      v-if="invoice.is_grouped"
                      class="text-xs text-gray-500 dark:text-gray-400 cursor-help"
                      :title="`Detailed months: ${invoice.month_names}`"
                    >
                      <span class="font-medium text-blue-600 dark:text-blue-400"
                        >{{ invoice.months_covered }} month(s)</span
                      >
                    </div>
                    <div
                      v-else-if="
                        invoice.payment_model === 'monthly' && invoice.month && invoice.year
                      "
                      class="text-xs text-gray-500 dark:text-gray-400 cursor-help"
                      :title="`Monthly payment for ${getMonthName(invoice.month)} ${invoice.year}`"
                    >
                      {{ getMonthName(invoice.month) }} {{ invoice.year }}
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <span
                    class="cursor-help"
                    :title="`Fee Type: ${invoice.fee_type || invoice.feeStructure?.feeType?.name || 'Unknown'}\nPayment Model: ${invoice.payment_model || 'installment'}\nAcademic Year: ${invoice.academic_year || 'N/A'}`"
                  >
                    {{ invoice.fee_type || invoice.feeStructure?.feeType?.name || 'Unknown' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <span
                    class="cursor-help"
                    :title="`Due Date: ${formatDate(invoice.due_date)}\nInvoice Date: ${formatDate(invoice.invoice_date)}\nDays Overdue: ${getDaysOverdue(invoice.due_date)}`"
                  >
                    {{ formatDate(invoice.due_date) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <span
                    class="cursor-help"
                    :title="`Total Amount: ₹${formatCurrency(invoice.total_amount)}\nBase Amount: ₹${formatCurrency(invoice.base_amount)}\nDiscount: ₹${formatCurrency(invoice.discount_amount)}\nTax: ₹${formatCurrency(invoice.tax_amount)}`"
                  >
                    ₹{{ formatCurrency(invoice.total_amount) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <span
                    class="cursor-help"
                    :title="`Paid Amount: ₹${formatCurrency(invoice.paid_amount)}\nPayment Percentage: ${invoice.total_amount ? Math.round((invoice.paid_amount / invoice.total_amount) * 100) : 0}%`"
                  >
                    ₹{{ formatCurrency(invoice.paid_amount) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <span
                    class="cursor-help"
                    :title="`Balance Amount: ₹${formatCurrency(invoice.balance_amount)}\nRemaining Percentage: ${invoice.total_amount ? Math.round((invoice.balance_amount / invoice.total_amount) * 100) : 0}%`"
                  >
                    ₹{{ formatCurrency(invoice.balance_amount) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="getStatusClass(invoice.status)"
                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-help"
                    :title="`Status: ${getStatusText(invoice.status)}\nPayment Status: ${invoice.payment_status || 'pending'}\nLast Payment: ${invoice.last_payment_date ? formatDate(invoice.last_payment_date) : 'No payments yet'}`"
                  >
                    {{ getStatusText(invoice.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    v-if="invoice.balance_amount > 0"
                    @click="recordPayment(invoice)"
                    class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3"
                  >
                    Pay
                  </button>
                  <button
                    v-if="invoice.paid_amount > 0 && invoice.is_grouped"
                    @click="viewCombinedReceipt(invoice)"
                    class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                  >
                    View Combined Receipt
                  </button>
                  <button
                    v-else-if="invoice.paid_amount > 0"
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
        <Pagination
          v-if="ledgerData.pagination.total_pages > 1"
          :pagination="{
            page: currentPage,
            limit: pageSize,
            total: ledgerData.pagination.total_count
          }"
          item-label="invoices"
          @page-changed="goToPage"
          @page-size-changed="onPageSizeChange"
        />
      </div>

      <div v-else-if="ledgerData && ledgerData.invoices.length === 0" class="text-center py-8">
        <FileText class="mx-auto h-12 w-12 text-gray-400" />
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          No invoices found for this student.
        </p>
      </div>
    </div>

    <!-- Payment Modal -->
    <div
      v-if="showPaymentModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    >
      <div
        class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800"
      >
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Record Payment</h3>

          <form @submit.prevent="submitPayment">
            <!-- Month Information for Monthly Payments -->
            <div
              v-if="
                selectedInvoice &&
                selectedInvoice.payment_model === 'monthly' &&
                selectedInvoice.month &&
                selectedInvoice.year
              "
              class="mb-4"
            >
              <div
                class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-600 rounded-md"
              >
                <p class="text-sm text-blue-800 dark:text-blue-200">
                  📅 Paying for: {{ getMonthName(selectedInvoice.month) }}
                  {{ selectedInvoice.year }}
                </p>
              </div>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >Payment Amount</label
              >
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
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >Payment Method</label
              >
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
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >Notes</label
              >
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
    <div
      v-if="showAdjustmentModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    >
      <div
        class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800"
      >
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Adjust Invoice</h3>

          <form @submit.prevent="submitAdjustment">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >Adjustment Type</label
              >
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
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >Amount</label
              >
              <input
                v-model="adjustmentForm.adjustment_amount"
                type="number"
                step="0.01"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >Reason</label
              >
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
    <div
      v-if="showPaymentHistoryModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    >
      <div
        class="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800"
      >
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
            <div
              class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"
            ></div>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading payment history...</p>
          </div>

          <div
            v-else-if="paymentHistory && paymentHistory.payments.length > 0"
            class="overflow-x-auto"
          >
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Payment #
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Receipt #
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Amount
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Method
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
              >
                <tr
                  v-for="payment in paymentHistory.payments"
                  :key="payment.id"
                  class="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"
                  >
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
                    <span
                      :class="getPaymentStatusClass(payment.payment_status)"
                      class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                    >
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
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              No payment history found for this invoice.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Receipt Modal -->
    <div
      v-if="showReceiptModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    >
      <div
        class="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800"
      >
        <div class="mt-3">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Payment Receipt</h3>
            <div class="flex space-x-2">
              <button
                @click="showReceiptModal = false"
                class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div v-if="isLoadingReceiptContent" class="flex justify-center items-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span class="ml-2 text-gray-600 dark:text-gray-400">Loading receipt...</span>
          </div>

          <div v-else-if="selectedReceipt" class="receipt-content max-h-96 overflow-y-auto">
            <ReceiptViewer
              :receipt-data="selectedReceipt"
              :school-data="schoolData"
              @close="showReceiptModal = false"
            />
          </div>

          <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
            No receipt data available
          </div>
        </div>
      </div>
    </div>

    <!-- All Receipts Modal -->
    <div
      v-if="showAllReceiptsModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    >
      <div
        class="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white dark:bg-gray-800"
      >
        <div class="mt-3">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">All Receipts</h3>
            <button
              @click="showAllReceiptsModal = false"
              class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div v-if="isLoadingReceipts" class="flex justify-center items-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span class="ml-2 text-gray-600 dark:text-gray-400">Loading receipts...</span>
          </div>

          <div v-else-if="allReceipts.length > 0" class="flex h-[600px]">
            <!-- Receipt List Sidebar -->
            <div class="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
              <div class="p-4">
                <h4 class="font-medium text-gray-900 dark:text-white mb-3">Receipts</h4>
                <div class="space-y-2">
                  <div
                    v-for="receipt in allReceipts"
                    :key="receipt.id"
                    @click="selectReceiptFromList(receipt)"
                    :class="{
                      'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-600':
                        selectedReceiptFromList?.id === receipt.id,
                      'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600':
                        selectedReceiptFromList?.id !== receipt.id
                    }"
                    class="border rounded-lg p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div class="font-medium text-gray-900 dark:text-white text-sm">
                      {{ receipt.is_grouped ? receipt.receipt_group_id : receipt.invoice_number }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      {{ formatDate(receipt.payment_date) }} - ₹{{
                        formatCurrency(receipt.payment_amount)
                      }}
                    </div>
                    <div
                      v-if="receipt.months_covered && receipt.months_covered > 1"
                      class="text-xs text-blue-600 dark:text-blue-400"
                    >
                      {{ receipt.months_covered }} month(s): {{ receipt.month_names }}
                    </div>
                    <div
                      v-else-if="receipt.month && receipt.year"
                      class="text-xs text-blue-600 dark:text-blue-400"
                    >
                      {{ getMonthName(receipt.month) }} {{ receipt.year }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      {{ receipt.payment_model === 'monthly' ? 'Monthly' : 'Installment' }} -
                      {{ receipt.fee_type }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Receipt Preview Area -->
            <div class="w-2/3 p-4">
              <div v-if="selectedReceiptFromList" class="h-full">
                <div class="flex justify-between items-center mb-4">
                  <h4 class="font-medium text-gray-900 dark:text-white">Receipt Preview</h4>
                </div>

                <div v-if="isLoadingReceiptContent" class="flex justify-center items-center h-64">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span class="ml-2 text-gray-600 dark:text-gray-400">Loading receipt...</span>
                </div>

                <div
                  v-else-if="selectedReceiptFromList"
                  class="receipt-content max-h-[550px] overflow-y-auto"
                >
                  <ReceiptViewer
                    :receipt-data="selectedReceiptFromList"
                    :school-data="schoolData"
                    @close="showAllReceiptsModal = false"
                  />
                </div>

                <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
                  No receipt content available
                </div>
              </div>

              <div
                v-else
                class="flex justify-center items-center h-full text-gray-500 dark:text-gray-400"
              >
                Select a receipt to preview
              </div>
            </div>
          </div>

          <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
            No receipts found for this student
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
import { Students, Schools, FeeInvoices } from '~/api';
import { useToast } from '~/composables/useToast';
import Pagination from '~/components/ui/Pagination.vue';
import ReceiptViewer from '~/components/financial/ReceiptViewer.vue';

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
const selectedReceipt = ref(null);
const selectedReceiptFromList = ref(null);
const allReceipts = ref([]);
const isLoadingReceipts = ref(false);
const isLoadingReceiptContent = ref(false);
const schoolData = ref({});

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
    const response = await Students.getById(studentId);
    student.value = response.data;

    // Also fetch school data for receipt display
    if (response.data.school_id) {
      try {
        // Load school settings instead of basic school data to get trust name
        const { Settings } = await import('~/api/administration/settings');
        const schoolResponse = await Settings.getSchoolSettings();
        if (schoolResponse.success && schoolResponse.data) {
          // Combine school info with settings for receipt display
          schoolData.value = {
            ...schoolResponse.data.schoolInfo,
            address: schoolResponse.data.contactInfo?.address, // Include address from contact info
            trust_name: schoolResponse.data.schoolInfo?.trustName, // Set trust_name in main object
            receiptSchoolName: schoolResponse.data.schoolInfo?.receiptSchoolName, // Include receipt school name
            settings: {
              trust_name: schoolResponse.data.schoolInfo?.trustName
            }
          };
        }
      } catch (schoolError) {
        // Don't show error for school data, just use defaults
      }
    }
  } catch (error) {
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
    return;
  }

  isLoading.value = true;
  try {
    const response = await FeeInvoices.getStudentLedger({
      student_id: studentId,
      academic_year: filters.value.academic_year,
      status: filters.value.status,
      page: currentPage.value,
      limit: pageSize.value
    });
    ledgerData.value = response.data;
  } catch (error) {
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
const recordPayment = invoice => {
  selectedInvoice.value = invoice;
  paymentForm.value.amount = invoice.balance_amount;
  showPaymentModal.value = true;
};

const submitPayment = async () => {
  isSubmitting.value = true;
  try {
    await FeeInvoices.recordPayment(selectedInvoice.value.id, paymentForm.value);
    showPaymentModal.value = false;
    await fetchLedger();
    showSuccess('Payment recorded successfully!');
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      showError(error.response.data.message);
    } else {
      showError('Error recording payment. Please try again.');
    }
  } finally {
    isSubmitting.value = false;
  }
};

// Adjust invoice
const adjustInvoice = invoice => {
  selectedInvoice.value = invoice;
  adjustmentForm.value.adjustment_amount = '';
  adjustmentForm.value.adjustment_reason = '';
  showAdjustmentModal.value = true;
};

const submitAdjustment = async () => {
  isSubmitting.value = true;
  try {
    await FeeInvoices.adjustInvoice(selectedInvoice.value.id, adjustmentForm.value);
    showAdjustmentModal.value = false;
    await fetchLedger();
    showSuccess('Invoice adjusted successfully!');
  } catch (error) {
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
const showPaymentHistory = invoice => {
  selectedInvoice.value = invoice;
  isLoadingPayments.value = true;
  FeeInvoices.getInvoicePayments(invoice.id)
    .then(response => {
      paymentHistory.value = response.data;
    })
    .catch(error => {
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
const viewReceipt = async payment => {
  isLoadingReceiptContent.value = true;

  try {
    if (payment.is_grouped && payment.receipt_group_id) {
      // For grouped receipts, generate combined receipt on-demand
      const response = await FeeInvoices.getCombinedReceipt(payment.receipt_group_id);
      if (response.data) {
        // Merge the data properly, prioritizing the API response data
        selectedReceipt.value = {
          // Start with the API response data (this has the correct structure)
          ...response.data,
          // Then add any additional payment data that might be needed
          ...payment
        };
        showReceiptModal.value = true;
      } else {
        showError('No receipt found for this grouped payment');
        return;
      }
    } else {
      // For individual payments, generate receipt on-demand
      if (payment.payments && payment.payments.length > 0) {
        const firstPayment = payment.payments[0];
        try {
          const response = await FeeInvoices.generateReceipt(firstPayment.id);
          if (response.data) {
            // Merge the data properly, prioritizing the API response data
            selectedReceipt.value = {
              // Start with the API response data (this has the correct structure)
              ...response.data,
              // Then add any additional payment data that might be needed
              ...payment
            };
            showReceiptModal.value = true;
          } else {
            showError('No receipt found for this payment');
            return;
          }
        } catch (receiptError) {
          showError('Error generating receipt for this payment');
          return;
        }
      } else {
        // If no payments array, this is likely a payment object from payment history
        // Generate receipt for this specific payment
        try {
          const response = await FeeInvoices.generateReceipt(payment.id);
          if (response.data) {
            // Merge the data properly, prioritizing the API response data
            selectedReceipt.value = {
              // Start with the API response data (this has the correct structure)
              ...response.data,
              // Then add any additional payment data that might be needed
              ...payment
            };
            showReceiptModal.value = true;
          } else {
            showError('No receipt found for this payment');
            return;
          }
        } catch (receiptError) {
          showError('Error generating receipt for this payment');
          return;
        }
      }
    }
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      showError(error.response.data.message);
    } else {
      showError('Error viewing receipt');
    }
    return;
  } finally {
    // Small delay to show loading state for better UX
    setTimeout(() => {
      isLoadingReceiptContent.value = false;
    }, 200);
  }
};

// Select receipt from list (for tab-like functionality)
const selectReceiptFromList = async receipt => {
  selectedReceiptFromList.value = receipt;
  isLoadingReceiptContent.value = true;

  try {
    if (receipt.is_grouped && receipt.invoice_id) {
      // For grouped receipts, generate combined receipt data on-demand
      const response = await FeeInvoices.getReceiptByNumber(receipt.invoice_id);
      if (response.data) {
        selectedReceiptFromList.value = {
          ...receipt,
          ...response.data
        };
      } else {
        showError('No receipt found for this grouped payment');
        return;
      }
    } else if (receipt.payment_id) {
      // For individual payments, generate receipt data on-demand
      const response = await FeeInvoices.generateReceipt(receipt.payment_id);
      if (response.data) {
        selectedReceiptFromList.value = {
          ...receipt,
          ...response.data
        };
      } else {
        showError('No receipt found for this payment');
        return;
      }
    } else if (receipt.invoice_id || receipt.id) {
      // For individual invoices, generate receipt data on-demand
      const response = await FeeInvoices.generateInvoiceReceipt(receipt.invoice_id || receipt.id);
      if (response.data) {
        selectedReceiptFromList.value = {
          ...receipt,
          ...response.data
        };
      } else {
        showError('No receipt found for this invoice');
        return;
      }
    }
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      showError(error.response.data.message);
    } else {
      showError('Error loading receipt');
    }
  } finally {
    setTimeout(() => {
      isLoadingReceiptContent.value = false;
    }, 200);
  }
};

// View receipt from list (for opening in separate modal)
const viewReceiptFromList = async receipt => {
  isLoadingReceiptContent.value = true;
  try {
    if (receipt.is_grouped && receipt.receipt_group_id) {
      // For grouped receipts, generate combined receipt data on-demand
      const response = await FeeInvoices.getCombinedReceipt(receipt.receipt_group_id);
      if (response.data) {
        selectedReceipt.value = response.data;
        showReceiptModal.value = true;
        return;
      } else {
        showError('No receipt found for this grouped payment');
        return;
      }
    } else if (receipt.payment_id) {
      // For individual payments, generate receipt data on-demand
      const response = await FeeInvoices.generateReceipt(receipt.payment_id);
      if (response.data) {
        selectedReceipt.value = {
          ...receipt,
          ...response.data
        };
        showReceiptModal.value = true;
        return;
      } else {
        showError('No receipt found for this payment');
        return;
      }
    } else if (receipt.invoice_id || receipt.id) {
      // For individual invoices, generate receipt data on-demand
      const response = await FeeInvoices.generateInvoiceReceipt(receipt.invoice_id || receipt.id);
      if (response.data) {
        selectedReceipt.value = {
          ...receipt,
          ...response.data
        };
        showReceiptModal.value = true;
        return;
      } else {
        showError('No receipt found for this invoice');
        return;
      }
    }
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      showError(error.response.data.message);
    } else {
      showError('Error viewing receipt');
    }
  } finally {
    setTimeout(() => {
      isLoadingReceiptContent.value = false;
    }, 200);
  }
};

// View combined receipt for grouped payments
const viewCombinedReceipt = async invoice => {
  try {
    // First check if we have combined_receipt data (from smart payments)
    if (invoice.combined_receipt) {
      selectedReceipt.value = invoice.combined_receipt;
      showReceiptModal.value = true;
      return;
    }

    // Check for receipt_group_id (for grouped receipts)
    if (invoice.receipt_group_id) {
      const response = await FeeInvoices.getCombinedReceipt(invoice.receipt_group_id);

      if (response.data) {
        selectedReceipt.value = response.data;
        showReceiptModal.value = true;
      } else {
        showError('No receipt found for this combined payment');
      }
      return;
    }

    // Check for receipt_number (for individual receipts)
    if (invoice.receipt_number) {
      const response = await FeeInvoices.getReceiptByNumber(invoice.receipt_number);

      if (response.success && response.data) {
        selectedReceipt.value = response.data;
        showReceiptModal.value = true;
      } else {
        showError('No receipt found for this receipt number');
      }
      return;
    }

    // If none of the above, show error
    showError('No receipt group ID or receipt number found for this payment');
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      showError(error.response.data.message);
    } else {
      showError('Error generating combined receipt');
    }
  }
};

// Fetch all receipts for student
const fetchAllReceipts = async () => {
  if (!studentId) return;

  console.log('Fetching all receipts for student:', studentId);
  isLoadingReceipts.value = true;
  try {
    // Fetch student ledger which includes both individual and grouped receipts
    const ledgerResponse = await FeeInvoices.getStudentLedger({
      student_id: studentId,
      academic_year: filters.value.academic_year
    });

    const allReceiptsData = [];

    if (ledgerResponse.success && ledgerResponse.data) {
      // Process all invoices from the API response
      if (ledgerResponse.data.invoices) {
        ledgerResponse.data.invoices.forEach(invoice => {
          // Only show invoices that have been paid
          if (invoice.paid_amount > 0) {
            // Check if this invoice has multiple payments
            if (invoice.payments && invoice.payments.length > 1) {
              // Create separate receipt entries for each payment
              invoice.payments.forEach((payment, index) => {
                const receiptData = {
                  id: `${invoice.id}-payment-${payment.id}`, // Unique ID for each payment
                  invoice_id: invoice.id,
                  payment_id: payment.id,
                  receipt_number: payment.receipt_number,
                  payment_amount: parseFloat(payment.payment_amount),
                  payment_method: payment.payment_method,
                  payment_date: payment.payment_date,

                  is_grouped: false,
                  receipt_type: 'individual',
                  receipt_group_id: null,

                  months_covered: invoice.months_covered,
                  month_names: invoice.month_names,
                  month_range: invoice.month_range,
                  month: invoice.month,
                  year: invoice.year,
                  payment_model: invoice.payment_model,
                  total_amount: parseFloat(invoice.total_amount),
                  paid_amount: parseFloat(invoice.paid_amount),
                  balance_amount: parseFloat(invoice.balance_amount),
                  status: invoice.status,
                  academic_year: invoice.academic_year,
                  due_date: invoice.due_date,
                  invoice_date: invoice.invoice_date,
                  fee_type: invoice.fee_type,
                  class_name: invoice.class_name,
                  section: invoice.section,
                  payments: [payment], // Single payment
                  feeStructure: invoice.feeStructure,
                  student: invoice.student,
                  branch: invoice.branch
                };

                allReceiptsData.push(receiptData);
              });
            } else {
              // Single payment or grouped payment
              const receiptData = {
                id: invoice.id,
                invoice_id: invoice.id,
                receipt_number: invoice.invoice_number,
                payment_amount: invoice.paid_amount,
                payment_method:
                  invoice.payments && invoice.payments.length > 0
                    ? invoice.payments[0].payment_method
                    : 'Cash',
                payment_date:
                  invoice.payments && invoice.payments.length > 0
                    ? invoice.payments[0].payment_date
                    : invoice.due_date,

                is_grouped: invoice.is_grouped,
                receipt_type: invoice.is_grouped ? 'grouped' : 'individual',
                receipt_group_id: invoice.receipt_group_id,

                months_covered: invoice.months_covered,
                month_names: invoice.month_names,
                month_range: invoice.month_range,
                month: invoice.month,
                year: invoice.year,
                payment_model:
                  invoice.payment_model || invoice.feeStructure?.payment_model || 'installment',
                total_amount: invoice.total_amount,
                paid_amount: invoice.paid_amount,
                balance_amount: invoice.balance_amount,
                status: invoice.status,
                academic_year: invoice.academic_year,
                due_date: invoice.due_date,
                invoice_date: invoice.invoice_date,
                fee_type: invoice.fee_type || invoice.feeStructure?.feeType?.name,
                class_name: invoice.class_name,
                section: invoice.section,
                payments: invoice.payments,
                feeStructure: invoice.feeStructure,
                student: invoice.student,
                branch: invoice.branch
              };

              allReceiptsData.push(receiptData);
            }
          }
        });
      }
    }

    // Sort by payment date (newest first)
    allReceiptsData.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

    console.log('All receipts data:', allReceiptsData);
    allReceipts.value = allReceiptsData;

    // Auto-select the first receipt if available
    if (allReceipts.value.length > 0 && !selectedReceiptFromList.value) {
      selectedReceiptFromList.value = allReceipts.value[0];
      // Load the first receipt content
      await selectReceiptFromList(allReceipts.value[0]);
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

// Watch for modal opening to fetch receipts and ledger data
watch(showAllReceiptsModal, newValue => {
  if (newValue) {
    fetchAllReceipts();
    // Ensure ledger data is available for outstanding balance calculation
    if (!ledgerData.value) {
      fetchLedger();
    }
  }
});

// Watch for filter changes to refresh receipts
watch(
  filters,
  () => {
    if (showAllReceiptsModal.value) {
      fetchAllReceipts();
    }
  },
  { deep: true }
);

// Utility functions
const formatCurrency = amount => {
  return parseFloat(amount).toLocaleString('en-IN');
};

const formatDate = date => {
  return new Date(date).toLocaleDateString('en-IN');
};

const getMonthName = month => {
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
  return months[month - 1] || 'Unknown';
};

const formatPaymentMethod = method => {
  const methods = {
    cash: 'Cash',
    card: 'Card',
    upi: 'UPI',
    bank_transfer: 'Bank Transfer',
    cheque: 'Cheque'
  };
  return methods[method] || method;
};

const getDaysOverdue = dueDate => {
  if (!dueDate) return 'N/A';
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today - due;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `${Math.abs(diffDays)} days remaining`;
  } else if (diffDays === 0) {
    return 'Due today';
  } else {
    return `${diffDays} days overdue`;
  }
};

const getStatusClass = status => {
  const classes = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    partial_paid: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  };
  return classes[status] || classes.draft;
};

const getStatusText = status => {
  const texts = {
    draft: 'Draft',
    sent: 'Sent',
    paid: 'Paid',
    partial_paid: 'Partial Paid',
    overdue: 'Overdue',
    cancelled: 'Cancelled'
  };
  return texts[status] || status;
};

const getPaymentStatusClass = status => {
  const classes = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    refunded: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };
  return classes[status] || classes.pending;
};

const getPaymentStatusText = status => {
  const texts = {
    pending: 'Pending',
    completed: 'Completed',
    refunded: 'Refunded',
    failed: 'Failed'
  };
  return texts[status] || status;
};

const goToPage = page => {
  if (page >= 1 && page <= ledgerData.value.pagination.total_pages) {
    currentPage.value = page;
    fetchLedger();
  }
};

const onPageSizeChange = newPageSize => {
  pageSize.value = newPageSize;
  currentPage.value = 1; // Reset to first page when page size changes
  fetchLedger();
};

// Helper function to get student full name
const getStudentFullName = student => {
  const firstName = student.first_name;
  const lastName = student.last_name;

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

// Helper function to get invoice number (same as invoices page)
const getInvoiceNumber = invoice => {
  // For grouped payments, show the receipt group ID as it's more meaningful
  // For regular invoices, show the actual invoice number
  if (invoice.is_grouped && invoice.receipt_group_id) {
    return invoice.receipt_group_id; // Show RCP-GROUP-C5-26 for grouped payments
  }
  // Otherwise use invoice_number or fallback
  return invoice.invoice_number;
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
