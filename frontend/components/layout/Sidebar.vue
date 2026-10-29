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
      'transform transition-all duration-150 ease-out will-change-transform'
    ]"
  >
    <div
      class="flex-shrink-0 flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700 relative"
      :class="open || isMobile ? 'justify-between' : 'justify-center'"
    >
      <div class="flex items-center">
        <!-- School Logo or Fallback Icon -->
        <div
          class="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden transition-all duration-300 shadow-sm"
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
            class="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center"
          >
            <School class="w-5 h-5 text-white" />
          </div>
        </div>
        <transition name="fade">
          <span
            v-if="open || isMobile"
            class="ml-3 text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 truncate max-w-[180px]"
            :title="schoolName || 'School ERP'"
            >{{ schoolName || 'School ERP' }}</span
          >
        </transition>
      </div>

      <!-- Mobile Close Button -->
      <button
        v-if="isMobile"
        @click="$emit('toggle')"
        class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Desktop Floating Toggle -->
      <button
        v-if="!isMobile"
        @click="$emit('toggle')"
        class="absolute -right-3 top-5 w-6 h-6 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-md text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500/50 transition-all duration-300 z-50 cursor-pointer"
        :class="{ 'rotate-180': !open }"
        title="Toggle Sidebar"
      >
        <ChevronLeft class="w-3.5 h-3.5" />
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
            <span v-if="open || isMobile">{{ homeLabel }}</span>
          </NuxtLink>
          <!-- Hover Menu for Collapsed State -->
          <div
            v-if="!open && !isMobile"
            class="hidden group-hover:block absolute left-full top-0 ml-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 px-3 min-w-[200px] z-40 border border-gray-200 dark:border-gray-700"
          >
            <span class="text-sm font-medium text-gray-900 dark:text-white">{{ homeLabel }}</span>
          </div>
        </div>

        <!-- Super Admin Workspace Switcher -->
        <div v-if="isSuperAdmin && (open || isMobile)" class="px-1 py-1">
          <div class="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex items-center text-xs font-medium">
            <button
              type="button"
              @click="setWorkspaceMode('platform')"
              class="flex-1 py-1 px-2 rounded-lg text-center transition-all"
              :class="workspaceMode === 'platform' ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'"
            >
              SaaS Platform
            </button>
            <button
              type="button"
              @click="setWorkspaceMode('school')"
              class="flex-1 py-1 px-2 rounded-lg text-center transition-all"
              :class="workspaceMode === 'school' && currentSchool?.id ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'"
              :title="currentSchool?.id ? `Inspecting ${currentSchool.name}` : 'Select an institution to inspect'"
            >
              {{ currentSchool?.id ? 'School Ops' : 'Inspect School' }}
            </button>
          </div>
          <div
            v-if="workspaceMode === 'school' && currentSchool?.id"
            class="mt-2 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/60 rounded-lg text-[11px] text-amber-800 dark:text-amber-300 flex items-start justify-between gap-2"
          >
            <span class="min-w-0">
              <span class="block truncate font-medium">{{ currentSchool.name }} (Inspecting)</span>
              <span class="block text-[10px] leading-4">Super Admin actions can change school data.</span>
            </span>
            <button
              type="button"
              @click="setWorkspaceMode('platform')"
              class="shrink-0 text-xs font-bold underline hover:text-amber-950 dark:hover:text-amber-100"
            >
              Exit
            </button>
          </div>
        </div>

        <!-- Search the already role- and module-filtered navigation tree. -->
        <div v-if="open || isMobile" class="px-1 py-2">
          <label class="relative block">
            <span class="sr-only">Search menu pages</span>
            <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              v-model="menuSearch"
              type="search"
              aria-label="Search menu pages"
              placeholder="Search menu pages..."
              class="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-indigo-900/40"
            />
          </label>
        </div>

        <!-- Navigation Menu Items -->
        <div v-if="menuSearch.trim() && (open || isMobile)" class="space-y-1">
          <NuxtLink
            v-for="item in menuSearchResults"
            :key="item.id"
            :to="item.path"
            :class="navClass(item.path)"
            class="flex-col items-start gap-0.5"
            @click="menuSearch = ''"
          >
            <span class="font-medium">{{ item.title }}</span>
            <span class="w-full truncate text-[11px] text-gray-400">{{ item.section }}</span>
          </NuxtLink>
          <p v-if="menuSearchResults.length === 0" class="px-3 py-4 text-center text-xs text-gray-500 dark:text-gray-400">
            No pages found for “{{ menuSearch }}”.
          </p>
        </div>
        <template v-else>
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
              <button
                type="button"
                :class="[
                  navClass(''),
                  menuOpen === menuItem.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                ]"
                :aria-expanded="menuOpen === menuItem.id"
                :aria-controls="`submenu-${menuItem.id}`"
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
              </button>
              <!-- Hover Menu for Collapsed State -->
              <div
                v-if="!open && !isMobile"
                class="hidden group-hover:block absolute left-full top-0 ml-2 bg-white/95 backdrop-blur-md dark:bg-gray-800/95 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] py-2 min-w-[220px] z-40 border border-gray-100 dark:border-gray-700 transform-gpu translate-y-0 animate-in fade-in slide-in-from-left-2 duration-200"
              >
                <div
                  class="px-4 py-2.5 font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 mb-1"
                >
                  {{ menuItem.title }}
                </div>
                <div class="py-1 px-2 space-y-0.5">
                  <template v-for="subItem in menuItem.children" :key="subItem.id">
                    <!-- If subItem has children (nested submenu) -->
                    <div
                      v-if="subItem.children && subItem.children.length > 0"
                      class="relative group/sub"
                    >
                      <div
                        class="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300 rounded-lg cursor-pointer transition-colors"
                      >
                        <component :is="subItem.icon" class="w-4 h-4 mr-3 opacity-70" />
                        <span class="font-medium">{{ subItem.title }}</span>
                        <!-- No chevron in hover menus for nested items -->
                      </div>
                      <!-- Nested hover menu -->
                      <div
                        class="hidden group-hover/sub:block absolute left-full top-0 ml-1 bg-white/95 backdrop-blur-md dark:bg-gray-800/95 rounded-xl shadow-lg py-2 min-w-[200px] z-50 border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-left-2 duration-200"
                      >
                        <div
                          class="px-4 py-2 font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 mb-1"
                        >
                          {{ subItem.title }}
                        </div>
                        <div class="py-1 px-2 space-y-0.5">
                          <NuxtLink
                            v-for="nestedItem in subItem.children"
                            :key="nestedItem.id"
                            :to="nestedItem.path"
                            class="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300 rounded-lg transition-colors"
                            @click.middle.prevent="
                              $event.ctrlKey || $event.metaKey
                                ? window.open($router.resolve(nestedItem.path).href, '_blank')
                                : null
                            "
                          >
                            <component :is="nestedItem.icon" class="w-4 h-4 mr-3 opacity-70" />
                            <span class="font-medium">{{ nestedItem.title }}</span>
                          </NuxtLink>
                        </div>
                      </div>
                    </div>
                    <!-- Direct submenu item -->
                    <NuxtLink
                      v-else
                      :to="subItem.path"
                      class="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300 rounded-lg transition-colors"
                      @click.middle.prevent="
                        $event.ctrlKey || $event.metaKey
                          ? window.open($router.resolve(subItem.path).href, '_blank')
                          : null
                      "
                    >
                      <component :is="subItem.icon" class="w-4 h-4 mr-3 opacity-70" />
                      <span class="font-medium">{{ subItem.title }}</span>
                    </NuxtLink>
                  </template>
                </div>
              </div>

              <!-- Submenu Items -->
              <div
                :id="`submenu-${menuItem.id}`"
                v-show="menuOpen === menuItem.id && (open || isMobile)"
                class="transition-all duration-200 ease-in-out"
              >
                <div class="ml-8 space-y-1 py-1">
                  <!-- Handle nested submenus -->
                  <template v-for="subItem in menuItem.children" :key="subItem.id">
                    <!-- If subItem has children (nested submenu) -->
                    <div v-if="subItem.children && subItem.children.length > 0" class="space-y-1">
                      <button
                        type="button"
                        :class="[
                          navClass(''),
                          subMenuOpen === subItem.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                        ]"
                        :aria-expanded="subMenuOpen === subItem.id"
                        :aria-controls="`nested-submenu-${subItem.id}`"
                        @click="toggleSubMenu(subItem.id)"
                      >
                        <component
                          :is="subItem.icon"
                          class="w-5 h-5"
                          :class="{ 'mr-3': open || isMobile }"
                        />
                        <span v-if="open || isMobile" class="flex-1">{{ subItem.title }}</span>
                        <!-- Show chevron ONLY in expanded sidebar mode for nested submenus -->
                        <ChevronDown
                          v-if="(open || isMobile) && subItem.children.length > 0"
                          class="w-4 h-4 transition-transform duration-200"
                          :class="{ 'rotate-180': subMenuOpen === subItem.id }"
                        />
                      </button>
                      <!-- Nested submenu items -->
                      <div
                        :id="`nested-submenu-${subItem.id}`"
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
                            <component
                              :is="nestedItem.icon"
                              class="w-5 h-5"
                              :class="{ 'mr-3': open || isMobile }"
                            />
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
                      <component
                        :is="subItem.icon"
                        class="w-5 h-5"
                        :class="{ 'mr-3': open || isMobile }"
                      />
                      <span v-if="open || isMobile">{{ subItem.title }}</span>
                    </NuxtLink>
                  </template>
                </div>
              </div>
            </div>
          </template>
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
import { useAuthStore } from '~/stores/auth';
import { useRuntimeConfig } from '#app';
import { useHydrationState } from '~/composables/useHydration';
import { useMobileDetection } from '~/composables/useMobileDetection';
import { useModuleAccess } from '~/composables/useModuleAccess';
import { useAcademicSettings } from '~/utils/settings';
import { getLogoUrl } from '~/utils/image';
import { buildSchoolSidebar } from '~/config/school-sidebar';
import { homePathForRole } from '~/utils/home-path';
import {
  Home,
  Search,
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
const menuSearch = ref('');
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
  if (!['admin', 'super_admin'].includes(user.value?.role)) return;

  try {
    const result = await isStreamsEnabled();
    streamsEnabled.value = result;
  } catch (error) {
    streamsEnabled.value = false;
  }
};

