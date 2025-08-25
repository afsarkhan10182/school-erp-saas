<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div class="mb-4 sm:mb-0">
          <h1 class="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Receipts Report
          </h1>
          <p class="mt-2 text-lg text-gray-600 dark:text-gray-300">Payment collections and receipt tracking</p>
        </div>
        <div class="flex flex-col sm:flex-row gap-3">
          <!-- Column Selector -->
          <div class="relative column-selector-dropdown">
            <button
              @click="toggleColumnSelector"
              class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-200 shadow-sm cursor-pointer"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Columns
              <svg class="ml-1 h-4 w-4 transition-transform duration-200" :class="{ 'rotate-180': showColumnSelector }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            <!-- Column Selector Dropdown -->
            <div 
              v-show="showColumnSelector"
              class="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50"
            >
              <div class="p-2">
                <h3 class="text-xs font-medium text-gray-900 dark:text-white mb-2">Select Columns</h3>
                <div class="space-y-1">
                  <label v-for="(column, index) in availableColumns" :key="column.key" class="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-1 py-1 rounded text-xs">
                    <input
                      type="checkbox"
                      :checked="column.visible"
                      @change="toggleColumnVisibility(index)"
                      class="h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                    />
                    <span class="ml-2 text-gray-700 dark:text-gray-300 cursor-pointer select-none">{{ column.label }}</span>
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
            @click="printReport"
            :disabled="isLoading || payments.length === 0"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Report
          </button>
          
          <!-- Download As Dropdown -->
          <div class="relative download-dropdown">
            <button
              @click="toggleDownloadDropdown"
              :disabled="isLoading || payments.length === 0"
              class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download As
              <svg class="ml-2 h-4 w-4 transition-transform duration-200" :class="{ 'rotate-180': showDownloadDropdown }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            <!-- Dropdown Menu -->
            <div 
              v-show="showDownloadDropdown"
              class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 transition-all duration-200 ease-in-out"
              style="transform-origin: top right;"
            >
              <div class="py-1">
                <button
                  @click="downloadPDFReport"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 flex items-center"
                >
                  <svg class="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  PDF
                </button>
                <button
                  @click="downloadDetailedReport"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 flex items-center"
                >
                  <svg class="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Excel
                </button>
                <button
                  @click="downloadCSVReport"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 flex items-center"
                >
                  <svg class="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 012-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 mb-8 p-6">
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
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range *</label>
            <div class="relative group">
              <select v-model="filters.dateRange" @change="handleDateRangeChange" class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 group-hover:border-indigo-400 dark:group-hover:border-indigo-500" style="-webkit-appearance: none !important; -moz-appearance: none !important; appearance: none !important;">
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg class="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Payment Method -->
          <div class="flex-1 min-w-[150px]">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
            <div class="relative group">
              <select v-model="filters.payment_method" class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 group-hover:border-indigo-400 dark:group-hover:border-indigo-500" style="-webkit-appearance: none !important; -moz-appearance: none !important; appearance: none !important;">
                <option value="">All Methods</option>
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
                <option value="online">Online</option>
                <option value="card">Card</option>
                <option value="cheque">Cheque</option>
                <option value="wallet">Wallet</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg class="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <!-- School dropdown for super admin -->
          <div v-if="userRole === 'super_admin'" class="flex-1 min-w-[150px]">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">School</label>
            <div class="relative group">
              <select v-model="filters.school_id" @change="onSchoolChange" class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 group-hover:border-indigo-400 dark:group-hover:border-indigo-500" style="-webkit-appearance: none !important; -moz-appearance: none !important; appearance: none !important;">
                <option value="">All Schools</option>
                <option v-for="school in schools" :key="school.id" :value="school.id">{{ school.name }}</option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg class="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Branch dropdown for super admin (when school selected) and school admin -->
          <div v-if="(userRole === 'super_admin' && filters.school_id) || userRole === 'school_admin'" class="flex-1 min-w-[150px]">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch</label>
            <div class="relative group">
              <select v-model="filters.branch_id" @change="onBranchChange" class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 group-hover:border-indigo-400 dark:group-hover:border-indigo-500" style="-webkit-appearance: none !important; -moz-appearance: none !important; appearance: none !important;">
                <option value="">All Branches</option>
                <option v-for="branch in branches" :key="branch.id" :value="branch.id">{{ branch.name }}</option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg class="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Student Search -->
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Student Search</label>
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
              <svg class="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <!-- Right clear button (only when search has text) -->
              <button 
                v-if="filters.search"
                @click="clearSearch"
                class="absolute right-2 top-2 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
                title="Clear search"
                aria-label="Clear search"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Class dropdown - show when branch is selected -->
          <div v-if="filters.branch_id" class="flex-1 min-w-[150px]">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Class</label>
            <div class="relative group">
              <select v-model="filters.class_id" @change="onClassChange" class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 group-hover:border-indigo-400 dark:group-hover:border-indigo-500" style="-webkit-appearance: none !important; -moz-appearance: none !important; appearance: none !important;">
                <option value="">All Classes</option>
                <option v-for="classItem in classes" :key="classItem.id" :value="classItem.id">{{ classItem.name }}</option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg class="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Apply Filter Button -->
          <div class="flex-shrink-0">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">&nbsp;</label>
            <button 
              @click="() => fetchReceiptsData(1)"
              :disabled="isLoading"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            >
              <svg v-if="isLoading" class="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span v-if="isLoading">Loading...</span>
              <span v-else>Apply Filters</span>
            </button>
          </div>
        </div>

        <!-- Custom Date Range -->
        <div v-if="filters.dateRange === 'custom'" class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">From Date</label>
            <input 
              v-model="filters.from_date" 
              type="date"
              class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To Date</label>
            <input 
              v-model="filters.to_date" 
              type="date"
              class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 mb-8 p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-700">
            <div class="text-3xl font-bold text-green-600 dark:text-green-400">
              ₹{{ formatCurrency(summary.total_collected) }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-300 font-medium">Total Collected</div>
          </div>
          <div class="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <div class="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {{ summary.total_receipts }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-300 font-medium">Total Receipts</div>
          </div>
        </div>
      </div>

      <!-- Receipts Table -->
      <div class="bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Receipts ({{ pagination.total_records }} total)
          </h3>
        </div>
        
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th v-if="isColumnVisible('invoice_number')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Invoice No</th>
                <th v-if="isColumnVisible('receipt_number')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Receipt No</th>
                <th v-if="isColumnVisible('payment_date')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th v-if="isColumnVisible('student_name')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student</th>
                <th v-if="isColumnVisible('branch')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Branch</th>
                <th v-if="isColumnVisible('class')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Class</th>
                <th v-if="isColumnVisible('section')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Section</th>
                <th v-if="isColumnVisible('payment_amount')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                <th v-if="isColumnVisible('payment_method')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Method</th>
                <th v-if="isColumnVisible('fee_type')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fee Type</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
              <tr v-if="isLoading">
                <td :colspan="displayedColumns.length" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  Loading receipts...
                </td>
              </tr>
              <tr v-else-if="payments.length === 0">
                <td :colspan="displayedColumns.length" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  No receipts found for the selected filters
                </td>
              </tr>
              <tr v-else v-for="payment in payments" :key="payment.id" class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                <!-- Invoice Number -->
                <td v-if="isColumnVisible('invoice_number')" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <div class="flex flex-col">
                    <span v-if="payment.invoice?.invoice_number" class="font-medium text-blue-600 dark:text-blue-400">
                      {{ payment.invoice.invoice_number }}
                    </span>
                    <span v-else-if="payment.invoice?.id" class="font-medium text-blue-600 dark:text-blue-400">
                      {{ payment.invoice.id }}
                    </span>
                    <span v-else class="text-gray-500 dark:text-gray-400 italic">
                      N/A
                    </span>
                  </div>
                </td>
                
                <!-- Receipt Number -->
                <td v-if="isColumnVisible('receipt_number')" class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  <div class="flex items-center">
                    <span>{{ payment.receipt_number }}</span>
                    <span v-if="payment.month_count > 1" class="ml-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white dark:bg-blue-500 dark:text-white" :title="getMonthsCovered(payment)">
                      {{ payment.month_count }} months
                    </span>
                  </div>
                </td>
                
                <!-- Date -->
                <td v-if="isColumnVisible('payment_date')" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ formatDate(payment.payment_date) }}
                </td>
                
                <!-- Student Name -->
                <td v-if="isColumnVisible('student_name')" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <div v-if="payment.student && payment.student.name">
                    <div class="font-medium">{{ payment.student.name }}</div>
                  </div>
                  <div v-else class="text-gray-500 dark:text-gray-400 italic">
                    Student data unavailable
                  </div>
                </td>
                
                <!-- Branch -->
                <td v-if="isColumnVisible('branch')" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <span v-if="payment.branch" class="font-medium text-gray-900 dark:text-white">
                    {{ payment.branch }}
                  </span>
                  <span v-else class="text-gray-500 dark:text-gray-400 italic">
                    N/A
                  </span>
                </td>
                
                <!-- Class -->
                <td v-if="isColumnVisible('class')" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <span v-if="payment.student && payment.student.current_class">
                    {{ payment.student.current_class }}
                  </span>
                  <span v-else class="text-gray-500 dark:text-gray-400 italic">
                    N/A
                  </span>
                </td>
                
                <!-- Section -->
                <td v-if="isColumnVisible('section')" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <span v-if="payment.student && payment.student.section">
                    {{ payment.student.section }}
                  </span>
                  <span v-else class="text-gray-500 dark:text-gray-400 italic">
                    N/A
                  </span>
                </td>
                
                <!-- Amount -->
                <td v-if="isColumnVisible('payment_amount')" class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                  ₹{{ formatCurrency(payment.payment_amount) }}
                </td>
                
                <!-- Payment Method -->
                <td v-if="isColumnVisible('payment_method')" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full" :class="getPaymentMethodClass(payment.payment_method)">
                    {{ payment.payment_method }}
                  </span>
                </td>
                
                <!-- Fee Type -->
                <td v-if="isColumnVisible('fee_type')" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
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
import { ref, reactive, onMounted, computed } from 'vue';
import { apiClient } from '~/utils/api';
import { useToast } from '~/composables/useToast';
import { useAcademics } from '~/composables/useAcademics';
import { useBranchContext } from '~/composables/useBranchContext';
import { useAuthStore } from '~/stores/auth';
import Pagination from '~/components/Pagination.vue';

