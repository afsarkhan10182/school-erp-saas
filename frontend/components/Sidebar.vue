<template>
  <!-- Mobile overlay -->
  <div
    v-if="isMobile && open"
    class="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden backdrop-blur-sm"
    @click="$emit('toggle')"
    @touchmove.prevent
  ></div>

  <!-- Sidebar -->
  <div
    :class="[
      'sidebar-container fixed inset-y-0 left-0 z-[99999] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-lg flex flex-col',
      sidebarClasses,
      'transform transition-all duration-300 ease-in-out will-change-transform'
    ]"
  >
    <!-- Logo/Brand Header -->
    <div
      class="flex-shrink-0 flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700"
    >
      <div class="flex items-center">
        <div
          class="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center cursor-pointer"
          @click="$emit('toggle')"
        >
          <School class="w-5 h-5 text-white" />
        </div>
        <span
          v-if="open || isMobile"
          class="ml-3 text-lg font-semibold text-gray-900 dark:text-white"
          >School ERP</span
        >
      </div>
      <button
        v-if="open || isMobile"
        @click="$emit('toggle')"
        class="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <ChevronLeft v-if="!isMobile" class="w-5 h-5" />
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <!-- Scrollable Navigation -->
    <div class="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
      <!-- SSR-safe skeleton for initial load -->
      <template v-if="!isHydrated">
        <div class="px-2 py-4 space-y-2">
          <div class="animate-pulse">
            <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2"></div>
            <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2"></div>
            <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2"></div>
            <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </template>

      <!-- Loading state for modules -->
      <div v-if="modulesLoading" class="px-2 py-4 space-y-2">
        <div class="animate-pulse">
          <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2"></div>
          <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2"></div>
          <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2"></div>
          <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>

      <!-- Actual navigation content -->
      <nav v-else class="px-2 py-4 space-y-2">
        <!-- Dashboard -->
        <div class="relative group">
          <NuxtLink
            :to="'/dashboard'"
            :class="navClass('/dashboard')"
            @click="handleMenuClick('/dashboard', $event)"
          >
            <Home class="w-5 h-5" :class="{ 'mr-3': open || isMobile }" />
            <span v-if="open || isMobile">Dashboard</span>
          </NuxtLink>
          <!-- Hover Menu for Collapsed State -->
          <div
            v-if="!open && !isMobile"
            class="hidden group-hover:block absolute left-full top-0 ml-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 px-3 min-w-[200px] z-40 border border-gray-200 dark:border-gray-700"
          >
            <span class="text-sm font-medium text-gray-900 dark:text-white">Dashboard</span>
          </div>
        </div>

        <!-- Navigation Menu Items -->
        <template v-for="menuGroup in visibleMenuGroups" :key="menuGroup.id">
          <!-- Menu Group Header -->
          <div
            v-if="open || isMobile"
            class="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider sidebar-group-header"
          >
            {{ menuGroup.title }}
          </div>

          <!-- Menu Items -->
          <template v-for="menuItem in menuGroup.items" :key="menuItem.id">
            <!-- Direct Link Menu Item (no children or empty children, has path) -->
            <NuxtLink
              v-if="(!menuItem.children || menuItem.children.length === 0) && menuItem.path"
              :to="menuItem.path"
              :class="navClass(menuItem.path)"
              @click="handleMenuClick(menuItem.path, $event)"
              @auxclick="
                $event.button === 1
                  ? window.open($router.resolve(menuItem.path).href, '_blank')
                  : null
              "
            >
              <component
                :is="menuItem.icon"
                class="w-5 h-5"
                :class="{ 'mr-3': open || isMobile }"
              />
              <span v-if="open || isMobile" class="flex-1">{{ menuItem.title }}</span>
            </NuxtLink>

            <!-- Collapsible Menu -->
            <div
              v-else-if="menuItem.children && menuItem.children.length > 0"
              class="space-y-1 relative group"
            >
              <div
                :class="[
                  navClass(''),
                  menuOpen === menuItem.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                ]"
                @click="toggleMenu(menuItem.id)"
              >
                <component
                  :is="menuItem.icon"
                  class="w-5 h-5"
                  :class="{ 'mr-3': open || isMobile }"
                />
                <span v-if="open || isMobile" class="flex-1">{{ menuItem.title }}</span>
                <!-- Chevron only for top-level collapsibles -->
                <ChevronDown
                  v-if="open || isMobile"
                  class="w-4 h-4 transition-transform duration-200"
                  :class="{ 'rotate-180': menuOpen === menuItem.id }"
                />
              </div>
              <!-- Hover Menu for Collapsed State -->
              <div
                v-if="!open && !isMobile"
                class="hidden group-hover:block absolute left-full top-0 ml-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 min-w-[200px] z-40 border border-gray-200 dark:border-gray-700 transform-gpu translate-y-0"
              >
                <div
                  class="px-3 py-2 font-medium text-sm text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700"
                >
                  {{ menuItem.title }}
                </div>
                <div class="py-1">
                  <template v-for="subItem in menuItem.children" :key="subItem.id">
                    <!-- If subItem has children (nested submenu) -->
                    <div
                      v-if="subItem.children && subItem.children.length > 0"
                      class="relative group/sub"
                    >
                      <div
                        class="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-gray-700 dark:hover:text-indigo-300"
                      >
                        <component :is="subItem.icon" class="w-4 h-4 mr-2" />
                        <span>{{ subItem.title }}</span>
                        <!-- No chevron in hover menus for nested items -->
                      </div>
                      <!-- Nested hover menu -->
                      <div
                        class="hidden group-hover/sub:block absolute left-full top-0 ml-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 min-w-[180px] z-50 border border-gray-200 dark:border-gray-700"
                      >
                        <div
                          class="px-3 py-2 font-medium text-xs text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700"
                        >
                          {{ subItem.title }}
                        </div>
                        <div class="py-1">
                          <NuxtLink
                            v-for="nestedItem in subItem.children"
                            :key="nestedItem.id"
                            :to="nestedItem.path"
                            class="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-gray-700 dark:hover:text-indigo-300"
                            @click.middle.prevent="
                              $event.ctrlKey || $event.metaKey
                                ? window.open($router.resolve(nestedItem.path).href, '_blank')
                                : null
                            "
                          >
                            <component :is="nestedItem.icon" class="w-4 h-4 mr-2" />
                            <span>{{ nestedItem.title }}</span>
                          </NuxtLink>
                        </div>
                      </div>
                    </div>
                    <!-- Direct submenu item -->
                    <NuxtLink
                      v-else
                      :to="subItem.path"
                      class="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-gray-700 dark:hover:text-indigo-300"
                      @click.middle.prevent="
                        $event.ctrlKey || $event.metaKey
                          ? window.open($router.resolve(subItem.path).href, '_blank')
                          : null
                      "
                    >
                      <component :is="subItem.icon" class="w-4 h-4 mr-2" />
                      <span>{{ subItem.title }}</span>
                    </NuxtLink>
                  </template>
                </div>
              </div>

              <!-- Submenu Items -->
              <div
                v-show="menuOpen === menuItem.id && open"
                class="overflow-hidden transition-all duration-300 ease-in-out"
                :class="[open ? 'max-h-96' : 'max-h-0']"
              >
                <div class="ml-8 space-y-1 py-1">
                  <!-- Handle nested submenus -->
                  <template v-for="subItem in menuItem.children" :key="subItem.id">
                    <!-- If subItem has children (nested submenu) -->
                    <div v-if="subItem.children && subItem.children.length > 0" class="space-y-1">
                      <div
                        :class="[
                          navClass(''),
                          subMenuOpen === subItem.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                        ]"
                        @click="toggleSubMenu(subItem.id)"
                      >
                        <component :is="subItem.icon" class="w-5 h-5 mr-3" />
                        <span class="flex-1">{{ subItem.title }}</span>
                        <!-- Show chevron ONLY in expanded sidebar mode for nested submenus -->
                        <ChevronDown
                          v-if="open && subItem.children.length > 0"
                          class="w-4 h-4 transition-transform duration-200"
                          :class="{ 'rotate-180': subMenuOpen === subItem.id }"
                        />
                      </div>
                      <!-- Nested submenu items -->
                      <div
                        v-show="subMenuOpen === subItem.id && open"
                        class="overflow-hidden transition-all duration-300 ease-in-out"
                        :class="[open ? 'max-h-96' : 'max-h-0']"
                      >
                        <div class="ml-8 space-y-1 py-1">
                          <NuxtLink
                            v-for="nestedItem in subItem.children"
                            :key="nestedItem.id"
                            :to="nestedItem.path"
                            :class="navClass(nestedItem.path)"
                            @click="handleMenuClick(nestedItem.path, $event)"
                            @auxclick="
                              $event.button === 1
                                ? window.open($router.resolve(nestedItem.path).href, '_blank')
                                : null
                            "
                          >
                            <component :is="nestedItem.icon" class="w-5 h-5 mr-3" />
                            <span>{{ nestedItem.title }}</span>
                          </NuxtLink>
                        </div>
                      </div>
                    </div>
                    <!-- Direct submenu item -->
                    <NuxtLink
                      v-else
                      :to="subItem.path"
                      :class="navClass(subItem.path)"
                      @click="handleMenuClick(subItem.path, $event)"
                      @auxclick="
                        $event.button === 1
                          ? window.open($router.resolve(subItem.path).href, '_blank')
                          : null
                      "
                    >
                      <component :is="subItem.icon" class="w-5 h-5 mr-3" />
                      <span>{{ subItem.title }}</span>
                    </NuxtLink>
                  </template>
                </div>
              </div>
            </div>
          </template>
        </template>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '~/stores/auth';
