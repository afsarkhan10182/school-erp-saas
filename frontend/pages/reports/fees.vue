<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
    <!-- Loading overlay for initial page load -->
    <div v-if="isInitializing" class="fixed inset-0 bg-white dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 flex items-center justify-center z-50">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p class="text-gray-600 dark:text-gray-300">Loading report data...</p>
      </div>
    </div>
    
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div class="mb-4 sm:mb-0">
          <h1 class="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Fee Management Reports
          </h1>
          <p class="mt-2 text-lg text-gray-600 dark:text-gray-300">Invoice tracking, outstanding balances, and fee analytics</p>
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
            @click="printFeesReport"
            :disabled="isLoading || invoices.length === 0"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Report
          </button>
          
          <!-- Download Dropdown -->
          <div class="relative download-dropdown">
            <button
              @click="toggleDownloadDropdown"
              :disabled="isLoading || invoices.length === 0"
              class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download
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
                  @click="downloadExcelReport"
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
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 mb-8">
        <div class="px-6 py-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Report Filters</h3>
            <button
              @click="resetFilters"
              :disabled="isLoading"
              class="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium disabled:opacity-50"
            >
              Reset Filters
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
              <div class="relative group">
                <select v-model="filters.dateRange" @change="handleDateRangeChange" :disabled="isLoading" class="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group-hover:border-indigo-400 dark:group-hover:border-indigo-500" style="-webkit-appearance: none !important; -moz-appearance: none !important; appearance: none !important;">
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">This Week</option>
                  <option value="last_week">Last Week</option>
                  <option value="month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                  <option value="custom">Custom Range</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div v-if="filters.dateRange === 'custom'">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">From Date</label>
              <input v-model="filters.fromDate" type="date" :disabled="isLoading" class="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" />
            </div>
            <div v-if="filters.dateRange === 'custom'">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To Date</label>
              <input v-model="filters.toDate" type="date" :disabled="isLoading" class="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" />
            </div>
            <!-- School dropdown for super admin -->
            <div v-if="authStore.user?.role === 'super_admin'">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">School</label>
              <div class="relative group">
                <select v-model="filters.school_id" @change="onSchoolChange" :disabled="isLoading" class="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group-hover:border-indigo-400 dark:group-hover:border-indigo-500" style="-webkit-appearance: none !important; -moz-appearance: none !important; appearance: none !important;">
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
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch</label>
              <div class="relative group">
                <select v-model="filters.branch_id" @change="onBranchChange" :disabled="isLoading" class="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group-hover:border-indigo-400 dark:group-hover:border-indigo-500" style="-webkit-appearance: none !important; -moz-appearance: none !important; appearance: none !important;">
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
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Class</label>
              <div class="relative group">
                <select v-model="filters.class_id" @change="onClassChange" :disabled="isLoading" class="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group-hover:border-indigo-400 dark:group-hover:border-indigo-500" style="-webkit-appearance: none !important; -moz-appearance: none !important; appearance: none !important;">
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
            <div v-if="showSectionDropdown">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Section</label>
              <div class="relative group">
                <select v-model="filters.section_id" :disabled="isLoading || !filters.class_id" class="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group-hover:border-indigo-400 dark:group-hover:border-indigo-500" style="-webkit-appearance: none !important; -moz-appearance: none !important; appearance: none !important;">
                  <option value="">All Sections</option>
                  <option v-for="section in sections" :key="section.id" :value="section.id">{{ section.name }}</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg class="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div v-if="showStreamDropdown">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Stream</label>
              <div class="relative group">
                <select v-model="filters.stream_id" @change="onStreamChange" :disabled="isLoading || !filters.class_id" class="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group-hover:border-indigo-400 dark:group-hover:border-indigo-500" style="-webkit-appearance: none !important; -moz-appearance: none !important; appearance: none !important;">
                  <option value="">All Streams</option>
                  <option v-for="stream in streams" :key="stream.id" :value="stream.id">{{ stream.name }}</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Status</label>
              <div class="relative group">
                <select v-model="filters.status" :disabled="isLoading" class="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group-hover:border-indigo-400 dark:group-hover:border-indigo-500" style="-webkit-appearance: none !important; -moz-appearance: none !important; appearance: none !important;">
                  <option value="">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="partial_paid">Partial Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="overdue">Overdue</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Collection Method</label>
              <div class="relative group">
                <select v-model="filters.payment_method" :disabled="isLoading" class="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group-hover:border-indigo-400 dark:group-hover:border-indigo-500" style="-webkit-appearance: none !important; -moz-appearance: none !important; appearance: none !important;">
                  <option value="">All Methods</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="online">Online</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Student Search</label>
              <div class="relative group">
                <input 
                  v-model="filters.student_search" 
                  type="text" 
                  placeholder="Search" 
                  :disabled="isLoading" 
                  class="w-full px-4 py-2.5 pr-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group-hover:border-indigo-400 dark:group-hover:border-indigo-500" 
                />
                <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                  <!-- Clear button only -->
                  <button
                    v-if="filters.student_search"
                    @click="filters.student_search = ''"
                    type="button"
                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Enter student name or admission number or roll number
              </p>
            </div>
            <div class="flex items-center">
              <button
                @click="fetchReportData"
                :disabled="isLoading"
                class="w-full inline-flex justify-center items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Search class="-ml-1 mr-2 h-4 w-4" />
                {{ isLoading ? 'Loading Report...' : 'Apply Filters' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Report Summary -->
      <div class="bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 mb-8 p-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="text-center">
            <div class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ summaryData.totalInvoices > 0 ? `₹${formatCurrency(summary.totalAmount)}` : '₹0' }}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">Total Amount</div>
            <div v-if="summaryData.totalInvoices > 0" class="text-xs text-gray-400 mt-1">{{ summaryData.totalInvoices }} invoices</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600 dark:text-green-400">
              {{ summaryData.totalInvoices > 0 ? `₹${formatCurrency(summary.totalCollected)}` : '₹0' }}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">Total Collected</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-red-600 dark:text-red-400">
              {{ summaryData.totalInvoices > 0 ? `₹${formatCurrency(summary.totalPending)}` : '₹0' }}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">Total Pending</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {{ summaryData.totalInvoices > 0 ? `${summary.collectionRate}%` : '0%' }}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">Collection Rate</div>
          </div>
        </div>
        <!-- Show message when no data -->
        <div v-if="summaryData.totalInvoices === 0 && !isLoading" class="text-center mt-4">
          <p class="text-gray-500 dark:text-gray-400">Select filters and click "Apply Filters" to view report data</p>
        </div>
      </div>

      <!-- Detailed Report Table -->
      <div class="bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="px-6 py-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                      <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Detailed Fee Management Report</h3>
          <div class="flex space-x-3">
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ groupedInvoices.length > 0 ? `${invoices.length} invoices` : 'No records' }}
            </span>
          </div>
        </div>
        
        <!-- Loading state for table -->
        <div v-if="isLoading" class="flex items-center justify-center py-12">
          <div class="text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p class="text-gray-600 dark:text-gray-300">Loading report data...</p>
          </div>
        </div>
        
        <!-- Empty state -->
        <div v-else-if="invoices.length === 0 && !isLoading" class="flex items-center justify-center py-12">
          <div class="text-center">
            <div class="text-gray-400 dark:text-gray-500 mb-4">
              <Search class="h-12 w-12 mx-auto" />
            </div>
            <p class="text-gray-600 dark:text-gray-300">No invoices found for the selected filters</p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Try adjusting your filters or date range</p>
            <p class="text-xs text-gray-400 mt-1">Click "Apply Filters" to search with current settings</p>
          </div>
        </div>
        
        <!-- Accordion Grouped Results -->
        <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
          <div v-for="studentGroup in paginatedGroupedInvoices" :key="studentGroup.studentId" class="accordion-group">
            <!-- Student Header (Clickable) -->
            <div 
              @click="toggleStudent(studentGroup.studentId)"
              class="px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center justify-between"
              :class="{ 'bg-indigo-50 dark:bg-indigo-900/20': expandedStudents.includes(studentGroup.studentId) }"
            >
              <div class="flex items-center space-x-4">
                <!-- Chevron Icon -->
                <svg 
                  class="w-5 h-5 text-gray-400 transition-transform duration-200"
                  :class="{ 'rotate-90': expandedStudents.includes(studentGroup.studentId) }"
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
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ studentGroup.studentName }}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    Roll No: {{ studentGroup.rollNumber }} • Admission: {{ studentGroup.admissionNumber }} • {{ studentGroup.className }}
                  </div>
                </div>
              </div>
              
              <!-- Invoice Count and Summary -->
              <div class="flex items-center space-x-6">
                <div class="text-right">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ studentGroup.invoices.length }} invoices
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    Total: ₹{{ formatCurrency(studentGroup.totalAmount) }}
                  </div>
                  <!-- Invoice Type Breakdown -->
                  <div class="text-xs text-gray-400 mt-1">
                    <span v-if="studentGroup.monthlyInvoices > 0" class="mr-2">
                      {{ studentGroup.monthlyInvoices }} Monthly
                    </span>
                    <span v-if="studentGroup.installmentInvoices > 0">
                      {{ studentGroup.installmentInvoices }} Installment
                    </span>
                  </div>
                </div>
                
                <!-- Status Summary -->
                <div class="flex space-x-2">
                  <span v-if="studentGroup.paidCount > 0" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {{ studentGroup.paidCount }} Paid
                  </span>
                  <span v-if="studentGroup.pendingCount > 0" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    {{ studentGroup.pendingCount }} Pending
                  </span>
                  <span v-if="studentGroup.partialCount > 0" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    Partial Paid
                  </span>
                  <span v-if="studentGroup.overdueCount > 0" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    {{ studentGroup.overdueCount }} Overdue
                  </span>
                </div>
              </div>
            </div>
            
            <!-- Invoices List (Collapsible) -->
            <div v-show="expandedStudents.includes(studentGroup.studentId)" class="bg-gray-50 dark:bg-gray-700/50">
              <div class="px-6 py-3 border-t border-gray-200 dark:border-gray-600">
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead class="bg-gray-100 dark:bg-gray-600">
                      <tr>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Invoice</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fee Type</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paid</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due Date</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Days Overdue</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                      <tr v-for="invoice in studentGroup.invoices" :key="invoice.id" class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                        <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {{ invoice.invoice_number || invoice.id }}
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {{ invoice.feeStructure?.feeType?.name || invoice.fee_type_name || 'N/A' }}
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          ₹{{ formatCurrency(invoice.total_amount) }}
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          ₹{{ formatCurrency(invoice.paid_amount) }}
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {{ formatDate(invoice.due_date) }}
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <span v-if="getDaysOverdue(invoice.due_date) > 0" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            {{ getDaysOverdue(invoice.due_date) }} days
                          </span>
                          <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            On time
                          </span>
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap">
                          <span :class="getStatusClass(invoice.status)" class="inline-flex px-3 py-1 text-xs font-semibold rounded-full">
                            {{ getStatusText(invoice.status) }}
                          </span>
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <button
                            @click="viewInvoice(invoice)"
                            class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors duration-200"
                          >
                            View Ledger
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Enhanced Pagination -->
        <Pagination 
          v-if="totalStudentGroups > 0"
          :pagination="{
            page: currentPage,
            limit: pageSize,
            total: totalStudentGroups
          }"
          item-label="students"
          :additional-info="`${invoices.length} total invoices`"
          @page-changed="goToPage"
          @page-size-changed="onPageSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue';