// Page metadata
definePageMeta({
  layout: 'default'
});

// Composables
const { showToast } = useToast();
const authStore = useAuthStore();

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


// Dropdown data
const schools = ref([]);
const branches = ref([]);
const classes = ref([]);
const sections = ref([]);

// Available columns for selection
const availableColumns = ref([
  { key: 'invoice_number', label: 'Invoice No', visible: false }, // Hidden by default as per user's image
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
const userRole = computed(() => authStore.currentUser?.role || 'branch_admin');

// Filters
const filters = reactive({
  dateRange: 'today',
  from_date: '',
  to_date: '',
  payment_method: '',
  school_id: '',
  branch_id: '',
  class_id: '',
  section_id: '',
  search: ''
});

// Methods
const handleDateRangeChange = () => {
  const today = new Date();
  
  const formatDate = (date) => {
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

const fetchReceiptsData = async (page = 1) => {
  isLoading.value = true;
  try {
    const params = {
      page,
      limit: pagination.value.per_page
    };

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

    const response = await apiClient.feeInvoices.getReceiptsReport(params);
    
    if (response.success) {
      payments.value = response.data.payments || [];
      summary.value = response.data.summary || {
        total_collected: 0,
        total_receipts: 0,
        payment_methods: []
      };
      
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
    } else {
      showToast('Error fetching receipts data', 'error');
    }
  } catch (error) {
    console.error('Error fetching receipts:', error);
    showToast('Error fetching receipts data', 'error');
  } finally {
    isLoading.value = false;
  }
};

// Function to fetch ALL records for export/print (without pagination)
const fetchAllReceiptsForExport = async () => {
  try {
    const params = {
      // Don't send page and limit - backend should return all records
      export_all: true
    };

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

    const response = await apiClient.feeInvoices.getReceiptsReport(params);
    
    if (response.success) {
      const allPayments = response.data.payments || [];
      const exportSummary = response.data.summary || {
        total_collected: 0,
        total_receipts: 0,
        payment_methods: []
      };
      
      return { payments: allPayments, summary: exportSummary };
    } else {
      throw new Error('Failed to fetch all receipts data');
    }
  } catch (error) {
    console.error('Error fetching all receipts for export:', error);
    throw error;
  }
};

const changePage = (page) => {
  if (page >= 1 && page <= pagination.value.total_pages) {
    pagination.value.current_page = page;
    pagination.value.page = page;
    fetchReceiptsData(page);
  }
};

const handlePageSizeChange = (newPageSize) => {
  pagination.value.per_page = newPageSize;
  pagination.value.limit = newPageSize; // Also update limit for Pagination component
  fetchReceiptsData(1);
};

const clearFilters = () => {
  filters.dateRange = 'today';
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
  await fetchBranches();
  
  // Refetch dependent data
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

// Dropdown data loading methods
const fetchSchools = async () => {
  if (userRole.value === 'super_admin') {
    try {
      const response = await apiClient.schools.getAll();
      if (response.success) {
        schools.value = response.data.schools || [];
      }
    } catch (error) {
      console.error('Error loading schools:', error);
      showToast('Error loading schools', 'error');
      schools.value = [];
    }
  }
};

const fetchBranches = async () => {
  try {
    const response = await apiClient.branches.getAll();
    console.log('🌿 Branches API response:', response);
    
    // Handle different response structures
    let allBranches = [];
    if (response.success) {
      allBranches = response.data.branches || [];
    } else if (response.data?.items) {
      allBranches = response.data.items;
    } else if (response.data?.branches) {
      allBranches = response.data.branches;
    } else if (Array.isArray(response.data)) {
      allBranches = response.data;
    }
    
    console.log('🌿 All branches before filtering:', allBranches.length, allBranches);
    
    // Apply role-based filtering
    const user = authStore.user;
    console.log('👤 Current user:', user);
    
    if (user && user.role) {
      console.log('🔒 Applying role-based filtering for role:', user.role);
      
      if (user.role === 'super_admin') {
        console.log('👑 Super admin user, filtering branches');
        // Super admin can see all branches, but filter by selected school if specified
        if (filters.school_id) {
          console.log('🏫 Filtering branches by selected school:', filters.school_id);
          branches.value = allBranches.filter(branch => branch.school_id === filters.school_id);
        } else {
          console.log('🏫 No school selected, showing no branches');
          branches.value = [];
        }
      } else if (user.role === 'school_admin') {
        console.log('🏫 School admin user, filtering by school_id:', user.school_id);
        // School admin can see all branches in their school
        branches.value = allBranches.filter(branch => branch.school_id === user.school_id);
      } else if (user.role === 'branch_admin') {
        console.log('🏢 Branch admin user, filtering by branch_id:', user.branch_id);
        // Branch admin can only see their own branch
        branches.value = allBranches.filter(branch => branch.id === user.branch_id);
      } else {
        console.log('⚠️ Unknown user role, showing no branches');
        branches.value = [];
      }
    } else {
      console.log('⚠️ No user or role information, showing no branches');
      branches.value = [];
    }
    
    console.log('🌿 Final branches loaded:', branches.value.length, 'items:', branches.value);
  } catch (error) {
    console.error('❌ Error fetching branches:', error);
    showToast('Error fetching branches', 'error');
    branches.value = [];
  }
};

const fetchClasses = async () => {
  try {
    const params = {};
    if (filters.school_id) {
      params.school_id = filters.school_id;
    }
    if (filters.branch_id) {
      params.branch_id = filters.branch_id;
    }
    const response = await apiClient.classes.getAll(params);
    console.log('Classes response:', response);
    
    // Handle different response structures
    if (response.success) {
      classes.value = response.data || [];
    } else if (response.data?.items) {
      classes.value = response.data.items;
    } else if (response.data?.classes) {
      classes.value = response.data.classes;
    } else if (Array.isArray(response.data)) {
      classes.value = response.data;
    } else {
      classes.value = [];
    }
    
    console.log('📚 Classes loaded:', classes.value.length, 'items:', classes.value);
  } catch (error) {
    console.error('Error fetching classes:', error);
    showToast('Error fetching classes', 'error');
    classes.value = [];
  }
};



// Export methods following fees report pattern
const downloadPDFReport = async () => {
  try {
    // Close dropdown first
    closeDownloadDropdown();
    
    // Generate PDF content
    const pdfContent = generatePDFContent();
    
    // Create a new window with the PDF content
    const printWindow = window.open('', '_blank');
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print
    printWindow.onload = () => {
      // Use browser's print to PDF functionality
      printWindow.print();
      
      // Close the window after printing
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    };
    
    showToast('PDF report opened for printing/download', 'success');
  } catch (error) {
    console.error('Error generating PDF report:', error);
    showToast('Error generating PDF report', 'error');
  }
};

const downloadDetailedReport = async () => {
  try {
    closeDownloadDropdown();
    
    // Fetch all records for Excel export
    const { payments: allPayments, summary: excelSummary } = await fetchAllReceiptsForExport();
    
    if (allPayments.length === 0) {
      showToast('No data found for the selected filters', 'warning');
      return;
    }
    
    // Build query string from filters
    const queryParams = new URLSearchParams();
    
    // Add filters
    if (filters.from_date) queryParams.append('from_date', filters.from_date);
    if (filters.to_date) queryParams.append('to_date', filters.to_date);
    if (filters.payment_method) queryParams.append('payment_method', filters.payment_method);
    if (filters.school_id) queryParams.append('school_id', filters.school_id);
    if (filters.branch_id) queryParams.append('branch_id', filters.branch_id);
    if (filters.class_id) queryParams.append('class_id', filters.class_id);
    if (filters.search) queryParams.append('search', filters.search);
    
    // Add selected columns for export
    const selectedColumns = displayedColumns.value.map(col => col.key).join(',');
    queryParams.append('columns', selectedColumns);
    
    // Add format parameter for Excel
    queryParams.append('format', 'excel');
    queryParams.append('report_type', 'receipts');
    
    const response = await apiClient.feeInvoices.exportReport(queryParams.toString());
    
    if (!response || !response.data) {
      throw new Error('No data received from server');
    }
    
    if (response.status !== 200) {
      throw new Error(`Server returned status ${response.status}: ${response.statusText}`);
    }
    
    // Create and download Excel file
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipts-report-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    showToast('Receipts report downloaded successfully', 'success');
  } catch (error) {
    console.error('Error downloading Excel report:', error);
    showToast('Error downloading receipts report', 'error');
  }
};

const downloadCSVReport = async () => {
  try {
    closeDownloadDropdown();
    
    // Fetch all records for CSV export
    const { payments: allPayments, summary: csvSummary } = await fetchAllReceiptsForExport();
    
    if (allPayments.length === 0) {
      showToast('No data found for the selected filters', 'warning');
      return;
    }
    
    // Try backend export first, fallback to frontend generation
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      
      // Add filters
      if (filters.from_date) queryParams.append('from_date', filters.from_date);
      if (filters.to_date) queryParams.append('to_date', filters.to_date);
      if (filters.payment_method) queryParams.append('payment_method', filters.payment_method);
      if (filters.school_id) queryParams.append('school_id', filters.school_id);
      if (filters.branch_id) queryParams.append('branch_id', filters.branch_id);
      if (filters.class_id) queryParams.append('class_id', filters.class_id);
      if (filters.search) queryParams.append('search', filters.search);
      
      // Add selected columns for export
      const selectedColumns = displayedColumns.value.map(col => col.key).join(',');
      queryParams.append('columns', selectedColumns);
      
      // Add format parameter for CSV
      queryParams.append('format', 'csv');
      queryParams.append('report_type', 'receipts');
      
      const response = await apiClient.feeInvoices.exportReport(queryParams.toString());
      
      if (response && response.data && response.status === 200) {
        // Create and download CSV file from backend
        const blob = new Blob([response.data], { 
          type: 'text/csv;charset=utf-8;' 
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `receipts-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        showToast('Receipts report downloaded successfully', 'success');
        return;
      }
    } catch (backendError) {
      console.warn('Backend CSV export failed, using frontend generation:', backendError);
    }
    
    // Fallback to frontend CSV generation
    const csvContent = generateCSV(allPayments, csvSummary);
    const blob = new Blob([csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipts-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    showToast('Receipts report downloaded successfully', 'success');
  } catch (error) {
    console.error('Error downloading CSV report:', error);
    showToast('Error downloading receipts report', 'error');
  }
};

// Utility functions (similar to fees report)
const formatCurrency = (amount) => {
  return parseFloat(amount || 0).toLocaleString('en-IN');
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN');
};

const getPaymentMethodClass = (method) => {
  const classes = {
    cash: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    card: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    upi: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    bank_transfer: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    cheque: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  };
  return classes[method] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
};

const getPaymentMethodText = (method) => {
  const texts = {
    cash: 'Cash',
    card: 'Card',
    upi: 'UPI',
    bank_transfer: 'Bank Transfer',
    cheque: 'Cheque',
  };
  return texts[method] || method;
};

// Generate PDF content (similar to fees report)
const generatePDFContent = (paymentsData = payments.value, summaryData = summary.value) => {
  // Get current filter values for the report header
  const getFilterText = () => {
    const filterTexts = [];
    
    // Date range
    if (filters.dateRange && filters.dateRange !== 'all_time') {
      if (filters.dateRange === 'custom' && filters.from_date && filters.to_date) {
        filterTexts.push(`Date Range: ${formatDate(filters.from_date)} to ${formatDate(filters.to_date)}`);
      } else {
        filterTexts.push(`Date Range: ${filters.dateRange.replace('_', ' ').toUpperCase()}`);
      }
    }
    
    // School (for super admin)
    if (filters.school_id && authStore.user?.role === 'super_admin') {
      const school = schools.value.find(s => s.id === filters.school_id);
      if (school) filterTexts.push(`School: ${school.name}`);
    }
    
    // Branch
    if (filters.branch_id) {
      const branch = branches.value.find(b => b.id === filters.branch_id);
      if (branch) filterTexts.push(`Branch: ${branch.name}`);
    }
    
    // Class
    if (filters.class_id) {
      const classItem = classes.value.find(c => c.id === filters.class_id);
      if (classItem) filterTexts.push(`Class: ${classItem.name}`);
    }
    
    // Payment method
    if (filters.payment_method && filters.payment_method !== 'all') {
      filterTexts.push(`Payment Method: ${filters.payment_method.toUpperCase()}`);
    }
    
    // Student search
    if (filters.search) {
      filterTexts.push(`Student Search: ${filters.search}`);
    }
    
    return filterTexts.length > 0 ? filterTexts.join(' | ') : 'All Records';
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipts Report</title>
      <style>
        @page {
          size: A4;
          margin: 1cm;
        }
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
          line-height: 1.4;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        .school-name {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .report-title {
          font-size: 24px;
          margin-bottom: 8px;
        }
        .report-date {
          font-size: 16px;
          color: #666;
        }
        .filters {
          margin-bottom: 25px;
          padding: 15px;
          background-color: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          font-size: 14px;
        }
        .summary-cards {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          gap: 15px;
        }
        .summary-card {
          flex: 1;
          padding: 20px;
          border: 2px solid #dee2e6;
          border-radius: 8px;
          text-align: center;
          background-color: #fff;
        }
        .summary-value {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .summary-label {
          font-size: 14px;
          color: #666;
          font-weight: 500;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 25px;
          font-size: 12px;
        }
        th, td {
          border: 1px solid #dee2e6;
          padding: 10px 8px;
          text-align: left;
        }
        th {
          background-color: #f8f9fa;
          font-weight: bold;
          color: #495057;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #dee2e6;
          padding-top: 15px;
        }
        @media print {
          body { margin: 0; padding: 15px; }
          .no-print { display: none; }
          .summary-cards { page-break-inside: avoid; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="school-name">School ERP System</div>
        <div class="report-title">Receipts Report</div>
        <div class="report-date">Generated on: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}</div>
      </div>
      
      <div class="filters">
        <strong>Applied Filters:</strong> ${getFilterText()}
      </div>
      
      <div class="summary-cards">
        <div class="summary-card">
          <div class="summary-value">₹${formatCurrency(summaryData.total_collected)}</div>
          <div class="summary-label">Total Collected</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${summaryData.total_receipts}</div>
          <div class="summary-label">Total Receipts</div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            ${displayedColumns.value.map(col => `<th>${col.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${paymentsData.map(payment => `
            <tr>
                             ${displayedColumns.value.map(col => {
                 switch(col.key) {
                   case 'invoice_number':
                     return `<td>${payment.invoice?.invoice_number || payment.invoice?.id || 'N/A'}</td>`;
                   case 'receipt_number':
                     return `<td>${payment.receipt_number || payment.id}</td>`;
                   case 'payment_date':
                     return `<td>${formatDate(payment.payment_date)}</td>`;
                   case 'student_name':
                     return `<td>${payment.student?.name || 'N/A'}</td>`;
                   case 'branch':
                     return `<td>${payment.branch || 'N/A'}</td>`;
                   case 'class':
                     return `<td>${payment.student?.current_class || 'N/A'}</td>`;
                   case 'section':
                     return `<td>${payment.student?.section || 'N/A'}</td>`;
                   case 'payment_amount':
                     return `<td>₹${formatCurrency(payment.payment_amount)}</td>`;
                   case 'payment_method':
                     return `<td>${getPaymentMethodText(payment.payment_method)}</td>`;
                   case 'fee_type':
                     return `<td>${payment.fee_type || 'N/A'}</td>`;
                   default:
                     return `<td>N/A</td>`;
                 }
               }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        Total Records: ${paymentsData.length} | Generated on: ${new Date().toLocaleString('en-IN')}
      </div>
    </body>
    </html>
  `;
};

const printReport = async () => {
  try {
    // Fetch all records for printing
    const { payments: allPayments, summary: printSummary } = await fetchAllReceiptsForExport();
    
    // Check if we have data to print
    if (allPayments.length === 0) {
      showToast('No data found for the selected filters', 'warning');
      return;
    }
    
    // Generate PDF content with all records
    const printContent = generatePDFContent(allPayments, printSummary);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Please allow popups to print the report', 'error');
      return;
    }
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 1000);
    
    showToast('Print report generated successfully', 'success');
  } catch (error) {
    console.error('Error printing report:', error);
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
  availableColumns.value.forEach(col => col.visible = true);
};

const deselectAllColumns = () => {
  availableColumns.value.forEach(col => col.visible = false);
};

// Helper function to check if a column is visible
const isColumnVisible = (columnKey) => {
  const column = availableColumns.value.find(col => col.key === columnKey);
  return column ? column.visible : false;
};

// Function to toggle column visibility
const toggleColumnVisibility = (index) => {
  availableColumns.value[index].visible = !availableColumns.value[index].visible;
};

// Close dropdown when clicking outside
onMounted(() => {
  document.addEventListener('click', (event) => {
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

const generateCSV = (paymentsData = payments.value, summaryData = summary.value) => {
  // Generate summary section
  const totalCollected = summaryData.total_collected || paymentsData.reduce((sum, payment) => sum + parseFloat(payment.payment_amount || 0), 0);
  const totalReceipts = summaryData.total_receipts || paymentsData.length;

  // Create summary rows
  const summaryRows = [
    ['Receipts Report Summary'],
    [''],
    ['Report Information'],
    ['Generated on', new Date().toLocaleDateString('en-IN') + ' at ' + new Date().toLocaleTimeString('en-IN')],
    [''],
    ['Summary Totals'],
    ['Total Receipts', totalReceipts.toString()],
    ['Total Collected', `₹${totalCollected.toFixed(2)}`],
    [''],
    ['Applied Filters']
  ];
  
  // Add filter information
  if (filters.dateRange && filters.dateRange !== 'all_time') {
    if (filters.dateRange === 'custom' && filters.from_date && filters.to_date) {
      summaryRows.push(['Date Range', `${formatDate(filters.from_date)} to ${formatDate(filters.to_date)}`]);
    } else {
      summaryRows.push(['Date Range', filters.dateRange.replace('_', ' ').toUpperCase()]);
    }
  }
  
  if (filters.school_id && authStore.user?.role === 'super_admin') {
    const school = schools.value.find(s => s.id === filters.school_id);
    if (school) summaryRows.push(['School', school.name]);
  }
  
  if (filters.branch_id) {
    const branch = branches.value.find(b => b.id === filters.branch_id);
    if (branch) summaryRows.push(['Branch', branch.name]);
  }
  
  if (filters.class_id) {
    const classItem = classes.value.find(c => c.id === filters.class_id);
    if (classItem) summaryRows.push(['Class', classItem.name]);
  }
  
  if (filters.payment_method && filters.payment_method !== 'all') {
    summaryRows.push(['Payment Method', filters.payment_method.toUpperCase()]);
  }
  
  if (filters.search) {
    summaryRows.push(['Student Search', filters.search]);
  }

  summaryRows.push(['']);
  summaryRows.push(['Detailed Receipts Data']);
  summaryRows.push(['']);

  // Data headers - only include visible columns
  const headers = displayedColumns.value.map(col => col.label);
  
  // Data rows - only include visible columns
  const dataRows = paymentsData.map(payment => 
    displayedColumns.value.map(col => {
      switch(col.key) {
        case 'invoice_number':
          return payment.invoice?.invoice_number || payment.invoice?.id || 'N/A';
        case 'receipt_number':
          return payment.receipt_number || payment.id || 'N/A';
        case 'payment_date':
          return formatDate(payment.payment_date) || 'N/A';
        case 'student_name':
          return payment.student?.name || 'N/A';
        case 'branch':
          return payment.branch || 'N/A';
        case 'class':
          return payment.student?.current_class || 'N/A';
        case 'section':
          return payment.student?.section || 'N/A';
        case 'payment_amount':
          return formatCurrency(payment.payment_amount) || '₹0';
        case 'payment_method':
          return getPaymentMethodText(payment.payment_method) || 'N/A';
        case 'fee_type':
          return payment.fee_type || 'N/A';
        default:
          return 'N/A';
      }
    })
  );
  
  // Combine summary and data
  const allRows = [...summaryRows, headers, ...dataRows];
  
  return allRows.map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n');
};



const getPaymentMethodColor = (method) => {
  const colors = {
    'cash': 'bg-green-500',
    'bank': 'bg-blue-500',
    'online': 'bg-cyan-500',
    'card': 'bg-purple-500',
    'cheque': 'bg-yellow-500',
    'wallet': 'bg-orange-500',
    'bank_transfer': 'bg-indigo-500',
    'upi': 'bg-pink-500'
  };
  return colors[method?.toLowerCase()] || 'bg-gray-500';
};

const getMonthsCovered = (payment) => {
  if (!payment.months || payment.months.length === 0) {
    return `${payment.month_count} months covered`;
  }
  
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
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
  
  await fetchBranches();
  
  // For branch admins, set their branch and load classes
  if (userRole.value === 'branch_admin' && branches.value.length > 0) {
    filters.branch_id = branches.value[0].id;
    await fetchClasses();
  }
  
  fetchReceiptsData();
});
</script>
