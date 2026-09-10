<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Module Access Error Alert -->
      <div
        v-if="$route.query.error === 'module_access_denied'"
        class="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
      >
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Module Access Denied</h3>
            <p class="mt-1 text-sm text-red-700 dark:text-red-300">
              You don't have access to <strong>{{ getModuleName($route.query.module) }}</strong
              >. This feature requires a higher subscription plan. Please contact your administrator
              to upgrade your subscription.
            </p>
          </div>
        </div>
      </div>

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          {{ dashboardTitle }}
        </h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Welcome back, {{ authStore.currentUser?.first_name || 'User' }}! Here's what's happening
          today.
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <span class="ml-3 text-lg text-gray-600 dark:text-gray-400">Loading dashboard...</span>
      </div>

      <!-- Dashboard Content -->
      <div v-else class="space-y-8">
        <!-- Row 1: Quick Stats + Branch Filter -->
        <div :class="['grid gap-4', gridLayout]">
          <!-- Total Students -->
          <div class="stat-card bg-blue-500 text-white p-4 rounded-xl shadow-sm">
            <Users class="w-5 h-5" />
            <p class="mt-1 text-xs font-medium">Total Students</p>
            <p class="text-xl font-bold">{{ stats.totalStudents || 0 }}</p>
          </div>

          <!-- Total Parents -->
          <div class="stat-card bg-indigo-500 text-white p-4 rounded-xl shadow-sm">
            <UserCheck class="w-5 h-5" />
            <p class="mt-1 text-xs font-medium">Total Parents</p>
            <p class="text-xl font-bold">{{ stats.totalParents || 0 }}</p>
          </div>

          <!-- Total Teachers -->
          <div class="stat-card bg-teal-500 text-white p-4 rounded-xl shadow-sm">
            <BookOpen class="w-5 h-5" />
            <p class="mt-1 text-xs font-medium">Total Teachers</p>
            <p class="text-xl font-bold">{{ stats.totalTeachers || 0 }}</p>
          </div>

          <!-- Total Employees/Staff -->
          <div class="stat-card bg-amber-500 text-white p-4 rounded-xl shadow-sm">
            <Activity class="w-5 h-5" />
            <p class="mt-1 text-xs font-medium">Total Staff</p>
            <p class="text-xl font-bold">{{ stats.totalEmployees || 0 }}</p>
          </div>

          <!-- New Students -->
          <div class="stat-card bg-green-500 text-white p-4 rounded-xl shadow-sm">
            <UserPlus class="w-5 h-5" />
            <p class="mt-1 text-xs font-medium">
              New Students ({{ stats.newStudentsDays || dashboardConfig.newStudentsDays }}d)
            </p>
            <p class="text-xl font-bold">{{ stats.newStudents || 0 }}</p>
          </div>

          <!-- This Month Collection -->
          <div v-if="isModuleEnabled('fees')" class="stat-card bg-purple-500 text-white p-4 rounded-xl shadow-sm">
            <DollarSign class="w-5 h-5" />
            <p class="mt-1 text-xs font-medium">This Month Collection</p>
            <p class="text-xl font-bold">₹{{ formatCurrency(stats.feeCollection || 0) }}</p>
          </div>

          <!-- Pending Fees -->
          <div v-if="isModuleEnabled('fees')" class="stat-card bg-red-500 text-white p-4 rounded-xl shadow-sm">
            <AlertTriangle class="w-5 h-5" />
            <p class="mt-1 text-xs font-medium">Pending Fees</p>
            <p class="text-xl font-bold">
              {{ (stats.pendingFees || 0) + (stats.overdueFees || 0) }}
            </p>
          </div>


        </div>

        <!-- Row 2: Core Insights -->
        <div :class="['grid gap-8', row2GridLayout]">
          <!-- Fee Collection Summary + Pie Chart -->
          <div
            v-if="isModuleEnabled('fees')"
            class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                Fee Collection Summary
                <span v-if="loadingAcademicYears" class="text-gray-500 dark:text-gray-400"
                  >(Loading...)</span
                >
                <span
                  v-else-if="feeCollectionSummary.academic_year"
                  class="text-gray-900 dark:text-white"
                  >({{ feeCollectionSummary.academic_year }})</span
                >
                <span v-else class="text-gray-500 dark:text-gray-400">(No data)</span>
              </h2>
              <div class="flex items-center space-x-2">
                <div class="relative">
                  <select
                    v-model="selectedAcademicYear"
                    :disabled="loadingAcademicYears || academicYears.length === 0"
                    class="appearance-none px-3 py-1.5 pr-8 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option v-if="loadingAcademicYears" value="">Loading academic years...</option>
                    <option v-else-if="academicYears.length === 0" value="">
                      No academic years available
                    </option>
                    <option v-for="year in academicYears" :key="year.id" :value="year.name">
                      {{ year.name }} {{ year.is_current ? '(Current)' : '' }}
                    </option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-400">
                    <ChevronDown class="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            <div v-if="loadingFeeSummary" class="flex items-center justify-center py-8">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span class="ml-2 text-sm text-gray-600 dark:text-gray-400"
                >Loading fee summary...</span
              >
            </div>

            <div v-else class="space-y-6">
              <!-- Summary Cards -->
              <div class="grid grid-cols-2 gap-4">
                <div
                  class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
                >
                  <div class="flex items-center">
                    <CheckCircle class="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                    <span class="text-sm font-medium text-green-800 dark:text-green-200"
                      >Total Collected</span
                    >
                  </div>
                  <p class="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                    ₹{{ formatCurrency(feeCollectionSummary.total_collected || 0) }}
                  </p>
                </div>

                <div
                  class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
                >
                  <div class="flex items-center">
                    <AlertTriangle class="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                    <span class="text-sm font-medium text-red-800 dark:text-red-200"
                      >Total Pending</span
                    >
                  </div>
                  <p class="text-2xl font-bold text-red-900 dark:text-red-100 mt-1">
                    ₹{{ formatCurrency(feeCollectionSummary.total_pending || 0) }}
                  </p>
                </div>
              </div>

              <!-- Fee Collection Chart -->
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 h-48">
                <canvas ref="feesChart"></canvas>
              </div>

              <!-- Additional Stats -->
              <div
                class="grid grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700"
              >
                <div class="text-center">
                  <p class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ feeCollectionSummary.total_invoices || 0 }}
                  </p>
                  <p class="text-xs text-gray-600 dark:text-gray-400">Total Invoices</p>
                </div>
                <div class="text-center">
                  <p class="text-lg font-semibold text-green-600 dark:text-green-400">
                    {{ feeCollectionSummary.paid_invoices || 0 }}
                  </p>
                  <p class="text-xs text-gray-600 dark:text-gray-400">Paid</p>
                </div>
                <div class="text-center">
                  <p class="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                    {{ feeCollectionSummary.pending_invoices || 0 }}
                  </p>
                  <p class="text-xs text-gray-600 dark:text-gray-400">Pending</p>
                </div>
                <div class="text-center">
                  <p class="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {{ feeCollectionSummary.collection_rate || 0 }}%
                  </p>
                  <p class="text-xs text-gray-600 dark:text-gray-400">Collection Rate</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Student Distribution + Monthly Trends -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Student Distribution & Trends
            </h2>

            <!-- Student Distribution Chart -->
            <div class="mb-6">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Student Distribution
              </h3>
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 h-48">
                <canvas ref="studentDistributionChart"></canvas>
              </div>
            </div>

            <!-- Monthly Trends -->
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Monthly Trends</h3>
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 h-48">
                <canvas ref="studentsChart"></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- Row 3: Extra Insights -->
        <div :class="['grid gap-8', row2GridLayout]">
          <!-- Fee Collection Trend (6 months) -->
          <div
            v-if="isModuleEnabled('fees')"
            class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Fee Collection Trend ({{ dashboardConfig.feeTrendMonths }} Months)
            </h2>
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 h-64">
              <canvas ref="feeTrendChart"></canvas>
            </div>
          </div>

          <!-- Upcoming Events + Recent Activities -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Recent Activities
            </h2>

            <!-- Recent Activities Section -->
            <div class="space-y-4">
              <div v-if="loadingActivities" class="flex items-center justify-center py-8">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span class="ml-2 text-sm text-gray-600 dark:text-gray-400"
                  >Loading activities...</span
                >
              </div>

              <div v-else-if="recentActivities.length === 0" class="text-center py-8">
                <div
                  class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <svg
                    class="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p class="text-gray-500 dark:text-gray-400">No recent activities</p>
              </div>

              <div v-else class="space-y-3">
                <div
                  v-for="activity in recentActivities"
                  :key="activity.id"
                  class="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div class="flex-shrink-0">
                    <div
                      class="w-8 h-8 rounded-full flex items-center justify-center"
                      :class="getActivityIcon(activity.type).bg"
                    >
                      <component
                        :is="getActivityIcon(activity.type).icon"
                        class="w-4 h-4"
                        :class="getActivityIcon(activity.type).text"
                      />
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ activity.description }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ formatDate(activity.created_at) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useAcademics } from '~/composables/useAcademics';
import { useBranches } from '~/composables/useBranches';
import { useModuleAccess } from '~/composables/useModuleAccess';
import { Dashboard } from '~/api';
import { useToast } from '~/composables/useToast';
import Chart from 'chart.js/auto';