// Super admin workspace mode (Platform vs School Ops)
const workspaceMode = ref('platform');
const router = useRouter();
const route = useRoute();

watch(
  [() => route.path, () => currentSchool.value?.id],
  ([newPath, schoolId], [oldPath]) => {
    if (isSuperAdmin.value) {
      if (newPath.startsWith('/saas') || newPath.startsWith('/admin/config') || newPath === '/branches') {
        workspaceMode.value = 'platform';
        if (schoolId && oldPath !== newPath) {
          const authStore = useAuthStore();
          authStore.setCurrentSchool(null);
          authStore.setCurrentBranch(null);
        }
      } else if (schoolId) {
        workspaceMode.value = 'school';
      } else {
        workspaceMode.value = 'platform';
      }
    }
  },
  { immediate: true }
);

const setWorkspaceMode = mode => {
  if (mode === 'platform') {
    workspaceMode.value = 'platform';
    const authStore = useAuthStore();
    authStore.setCurrentSchool(null);
    authStore.setCurrentBranch(null);
    if (!route.path.startsWith('/saas')) {
      router.push('/saas');
    }
  } else if (mode === 'school') {
    if (currentSchool.value?.id) {
      workspaceMode.value = 'school';
      if (route.path.startsWith('/saas')) {
        router.push('/dashboard');
      }
    } else {
      // Direct user to select an institution to inspect
      router.push('/saas');
    }
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
    workspaceMode: workspaceMode.value,
    currentSchoolId: currentSchool.value?.id,
    currentSchoolName: currentSchool.value?.name,
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

/** Apply subscription and role/module filters to each group. */
const visibleMenuGroups = computed(() =>
  menuGroups.value
    .map(group => ({
      ...group,
      items: filterMenuByModules(group.items || [])
    }))
    .filter(group => (group.items || []).length > 0)
);

const menuSearchResults = computed(() => {
  const query = menuSearch.value.trim().toLowerCase();
  if (!query) return [];

  const flatten = (items, parents = []) => items.flatMap(item => {
    const trail = [...parents, item.title];
    const current = item.path ? [{ id: item.id, path: item.path, title: item.title, section: trail.join(' / ') }] : [];
    return [...current, ...flatten(item.children || [], trail)];
  });

  return visibleMenuGroups.value
    .flatMap(group => flatten(group.items, [group.title]))
    .filter(item => `${item.title} ${item.section} ${item.path}`.toLowerCase().includes(query));
});

const homePath = computed(() => {
  if (isSuperAdmin.value) {
    return workspaceMode.value === 'school' && currentSchool.value?.id ? '/dashboard' : '/saas';
  }
  return homePathForRole(user.value?.role);
});

const homeLabel = computed(() => {
  const role = user.value?.role;
  if (role === 'super_admin') {
    return workspaceMode.value === 'school' && currentSchool.value?.id ? 'School Operations' : 'SaaS Platform';
  }
  if (role === 'student') return 'Student Portal';
  if (role === 'parent') return 'Family Portal';
  if (role === 'teacher') return 'Teaching Workspace';
  if (role === 'accountant') return 'Finance Workspace';
  if (role === 'receptionist') return 'Front Desk';
  if (role === 'librarian') return 'Library Desk';
  return 'Dashboard';
});

const toggleMenu = menu => {
  menuOpen.value = menuOpen.value === menu ? '' : menu;
};

const toggleSubMenu = subMenu => {
  subMenuOpen.value = subMenuOpen.value === subMenu ? '' : subMenu;
};

const navClass = path => {
  const route = useRoute();
  let isActive = false;
  if (path) {
    if (path === '/' || path === '/dashboard' || path === '/portal') {
      isActive = route.path === path;
    } else if (path === '/students') {
      // Exact match for /students or dynamic details /students/123, but not sub-pages like /students/bulk-edit or /students/categories
      isActive = route.path === '/students' || /^\/students\/\d+/.test(route.path);
    } else {
      isActive = route.path === path || route.path.startsWith(path + '/');
    }
  }
  return [
    'group flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-all duration-300 cursor-pointer relative',
    isActive
      ? 'bg-gradient-to-r from-indigo-50/80 to-indigo-100/30 text-indigo-700 dark:from-indigo-900/40 dark:to-indigo-800/10 dark:text-indigo-300 font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.02)] ring-1 ring-indigo-100 dark:ring-indigo-800/50'
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-white border border-transparent'
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
    return props.open
      ? 'w-[280px] translate-x-0'
      : 'w-[280px] -translate-x-full pointer-events-none';
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
