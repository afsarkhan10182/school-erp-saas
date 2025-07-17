<template>
  <!-- Mobile overlay -->
  <div v-if="isMobile && open" class="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden" @click="$emit('toggle')"></div>
  
  <!-- Sidebar -->
  <div 
:class="[
      'fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-300 flex flex-col', 
      isMobile ? (open ? 'w-64 translate-x-0' : 'w-64 -translate-x-full') : (open ? 'w-64' : 'w-16'),
      isMobile ? 'md:w-16 md:translate-x-0' : '',
      'transform' // Add transform class for smoother transitions
    ]"
  >
    <!-- Logo/Brand Header -->
    <div class="flex-shrink-0 flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center">
        <div class="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center cursor-pointer" @click="$emit('toggle')">
          <School class="w-5 h-5 text-white" />
        </div>
        <span v-if="open || isMobile" class="ml-3 text-lg font-semibold text-gray-900 dark:text-white">School ERP</span>
      </div>
      <button
        v-if="open || isMobile"
        @click="$emit('toggle')"
        class="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <ChevronLeft v-if="!isMobile" class="w-5 h-5" />
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Scrollable Navigation -->
    <div class="flex-1 overflow-y-auto overflow-x-hidden">
      <nav class="px-2 py-4 space-y-2">
        <!-- Dashboard -->
        <div class="relative group">
          <NuxtLink :to="'/dashboard'" :class="navClass('/dashboard')">
            <Home class="w-5 h-5" :class="{ 'mr-3': open || isMobile }" />
            <span v-if="open || isMobile">Dashboard</span>
          </NuxtLink>
          <!-- Hover Menu for Collapsed State -->
          <div v-if="!open && !isMobile" 
               class="hidden group-hover:block absolute left-full top-0 ml-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 px-3 min-w-[200px] z-[60] border border-gray-200 dark:border-gray-700">
            <span class="text-sm font-medium text-gray-900 dark:text-white">Dashboard</span>
          </div>
        </div>
        
        <!-- Navigation Menu Items -->
        <template v-for="menuGroup in visibleMenuGroups" :key="menuGroup.id">
          <!-- Menu Group Header -->
          <div v-if="open || isMobile" class="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {{ menuGroup.title }}
          </div>
          
          <!-- Menu Items -->
          <template v-for="menuItem in menuGroup.items" :key="menuItem.id">
            <!-- Collapsible Menu -->
            <div v-if="menuItem.children" class="space-y-1 relative group">
              <div 
                :class="[navClass(''), menuOpen === menuItem.id ? 'bg-gray-100 dark:bg-gray-700' : '']"
                @click="open ? toggleMenu(menuItem.id) : null"
              >
                <component :is="menuItem.icon" class="w-5 h-5" :class="{ 'mr-3': open || isMobile }" />
                <span v-if="open || isMobile" class="flex-1">{{ menuItem.title }}</span>
                <ChevronDown 
                  v-if="open || isMobile"
                  class="w-4 h-4 transition-transform duration-200" 
                  :class="{ 'rotate-180': menuOpen === menuItem.id }"
                />
              </div>
            <!-- Hover Menu for Collapsed State -->
              <div v-if="!open && !isMobile" 
                   class="hidden group-hover:block absolute left-full top-0 ml-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 min-w-[200px] z-[60] border border-gray-200 dark:border-gray-700">
                <div class="px-3 py-2 font-medium text-sm text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700">
                  {{ menuItem.title }}
                </div>
                <div class="py-1">
                  <NuxtLink 
                    v-for="subItem in menuItem.children" 
                    :key="subItem.id"
                    :to="subItem.path" 
                    class="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-gray-700 dark:hover:text-indigo-300"
                  >
                    <component :is="subItem.icon" class="w-4 h-4 mr-2" />
                    <span>{{ subItem.title }}</span>
                  </NuxtLink>
                </div>
              </div>
              
              <!-- Submenu Items -->
              <div 
                v-show="menuOpen === menuItem.id && open" 
                class="overflow-hidden transition-all duration-300"
                :class="[open ? 'max-h-96' : 'max-h-0']"
              >
                <div class="ml-8 space-y-1 py-1">
                  <NuxtLink 
                    v-for="subItem in menuItem.children" 
                    :key="subItem.id"
                    :to="subItem.path" 
                    :class="navClass(subItem.path)"
                  >
                    <component :is="subItem.icon" class="w-5 h-5 mr-3" />
                    <span>{{ subItem.title }}</span>
                  </NuxtLink>
                </div>
              </div>
            </div>
            
            <!-- Direct Link Menu -->
            <div v-else class="relative group">
              <NuxtLink :to="menuItem.path" :class="navClass(menuItem.path)">
                <component :is="menuItem.icon" class="w-5 h-5" :class="{ 'mr-3': open || isMobile }" />
                <span v-if="open || isMobile">{{ menuItem.title }}</span>
              </NuxtLink>
              <!-- Hover Menu for Collapsed State -->
              <div v-if="!open && !isMobile" 
                   class="hidden group-hover:block absolute left-full top-0 ml-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 px-3 min-w-[200px] z-[60] border border-gray-200 dark:border-gray-700">
                <span class="text-sm font-medium text-gray-900 dark:text-white">{{ menuItem.title }}</span>
              </div>
            </div>
          </template>
        </template>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '~/stores/auth';
