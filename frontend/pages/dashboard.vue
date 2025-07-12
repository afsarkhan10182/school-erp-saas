<template>
  <div class="space-y-6">
    <!-- Welcome section -->
    <div class="glass-card p-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {{ user?.first_name }}! 👋
        </h1>
        <p class="text-gray-600 dark:text-gray-400 text-lg">
          Here's what's happening with your School ERP system today.
        </p>
      </div>

      <!-- Stats grid (role-based) -->
      <div v-if="isSuperAdmin" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="stat-card">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <School class="w-6 h-6 text-white" />
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Schools</p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ stats.totalSchools || 0 }}</p>
            </div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 class="w-6 h-6 text-white" />
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Branches</p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ stats.totalBranches || 0 }}</p>
            </div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Users class="w-6 h-6 text-white" />
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ stats.totalUsers || 0 }}</p>
            </div>
          </div>
        </div>
        
        <div class="stat-card relative group">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                <Activity class="w-6 h-6 text-white" />
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                Active Sessions
                <HelpCircle class="ml-1 w-4 h-4 text-gray-400 group-hover:text-yellow-500 transition-colors cursor-pointer" title="This is a placeholder. Real session tracking coming soon!" />
              </p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white opacity-60">--</p>
            </div>
          </div>
          <div class="absolute top-0 right-0 mt-2 mr-2 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs rounded-lg px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Placeholder: Real session tracking coming soon!
          </div>
        </div>
      </div>

      <!-- Branch-wise dashboard for super admin -->
      <div v-if="isSuperAdmin && branches.length" class="space-y-4">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Branch Overview</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="(branch, index) in branches" :key="branch._id" class="stat-card">
            <div class="flex items-center justify-between mb-3">
              <div>
                <div class="text-lg font-semibold text-gray-900 dark:text-white">{{ branch.name }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">School: {{ branch.school?.name || branch.school_name || '-' }}</div>
              </div>
              <NuxtLink :to="`/branches/${branch._id}`" class="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">View</NuxtLink>
            </div>
            <div class="grid grid-cols-3 gap-4 text-center">
              <div class="flex flex-col items-center">
                <span class="text-xs text-gray-500 dark:text-gray-400">City</span>
                <span class="font-semibold text-gray-900 dark:text-white">{{ branch.city }}</span>
              </div>
              <div class="flex flex-col items-center">
                <span class="text-xs text-gray-500 dark:text-gray-400">Status</span>
                <span class="font-semibold" :class="branch.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                  {{ branch.isActive ? 'Active' : 'Inactive' }}
                </span>
              </div>
              <div class="flex flex-col items-center">
                <span class="text-xs text-gray-500 dark:text-gray-400">Email</span>
                <span class="font-semibold text-gray-900 dark:text-white text-xs truncate w-full">{{ branch.email }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- School admin: school/branch stats only -->
      <div v-if="isSchoolAdmin" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="stat-card">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <School class="w-6 h-6 text-white" />
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">School</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ user?.school_name || '-' }}</p>
            </div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 class="w-6 h-6 text-white" />
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Branches</p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ stats.totalBranches || 0 }}</p>
            </div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Users class="w-6 h-6 text-white" />
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Users</p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ stats.totalUsers || 0 }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent activity (common) -->
      <div class="glass-card p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Activity</h3>
        <div class="space-y-4">
          <div v-for="(activity, index) in recentActivity" :key="activity.id" class="flex items-center space-x-3">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                <span class="text-sm font-medium text-white">{{ activity.initials }}</span>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-900 dark:text-white">{{ activity.message }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ activity.time }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick actions (role-based) -->
      <div class="glass-card p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink v-if="isSuperAdmin" to="/subscriptions" class="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 group">
            <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
              <School class="w-5 h-5 text-white" />
            </div>
            <span class="font-medium text-gray-900 dark:text-white">Manage Schools</span>
          </NuxtLink>
          
          <NuxtLink v-if="isSuperAdmin" to="/users" class="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 group">
            <div class="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
              <Users class="w-5 h-5 text-white" />
            </div>
            <span class="font-medium text-gray-900 dark:text-white">Manage Users</span>
          </NuxtLink>
          
          <NuxtLink v-if="isSuperAdmin" to="/branches" class="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 group">
            <div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
              <Building2 class="w-5 h-5 text-white" />
            </div>
            <span class="font-medium text-gray-900 dark:text-white">Manage Branches</span>
          </NuxtLink>
          
          <NuxtLink v-if="isSchoolAdmin" :to="`/branches/${user?.branch_id || ''}`" class="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 group">
            <div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
              <Building2 class="w-5 h-5 text-white" />
            </div>
            <span class="font-medium text-gray-900 dark:text-white">My Branch</span>
          </NuxtLink>
        </div>
      </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import apiClient, { createApiInstance } from '~/utils/api';
import { useAuthStore } from '~/stores/auth';
import { School, Building2, Users, Activity, HelpCircle } from 'lucide-vue-next';

const authStore = useAuthStore();
const user = computed(() => authStore.currentUser);
const isSuperAdmin = computed(() => user.value?.role === 'super_admin');
const isSchoolAdmin = computed(() => user.value?.role === 'school_admin');
const stats = ref({});
const branches = ref([]);
const recentActivity = ref([
  {
    id: 1,
    initials: 'JS',
    message: 'John Smith logged in',
    time: '2 minutes ago'
  },
  {
    id: 2,
    initials: 'MS',
    message: 'New school "ABC Academy" was created',
    time: '15 minutes ago'
  },
  {
    id: 3,
    initials: 'AD',
    message: 'User account updated',
    time: '1 hour ago'
  }
]);

onMounted(async () => {
  // Fetch dashboard stats from API using apiClient
  try {
    const api = createApiInstance();
    const response = await api.get('/dashboard/stats');
    if (response.data.success) {
      stats.value = response.data.data;
    }
    // For super admin, fetch all branches
    if (user.value?.role === 'super_admin') {
      const branchRes = await apiClient.branches.getAll();
      branches.value = branchRes.data?.items || branchRes.data || [];
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
  }
});

// Set page title
useHead({
  title: 'Dashboard - School ERP'
});
</script>

<style scoped>
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-soft);
  border-radius: 16px;
}

.stat-card {
  @apply glass-card p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1;
}
</style> 