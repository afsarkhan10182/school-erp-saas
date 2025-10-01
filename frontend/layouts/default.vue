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

      <main
        class="main-content relative flex-1 bg-gray-50 dark:bg-gray-900"
        :class="{ 'p-6': isLoggedIn }"
      >
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
import Sidebar from '~/components/layout/Sidebar.vue';
import Header from '~/components/layout/Header.vue';
import Toast from '~/components/ui/Toast.vue';
import { useAuth } from '~/composables/useAuth';
import { useBranches } from '~/composables/useBranches';
import { useHydrationState } from '~/composables/useHydration';
import { useMobileDetection } from '~/composables/useMobileDetection';

const { isHydrated } = useHydrationState();
const { isMobile } = useMobileDetection();

const sidebarOpen = ref(true); // Default to open for desktop

const route = useRoute();
const { user } = useAuth();
const { fetchBranchesForUser } = useBranches();
const { isLoggedIn } = useAuth();

const shouldRender = computed(() => {
  if (import.meta.server) return true;
  return isHydrated.value;
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
  const { logout } = useAuth();
  await logout();
  await navigateTo('/auth/login');
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
    '/academic/class-assignments': 'Class Assignments',
    '/academic/subjects': 'Subjects',
    '/academic/timetable': 'Timetable',
    '/academic/classes': 'Classes',
    '/academic/sections': 'Sections',
    '/academic/streams': 'Streams',
    '/academic/years': 'Academic Years',
    '/academic/calendar': 'Academic Calendar',
    '/academic/workload': 'Teacher Workload',
    '/academic/timetables': 'Timetables',
    '/academic': 'Academic Management',
    '/attendance': 'Attendance',
    '/attendance/analytics': 'Attendance Analytics',
    '/exams': 'Exams',
    '/exams/types': 'Exam Types',
    '/exams/marks-entry': 'Marks Entry',
    '/exams/results': 'Exam Results',
    '/exams/report-cards': 'Report Cards',
    '/reports': 'Reports',
    '/reports/attendance': 'Attendance Reports',
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

  if (import.meta.client) {
    // Use the same approach as theme.client.ts
    if (isDark.value) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }

    // Also update cookie for SSR consistency
    const themeCookie = useCookie('theme');
    themeCookie.value = isDark.value ? 'dark' : 'light';
  }
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
  // Don't override theme - let theme.client.ts handle it
  // Just sync the local state with the actual DOM state
  if (import.meta.client) {
    isDark.value = document.documentElement.classList.contains('dark');
  }

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

  if (isLoggedIn.value) {
    await fetchBranchesForUser();
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