import { 
  Download, 
  Search,
  Printer
} from 'lucide-vue-next';
import { FeeInvoices, Invoices, Schools, Branches, Classes, Streams, Sections, FeeTypes } from '~/api';
import { useAuthStore } from '~/stores/auth';
import { useToast } from '~/composables/useToast';
import { useExportService } from '~/composables/useExportService';
import { usePrintReport } from '~/composables/usePrintReport';
import Pagination from '~/components/Pagination.vue';


// Get auth store and toast
const authStore = useAuthStore();
const { showToast } = useToast();

// Export services
const { 
  generateReport,
  isGenerating, 
  generationProgress
} = useExportService();

const { printReport: printReportCommon } = usePrintReport();

// State
const invoices = ref([]);
const classes = ref([]);
const streams = ref([]);
const branches = ref([]);
const sections = ref([]);
const schools = ref([]); // Add schools for super admin
const feeTypes = ref([]); // Add fee types for reference
const isLoading = ref(false);
const isInitializing = ref(true);
const expandedStudents = ref([]); // Track which students are expanded
const showDownloadDropdown = ref(false); // Track download dropdown state
const showColumnSelector = ref(false); // Track column selector state

// Available columns for selection
const availableColumns = ref([
  { key: 'student_name', label: 'Student Name', visible: true },
  { key: 'admission_number', label: 'Admission No', visible: true },
  { key: 'branch', label: 'Branch', visible: true },
  { key: 'class', label: 'Class', visible: true },
  { key: 'section', label: 'Section', visible: false },
  { key: 'stream', label: 'Stream', visible: false },
  { key: 'total_amount', label: 'Total Amount', visible: true },
  { key: 'paid_amount', label: 'Paid Amount', visible: true },
  { key: 'balance_amount', label: 'Balance', visible: true },
  { key: 'status', label: 'Status', visible: true },
  { key: 'due_date', label: 'Due Date', visible: false },
  { key: 'invoice_count', label: 'Invoice Count', visible: false }
]);

