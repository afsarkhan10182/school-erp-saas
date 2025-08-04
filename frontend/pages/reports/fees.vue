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
            Fee Collection Reports
          </h1>
          <p class="mt-2 text-lg text-gray-600 dark:text-gray-300">Detailed fee collection reports and analytics</p>
        </div>
        <div class="flex flex-col sm:flex-row gap-3">
          <button
            @click="printReport"
            :disabled="isLoading || invoices.length === 0"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer class="-ml-1 mr-2 h-4 w-4" />
            Print Report
          </button>
          <button
            @click="downloadDetailedReport"
            :disabled="isLoading || invoices.length === 0"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download class="-ml-1 mr-2 h-5 w-5" />
            Download Excel
          </button>
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
                @click="generateReport"
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
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Detailed Fee Collection Report</h3>
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
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { 
  Download, 
  Search,
  Printer
} from 'lucide-vue-next';
import apiClient from '~/utils/api';
import { useAuthStore } from '~/stores/auth';
import { useToast } from '~/composables/useToast';
import Pagination from '~/components/Pagination.vue';


// Get auth store and toast
const authStore = useAuthStore();
const { showToast } = useToast();

// State
const invoices = ref([]);
const classes = ref([]);
const streams = ref([]);
const branches = ref([]);
const sections = ref([]);
const schools = ref([]); // Add schools for super admin
const isLoading = ref(false);
const isInitializing = ref(true);
const expandedStudents = ref([]); // Track which students are expanded

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
  
  console.log('📊 Summary computed property called:', result);
  console.log('📊 SummaryData value:', summaryData.value);
  console.log('📊 Invoices length:', invoices.value.length);
  console.log('📊 Frontend vs Backend comparison:', {
    backend: {
      totalAmount: summaryData.value.totalAmount,
      totalCollected: summaryData.value.totalCollected,
      totalPending: summaryData.value.totalPending,
      totalInvoices: summaryData.value.totalInvoices
    },
    frontend: {
      totalAmount: frontendTotalAmount,
      totalCollected: frontendTotalCollected,
      totalPending: frontendTotalPending,
      totalInvoices: invoices.value.length
    },
    discrepancy: {
      totalAmount: Math.abs(summaryData.value.totalAmount - frontendTotalAmount),
      totalCollected: Math.abs(summaryData.value.totalCollected - frontendTotalCollected),
      totalPending: Math.abs(summaryData.value.totalPending - frontendTotalPending),
      totalInvoices: Math.abs(summaryData.value.totalInvoices - invoices.value.length)
    }
  });
  
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
    
    console.log(`📋 Invoice ${index + 1}:`, {
      invoiceId: invoice.id,
      studentId,
      studentName,
      admissionNumber,
      className,
      hasStudent: !!invoice.student,
      studentData: invoice.student,
      originalStudentId: invoice.student?.id,
      originalStudentIdField: invoice.student_id
    });
    
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
  
  console.log('📄 Pagination Debug:', {
    currentPage: currentPage.value,
    pageSize: pageSize.value,
    pageSizeNum,
    totalGroups: groupedInvoices.value.length,
    startIndex,
    endIndex,
    resultLength: result.length,
    totalPages: totalPagesForGroups.value,
    allStudents: groupedInvoices.value.map(s => s.studentName),
    paginatedStudents: result.map(s => s.studentName)
  });
  
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
  console.log('👥 Total Student Groups:', count);
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

