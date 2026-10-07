<template>
  <div class="w-full space-y-6">
    <!-- Module Access Error Alert -->
    <div
      v-if="$route.query.error === 'module_access_denied'"
      class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 shadow-sm"
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

    <!-- Header & Branch Selector -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          {{ dashboardTitle }}
        </h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Welcome back, {{ authStore.currentUser?.first_name || 'User' }}! Here's what's happening
          today.
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      <span class="ml-3 text-base text-gray-600 dark:text-gray-400">Loading dashboard...</span>
    </div>

    <!-- Dashboard Content -->
    <div v-else class="space-y-6">
      <!-- Row 1: Quick Stats -->
      <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <!-- Total Students -->
        <div class="stat-card flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span
              class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >Total Students</span
            >
            <div
              class="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            >
              <Users class="w-5 h-5" />
            </div>
          </div>
          <div class="mt-3">
            <span
              class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight"
              >{{ stats.totalStudents || 0 }}</span
            >
          </div>
        </div>

        <!-- Total Parents -->
        <div class="stat-card flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span
              class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >Total Parents</span
            >
            <div
              class="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
            >
              <UserCheck class="w-5 h-5" />
            </div>
          </div>
          <div class="mt-3">
            <span
              class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight"
              >{{ stats.totalParents || 0 }}</span
            >
          </div>
        </div>

        <!-- Total Teachers -->
        <div class="stat-card flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span
              class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >Total Teachers</span
            >
            <div
              class="p-2.5 rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400"
            >
              <BookOpen class="w-5 h-5" />
            </div>
          </div>
          <div class="mt-3">
            <span
              class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight"
              >{{ stats.totalTeachers || 0 }}</span
            >
          </div>
        </div>

        <!-- Total Staff -->
        <div class="stat-card flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span
              class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >Total Staff</span
            >
            <div
              class="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
            >
              <Activity class="w-5 h-5" />
            </div>
          </div>
          <div class="mt-3">
            <span
              class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight"
              >{{ stats.totalEmployees || 0 }}</span
            >
          </div>
        </div>

        <!-- New Students -->
        <div class="stat-card flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span
              class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              New Students ({{ stats.newStudentsDays || dashboardConfig.newStudentsDays }}d)
            </span>
            <div
              class="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
            >
              <UserPlus class="w-5 h-5" />
            </div>
          </div>
          <div class="mt-3">
            <span
              class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight"
              >{{ stats.newStudents || 0 }}</span
            >
          </div>
        </div>

        <!-- This Month Collection -->
        <div v-if="isModuleEnabled('fees')" class="stat-card flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span
              class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >This Month Fees</span
            >
            <div
              class="p-2.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
            >
              <DollarSign class="w-5 h-5" />
            </div>
          </div>
          <div class="mt-3">
            <span
              class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight"
              >₹{{ formatCurrency(stats.feeCollection || 0) }}</span
            >
          </div>
        </div>

        <!-- Pending Fees -->
        <div v-if="isModuleEnabled('fees')" class="stat-card flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span
              class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >Pending Fees</span
            >
            <div
              class="p-2.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
            >
              <AlertTriangle class="w-5 h-5" />
            </div>
          </div>
          <div class="mt-3">
            <span
              class="text-2xl lg:text-3xl font-bold text-rose-600 dark:text-rose-400 tracking-tight"
            >
              {{ (stats.pendingFees || 0) + (stats.overdueFees || 0) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Row 2: Core Insights -->
      <div :class="['grid gap-6 min-w-0', row2GridLayout]">
        <!-- Fee Collection Summary + Pie Chart -->
        <div
          v-if="isModuleEnabled('fees')"
          class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm p-5 sm:p-6 min-w-0"
        >
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              Fee Collection Summary
              <span
                v-if="loadingAcademicYears"
                class="text-xs text-gray-500 dark:text-gray-400 font-normal ml-1"
                >(Loading...)</span
              >
              <span
                v-else-if="feeCollectionSummary.academic_year"
                class="text-xs text-indigo-600 dark:text-indigo-400 font-medium ml-1"
                >({{ feeCollectionSummary.academic_year }})</span
              >
              <span v-else class="text-xs text-gray-500 dark:text-gray-400 font-normal ml-1"
                >(No data)</span
              >
            </h2>
            <div class="flex items-center space-x-2">
              <EnhancedDropdown
                v-model="selectedAcademicYear"
                :options="academicYears.map(year => ({ value: year.name, label: `${year.name}${year.is_current ? ' (Current)' : ''}` }))"
                placeholder="Select academic year"
                id="dashboard-academic-year"
                :disabled="loadingAcademicYears || academicYears.length === 0"
              />
            </div>
          </div>

          <div v-if="loadingFeeSummary" class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
            <span class="ml-2 text-sm text-gray-600 dark:text-gray-400"
              >Loading fee summary...</span
            >
          </div>

          <div v-else class="space-y-6">
            <!-- Summary Cards -->
            <div class="grid grid-cols-2 gap-3 sm:gap-4">
              <div
                class="bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl p-3.5 sm:p-4"
              >
                <div class="flex items-center gap-1.5">
                  <CheckCircle class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span
                    class="text-xs font-semibold text-emerald-800 dark:text-emerald-200 uppercase tracking-wider"
                    >Collected</span
                  >
                </div>
                <p
                  class="text-xl sm:text-2xl font-bold text-emerald-900 dark:text-emerald-100 mt-1"
                >
                  ₹{{ formatCurrency(feeCollectionSummary.total_collected || 0) }}
                </p>
              </div>

              <div
                class="bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/60 rounded-xl p-3.5 sm:p-4"
              >
                <div class="flex items-center gap-1.5">
                  <AlertTriangle class="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span
                    class="text-xs font-semibold text-rose-800 dark:text-rose-200 uppercase tracking-wider"
                    >Pending</span
                  >
                </div>
                <p class="text-xl sm:text-2xl font-bold text-rose-900 dark:text-rose-100 mt-1">
                  ₹{{ formatCurrency(feeCollectionSummary.total_pending || 0) }}
                </p>
              </div>
            </div>

            <!-- Fee Collection Chart -->
            <div
              class="relative w-full h-48 bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 overflow-hidden min-w-0"
            >
              <canvas ref="feesChart"></canvas>
            </div>

            <!-- Additional Stats -->
            <div
              class="grid grid-cols-4 gap-2 sm:gap-4 pt-4 border-t border-gray-200 dark:border-gray-700/80 text-center"
            >
              <div>
                <p class="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  {{ feeCollectionSummary.total_invoices || 0 }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Invoices</p>
              </div>
              <div>
                <p class="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {{ feeCollectionSummary.paid_invoices || 0 }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Paid</p>
              </div>
              <div>
                <p class="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400">
                  {{ feeCollectionSummary.pending_invoices || 0 }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Pending</p>
              </div>
              <div>
                <p class="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {{ feeCollectionSummary.collection_rate || 0 }}%
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Rate</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Student Distribution + Monthly Trends -->
        <div
          class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm p-5 sm:p-6 min-w-0"
        >
          <h2
            class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight mb-6"
          >
            Student Distribution & Trends
          </h2>

          <!-- Student Distribution Chart -->
          <div class="mb-6">
            <h3
              class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3"
            >
              Distribution by Class
            </h3>
            <div
              class="relative w-full h-44 bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 overflow-hidden min-w-0"
            >
              <canvas ref="studentDistributionChart"></canvas>
            </div>
          </div>

          <!-- Monthly Trends -->
          <div>
            <h3
              class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3"
            >
              Monthly Enrollment Trends
            </h3>
            <div
              class="relative w-full h-44 bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 overflow-hidden min-w-0"
            >
              <canvas ref="studentsChart"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Row 3: Extra Insights -->
      <div :class="['grid gap-6 min-w-0', row2GridLayout]">
        <!-- Fee Collection Trend (6 months) -->
        <div
          v-if="isModuleEnabled('fees')"
          class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm p-5 sm:p-6 min-w-0"
        >
          <h2
            class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight mb-6"
          >
            Fee Collection Trend ({{ dashboardConfig.feeTrendMonths }} Months)
          </h2>
          <div
            class="relative w-full h-60 sm:h-64 bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 overflow-hidden min-w-0"
          >
            <canvas ref="feeTrendChart"></canvas>
          </div>
        </div>

        <!-- Recent Activities -->
        <div
          class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm p-5 sm:p-6 min-w-0"
        >
          <h2
            class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight mb-6"
          >
            Recent Activities
          </h2>

          <div class="space-y-3">
            <div v-if="loadingActivities" class="flex items-center justify-center py-12">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
              <span class="ml-2 text-sm text-gray-600 dark:text-gray-400"
                >Loading activities...</span
              >
            </div>

            <div v-else-if="recentActivities.length === 0" class="text-center py-10">
              <div
                class="w-12 h-12 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-3"
              >
                <Activity class="w-6 h-6 text-gray-400" />
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400">No recent activities</p>
            </div>

            <div v-else class="space-y-2.5">
              <div
                v-for="activity in recentActivities"
                :key="activity.id"
                class="flex items-start space-x-3 p-3 bg-gray-50/80 dark:bg-gray-700/40 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-700/60 transition-colors"
              >
                <div class="flex-shrink-0">
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center"
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
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
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
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useAcademics } from '~/composables/useAcademics';
import { useBranches } from '~/composables/useBranches';
import { useModuleAccess } from '~/composables/useModuleAccess';
import { Dashboard } from '~/api';
import { useToast } from '~/composables/useToast';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
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
  CreditCard
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
watch(selectedBranchId, async newVal => {
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
