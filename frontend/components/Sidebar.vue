<template>
  <client-only>
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
        <NuxtLink :to="'/dashboard'" :class="navClass('/dashboard')">
          <span class="mr-3 text-lg" v-if="open">🏠</span>
          <span v-else class="text-lg">🏠</span>
          <span v-if="open">Dashboard</span>
        </NuxtLink>
        <!-- Client-only dynamic branch list (now redundant, all is client-only) -->
        <template v-if="isSuperAdmin">
          <div v-if="branches.length" class="ml-2 mt-2">
            <div v-for="branch in branches" :key="branch._id">
              <NuxtLink :to="`/branches/${branch._id}`" :class="navClass(`/branches/${branch._id}`)">
                <span class="mr-3 text-lg" v-if="open">🏢</span>
                <span v-else class="text-lg">🏢</span>
                <span v-if="open">{{ branch.name }}</span>
              </NuxtLink>
            </div>
          </div>
        </template>
        <template v-else-if="isSchoolAdmin">
          <div v-if="branches.length" class="ml-2 mt-2">
            <div v-for="branch in branches" :key="branch._id">
              <NuxtLink :to="`/branches/${branch._id}`" :class="navClass(`/branches/${branch._id}`)">
                <span class="mr-3 text-lg" v-if="open">🏢</span>
                <span v-else class="text-lg">🏢</span>
                <span v-if="open">{{ branch.name }}</span>
              </NuxtLink>
            </div>
          </div>
        </template>
        <!-- Common Menus -->
        <NuxtLink v-if="isSuperAdmin" :to="'/subscriptions'" :class="navClass('/subscriptions')">
          <span class="mr-3 text-lg" v-if="open">🏫</span>
          <span v-else class="text-lg">🏫</span>
          <span v-if="open">School Subscriptions</span>
        </NuxtLink>
        <NuxtLink v-if="isSuperAdmin" :to="'/users'" :class="navClass('/users')">
          <span class="mr-3 text-lg" v-if="open">👥</span>
          <span v-else class="text-lg">👥</span>
          <span v-if="open">Users</span>
        </NuxtLink>
        <NuxtLink v-if="isSuperAdmin" :to="'/branches'" :class="navClass('/branches')">
          <span class="mr-3 text-lg" v-if="open">🏢</span>
          <span v-else class="text-lg">🏢</span>
          <span v-if="open">Branches</span>
        </NuxtLink>
        <NuxtLink v-if="isSuperAdmin" :to="'/subscriptions'" :class="navClass('/subscriptions')">
          <span class="mr-3 text-lg" v-if="open">💳</span>
          <span v-else class="text-lg">💳</span>
          <span v-if="open">Transactions</span>
        </NuxtLink>
      </nav>

      <slot />
    </aside>
  </client-only>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '~/utils/api';

// Props
const props = defineProps({
  open: Boolean,
  user: Object
});

// Route
const route = useRoute();

// Safe Computed User Role Checks
const safeUser = computed(() => props.user || {});
const isSuperAdmin = computed(() => safeUser.value?.role === 'super_admin');
const isSchoolAdmin = computed(() => safeUser.value?.role === 'school_admin');

// State
const branches = ref([]);

// Safe School ID Getter
const getSchoolId = () => safeUser.value?.schoolId || safeUser.value?.school_id || null;

// Fetch Branches (Only on Client, with Auth Token)
const fetchBranches = async () => {
  if (typeof window === 'undefined') return;
  const token = localStorage.getItem('token');
  if (!token) {
    branches.value = [];
    return;
  }
  if (!props.user || !props.user.role) {
    branches.value = [];
    return;
  }
  if (isSuperAdmin.value) {
    try {
      const res = await apiClient.branches.getAll(token);
      branches.value = res.data?.items || res.data || [];
    } catch (e) {
      branches.value = [];
    }
  } else if (isSchoolAdmin.value && getSchoolId()) {
    try {
      const res = await apiClient.branches.getAll(getSchoolId(), token);
      branches.value = res.data?.items || res.data || [];
    } catch (e) {
      branches.value = [];
    }
  } else {
    branches.value = [];
  }
};

onMounted(() => {
  if (typeof window !== 'undefined') {
    fetchBranches();
    window.addEventListener('branch-updated', fetchBranches);
  }
});
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('branch-updated', fetchBranches);
  }
});
watch(() => props.user, () => {
  if (typeof window !== 'undefined') fetchBranches();
});

// Navigation Class Helper
const navClass = (href) => {
  const isActive = route.path.startsWith(href);
  return [
    'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
    isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
    props.open ? 'justify-start' : 'justify-center'
  ];
};
</script>