// Computed property to filter visible columns
const displayedColumns = computed(() => {
  return availableColumns.value.filter(col => col.visible);
});

// Summary data from backend (for accurate totals)
const summaryData = ref({
  totalAmount: 0,
  totalCollected: 0,
  totalPending: 0,
  collectionRate: 0,
  totalInvoices: 0
});

// Pagination
const currentPage = ref(1);
const pageSize = ref(10); // Changed back to 10 for student groups (showing 10 students per page)
const totalItems = ref(0);


// Filters
const filters = reactive({
  dateRange: 'today', // Changed to 'today' as default since 'all_time' is removed
  fromDate: '',
  toDate: '',
  school_id: '', // Add school_id for super admin
  branch_id: '',
  class_id: '',
  stream_id: '',
  section_id: '',
  status: '',
  payment_method: '',
  student_search: '',
});

// Computed properties
const summary = computed(() => {
  // Use backend-calculated summary data for accurate totals (original behavior)
  const result = {
    totalAmount: summaryData.value.totalAmount,
    totalCollected: summaryData.value.totalCollected,
    totalPending: summaryData.value.totalPending,
    collectionRate: summaryData.value.collectionRate
  };
  
  // Calculate frontend totals for comparison and debugging
  const frontendTotalAmount = invoices.value.reduce((sum, invoice) => sum + parseFloat(invoice.total_amount || 0), 0);
  const frontendTotalCollected = invoices.value.reduce((sum, invoice) => sum + parseFloat(invoice.paid_amount || 0), 0);
  const frontendTotalPending = frontendTotalAmount - frontendTotalCollected;
  
  return result;
});

// Show stream dropdown only if the selected class has streams
const showStreamDropdown = computed(() => {
  return filters.class_id && streams.value.length > 0;
});

// Show section dropdown only if the selected class/stream has sections
const showSectionDropdown = computed(() => {
  return filters.class_id && sections.value.length > 0;
});

// Group invoices by student for accordion view
const groupedInvoices = computed(() => {
  const groups = {};
  
  console.log('🔍 Starting grouping process with', invoices.value.length, 'invoices');
  
  invoices.value.forEach((invoice, index) => {
    // Try multiple ways to get student ID
    let studentId = invoice.student?.id || invoice.student_id || invoice.studentId;
    
    // If still no student ID, try to create a unique identifier from student data
    if (!studentId && invoice.student) {
      studentId = `${invoice.student.first_name}_${invoice.student.last_name}_${invoice.student.admission_number}`;
    }
    
    // If still no ID, use invoice ID as fallback (this shouldn't happen in normal cases)
    if (!studentId) {
      studentId = `unknown_${invoice.id}`;
    }
    
    const studentName = invoice.student?.first_name ? 
      `${invoice.student.first_name} ${invoice.student.last_name || ''}` : 
      'Unknown Student';
    const admissionNumber = invoice.student?.admission_number || 'N/A';
    const rollNumber = invoice.student?.roll_number || 'N/A';
    const className = invoice.student?.current_class || invoice.class_name || 'N/A';
    const studentPhoto = invoice.student?.photo;
    
    if (!groups[studentId]) {
      groups[studentId] = {
        studentId,
        studentName,
        admissionNumber,
        rollNumber,
        className,
        studentPhoto,
        invoices: [],
        totalAmount: 0,
        paidCount: 0,
        pendingCount: 0,
        overdueCount: 0,
        monthlyInvoices: 0,
        installmentInvoices: 0
      };
      console.log(`🆕 Created new group for student: ${studentName} (ID: ${studentId})`);
    }
    
    groups[studentId].invoices.push(invoice);
    groups[studentId].totalAmount += parseFloat(invoice.total_amount || 0);
    
    // Count invoice types
    const feeTypeName = invoice.feeStructure?.feeType?.name || invoice.fee_type_name || '';
    if (feeTypeName.toLowerCase().includes('monthly')) {
      groups[studentId].monthlyInvoices++;
    } else if (feeTypeName.toLowerCase().includes('installment')) {
      groups[studentId].installmentInvoices++;
    }
    
    // Count by status
    if (invoice.status === 'paid') {
      groups[studentId].paidCount++;
    } else if (invoice.status === 'unpaid' || invoice.status === 'partial') {
      groups[studentId].pendingCount++;
    }
    
    // Count overdue
    if (getDaysOverdue(invoice.due_date) > 0) {
      groups[studentId].overdueCount++;
    }
  });
  
  // Convert to array and sort by student name
  const result = Object.values(groups).sort((a, b) => a.studentName.localeCompare(b.studentName));
  
  console.log('🎯 Grouped Invoices Debug:', {
    totalInvoices: invoices.value.length,
    uniqueStudents: result.length,
    groupsCreated: Object.keys(groups).length,
    students: result.map(s => ({ 
      name: s.studentName, 
      id: s.studentId,
      invoiceCount: s.invoices.length,
      totalAmount: s.totalAmount
    }))
  });
  
  return result;
});

