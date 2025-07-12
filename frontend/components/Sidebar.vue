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
      </nav>

      <slot />
    </aside>
  </client-only>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '~/stores/auth';
import apiClient from '~/utils/api';

const props = defineProps({
  user: Object,
  open: Boolean
});
const route = useRoute();
const authStore = useAuthStore();
const safeUser = computed(() => props.user || authStore.currentUser || {});
const isSuperAdmin = computed(() => safeUser.value?.role === 'super_admin');
const isSchoolAdmin = computed(() => safeUser.value?.role === 'school_admin');

const branches = ref([]);
const getSchoolId = () => safeUser.value?.schoolId || safeUser.value?.school_id || null;

const fetchBranches = async () => {
  if (!safeUser.value || !safeUser.value.role) {
    branches.value = [];
    return;
  }
  
  // Add a small delay to prevent rapid successive calls
  if (fetchBranches.debounceTimer) {
    clearTimeout(fetchBranches.debounceTimer);
  }
  
  fetchBranches.debounceTimer = setTimeout(async () => {
    if (isSuperAdmin.value) {
      try {
        const res = await apiClient.branches.getAll();
        branches.value = res.data?.items || res.data || [];
      } catch (e) {
        branches.value = [];
      }
    } else if (isSchoolAdmin.value && getSchoolId()) {
      try {
        const res = await apiClient.branches.getAll(getSchoolId());
        branches.value = res.data?.items || res.data || [];
      } catch (e) {
        branches.value = [];
      }
    } else {
      branches.value = [];
    }
  }, 100); // 100ms debounce
};

onMounted(() => {
  fetchBranches();
  window.addEventListener('branch-updated', fetchBranches);
});
onUnmounted(() => {
  window.removeEventListener('branch-updated', fetchBranches);
});
watch(() => props.user, () => {
  fetchBranches();
});

const navClass = (href) => {
  const isActive = route.path.startsWith(href);
  return [
    'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
    isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
    props.open ? 'justify-start' : 'justify-center'
  ];
};
</script>
