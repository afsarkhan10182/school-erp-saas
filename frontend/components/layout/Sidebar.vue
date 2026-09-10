<template>
  <!-- Mobile/Tablet overlay -->
  <div
    v-if="isMobile && open"
    class="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-xs transition-opacity duration-300"
    @click="$emit('toggle')"
    @touchmove.prevent
  ></div>

  <!-- Sidebar -->
  <div
    :class="[
      'sidebar-container fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-xl flex flex-col',
      sidebarClasses,
      'transform transition-all duration-300 ease-in-out will-change-transform'
    ]"
  >
    <!-- Logo/Brand Header -->
    <div
      class="flex-shrink-0 flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700"
    >
      <div class="flex items-center">
        <!-- School Logo or Fallback Icon -->
        <div
          class="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden"
          @click="$emit('toggle')"
        >
          <img
            v-if="schoolLogo && !logoError"
            :src="schoolLogo"
            :alt="schoolName"
            class="w-full h-full object-cover rounded-lg"
            @error="handleLogoError"
          />
          <div
            v-else
            class="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center"
          >
            <School class="w-5 h-5 text-white" />
          </div>
        </div>
        <span
          v-if="open || isMobile"
          class="ml-3 text-lg font-semibold text-gray-900 dark:text-white truncate max-w-[200px]"
          :title="schoolName || 'School ERP'"
          >{{ schoolName || 'School ERP' }}</span
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
        <!-- Dashboard / Portal home -->
        <div class="relative group">
          <NuxtLink
            :to="homePath"
            :class="navClass(homePath)"
            @click="handleMenuClick(homePath, $event)"
          >
            <Home class="w-5 h-5" :class="{ 'mr-3': open || isMobile }" />
            <span v-if="open || isMobile">{{
              homePath === '/portal' ? 'My Portal' : 'Dashboard'
            }}</span>
          </NuxtLink>
          <!-- Hover Menu for Collapsed State -->
          <div
            v-if="!open && !isMobile"
            class="hidden group-hover:block absolute left-full top-0 ml-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 px-3 min-w-[200px] z-40 border border-gray-200 dark:border-gray-700"
          >
            <span class="text-sm font-medium text-gray-900 dark:text-white">{{
              homePath === '/portal' ? 'My Portal' : 'Dashboard'
            }}</span>
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
                v-show="menuOpen === menuItem.id && (open || isMobile)"
                class="transition-all duration-200 ease-in-out"
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
                        <component :is="subItem.icon" class="w-5 h-5" :class="{ 'mr-3': open || isMobile }" />
                        <span v-if="open || isMobile" class="flex-1">{{ subItem.title }}</span>
                        <!-- Show chevron ONLY in expanded sidebar mode for nested submenus -->
                        <ChevronDown
                          v-if="(open || isMobile) && subItem.children.length > 0"
                          class="w-4 h-4 transition-transform duration-200"
                          :class="{ 'rotate-180': subMenuOpen === subItem.id }"
                        />
                      </div>
                      <!-- Nested submenu items -->
                      <div
                        v-show="subMenuOpen === subItem.id && (open || isMobile)"
                        class="transition-all duration-200 ease-in-out"
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
                            <component :is="nestedItem.icon" class="w-5 h-5" :class="{ 'mr-3': open || isMobile }" />
                            <span v-if="open || isMobile">{{ nestedItem.title }}</span>
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
                      <component :is="subItem.icon" class="w-5 h-5" :class="{ 'mr-3': open || isMobile }" />
                      <span v-if="open || isMobile">{{ subItem.title }}</span>
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
import { useAuth } from '~/composables/useAuth';
import { useRuntimeConfig } from '#app';
import { useHydrationState } from '~/composables/useHydration';
import { useMobileDetection } from '~/composables/useMobileDetection';
import { useModuleAccess } from '~/composables/useModuleAccess';
import { useAcademicSettings } from '~/utils/settings';
import { getLogoUrl } from '~/utils/image';
import { buildSchoolSidebar } from '~/config/school-sidebar';
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
  FileText,
  Clock,
  Edit,
  Edit3,
  CheckCircle,
  Building,
  Award,
  Trophy,
  Globe,
  FileBarChart,
  Bus,
  Warehouse,
  Mail,
  MessageSquare,
  Truck,
  BedDouble,
  Package,
  Phone,
  Megaphone,
  Wallet,
  Paperclip,
  Video,
  MapPin,
  Gift,
  Image,
  Star,
  HelpCircle,
  Layers
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

// Academic settings
const { isStreamsEnabled } = useAcademicSettings();
const streamsEnabled = ref(false);

// Function to save sidebar state
const saveSidebarState = isOpen => {
  if (import.meta.client) {
    localStorage.setItem('sidebarOpen', isOpen.toString());
  }
};

const { isSuperAdmin, isAdmin, isBranchAdmin, user, currentSchool } = useAuth();
const menuOpen = ref('');
const subMenuOpen = ref('');
const logoError = ref(false);

