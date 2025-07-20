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
              <p class="mt-2 text-sm font-medium">New Students (30d)</p>
              <p class="text-3xl font-bold">{{ stats.newStudents || 0 }}</p>
            </div>
            <div class="stat-card bg-purple-500 text-white">
              <DollarSign class="w-8 h-8" />
              <p class="mt-2 text-sm font-medium">Fee Collection (This Month)</p>
              <p class="text-3xl font-bold">₹{{ formatCurrency(stats.feeCollection || 0) }}</p>
            </div>
            <div class="stat-card bg-red-500 text-white">
              <AlertTriangle class="w-8 h-8" />
              <p class="mt-2 text-sm font-medium">Pending/Overdue Fees</p>
              <p class="text-3xl font-bold">{{ (stats.pendingFees || 0) + (stats.overdueFees || 0) }}</p>
            </div>
          </section>

          <!-- Charts Section -->
          <section class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Monthly Student Trends Chart -->
            <div class="card">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-semibold">Monthly Student Trends</h2>
                <div class="flex items-center space-x-2">
                  <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span class="text-sm text-gray-600 dark:text-gray-400">Students</span>
                </div>
              </div>
              <div class="relative h-64">
                <canvas ref="studentsChart" class="w-full h-full"></canvas>
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
                <h2 class="text-xl font-semibold">Student Distribution by Class</h2>
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
                <p class="text-3xl font-bold text-green-500">₹{{ formatCurrency(platformStats.totalRevenue || 0) }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
              </div>
              <div>
                <p class="text-3xl font-bold text-purple-500">{{ platformStats.totalUsers || 0 }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
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
  CreditCard,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle
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
const recentAdmissions = ref([]);
const overdueFees = ref([]);

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

const user = computed(() => authStore.currentUser);
const isSuperAdmin = computed(() => authStore.isSuperAdmin);
const isSchoolAdmin = computed(() => authStore.isSchoolAdmin);

// Upcoming events - will be populated from API when available
const upcomingEvents = ref([]);

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
    case 'student_created':
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
const createCharts = (studentsData, feesData, studentDistributionData, feeTrendData) => {
  // Monthly Students Chart (Line Chart)
  if (studentsChart.value && studentsData) {
    if (studentsChartInstance) {
      studentsChartInstance.destroy();
    }
    
    studentsChartInstance = new Chart(studentsChart.value.getContext('2d'), {
      type: 'line',
      data: {
        labels: studentsData.labels || [],
        datasets: [{
          label: 'New Students',
          data: studentsData.data || [],
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
  if (feesChart.value && feesData) {
    if (feesChartInstance) {
      feesChartInstance.destroy();
    }
    
    feesChartInstance = new Chart(feesChart.value.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: feesData.labels || [],
        datasets: [{
          data: feesData.data || [],
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
  if (studentDistributionChart.value && studentDistributionData) {
    if (studentDistributionChartInstance) {
      studentDistributionChartInstance.destroy();
    }
    
    studentDistributionChartInstance = new Chart(studentDistributionChart.value.getContext('2d'), {
      type: 'bar',
      data: {
        labels: studentDistributionData.labels || [],
        datasets: [{
          label: 'Students',
          data: studentDistributionData.data || [],
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
  if (feeTrendChart.value && feeTrendData) {
    if (feeTrendChartInstance) {
      feeTrendChartInstance.destroy();
    }
    
    feeTrendChartInstance = new Chart(feeTrendChart.value.getContext('2d'), {
      type: 'line',
      data: {
        labels: feeTrendData.labels || [],
        datasets: [{
          label: 'Fee Collection',
          data: feeTrendData.data || [],
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
    const [studentsResponse, feesResponse, studentDistributionResponse, feeTrendResponse] = await Promise.allSettled([
      apiClient.dashboard.getStudentsChartData(),
      apiClient.dashboard.getFeesChartData(),
      apiClient.dashboard.getStudentDistributionData(),
      apiClient.dashboard.getFeeTrendData()
    ]);

    // Extract data from successful responses
    const studentsData = studentsResponse.status === 'fulfilled' && studentsResponse.value.success ? studentsResponse.value.data : null;
    const feesData = feesResponse.status === 'fulfilled' && feesResponse.value.success ? feesResponse.value.data : null;
    const studentDistributionData = studentDistributionResponse.status === 'fulfilled' && studentDistributionResponse.value.success ? studentDistributionResponse.value.data : null;
    const feeTrendData = feeTrendResponse.status === 'fulfilled' && feeTrendResponse.value.success ? feeTrendResponse.value.data : null;

    // Create charts with available data
    createCharts(studentsData, feesData, studentDistributionData, feeTrendData);

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    loading.value = false;
  }
};



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