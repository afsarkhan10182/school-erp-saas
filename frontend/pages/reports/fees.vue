<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Enhanced Header with better styling -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div class="mb-4 sm:mb-0">
          <h1 class="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Fee Analytics & Reports
          </h1>
          <p class="mt-2 text-lg text-gray-600 dark:text-gray-300">Comprehensive fee collection analytics, trends, and insights</p>
        </div>
        <div class="flex flex-col sm:flex-row gap-3">
          <button
            @click="exportSummaryReport"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm"
          >
            <Download class="-ml-1 mr-2 h-4 w-4" />
            Export Summary
          </button>
          <button
            @click="exportDetailedReport"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Download class="-ml-1 mr-2 h-5 w-5" />
            Export Detailed Report
          </button>
        </div>
      </div>

      <!-- Enhanced Stats Cards with better visual hierarchy -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div class="p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                  <DollarSign class="h-6 w-6 text-white" />
                </div>
              </div>
              <div class="ml-4 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Collection</dt>
                  <dd class="text-2xl font-bold text-gray-900 dark:text-white">₹{{ formatCurrency(stats.totalCollection || 0) }}</dd>
                  <dd class="text-sm text-green-600 dark:text-green-400 font-medium">
                    +{{ stats.collectionGrowth || 0 }}% vs last month
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div class="p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <Clock class="h-6 w-6 text-white" />
                </div>
              </div>
              <div class="ml-4 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Pending Collection</dt>
                  <dd class="text-2xl font-bold text-gray-900 dark:text-white">₹{{ formatCurrency(stats.pendingCollection || 0) }}</dd>
                  <dd class="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                    {{ stats.pendingPercentage || 0 }}% of total
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div class="p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-12 h-12 bg-gradient-to-r from-red-400 to-red-600 rounded-lg flex items-center justify-center">
                  <AlertTriangle class="h-6 w-6 text-white" />
                </div>
              </div>
              <div class="ml-4 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Overdue Amount</dt>
                  <dd class="text-2xl font-bold text-gray-900 dark:text-white">₹{{ formatCurrency(stats.overdueAmount || 0) }}</dd>
                  <dd class="text-sm text-red-600 dark:text-red-400 font-medium">
                    {{ stats.overdueInvoices || 0 }} invoices
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div class="p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <TrendingUp class="h-6 w-6 text-white" />
                </div>
              </div>
              <div class="ml-4 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Collection Rate</dt>
                  <dd class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.collectionRate || 0 }}%</dd>
                  <dd class="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    Target: 95%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Filters with better layout -->
      <div class="bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 mb-8">
        <div class="px-6 py-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Advanced Analytics Filters</h3>
            <button
              @click="resetFilters"
              class="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
            >
              Reset Filters
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
              <select v-model="filters.dateRange" @change="handleDateRangeChange" class="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200">
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            <div v-if="filters.dateRange === 'custom'">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">From Date</label>
              <input v-model="filters.fromDate" type="date" class="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200" />
            </div>
            <div v-if="filters.dateRange === 'custom'">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To Date</label>
              <input v-model="filters.toDate" type="date" class="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Class</label>
              <select v-model="filters.class_name" class="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200">
                <option value="">All Classes</option>
                <option v-for="classItem in classes" :key="classItem.id" :value="classItem.name">{{ classItem.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fee Type</label>
              <select v-model="filters.fee_type" class="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200">
                <option value="">All Fee Types</option>
                <option v-for="feeType in feeTypes" :key="feeType.id" :value="feeType.name">{{ feeType.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Status</label>
              <select v-model="filters.status" class="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200">
                <option value="">All Status</option>
                <option value="paid">Paid</option>
                <option value="partial_paid">Partial Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Collection Method</label>
              <select v-model="filters.payment_method" class="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200">
                <option value="">All Methods</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="online">Online</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
            <div class="flex items-end">
              <button
                @click="generateAnalytics"
                :disabled="isLoading"
                class="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Search class="-ml-1 mr-2 h-4 w-4" />
                {{ isLoading ? 'Generating...' : 'Generate Analytics' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Analytics Dashboard -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- Collection Trend Chart -->
        <div class="bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Collection Trend</h3>
            <select v-model="trendPeriod" @change="updateTrendChart" class="text-sm border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 px-3 py-1 focus:border-indigo-500 focus:ring-indigo-500">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div class="h-80">
            <canvas ref="trendChart" id="trendChart"></canvas>
          </div>
        </div>

        <!-- Fee Type Distribution Chart -->
        <div class="bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Collection by Fee Type</h3>
          <div class="h-80">
            <canvas ref="distributionChart" id="distributionChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Enhanced Performance Metrics -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <!-- Class Performance -->
        <div class="bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Class Performance</h3>
          <div class="space-y-4">
            <div v-for="classPerf in classPerformance" :key="classPerf.class" class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ classPerf.class }}</span>
              <div class="flex items-center space-x-3">
                <div class="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div class="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500" :style="{ width: classPerf.rate + '%' }"></div>
                </div>
                <span class="text-sm font-bold text-gray-900 dark:text-white min-w-[3rem]">{{ classPerf.rate }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Methods Analysis -->
        <div class="bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Payment Methods</h3>
          <div class="space-y-4">
            <div v-for="method in paymentMethods" :key="method.method" class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ method.method }}</span>
              <div class="flex items-center space-x-2">
                <span class="text-sm font-bold text-gray-900 dark:text-white">₹{{ formatCurrency(method.amount) }}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">({{ method.percentage }}%)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Defaulters -->
        <div class="bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Top Defaulters</h3>
          <div class="space-y-4">
            <div v-for="defaulter in topDefaulters" :key="defaulter.id" class="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div>
                <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ defaulter.name }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ defaulter.class }}</p>
              </div>
              <span class="text-sm font-bold text-red-600 dark:text-red-400">₹{{ formatCurrency(defaulter.amount) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Detailed Report Table -->
      <div class="bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="px-6 py-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Detailed Fee Collection Report</h3>
          <div class="flex space-x-3">
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ totalItems }} total records
            </span>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Invoice</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Class</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fee Type</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paid</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due Date</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Days Overdue</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="invoice in invoices" :key="invoice.id" class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {{ invoice.invoice_number }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <img v-if="invoice.student?.photo" :src="invoice.student.photo" alt="" class="h-10 w-10 rounded-full object-cover" />
                      <div v-else class="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center justify-center">
                        <span class="text-sm font-medium text-white">
                          {{ invoice.student?.first_name?.charAt(0) }}{{ invoice.student?.last_name?.charAt(0) }}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ invoice.student?.first_name }} {{ invoice.student?.last_name }}
                      </div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">
                        {{ invoice.student?.admission_number }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ invoice.student?.class?.name || invoice.class_name }}{{ invoice.student?.section?.name ? `-${invoice.student.section.name}` : '' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ invoice.fee_type_name || invoice.feeStructure?.feeType?.name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                  ₹{{ formatCurrency(invoice.total_amount) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  ₹{{ formatCurrency(invoice.paid_amount) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ formatDate(invoice.due_date) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <span v-if="getDaysOverdue(invoice.due_date) > 0" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    {{ getDaysOverdue(invoice.due_date) }} days
                  </span>
                  <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    On time
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getStatusClass(invoice.status)" class="inline-flex px-3 py-1 text-xs font-semibold rounded-full">
                    {{ getStatusText(invoice.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    @click="viewInvoice(invoice)"
                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3 font-medium"
                  >
                    View
                  </button>
                  <button
                    v-if="invoice.status !== 'paid'"
                    @click="recordPayment(invoice)"
                    class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 font-medium"
                  >
                    Pay
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Enhanced Pagination -->
        <div class="bg-white dark:bg-gray-800 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
          <div class="flex-1 flex justify-between sm:hidden">
            <button
              @click="previousPage"
              :disabled="currentPage === 1"
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
            >
              Previous
            </button>
            <button
              @click="nextPage"
              :disabled="currentPage >= totalPages"
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
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
              <nav class="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
                <button
                  @click="previousPage"
                  :disabled="currentPage === 1"
                  class="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
                >
                  Previous
                </button>
                <button
                  @click="nextPage"
                  :disabled="currentPage >= totalPages"
                  class="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { 
  Download, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  Receipt,
  Search,
  TrendingUp,
  PieChart
} from 'lucide-vue-next';
import apiClient from '~/utils/api';
import { Chart, registerables } from 'chart.js';
import { useAuthStore } from '~/stores/auth';
import { useToast } from '~/composables/useToast';

// Register Chart.js components
Chart.register(...registerables);

// Get auth store and toast
const authStore = useAuthStore();
const { showToast } = useToast();

// State
const invoices = ref([]);
const stats = ref({});
const classes = ref([]);
const feeTypes = ref([]);
const isLoading = ref(false);

// Pagination
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);
const totalPages = ref(0);

// Filters
const filters = reactive({
  dateRange: 'month',
  fromDate: '',
  toDate: '',
  class_name: '',
  fee_type: '',
  status: '',
  payment_method: '',
});

// Analytics data
const trendPeriod = ref('monthly');
const classPerformance = ref([]);
const paymentMethods = ref([]);
const topDefaulters = ref([]);

// Charts
const trendChartInstance = ref(null);
const distributionChartInstance = ref(null);
const trendChartData = ref({ labels: [], data: [] });
const distributionChartData = ref({ labels: [], data: [] });

// Methods
const generateAnalytics = async () => {
  isLoading.value = true;
  try {
    await Promise.all([
      fetchReport(),
      fetchStats(),
      fetchAnalyticsData()
    ]);
  } catch (error) {
    showToast('Error generating analytics', 'error');
  } finally {
    isLoading.value = false;
  }
};

const resetFilters = () => {
  Object.assign(filters, {
    dateRange: 'month',
    fromDate: '',
    toDate: '',
    class_name: '',
    fee_type: '',
    status: '',
    payment_method: '',
  });
  handleDateRangeChange();
  generateAnalytics();
};

const fetchReport = async () => {
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      ...filters
    };
    
    const response = await apiClient.feeInvoices.getReport(params);
    
    invoices.value = response.data?.invoices || response.data?.items || [];
    totalItems.value = response.data?.pagination?.total_records || response.pagination?.total || 0;
    totalPages.value = response.data?.pagination?.total_pages || response.pagination?.totalPages || 0;
  } catch (error) {
    showToast('Error fetching fee report', 'error');
  }
};

const fetchStats = async () => {
  try {
    const response = await apiClient.feeInvoices.getStats();
    stats.value = response.data || {};
    
    // Calculate additional metrics
    if (stats.value.totalCollection && stats.value.pendingCollection) {
      stats.value.collectionRate = Math.round(((stats.value.totalCollection - stats.value.pendingCollection) / stats.value.totalCollection) * 100);
    }
  } catch (error) {
    showToast('Error fetching fee stats', 'error');
  }
};

const fetchAnalyticsData = async () => {
  try {
    // Fetch class performance data
    const classResponse = await apiClient.feeInvoices.getReport({ 
      ...filters, 
      groupBy: 'class',
      limit: 1000 
    });
    
    // Process class performance
    const classData = classResponse.data?.invoices || [];
    const classMap = new Map();
    
    classData.forEach(invoice => {
      const className = invoice.student?.class?.name || invoice.class_name;
      if (!classMap.has(className)) {
        classMap.set(className, { total: 0, paid: 0 });
      }
      const classStats = classMap.get(className);
      classStats.total += parseFloat(invoice.total_amount || 0);
      classStats.paid += parseFloat(invoice.paid_amount || 0);
    });
    
    classPerformance.value = Array.from(classMap.entries()).map(([className, stats]) => ({
      class: className,
      rate: stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0
    })).sort((a, b) => b.rate - a.rate);

    // Fetch payment methods data
    const paymentResponse = await apiClient.feeInvoices.getReport({ 
      ...filters, 
      groupBy: 'payment_method',
      limit: 1000 
    });
    
    // Process payment methods from real data
    const paymentData = paymentResponse.data?.invoices || [];
    const paymentMethodMap = new Map();
    let totalPaymentAmount = 0;
    
    paymentData.forEach(invoice => {
      const method = invoice.payment_method || 'Unknown';
      const amount = parseFloat(invoice.paid_amount || 0);
      if (!paymentMethodMap.has(method)) {
        paymentMethodMap.set(method, 0);
      }
      paymentMethodMap.set(method, paymentMethodMap.get(method) + amount);
      totalPaymentAmount += amount;
    });
    
    paymentMethods.value = Array.from(paymentMethodMap.entries()).map(([method, amount]) => ({
      method: method.charAt(0).toUpperCase() + method.slice(1),
      amount: amount,
      percentage: totalPaymentAmount > 0 ? Math.round((amount / totalPaymentAmount) * 100) : 0
    })).sort((a, b) => b.amount - a.amount);

    // Fetch top defaulters
    const defaultersResponse = await apiClient.feeInvoices.getReport({ 
      ...filters, 
      status: 'overdue',
      limit: 10 
    });
    
    topDefaulters.value = (defaultersResponse.data?.invoices || []).map(invoice => ({
      id: invoice.id,
      name: `${invoice.student?.first_name} ${invoice.student?.last_name}`,
      class: invoice.student?.class?.name || invoice.class_name,
      amount: parseFloat(invoice.balance_amount || 0)
    })).sort((a, b) => b.amount - a.amount).slice(0, 5);

    // Generate real chart data from API responses
    generateChartData();
    
    // Update charts
    await updateCharts();
  } catch (error) {
    showToast('Error fetching analytics data', 'error');
  }
};

const generateChartData = () => {
  // Generate trend data from invoices
  const invoices = invoices.value;
  const monthlyData = new Map();
  
  invoices.forEach(invoice => {
    const date = new Date(invoice.created_at || invoice.invoice_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const amount = parseFloat(invoice.paid_amount || 0);
    
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, 0);
    }
    monthlyData.set(monthKey, monthlyData.get(monthKey) + amount);
  });
  
  // Sort by date and take last 6 months
  const sortedMonths = Array.from(monthlyData.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6);
  
  trendChartData.value = {
    labels: sortedMonths.map(([month]) => {
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }),
    data: sortedMonths.map(([, amount]) => amount)
  };
  
  // Generate distribution data from fee types
  const feeTypeData = new Map();
  let totalAmount = 0;
  
  invoices.forEach(invoice => {
    const feeType = invoice.fee_type_name || invoice.feeStructure?.feeType?.name || 'Other';
    const amount = parseFloat(invoice.total_amount || 0);
    
    if (!feeTypeData.has(feeType)) {
      feeTypeData.set(feeType, 0);
    }
    feeTypeData.set(feeType, feeTypeData.get(feeType) + amount);
    totalAmount += amount;
  });
  
  // Sort by amount and take top 5
  const sortedFeeTypes = Array.from(feeTypeData.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  distributionChartData.value = {
    labels: sortedFeeTypes.map(([feeType]) => feeType),
    data: sortedFeeTypes.map(([, amount]) => amount)
  };
};

const fetchClasses = async () => {
  try {
    const response = await apiClient.classes.getAll();
    classes.value = response.data || [];
  } catch (error) {
    showToast('Error fetching classes', 'error');
  }
};

const fetchFeeTypes = async () => {
  try {
    const response = await apiClient.feeTypes.getAll();
    feeTypes.value = response.data || [];
  } catch (error) {
    showToast('Error fetching fee types', 'error');
  }
};

const handleDateRangeChange = () => {
  if (filters.dateRange !== 'custom') {
    const now = new Date();
    let fromDate = new Date();
    
    switch (filters.dateRange) {
      case 'today':
        fromDate = now;
        break;
      case 'week':
        fromDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        fromDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        fromDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        fromDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    filters.fromDate = fromDate.toISOString().split('T')[0];
    filters.toDate = now.toISOString().split('T')[0];
  }
};

const updateCharts = async () => {
  await nextTick();
  
  // Destroy previous instances
  if (trendChartInstance.value) trendChartInstance.value.destroy();
  if (distributionChartInstance.value) distributionChartInstance.value.destroy();
  
  // Create trend chart
  const trendCtx = document.getElementById('trendChart')?.getContext('2d');
  if (trendCtx) {
    trendChartInstance.value = new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: trendChartData.value.labels.length > 0 ? trendChartData.value.labels : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Collection',
            data: trendChartData.value.data.length > 0 ? trendChartData.value.data : [0, 0, 0, 0, 0, 0],
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.2)',
            tension: 0.4,
            borderWidth: 3,
            pointBackgroundColor: '#4f46e5',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#4f46e5',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                return '₹' + context.parsed.y.toLocaleString('en-IN');
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(156, 163, 175, 0.1)',
            },
            ticks: {
              callback: function(value) {
                return '₹' + value.toLocaleString('en-IN');
              }
            }
          },
          x: {
            grid: {
              color: 'rgba(156, 163, 175, 0.1)',
            }
          }
        }
      },
    });
  }
  
  // Create distribution chart
  const distributionCtx = document.getElementById('distributionChart')?.getContext('2d');
  if (distributionCtx) {
    distributionChartInstance.value = new Chart(distributionCtx, {
      type: 'doughnut',
      data: {
        labels: distributionChartData.value.labels.length > 0 ? distributionChartData.value.labels : ['Academic Fee', 'Transport Fee', 'Library Fee', 'Sports Fee', 'Other'],
        datasets: [
          {
            data: distributionChartData.value.data.length > 0 ? distributionChartData.value.data : [0, 0, 0, 0, 0],
            backgroundColor: ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#a21caf'],
            hoverBackgroundColor: ['#4f46e5', '#d97706', '#059669', '#dc2626', '#7e22ce'],
            borderWidth: 2,
            borderColor: '#ffffff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { 
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#6366f1',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                return context.label + ': ' + context.parsed + '%';
              }
            }
          }
        }
      },
    });
  }
};

