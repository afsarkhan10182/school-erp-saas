<template>
  <header class="bg-white shadow-sm border-b border-gray-200 flex items-center justify-between px-6 h-16">
    <div class="flex items-center">
      <h2 class="text-xl font-semibold text-gray-900">
        {{ pageTitle }}
      </h2>
    </div>
    <div class="flex items-center space-x-4">
      <div class="flex items-center space-x-2">
        <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
          <span class="text-gray-600 font-medium">{{ userInitials }}</span>
        </div>
        <span class="font-medium text-gray-700">{{ userName }}</span>
        <button @click="$emit('logout')" class="ml-2 px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 text-sm font-medium">Logout</button>
      </div>
    </div>
  </header>
</template>

<script setup>
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
</script> 