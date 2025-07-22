<template>
  <div v-if="shouldRender" class="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors duration-300">
    <!-- Sidebar (only if logged in and user loaded) -->
    <Sidebar v-if="isLoggedIn && user" :open="sidebarOpen" :user="user" @toggle="sidebarOpen = !sidebarOpen" />

    <!-- Main content -->
    <div :key="`main-${isLoggedIn}-${sidebarOpen}`" :class="mainContentClasses" class="relative flex-1 flex flex-col min-h-screen transition-all duration-300 z-10">
      <!-- Header (only if logged in) -->
      <Header v-if="isLoggedIn" :user="user" :pageTitle="pageTitle" @logout="handleLogout" @toggle-mobile-sidebar="toggleMobileSidebar" />
      <!-- Page content -->
      <main class="relative p-6 flex-1 bg-gray-50 dark:bg-gray-900 z-10">
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

const sidebarOpen = ref(window?.innerWidth >= 768);
const router = useRouter();
const route = useRoute();

// Mobile detection
const isMobile = ref(false);
let mql;

const checkMobile = () => {
  if (import.meta.client) {
    isMobile.value = window.innerWidth < 768;
    // Auto-close sidebar on mobile, open on desktop
    sidebarOpen.value = !isMobile.value;
  }
};

const authStore = useAuthStore();
const { initializeBranchContext } = useBranchContext();

const user = computed(() => authStore.currentUser);
const isLoggedIn = computed(() => authStore.isLoggedIn);

// Don't render layout until auth is initialized (client-side only)
const shouldRender = computed(() => {
  if (import.meta.server) return true; // Always render on server
  return !authStore.isInitializing;
});

// Computed class for main content to avoid hydration issues
const mainContentClasses = computed(() => {
  if (!isLoggedIn.value || isMobile.value) {
    return '';
  }
  return sidebarOpen.value ? 'ml-64' : 'ml-16';
});

const handleLogout = async () => {
  await authStore.logout();
  await navigateTo('/login');
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
  
  // Use Nuxt's useCookie for theme persistence
  const themeCookie = useCookie('theme');
  themeCookie.value = isDark.value ? 'dark' : 'light';
  
  // Apply theme using Nuxt's useHead
  useHead({
    htmlAttrs: {
      class: isDark.value ? 'dark' : ''
    }
  });
};

onMounted(async () => {
  // Check for saved theme preference using Nuxt's useCookie
  const themeCookie = useCookie('theme', { default: () => 'dark' });
  isDark.value = themeCookie.value === 'dark';
  
  // Apply theme using Nuxt's useHead
  useHead({
    htmlAttrs: {
      class: isDark.value ? 'dark' : ''
    }
  });

  // Initialize mobile detection (client-side only)
  if (import.meta.client) {
    checkMobile();
    mql = window.matchMedia('(max-width: 767px)');
    mql.addEventListener('change', checkMobile);
  }

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
  .ml-64, .ml-16 {
    margin-left: 0 !important;
  }
  
  /* Ensure content fills screen width on mobile */
  .flex-1 {
    width: 100%;
  }
  
  /* Adjust padding for mobile */
  .p-6 {
    padding: 1rem;
  }
  
  /* Handle overflow properly */
  .min-h-screen {
    min-height: 100vh;
    overflow-x: hidden;
  }
}
</style> 