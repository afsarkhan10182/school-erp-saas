<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Welcome back, {{ user?.first_name }}! Here's what's happening in your school.
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-2 text-gray-600 dark:text-gray-400">Loading dashboard...</span>
      </div>

      <!-- Dashboard Content -->
      <div v-else>
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <!-- Total Students -->
          <div class="stat-card">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Users class="w-5 h-5 text-white" />
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Students</p>
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.totalStudents || 0 }}</p>
              </div>
            </div>
          </div>

          <!-- New Admissions -->
          <div class="stat-card">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <UserPlus class="w-5 h-5 text-white" />
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">New Admissions</p>
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.newAdmissions || 0 }}</p>
              </div>
            </div>
          </div>

          <!-- Fee Collection -->
          <div class="stat-card">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <DollarSign class="w-5 h-5 text-white" />
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Fee Collection</p>
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">₹{{ formatCurrency(stats.feeCollection || 0) }}</p>
              </div>
            </div>
          </div>

          <!-- Total Branches -->
          <div class="stat-card">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Building2 class="w-5 h-5 text-white" />
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Branches</p>
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.totalBranches || 0 }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Role-specific content -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Recent Activities -->
          <div class="card">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Activities</h3>
            <div v-if="recentActivities.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
              No recent activities
            </div>
            <div v-else class="space-y-4">
              <div v-for="activity in recentActivities" :key="activity.id" class="flex items-start space-x-3">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <component :is="getActivityIcon(activity.type)" class="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ activity.title }}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ activity.description }}</p>
                  <p class="text-xs text-gray-400 dark:text-gray-500">{{ formatDate(activity.created_at) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="card">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div class="grid grid-cols-2 gap-4">
              <NuxtLink 
                to="/students/create" 
                class="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <UserPlus class="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
                <span class="text-sm font-medium text-gray-900 dark:text-white">New Admission</span>
              </NuxtLink>
              
              <NuxtLink 
                to="/fees/invoices" 
                class="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Receipt class="w-5 h-5 text-green-600 dark:text-green-400 mr-3" />
                <span class="text-sm font-medium text-gray-900 dark:text-white">Generate Invoice</span>
              </NuxtLink>
              
              <NuxtLink 
                to="/reports/students" 
                class="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <BarChart3 class="w-5 h-5 text-purple-600 dark:text-purple-400 mr-3" />
                <span class="text-sm font-medium text-gray-900 dark:text-white">Student Reports</span>
              </NuxtLink>
              
              <NuxtLink 
                to="/reports/fees" 
                class="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <PieChart class="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3" />
                <span class="text-sm font-medium text-gray-900 dark:text-white">Fee Reports</span>
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Super Admin specific content -->
        <div v-if="isSuperAdmin" class="mt-8">
          <div class="card">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Platform Overview</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="text-center">
                <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ platformStats.totalSchools || 0 }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Total Schools</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ platformStats.totalRevenue || 0 }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ platformStats.totalUsers || 0 }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
              </div>
            </div>
          </div>
        </div>

        <!-- School Admin specific content -->
        <div v-if="isSchoolAdmin" class="mt-8">
          <div class="card">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">School Overview</h3>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div class="text-center">
                <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ schoolStats.totalStudents || 0 }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Students</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ schoolStats.totalTeachers || 0 }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Teachers</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{{ schoolStats.totalStaff || 0 }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Staff</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ schoolStats.totalParents || 0 }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Parents</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { 
  Users, 
  UserPlus, 
  DollarSign, 
  Building2, 
  Receipt, 
  BarChart3, 
  PieChart,
  User,
  GraduationCap,
  CreditCard
} from 'lucide-vue-next';
import { useAuthStore } from '~/stores/auth';
import { apiClient } from '~/utils/api';

const authStore = useAuthStore();
const loading = ref(true);
const stats = ref({});
const platformStats = ref({});
const schoolStats = ref({});
const recentActivities = ref([]);

const user = computed(() => authStore.currentUser);
const isSuperAdmin = computed(() => authStore.isSuperAdmin);
const isSchoolAdmin = computed(() => authStore.isSchoolAdmin);

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN').format(amount);
};

// Format date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
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
    const activitiesResponse = await apiClient.dashboard.getRecentActivities({ limit: 10 });
    if (activitiesResponse.success) {
      recentActivities.value = activitiesResponse.data;
    }

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchDashboardData();
});
</script>

<style scoped>
.stat-card {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-md;
}

.card {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6;
}
</style> 