// Icons
import {
  Users,
  UserPlus,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Activity,
  BookOpen,
  UserCheck,
  FileText,
  CreditCard,
  ChevronDown
} from 'lucide-vue-next';

// Auth store
const authStore = useAuthStore();
const { selectedBranchId, currentSchool } = useGlobalBranch();

// Module access
const { isModuleEnabled, loadUserModules } = useModuleAccess();

// Toast
const { showError } = useToast();

// Dashboard configuration
const dashboardConfig = {
  newStudentsDays: 30,
  feeTrendMonths: 6,
  activitiesLimit: 5
};

// Academic data
const { academicYears, currentAcademicYear, fetchAcademicYears } = useAcademics();

// Branch data
const { branches, loading: loadingBranches, fetchBranches } = useBranches();

// Computed property for grid layout - dynamic based on available modules and branches
const gridLayout = computed(() => {
  const hasFeesModule = isModuleEnabled('fees');
  const hasMultipleBranches = branches.value.length > 1;

  // Calculate total number of items
  let totalItems = 5; // Students, Parents, Teachers, Staff, New Students

  if (hasFeesModule) {
    totalItems += 2; // Collection + Pending Fees
  }

  if (hasMultipleBranches) {
    totalItems += 1; // Branch Filter
  }

  // Return responsive grid based on total items
  if (totalItems <= 4) {
    return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4';
  } else {
    return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-7';
  }
});

