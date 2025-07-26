<template>
  <div>
    <!-- Main app content - no loading overlay needed with instant loading -->
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
// No need for auth loading states with the new instant loading approach
// The auth store handles everything instantly on the client side
</script>
