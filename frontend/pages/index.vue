<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <div class="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
        <span class="text-white font-bold text-2xl">S</span>
      </div>
      <h1 class="text-3xl font-bold text-gray-900 mb-2">School ERP SaaS</h1>
      <p class="text-gray-600 mb-8">Loading...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// Redirect based on authentication status
onMounted(async () => {
  // For now, redirect to login
  // Later this will check auth status and redirect accordingly
  await navigateTo('/login');
});
</script> 