// Computed property for Row 2 grid layout
const row2GridLayout = computed(() => {
  const hasFeesModule = isModuleEnabled('fees');

  if (hasFeesModule) {
    return 'grid-cols-1 lg:grid-cols-2';
  } else {
    return 'grid-cols-1';
  }
});

// Reactive data
const loading = ref(true);
const loadingFeeSummary = ref(false);
const loadingAcademicYears = ref(false);
const loadingActivities = ref(false);
const selectedBranch = ref(selectedBranchId.value || '');
const selectedAcademicYear = ref('');

// Stats and data
const stats = ref({});
const feeCollectionSummary = ref({});
const recentActivities = ref([]);

// Chart refs
const studentsChart = ref(null);
const feesChart = ref(null);
const studentDistributionChart = ref(null);
const feeTrendChart = ref(null);

// Chart instances
let studentsChartInstance = null;
let feesChartInstance = null;
let studentDistributionChartInstance = null;
let feeTrendChartInstance = null;

// Format currency
const formatCurrency = amount => {
  if (!amount) return '0';
  return new Intl.NumberFormat('en-IN').format(amount);
};

// Format date
const formatDate = dateString => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Get module name from route path
const getModuleName = routePath => {
  if (!routePath) return 'the requested module';

  const moduleMap = {
    '/fees': 'Fee Management',
    '/fees/types': 'Fee Types',
    '/fees/structures': 'Fee Structures',
    '/fees/invoices': 'Fee Invoices',
    '/fees/collections': 'Fee Collections',
    '/reports/fees': 'Fee Reports',
    '/reports/receipts': 'Receipt Reports',
    '/students': 'Student Management',
    '/students/create': 'Student Registration',
    '/students/import': 'Student Import',
    '/reports/students': 'Student Reports',
    '/attendance': 'Attendance Management',
    '/reports/attendance': 'Attendance Reports',
    '/exams': 'Examination Management',
    '/reports/exams': 'Examination Reports',
    '/library': 'Library Management',
    '/reports/library': 'Library Reports',
    '/hr': 'HR Management',
    '/reports/hr': 'HR Reports',
    '/transport': 'Transport Management',
    '/reports/transport': 'Transport Reports',
    '/reports': 'Reports',
    '/reports/advanced': 'Advanced Reports'
  };

  return moduleMap[routePath] || 'the requested module';
};

