<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Fee Invoices</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">Manage student fee invoices and payments</p>
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

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
        <div class="px-4 py-5 sm:p-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Academic Year</label>
              <div class="relative">
                <select 
                  v-model="filters.academic_year" 
                  class="appearance-none w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 ease-in-out text-sm font-medium"
                >
                  <option value="">All Years</option>
                  <option v-for="year in academicYears" :key="year.id" :value="year.name">
                    {{ year.name }} {{ year.is_current ? '(Current)' : '' }}
                  </option>
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
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Class</label>
              <div class="relative">
                <select 
                  v-model="filters.class_name" 
                  class="appearance-none w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 ease-in-out text-sm font-medium"
                >
                  <option value="">All Classes</option>
                  <option v-for="classItem in classes" :key="classItem.id" :value="classItem.name">
                    {{ classItem.name }}
                  </option>
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
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <div class="relative">
                <select 
                  v-model="filters.status" 
                  class="appearance-none w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 ease-in-out text-sm font-medium"
                >
                  <option value="">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="partial_paid">Partial Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
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
            <div class="flex items-end">
              <button
                @click="fetchInvoices"
                :disabled="isLoading"
                class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <Search class="-ml-1 mr-2 h-4 w-4" />
                {{ isLoading ? 'Loading...' : 'Filter' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Invoices Table -->
      <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">Fee Invoices</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Invoice</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Class</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paid</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-if="isLoading" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td colspan="8" class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  Loading invoices...
                </td>
              </tr>
              <tr v-else-if="invoices.length === 0" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td colspan="8" class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No invoices found
                </td>
              </tr>
              <tr v-else v-for="invoice in invoices" :key="invoice.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {{ invoice.invoice_number }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ invoice.student?.first_name }} {{ invoice.student?.last_name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ invoice.student?.current_class }}{{ invoice.student?.section ? `-${invoice.student.section}` : '' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  ₹{{ formatCurrency(invoice.total_amount) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  ₹{{ formatCurrency(invoice.paid_amount) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ formatDate(invoice.due_date) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getStatusClass(invoice.status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                    {{ getStatusText(invoice.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    @click="viewInvoice(invoice)"
                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                  >
                    View
                  </button>
                  <button
                    v-if="invoice.status !== 'paid' && invoice.status !== 'cancelled'"
                    @click="recordPayment(invoice)"
                    class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                  >
                    Pay
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <div class="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
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
    </div>

    <!-- Quick Collect Modal -->
    <QuickCollectFeeModal
      :show="showQuickCollectModal"
      @close="showQuickCollectModal = false"
      @payment-recorded="onPaymentRecorded"
    />

    <!-- Generate Invoices Modal -->
    <div v-if="showGenerateModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Generate Fee Invoices</h3>
          <form @submit.prevent="generateInvoices">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Academic Year *</label>
                <div class="relative">
                  <select 
                    v-model="generateForm.academic_year" 
                    required
                    class="appearance-none w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 ease-in-out text-sm font-medium"
                  >
                    <option value="">Select Year</option>
                    <option v-for="year in academicYears" :key="year.id" :value="year.name">
                      {{ year.name }} {{ year.is_current ? '(Current)' : '' }}
                    </option>
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
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Class *</label>
                <div class="relative">
                  <select 
                    v-model="generateForm.class_name" 
                    required
                    class="appearance-none w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 ease-in-out text-sm font-medium"
                  >
                    <option value="">Select Class</option>
                    <option v-for="classItem in classes" :key="classItem.id" :value="classItem.name">
                      {{ classItem.name }}
                    </option>
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
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Section</label>
                <div class="relative">
                  <select 
                    v-model="generateForm.section" 
                    class="appearance-none w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 ease-in-out text-sm font-medium"
                  >
                    <option value="">All Sections</option>
                    <option v-for="section in sections" :key="section.id" :value="section.name">
                      {{ section.name }}
                    </option>
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
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Due Date 
                  <span class="text-xs text-gray-500 dark:text-gray-400">(Optional - will auto-calculate if not set)</span>
                </label>
                <input 
                  v-model="generateForm.due_date" 
                  type="date" 
                  class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  :min="new Date().toISOString().split('T')[0]"
                >
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Leave empty to use fee type default due date settings
                </p>
              </div>
            </div>
            <div class="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                @click="showGenerateModal = false"
                class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isGenerating"
                class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {{ isGenerating ? 'Generating...' : 'Generate' }}
              </button>
            </div>
          </form>
        </div>
      </div>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { 
  Plus, 
  CreditCard, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign,
  Search
} from 'lucide-vue-next';
import { apiClient } from '~/utils/api';
import { useAcademics } from '~/composables/useAcademics';
import { useToast } from '~/composables/useToast';
import QuickCollectFeeModal from '~/components/QuickCollectFeeModal.vue';

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

// State
const invoices = ref([]);
const summary = ref({});
const isLoading = ref(false);
const showGenerateModal = ref(false);
const showPaymentModal = ref(false);
const isGenerating = ref(false);
const isSubmittingPayment = ref(false);
const showQuickCollectModal = ref(false);

// Pagination
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);
const totalPages = ref(0);

// Filters
const filters = reactive({
  academic_year: '',
  class_name: '',
  status: '',
});

// Forms
const generateForm = reactive({
  academic_year: '',
  class_name: '',
  section: '',
  due_date: '',
});

const paymentForm = reactive({
  invoice_number: '',
  amount: '',
  payment_method: 'cash',
  notes: '',
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
    
    const response = await apiClient.feeInvoices.getAll(params);
    invoices.value = response.data.invoices || [];
    totalItems.value = response.data.pagination?.total_count || 0;
    totalPages.value = response.data.pagination?.total_pages || 0;
  } catch (error) {
    console.error('Error fetching invoices:', error);
    showToast('Error fetching invoices', 'error');
  } finally {
    isLoading.value = false;
  }
};

const fetchSummary = async () => {
  try {
    const response = await apiClient.feeInvoices.getSummary();
    const data = response.data || {};
    
    // Transform backend data structure to frontend expected structure
    summary.value = {
      totalInvoices: data.invoice_counts?.total || 0,
      paidInvoices: data.invoice_counts?.paid || 0,
      overdueInvoices: data.invoice_counts?.overdue || 0,
      totalCollected: data.amounts?.total_paid || 0,
      totalAmount: data.amounts?.total_amount || 0,
      totalBalance: data.amounts?.total_balance || 0,
      collectionPercentage: data.amounts?.collection_percentage || 0
    };
  } catch (error) {
    console.error('Error fetching summary:', error);
    showToast('Error fetching summary', 'error');
  }
};

const generateInvoices = async () => {
  isGenerating.value = true;
  try {
    await apiClient.feeInvoices.generateInvoices(generateForm);
    showGenerateModal.value = false;
    await fetchInvoices();
    await fetchSummary();
    showToast('Invoices generated successfully!', 'success');
    
    // Reset form
    generateForm.academic_year = '';
    generateForm.class_name = '';
    generateForm.section = '';
    generateForm.due_date = '';
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
    // Find invoice by number
    const invoice = invoices.value.find(inv => inv.invoice_number === paymentForm.invoice_number);
    if (!invoice) {
      showToast('Invoice not found!', 'error');
      return;
    }
    
    await apiClient.feeInvoices.recordPayment(invoice.id, paymentForm);
    showPaymentModal.value = false;
    await fetchInvoices();
    await fetchSummary();
    showToast('Payment recorded successfully!', 'success');
    
    // Reset form
    paymentForm.invoice_number = '';
    paymentForm.amount = '';
    paymentForm.payment_method = 'cash';
    paymentForm.notes = '';
  } catch (error) {
    console.error('Error recording payment:', error);
    showToast(error.message || 'Error recording payment', 'error');
  } finally {
    isSubmittingPayment.value = false;
  }
};

const viewInvoice = (invoice) => {
  // Navigate to student fee ledger page for this invoice's student
  navigateTo(`/students/${invoice.student_id}/fee-ledger`);
};

const recordPayment = (invoice) => {
  paymentForm.invoice_number = invoice.invoice_number;
  paymentForm.amount = invoice.balance_amount;
  showPaymentModal.value = true;
};

const onPaymentRecorded = async () => {
  await fetchInvoices();
  await fetchSummary();
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

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN');
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

// Load academic data
const loadAcademicData = async () => {
  try {
    await Promise.all([
      fetchAcademicYears(),
      fetchClasses()
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

// Watch for class changes to load sections
watch(() => generateForm.class_name, async (newClass) => {
  if (newClass) {
    const selectedClass = classes.value.find(c => c.name === newClass);
    if (selectedClass) {
      await fetchSections(undefined, undefined, selectedClass.id);
    }
  } else {
    sections.value = [];
  }
});

onMounted(async () => {
  await loadAcademicData();
  await fetchInvoices();
  await fetchSummary();
});
</script>

<style scoped>
/****************************************************
  Tailwind CSS styles are generated from utilities.
  Add custom styles here.
****************************************************/
</style>

