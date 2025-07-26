<template>
  <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 h-16 transition-colors duration-300">
    <div class="flex items-center">
      <!-- Mobile Sidebar Toggle -->
      <button 
        @click="$emit('toggle-mobile-sidebar')"
        class="lg:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 mr-3"
        title="Toggle sidebar"
      >
        <Menu class="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>
      
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
        {{ pageTitle }}
      </h2>
    </div>
    <div class="flex items-center space-x-4">
      <!-- Branch Switcher (only for users who can switch branches) -->
      <div v-if="canSwitchBranches && availableBranches.length > 1" class="flex items-center space-x-2">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Branch:</label>
        <select
          :value="currentBranch?.id"
          @change="handleBranchChange"
          class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          :disabled="branchLoading"
        >
          <option v-for="branch in availableBranches" :key="branch.id" :value="branch.id">
            {{ branch.name }}
          </option>
        </select>
        <div v-if="branchLoading" class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Theme Toggle -->
      <button 
        @click="toggleTheme" 
        class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
        :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      >
        <Sun v-if="isDark" class="w-5 h-5 text-yellow-500" />
        <Moon v-else class="w-5 h-5 text-gray-600" />
      </button>
      
      <div class="flex items-center space-x-2">
        <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <component :is="getUserIcon()" class="w-4 h-4 text-white" />
        </div>
        <span class="font-medium text-gray-700 dark:text-gray-300">{{ userGreeting }}</span>
        <button @click="$emit('logout')" class="ml-2 px-3 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 text-sm font-medium transition-colors duration-200">Logout</button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { Sun, Moon, User, Shield, Building2, GraduationCap, BookOpen, Calculator, Users, Crown, Menu } from 'lucide-vue-next';
import { useBranchContext } from '~/composables/useBranchContext';

const props = defineProps({
  user: {
    type: Object,
    required: true
  },
  pageTitle: {
    type: String,
    required: true
  }
});

// Branch context
const { 
  currentBranch, 
  availableBranches, 
  canSwitchBranches, 
  switchBranch, 
  loading: branchLoading 
} = useBranchContext();

const userInitials = computed(() => {
  if (!props.user) return '';
  return `${(props.user.first_name || '').charAt(0)}${(props.user.last_name || '').charAt(0)}`.toUpperCase();
});

const userName = computed(() => {
  if (!props.user) return '';
  return `${props.user.first_name || ''} ${props.user.last_name || ''}`.trim();
});

const userGreeting = computed(() => {
  if (!props.user) return '';
  
  const name = userName.value;
  const role = props.user.role;
  
  // Format role for display
  const roleDisplay = role?.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ') || '';
  
  if (name) {
    return `Hi, ${name} (${roleDisplay})`;
  } else {
    return `Hi, ${roleDisplay}`;
  }
});

const getUserIcon = () => {
  if (!props.user?.role) return User;
  
  switch (props.user.role) {
    case 'super_admin':
      return Crown; // 👑 Crown for super admin
    case 'school_admin':
      return Building2; // 🏢 Building for school admin
    case 'branch_admin':
      return Shield; // 🛡️ Shield for branch admin
    case 'teacher':
      return GraduationCap; // 🎓 Graduation cap for teacher
    case 'librarian':
      return BookOpen; // 📚 Book for librarian
    case 'accountant':
      return Calculator; // 🧮 Calculator for accountant
    case 'hr':
      return Users; // 👥 Users for HR
    default:
      return User; // 👤 Default user icon
  }
};

// Branch switching
const handleBranchChange = async (event) => {
  const branchId = event.target.value;
  if (branchId && branchId !== currentBranch.value?.id) {
    await switchBranch(branchId);
  }
};

// Theme management
const isDark = ref(false);

const toggleTheme = () => {
  isDark.value = !isDark.value;
  if (import.meta.client) {
    if (isDark.value) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }
};

onMounted(() => {
  if (import.meta.client) {
    // Check for saved theme preference, default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    isDark.value = savedTheme === 'dark';
    // Apply theme on mount
    if (isDark.value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
});
</script> 