// Get activity icon
const getActivityIcon = type => {
  const icons = {
    student_added: {
      icon: UserPlus,
      bg: 'bg-green-100 dark:bg-green-900/20',
      text: 'text-green-600 dark:text-green-400'
    },
    fee_paid: {
      icon: CreditCard,
      bg: 'bg-blue-100 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400'
    },
    invoice_generated: {
      icon: FileText,
      bg: 'bg-purple-100 dark:bg-purple-900/20',
      text: 'text-purple-600 dark:text-purple-400'
    },
    payment_received: {
      icon: DollarSign,
      bg: 'bg-green-100 dark:bg-green-900/20',
      text: 'text-green-600 dark:text-green-400'
    },
    default: {
      icon: Activity,
      bg: 'bg-gray-100 dark:bg-gray-700',
      text: 'text-gray-600 dark:text-gray-400'
    }
  };

  return icons[type] || icons.default;
};

// Create charts
const createCharts = (studentsData, feesData, studentDistributionData, feeTrendData) => {
  // Students Chart (Line Chart)
  if (studentsChart.value && studentsData) {
    if (studentsChartInstance) {
      studentsChartInstance.destroy();
    }

    studentsChartInstance = new Chart(studentsChart.value.getContext('2d'), {
      type: 'line',
      data: {
        labels: studentsData.labels || [],
        datasets: [
          {
            label: 'Students',
            data: studentsData.data || [],
            borderColor: 'rgb(147, 51, 234)',
            backgroundColor: 'rgba(147, 51, 234, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(156, 163, 175, 0.1)'
            },
            ticks: {
              color: '#6B7280'
            }
          },
          x: {
            grid: {
              color: 'rgba(156, 163, 175, 0.1)'
            },
            ticks: {
              color: '#6B7280'
            }
          }
        }
      }
    });
  }

  // Fee Collection Status Chart (Doughnut Chart)
  if (feesChart.value && feesData) {
    if (feesChartInstance) {
      feesChartInstance.destroy();
    }

    feesChartInstance = new Chart(feesChart.value.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: feesData.labels || [],
        datasets: [
          {
            data: feesData.data || [],
            backgroundColor: [
              'rgba(16, 185, 129, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(239, 68, 68, 0.8)'
            ],
            borderColor: ['rgb(16, 185, 129)', 'rgb(245, 158, 11)', 'rgb(239, 68, 68)'],
            borderWidth: 2,
            hoverOffset: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#6B7280',
              padding: 20,
              usePointStyle: true
            }
          }
        }
      }
    });
  }

  // Student Distribution Chart (Bar Chart)
  if (studentDistributionChart.value && studentDistributionData) {
    if (studentDistributionChartInstance) {
      studentDistributionChartInstance.destroy();
    }

    studentDistributionChartInstance = new Chart(studentDistributionChart.value.getContext('2d'), {
      type: 'bar',
      data: {
        labels: studentDistributionData.labels || [],
        datasets: [
          {
            label: 'Students',
            data: studentDistributionData.data || [],
            backgroundColor: 'rgba(147, 51, 234, 0.8)',
            borderColor: 'rgb(147, 51, 234)',
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(156, 163, 175, 0.1)'
            },
            ticks: {
              color: '#6B7280'
            }
          },
          x: {
            grid: {
              color: 'rgba(156, 163, 175, 0.1)'
            },
            ticks: {
              color: '#6B7280'
            }
          }
        }
      }
    });
  }

  // Fee Trend Chart (Line Chart)
  if (feeTrendChart.value && feeTrendData) {
    if (feeTrendChartInstance) {
      feeTrendChartInstance.destroy();
    }

    feeTrendChartInstance = new Chart(feeTrendChart.value.getContext('2d'), {
      type: 'line',
      data: {
        labels: feeTrendData.labels || [],
        datasets: [
          {
            label: 'Fee Collection',
            data: feeTrendData.data || [],
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(156, 163, 175, 0.1)'
            },
            ticks: {
              color: '#6B7280',
              callback: function (value) {
                return '₹' + value.toLocaleString();
              }
            }
          },
          x: {
            grid: {
              color: 'rgba(156, 163, 175, 0.1)'
            },
            ticks: {
              color: '#6B7280'
            }
          }
        }
      }
    });
  }
};

