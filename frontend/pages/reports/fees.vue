<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Fee Reports</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">Comprehensive fee collection analytics and insights</p>
        </div>
        <div class="mt-4 sm:mt-0 sm:flex sm:space-x-3">
          <button
            @click="exportReport"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Download class="-ml-1 mr-2 h-5 w-5" />
            Export Report
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <DollarSign class="h-6 w-6 text-green-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Collection</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">₹{{ formatCurrency(stats.totalCollection || 0) }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <Clock class="h-6 w-6 text-yellow-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Pending Collection</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">₹{{ formatCurrency(stats.pendingCollection || 0) }}</dd>
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
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Overdue Amount</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">₹{{ formatCurrency(stats.overdueAmount || 0) }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <Receipt class="h-6 w-6 text-blue-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Invoices</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ stats.totalInvoices || 0 }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
        <div class="px-4 py-5 sm:p-6">
          <div class="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Date Range</label>
              <select v-model="filters.dateRange" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            <div v-if="filters.dateRange === 'custom'">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">From Date</label>
              <input v-model="filters.fromDate" type="date" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
            <div v-if="filters.dateRange === 'custom'">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">To Date</label>
              <input v-model="filters.toDate" type="date" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Class</label>
              <select v-model="filters.class_name" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                <option value="">All Classes</option>
                <option v-for="classItem in classes" :key="classItem.id" :value="classItem.name">{{ classItem.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <select v-model="filters.status" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                <option value="">All Status</option>
                <option value="paid">Paid</option>
                <option value="partial_paid">Partial Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div class="flex items-end">
              <button
                @click="fetchReport"
                class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Search class="-ml-1 mr-2 h-4 w-4" />
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Collection Trend Chart -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Collection Trend</h3>
          <div class="h-64">
            <canvas ref="trendChart" id="trendChart"></canvas>
          </div>
        </div>

        <!-- Fee Type Distribution Chart -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Collection by Fee Type</h3>
          <div class="h-64">
            <canvas ref="distributionChart" id="distributionChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Invoices Table -->
      <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">Fee Collection Report</h3>
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
              <tr v-for="invoice in invoices" :key="invoice.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {{ invoice.invoice_number }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <img v-if="invoice.student?.photo" :src="invoice.student.photo" alt="" class="h-10 w-10 rounded-full" />
                      <div v-else class="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
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
                    v-if="invoice.status !== 'paid'"
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

// Register Chart.js components
Chart.register(...registerables);

// Get auth store
const authStore = useAuthStore();

// State
const invoices = ref([]);
const stats = ref({});
const classes = ref([]);
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
  status: '',
});

// Charts
const trendChartInstance = ref(null);
const distributionChartInstance = ref(null);
const trendChartData = ref({ labels: [], data: [] });
const distributionChartData = ref({ labels: [], data: [] });

// Methods
const fetchReport = async () => {
  isLoading.value = true;
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      ...filters
    };
    
    console.log('🔍 Fetching fee report with params:', params);
    const response = await apiClient.feeInvoices.getReport(params);
    console.log('🔍 Fee report response:', response);
    
    invoices.value = response.data?.invoices || response.data?.items || [];
    totalItems.value = response.data?.pagination?.total_records || response.pagination?.total || 0;
    totalPages.value = response.data?.pagination?.total_pages || response.pagination?.totalPages || 0;
    // Fetch and update chart data
    await fetchChartData();
    await initCharts();
  } catch (error) {
    console.error('Error fetching fee report:', error);
  } finally {
    isLoading.value = false;
  }
};

const fetchStats = async () => {
  try {
    console.log('🔍 Fetching fee stats...');
    const response = await apiClient.feeInvoices.getStats();
    console.log('🔍 Fee stats response:', response);
    stats.value = response.data || {};
  } catch (error) {
    console.error('Error fetching fee stats:', error);
  }
};

const fetchClasses = async () => {
  try {
    console.log('🔍 Fetching classes...');
    const response = await apiClient.classes.getAll();
    console.log('🔍 Classes response:', response);
    classes.value = response.data || [];
  } catch (error) {
    console.error('Error fetching classes:', error);
  }
};

const exportReport = async () => {
  try {
    const params = new URLSearchParams(filters);
    const response = await apiClient.feeInvoices.exportReport(params.toString());
    
    // Create download link
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fee-report-${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting report:', error);
  }
};

const viewInvoice = (invoice) => {
  navigateTo(`/fees/invoices/${invoice.id}`);
};

const recordPayment = (invoice) => {
  navigateTo(`/fees/invoices/${invoice.id}?action=pay`);
};

// Fetch chart data from backend
const fetchChartData = async () => {
  // Fetch trend data (collection over time)
  try {
    // Example: Use feeInvoices.getReport to get collection trend by month
    const params = { ...filters, groupBy: 'month' };
    const response = await apiClient.feeInvoices.getReport(params);
    // Assume backend returns { trend: [{ label: 'Jan', amount: 1000 }, ...], distribution: [{ label: 'Academic', amount: 5000 }, ...] }
    const trend = response.data?.trend || [];
    trendChartData.value.labels = trend.map(item => item.label);
    trendChartData.value.data = trend.map(item => item.amount);
    
    // Fetch distribution data (by fee type)
    const distribution = response.data?.distribution || [];
    distributionChartData.value.labels = distribution.map(item => item.label);
    distributionChartData.value.data = distribution.map(item => item.amount);
  } catch (error) {
    console.error('Error fetching chart data:', error);
    trendChartData.value = { labels: [], data: [] };
    distributionChartData.value = { labels: [], data: [] };
  }
};

const initCharts = async () => {
  await nextTick();
  // Destroy previous instances
  if (trendChartInstance.value) trendChartInstance.value.destroy();
  if (distributionChartInstance.value) distributionChartInstance.value.destroy();
  const trendCtx = document.getElementById('trendChart').getContext('2d');
  const distributionCtx = document.getElementById('distributionChart').getContext('2d');
  trendChartInstance.value = new Chart(trendCtx, {
    type: 'line',
    data: {
      labels: trendChartData.value.labels,
      datasets: [
        {
          label: 'Collection',
          data: trendChartData.value.data,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.2)',
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
    },
  });
  distributionChartInstance.value = new Chart(distributionCtx, {
    type: 'doughnut',
    data: {
      labels: distributionChartData.value.labels,
      datasets: [
        {
          data: distributionChartData.value.data,
          backgroundColor: ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#a21caf', '#0ea5e9'],
          hoverBackgroundColor: ['#4f46e5', '#d97706', '#059669', '#dc2626', '#7e22ce', '#0369a1'],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } },
    },
  });
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
  console.log('🔍 User authentication status:', {
    isLoggedIn: authStore.isLoggedIn,
    userRole: authStore.userRole,
    user: authStore.currentUser,
    schoolId: authStore.currentUser?.school_id,
    branchId: authStore.currentUser?.branch_id
  });
  
  await Promise.all([
    fetchReport(),
    fetchStats(),
    fetchClasses()
  ]);
});
</script> 