// School logo and name
const schoolLogo = computed(() => {
  const school = user.value?.school;
  // Reset logo error when school changes
  logoError.value = false;

  if (school?.logo) {
    const config = useRuntimeConfig();
    const schoolCode = school.code || user.value?.school?.code;
    const apiBase = config.public?.apiBase;

    const logoUrl = getLogoUrl(school.logo, schoolCode, apiBase);
    return logoUrl;
  }
  return null;
});

const schoolName = computed(() => {
  // Use currentSchool from auth store (updated when settings change)
  // Fallback to user.school.name for backward compatibility
  return currentSchool.value?.name || user.value?.school?.name;
});

// Handle logo error fallback
const handleLogoError = event => {
  logoError.value = true;
};

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

// Additional role checks for specific roles
const isAccountant = computed(() => user.value?.role === 'accountant');
const isReceptionist = computed(() => user.value?.role === 'receptionist');

// Load streams setting
const loadStreamsSetting = async () => {
  try {
    const result = await isStreamsEnabled();
    streamsEnabled.value = result;
  } catch (error) {
    streamsEnabled.value = false;
  }
};

// Menu configuration — workflow groups (Admission / Student Details / Parents / ...)
const menuGroups = computed(() =>
  buildSchoolSidebar({
    isSuperAdmin: isSuperAdmin.value,
    isAdmin: isAdmin.value,
    isBranchAdmin: isBranchAdmin.value,
    isAccountant: isAccountant.value,
    isReceptionist: isReceptionist.value,
    isTeacher: user.value?.role === 'teacher',
    isLibrarian: user.value?.role === 'librarian',
    isStudent: user.value?.role === 'student',
    isParent: user.value?.role === 'parent',
    streamsEnabled: streamsEnabled.value,
    icons: {
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
      FileText,
      Clock,
      Edit3,
      CheckCircle,
      Building,
      Award,
      Trophy,
      Globe,
      FileBarChart,
      Bus,
      Warehouse,
      Mail,
      MessageSquare,
      Truck,
      BedDouble,
      Package,
      Phone,
      Megaphone,
      Wallet,
      Paperclip,
      Video,
      MapPin,
      Gift,
      Image,
      Star,
      HelpCircle,
      Layers
    }
  })
);

/** Apply subscription module filter to each group (DRY via useModuleAccess). */
const visibleMenuGroups = computed(() =>
  menuGroups.value
    .map(group => ({
      ...group,
      items: filterMenuByModules(group.items || [])
    }))
    .filter(group => (group.items || []).length > 0)
);

const homePath = computed(() =>
  user.value?.role === 'student' || user.value?.role === 'parent' ? '/portal' : '/dashboard'
);

const toggleMenu = menu => {
  menuOpen.value = menuOpen.value === menu ? '' : menu;
};

const toggleSubMenu = subMenu => {
  subMenuOpen.value = subMenuOpen.value === subMenu ? '' : subMenu;
};

const navClass = path => {
  const route = useRoute();
  const isActive = path
    ? path === '/' || path === '/dashboard' || path === '/portal'
      ? route.path === path
      : route.path === path || route.path.startsWith(path + '/')
    : false;
  return [
    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer',
    isActive
      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 font-semibold shadow-xs'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
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
  const { logout: logoutUser } = useAuth();
  await logoutUser();
  await navigateTo('/auth/login');
};

let mql;

// Computed sidebar classes to avoid hydration issues
const sidebarClasses = computed(() => {
  if (isMobile.value) {
    return props.open ? 'w-[280px] translate-x-0' : 'w-[280px] -translate-x-full pointer-events-none';
  }
  return props.open ? 'w-64 translate-x-0' : 'w-16 translate-x-0';
});

const checkMobile = () => {
  if (import.meta.client) {
    const newIsMobile = window.innerWidth < 1024;
    if (newIsMobile !== isMobile.value) {
      emit('toggle', !newIsMobile);
      document.body.style.overflow = newIsMobile && props.open ? 'hidden' : '';
    }
  }
};

onMounted(async () => {
  if (import.meta.client) {
    checkMobile();
    mql = window.matchMedia('(max-width: 1023px)');
    mql.addEventListener('change', checkMobile);
  }

  // Load user modules for menu filtering
  await loadUserModules();

  // Load streams setting for conditional menu display
  await loadStreamsSetting();
});

// Watch for module changes to update sidebar
watch(
  userModules,
  newModules => {
    // Modules updated
  },
  { deep: true }
);

// Listen for module refresh from other tabs and background checks
onMounted(() => {
  if (import.meta.client) {
    const handleStorageChange = e => {
      if (e.key === 'modules-refresh') {
        loadUserModules(true);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Background refresh every 15 minutes to catch changes
    const backgroundRefresh = setInterval(
      async () => {
        try {
          const { checkModulesUpdated } = useModuleAccess();
          await checkModulesUpdated();
        } catch (error) {
          // Background module check failed
        }
      },
      15 * 60 * 1000
    ); // 15 minutes

    onUnmounted(() => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(backgroundRefresh);
    });
  }
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

/* Ensure proper mobile/tablet drawer positioning */
@media (max-width: 1023px) {
  .sidebar-container {
    transform: translateX(-100%);
  }

  .sidebar-container.translate-x-0 {
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