// Fetch dashboard data
const fetchDashboardData = async () => {
  try {
    loading.value = true;

    // Fetch stats and activities in parallel
    const [statsResponse, activitiesResponse] = await Promise.allSettled([
      Dashboard.getStats({
        branch_id: selectedBranch.value,
        new_students_days: dashboardConfig.newStudentsDays
      }),
      Dashboard.getRecentActivities({
        limit: dashboardConfig.activitiesLimit,
        branch_id: selectedBranch.value
      })
    ]);

    // Handle stats response
    if (statsResponse.status === 'fulfilled' && statsResponse.value.success) {
      console.log('✅ Stats loaded:', statsResponse.value.data);
      stats.value = statsResponse.value.data;
    } else {
      console.error('❌ Failed to fetch stats:', statsResponse.value);
      stats.value = {};
    }

    // Handle activities response
    if (activitiesResponse.status === 'fulfilled' && activitiesResponse.value.success) {
      console.log('✅ Activities loaded:', activitiesResponse.value.data);
      recentActivities.value = activitiesResponse.value.data || [];
    } else {
      console.error('❌ Failed to fetch activities:', activitiesResponse.value);
      recentActivities.value = [];
    }

    // Set loading to false first to render the canvas elements
    loading.value = false;
    await nextTick(); // Wait for DOM update

    // Fetch chart data with branch context
    const chartParams = {};
    if (selectedBranch.value) {
      chartParams.branch_id = selectedBranch.value;
    }

    const [studentsResponse, feesResponse, studentDistributionResponse, feeTrendResponse] =
      await Promise.allSettled([
        Dashboard.getStudentsChartData(chartParams),
        Dashboard.getFeesChartData(chartParams),
        Dashboard.getStudentDistributionData(chartParams),
        Dashboard.getFeeTrendData({ ...chartParams, months: dashboardConfig.feeTrendMonths })
      ]);

    // Extract data from successful responses
    const studentsData =
      studentsResponse.status === 'fulfilled' && studentsResponse.value.success
        ? studentsResponse.value.data
        : null;
    const feesData =
      feesResponse.status === 'fulfilled' && feesResponse.value.success
        ? feesResponse.value.data
        : null;
    const studentDistributionData =
      studentDistributionResponse.status === 'fulfilled' &&
      studentDistributionResponse.value.success
        ? studentDistributionResponse.value.data
        : null;
    const feeTrendData =
      feeTrendResponse.status === 'fulfilled' && feeTrendResponse.value.success
        ? feeTrendResponse.value.data
        : null;

    console.log('📊 Chart data loaded:', {
      studentsData,
      feesData,
      studentDistributionData,
      feeTrendData
    });

    // Create charts with available data
    createCharts(studentsData, feesData, studentDistributionData, feeTrendData);
  } catch (error) {
    loading.value = false;
  }
};