// Paginated grouped results for display
const paginatedGroupedInvoices = computed(() => {
  // Ensure pageSize is a number
  const pageSizeNum = parseInt(pageSize.value);
  const startIndex = (currentPage.value - 1) * pageSizeNum;
  const endIndex = startIndex + pageSizeNum;
  const result = groupedInvoices.value.slice(startIndex, endIndex);
  

  
  // Debug: Check if pagination is working
  if (groupedInvoices.value.length > pageSizeNum && result.length === groupedInvoices.value.length) {
    console.warn('⚠️ Pagination not working - showing all results instead of paginated results');
    console.warn('⚠️ Expected:', pageSizeNum, 'items, but showing:', result.length, 'items');
  }
  
  return result;
});

// Update pagination to work with student groups instead of individual invoices
const totalStudentGroups = computed(() => {
  const count = groupedInvoices.value.length;
  return count;
});

const totalPagesForGroups = computed(() => {
  const pages = Math.ceil(totalStudentGroups.value / pageSize.value);
  console.log('📖 Total Pages for Groups:', pages, '(Groups:', totalStudentGroups.value, '/ PageSize:', pageSize.value, ')');
  return pages;
});

// Methods
const toggleStudent = (studentId) => {
  const index = expandedStudents.value.indexOf(studentId);
  if (index > -1) {
    expandedStudents.value.splice(index, 1);
  } else {
    expandedStudents.value.push(studentId);
  }
};

const fetchReportData = async () => {
  if (isLoading.value) {
    return;
  }
  
  isLoading.value = true;
  try {
    // Fetch both report data and summary data in parallel
    await Promise.all([
      fetchReport(),
      fetchReportSummary()
    ]);
  } catch (error) {
    showToast('Error generating report', 'error');
  } finally {
    isLoading.value = false;
  }
};

const resetFilters = () => {
  console.log('🔄 Resetting filters...');
  Object.assign(filters, {
    dateRange: 'today', // Changed to 'month' since 'all_time' is removed
    fromDate: '',
    toDate: '',
    school_id: '', // Reset school_id for super admin
    branch_id: '',
    class_id: '',
    stream_id: '',
    section_id: '',
    status: '',
    payment_method: '',
    student_search: '',
  });
  handleDateRangeChange();
  // Clear the results when resetting filters
  invoices.value = [];
  totalItems.value = 0;
  
  // Clear summary data
  summaryData.value = {
    totalAmount: 0,
    totalCollected: 0,
    totalPending: 0,
    collectionRate: 0,
    totalInvoices: 0
  };
  console.log('✅ Filters reset - all data cleared');
};

const handleDateRangeChange = () => {
  console.log('📅 handleDateRangeChange called with dateRange:', filters.dateRange);
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Helper function to format date as YYYY-MM-DD
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  switch (filters.dateRange) {
    case 'today':
      filters.fromDate = formatDate(today);
      filters.toDate = formatDate(today);
      console.log('📅 Today filter set:', { fromDate: filters.fromDate, toDate: filters.toDate });
      break;
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      filters.fromDate = formatDate(yesterday);
      filters.toDate = formatDate(yesterday);
      break;
    case 'week':
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      filters.fromDate = formatDate(weekStart);
      filters.toDate = formatDate(today);
      break;
    case 'last_week':
      const lastWeekStart = new Date(today);
      lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
      const lastWeekEnd = new Date(lastWeekStart);
      lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
      filters.fromDate = formatDate(lastWeekStart);
      filters.toDate = formatDate(lastWeekEnd);
      break;
    case 'month':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      filters.fromDate = formatDate(monthStart);
      filters.toDate = formatDate(today);
      break;
    case 'last_month':
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      filters.fromDate = formatDate(lastMonthStart);
      filters.toDate = formatDate(lastMonthEnd);
      break;
    case 'quarter':
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      filters.fromDate = formatDate(quarterStart);
      filters.toDate = formatDate(today);
      break;
    case 'year':
      const yearStart = new Date(now.getFullYear(), 0, 1);
      filters.fromDate = formatDate(yearStart);
      filters.toDate = formatDate(today);
      break;
    case 'custom':
      // Keep existing fromDate and toDate values
      console.log('📅 Custom filter - keeping existing values:', { fromDate: filters.fromDate, toDate: filters.toDate });
      break;
    default:
      filters.fromDate = '';
      filters.toDate = '';
      console.log('📅 Default filter set:', { fromDate: filters.fromDate, toDate: filters.toDate });
  }
  
  console.log('📅 Final filter values after handleDateRangeChange:', {
    dateRange: filters.dateRange,
    fromDate: filters.fromDate,
    toDate: filters.toDate
  });
};

