<template>
  <div class="min-h-screen bg-gray-50 flex">
    <!-- Sidebar (only if logged in and user loaded, client-only) -->
    <client-only>
      <Sidebar v-if="isLoggedIn && user" :open="sidebarOpen" :user="user" @toggle="sidebarOpen = !sidebarOpen" />
    </client-only>

    <!-- Main content -->
    <div :class="isLoggedIn ? (sidebarOpen ? 'ml-64' : 'ml-16') : ''" class="flex-1 flex flex-col min-h-screen transition-all duration-200">
      <!-- Header (only if logged in) -->
      <Header v-if="isLoggedIn" :user="user" :pageTitle="pageTitle" @logout="handleLogout" />
      <!-- Page content -->
      <main class="p-6 flex-1">
        <slot />
      </main>
    </div>
    
    <!-- Global Toast Notification -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Sidebar from '~/components/Sidebar.vue';
import Header from '~/components/Header.vue';
import Toast from '~/components/Toast.vue';
import { useAuthStore } from '~/stores/auth';

const sidebarOpen = ref(true);
const router = useRouter();
const route = useRoute();

const authStore = useAuthStore();
const user = computed(() => authStore.currentUser);
const isLoggedIn = computed(() => authStore.isLoggedIn);

const handleLogout = async () => {
  await authStore.logout();
};

const pageTitle = computed(() => {
  const path = route.path;
  if (path.startsWith('/dashboard')) return 'Dashboard';
  if (path.startsWith('/schools')) return 'Schools';
  if (path.startsWith('/users')) return 'Users';
  if (path.startsWith('/branches')) return 'Branches';
  return 'School ERP';
});
</script>

<style scoped>
@media (max-width: 640px) {
  aside {
    display: none;
  }
  .ml-64, .ml-16 {
    margin-left: 0 !important;
  }
}
</style> 