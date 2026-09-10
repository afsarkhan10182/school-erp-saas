<template>
  <!-- Hidden for branch_admin / teachers / students / single-branch schools -->
  <div v-if="showBranchSelector" class="relative branch-selector-wrapper">
    <!-- Trigger Button -->
    <button
      @click="toggleOpen"
      class="group flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-gray-200/80 dark:border-gray-700/70 bg-white/80 dark:bg-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-700/60 shadow-xs hover:shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
      :aria-expanded="isOpen"
      title="Switch Branch"
    >
      <!-- Branch avatar badge -->
      <span
        class="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold shadow-xs transition-transform duration-200 group-hover:scale-105 flex-shrink-0"
      >
        {{ branchInitial }}
      </span>

      <!-- Branch name & badge -->
      <div class="hidden sm:flex flex-col text-left leading-tight min-w-0 max-w-[140px]">
        <span class="text-xs font-bold text-gray-900 dark:text-white truncate">
          {{ currentBranchLabel }}
        </span>
        <span class="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate">
          {{ authStore.currentSchool?.name || 'Branch Workspace' }}
        </span>
      </div>

      <ChevronDown
        class="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 transition-transform duration-200 flex-shrink-0 group-hover:text-gray-600 dark:group-hover:text-gray-300"
        :class="{ 'rotate-180 text-indigo-600 dark:text-indigo-400': isOpen }"
      />
    </button>

    <!-- Dropdown Panel -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 -translate-y-1"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-80 z-[200] bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/90 dark:border-gray-800 overflow-hidden ring-1 ring-black/5"
        @click.stop
      >
        <!-- Header -->
        <div class="px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h3 class="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Switch Workspace
            </h3>
            <p class="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate mt-0.5">
              {{ authStore.currentSchool?.name || 'School Organization' }}
            </p>
          </div>
          <span class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300">
            {{ filteredBranches.length }} {{ filteredBranches.length === 1 ? 'branch' : 'branches' }}
          </span>
        </div>

        <!-- School Selector (super_admin only) -->
        <div v-if="isSuperAdmin && schoolOptions.length > 1" class="p-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
          <label class="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
            Select School
          </label>
          <div class="relative">
            <select
              v-model="localSchoolId"
              class="w-full text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs font-medium"
              @change="onSchoolChange"
            >
              <option value="">All Schools</option>
              <option v-for="school in schoolOptions" :key="school.id" :value="school.id">
                {{ school.name }}
              </option>
            </select>
            <ChevronDown class="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
          </div>
        </div>

        <!-- Search input if > 4 branches -->
        <div v-if="filteredBranches.length > 4" class="p-2 border-b border-gray-100 dark:border-gray-800">
          <div class="relative">
            <Search class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search branches..."
              class="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-transparent rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <!-- Branch List -->
        <div class="p-1.5 max-h-72 overflow-y-auto space-y-1">
          <!-- All Branches option (Super Admin / School Admin) -->
          <button
            @click="applyBranch('')"
            type="button"
            class="w-full flex items-center justify-between p-2 rounded-xl transition-all duration-150 text-left group"
            :class="[
              !selectedBranchId
                ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-800/40 shadow-2xs'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800/60 text-gray-700 dark:text-gray-300 border border-transparent'
            ]"
          >
            <div class="flex items-center gap-3 min-w-0">
              <span
                class="flex items-center justify-center w-8 h-8 rounded-lg font-bold text-xs transition-colors flex-shrink-0"
                :class="[
                  !selectedBranchId
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 group-hover:text-indigo-600 dark:group-hover:text-indigo-300'
                ]"
              >
                <Layers class="w-4 h-4" />
              </span>
              <div class="min-w-0">
                <div class="text-xs font-semibold truncate flex items-center gap-1.5">
                  All Branches
                </div>
                <div class="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                  School-wide consolidated view
                </div>
              </div>
            </div>

            <span
              v-if="!selectedBranchId"
              class="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white flex-shrink-0 ml-2"
            >
              <Check class="w-3 h-3" />
            </span>
          </button>

          <!-- Individual branches -->
          <button
            v-for="branch in searchedBranches"
            :key="branch.id"
            @click="applyBranch(branch.id)"
            type="button"
            class="w-full flex items-center justify-between p-2 rounded-xl transition-all duration-150 text-left group"
            :class="[
              selectedBranchId === branch.id
                ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-800/40 shadow-2xs'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800/60 text-gray-700 dark:text-gray-300 border border-transparent'
            ]"
          >
            <div class="flex items-center gap-3 min-w-0">
              <span
                class="flex items-center justify-center w-8 h-8 rounded-lg font-bold text-xs transition-colors flex-shrink-0"
                :class="[
                  selectedBranchId === branch.id
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 group-hover:text-indigo-600 dark:group-hover:text-indigo-300'
                ]"
              >
                {{ (branch.name || branch.code || 'B')[0].toUpperCase() }}
              </span>
              <div class="min-w-0">
                <div class="text-xs font-semibold truncate">
                  {{ branch.name || branch.code }}
                </div>
                <div class="text-[11px] text-gray-400 dark:text-gray-500 truncate flex items-center gap-1">
                  <span v-if="branch.code" class="font-mono text-[10px] uppercase">{{ branch.code }}</span>
                  <span v-if="branch.code && branch.city">•</span>
                  <span v-if="branch.city">{{ branch.city }}</span>
                </div>
              </div>
            </div>

            <span
              v-if="selectedBranchId === branch.id"
              class="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white flex-shrink-0 ml-2 shadow-xs"
            >
              <Check class="w-3 h-3" />
            </span>
          </button>

          <!-- Empty search or no branches -->
          <div
            v-if="searchedBranches.length === 0 && !loadingBranches"
            class="px-4 py-6 text-center text-xs text-gray-400 dark:text-gray-500"
          >
            No branches match your search
          </div>
          <div
            v-if="loadingBranches"
            class="px-4 py-6 text-center text-xs text-gray-400 dark:text-gray-500"
          >
            Loading branches…
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { ChevronDown, Check, Layers, Search } from 'lucide-vue-next';
import { useAuthStore } from '~/stores/auth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { Branches } from '~/api/administration/branches';
import { Schools } from '~/api/administration/schools';