// Create fee collection chart
const createFeeChart = (data = null) => {
  // Wait for next tick to ensure DOM is ready
  nextTick(() => {
    if (!feesChart.value) {
      console.warn('Fee chart canvas not found');
      return;
    }

    // Destroy existing chart instance
    if (feesChartInstance) {
      feesChartInstance.destroy();
      feesChartInstance = null;
    }

    const chartData = data || {
      labels: ['Paid', 'Pending', 'Overdue'],
      data: [
        feeCollectionSummary.value.total_collected || 0,
        feeCollectionSummary.value.total_pending || 0,
        feeCollectionSummary.value.overdue_invoices || 0
      ]
    };

    // Check if all data is zero and show "No Data" message
    const hasData = chartData.data.some(value => value > 0);

    try {
      feesChartInstance = new Chart(feesChart.value.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: hasData ? chartData.labels : ['No Data'],
          datasets: [
            {
              data: hasData ? chartData.data : [1],
              backgroundColor: hasData
                ? ['rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(239, 68, 68, 0.8)']
                : ['rgba(156, 163, 175, 0.3)'],
              borderColor: hasData
                ? ['rgb(16, 185, 129)', 'rgb(245, 158, 11)', 'rgb(239, 68, 68)']
                : ['rgb(156, 163, 175)'],
              borderWidth: 2,
              hoverOffset: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#6B7280',
                padding: 20,
                usePointStyle: true
              }
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  if (!hasData) return 'No data available';
                  const label = context.label || '';
                  const value = context.parsed;
                  return `${label}: ₹${value.toLocaleString('en-IN')}`;
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error creating fee chart:', error);
      // Fallback: create a simple "No Data" chart
      try {
        feesChartInstance = new Chart(feesChart.value.getContext('2d'), {
          type: 'doughnut',
          data: {
            labels: ['No Data'],
            datasets: [
              {
                data: [1],
                backgroundColor: ['rgba(156, 163, 175, 0.3)'],
                borderColor: ['rgb(156, 163, 175)'],
                borderWidth: 2
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  color: '#6B7280',
                  padding: 20,
                  usePointStyle: true
                }
              }
            }
          }
        });
      } catch (fallbackError) {
        console.error('Error creating fallback chart:', fallbackError);
      }
    }
  });
};

// Fetch fee collection summary
const fetchFeeCollectionSummary = async () => {
  if (!selectedAcademicYear.value) {
    feeCollectionSummary.value = {};
    createFeeChart();
    return;
  }

  loadingFeeSummary.value = true;
  try {
    const params = {
      academic_year: selectedAcademicYear.value
    };

    // Add branch filter if selected
    if (selectedBranch.value) {
      params.branch_id = selectedBranch.value;
    }

    const response = await Dashboard.getFeeCollectionSummary(params);
    if (response.success) {
      feeCollectionSummary.value = response.data;

      // Create fee chart with the summary data
      createFeeChart();
    } else {
      feeCollectionSummary.value = {};
      createFeeChart();
    }
  } catch (error) {
    feeCollectionSummary.value = {};
    createFeeChart();
  } finally {
    loadingFeeSummary.value = false;
  }
};

// Initialize academic year selection
const initializeAcademicYear = async () => {
  try {
    loadingAcademicYears.value = true;

    // Fetch academic years
    await fetchAcademicYears();

    // Set current academic year as default
    if (currentAcademicYear.value) {
      selectedAcademicYear.value = currentAcademicYear.value.name;
    } else if (academicYears.value.length > 0) {
      // Fallback to first available academic year
      selectedAcademicYear.value = academicYears.value[0].name;
    }
  } catch (error) {
    // Error initializing academic year
  } finally {
    loadingAcademicYears.value = false;
  }
};

// Initialize branches
const initializeBranches = async () => {
  try {
    const schoolId = authStore.currentUser?.school_id;
    if (schoolId) {
      await fetchBranches(schoolId);
    }
  } catch (error) {
    // Error initializing branches
  }
};

// Computed property to determine if branch filter should be shown
const shouldShowBranchFilter = computed(() => {
  // Super admin can always see branch filter
  if (authStore.isSuperAdmin) {
    return true;
  }

  // School admin can see branch filter only if they have multiple branches
  if (authStore.isAdmin) {
    return branches.value.length > 1;
  }

  // Branch admin should not see branch filter (they're fixed to one branch)
  if (authStore.isBranchAdmin) {
    return false;
  }

  // Default: don't show for other roles
  return false;
});

// Computed property to get available branches for the filter
const availableBranches = computed(() => {
  // Super admin sees all branches
  if (authStore.isSuperAdmin) {
    return branches.value;
  }

  // School admin sees only their school's branches
  if (authStore.isAdmin) {
    return branches.value.filter(branch => branch.school_id === authStore.currentUser?.school_id);
  }

  // Branch admin sees only their branch (but filter shouldn't be shown anyway)
  if (authStore.isBranchAdmin) {
    return branches.value.filter(branch => branch.id === authStore.currentUser?.branch_id);
  }

  return [];
});

// Computed property for dashboard title based on user role
const dashboardTitle = computed(() => {
  // Branch admin shows branch name in title
  if (authStore.isBranchAdmin && authStore.currentBranch?.name) {
    const branchName = authStore.currentBranch.name;
    // Truncate branch name if it's too long to prevent UI issues
    const truncatedBranchName =
      branchName.length > 30 ? branchName.substring(0, 30) + '...' : branchName;
    return `${truncatedBranchName} Branch Dashboard`;
  }

  // School admin and other roles show generic "Dashboard"
  return 'Dashboard';
});

// Watch for changes in selected academic year
watch(selectedAcademicYear, newValue => {
  if (newValue) {
    fetchFeeCollectionSummary();
  }
});

// Watch for changes in fee collection summary data
watch(
  feeCollectionSummary,
  () => {
    createFeeChart();
  },
  { deep: true }
);

// Watch for changes in global selected branch
watch(selectedBranchId, async (newVal) => {
  selectedBranch.value = newVal || '';
  await fetchDashboardData();
  if (selectedAcademicYear.value) {
    await fetchFeeCollectionSummary();
  }
});

watch(currentSchool, async () => {
  selectedBranch.value = selectedBranchId.value || '';
  await fetchDashboardData();
  if (selectedAcademicYear.value) {
    await fetchFeeCollectionSummary();
  }
});

// Cleanup charts on component unmount
onUnmounted(() => {
  if (studentsChartInstance) {
    studentsChartInstance.destroy();
  }
  if (feesChartInstance) {
    feesChartInstance.destroy();
  }
  if (studentDistributionChartInstance) {
    studentDistributionChartInstance.destroy();
  }
  if (feeTrendChartInstance) {
    feeTrendChartInstance.destroy();
  }
});

onMounted(async () => {
  // Load modules first to ensure isModuleEnabled works correctly
  await loadUserModules();

  await fetchDashboardData();
  await initializeAcademicYear();
  await initializeBranches();

  // Initialize fee chart after component is mounted
  setTimeout(() => {
    createFeeChart();
  }, 100);
});
</script>

<style scoped>
.stat-card {
  @apply rounded-lg p-3 shadow-md transform hover:-translate-y-1 transition-all duration-300 min-h-[100px] flex flex-col justify-center;
}

.card {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6;
}

/* Dark mode chart adjustments */
:deep(.dark) canvas {
  filter: brightness(0.9);
}
</style>
