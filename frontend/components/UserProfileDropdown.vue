<template>
  <div class="relative user-profile-dropdown">
    <!-- User Profile Button -->
    <button 
      @click="toggleDropdown"
      @blur="handleBlur"
      class="flex items-center space-x-3 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
      :aria-expanded="isOpen"
      aria-haspopup="true"
    >
      <!-- User Avatar -->
      <div v-if="props.user?.profile_image" class="w-8 h-8 rounded-full overflow-hidden">
        <img 
          :src="uploadsUrl(props.user.profile_image)" 
          :key="props.user?.profile_image || 'default'"
          :alt="userName"
          class="w-full h-full object-cover"
        />
      </div>
      <div v-else class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
        <component :is="getUserIcon()" class="w-4 h-4 text-white" />
      </div>
      
      <!-- User Info -->
      <div class="hidden md:block text-left">
        <p class="text-sm font-medium text-gray-900 dark:text-white">{{ userName }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">{{ userRole }}</p>
      </div>
      
      <!-- Dropdown Arrow -->
      <ChevronDown 
        class="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <!-- Dropdown Menu -->
    <div 
      v-if="isOpen"
      class="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
      @click.stop
    >
      <!-- User Header -->
      <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center space-x-3">
          <div v-if="props.user?.profile_image" class="w-10 h-10 rounded-full overflow-hidden">
            <img 
              :src="uploadsUrl(props.user.profile_image)" 
              :key="props.user?.profile_image || 'default'"
              :alt="userName"
              class="w-full h-full object-cover"
            />
          </div>
          <div v-else class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <component :is="getUserIcon()" class="w-5 h-5 text-white" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ userName }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ userEmail }}</p>
            <p class="text-xs text-blue-600 dark:text-blue-400 font-medium">{{ userRole }}</p>
          </div>
        </div>
      </div>

      <!-- Menu Items -->
      <div class="py-1">
        <!-- Profile Link -->
        <button 
          @click="navigateToProfile"
          class="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
        >
          <User class="w-4 h-4 mr-3 text-gray-500 dark:text-gray-400" />
          Profile
        </button>

        <!-- Settings Link -->
        <button 
          @click="navigateToSettings"
          class="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
        >
          <Settings class="w-4 h-4 mr-3 text-gray-500 dark:text-gray-400" />
          Settings
        </button>

        <!-- Divider -->
        <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>

        <!-- Logout Button -->
        <button 
          @click="handleLogout"
          class="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150"
        >
          <LogOut class="w-4 h-4 mr-3" />
          Logout
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { User, Settings, LogOut, ChevronDown, Crown, Building2, Shield, GraduationCap, BookOpen, Calculator, Users } from 'lucide-vue-next';
import { useAuthStore } from '~/stores/auth';

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['logout']);

const authStore = useAuthStore();
const isOpen = ref(false);

// Helper function for uploads URL
const uploadsUrl = (filename) => {
  const config = useRuntimeConfig()
  return filename ? `${config.public.apiBase?.replace('/api','')}/uploads/${filename}` : ''
}

// Computed properties
const userName = computed(() => {
  if (!props.user) return '';
  return `${props.user.first_name || ''} ${props.user.last_name || ''}`.trim() || 'User';
});

const userEmail = computed(() => {
  return props.user?.email || '';
});

const userRole = computed(() => {
  if (!props.user?.role) return '';
  
  const roleMap = {
    'super_admin': 'Super Admin',
    'school_admin': 'School Admin',
    'branch_admin': 'Branch Admin',
    'teacher': 'Teacher',
    'librarian': 'Librarian',
    'accountant': 'Accountant',
    'hr': 'HR Manager',
    'receptionist': 'Receptionist'
  };
  
  return roleMap[props.user.role] || props.user.role;
});

// Methods
const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const handleBlur = (event) => {
  // Use setTimeout to allow click events to fire first
  setTimeout(() => {
    if (!event.currentTarget) return;
    
    const dropdownContainer = event.currentTarget.closest('.user-profile-dropdown');
    if (!dropdownContainer?.contains(document.activeElement)) {
      isOpen.value = false;
    }
  }, 100);
};

const getUserIcon = () => {
  if (!props.user?.role) return User;
  
  switch (props.user.role) {
    case 'super_admin':
      return Crown;
    case 'school_admin':
      return Building2;
    case 'branch_admin':
      return Shield;
    case 'teacher':
      return GraduationCap;
    case 'librarian':
      return BookOpen;
    case 'accountant':
      return Calculator;
    case 'hr':
      return Users;
    default:
      return User;
  }
};

const navigateToProfile = () => {
  isOpen.value = false;
  navigateTo('/settings/profile');
};

const navigateToSettings = () => {
  isOpen.value = false;
  navigateTo('/settings');
};

const handleLogout = async () => {
  isOpen.value = false;
  emit('logout');
};

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  if (!event.target) return;
  
  const dropdownContainer = event.target.closest('.user-profile-dropdown');
  if (!dropdownContainer) {
    isOpen.value = false;
  }
};

// Add click outside listener
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