import { useHydrationState } from '~/composables/useHydration';
import { useMobileDetection } from '~/composables/useMobileDetection';
import { useModuleAccess } from '~/composables/useModuleAccess';
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
    default: () => true
  },
  user: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['toggle']);

// Use centralized composables
const { isHydrated } = useHydrationState();
const { isMobile } = useMobileDetection();
const {
  loadUserModules,
  filterMenuByModules,
  isLoading: modulesLoading,
  userModules
} = useModuleAccess();

// Function to save sidebar state
const saveSidebarState = isOpen => {
  if (import.meta.client) {
    localStorage.setItem('sidebarOpen', isOpen.toString());
  }
};

const authStore = useAuthStore();
const menuOpen = ref('');
const subMenuOpen = ref('');

// Watch for sidebar state changes
watch(
  () => props.open,
  newValue => {
    if (!newValue) {
      menuOpen.value = '';
      subMenuOpen.value = '';
    }
    // Save state to localStorage whenever it changes
    saveSidebarState(newValue);
  }
);

// Role checks - use authStore for consistency
const isSuperAdmin = computed(() => authStore.user?.role === 'super_admin');
const isSchoolAdmin = computed(() => authStore.user?.role === 'school_admin');
const isBranchAdmin = computed(() => authStore.user?.role === 'branch_admin');
const isAccountant = computed(() => authStore.user?.role === 'accountant');
const isReceptionist = computed(() => authStore.user?.role === 'receptionist');

