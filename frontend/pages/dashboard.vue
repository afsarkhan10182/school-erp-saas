<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <header class="mb-8">
        <h1 class="text-4xl font-bold tracking-tight">Dashboard</h1>
        <p class="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Welcome back, {{ user?.first_name }}! Here's a snapshot of your school's performance.
        </p>
      </header>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-16">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span class="ml-4 text-lg text-gray-600 dark:text-gray-400">Loading dashboard...</span>
      </div>

      <!-- Dashboard Content -->
      <main v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Stats Cards -->
          <section class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div class="stat-card bg-blue-500 text-white">
              <Users class="w-8 h-8" />
              <p class="mt-2 text-sm font-medium">Total Students</p>
              <p class="text-3xl font-bold">{{ stats.totalStudents || 0 }}</p>
            </div>
            <div class="stat-card bg-green-500 text-white">
              <UserPlus class="w-8 h-8" />
              <p class="mt-2 text-sm font-medium">New Admissions</p>
              <p class="text-3xl font-bold">{{ stats.newAdmissions || 0 }}</p>
            </div>
            <div class="stat-card bg-yellow-500 text-white">
              <DollarSign class="w-8 h-8" />
              <p class="mt-2 text-sm font-medium">Fee Collection</p>
              <p class="text-3xl font-bold">₹{{ formatCurrency(stats.feeCollection || 0) }}</p>
            </div>
            <div class="stat-card bg-purple-500 text-white">
              <Building2 class="w-8 h-8" />
              <p class="mt-2 text-sm font-medium">Total Branches</p>
              <p class="text-3xl font-bold">{{ stats.totalBranches || 0 }}</p>
            </div>
          </section>

          <!-- Charts Section -->
          <section class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Monthly Admissions Chart -->
            <div class="card">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-semibold">Monthly Admissions</h2>
                <div class="flex items-center space-x-2">
                  <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span class="text-sm text-gray-600 dark:text-gray-400">Admissions</span>
                </div>
              </div>
              <div class="relative h-64">
                <canvas ref="admissionsChart" class="w-full h-full"></canvas>
              </div>
            </div>

            <!-- Fee Collection Status Chart -->
            <div class="card">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-semibold">Fee Collection Status</h2>
                <div class="flex items-center space-x-2">
                  <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span class="text-sm text-gray-600 dark:text-gray-400">Collection</span>
                </div>
              </div>
              <div class="relative h-64">
                <canvas ref="feesChart" class="w-full h-full"></canvas>
              </div>
            </div>
          </section>

          <!-- Additional Charts Section -->
          <section class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Student Distribution by Class -->
            <div class="card">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-semibold">Student Distribution</h2>
                <div class="flex items-center space-x-2">
                  <div class="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span class="text-sm text-gray-600 dark:text-gray-400">By Class</span>
                </div>
              </div>
              <div class="relative h-64">
                <canvas ref="studentDistributionChart" class="w-full h-full"></canvas>
              </div>
            </div>

            <!-- Fee Collection Trend -->
            <div class="card">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-semibold">Fee Collection Trend</h2>
                <div class="flex items-center space-x-2">
                  <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span class="text-sm text-gray-600 dark:text-gray-400">Last 6 Months</span>
                </div>
              </div>
              <div class="relative h-64">
                <canvas ref="feeTrendChart" class="w-full h-full"></canvas>
              </div>
            </div>
          </section>

          <!-- Role-specific content -->
          <section v-if="isSuperAdmin" class="card">
            <h2 class="text-xl font-semibold mb-4">Platform Overview</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <p class="text-3xl font-bold text-blue-500">{{ platformStats.totalSchools || 0 }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Total Schools</p>
              </div>
              <div>
                <p class="text-3xl font-bold text-green-500">{{ platformStats.totalRevenue || 0 }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
              </div>
              <div>
                <p class="text-3xl font-bold text-purple-500">{{ platformStats.totalUsers || 0 }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
              </div>
            </div>
          </section>

          <section v-if="isSchoolAdmin" class="card">
            <h2 class="text-xl font-semibold mb-4">School Overview</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <p class="text-3xl font-bold text-blue-500">{{ schoolStats.totalStudents || 0 }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Students</p>
              </div>
              <div>
                <p class="text-3xl font-bold text-green-500">{{ schoolStats.totalTeachers || 0 }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Teachers</p>
              </div>
              <div>
                <p class="text-3xl font-bold text-yellow-500">{{ schoolStats.totalStaff || 0 }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Staff</p>
              </div>
              <div>
                <p class="text-3xl font-bold text-purple-500">{{ schoolStats.totalParents || 0 }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Parents</p>
              </div>
            </div>
          </section>
        </div>

        <!-- Right Column -->
        <div class="space-y-8">
          <!-- Events Calendar -->
          <section class="card">
            <h2 class="text-xl font-semibold mb-4">Upcoming Events</h2>
            <div class="space-y-4">
              <div v-for="event in upcomingEvents" :key="event.id" class="flex items-center space-x-4">
                <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex flex-col items-center justify-center">
                  <span class="text-sm font-bold text-blue-600 dark:text-blue-300">{{ event.date.day }}</span>
                  <span class="text-xs text-blue-500 dark:text-blue-400">{{ event.date.month }}</span>
                </div>
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">{{ event.title }}</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">{{ event.time }}</p>
                </div>
              </div>
            </div>
          </section>

          <!-- Recent Activities -->
          <section class="card">
            <h2 class="text-xl font-semibold mb-4">Recent Activities</h2>
            <div v-if="recentActivities.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
              No recent activities to display.
            </div>
            <ul v-else class="space-y-4">
              <li v-for="activity in recentActivities" :key="activity.id" class="flex items-start space-x-4">
                <div class="flex-shrink-0">
                  <div class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <component :is="getActivityIcon(activity.type)" class="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
                <div class="flex-1">
                  <p class="font-medium text-gray-900 dark:text-white">{{ activity.title }}</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">{{ activity.description }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">{{ formatDate(activity.created_at) }}</p>
                </div>
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, onUnmounted } from 'vue';
import { 
  Users, 
  UserPlus, 
  DollarSign, 
  Building2, 
  User,
  GraduationCap,
  CreditCard
} from 'lucide-vue-next';
import { useAuthStore } from '~/stores/auth';
import { apiClient } from '~/utils/api';
import Chart from 'chart.js/auto';

const authStore = useAuthStore();
const loading = ref(true);
const stats = ref({});
const platformStats = ref({});
const schoolStats = ref({});
const recentActivities = ref([]);

// Chart refs
const admissionsChart = ref(null);
const feesChart = ref(null);
const studentDistributionChart = ref(null);
const feeTrendChart = ref(null);

// Chart instances
let admissionsChartInstance = null;
let feesChartInstance = null;
let studentDistributionChartInstance = null;
let feeTrendChartInstance = null;

const user = computed(() => authStore.currentUser);
const isSuperAdmin = computed(() => authStore.isSuperAdmin);
const isSchoolAdmin = computed(() => authStore.isSchoolAdmin);

// Mock data for calendar
const upcomingEvents = ref([
  { id: 1, title: 'Annual Sports Day', date: { day: '25', month: 'Jul' }, time: '9:00 AM - 3:00 PM' },
  { id: 2, title: 'Parent-Teacher Meeting', date: { day: '28', month: 'Jul' }, time: '11:00 AM - 1:00 PM' },
  { id: 3, title: 'Science Exhibition', date: { day: '02', month: 'Aug' }, time: '10:00 AM - 4:00 PM' },
]);

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN').format(amount);
};

// Format date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Get activity icon
const getActivityIcon = (type) => {
  switch (type) {
    case 'student_admission':
      return UserPlus;
    case 'fee_payment':
      return CreditCard;
    case 'academic':
      return GraduationCap;
    default:
      return User;
  }
};

// Create charts
const createCharts = (admissionsData, feesData, studentDistributionData, feeTrendData) => {
  console.log("Creating charts with data:", { admissionsData, feesData, studentDistributionData, feeTrendData });

  // Monthly Admissions Chart (Line Chart)
  if (admissionsChart.value) {
    if (admissionsChartInstance) {
      admissionsChartInstance.destroy();
    }
    
    // Use API data or fallback to realistic mock data
    const admissionLabels = admissionsData?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const admissionValues = admissionsData?.data || [12, 19, 15, 25, 22, 30];
    
    console.log("Admissions chart data:", { labels: admissionLabels, data: admissionValues });
    
    admissionsChartInstance = new Chart(admissionsChart.value.getContext('2d'), {
      type: 'line',
      data: {
        labels: admissionLabels,
        datasets: [{
          label: 'New Admissions',
          data: admissionValues,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }]
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
  if (feesChart.value) {
    if (feesChartInstance) {
      feesChartInstance.destroy();
    }
    
    // Use API data or fallback to realistic mock data
    const feeLabels = feesData?.labels || ['Paid', 'Pending', 'Overdue'];
    const feeValues = feesData?.data || [65, 25, 10];
    
    console.log("Fees chart data:", { labels: feeLabels, data: feeValues });
    
    feesChartInstance = new Chart(feesChart.value.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: feeLabels,
        datasets: [{
          data: feeValues,
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderColor: [
            'rgb(16, 185, 129)',
            'rgb(245, 158, 11)',
            'rgb(239, 68, 68)'
          ],
          borderWidth: 2,
          hoverOffset: 4
        }]
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
  if (studentDistributionChart.value) {
    if (studentDistributionChartInstance) {
      studentDistributionChartInstance.destroy();
    }
    
    // Use API data or fallback to realistic mock data
    const distributionLabels = studentDistributionData?.labels || ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'];
    const distributionValues = studentDistributionData?.data || [45, 52, 38, 41, 35];
    
    console.log("Student distribution chart data:", { labels: distributionLabels, data: distributionValues });
    
    studentDistributionChartInstance = new Chart(studentDistributionChart.value.getContext('2d'), {
      type: 'bar',
      data: {
        labels: distributionLabels,
        datasets: [{
          label: 'Students',
          data: distributionValues,
          backgroundColor: 'rgba(147, 51, 234, 0.8)',
          borderColor: 'rgb(147, 51, 234)',
          borderWidth: 1,
          borderRadius: 4
        }]
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

  // Fee Collection Trend Chart (Area Chart)
  if (feeTrendChart.value) {
    if (feeTrendChartInstance) {
      feeTrendChartInstance.destroy();
    }
    
    // Use API data or fallback to realistic mock data
    const trendLabels = feeTrendData?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const trendValues = feeTrendData?.data || [85000, 92000, 78000, 95000, 88000, 102000];
    
    console.log("Fee trend chart data:", { labels: trendLabels, data: trendValues });
    
    feeTrendChartInstance = new Chart(feeTrendChart.value.getContext('2d'), {
      type: 'line',
      data: {
        labels: trendLabels,
        datasets: [{
          label: 'Fee Collection',
          data: trendValues,
          borderColor: 'rgb(245, 158, 11)',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(245, 158, 11)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }]
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
              callback: function(value) {
                return '₹' + (value / 1000) + 'K';
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
    
    // Fetch basic stats
    const statsResponse = await apiClient.dashboard.getStats();
    if (statsResponse.success) {
      stats.value = statsResponse.data;
    }

    // Fetch role-specific data
    if (isSuperAdmin.value) {
      const platformResponse = await apiClient.dashboard.getOverviewReport();
      if (platformResponse.success) {
        platformStats.value = platformResponse.data;
      }
    } else if (isSchoolAdmin.value) {
      const schoolResponse = await apiClient.dashboard.getSchoolReport();
      if (schoolResponse.success) {
        schoolStats.value = schoolResponse.data;
      }
    }

    // Fetch recent activities
    const activitiesResponse = await apiClient.dashboard.getRecentActivities({ limit: 5 });
    if (activitiesResponse.success) {
      recentActivities.value = activitiesResponse.data;
    }

    // Set loading to false first to render the canvas elements
    loading.value = false;
    await nextTick(); // Wait for DOM update

    // Fetch chart data
    try {
      console.log("Fetching chart data...");
      
      const [admissionsResponse, feesResponse, studentDistributionResponse, feeTrendResponse] = await Promise.allSettled([
        apiClient.dashboard.getAdmissionsChartData(),
        apiClient.dashboard.getFeesChartData(),
        apiClient.dashboard.getStudentDistributionData(),
        apiClient.dashboard.getFeeTrendData()
      ]);

      console.log("Chart data responses:", {
        admissions: admissionsResponse,
        fees: feesResponse,
        studentDistribution: studentDistributionResponse,
        feeTrend: feeTrendResponse
      });

      // Extract data from successful responses, use fallback for failed ones
      const admissionsData = admissionsResponse.status === 'fulfilled' ? admissionsResponse.value.data : null;
      const feesData = feesResponse.status === 'fulfilled' ? feesResponse.value.data : null;
      const studentDistributionData = studentDistributionResponse.status === 'fulfilled' ? studentDistributionResponse.value.data : null;
      const feeTrendData = feeTrendResponse.status === 'fulfilled' ? feeTrendResponse.value.data : null;

      console.log("Processed chart data:", {
        admissionsData,
        feesData,
        studentDistributionData,
        feeTrendData
      });

      // Create charts with available data
      createCharts(admissionsData, feesData, studentDistributionData, feeTrendData);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      // Create charts with fallback data
      createCharts(null, null, null, null);
    }

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    loading.value = false;
    
    // Create charts with mock data on error
    await nextTick();
    createCharts(null, null, null, null);
  }
};

// Cleanup charts on component unmount
onUnmounted(() => {
  if (admissionsChartInstance) {
    admissionsChartInstance.destroy();
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

onMounted(() => {
  fetchDashboardData();
});
</script>

<style scoped>
.stat-card {
  @apply rounded-xl p-6 shadow-lg transform hover:-translate-y-1 transition-all duration-300;
}

.card {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6;
}

/* Dark mode chart adjustments */
:deep(.dark) canvas {
  filter: brightness(0.9);
}
</style>