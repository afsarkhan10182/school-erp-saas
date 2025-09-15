<template>
  <header
    class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 h-16 transition-colors duration-300"
  >
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
      <!-- Theme Toggle -->
      <button
        @click="toggleTheme"
        class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
        :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      >
        <Sun v-if="isDark" class="w-5 h-5 text-yellow-500" />
        <Moon v-else class="w-5 h-5 text-gray-600" />
      </button>

      <UserProfileDropdown :user="user" @logout="$emit('logout')" />
    </div>
  </header>
</template>

<script setup>
import {
  Sun,
  Moon,
  User,
  Shield,
  Building2,
  GraduationCap,
  BookOpen,
  Calculator,
  Users,
  Crown,
  Menu
} from 'lucide-vue-next';
import UserProfileDropdown from '~/components/shared/UserProfileDropdown.vue';

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
