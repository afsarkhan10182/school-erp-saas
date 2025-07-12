<template>
  <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 h-16 transition-colors duration-300">
    <div class="flex items-center">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
        {{ pageTitle }}
      </h2>
    </div>
    <div class="flex items-center space-x-4">
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
import { Sun, Moon, User, Shield, Building2, GraduationCap, BookOpen, Calculator, Users, Crown } from 'lucide-vue-next';

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

const userInitials = computed(() => {
  if (!props.user) return '';
  return `${props.user.first_name?.charAt(0) || ''}${props.user.last_name?.charAt(0) || ''}`.toUpperCase();
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

// Theme management
const isDark = ref(false);

const toggleTheme = () => {
  isDark.value = !isDark.value;
  if (isDark.value) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
};

onMounted(() => {
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('theme') || 'light';
  isDark.value = savedTheme === 'dark';
});
</script> 