const generateReport = async () => {
  console.log('🚀 generateReport called');
  console.log('🔍 Current filter state:', {
    dateRange: filters.dateRange,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    status: filters.status,
    branch_id: filters.branch_id,
    class_id: filters.class_id,
    section_id: filters.section_id,
    student_search: filters.student_search
  });
  
  if (isLoading.value) {
    console.log('⚠️ Already loading, returning');
    return;
  }
  
  console.log('🔄 Setting loading state...');
  isLoading.value = true;
  try {
    console.log('📊 Starting to fetch report and summary...');
    // Fetch both report data and summary data in parallel
    await Promise.all([
      fetchReport(),
      fetchReportSummary()
    ]);
    console.log('✅ Report and summary fetched successfully');
    console.log('🔍 Final state check:');
    console.log('  - Invoices count:', invoices.value.length);
    console.log('  - Summary data:', summaryData.value);
    console.log('  - Summary computed:', summary.value);
  } catch (error) {
    console.error('❌ Error generating report:', error);
    showToast('Error generating report', 'error');
  } finally {
    console.log('🏁 Setting loading to false');
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
  
  console.log('📅 Date calculation debug:', {
    now: now.toISOString(),
    today: today.toISOString(),
    todayFormatted: formatDate(today),
    currentYear: now.getFullYear(),
    currentMonth: now.getMonth(),
    currentDate: now.getDate()
  });
  
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
    
    const response = await apiClient.feeInvoices.getSummary(params);
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
      // Send a very large limit to get all invoices since we're handling pagination on frontend
      limit: 10000, // Large limit to get all invoices
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
      response = await apiClient.feeInvoices.getReport(params);
      console.log('📊 Report response from feeInvoices.getReport:', response);
    } catch (error) {
      console.log('⚠️ feeInvoices.getReport failed, trying invoices.getAll...');
      try {
        response = await apiClient.invoices.getAll(params);
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
    
    const response = await apiClient.schools.getAll();
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

const fetchStreams = async () => {
  try {
    const params = {};
    if (filters.branch_id) {
      params.branch_id = filters.branch_id;
    }
    if (filters.class_id) {
      params.class_id = filters.class_id;
    }
    const response = await apiClient.streams.getAll(params);
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
    const response = await apiClient.sections.getAll(params);
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
    const response = await apiClient.feeTypes.getAll();
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

const printReport = () => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank', 'width=1200,height=800');
  
  // Get the current date for the report header
  const currentDate = new Date().toLocaleDateString('en-IN');
  
  // Get filter display values
  const getBranchName = () => {
    if (!filters.branch_id) return 'All Branches';
    return branches.value.find(b => b.id === filters.branch_id)?.name || 'Unknown Branch';
  };
  
  const getClassName = () => {
    if (!filters.class_name) return 'All Classes';
    return filters.class_name;
  };
  
  const getSectionName = () => {
    if (!filters.section_name) return 'All Sections';
    return filters.section_name;
  };
  
  const getFeeTypeName = () => {
    if (!filters.fee_type) return 'All Fee Types';
    return filters.fee_type;
  };
  
  const getDateRangeText = () => {
    if (filters.dateRange === 'custom') {
      return `${filters.fromDate} to ${filters.toDate}`;
    }
    return filters.dateRange.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };
  
  // Create the print content following receipt structure
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Fee Collection Report</title>
      <style>
        @media print {
          body { margin: 0; padding: 0; }
          .receipt-header { 
            background: #f8f9fa !important; 
            color: #000 !important; 
            padding: 20px;
            border-bottom: 2px solid #333;
            text-align: center;
          }
          .receipt-info {
            background: #f8f9fa !important;
            color: #000 !important;
            padding: 15px;
            margin: 10px 0;
            border: 1px solid #ddd;
          }
          .receipt-summary {
            background: #f8f9fa !important;
            color: #000 !important;
            padding: 15px;
            margin: 10px 0;
            border: 1px solid #ddd;
          }
          .receipt-table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 20px;
          }
          .receipt-table th, .receipt-table td {
            border: 1px solid #000 !important;
            padding: 8px !important;
            text-align: left !important;
            color: #000 !important;
            font-size: 11px !important;
          }
          .receipt-table th {
            background: #f8f9fa !important;
            font-weight: bold !important;
          }
          .amount-paid { color: #059669 !important; font-weight: bold; }
          .amount-pending { color: #dc2626 !important; font-weight: bold; }
          .amount-total { color: #000 !important; font-weight: bold; }
          .receipt-footer {
            background: #f8f9fa !important;
            color: #000 !important;
            padding: 15px;
            margin-top: 20px;
            border-top: 2px solid #333;
            text-align: center;
          }
        }
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 20px; 
          background-color: #ffffff;
          color: #000000;
        }
        .receipt-header {
          text-align: center;
          padding: 20px;
          border-bottom: 2px solid #333;
          background: #f8f9fa;
          color: #000;
        }
        .receipt-info {
          background: #f8f9fa;
          color: #000;
          padding: 15px;
          margin: 10px 0;
          border: 1px solid #ddd;
        }
        .receipt-summary {
          background: #f8f9fa;
          color: #000;
          padding: 15px;
          margin: 10px 0;
          border: 1px solid #ddd;
        }
        .receipt-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        .receipt-table th, .receipt-table td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
          color: #000;
          font-size: 11px;
        }
        .receipt-table th {
          background: #f8f9fa;
          font-weight: bold;
        }
        .amount-paid { color: #059669; font-weight: bold; }
        .amount-pending { color: #dc2626; font-weight: bold; }
        .amount-total { color: #000; font-weight: bold; }
        .receipt-footer {
          background: #f8f9fa;
          color: #000;
          padding: 15px;
          margin-top: 20px;
          border-top: 2px solid #333;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="receipt-header">
        <h1>Fee Collection Report</h1>
        <p><strong>Generated on:</strong> ${currentDate}</p>
        <p><strong>Report Period:</strong> ${getDateRangeText()}</p>
      </div>
      
      <div class="receipt-info">
        <h3>Report Filters:</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div><strong>Branch:</strong> ${getBranchName()}</div>
          <div><strong>Class:</strong> ${getClassName()}</div>
          <div><strong>Section:</strong> ${getSectionName()}</div>
          <div><strong>Fee Type:</strong> ${getFeeTypeName()}</div>
          <div><strong>Payment Status:</strong> ${filters.status || 'All Status'}</div>
          <div><strong>Payment Method:</strong> ${filters.payment_method || 'All Methods'}</div>
        </div>
      </div>
      
      <div class="receipt-summary">
        <h3>Financial Summary:</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 20px; margin-top: 15px;">
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #000;">₹${formatCurrency(summary.value.totalAmount)}</div>
            <div style="font-size: 14px; color: #666;">Total Amount</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #059669;">₹${formatCurrency(summary.value.totalCollected)}</div>
            <div style="font-size: 14px; color: #666;">Total Collected</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #dc2626;">₹${formatCurrency(summary.value.totalPending)}</div>
            <div style="font-size: 14px; color: #666;">Total Pending</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #2563eb;">${summary.value.collectionRate}%</div>
            <div style="font-size: 14px; color: #666;">Collection Rate</div>
          </div>
        </div>
      </div>
      
      <table class="receipt-table">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Student Name</th>
            <th>Admission #</th>
            <th>Class</th>
            <th>Fee Type</th>
            <th>Due Date</th>
            <th>Total Amount</th>
            <th>Paid Amount</th>
            <th>Pending Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${invoices.value.map(invoice => `
            <tr>
              <td>${invoice.invoice_number || 'N/A'}</td>
              <td>${invoice.student?.first_name || ''} ${invoice.student?.last_name || ''}</td>
              <td>${invoice.student?.admission_number || 'N/A'}</td>
              <td>${invoice.student?.current_class || 'N/A'}${invoice.student?.section ? `-${invoice.student.section}` : ''}</td>
              <td>${invoice.feeStructure?.feeType?.name || 'Monthly Fees'}</td>
              <td>${formatDate(invoice.due_date)}</td>
              <td class="amount-total">₹${formatCurrency(invoice.total_amount)}</td>
              <td class="amount-paid">₹${formatCurrency(invoice.paid_amount)}</td>
              <td class="amount-pending">₹${formatCurrency(invoice.balance_amount || 0)}</td>
              <td>${getStatusText(invoice.status)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="6" style="font-weight: bold;">Total:</td>
            <td class="amount-total">₹${formatCurrency(summary.value.totalAmount)}</td>
            <td class="amount-paid">₹${formatCurrency(summary.value.totalCollected)}</td>
            <td class="amount-pending">₹${formatCurrency(summary.value.totalPending)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
      
      <div class="receipt-footer">
        <p><strong>Report Generated by:</strong> ${authStore.user?.name || 'System'}</p>
        <p><strong>Total Records:</strong> ${invoices.value.length}</p>
        <p><strong>Page:</strong> ${currentPage.value}</p>
      </div>
    </body>
    </html>
  `;
  
  printWindow.document.write(printContent);
  printWindow.document.close();
  
  // Wait for content to load then print
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
};

const downloadDetailedReport = async () => {
  try {
    console.log('📊 Starting Excel download with filters:', filters);
    
    // First, ensure we have the latest data by fetching both report and summary
    if (invoices.value.length === 0) {
      console.log('📊 No data available, fetching report data first...');
      await Promise.all([
        fetchReport(),
        fetchReportSummary()
      ]);
    }
    
    // Get current summary data
    const currentSummary = summary.value;
    const currentDate = new Date().toLocaleDateString('en-IN');
    
    console.log('📊 Current summary data for Excel:', currentSummary);
    
    // Build query string from filters (using same logic as fetchReport)
    const queryParams = new URLSearchParams();
    
    // Add basic filters
    if (filters.student_search && filters.student_search.trim() !== '') {
      queryParams.append('search', filters.student_search);
    }
    if (filters.status && filters.status.trim() !== '') {
      queryParams.append('status', filters.status);
    }
    if (filters.branch_id && filters.branch_id.trim() !== '') {
      queryParams.append('branch_id', filters.branch_id);
    }
    
    // Add date parameters (using same logic as fetchReport)
    if (filters.fromDate && filters.fromDate.trim() !== '') {
      queryParams.append('from_date', filters.fromDate);
    }
    if (filters.toDate && filters.toDate.trim() !== '') {
      queryParams.append('to_date', filters.toDate);
    }
    
    // Add class name if selected
    if (filters.class_id && filters.class_id !== '') {
      const selectedClass = classes.value.find(cls => cls.id === filters.class_id);
      if (selectedClass) {
        queryParams.append('class_name', selectedClass.name);
      }
    }
    
    // Add section name if selected
    if (filters.section_id && filters.section_id !== '') {
      const selectedSection = sections.value.find(sec => sec.id === filters.section_id);
      if (selectedSection) {
        queryParams.append('section', selectedSection.name);
      }
    }
    
    // Add summary data to query params so backend can include it
    queryParams.append('include_summary', 'true');
    queryParams.append('summary_total_amount', currentSummary.totalAmount.toString());
    queryParams.append('summary_total_collected', currentSummary.totalCollected.toString());
    queryParams.append('summary_total_pending', currentSummary.totalPending.toString());
    queryParams.append('summary_collection_rate', currentSummary.collectionRate.toString());
    queryParams.append('summary_total_invoices', invoices.value.length.toString());
    queryParams.append('summary_total_students', groupedInvoices.value.length.toString());
    
    console.log('📊 Excel download query params:', queryParams.toString());
    
    const response = await apiClient.feeInvoices.exportReport(queryParams.toString());
    
    // Check if response is successful
    if (!response || !response.data) {
      throw new Error('No data received from server');
    }
    
    // Create blob and download
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fee-collection-report-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    showToast('Fee collection report downloaded successfully', 'success');
    console.log('✅ Excel download completed successfully');
  } catch (error) {
    console.error('❌ Error downloading Excel report:', error);
    showToast('Error downloading fee collection report', 'error');
  }
};

const generatePDFContent = () => {
  // Get current filter values for the report header
  const getFilterText = () => {
    const filterTexts = [];
    if (filters.dateRange && filters.dateRange !== 'all_time') {
      filterTexts.push(`Date Range: ${filters.dateRange.replace('_', ' ').toUpperCase()}`);
    }
    if (filters.fromDate && filters.toDate) {
      filterTexts.push(`From: ${formatDate(filters.fromDate)} To: ${formatDate(filters.toDate)}`);
    }
    if (filters.branch_id) {
      const branch = branches.value.find(b => b.id === filters.branch_id);
      if (branch) filterTexts.push(`Branch: ${branch.name}`);
    }
    if (filters.class_id) {
      const classItem = classes.value.find(c => c.id === filters.class_id);
      if (classItem) filterTexts.push(`Class: ${classItem.name}`);
    }
    if (filters.section_id) {
      const section = sections.value.find(s => s.id === filters.section_id);
      if (section) filterTexts.push(`Section: ${section.name}`);
    }
    if (filters.status && filters.status !== 'all') {
      filterTexts.push(`Status: ${filters.status.toUpperCase()}`);
    }
    if (filters.student_search) {
      filterTexts.push(`Student Search: ${filters.student_search}`);
    }
    return filterTexts.length > 0 ? filterTexts.join(' | ') : 'All Records';
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Fee Collection Report</title>
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
        .status-paid { color: #28a745; font-weight: bold; }
        .status-partial { color: #ffc107; font-weight: bold; }
        .status-unpaid { color: #dc3545; font-weight: bold; }
        .status-overdue { color: #dc3545; font-weight: bold; }
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
        <div class="report-title">Fee Collection Report</div>
        <div class="report-date">Generated on: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}</div>
      </div>
      
      <div class="filters">
        <strong>Applied Filters:</strong> ${getFilterText()}
      </div>
      
      <div class="summary-cards">
        <div class="summary-card">
          <div class="summary-value">₹${formatCurrency(summaryData.value.totalAmount)}</div>
          <div class="summary-label">Total Amount</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">₹${formatCurrency(summaryData.value.totalCollected)}</div>
          <div class="summary-label">Total Collected</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">₹${formatCurrency(summaryData.value.totalPending)}</div>
          <div class="summary-label">Total Pending</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${summaryData.value.collectionRate}%</div>
          <div class="summary-label">Collection Rate</div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Student</th>
            <th>Class</th>
            <th>Fee Type</th>
            <th>Amount</th>
            <th>Paid</th>
            <th>Due Date</th>
            <th>Days Overdue</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${invoices.value.map(invoice => `
            <tr>
              <td>${invoice.invoice_number || invoice.id}</td>
              <td>${invoice.student?.first_name ? `${invoice.student.first_name} ${invoice.student.last_name || ''}` : 'N/A'}</td>
              <td>${invoice.student?.current_class || 'N/A'}</td>
              <td>${invoice.fee_structure?.fee_type?.name || invoice.fee_type_name || 'N/A'}</td>
              <td>₹${formatCurrency(invoice.total_amount)}</td>
              <td>₹${formatCurrency(invoice.paid_amount)}</td>
              <td>${formatDate(invoice.due_date)}</td>
              <td>${getDaysOverdue(invoice.due_date)}</td>
              <td class="status-${invoice.status}">${getStatusText(invoice.status)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        Total Records: ${invoices.value.length} | Generated on: ${new Date().toLocaleString('en-IN')}
      </div>
    </body>
    </html>
  `;
};

const downloadPDFReport = async () => {
  try {
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

// Remove automatic report generation - user must click "Apply Filters"

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
      fetchSections()
    ]);
    
    // Set default date range
    handleDateRangeChange();
    
    console.log('✅ Page initialization complete');
    
    // Don't load any data initially - user must click "Apply Filters"
    console.log('📊 No initial data loaded - waiting for user to apply filters');
    
  } catch (error) {
    console.error('❌ Error initializing page:', error);
    showToast('Error loading report data', 'error');
  } finally {
    isInitializing.value = false;
  }
});
</script> 