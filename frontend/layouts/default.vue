<template>
  <div
    v-if="shouldRender"
    class="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors duration-300"
  >
    <ClientOnly>
      <Sidebar v-if="isLoggedIn && user" :open="sidebarOpen" :user="user" @toggle="toggleSidebar" />
    </ClientOnly>

    <div
      :class="mainContentClasses"
      class="main-content relative flex-1 flex flex-col min-h-screen transition-all duration-300"
      :style="{ marginLeft: isHydrated ? undefined : '16rem' }"
    >
      <ClientOnly>
        <Header
          v-if="isLoggedIn"
          :user="user"
          :pageTitle="pageTitle"
          @logout="handleLogout"
          @toggle-mobile-sidebar="toggleSidebar"
        />
      </ClientOnly>

      <main class="main-content relative p-6 flex-1 bg-gray-50 dark:bg-gray-900">
        <template v-if="!isHydrated">
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

const { isHydrated } = useHydrationState();
const { isMobile } = useMobileDetection();

const sidebarOpen = ref(true); // Default to open for desktop

const route = useRoute();
const authStore = useAuthStore();
const { initializeBranchContext } = useBranchContext();

const user = computed(() => authStore.currentUser);
const isLoggedIn = computed(() => authStore.isLoggedIn);

const shouldRender = computed(() => {
  if (import.meta.server) return true;
  return !authStore.isInitializing && isHydrated.value;
});

const mainContentClasses = computed(() => {
  if (!isLoggedIn.value || isMobile.value) return '';
  return sidebarOpen.value ? 'ml-64' : 'ml-16';
});

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
  if (import.meta.client && !isMobile.value) {
    localStorage.setItem('sidebarOpen', sidebarOpen.value.toString());
  }
};

const handleLogout = async () => {
  await authStore.logout();
  await navigateTo('/login');
};

const pageTitle = computed(() => {
  if (!route?.path) return 'School ERP';

  const path = route.path;
  const titleMap = {
    '/dashboard': 'Dashboard',
    '/schools': 'Schools',
    '/users': 'Users',
    '/branches': 'Branches',
    '/students': 'Students',
    '/fees': 'Fee Management',
    '/academic': 'Academic Management',
    '/reports': 'Reports',
    '/settings': 'Settings',
    '/saas': 'Subscriptions'
  };

  return titleMap[Object.keys(titleMap).find(key => path.startsWith(key))] || 'School ERP';
});

useHead({
  title: computed(() => pageTitle.value)
});

const isDark = ref(false);

const toggleTheme = () => {
  isDark.value = !isDark.value;
  const themeCookie = useCookie('theme');
  themeCookie.value = isDark.value ? 'dark' : 'light';
  useHead({
    htmlAttrs: {
      class: isDark.value ? 'dark' : ''
    }
  });
};

let mql;

const initializeSidebar = () => {
  if (!isMobile.value) {
    const savedState = localStorage.getItem('sidebarOpen');
    sidebarOpen.value = savedState !== null ? savedState === 'true' : true; // Default to true for desktop
  } else {
    sidebarOpen.value = false; // Always closed on mobile
  }
};

onMounted(async () => {
  const themeCookie = useCookie('theme', { default: () => 'dark' });
  isDark.value = themeCookie.value === 'dark';

  useHead({
    htmlAttrs: {
      class: isDark.value ? 'dark' : ''
    }
  });

  if (import.meta.client) {
    initializeSidebar();
    mql = window.matchMedia('(max-width: 767px)');
    mql.addEventListener('change', () => {
      if (isMobile.value) {
        sidebarOpen.value = false; // Close on mobile
      } else {
        const savedState = localStorage.getItem('sidebarOpen');
        sidebarOpen.value = savedState !== null ? savedState === 'true' : true; // Default to true for desktop
      }
    });
  }

  if (authStore.isLoggedIn) {
    await initializeBranchContext();
  }
});

onUnmounted(() => {
  if (mql) mql.removeEventListener('change', () => {});
});
</script>

<style scoped>
@media (max-width: 768px) {
  .ml-64,
  .ml-16 {
    margin-left: 0 !important;
  }

  .flex-1 {
    width: 100%;
  }

  .p-6 {
    padding: 1rem;
  }

  .min-h-screen {
    min-height: 100vh;
    overflow-x: hidden;
  }
}

.main-content {
  transition: margin-left 0.3s ease-in-out;
  /* Ensure main content doesn't overlap sidebar */
  position: relative;
  z-index: 1;
}

.ml-64 {
  margin-left: 16rem !important;
}

.ml-16 {
  margin-left: 4rem !important;
}

/* Prevent overlapping during hydration */
.min-h-screen {
  position: relative;
  overflow-x: hidden;
}

/* Ensure proper stacking context */
.flex {
  position: relative;
}

/* Prevent content from appearing above sidebar during page load */
.main-content {
  isolation: isolate;
}
</style>