const onSchoolChange = async () => {
  // Reset branch, class, and section when school changes
  filters.branch_id = '';
  filters.class_id = '';
  filters.section_id = '';
  
  // Refetch branches for the selected school
  await fetchBranches();
  
  // Refetch dependent data
  await Promise.all([
    fetchClasses(),
    fetchSections()
  ]);
};

const onBranchChange = async () => {
  // Reset class and section when branch changes
  filters.class_id = '';
  filters.section_id = '';
  
  // Refetch dependent data
  await Promise.all([
    fetchClasses(),
    fetchSections()
  ]);
};

const onClassChange = async () => {
  // Reset stream and section when class changes
  filters.stream_id = '';
  filters.section_id = '';
  
  // First fetch streams for the selected class
  await fetchStreams();
  
  // Then fetch sections (streams will be empty if class has no streams)
  await fetchSections();
};

const onStreamChange = async () => {
  // Reset section when stream changes
  filters.section_id = '';
  
  // Refetch dependent data
  await fetchSections();
};

const fetchReportSummary = async () => {
  try {
    console.log('🔍 Starting fetchReportSummary...');
    console.log('🔍 Current filters:', filters);
    
    const params = {
      // Map frontend filters to backend API parameters
      search: filters.student_search || undefined,
      status: filters.status || undefined,
      school_id: filters.school_id || undefined, // Add school_id for super admin
      branch_id: filters.branch_id || undefined,
    };
    
    // Only add date parameters if they are set and not empty
    if (filters.fromDate && filters.fromDate.trim() !== '') {
      params.from_date = filters.fromDate;
    }
    if (filters.toDate && filters.toDate.trim() !== '') {
      params.to_date = filters.toDate;
    }

    // Only add class_name if a specific class is selected (not "All Classes")
    if (filters.class_id && filters.class_id !== '') {
      // Find the class name from the selected class ID
      const selectedClass = classes.value.find(cls => cls.id === filters.class_id);
      if (selectedClass) {
        params.class_name = selectedClass.name;
      }
    }

    // Only add section if a specific section is selected (not "All Sections")
    if (filters.section_id && filters.section_id !== '') {
      // Find the section name from the selected section ID
      const selectedSection = sections.value.find(sec => sec.id === filters.section_id);
      if (selectedSection) {
        params.section = selectedSection.name;
      }
    }

    // Remove undefined values
    Object.keys(params).forEach(key => {
      if (params[key] === undefined) {
        delete params[key];
      }
    });

    console.log('📊 Fetching summary with params:', params);
    console.log('📊 Date parameters debug:', {
      dateRange: filters.dateRange,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      from_date_param: params.from_date,
      to_date_param: params.to_date
    });
    
    const response = await FeeInvoices.getSummary(params);
    console.log('📊 Summary response:', response);
    
    if (response.success) {
      summaryData.value = response.data;
      console.log('✅ Summary data loaded:', summaryData.value);
      console.log('🔍 Summary data breakdown:', {
        totalAmount: response.data.totalAmount,
        totalCollected: response.data.totalCollected,
        totalPending: response.data.totalPending,
        collectionRate: response.data.collectionRate,
        totalInvoices: response.data.totalInvoices
      });
      console.log('🎯 Summary cards should now show:', {
        totalAmount: `₹${formatCurrency(response.data.totalAmount)}`,
        totalCollected: `₹${formatCurrency(response.data.totalCollected)}`,
        totalPending: `₹${formatCurrency(response.data.totalPending)}`,
        collectionRate: `${response.data.collectionRate}%`,
        totalInvoices: response.data.totalInvoices
      });
    } else {
      console.error('❌ Summary response not successful:', response);
      // Fallback: Calculate from invoice data if available
      if (invoices.value.length > 0) {
        console.log('🔄 Falling back to invoice-based calculation...');
        const totalAmount = invoices.value.reduce((sum, invoice) => sum + parseFloat(invoice.total_amount || 0), 0);
        const totalCollected = invoices.value.reduce((sum, invoice) => sum + parseFloat(invoice.paid_amount || 0), 0);
        const totalPending = totalAmount - totalCollected;
        const collectionRate = totalAmount > 0 ? Math.round((totalCollected / totalAmount) * 100) : 0;
        
        summaryData.value = {
          totalAmount,
          totalCollected,
          totalPending,
          collectionRate,
          totalInvoices: invoices.value.length
        };
        console.log('✅ Fallback summary calculated:', summaryData.value);
      } else {
        // Reset summary data on error
        summaryData.value = {
          totalAmount: 0,
          totalCollected: 0,
          totalPending: 0,
          collectionRate: 0,
          totalInvoices: 0
        };
      }
    }
  } catch (error) {
    console.error('Error fetching summary:', error);
    // Reset summary data on error
    summaryData.value = {
      totalAmount: 0,
      totalCollected: 0,
      totalPending: 0,
      collectionRate: 0,
      totalInvoices: 0
    };
  }
};

