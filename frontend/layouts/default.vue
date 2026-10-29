<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex w-full overflow-x-hidden">
    <ClientOnly>
      <Sidebar
        v-if="isLoggedIn && user && !isAuthPage"
        :open="sidebarOpen"
        :user="user"
        @toggle="toggleSidebar"
      />
    </ClientOnly>

    <div
      :class="mainContentClasses"
      class="main-content-wrapper relative flex-1 flex flex-col min-h-screen min-w-0 max-w-full transition-[margin] duration-150"
    >
      <ClientOnly>
        <Header
          v-if="isLoggedIn && !isAuthPage"
          :user="user"
          :pageTitle="pageTitle"
          @logout="handleLogout"
          @toggle-mobile-sidebar="toggleSidebar"
        />
      </ClientOnly>

      <main
        class="relative flex-1 min-w-0 max-w-full bg-gray-50 dark:bg-gray-900 overflow-x-hidden"
        :class="{ 'p-4 sm:p-6 lg:p-8': isHydrated && isLoggedIn && !isAuthPage }"
      >
        <template v-if="!isHydrated">
          <div class="animate-pulse space-y-4">
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div class="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
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

const isAuthPage = computed(() => route.path?.startsWith('/auth/'));

const mainContentClasses = computed(() => {
  if (!isHydrated.value || !isLoggedIn.value || isAuthPage.value) return 'w-full ml-0';
  if (isMobile.value) return 'w-full ml-0';
  return sidebarOpen.value ? 'lg:ml-64' : 'lg:ml-16';
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
  if (route?.meta?.title) {
    return String(route.meta.title);
  }
  if (!route?.path) return 'School ERP';

  const path = route.path;
  if (/^\/exams\/[^/]+\/results$/.test(path)) return 'Exam Results';
  const titleMap = {
    '/dashboard': 'Dashboard',
    '/cards/templates': 'Card Templates',
    '/cards': 'ID / Admit Cards',
    '/certificates/generate-students': 'Student Certificates',
    '/certificates/generate-employees': 'Employee Certificates',
    '/certificates/templates': 'Certificate Templates',
    '/certificates': 'Certificates',
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
    '/academic/study-materials': 'Study Center',
    '/academic/classwork': 'Classwork & Logbook',
    '/academic': 'Academic Management',
    '/attendance': 'Attendance',
    '/attendance/analytics': 'Attendance Analytics',
    '/homework': 'Homework',
    '/library/library_category': 'Book Categories',
    '/library': 'Library',
    '/reception/gate-passes': 'Gate Passes',
    '/reception/enquiry': 'Admission Enquiries',
    '/reception/visitor': 'Visitors',
    '/reception/call_log': 'Call Logs',
    '/reception/postal': 'Postal Records',
    '/reception/complaint': 'Complaints',
    '/reception': 'Reception',
    '/exams/marks-entry': 'Marks Entry',
    '/exams/results': 'Exam Results',
    '/exams/report-cards': 'Report Cards',
    '/exams/types': 'Exam Types',
    '/exams': 'Exams',
    '/reports/exams': 'Exam Reports',
    '/reports/attendance': 'Attendance Reports',
    '/reports': 'Reports',
    '/settings': 'Settings',
    '/saas': 'SaaS Dashboard'
  };

  const matched = Object.keys(titleMap)
    .sort((a, b) => b.length - a.length)
    .find(key => path.startsWith(key));

  return matched ? titleMap[matched] : 'School ERP';
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
    sidebarOpen.value = false; // Always closed on mobile/tablet drawer
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
    mql = window.matchMedia('(max-width: 1023px)');
    mql.addEventListener('change', e => {
      if (e.matches) {
        sidebarOpen.value = false; // Close drawer on mobile/tablet
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

watch(isLoggedIn, async (newVal) => {
  if (newVal) {
    await fetchBranchesForUser();
  }
});

onUnmounted(() => {
  if (mql) mql.removeEventListener('change', () => {});
});
</script>

<style scoped>
.main-content-wrapper {
  transition: margin-left 0.15s ease-out, width 0.15s ease-out;
  position: relative;
  z-index: 1;
}

@media (max-width: 1023px) {
  .main-content-wrapper {
    margin-left: 0 !important;
    width: 100% !important;
  }
}

@media (min-width: 1024px) {
  .lg\:ml-64 {
    margin-left: 16rem !important;
    width: calc(100% - 16rem) !important;
  }

  .lg\:ml-16 {
    margin-left: 4rem !important;
    width: calc(100% - 4rem) !important;
  }
}
</style>
