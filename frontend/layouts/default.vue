<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors duration-300">
    <!-- Sidebar (only if logged in and user loaded, client-only) -->
    <client-only>
      <Sidebar v-if="isLoggedIn && user" :open="sidebarOpen" :user="user" @toggle="sidebarOpen = !sidebarOpen" />
    </client-only>

    <!-- Main content -->
    <div :class="isLoggedIn && !isMobile ? (sidebarOpen ? 'ml-64' : 'ml-16') : ''" class="flex-1 flex flex-col min-h-screen transition-all duration-300">
      <!-- Header (only if logged in) -->
      <Header v-if="isLoggedIn" :user="user" :pageTitle="pageTitle" @logout="handleLogout" @toggle-mobile-sidebar="toggleMobileSidebar" />
      <!-- Page content -->
      <main class="p-6 flex-1 bg-gray-50 dark:bg-gray-900">
        <slot />
      </main>
    </div>
    
    <!-- Global Toast Notification -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Sidebar from '~/components/Sidebar.vue';
import Header from '~/components/Header.vue';
import Toast from '~/components/Toast.vue';
import { useAuthStore } from '~/stores/auth';
import { useBranchContext } from '~/composables/useBranchContext';

const sidebarOpen = ref(false);
const router = useRouter();
const route = useRoute();

// Mobile detection
const isMobile = ref(false);
let mql;

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
  // Auto-close sidebar on mobile, open on desktop
  sidebarOpen.value = !isMobile.value;
};

const authStore = useAuthStore();
const { initializeBranchContext } = useBranchContext();

const user = computed(() => authStore.currentUser);
const isLoggedIn = computed(() => authStore.isLoggedIn);

const handleLogout = async () => {
  await authStore.logout();
  await router.push('/login');
};

const toggleMobileSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const pageTitle = computed(() => {
  const path = route.path;
  if (path.startsWith('/dashboard')) return 'Dashboard';
  if (path.startsWith('/schools')) return 'Schools';
  if (path.startsWith('/users')) return 'Users';
  if (path.startsWith('/branches')) return 'Branches';
  if (path.startsWith('/students')) return 'Students';
  if (path.startsWith('/admissions')) return 'Admissions';
  if (path.startsWith('/fees')) return 'Fee Management';
  if (path.startsWith('/academic')) return 'Academic Management';
  if (path.startsWith('/reports')) return 'Reports';
  if (path.startsWith('/settings')) return 'Settings';
  if (path.startsWith('/subscriptions')) return 'Subscriptions';
  return 'School ERP';
});

// Theme management
const isDark = ref(false);

const toggleTheme = () => {
  isDark.value = !isDark.value;
  if (isDark.value) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
};

onMounted(async () => {
  // Check for saved theme preference or default to dark
  const savedTheme = localStorage.getItem('theme') || 'dark';
  isDark.value = savedTheme === 'dark';
  if (isDark.value) {
    document.documentElement.classList.add('dark');
  }

  // Initialize mobile detection
  checkMobile();
  mql = window.matchMedia('(max-width: 767px)');
  mql.addEventListener('change', checkMobile);

  // Initialize branch context if user is logged in
  if (authStore.isLoggedIn) {
    await initializeBranchContext();
  }
});

onUnmounted(() => {
  if (mql) mql.removeEventListener('change', checkMobile);
});
</script>

<style scoped>
@media (max-width: 768px) {
  aside {
    display: none;
  }
  .ml-64, .ml-16 {
    margin-left: 0 !important;
  }
}
</style> 