const fetchReport = async () => {
  try {
    const params = {
      // Use a reasonable limit - the backend should handle pagination properly
      limit: 1000, // Reduced from 10000 to prevent excessive data loading
      // Map frontend filters to backend API parameters
      search: filters.student_search || undefined,
      status: filters.status || undefined,
      school_id: filters.school_id || undefined, // Add school_id for super admin
      branch_id: filters.branch_id || undefined,
    };
    
    // Only add date parameters if they are set and not empty
    if (filters.fromDate && filters.fromDate.trim() !== '') {
      params.from_date = filters.fromDate;
    }
    if (filters.toDate && filters.toDate.trim() !== '') {
      params.to_date = filters.toDate;
    }
    
    // Only add class_name if a specific class is selected (not "All Classes")
    if (filters.class_id && filters.class_id !== '') {
      // Find the class name from the selected class ID
      const selectedClass = classes.value.find(cls => cls.id === filters.class_id);
      if (selectedClass) {
        params.class_name = selectedClass.name;
      }
    }
    
    // Only add section if a specific section is selected (not "All Sections")
    if (filters.section_id && filters.section_id !== '') {
      // Find the section name from the selected section ID
      const selectedSection = sections.value.find(sec => sec.id === filters.section_id);
      if (selectedSection) {
        params.section = selectedSection.name;
      }
    }
    
    // TODO: Backend doesn't support stream filtering yet
    // Only add stream_id if streams are available and selected
    // if (filters.stream_id && filters.stream_id !== '' && streams.value.length > 0) {
    //   params.stream_id = filters.stream_id;
    // }
    
    // Remove undefined values
    Object.keys(params).forEach(key => {
      if (params[key] === undefined) {
        delete params[key];
      }
    });
    
    console.log('🔍 Fetching report with params:', params);
    console.log('🔍 Current filter values:', {
      class_id: filters.class_id,
      class_name: classes.value.find(cls => cls.id === filters.class_id)?.name,
      section_id: filters.section_id,
      section_name: sections.value.find(sec => sec.id === filters.section_id)?.name,
      stream_id: filters.stream_id,
      branch_id: filters.branch_id,
      status: filters.status,
      student_search: filters.student_search,
      dateRange: filters.dateRange,
      fromDate: filters.fromDate,
      toDate: filters.toDate
    });
    console.log('🔍 Date parameters debug:', {
      dateRange: filters.dateRange,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      from_date_param: params.from_date,
      to_date_param: params.to_date
    });
    console.log('🔍 Date filtering debug:', {
      dateRange: filters.dateRange,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      from_date_param: params.from_date,
      to_date_param: params.to_date,
      hasDateFilter: !!(params.from_date && params.to_date)
    });
    console.log('🔍 Is "All Classes" selected?', !filters.class_id || filters.class_id === '');
    console.log('🔍 Will send class_name parameter?', params.hasOwnProperty('class_name'));
    
    // Try different API endpoints if the main one fails
    let response;
    try {
      response = await FeeInvoices.getReport(params);
      console.log('📊 Report response from feeInvoices.getReport:', response);
    } catch (error) {
      console.log('⚠️ feeInvoices.getReport failed, trying invoices.getAll...');
      try {
        response = await Invoices.getAll(params);
        console.log('📊 Report response from invoices.getAll:', response);
      } catch (secondError) {
        console.error('❌ Both API endpoints failed:', secondError);
        throw secondError;
      }
    }
    
    if (response.success) {
      invoices.value = response.data?.invoices || [];
      // Reset pagination since we're handling it on frontend for grouped results
      currentPage.value = 1; // Reset to first page when new data is loaded
      console.log('✅ Invoices loaded:', invoices.value.length, 'Total invoices:', invoices.value.length);
      
      // Debug: Check pagination info from backend
      if (response.data?.pagination) {
        console.log('📊 Backend Pagination Info:', {
          current_page: response.data.pagination.current_page,
          total_pages: response.data.pagination.total_pages,
          total_records: response.data.pagination.total_records,
          per_page: response.data.pagination.per_page,
          has_next: response.data.pagination.has_next,
          has_prev: response.data.pagination.has_prev
        });
      }
      
      // Debug: Check unique students in the response
      const uniqueStudents = new Set();
      const studentNames = [];
      invoices.value.forEach(invoice => {
        const studentId = invoice.student?.id || invoice.student_id || invoice.studentId;
        const studentName = invoice.student?.first_name ? 
          `${invoice.student.first_name} ${invoice.student.last_name || ''}` : 
          'Unknown Student';
        uniqueStudents.add(studentId);
        studentNames.push(studentName);
      });
      
      console.log('🔍 Backend Response Debug:', {
        totalInvoices: invoices.value.length,
        uniqueStudentIds: uniqueStudents.size,
        uniqueStudentNames: [...new Set(studentNames)],
        sampleInvoices: invoices.value.slice(0, 3).map(inv => ({
          id: inv.id,
          studentId: inv.student?.id || inv.student_id,
          studentName: inv.student?.first_name ? `${inv.student.first_name} ${inv.student.last_name || ''}` : 'Unknown'
        }))
      });
    } else {
      console.error('❌ Report response not successful:', response);
      showToast('Error fetching fee report', 'error');
    }
  } catch (error) {
    console.error('Error fetching report:', error);
    showToast('Error fetching fee report', 'error');
  }
};

const fetchSchools = async () => {
  try {
    // Only fetch schools for super admin
    if (authStore.user?.role !== 'super_admin') {
      schools.value = [];
      return;
    }
    
    const response = await Schools.getAll();
    console.log('🏫 Schools API response:', response);
    
    // Handle different response structures
    if (response.success) {
      schools.value = response.data?.schools || response.data || [];
    } else if (response.data?.items) {
      schools.value = response.data.items;
    } else if (response.data?.schools) {
      schools.value = response.data.schools;
    } else if (Array.isArray(response.data)) {
      schools.value = response.data;
    } else {
      schools.value = [];
    }
    
    console.log('🏫 Schools loaded:', schools.value.length, 'items:', schools.value);
  } catch (error) {
    console.error('❌ Error fetching schools:', error);
    showToast('Error fetching schools', 'error');
    schools.value = [];
  }
};