const authStore = useAuthStore();
const {
  selectedBranchId,
  currentBranch,
  availableBranches,
  isSuperAdmin,
  isAdmin,
  showBranchSelector,
  switchBranch,
  switchSchool
} = useGlobalBranch();

const isOpen = ref(false);
const loadingBranches = ref(false);
const searchQuery = ref('');
const schoolOptions = ref([]);
const localSchoolId = ref(authStore.currentSchool?.id || '');

// Branches filtered by selected school (for super_admin)
const filteredBranches = computed(() => {
  const branches = availableBranches.value || [];
  if (isSuperAdmin.value && localSchoolId.value) {
    return branches.filter(b => b.school_id === localSchoolId.value);
  }
  return branches;
});

// Search filter
const searchedBranches = computed(() => {
  if (!searchQuery.value.trim()) return filteredBranches.value;
  const q = searchQuery.value.toLowerCase().trim();
  return filteredBranches.value.filter(b =>
    (b.name && b.name.toLowerCase().includes(q)) ||
    (b.code && b.code.toLowerCase().includes(q)) ||
    (b.city && b.city.toLowerCase().includes(q))
  );
});

// Label shown on the trigger button
const currentBranchLabel = computed(() => {
  if (!selectedBranchId.value) return 'All Branches';
  const branch = (availableBranches.value || []).find(b => b.id === selectedBranchId.value);
  return branch?.name || branch?.code || 'Branch';
});

// First letter for the avatar bubble
const branchInitial = computed(() => {
  if (!selectedBranchId.value) return 'A';
  return currentBranchLabel.value[0]?.toUpperCase() || 'B';
});

const toggleOpen = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    searchQuery.value = '';
  }
};

// Apply a branch selection in 1 click and close the panel
const applyBranch = (branchId) => {
  switchBranch(branchId);
  isOpen.value = false;
};

// When school changes (super_admin), reload branches for that school
const onSchoolChange = async () => {
  loadingBranches.value = true;
  try {
    const school = schoolOptions.value.find(s => s.id === localSchoolId.value);
    switchSchool(school ? { id: school.id, name: school.name } : null);
    const params = localSchoolId.value ? { school_id: localSchoolId.value, status: 'active' } : { status: 'active' };
    const res = await Branches.getForDropdown(params);
    if (res.success) {
      authStore.setAvailableBranches(res.data || []);
    }
  } finally {
    loadingBranches.value = false;
  }
};

// Load school options for super_admin
const loadSchools = async () => {
  if (!isSuperAdmin.value) return;
  try {
    const res = await Schools.getAll({ limit: 100, status: 'active' });
    const list = res.data?.schools || res.data?.rows || res.data || [];
    schoolOptions.value = Array.isArray(list) ? list : [];
  } catch {
    schoolOptions.value = [];
  }
};

// Close on click outside or Escape
const handleClickOutside = (event) => {
  if (!event.target) return;
  if (!event.target.closest('.branch-selector-wrapper')) {
    isOpen.value = false;
  }
};

const handleKeyDown = (event) => {
  if (event.key === 'Escape') {
    isOpen.value = false;
  }
};

onMounted(async () => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleKeyDown);
  if (isSuperAdmin.value) {
    await loadSchools();
    localSchoolId.value = authStore.currentSchool?.id || '';
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleKeyDown);
});

watch(
  () => authStore.currentSchool?.id,
  (val) => { localSchoolId.value = val || ''; }
);
</script>
