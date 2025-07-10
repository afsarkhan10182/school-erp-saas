<template>
  <aside :class="['transition-all duration-200 bg-white shadow-lg h-screen fixed z-40', open ? 'w-64' : 'w-16']">
    <div class="flex h-16 items-center justify-between px-4 border-b border-gray-200">
      <div class="flex items-center">
        <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-sm">S</span>
        </div>
        <span v-if="open" class="ml-3 text-lg font-semibold text-gray-900 transition-all">School ERP</span>
      </div>
      <button @click="$emit('toggle')" class="ml-2 p-1 rounded hover:bg-gray-100 focus:outline-none">
        <span v-if="open">⬅️</span>
        <span v-else>➡️</span>
      </button>
    </div>
    <nav class="mt-6 px-2">
      <NuxtLink v-for="item in navigationItems" :key="item.name" :to="item.href"
        :class="['flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          $route.path.startsWith(item.href) ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
          open ? 'justify-start' : 'justify-center']">
        <span class="mr-3 text-lg" v-if="open">{{ item.icon }}</span>
        <span v-else class="text-lg">{{ item.icon }}</span>
        <span v-if="open">{{ item.name }}</span>
      </NuxtLink>
    </nav>
    <slot />
  </aside>
</template>

<script setup>
defineProps({
  open: Boolean
});
const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
  { name: 'School Subscriptions', href: '/subscriptions', icon: '🏫' },
  { name: 'Users', href: '/users', icon: '👥' },
  { name: 'Branches', href: '/branches', icon: '🏢' },
  { name: 'Transactions', href: '/subscriptions', icon: '��' },
];
</script> 