const fetchBranches = async () => {
  try {
            const response = await Branches.getForDropdown();
    console.log('🌿 Branches API response:', response);
    
    // Dropdown endpoint returns data directly as an array
    let allBranches = response.data || [];
    
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
          console.log('🏫 No school selected, showing all branches');
          branches.value = allBranches;
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
      console.log('⚠️ No user or role information, showing all branches as fallback');
      // Fallback: show all branches if user info is not available
      branches.value = allBranches;
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
    const response = await Classes.getAll(params);
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

const fetchStreams = async () => {
  try {
    const params = {};
    if (filters.branch_id) {
      params.branch_id = filters.branch_id;
    }
    if (filters.class_id) {
      params.class_id = filters.class_id;
    }
    const response = await Streams.getAll(params);
    console.log('Streams response:', response);
    
    // Handle different response structures
    if (response.success) {
      streams.value = response.data || [];
    } else if (response.data?.items) {
      streams.value = response.data.items;
    } else if (response.data?.streams) {
      streams.value = response.data.streams;
    } else if (Array.isArray(response.data)) {
      streams.value = response.data;
    } else {
      streams.value = [];
    }
    
    console.log('🌊 Streams loaded:', streams.value.length, 'items:', streams.value);
  } catch (error) {
    console.error('Error fetching streams:', error);
    showToast('Error fetching streams', 'error');
    streams.value = [];
  }
};

const fetchSections = async () => {
  try {
    const params = {};
    if (filters.school_id) {
      params.school_id = filters.school_id;
    }
    if (filters.branch_id) {
      params.branch_id = filters.branch_id;
    }
    if (filters.class_id) {
      params.class_id = filters.class_id; // Use class_id for sections API
    }
    // Only add stream_id if streams are available and selected
    if (filters.stream_id && streams.value.length > 0) {
      params.stream_id = filters.stream_id;
    }
    const response = await Sections.getAll(params);
    console.log('Sections response:', response);
    
    // Handle different response structures
    if (response.success) {
      sections.value = response.data || [];
    } else if (response.data?.items) {
      sections.value = response.data.items;
    } else if (response.data?.sections) {
      sections.value = response.data.sections;
    } else if (Array.isArray(response.data)) {
      sections.value = response.data;
    } else {
      sections.value = [];
    }
    
    console.log('📋 Sections loaded:', sections.value.length, 'items:', sections.value);
  } catch (error) {
    console.error('Error fetching sections:', error);
    showToast('Error fetching sections', 'error');
    sections.value = [];
  }
};

const fetchFeeTypes = async () => {
  try {
    const response = await FeeTypes.getAll();
    console.log('Fee types response:', response);
    
    // Handle different response structures
    if (response.success) {
      feeTypes.value = response.data || [];
    } else if (response.data?.items) {
      feeTypes.value = response.data.items;
    } else if (response.data?.fee_types) {
      feeTypes.value = response.data.fee_types;
    } else if (Array.isArray(response.data)) {
      feeTypes.value = response.data;
    } else {
      feeTypes.value = [];
    }
    
    console.log('💰 Fee types loaded:', feeTypes.value.length, 'items:', feeTypes.value);
  } catch (error) {
    console.error('Error fetching fee types:', error);
    showToast('Error fetching fee types', 'error');
    feeTypes.value = [];
  }
};

// Common function to format invoice data for exports
const formatInvoiceDataForExport = (invoice) => {
  const formattedInvoice = {};
  
  // Use availableColumns configuration instead of manual checking
  availableColumns.value.forEach(column => {
    if (column.visible) {
      const key = column.key;
      
      switch (key) {
        case 'student_name':
          if (invoice.student?.first_name) {
            formattedInvoice[key] = `${invoice.student.first_name} ${invoice.student.last_name || ''}`.trim();
          } else {
            formattedInvoice[key] = 'N/A';
          }
          break;
          
        case 'admission_number':
          formattedInvoice[key] = invoice.student?.admission_number || 'N/A';
          break;
          
        case 'branch':
          formattedInvoice[key] = invoice.branch || 'N/A';
          break;
          
        case 'class':
          formattedInvoice[key] = invoice.student?.current_class || 'N/A';
          break;
          
        case 'section':
          formattedInvoice[key] = invoice.student?.section || 'N/A';
          break;
          
        case 'stream':
          formattedInvoice[key] = invoice.student?.stream || 'N/A';
          break;
          
        case 'total_amount':
          formattedInvoice[key] = formatCurrency(invoice.total_amount);
          break;
          
        case 'paid_amount':
          formattedInvoice[key] = formatCurrency(invoice.paid_amount);
          break;
          
        case 'balance_amount':
          formattedInvoice[key] = formatCurrency(invoice.balance_amount);
          break;
          
        case 'status':
          formattedInvoice[key] = getStatusText(invoice.status);
          break;
          
        case 'due_date':
          formattedInvoice[key] = formatDate(invoice.due_date);
          break;
          
        case 'invoice_count':
          formattedInvoice[key] = invoice.invoice_count || 1;
          break;
          
        default:
          formattedInvoice[key] = invoice[key] || 'N/A';
      }
    }
  });
  
  return formattedInvoice;
};

// Reusable function to format all invoices data for export
const formatDataForExport = () => {
  return invoices.value.map(invoice => formatInvoiceDataForExport(invoice));
};

// Unified download function following DRY principle
const downloadReport = async (format) => {
  try {
    closeDownloadDropdown();
    
    if (!validateColumnVisibility('export') || !validateDataAvailability('export')) {
      return;
    }
    
    const exportFilters = {
      from_date: filters.fromDate,
      to_date: filters.toDate,
      school_id: filters.school_id,
      branch_id: filters.branch_id,
      class_id: filters.class_id,
      stream_id: filters.stream_id,
      section_id: filters.section_id,
      status: filters.status,
      payment_method: filters.payment_method,
      search: filters.student_search
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
      report_type: 'fees',
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

const printFeesReport = async () => {
  try {
    if (!validateColumnVisibility('print')) {
      return;
    }
    
    // Fetch all data for printing (similar to receipts page)
    if (invoices.value.length === 0) {
      showToast('No data to print. Please load some invoices first.', 'warning');
      return;
    } 
    
    const formattedData = invoices.value.map(invoice => formatInvoiceDataForExport(invoice));
    
    const reportData = {
      title: 'Fee Invoices Report',
      data: formattedData,
      columns: displayedColumns.value.map(col => ({
        key: col.key,
        header: col.label
      })),
      filters: {
        'Date Range': filters.dateRange,
        'From Date': filters.dateRange === 'custom' ? formatDate(filters.fromDate) : 'N/A',
        'To Date': filters.dateRange === 'custom' ? formatDate(filters.toDate) : 'N/A',
        'Status': filters.status || 'All Status',
        'Payment Method': filters.payment_method || 'All Methods',
        'Search': filters.student_search || 'None'
      },
      totalRecords: invoices.value.length,
      reportType: 'fees'
    };
    
    await printReportCommon(reportData, {
      showHeader: true,
      showSummary: true,
      showFilters: true,
      showFooter: true,
      autoPrint: true
    });
  } catch (error) {
    showToast('Error printing report', 'error');
  }
};

// Column management methods
const toggleColumnSelector = () => {
  showColumnSelector.value = !showColumnSelector.value;
};

const selectAllColumns = () => {
  availableColumns.value.forEach(col => col.visible = true);
};

const deselectAllColumns = () => {
  availableColumns.value.forEach(col => col.visible = false);
};

const toggleColumnVisibility = (index) => {
  availableColumns.value[index].visible = !availableColumns.value[index].visible;
};

// Helper function to check if a column is visible
const isColumnVisible = (columnKey) => {
  const column = availableColumns.value.find(col => col.key === columnKey);
  return column ? column.visible : false;
};

// Common method to validate column visibility for exports
const validateColumnVisibility = (action = 'export') => {
  if (displayedColumns.value.length === 0) {
    showToast(`No columns selected. Please select at least one column to ${action}.`, 'warning');
    return false;
  }
  return true;
};

// Common method to validate data availability for exports
const validateDataAvailability = (action = 'export') => {
  if (invoices.value.length === 0) {
    showToast(`No data available to ${action}. Please load some invoices first.`, 'warning');
    return false;
  }
  return true;
};

const viewInvoice = (invoice) => {
  // Navigate to student's fee ledger page instead of individual invoice
  const studentId = invoice.student?.id || invoice.student_id;
  if (studentId) {
    navigateTo(`/students/${studentId}/fee-ledger`);
  } else {
    showToast('Student information not available', 'error');
  }
};

const goToPage = (page) => {
  if (page >= 1 && page <= totalPagesForGroups.value) {
    currentPage.value = page;
  }
};

const onPageSizeChange = (newPageSize) => {
  pageSize.value = newPageSize;
  currentPage.value = 1; // Reset to first page when page size changes
};

const formatCurrency = (amount) => {
  return parseFloat(amount || 0).toLocaleString('en-IN');
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN');
};

const getDaysOverdue = (dueDate) => {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today - due;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

const getStatusClass = (status) => {
  const classes = {
    paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    partial_paid: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    unpaid: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return classes[status] || classes.unpaid;
};

const getStatusText = (status) => {
  const texts = {
    paid: 'Paid',
    partial_paid: 'Partial Paid',
    unpaid: 'Unpaid',
    overdue: 'Overdue',
  };
  return texts[status] || status;
};

// Dropdown functions
const toggleDownloadDropdown = () => {
  showDownloadDropdown.value = !showDownloadDropdown.value;
};

const closeDownloadDropdown = () => {
  showDownloadDropdown.value = false;
};

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  const dropdown = document.querySelector('.download-dropdown');
  if (dropdown && !dropdown.contains(event.target)) {
    closeDownloadDropdown();
  }
  const columnSelector = document.querySelector('.column-selector-dropdown');
  if (columnSelector && !columnSelector.contains(event.target)) {
    showColumnSelector.value = false;
  }
};

// Watch pageSize to ensure it's always a number
watch(pageSize, (newValue) => {
  if (typeof newValue === 'string') {
    pageSize.value = parseInt(newValue);
  }
});

onMounted(async () => {
  try {
    isInitializing.value = true;
    
    // Wait a bit for auth store to be ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('🚀 Starting page initialization...');
    
    // Load all required data in parallel
    await Promise.all([
      fetchSchools(),
      fetchBranches(),
      fetchClasses(),
      fetchStreams(),
      fetchSections(),
      fetchFeeTypes()
    ]);
    
    // Set default date range
    handleDateRangeChange();
    
    console.log('✅ Page initialization complete');
    
    // Add click outside listener for dropdown
    document.addEventListener('click', handleClickOutside);
    
    // Don't load any data initially - user must click "Apply Filters"
    console.log('📊 No initial data loaded - waiting for user to apply filters');
    
  } catch (error) {
    console.error('❌ Error initializing page:', error);
    showToast('Error loading report data', 'error');
  } finally {
    isInitializing.value = false;
  }
});

// Cleanup event listener on component unmount
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script> 