import { 
  Home, 
  School, 
  Building2, 
  Users, 
  UserPlus, 
  GraduationCap,
  DollarSign,
  CreditCard,
  Receipt,
  BarChart3,
  PieChart,
  TrendingUp,
  BookOpen,
  Calendar,
  List,
  Tag,
  ClipboardList,
  User,
  Settings,
  UserCheck,
  ChevronLeft,
  ChevronDown,
  FileText
} from 'lucide-vue-next';

const props = defineProps({
  open: {
    type: Boolean,
    default: () => {
      // Try to get stored state first, fallback to window width check
      if (typeof window !== 'undefined' && localStorage.getItem('sidebarOpen') !== null) {
        return localStorage.getItem('sidebarOpen') === 'true';
      }
      return window?.innerWidth > 768;
    }
  },
  user: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['toggle']);

// Function to save sidebar state
const saveSidebarState = (isOpen) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sidebarOpen', isOpen.toString());
  }
};

const authStore = useAuthStore();
const menuOpen = ref('');

// Watch for sidebar state changes
watch(() => props.open, (newValue) => {
  if (!newValue) {
    menuOpen.value = '';
  }
  // Save state to localStorage whenever it changes
  saveSidebarState(newValue);
});

// Role checks
const isSuperAdmin = computed(() => props.user?.role === 'super_admin');
const isSchoolAdmin = computed(() => props.user?.role === 'school_admin');
const isBranchAdmin = computed(() => props.user?.role === 'branch_admin');
const isAccountant = computed(() => props.user?.role === 'accountant');
const isReceptionist = computed(() => props.user?.role === 'receptionist');

