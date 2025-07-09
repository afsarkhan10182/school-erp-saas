<template>
  <div class="space-y-6">
    <!-- Welcome section -->
    <div class="card">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">
        Welcome back, {{ user?.first_name }}!
      </h1>
      <p class="text-gray-600">
        Here's what's happening with your School ERP system.
      </p>
    </div>

    <!-- Stats grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="card">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span class="text-blue-600 font-bold">🏫</span>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Total Schools</p>
            <p class="text-2xl font-semibold text-gray-900">{{ stats.totalSchools || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span class="text-green-600 font-bold">🏢</span>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Total Branches</p>
            <p class="text-2xl font-semibold text-gray-900">{{ stats.totalBranches || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <span class="text-purple-600 font-bold">👥</span>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Total Users</p>
            <p class="text-2xl font-semibold text-gray-900">{{ stats.totalUsers || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span class="text-yellow-600 font-bold">📊</span>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Active Sessions</p>
            <p class="text-2xl font-semibold text-gray-900">{{ stats.activeSessions || 0 }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent activity -->
    <div class="card">
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

    <!-- Quick actions -->
    <div class="card">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NuxtLink
          to="/schools"
          class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span class="text-blue-600 text-xl mr-3">🏫</span>
          <span class="font-medium text-gray-900">Manage Schools</span>
        </NuxtLink>
        
        <NuxtLink
          to="/users"
          class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span class="text-green-600 text-xl mr-3">👥</span>
          <span class="font-medium text-gray-900">Manage Users</span>
        </NuxtLink>
        
        <NuxtLink
          to="/branches"
          class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span class="text-purple-600 text-xl mr-3">🏢</span>
          <span class="font-medium text-gray-900">Manage Branches</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const config = useRuntimeConfig();
const apiBase = config.public.apiBase;

// Get user from localStorage
const user = ref(null);
const stats = ref({
  totalSchools: 0,
  totalBranches: 0,
  totalUsers: 0,
  activeSessions: 0
});

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

// Load user data and fetch stats
onMounted(async () => {
  // Get user from localStorage
  const userData = localStorage.getItem('user');
  if (userData) {
    user.value = JSON.parse(userData);
  }

  // Fetch dashboard stats from API
  try {
    const token = localStorage.getItem('auth-token');
    if (token) {
      const response = await fetch(`${apiBase}/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          stats.value = data.data;
        }
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