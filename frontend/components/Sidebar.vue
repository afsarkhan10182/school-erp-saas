<template>
  <div class="fixed inset-y-0 left-0 z-50 w-16 lg:w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300">
    <!-- Logo/Brand -->
    <div class="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center">
        <div class="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
          <School class="w-5 h-5 text-white" />
        </div>
        <span v-if="open" class="ml-3 text-lg font-semibold text-gray-900 dark:text-white">School ERP</span>
      </div>
      <button
        @click="$emit('toggle')"
        class="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <ChevronLeft v-if="open" class="w-5 h-5" />
        <ChevronRight v-else class="w-5 h-5" />
      </button>
    </div>

    <!-- Navigation -->
    <div class="flex-1 overflow-y-auto">
      <nav class="mt-6 px-2 space-y-1">
        <!-- Dashboard -->
        <NuxtLink :to="'/dashboard'" :class="navClass('/dashboard')">
          <Home class="w-5 h-5 mr-3" />
          <span v-if="open">Dashboard</span>
        </NuxtLink>
        
        <!-- Super Admin Only -->
        <template v-if="isSuperAdmin">
          <div class="mt-6">
            <div v-if="open" class="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Platform Management
            </div>
            
            <NuxtLink :to="'/subscriptions/schools'" :class="navClass('/subscriptions/schools')">
              <School class="w-5 h-5 mr-3" />
              <span v-if="open">Schools</span>
            </NuxtLink>
            
            <NuxtLink :to="'/branches'" :class="navClass('/branches')">
              <Building2 class="w-5 h-5 mr-3" />
              <span v-if="open">Branches</span>
            </NuxtLink>
            
            <NuxtLink :to="'/users'" :class="navClass('/users')">
              <Users class="w-5 h-5 mr-3" />
              <span v-if="open">Users</span>
            </NuxtLink>
            
            <NuxtLink :to="'/subscriptions'" :class="navClass('/subscriptions')">
              <CreditCard class="w-5 h-5 mr-3" />
              <span v-if="open">Subscriptions</span>
            </NuxtLink>
          </div>

          <!-- Student Management Section for Super Admin -->
          <div class="mt-6">
            <div v-if="open" class="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Student Management
            </div>
            
            <div 
              class="flex items-center px-3 py-2 text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
              @click="toggleMenu('admission')"
            >
              <GraduationCap class="w-5 h-5 mr-3" />
              <span v-if="open" class="flex-1">Admission</span>
              <ChevronDown 
                v-if="open" 
                class="w-4 h-4 transition-transform duration-200" 
                :class="{ 'rotate-180': menuOpen === 'admission' }"
              />
            </div>
            <div v-if="menuOpen === 'admission' && open" class="ml-8 mt-1 space-y-1">
              <NuxtLink :to="'/students/create'" :class="subNavClass('/students/create')">
                <UserPlus class="w-4 h-4 mr-2" />
                <span>New Admission</span>
              </NuxtLink>
              <NuxtLink :to="'/students'" :class="subNavClass('/students')">
                <Users class="w-4 h-4 mr-2" />
                <span>All Students</span>
              </NuxtLink>
              <NuxtLink :to="'/admissions'" :class="subNavClass('/admissions')">
                <ClipboardList class="w-4 h-4 mr-2" />
                <span>Applications</span>
              </NuxtLink>
            </div>
          </div>

          <!-- Fee Management Section for Super Admin -->
          <div class="mt-6">
            <div v-if="open" class="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Fee Management
            </div>
            
            <div 
              class="flex items-center px-3 py-2 text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
              @click="toggleMenu('fees')"
            >
              <DollarSign class="w-5 h-5 mr-3" />
              <span v-if="open" class="flex-1">Fees</span>
              <ChevronDown 
                v-if="open" 
                class="w-4 h-4 transition-transform duration-200" 
                :class="{ 'rotate-180': menuOpen === 'fees' }"
              />
            </div>
            <div v-if="menuOpen === 'fees' && open" class="ml-8 mt-1 space-y-1">
              <NuxtLink :to="'/fees/types'" :class="subNavClass('/fees/types')">
                <Tag class="w-4 h-4 mr-2" />
                <span>Fee Types</span>
              </NuxtLink>
              <NuxtLink :to="'/fees/structures'" :class="subNavClass('/fees/structures')">
                <List class="w-4 h-4 mr-2" />
                <span>Fee Structures</span>
              </NuxtLink>
              <NuxtLink :to="'/fees/invoices'" :class="subNavClass('/fees/invoices')">
                <Receipt class="w-4 h-4 mr-2" />
                <span>Invoices</span>
              </NuxtLink>
              <NuxtLink :to="'/reports/fees'" :class="subNavClass('/reports/fees')">
                <BarChart3 class="w-4 h-4 mr-2" />
                <span>Reports</span>
              </NuxtLink>
            </div>
          </div>

          <!-- Academic Section for Super Admin -->
          <div class="mt-6">
            <div v-if="open" class="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Academic
            </div>
            
            <div 
              class="flex items-center px-3 py-2 text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
              @click="toggleMenu('academic')"
            >
              <BookOpen class="w-5 h-5 mr-3" />
              <span v-if="open" class="flex-1">Academic</span>
              <ChevronDown 
                v-if="open" 
                class="w-4 h-4 transition-transform duration-200" 
                :class="{ 'rotate-180': menuOpen === 'academic' }"
              />
            </div>
            <div v-if="menuOpen === 'academic' && open" class="ml-8 mt-1 space-y-1">
              <NuxtLink :to="'/academic/years'" :class="subNavClass('/academic/years')">
                <Calendar class="w-4 h-4 mr-2" />
                <span>Academic Years</span>
              </NuxtLink>
              <NuxtLink :to="'/academic/classes'" :class="subNavClass('/academic/classes')">
                <GraduationCap class="w-4 h-4 mr-2" />
                <span>Classes</span>
              </NuxtLink>
              <NuxtLink :to="'/academic/sections'" :class="subNavClass('/academic/sections')">
                <Users class="w-4 h-4 mr-2" />
                <span>Sections</span>
              </NuxtLink>
            </div>
          </div>

          <!-- Reports Section for Super Admin -->
          <div class="mt-6">
            <div v-if="open" class="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Reports & Analytics
            </div>
            
            <NuxtLink :to="'/reports/students'" :class="navClass('/reports/students')">
              <BarChart3 class="w-5 h-5 mr-3" />
              <span v-if="open">Student Reports</span>
            </NuxtLink>
            
            <NuxtLink :to="'/reports/fees'" :class="navClass('/reports/fees')">
              <PieChart class="w-5 h-5 mr-3" />
              <span v-if="open">Fee Reports</span>
            </NuxtLink>
            
            <NuxtLink :to="'/reports/admissions'" :class="navClass('/reports/admissions')">
              <TrendingUp class="w-5 h-5 mr-3" />
              <span v-if="open">Admission Reports</span>
            </NuxtLink>
          </div>

          <!-- Settings Section for Super Admin -->
          <div class="mt-6">
            <div v-if="open" class="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Settings
            </div>
            
            <NuxtLink :to="'/settings/profile'" :class="navClass('/settings/profile')">
              <User class="w-5 h-5 mr-3" />
              <span v-if="open">Profile</span>
            </NuxtLink>
            
            <NuxtLink :to="'/settings/branch'" :class="navClass('/settings/branch')">
              <Building2 class="w-5 h-5 mr-3" />
              <span v-if="open">Branch Settings</span>
            </NuxtLink>
            
            <NuxtLink :to="'/settings/modules'" :class="navClass('/settings/modules')">
              <Settings class="w-5 h-5 mr-3" />
              <span v-if="open">Module Settings</span>
            </NuxtLink>
          </div>
        </template>

        <!-- School Admin & Branch Admin -->
        <template v-if="isSchoolAdmin || isBranchAdmin">
          <!-- Admission Section -->
          <div class="mt-6">
            <div v-if="open" class="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Student Management
            </div>
            
            <div 
              class="flex items-center px-3 py-2 text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
              @click="toggleMenu('admission')"
            >
              <GraduationCap class="w-5 h-5 mr-3" />
              <span v-if="open" class="flex-1">Admission</span>
              <ChevronDown 
                v-if="open" 
                class="w-4 h-4 transition-transform duration-200" 
                :class="{ 'rotate-180': menuOpen === 'admission' }"
              />
            </div>
            <div v-if="menuOpen === 'admission' && open" class="ml-8 mt-1 space-y-1">
              <NuxtLink :to="'/students/create'" :class="subNavClass('/students/create')">
                <UserPlus class="w-4 h-4 mr-2" />
                <span>New Admission</span>
              </NuxtLink>
              <NuxtLink :to="'/students'" :class="subNavClass('/students')">
                <Users class="w-4 h-4 mr-2" />
                <span>All Students</span>
              </NuxtLink>
              <NuxtLink :to="'/admissions'" :class="subNavClass('/admissions')">
                <ClipboardList class="w-4 h-4 mr-2" />
                <span>Applications</span>
              </NuxtLink>
            </div>
          </div>

          <!-- Fee Management Section -->
          <div class="mt-6">
            <div v-if="open" class="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Fee Management
            </div>
            
            <div 
              class="flex items-center px-3 py-2 text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
              @click="toggleMenu('fees')"
            >
              <DollarSign class="w-5 h-5 mr-3" />
              <span v-if="open" class="flex-1">Fees</span>
              <ChevronDown 
                v-if="open" 
                class="w-4 h-4 transition-transform duration-200" 
                :class="{ 'rotate-180': menuOpen === 'fees' }"
              />
            </div>
            <div v-if="menuOpen === 'fees' && open" class="ml-8 mt-1 space-y-1">
              <NuxtLink :to="'/fees/types'" :class="subNavClass('/fees/types')">
                <Tag class="w-4 h-4 mr-2" />
                <span>Fee Types</span>
              </NuxtLink>
              <NuxtLink :to="'/fees/structures'" :class="subNavClass('/fees/structures')">
                <List class="w-4 h-4 mr-2" />
                <span>Fee Structures</span>
              </NuxtLink>
              <NuxtLink :to="'/fees/invoices'" :class="subNavClass('/fees/invoices')">
                <Receipt class="w-4 h-4 mr-2" />
                <span>Invoices</span>
              </NuxtLink>
              <NuxtLink :to="'/reports/fees'" :class="subNavClass('/reports/fees')">
                <BarChart3 class="w-4 h-4 mr-2" />
                <span>Reports</span>
              </NuxtLink>
            </div>
          </div>

          <!-- Academic Section -->
          <div class="mt-6">
            <div v-if="open" class="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Academic
            </div>
            
            <div 
              class="flex items-center px-3 py-2 text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
              @click="toggleMenu('academic')"
            >
              <BookOpen class="w-5 h-5 mr-3" />
              <span v-if="open" class="flex-1">Academic</span>
              <ChevronDown 
                v-if="open" 
                class="w-4 h-4 transition-transform duration-200" 
                :class="{ 'rotate-180': menuOpen === 'academic' }"
              />
            </div>
            <div v-if="menuOpen === 'academic' && open" class="ml-8 mt-1 space-y-1">
              <NuxtLink :to="'/academic/years'" :class="subNavClass('/academic/years')">
                <Calendar class="w-4 h-4 mr-2" />
                <span>Academic Years</span>
              </NuxtLink>
              <NuxtLink :to="'/academic/classes'" :class="subNavClass('/academic/classes')">
                <GraduationCap class="w-4 h-4 mr-2" />
                <span>Classes</span>
              </NuxtLink>
              <NuxtLink :to="'/academic/sections'" :class="subNavClass('/academic/sections')">
                <Users class="w-4 h-4 mr-2" />
                <span>Sections</span>
              </NuxtLink>
            </div>
          </div>

          <!-- Reports Section -->
          <div class="mt-6">
            <div v-if="open" class="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Reports & Analytics
            </div>
            
            <NuxtLink :to="'/reports/students'" :class="navClass('/reports/students')">
              <BarChart3 class="w-5 h-5 mr-3" />
              <span v-if="open">Student Reports</span>
            </NuxtLink>
            
            <NuxtLink :to="'/reports/fees'" :class="navClass('/reports/fees')">
              <PieChart class="w-5 h-5 mr-3" />
              <span v-if="open">Fee Reports</span>
            </NuxtLink>
            
            <NuxtLink :to="'/reports/admissions'" :class="navClass('/reports/admissions')">
              <TrendingUp class="w-5 h-5 mr-3" />
              <span v-if="open">Admission Reports</span>
            </NuxtLink>
          </div>

          <!-- Settings Section -->
          <div class="mt-6">
            <div v-if="open" class="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Settings
            </div>
            
            <NuxtLink :to="'/settings/profile'" :class="navClass('/settings/profile')">
              <User class="w-5 h-5 mr-3" />
              <span v-if="open">Profile</span>
            </NuxtLink>
            
            <NuxtLink :to="'/settings/branch'" :class="navClass('/settings/branch')">
              <Building2 class="w-5 h-5 mr-3" />
              <span v-if="open">Branch Settings</span>
            </NuxtLink>
            
            <NuxtLink :to="'/settings/modules'" :class="navClass('/settings/modules')">
              <Settings class="w-5 h-5 mr-3" />
              <span v-if="open">Module Settings</span>
            </NuxtLink>
          </div>
        </template>

        <!-- Accountant Role -->
        <template v-if="isAccountant">
          <div class="mt-6">
            <div v-if="open" class="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Financial Management
            </div>
            
            <NuxtLink :to="'/fees/invoices'" :class="navClass('/fees/invoices')">
              <Receipt class="w-5 h-5 mr-3" />
              <span v-if="open">Fee Invoices</span>
            </NuxtLink>
            
            <NuxtLink :to="'/fees/collections'" :class="navClass('/fees/collections')">
              <CreditCard class="w-5 h-5 mr-3" />
              <span v-if="open">Collections</span>
            </NuxtLink>
            
            <NuxtLink :to="'/reports/fees'" :class="navClass('/reports/fees')">
              <BarChart3 class="w-5 h-5 mr-3" />
              <span v-if="open">Financial Reports</span>
            </NuxtLink>
          </div>
        </template>

        <!-- Receptionist Role -->
        <template v-if="isReceptionist">
          <div class="mt-6">
            <div v-if="open" class="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Front Office
            </div>
            
            <NuxtLink :to="'/students/create'" :class="navClass('/students/create')">
              <UserPlus class="w-5 h-5 mr-3" />
              <span v-if="open">New Admission</span>
            </NuxtLink>
            
            <NuxtLink :to="'/admissions'" :class="navClass('/admissions')">
              <ClipboardList class="w-5 h-5 mr-3" />
              <span v-if="open">Applications</span>
            </NuxtLink>
            
            <NuxtLink :to="'/visitors'" :class="navClass('/visitors')">
              <UserCheck class="w-5 h-5 mr-3" />
              <span v-if="open">Visitors</span>
            </NuxtLink>
          </div>
        </template>
      </nav>
    </div>

    <!-- User Profile -->
    <div class="border-t border-gray-200 dark:border-gray-700 p-4">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ user?.first_name?.charAt(0) }}{{ user?.last_name?.charAt(0) }}
            </span>
          </div>
        </div>
        <div v-if="open" class="ml-3 flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
            {{ user?.first_name }} {{ user?.last_name }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {{ user?.role?.replace('_', ' ') }}
          </p>
        </div>
        <div v-if="open" class="ml-2">
          <button
            @click="logout"
            class="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <LogOut class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
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
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from 'lucide-vue-next';

const props = defineProps({
  open: {
    type: Boolean,
    default: true
  },
  user: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['toggle']);

const authStore = useAuthStore();
const menuOpen = ref('');

// Role checks
const isSuperAdmin = computed(() => props.user?.role === 'super_admin');
const isSchoolAdmin = computed(() => props.user?.role === 'school_admin');
const isBranchAdmin = computed(() => props.user?.role === 'branch_admin');
const isAccountant = computed(() => props.user?.role === 'accountant');
const isReceptionist = computed(() => props.user?.role === 'receptionist');

const toggleMenu = (menu) => {
  menuOpen.value = menuOpen.value === menu ? '' : menu;
};

const navClass = (path) => {
  const route = useRoute();
  const isActive = route.path === path;
  return [
    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
    isActive
      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
  ];
};

const subNavClass = (path) => {
  const route = useRoute();
  const isActive = route.path === path;
  return [
    'flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200',
    isActive
      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-800 dark:text-indigo-300'
      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
  ];
};

const logout = async () => {
  await authStore.logout();
  await navigateTo('/login');
};
</script>
