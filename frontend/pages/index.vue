<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div class="text-center">
      <div class="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
        <span class="text-white font-bold text-2xl">S</span>
      </div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">School ERP SaaS</h1>
      <p class="text-gray-600 dark:text-gray-400 mb-8">
        {{ authStore.isInitializing ? 'Verifying session...' : 'Loading...' }}
      </p>

      <!-- Subtle loading indicator -->
      <div v-if="authStore.isInitializing" class="flex justify-center">
        <div
          class="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();

// Progressive enhancement - show content immediately, verify in background
onMounted(async () => {
  // Wait for auth store to initialize (max 500ms)
  if (authStore.isInitializing) {
    await new Promise(resolve => {
      const checkInit = () => {
        if (!authStore.isInitializing) {
          resolve(true);
        } else {
          setTimeout(checkInit, 50);
        }
      };
      checkInit();
    });
  }

  // Redirect based on auth status
  if (authStore.isLoggedIn) {
    await navigateTo('/dashboard');
  } else {
    await navigateTo('/login');
  }
});
</script>