// Menu configuration
const menuGroups = computed(() => {
  const groups = [];

  // SaaS Management (Super Admin Only)
  if (isSuperAdmin.value) {
    groups.push({
      id: 'saas',
      title: 'SaaS Management',
      items: [
        {
          id: 'saas-management',
          title: 'School Subscriptions',
          icon: CreditCard,
          children: [
            {
              id: 'customer-overview',
              title: 'Overview',
              path: '/saas',
              icon: BarChart3
            },
            {
              id: 'subscription-plans',
              title: 'Subscription Plans',
              path: '/saas/plans',
              icon: List
            },
            {
              id: 'renewal-requests',
              title: 'Renewal Requests',
              path: '/saas/renewal-requests',
              icon: FileText
            }
          ]
        }
      ]
    });

    // School Administration (Super Admin Only)
    groups.push({
      id: 'school-admin',
      title: 'School Administration',
      items: [
        {
          id: 'manage-branches',
          title: 'Branches',
          path: '/branches',
          icon: Building2
        }
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
          id: 'students',
          title: 'Students',
          icon: GraduationCap,
          requiredModule: 'students',
          children: [
            {
              id: 'new-student',
              title: 'New Student',
              path: '/students/form',
              icon: UserPlus,
              requiredModule: 'students'
            },
            {
              id: 'all-students',
              title: 'All Students',
              path: '/students',
              icon: Users,
              requiredModule: 'students'
            },
            {
              id: 'multiple-import',
              title: 'Multiple Import',
              path: '/students/multiple-import',
              icon: ClipboardList,
              requiredModule: 'students'
            }
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
          id: 'academic-setup',
          title: 'Academic Setup',
          icon: BookOpen,
          children: [
            // Academic Years - only for super admin and school admin
            ...(isSuperAdmin.value
              ? [
                  {
                    id: 'academic-years',
                    title: 'Academic Years',
                    path: '/academic/years',
                    icon: Calendar
                  }
                ]
              : []),
            {
              id: 'classes',
              title: 'Classes',
              path: '/academic/classes',
              icon: GraduationCap
            },
            {
              id: 'streams',
              title: 'Streams',
              path: '/academic/streams',
              icon: BookOpen
            },
            {
              id: 'sections',
              title: 'Sections',
              path: '/academic/sections',
              icon: Users
            },
            {
              id: 'subjects',
              title: 'Subjects',
              path: '/academic/subjects',
              icon: BookOpen,
              requiredModule: 'exams'
            },
            {
              id: 'exam-types',
              title: 'Exam Types',
              path: '/academic/exam-types',
              icon: Tag,
              requiredModule: 'exams'
            }
          ]
        },
        {
          id: 'academic-operations',
          title: 'Academic Operations',
          icon: ClipboardList,
          children: [
            {
              id: 'exams',
              title: 'Exams',
              path: '/exams',
              icon: FileText,
              requiredModule: 'exams'
            },
            {
              id: 'attendance-sessions',
              title: 'Attendance',
              path: '/attendance',
              icon: ClipboardList,
              requiredModule: 'attendance'
            }
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
          requiredModule: 'fees',
          children: [
            {
              id: 'fee-types',
              title: 'Fee Types',
              path: '/fees/types',
              icon: Tag,
              requiredModule: 'fees'
            },
            {
              id: 'fee-structures',
              title: 'Fee Structures',
              path: '/fees/structures',
              icon: List,
              requiredModule: 'fees'
            },
            {
              id: 'invoices',
              title: 'Invoices',
              path: '/fees/invoices',
              icon: Receipt,
              requiredModule: 'fees'
            }
          ]
        }
      ]
    });
  }

  // Reports & Analytics
  if (isSuperAdmin.value || isSchoolAdmin.value || isBranchAdmin.value) {
    groups.push({
      id: 'reports',
      title: 'Reports & Analytics',
      items: [
        {
          id: 'reports',
          title: 'Reports',
          icon: BarChart3,
          requiredModule: 'reports',
          children: [
            {
              id: 'fees',
              title: 'Fees',
              icon: DollarSign,
              requiredModule: 'fees',
              children: [
                {
                  id: 'fee-management-report',
                  title: 'Fee Management',
                  path: '/reports/fees',
                  icon: PieChart,
                  requiredModule: 'fees'
                },
                {
                  id: 'receipts-report',
                  title: 'Receipts Report',
                  path: '/reports/receipts',
                  icon: Receipt,
                  requiredModule: 'fees'
                }
              ]
            },
            {
              id: 'student',
              title: 'Student',
              icon: Users,
              requiredModule: 'students',
              children: [
                {
                  id: 'student-reports',
                  title: 'Student Reports',
                  path: '/reports/students',
                  icon: BarChart3,
                  requiredModule: 'students'
                },
                {
                  id: 'attendance-reports',
                  title: 'Attendance Reports',
                  path: '/reports/attendance',
                  icon: BarChart3,
                  requiredModule: 'attendance'
                },
                {
                  id: 'exam-reports',
                  title: 'Exam Reports',
                  path: '/exams/report-cards',
                  icon: FileText,
                  requiredModule: 'exams'
                }
              ]
            }
          ]
        }
      ]
    });
  }

  // Front Office (Receptionist)
  if (isReceptionist.value) {
    groups.push({
      id: 'front-office',
      title: 'Front Office',
      items: [
        {
          id: 'new-student',
          title: 'New Student',
          path: '/students/form',
          icon: UserPlus
        },
        {
          id: 'all-students',
          title: 'All Students',
          path: '/students',
          icon: Users
        },
        {
          id: 'visitors',
          title: 'Visitors',
          path: '/visitors',
          icon: UserCheck
        }
      ]
    });
  }

  // Settings
  if (isSuperAdmin.value || isSchoolAdmin.value || isBranchAdmin.value) {
    const settingsItems = [];

    // Super Admin gets full settings
    if (isSuperAdmin.value) {
      settingsItems.push(
        { id: 'staff-list', title: 'User List', path: '/users', icon: Users },
        {
          id: 'settings-main',
          title: 'Settings',
          path: '/settings',
          icon: Settings
        },
        {
          id: 'profile',
          title: 'Profile',
          path: '/settings/profile',
          icon: User
        }
      );
    }
    // School Admin gets simplified settings
    else if (isSchoolAdmin.value) {
      settingsItems.push(
        { id: 'staff-list', title: 'Staff List', path: '/users', icon: Users },
        {
          id: 'settings-main',
          title: 'School Settings',
          path: '/settings',
          icon: Settings
        },
        {
          id: 'profile',
          title: 'Profile',
          path: '/settings/profile',
          icon: User
        }
      );
    }
    // Branch Admin gets minimal settings
    else {
      settingsItems.push(
        {
          id: 'settings-main',
          title: 'Settings',
          path: '/settings',
          icon: Settings
        },
        {
          id: 'profile',
          title: 'Profile',
          path: '/settings/profile',
          icon: User
        }
      );
    }

    groups.push({
      id: 'settings',
      title: 'Settings',
      items: settingsItems
    });
  }

  return groups;
});

// Get visible menu groups based on user role and module access
const visibleMenuGroups = computed(() => {
  console.log('🔄 Computing visible menu groups, userModules:', userModules.value);

  // Super admin: show all menu groups
  if (authStore.user?.role === 'super_admin') {
    return menuGroups.value;
  }

  // For non-super admins, filter based on modules
  if (!userModules.value || userModules.value.length === 0) {
    console.log('🔄 No user modules available');
    return [];
  }

  // Use the improved filtering from useModuleAccess
  const filtered = menuGroups.value
    .map(group => {
      const filteredItems = filterMenuByModules(group.items);
      return {
        ...group,
        items: filteredItems
      };
    })
    .filter(group => group.items.length > 0); // remove empty groups

  console.log('🔄 Filtered menu groups:', filtered);
  return filtered;
});

const toggleMenu = menu => {
  menuOpen.value = menuOpen.value === menu ? '' : menu;
};

const toggleSubMenu = subMenu => {
  subMenuOpen.value = subMenuOpen.value === subMenu ? '' : subMenu;
};

const navClass = path => {
  const route = useRoute();
  const isActive = path ? route.path === path : false;
  return [
    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer',
    isActive
      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
  ];
};

const subNavClass = path => {
  return navClass(path);
};

const handleMenuClick = (path, event) => {
  if (event.button === 1 || ((event.ctrlKey || event.metaKey) && event.type === 'click')) {
    event.preventDefault();
    window.open($router.resolve(path).href, '_blank');
    return;
  }

  if (isMobile.value) {
    emit('toggle');
  }
};

const logout = async () => {
  await authStore.logout();
  await navigateTo('/login');
};

let mql;

// Computed sidebar classes to avoid hydration issues
const sidebarClasses = computed(() => {
  if (isMobile.value) {
    return props.open ? 'w-[280px] translate-x-0' : 'w-[280px] -translate-x-full';
  }
  return props.open ? 'w-64' : 'w-16';
});

const checkMobile = () => {
  if (import.meta.client) {
    const newIsMobile = window.innerWidth < 768;
    if (newIsMobile !== isMobile.value) {
      emit('toggle', !newIsMobile);
      document.body.style.overflow = newIsMobile && props.open ? 'hidden' : '';
    }
  }
};

onMounted(async () => {
  if (import.meta.client) {
    checkMobile();
    mql = window.matchMedia('(max-width: 767px)');
    mql.addEventListener('change', checkMobile);
  }

  // Load user modules for menu filtering
  await loadUserModules();
});

// Watch for module changes to update sidebar
watch(
  userModules,
  newModules => {
    console.log('🔄 Sidebar modules updated:', newModules);
  },
  { deep: true }
);

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
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-sidebar-enter-from,
.slide-sidebar-leave-to {
  transform: translateX(-100%);
}

.slide-sidebar-enter-to,
.slide-sidebar-leave-from {
  transform: translateX(0);
}

/* Improve hover menu animations */
.group:hover .group-hover\:block {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Ensure proper spacing and prevent content overflow */
nav {
  min-height: 0;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

/* Smooth menu transitions */
.space-y-1 > * + * {
  margin-top: 0.25rem;
}

.space-y-2 > * + * {
  margin-top: 0.5rem;
}

/* Ensure sidebar is always on top */
.fixed {
  position: fixed !important;
}

/* Prevent any content from appearing above sidebar */
.z-\[99999\] {
  z-index: 99999 !important;
}

/* Ensure sidebar stays on top during all states */
.sidebar-container {
  position: fixed !important;
  z-index: 99999 !important;
  isolation: isolate;
}

/* Ensure proper stacking context */
.flex {
  position: relative;
}

/* Prevent overlapping during hydration */
.sidebar-container {
  will-change: transform;
  backface-visibility: hidden;
}

/* Ensure proper mobile positioning */
@media (max-width: 767px) {
  .sidebar-container {
    transform: translateX(-100%);
  }

  .sidebar-container.w-\[280px\].translate-x-0 {
    transform: translateX(0);
  }
}

/* Add transition delay to prevent flash during hydration */
@media (prefers-reduced-motion: no-preference) {
  .sidebar-container {
    transition-delay: 0.05s;
  }
}

/* FIX: Disable pointer events on overlapping labels when sidebar is collapsed */
.sidebar-container:not(.w-64) .sidebar-group-header {
  pointer-events: none;
}

/* Ensure menu items remain clickable when collapsed */
.sidebar-container:not(.w-64) nav a,
.sidebar-container:not(.w-64) nav button,
.sidebar-container:not(.w-64) nav div[class*='flex items-center'] {
  pointer-events: auto;
}

/* Ensure proper hover states for menu items */
nav div[class*='flex items-center']:hover {
  background-color: rgb(243 244 246);
}

.dark nav div[class*='flex items-center']:hover {
  background-color: rgb(55 65 81);
}
</style>