// Menu configuration
const menuGroups = computed(() => {
  const groups = [];

  // Platform & Subscription Management (Super Admin Only)
  if (isSuperAdmin.value) {
    groups.push({
      id: 'subscription',
      title: 'Saas Subscription',
      items: [
        {
          id: 'subscription-management',
          title: 'School Subscription',
          icon: CreditCard,
          children: [
             { id: 'customer-overview', title: 'Overview', path: '/subscriptions', icon: BarChart3 },
            { id: 'subscription-plans', title: 'Subscription Plans', path: '/subscriptions/plans', icon: List },
            { id: 'renewal-requests', title: 'Renewal Requests', path: '/subscriptions/renewal-requests', icon: FileText },
          ]
        },
      ]
    });

    // School Administration (Super Admin)
    groups.push({
      id: 'school-admin',
      title: 'School Administration',
      items: [
        { id: 'manage-branches', title: 'Branches', path: '/branches', icon: Building2 },
      ]
    });
  }

  // Student Management
  if (isSuperAdmin.value || isSchoolAdmin.value || isBranchAdmin.value || isReceptionist.value) {
    groups.push({
      id: 'students',
      title: 'Student Management',
      items: [
        {
          id: 'admission',
          title: 'Admission',
          icon: GraduationCap,
          children: [
            { id: 'new-admission', title: 'New Admission', path: '/admissions/create', icon: UserPlus },
            { id: 'all-students', title: 'All Students', path: '/students', icon: Users },
            { id: 'applications', title: 'Total Applications', path: '/admissions', icon: ClipboardList },
          ]
        }
      ]
    });
  }

  // Fee Management
  if (isSuperAdmin.value || isSchoolAdmin.value || isBranchAdmin.value || isAccountant.value) {
    groups.push({
      id: 'fees',
      title: 'Fee Management',
      items: [
        {
          id: 'fee-management',
          title: 'Fees',
          icon: DollarSign,
          children: [
            { id: 'fee-types', title: 'Fee Types', path: '/fees/types', icon: Tag },
            { id: 'fee-structures', title: 'Fee Structures', path: '/fees/structures', icon: List },
            { id: 'invoices', title: 'Invoices', path: '/fees/invoices', icon: Receipt }
          ]
        }
      ]
    });
  }

  // Academic Management
  if (isSuperAdmin.value || isSchoolAdmin.value || isBranchAdmin.value) {
    groups.push({
      id: 'academic',
      title: 'Academic Management',
      items: [
        {
          id: 'academic',
          title: 'Academic',
          icon: BookOpen,
          children: [
            // Academic Years - only for super admin and school admin
            ...(isSuperAdmin.value || isSchoolAdmin.value ? [
              // { id: 'academic-years', title: 'Academic Years', path: '/academic/years', icon: Calendar }
            ] : []),
            { id: 'classes', title: 'Classes', path: '/academic/classes', icon: GraduationCap },
            { id: 'sections', title: 'Sections', path: '/academic/sections', icon: Users },
          ]
        }
      ]
    });
  }

  // Reports & Analytics
  if (isSuperAdmin.value || isSchoolAdmin.value || isBranchAdmin.value || isAccountant.value) {
    groups.push({
      id: 'reports',
      title: 'Reports & Analytics',
      items: [
        { id: 'student-reports', title: 'Student Reports', path: '/reports/students', icon: BarChart3 },
        { id: 'fee-reports', title: 'Fee Reports', path: '/reports/fees', icon: PieChart },
        { id: 'admission-reports', title: 'Admission Reports', path: '/reports/admissions', icon: TrendingUp },
      ]
    });
  }

  // Front Office (Receptionist)
  if (isReceptionist.value) {
    groups.push({
      id: 'front-office',
      title: 'Front Office',
      items: [
        { id: 'new-admission', title: 'New Admission', path: '/admissions/create', icon: UserPlus },
        { id: 'applications', title: 'Applications', path: '/admissions', icon: ClipboardList },
        { id: 'visitors', title: 'Visitors', path: '/visitors', icon: UserCheck },
      ]
    });
  }

  // Settings
  if (isSuperAdmin.value || isSchoolAdmin.value || isBranchAdmin.value) {
    groups.push({
      id: 'settings',
      title: 'Settings',
      items: [
        { id: 'staff-list', title: isSuperAdmin.value ? 'User List' : 'Staff List', path: '/users', icon: Users },
        { id: 'profile', title: 'Profile', path: '/settings/profile', icon: User },
        { id: 'branch-settings', title: 'Branch Settings', path: '/settings/branch', icon: Building2 },
        { id: 'module-settings', title: 'Module Settings', path: '/settings/modules', icon: Settings },
      ]
    });
  }

  return groups;
});

// Get visible menu groups based on user role
const visibleMenuGroups = computed(() => {
  return menuGroups.value;
});

const toggleMenu = (menu) => {
  menuOpen.value = menuOpen.value === menu ? '' : menu;
};

const navClass = (path) => {
  const route = useRoute();
  const isActive = path ? route.path === path : false;
  return [
    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer',
    isActive
      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
  ];
};

const subNavClass = (path) => {
  return navClass(path);
};

const logout = async () => {
  await authStore.logout();
  await navigateTo('/login');
};

// Mobile detection
const isMobile = ref(false);
let mql;

const checkMobile = () => {
  if (window) {
    const newIsMobile = window.innerWidth < 768;
    if (newIsMobile !== isMobile.value) {
      isMobile.value = newIsMobile;
      const shouldBeOpen = !newIsMobile;
      emit('toggle', shouldBeOpen);
      saveSidebarState(shouldBeOpen); // Save state when toggling based on mobile detection
    }
  }
};

onMounted(() => {
  checkMobile();
  mql = window.matchMedia('(max-width: 767px)');
  mql.addEventListener('change', checkMobile);
});

onUnmounted(() => {
  if (mql) mql.removeEventListener('change', checkMobile);
});
</script>

<style scoped>
/* Custom scrollbar for sidebar */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3);
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.5);
}

/* Dark mode scrollbar */
.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(75, 85, 99, 0.3);
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(75, 85, 99, 0.5);
}

/* Smooth transitions */
.slide-sidebar-enter-active,
.slide-sidebar-leave-active {
  transition: transform 0.3s ease;
}

.slide-sidebar-enter-from,
.slide-sidebar-leave-to {
  transform: translateX(-100%);
}

.slide-sidebar-enter-to,
.slide-sidebar-leave-from {
  transform: translateX(0);
}

/* Ensure proper spacing and prevent content overflow */
nav {
  min-height: 0;
}

/* Smooth menu transitions */
.space-y-1 > * + * {
  margin-top: 0.25rem;
}

.space-y-2 > * + * {
  margin-top: 0.5rem;
}
</style>
