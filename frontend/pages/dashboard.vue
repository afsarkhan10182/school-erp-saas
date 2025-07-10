<template>
  <client-only>
    <div class="space-y-6">
      <!-- Welcome section -->
      <div class="card shadow-lg rounded-xl p-6 bg-white">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {{ user?.first_name }}!
        </h1>
        <p class="text-gray-600">
          Here's what's happening with your School ERP system.
        </p>
      </div>

      <!-- Stats grid (role-based) -->
      <div v-if="isSuperAdmin" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="card stat-card hover:shadow-xl transition-shadow">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <span class="text-blue-600 text-2xl">🏫</span>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Total Schools</p>
              <p class="text-3xl font-bold text-gray-900">{{ stats.totalSchools || 0 }}</p>
            </div>
          </div>
        </div>
        <div class="card stat-card hover:shadow-xl transition-shadow">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <span class="text-green-600 text-2xl">🏢</span>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Total Branches</p>
              <p class="text-3xl font-bold text-gray-900">{{ stats.totalBranches || 0 }}</p>
            </div>
          </div>
        </div>
        <div class="card stat-card hover:shadow-xl transition-shadow">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <span class="text-purple-600 text-2xl">👥</span>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Total Users</p>
              <p class="text-3xl font-bold text-gray-900">{{ stats.totalUsers || 0 }}</p>
            </div>
          </div>
        </div>
        <div class="card stat-card hover:shadow-xl transition-shadow relative group">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <span class="text-yellow-600 text-2xl">📊</span>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 flex items-center">
                Active Sessions
                <span class="ml-1 cursor-pointer" title="This is a placeholder. Real session tracking coming soon!">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 group-hover:text-yellow-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                  </svg>
                </span>
              </p>
              <p class="text-3xl font-bold text-gray-900 opacity-60">--</p>
            </div>
          </div>
          <div class="absolute top-0 right-0 mt-2 mr-2 bg-yellow-50 text-yellow-800 text-xs rounded px-2 py-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Placeholder: Real session tracking coming soon!
          </div>
        </div>
      </div>

      <!-- Branch-wise dashboard for super admin -->
      <div v-if="isSuperAdmin && branches.length" class="space-y-4">
        <h2 class="text-xl font-bold text-gray-900 mt-8 mb-2">Branch-wise Overview</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="branch in branches" :key="branch._id" class="card hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between mb-2">
              <div>
                <div class="text-lg font-semibold text-gray-900">{{ branch.name }}</div>
                <div class="text-xs text-gray-500">School: {{ branch.school?.name || branch.school_name || '-' }}</div>
              </div>
              <NuxtLink :to="`/branches/${branch._id}`" class="text-blue-600 hover:underline text-sm">View</NuxtLink>
            </div>
            <div class="flex flex-wrap gap-4 mt-2">
              <div class="flex flex-col items-center">
                <span class="text-sm text-gray-500">City</span>
                <span class="font-bold">{{ branch.city }}</span>
              </div>
              <div class="flex flex-col items-center">
                <span class="text-sm text-gray-500">Status</span>
                <span class="font-bold">{{ branch.isActive ? 'Active' : 'Inactive' }}</span>
              </div>
              <div class="flex flex-col items-center">
                <span class="text-sm text-gray-500">Email</span>
                <span class="font-bold">{{ branch.email }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- School admin: school/branch stats only -->
      <div v-if="isSchoolAdmin" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="card stat-card hover:shadow-xl transition-shadow">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <span class="text-blue-600 text-2xl">🏫</span>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">School</p>
              <p class="text-3xl font-bold text-gray-900">{{ user?.school_name || '-' }}</p>
            </div>
          </div>
        </div>
        <div class="card stat-card hover:shadow-xl transition-shadow">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <span class="text-green-600 text-2xl">🏢</span>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Branches</p>
              <p class="text-3xl font-bold text-gray-900">{{ stats.totalBranches || 0 }}</p>
            </div>
          </div>
        </div>
        <div class="card stat-card hover:shadow-xl transition-shadow">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <span class="text-purple-600 text-2xl">👥</span>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Users</p>
              <p class="text-3xl font-bold text-gray-900">{{ stats.totalUsers || 0 }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent activity (common) -->
      <div class="card shadow-lg rounded-xl p-6 bg-white">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div class="space-y-4">
          <div v-for="activity in recentActivity" :key="activity.id" class="flex items-center space-x-3">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span class="text-sm font-medium text-gray-600">{{ activity.initials }}</span>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-900">{{ activity.message }}</p>
              <p class="text-xs text-gray-500">{{ activity.time }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick actions (role-based) -->
      <div class="card shadow-lg rounded-xl p-6 bg-white">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink v-if="isSuperAdmin" to="/schools" class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors">
            <span class="text-blue-600 text-xl mr-3">🏫</span>
            <span class="font-medium text-gray-900">Manage Schools</span>
          </NuxtLink>
          <NuxtLink v-if="isSuperAdmin" to="/users" class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-green-50 transition-colors">
            <span class="text-green-600 text-xl mr-3">👥</span>
            <span class="font-medium text-gray-900">Manage Users</span>
          </NuxtLink>
          <NuxtLink v-if="isSuperAdmin" to="/branches" class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-purple-50 transition-colors">
            <span class="text-purple-600 text-xl mr-3">🏢</span>
            <span class="font-medium text-gray-900">Manage Branches</span>
          </NuxtLink>
          <NuxtLink v-if="isSchoolAdmin" :to="`/branches/${user?.branch_id || ''}`" class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-purple-50 transition-colors">
            <span class="text-purple-600 text-xl mr-3">🏢</span>
            <span class="font-medium text-gray-900">My Branch</span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </client-only>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import apiClient from '~/utils/api';

const user = ref(null);
const stats = ref({
  totalSchools: 0,
  totalBranches: 0,
  totalUsers: 0
});
const branches = ref([]);

const isSuperAdmin = computed(() => user.value?.role === 'super_admin');
const isSchoolAdmin = computed(() => user.value?.role === 'school_admin');

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
  // Get user from localStorage
  const userData = localStorage.getItem('user');
  if (userData) {
    user.value = JSON.parse(userData);
  }

  // Fetch dashboard stats from API using apiClient
  try {
    const token = localStorage.getItem('auth-token');
    if (token) {
      const response = await apiClient.api.get('/dashboard/stats');
      if (response.data.success) {
        stats.value = response.data.data;
      }
      // For super admin, fetch all branches
      if (user.value?.role === 'super_admin') {
        const branchRes = await apiClient.branches.getAll();
        branches.value = branchRes.data?.items || branchRes.data || [];
      }
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
.card {
  background: #fff;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px 0 rgba(0,0,0,0.04);
}
.stat-card {
  min-height: 110px;
  display: flex;
  align-items: center;
  cursor: pointer;
  border: 1px solid #f3f4f6;
  background: #fafbfc;
  transition: box-shadow 0.2s, border-color 0.2s;
}
.stat-card:hover {
  border-color: #a5b4fc;
  box-shadow: 0 4px 16px 0 rgba(59,130,246,0.08);
}
</style> 