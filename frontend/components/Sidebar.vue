<template>
  <client-only>
    <aside :class="['transition-all duration-300 glass-card h-screen fixed z-40', open ? 'w-64' : 'w-16']">
      <div class="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center">
          <div class="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-sm">S</span>
          </div>
          <span v-if="open" class="ml-3 text-lg font-semibold text-gray-900 dark:text-white transition-all gradient-text">School ERP</span>
        </div>
        <button @click="$emit('toggle')" class="ml-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors duration-200">
          <ChevronLeft v-if="open" class="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <ChevronRight v-else class="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <nav class="mt-6 px-2">
        <NuxtLink :to="'/dashboard'" :class="navClass('/dashboard')">
          <Home class="w-5 h-5 mr-3" />
          <span v-if="open">Dashboard</span>
        </NuxtLink>
        
        <!-- Client-only dynamic branch list -->
        <template v-if="isSuperAdmin">
          <div v-if="branches.length" class="ml-2 mt-2">
            <div v-for="(branch, index) in branches" :key="branch._id">
              <NuxtLink :to="`/branches/${branch._id}`" :class="navClass(`/branches/${branch._id}`)">
                <Building2 class="w-5 h-5 mr-3" />
                <span v-if="open">{{ branch.name }}</span>
              </NuxtLink>
            </div>
          </div>
        </template>
        
        <template v-else-if="isSchoolAdmin">
          <div v-if="branches.length" class="ml-2 mt-2">
            <div v-for="(branch, index) in branches" :key="branch._id">
              <NuxtLink :to="`/branches/${branch._id}`" :class="navClass(`/branches/${branch._id}`)">
                <Building2 class="w-5 h-5 mr-3" />
                <span v-if="open">{{ branch.name }}</span>
              </NuxtLink>
            </div>
          </div>
        </template>
        
        <!-- Common Menus -->
        <NuxtLink v-if="isSuperAdmin" :to="'/subscriptions'" :class="navClass('/subscriptions')">
          <School class="w-5 h-5 mr-3" />
          <span v-if="open">School Subscriptions</span>
        </NuxtLink>
        
        <NuxtLink v-if="isSuperAdmin" :to="'/users'" :class="navClass('/users')">
          <Users class="w-5 h-5 mr-3" />
          <span v-if="open">Users</span>
        </NuxtLink>
        
        <NuxtLink v-if="isSuperAdmin" :to="'/branches'" :class="navClass('/branches')">
          <Building2 class="w-5 h-5 mr-3" />
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
import { Home, Building2, School, Users, ChevronLeft, ChevronRight } from 'lucide-vue-next';
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
    'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
    isActive 
      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100',
    props.open ? 'justify-start' : 'justify-center'
  ];
};
</script>
