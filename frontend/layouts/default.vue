<template>
  <div v-if="shouldRender" class="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors duration-300">
    <!-- Sidebar (only if logged in and user loaded) -->
    <ClientOnly>
      <Sidebar v-if="isLoggedIn && user" :open="sidebarOpen" :user="user" @toggle="sidebarOpen = !sidebarOpen" />
    </ClientOnly>

    <!-- Main content -->
    <div 
      :class="mainContentClasses" 
      class="main-content relative flex-1 flex flex-col min-h-screen transition-all duration-300 z-0"
    >
      <!-- Header (only if logged in) -->
      <ClientOnly>
        <Header v-if="isLoggedIn" :user="user" :pageTitle="pageTitle" @logout="handleLogout" @toggle-mobile-sidebar="toggleMobileSidebar" />
      </ClientOnly>
      
      <!-- Page content -->
      <main class="main-content relative p-6 flex-1 bg-gray-50 dark:bg-gray-900 z-0">
        <!-- Hydration-safe loading state -->
        <template v-if="!isHydrated">
          <!-- SSR-safe skeleton -->
          <div class="animate-pulse">
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </template>
        <template v-else>
          <slot />
        </template>
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
import { useHydrationState } from '~/composables/useHydration';
import { useMobileDetection } from '~/composables/useMobileDetection';

// Use centralized composables
const { isHydrated } = useHydrationState();
const { isMobile } = useMobileDetection();

// Initialize sidebar state with a default that works for both server and client
const sidebarOpen = ref(true); // Default to open for consistent SSR
const route = useRoute();

let mql;

const checkMobile = () => {
  if (import.meta.client) {
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
  // On server, render with stable collapsed margin to prevent shifting
  if (import.meta.server) {
    return 'ml-16'; // Stable collapsed state for SSR
  }
  
  // On client, apply margin based on sidebar state
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
    
    // Load sidebar state from localStorage
    const savedSidebarState = localStorage.getItem('sidebarOpen');
    if (savedSidebarState !== null) {
      sidebarOpen.value = savedSidebarState === 'true';
    }
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

/* Prevent content shifting during hydration */
.main-content {
  transition: margin-left 0.3s ease-in-out;
}

/* Disable transitions until hydrated to prevent flash */
.main-content:not(.hydrated) {
  transition: none;
}
</style> 