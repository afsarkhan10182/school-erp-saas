<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div class="mb-4 sm:mb-0">
          <h1
            class="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"
          >
            Receipts Report
          </h1>
          <p class="mt-2 text-lg text-gray-600 dark:text-gray-300">
            Payment collections and receipt tracking
          </p>
        </div>
        <div class="flex flex-col sm:flex-row gap-3">
          <!-- Column Selector -->
          <div class="relative column-selector-dropdown">
            <button
              @click="toggleColumnSelector"
              class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-200 shadow-sm cursor-pointer"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              Columns
              <svg
                class="ml-1 h-4 w-4 transition-transform duration-200"
                :class="{ 'rotate-180': showColumnSelector }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <!-- Column Selector Dropdown -->
            <div
              v-show="showColumnSelector"
              class="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50"
            >
              <div class="p-2">
                <h3 class="text-xs font-medium text-gray-900 dark:text-white mb-2">
                  Select Columns
                </h3>
                <div class="space-y-1">
                  <label
                    v-for="(column, index) in availableColumns"
                    :key="column.key"
                    class="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-1 py-1 rounded text-xs"
                  >
                    <input
                      type="checkbox"
                      :checked="column.visible"
                      @change="toggleColumnVisibility(index)"
                      class="h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                    />
                    <span
                      class="ml-2 text-gray-700 dark:text-gray-300 cursor-pointer select-none"
                      >{{ column.label }}</span
                    >
                  </label>
                </div>
                <div class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <button
                    @click="selectAllColumns"
                    class="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 mr-2 cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    @click="deselectAllColumns"
                    class="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            @click="printReceiptsReport"
            :disabled="isLoading || payments.length === 0"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print Report
          </button>

          <!-- Download Dropdown -->
          <div class="relative download-dropdown">
            <button
              @click="toggleDownloadDropdown"
              :disabled="isLoading || payments.length === 0"
              class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download
              <svg
                class="ml-2 h-4 w-4 transition-transform duration-200"
                :class="{ 'rotate-180': showDownloadDropdown }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <!-- Dropdown Menu -->
            <div
              v-show="showDownloadDropdown"
              class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 transition-all duration-200 ease-in-out"
              style="transform-origin: top right"
            >
              <div class="py-1">
                <button
                  @click="downloadPDFReport"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 flex items-center"
                >
                  <svg class="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  PDF
                </button>
                <button
                  @click="downloadExcelReport"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 flex items-center"
                >
                  <svg class="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 012-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Excel
                </button>
                <button
                  @click="downloadCSVReport"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 flex items-center"
                >
                  <svg class="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 012-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div
        class="bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 mb-8 p-6"
      >
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Report Filters</h2>
          <button
            @click="clearFilters"
            class="px-4 py-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium disabled:opacity-50 transition-colors duration-200"
          >
            Reset Filters
          </button>
        </div>

        <div class="flex flex-wrap items-end gap-3 mb-4">
          <!-- Date Range -->
          <div class="flex-1 min-w-[150px]">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >Date Range *</label
            >
            <EnhancedDropdown
              v-model="filters.dateRange"
              :options="dateRangeOptions"
              placeholder="Select Date Range"
              @change="handleDateRangeChange"
            />
          </div>

          <!-- Payment Method -->
          <div class="flex-1 min-w-[150px]">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >Payment Method</label
            >
            <EnhancedDropdown
              v-model="filters.payment_method"
              :options="paymentMethodOptions"
              placeholder="All Payment Methods"
            />
          </div>

          <!-- Student Search -->
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >Student Search</label
            >
            <div class="relative">
              <input
                v-model="filters.search"
                type="text"
                placeholder="Search by student name, admission number, or roll number"
                @keyup.enter="() => fetchReceiptsData(1)"
                class="w-full px-3 py-2 pl-10 pr-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                aria-label="Search students by name, admission number, or roll number"
              />
              <!-- Left search icon (always visible) -->
              <svg
                class="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <!-- Right clear button (only when search has text) -->
              <button
                v-if="filters.search"
                @click="clearSearch"
                class="absolute right-2 top-2 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
                title="Clear search"
                aria-label="Clear search"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
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

          <!-- Class dropdown - show when branch is selected -->
          <div v-if="filters.branch_id" class="flex-1 min-w-[150px]">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >Class</label
            >
            <EnhancedDropdown
              v-model="filters.class_id"
              :options="classOptions"
              placeholder="All Classes"
              @change="onClassChange"
            />
          </div>

          <!-- Apply Filter Button -->
          <div class="flex-shrink-0">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >&nbsp;</label
            >
            <button
              @click="() => fetchReceiptsData(1)"
              :disabled="isLoading"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            >
              <svg
                v-if="isLoading"
                class="animate-spin w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span v-if="isLoading">Loading...</span>
              <span v-else>Apply Filters</span>
            </button>
          </div>
        </div>

        <!-- Custom Date Range -->
        <div
          v-if="filters.dateRange === 'custom'"
          class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"
        >
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >From Date</label
            >
            <input
              v-model="filters.from_date"
              type="date"
              class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >To Date</label
            >
            <input
              v-model="filters.to_date"
              type="date"
              class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div
        class="bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 mb-8 p-6"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            class="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-700"
          >
            <div class="text-3xl font-bold text-green-600 dark:text-green-400">
              {{ formatCurrency(summary.total_collected) }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-300 font-medium">Total Collected</div>
          </div>
          <div
            class="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-lg border border-indigo-200 dark:border-indigo-700"
          >
            <div class="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {{ summary.total_receipts }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-300 font-medium">Total Receipts</div>
          </div>
        </div>
      </div>

      <!-- Receipts Table -->
      <div
        class="bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700"
      >
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Receipts ({{ pagination.total_records }} total)
          </h3>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  v-if="isColumnVisible('invoice_number')"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Invoice No
                </th>
                <th
                  v-if="isColumnVisible('receipt_number')"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Receipt No
                </th>
                <th
                  v-if="isColumnVisible('payment_date')"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  v-if="isColumnVisible('student_name')"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Student
                </th>
                <th
                  v-if="isColumnVisible('branch')"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Branch
                </th>
                <th
                  v-if="isColumnVisible('class')"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Class
                </th>
                <th
                  v-if="isColumnVisible('section')"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Section
                </th>
                <th
                  v-if="isColumnVisible('payment_amount')"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Amount
                </th>
                <th
                  v-if="isColumnVisible('payment_method')"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Method
                </th>
                <th
                  v-if="isColumnVisible('fee_type')"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Fee Type
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
              <tr v-if="isLoading">
                <td
                  :colspan="displayedColumns.length"
                  class="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                >
                  Loading receipts...
                </td>
              </tr>
              <tr v-else-if="payments.length === 0">
                <td
                  :colspan="displayedColumns.length"
                  class="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                >
                  No receipts found for the selected filters
                </td>
              </tr>
              <tr
                v-else
                v-for="payment in payments"
                :key="payment.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <!-- Invoice Number -->
                <td
                  v-if="isColumnVisible('invoice_number')"
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                >
                  <div class="flex flex-col">
                    <span
                      v-if="payment.invoice?.invoice_number"
                      class="font-medium text-blue-600 dark:text-blue-400"
                    >
                      {{ payment.invoice.invoice_number }}
                    </span>
                    <span
                      v-else-if="payment.invoice?.id"
                      class="font-medium text-blue-600 dark:text-blue-400"
                    >
                      {{ payment.invoice.id }}
                    </span>
                    <span v-else class="text-gray-500 dark:text-gray-400 italic"> N/A </span>
                  </div>
                </td>

                <!-- Receipt Number -->
                <td
                  v-if="isColumnVisible('receipt_number')"
                  class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"
                >
                  <div class="flex items-center">
                    <span>{{ payment.receipt_number }}</span>
                    <span
                      v-if="payment.month_count > 1"
                      class="ml-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white dark:bg-blue-500 dark:text-white"
                      :title="getMonthsCovered(payment)"
                    >
                      {{ payment.month_count }} months
                    </span>
                  </div>
                </td>

                <!-- Date -->
                <td
                  v-if="isColumnVisible('payment_date')"
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                >
                  {{ formatDate(payment.payment_date) }}
                </td>

                <!-- Student Name -->
                <td
                  v-if="isColumnVisible('student_name')"
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                >
                  <div v-if="payment.student && payment.student.name">
                    <div class="font-medium">{{ payment.student.name }}</div>
                  </div>
                  <div v-else class="text-gray-500 dark:text-gray-400 italic">
                    Student data unavailable
                  </div>
                </td>

                <!-- Branch -->
                <td
                  v-if="isColumnVisible('branch')"
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                >
                  <span v-if="payment.branch" class="font-medium text-gray-900 dark:text-white">
                    {{ payment.branch }}
                  </span>
                  <span v-else class="text-gray-500 dark:text-gray-400 italic"> N/A </span>
                </td>

                <!-- Class -->
                <td
                  v-if="isColumnVisible('class')"
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                >
                  <span v-if="payment.student && payment.student.current_class">
                    {{ payment.student.current_class }}
                  </span>
                  <span v-else class="text-gray-500 dark:text-gray-400 italic"> N/A </span>
                </td>

                <!-- Section -->
                <td
                  v-if="isColumnVisible('section')"
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                >
                  <span v-if="payment.student && payment.student.section">
                    {{ payment.student.section }}
                  </span>
                  <span v-else class="text-gray-500 dark:text-gray-400 italic"> N/A </span>
                </td>

                <!-- Amount -->
                <td
                  v-if="isColumnVisible('payment_amount')"
                  class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400"
                >
                  {{ formatCurrency(payment.payment_amount) }}
                </td>

                <!-- Payment Method -->
                <td
                  v-if="isColumnVisible('payment_method')"
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                >
                  <span
                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                    :class="getPaymentMethodClass(payment.payment_method)"
                  >
                    {{ payment.payment_method }}
                  </span>
                </td>

                <!-- Fee Type -->
                <td
                  v-if="isColumnVisible('fee_type')"
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                >
                  {{ payment.fee_type || 'N/A' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <Pagination
          v-if="pagination.total_records > 0"
          :pagination="pagination"
          item-label="receipts"
          @page-changed="changePage"
          @page-size-changed="handlePageSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { FeeInvoices } from '~/api';
import { useToast } from '~/composables/useToast';
import { useAcademics } from '~/composables/useAcademics';
import { useSchools } from '~/composables/useSchools';
import { useAuth } from '~/composables/useAuth';
import { useAuthStore } from '~/stores/auth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useExportService } from '~/composables/useExportService';
import { usePrintReport } from '~/composables/usePrintReport';
import Pagination from '~/components/ui/Pagination.vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';

// Page metadata
definePageMeta({
  layout: 'default'
});

// Composables
const { showToast } = useToast();
const { user, isSuperAdmin, isAdmin, isBranchAdmin } = useAuth();
const { generateReport, isGenerating, generationProgress } = useExportService();
const { printReport: printReportCommon, openPrintWindow } = usePrintReport();

// Academic composables
const { classes, sections, fetchClasses, fetchSections } = useAcademics();
const { schools, fetchSchools } = useSchools();

// Dropdown options
const dateRangeOptions = [
  { value: '', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'custom', label: 'Custom Range' }
];

const paymentMethodOptions = [
  { value: '', label: 'All Methods' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank' },
  { value: 'online', label: 'Online' },
  { value: 'card', label: 'Card' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI' }
];

const schoolOptions = computed(() => [
  ...schools.value.map(school => ({
    value: school.id,
    label: school.name
  }))
]);


const classOptions = computed(() => [
  ...classes.value.map(cls => ({
    value: cls.id,
    label: cls.name
  }))
]);

// State
const isLoading = ref(false);
const payments = ref([]);
const summary = ref({
  total_collected: 0,
  total_receipts: 0,
  payment_methods: []
});

const pagination = ref({
  page: 1,
  current_page: 1,
  total_pages: 1,
  total: 0,
  total_records: 0,
  per_page: 10,
  limit: 10
});
const showDownloadDropdown = ref(false); // Track download dropdown state
const showColumnSelector = ref(false); // Track column selector state

// Dropdown data - using composables
// schools, branches, classes, sections are now provided by composables

// Available columns for selection
const availableColumns = ref([
  { key: 'invoice_number', label: 'Invoice No', visible: false },
  { key: 'receipt_number', label: 'Receipt No', visible: true },
  { key: 'payment_date', label: 'Date', visible: true },
  { key: 'student_name', label: 'Student Name', visible: true },
  { key: 'branch', label: 'Branch', visible: true },
  { key: 'class', label: 'Class', visible: true },
  { key: 'section', label: 'Section', visible: false },
  { key: 'payment_amount', label: 'Amount', visible: true },
  { key: 'payment_method', label: 'Method', visible: true },
  { key: 'fee_type', label: 'Fee Type', visible: true }
]);

// Computed property to filter visible columns
const displayedColumns = computed(() => {
  return availableColumns.value.filter(col => col.visible);
});

// User role for conditional filtering
const userRole = computed(() => user.value?.role || 'branch_admin');

const { selectedBranchId, currentSchool } = useGlobalBranch();
const authStore = useAuthStore();

// Filters
const filters = reactive({
  dateRange: 'today', // Changed from 'month' to 'today'
  from_date: '',
  to_date: '',
  payment_method: '',
  school_id: authStore.currentSchool?.id || '',
  branch_id: selectedBranchId.value || '',
  class_id: '',
  section_id: '',
  search: ''
});

// Watch for global branch or school change
watch(selectedBranchId, async newVal => {
  filters.branch_id = newVal || '';
  filters.class_id = '';
  filters.section_id = '';
  await fetchReceiptsData(1);
});

watch(currentSchool, async () => {
  filters.school_id = authStore.currentSchool?.id || '';
  filters.branch_id = selectedBranchId.value || '';
  filters.class_id = '';
  filters.section_id = '';
  await fetchReceiptsData(1);
});

// Methods
const handleDateRangeChange = () => {
  const today = new Date();

  const formatDate = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  switch (filters.dateRange) {
    case 'today':
      filters.from_date = formatDate(today);
      filters.to_date = formatDate(today);
      break;
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      filters.from_date = formatDate(yesterday);
      filters.to_date = formatDate(yesterday);
      break;
    case 'week':
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      filters.from_date = formatDate(weekStart);
      filters.to_date = formatDate(today);
      break;
    case 'month':
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      filters.from_date = formatDate(monthStart);
      filters.to_date = formatDate(today);
      break;
    case 'quarter':
      const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
      filters.from_date = formatDate(quarterStart);
      filters.to_date = formatDate(today);
      break;
    case 'year':
      const yearStart = new Date(today.getFullYear(), 0, 1);
      filters.from_date = formatDate(yearStart);
      filters.to_date = formatDate(today);
      break;
    case 'custom':
      // Keep existing values
      break;
    default:
      filters.from_date = '';
      filters.to_date = '';
  }
};

const fetchReceiptsData = async (page = 1, exportAll = false) => {
  if (!exportAll) {
    isLoading.value = true;
  }
  try {
    const params = {};

    if (exportAll) {
      params.export_all = true;
    } else {
      params.page = page;
      params.limit = pagination.value.per_page;
    }

    // Add filters
    if (filters.from_date) params.from_date = filters.from_date;
    if (filters.to_date) params.to_date = filters.to_date;
    if (filters.payment_method) params.payment_method = filters.payment_method;
    if (filters.school_id) params.school_id = filters.school_id;
    if (filters.branch_id) params.branch_id = filters.branch_id;

    // Add class ID if selected
    if (filters.class_id && filters.class_id !== '') {
      params.class_id = filters.class_id;
    }

    // Add section name if selected
    if (filters.section_id && filters.section_id !== '') {
      const selectedSection = sections.value.find(sec => sec.id === filters.section_id);
      if (selectedSection) {
        params.section = selectedSection.name;
      }
    }

    if (filters.search) params.search = filters.search;

    const response = await FeeInvoices.getReceiptsReport(params);

    if (response.success) {
      const responsePayments = response.data.payments || [];
      const responseSummary = response.data.summary || {
        total_collected: 0,
        total_receipts: 0,
        payment_methods: []
      };

      if (exportAll) {
        // For export/print, return the data directly
        return responsePayments;
      } else {
        // For normal page display, update the reactive data
        payments.value = responsePayments;
        summary.value = responseSummary;

        // Ensure pagination data exists
        const paginationData = response.data.pagination || {};
        pagination.value = {
          page: paginationData.current_page || 1,
          current_page: paginationData.current_page || 1,
          total: paginationData.total_records || 0,
          total_records: paginationData.total_records || 0,
          total_pages: paginationData.total_pages || 1,
          per_page: paginationData.per_page || 10,
          limit: paginationData.per_page || 10
        };
      }
    } else {
      if (exportAll) {
        console.error('❌ Failed to fetch all receipts for print');
        return [];
      } else {
        showToast('Error fetching receipts data', 'error');
      }
    }
  } catch (error) {
    console.error('Error fetching receipts:', error);
    if (exportAll) {
      return [];
    } else {
      showToast('Error fetching receipts data', 'error');
    }
  } finally {
    if (!exportAll) {
      isLoading.value = false;
    }
  }
};

const changePage = page => {
  if (page >= 1 && page <= pagination.value.total_pages) {
    pagination.value.current_page = page;
    pagination.value.page = page;
    fetchReceiptsData(page);
  }
};

const handlePageSizeChange = newPageSize => {
  pagination.value.per_page = newPageSize;
  pagination.value.limit = newPageSize; // Also update limit for Pagination component
  fetchReceiptsData(1);
};

const clearFilters = () => {
  filters.dateRange = 'today'; // Changed from 'month' to 'today'
  filters.from_date = '';
  filters.to_date = '';
  filters.payment_method = '';
  filters.school_id = '';
  filters.branch_id = '';
  filters.class_id = '';
  filters.section_id = '';
  filters.search = '';

  handleDateRangeChange();
  fetchReceiptsData(1);
};

const clearSearch = () => {
  filters.search = '';
  fetchReceiptsData(1);
};

// Dropdown change handlers
const onSchoolChange = async () => {
  // Reset branch and class when school changes
  filters.branch_id = '';
  filters.class_id = '';

  // Refetch branches for the selected school
  await fetchClasses();
};

const onBranchChange = async () => {
  // Reset class when branch changes
  filters.class_id = '';

  // Refetch dependent data
  await fetchClasses();
};

const onClassChange = async () => {
  // No additional action needed when class changes
  // Sections are not used in receipts report
};

// Unified download function following DRY principle
const downloadReport = async format => {
  try {
    closeDownloadDropdown();

    if (!validateColumnVisibility('export') || !validateDataAvailability('export')) {
      return;
    }

    const exportFilters = {
      from_date: filters.from_date,
      to_date: filters.to_date,
      payment_method: filters.payment_method,
      school_id: filters.school_id,
      branch_id: filters.branch_id,
      class_id: filters.class_id,
      section: filters.section_id
        ? sections.value.find(sec => sec.id === filters.section_id)?.name
        : undefined,
      search: filters.search
    };

    // Remove undefined values
    Object.keys(exportFilters).forEach(key => {
      if (exportFilters[key] === undefined || exportFilters[key] === '') {
        delete exportFilters[key];
      }
    });

    const selectedColumns = displayedColumns.value.map(col => ({
      key: col.key,
      header: col.label
    }));

    await generateReport({
      report_type: 'receipts',
      format,
      filters: exportFilters,
      columns: selectedColumns
    });
  } catch (error) {
    showToast(`Error downloading ${format.toUpperCase()} report`, 'error');
  }
};

const downloadPDFReport = () => downloadReport('pdf');
const downloadExcelReport = () => downloadReport('excel');
const downloadCSVReport = () => downloadReport('csv');

// Import formatCurrency from exportConfig to avoid duplication
import { formatCurrency } from '~/utils/formatters';

// Import formatDate from formatters to avoid duplication
import { formatDate } from '~/utils/formatters';

// Common function to format payment data for exports
const formatPaymentDataForExport = payment => {
  const formattedPayment = {};

  // Use availableColumns configuration instead of manual checking
  availableColumns.value.forEach(column => {
    if (column.visible) {
      const key = column.key;

      switch (key) {
        case 'invoice_number':
          if (payment.invoice?.invoice_number) {
            formattedPayment[key] = payment.invoice.invoice_number;
          } else if (payment.invoice?.id) {
            formattedPayment[key] = payment.invoice.id;
          } else {
            formattedPayment[key] = 'N/A';
          }
          break;

        case 'receipt_number':
          let receiptText = payment.receipt_number;
          if (payment.month_count > 1) {
            receiptText += ` (${payment.month_count} months)`;
          }
          formattedPayment[key] = receiptText;
          break;

        case 'payment_date':
          formattedPayment[key] = payment.payment_date;
          break;

        case 'student_name':
          if (payment.student && payment.student.name) {
            formattedPayment[key] = payment.student.name;
          } else {
            formattedPayment[key] = 'Student data unavailable';
          }
          break;

        case 'branch':
          formattedPayment[key] = payment.branch || 'N/A';
          break;

        case 'class':
          if (payment.student && payment.student.current_class) {
            formattedPayment[key] = payment.student.current_class;
          } else {
            formattedPayment[key] = 'N/A';
          }
          break;

        case 'section':
          if (payment.student && payment.student.section) {
            formattedPayment[key] = payment.student.section;
          } else {
            formattedPayment[key] = 'N/A';
          }
          break;

        case 'payment_amount':
          formattedPayment[key] = formatCurrency(payment.payment_amount);
          break;

        case 'payment_method':
          formattedPayment[key] = payment.payment_method;
          break;

        case 'fee_type':
          formattedPayment[key] = payment.fee_type || 'N/A';
          break;

        default:
          formattedPayment[key] = payment[key] || 'N/A';
      }
    }
  });

  return formattedPayment;
};

// Reusable function to format all payments data for export
const formatDataForExport = () => {
  return payments.value.map(payment => formatPaymentDataForExport(payment));
};

const getPaymentMethodClass = method => {
  const classes = {
    cash: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    card: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    upi: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    bank_transfer: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    cheque: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  };
  return classes[method] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
};

const getPaymentMethodText = method => {
  const texts = {
    cash: 'Cash',
    card: 'Card',
    upi: 'UPI',
    bank_transfer: 'Bank Transfer',
    cheque: 'Cheque'
  };
  return texts[method] || method;
};

const printReceiptsReport = async () => {
  let printWindow = null;
  try {
    if (!validateColumnVisibility('print')) {
      return;
    }

    printWindow = openPrintWindow();
    if (!printWindow) {
      showToast('Please allow popups to print the report', 'error');
      return;
    }

    const allReceiptsData = await fetchReceiptsData(1, true);

    if (allReceiptsData.length === 0) {
      printWindow.close();
      showToast('No data to print. Please load some receipts first.', 'warning');
      return;
    }

    const formattedData = allReceiptsData.map(payment => formatPaymentDataForExport(payment));

    const reportData = {
      title: 'Receipts Report',
      data: formattedData,
      columns: displayedColumns.value.map(col => ({
        key: col.key,
        header: col.label
      })),
      filters: {
        'Date Range': filters.dateRange,
        'From Date': filters.dateRange === 'all_time' ? 'All Time' : formatDate(filters.from_date),
        'To Date': filters.dateRange === 'all_time' ? 'All Time' : formatDate(filters.to_date),
        'Payment Method': filters.payment_method || 'All Methods',
        Search: filters.search || 'None'
      },
      totalRecords: allReceiptsData.length,
      reportType: 'receipts'
    };

    await printReportCommon(reportData, {
      showHeader: true,
      showSummary: true,
      showFilters: true,
      showFooter: true,
      autoPrint: true,
      printWindow
    });
  } catch (error) {
    printWindow?.close();
    showToast('Error printing report', 'error');
  }
};

// Dropdown control methods
const toggleDownloadDropdown = () => {
  showDownloadDropdown.value = !showDownloadDropdown.value;
};

const closeDownloadDropdown = () => {
  showDownloadDropdown.value = false;
};

const toggleColumnSelector = () => {
  showColumnSelector.value = !showColumnSelector.value;
};

const selectAllColumns = () => {
  availableColumns.value.forEach(col => (col.visible = true));
};

const deselectAllColumns = () => {
  availableColumns.value.forEach(col => (col.visible = false));
};

// Helper function to check if a column is visible
const isColumnVisible = columnKey => {
  const column = availableColumns.value.find(col => col.key === columnKey);
  return column ? column.visible : false;
};

// Common method to validate column visibility for exports
const validateColumnVisibility = (action = 'export') => {
  // Check if any columns are visible
  if (displayedColumns.value.length === 0) {
    showToast(`No columns selected. Please select at least one column to ${action}.`, 'warning');
    return false;
  }
  return true;
};

// Common method to validate data availability for exports
const validateDataAvailability = (action = 'export') => {
  // Check if there's data to export
  if (payments.value.length === 0) {
    showToast(`No data available to ${action}. Please load some receipts first.`, 'warning');
    return false;
  }
  return true;
};

// Function to toggle column visibility
const toggleColumnVisibility = index => {
  availableColumns.value[index].visible = !availableColumns.value[index].visible;
};

// Close dropdown when clicking outside
onMounted(() => {
  document.addEventListener('click', event => {
    const dropdown = document.querySelector('.download-dropdown');
    if (dropdown && !dropdown.contains(event.target)) {
      closeDownloadDropdown();
    }
    const columnSelector = document.querySelector('.column-selector-dropdown');
    if (columnSelector && !columnSelector.contains(event.target)) {
      showColumnSelector.value = false;
    }
  });
});

const getPaymentMethodColor = method => {
  const colors = {
    cash: 'bg-green-500',
    bank: 'bg-blue-500',
    online: 'bg-cyan-500',
    card: 'bg-purple-500',
    cheque: 'bg-yellow-500',
    wallet: 'bg-orange-500',
    bank_transfer: 'bg-indigo-500',
    upi: 'bg-pink-500'
  };
  return colors[method?.toLowerCase()] || 'bg-gray-500';
};

const getMonthsCovered = payment => {
  if (!payment.months || payment.months.length === 0) {
    return `${payment.month_count} months covered`;
  }

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];

  const sortedMonths = payment.months
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    })
    .map(m => `${monthNames[m.month - 1]} ${m.year}`);

  return `Months covered: ${sortedMonths.join(', ')}`;
};

// Initialize
onMounted(async () => {
  handleDateRangeChange(); // Set default date range
  // Load dropdown data based on user role
  if (userRole.value === 'super_admin') {
    await fetchSchools();
  }
  if (selectedBranchId.value) {
    await fetchClasses();
  }

  fetchReceiptsData();
});
</script>
