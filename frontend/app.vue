<template>
  <div>
    <!-- Skip-to-content link for keyboard users -->
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[10000] focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg"
    >
      Skip to main content
    </a>
    <!-- Main app content - no loading overlay needed with instant loading -->
    <NuxtLayout>
      <NuxtPage :key="branchPageKey" />
    </NuxtLayout>
  </div>
</template>

<script setup>
const authStore = useAuthStore();
const branchPageKey = computed(() => `${authStore.currentSchool?.id || 'all'}:${authStore.currentBranch?.id || 'all'}`);

// Prevent theme flash — apply saved theme before paint
useHead({
  script: [
    {
      innerHTML: `
        (function() {
          try {
            var t = localStorage.getItem('theme');
            if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
              document.documentElement.classList.add('dark');
            }
          } catch(e) {}
        })();
      `,
      tagPosition: 'head'
    }
  ]
});
// No need for auth loading states with the new instant loading approach
// The auth store handles everything instantly on the client side
</script>