const updateTrendChart = () => {
  // Update trend chart based on selected period
  if (trendChartInstance.value) {
    // This would fetch new data based on trendPeriod
    // For now, just update the chart
  }
};

const exportDetailedReport = async () => {
  try {
    const params = new URLSearchParams(filters);
    const response = await apiClient.feeInvoices.exportReport(params.toString());
    
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fee-analytics-report-${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    showToast('Detailed report exported successfully', 'success');
  } catch (error) {
    showToast('Error exporting report', 'error');
  }
};

const exportSummaryReport = async () => {
  try {
    const params = new URLSearchParams({ ...filters, summary: 'true' });
    const response = await apiClient.feeInvoices.exportReport(params.toString());
    
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fee-summary-report-${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    showToast('Summary report exported successfully', 'success');
  } catch (error) {
    showToast('Error exporting summary report', 'error');
  }
};

const viewInvoice = (invoice) => {
  navigateTo(`/fees/invoices/${invoice.id}`);
};

const recordPayment = (invoice) => {
  navigateTo(`/fees/invoices/${invoice.id}?action=pay`);
};

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchReport();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchReport();
  }
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

onMounted(async () => {
  await Promise.all([
    fetchClasses(),
    fetchFeeTypes()
  ]);
  
  // Set default date range
  handleDateRangeChange();
  
  // Generate initial analytics
  await generateAnalytics();
});
</script> 