<template>
  <!-- Hidden for branch_admin / teachers / students / single-branch schools -->
  <div v-if="showBranchSelector" class="relative branch-selector-wrapper">
    <!-- Trigger Button -->
    <button
      @click="toggleOpen"
      class="flex items-center space-x-2.5 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
      :aria-expanded="isOpen"
      title="Switch Branch"
    >
      <!-- Branch avatar badge -->
      <span
        class="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold shadow-xs flex-shrink-0"
      >
        {{ branchInitial }}
      </span>

      <!-- Branch name -->
      <span class="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[130px]">
        {{ currentBranchLabel }}
      </span>

      <ChevronDown
        class="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-150 flex-shrink-0"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <!-- Dropdown Panel -->
    <Transition
      enter-active-class="transition duration-75 ease-out"
      enter-from-class="opacity-0 -translate-y-0.5"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-50 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-0.5"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div class="px-4 py-2.5 border-b border-gray-200 dark:border-gray-700">
          <h3
            class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
          >
            Branches
          </h3>
        </div>

        <!-- School Selector (super_admin only) -->
        <div
          v-if="isSuperAdmin && schoolOptions.length > 1"
          class="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60"
        >
          <label
            class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider"
          >
            Select School
          </label>
          <EnhancedDropdown
            v-model="localSchoolId"
            :options="schoolOptions.map(school => ({ value: school.id, label: school.name }))"
            placeholder="All Schools"
            id="branch-school-filter"
            @change="onSchoolChange"
          />
        </div>

        <!-- Search input if > 5 branches -->
        <div
          v-if="filteredBranches.length > 5"
          class="p-2 border-b border-gray-200 dark:border-gray-700"
        >
          <div class="relative">
            <Search
              class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search branches..."
              class="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-transparent rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <!-- Branch List -->
        <div class="p-1.5 max-h-72 overflow-y-auto space-y-1">
          <!-- All Branches option -->
          <button
            @click="applyBranch('')"
            type="button"
            class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left group"
            :class="[
              !selectedBranchId
                ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200 font-semibold'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium'
            ]"
          >
            <div class="flex items-center space-x-2.5 min-w-0">
              <span
                class="flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs transition-colors flex-shrink-0"
                :class="[
                  !selectedBranchId
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/60 group-hover:text-indigo-600 dark:group-hover:text-indigo-300'
                ]"
              >
                <Layers class="w-4 h-4" />
              </span>
              <span class="truncate">All Branches</span>
            </div>

            <span
              v-if="!selectedBranchId"
              class="flex items-center justify-center w-4 h-4 rounded-full bg-indigo-600 text-white flex-shrink-0 ml-2"
            >
              <Check class="w-2.5 h-2.5" />
            </span>
          </button>

          <!-- Individual branches -->
          <button
            v-for="branch in searchedBranches"
            :key="branch.id"
            @click="applyBranch(branch.id)"
            type="button"
            class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left group"
            :class="[
              selectedBranchId === branch.id
                ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200 font-semibold'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium'
            ]"
          >
            <div class="flex items-center space-x-2.5 min-w-0">
              <span
                class="flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs transition-colors flex-shrink-0"
                :class="[
                  selectedBranchId === branch.id
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/60 group-hover:text-indigo-600 dark:group-hover:text-indigo-300'
                ]"
              >
                {{ (branch.name || branch.code || 'B')[0].toUpperCase() }}
              </span>
              <span class="truncate">
                {{ branch.name || branch.code }}
              </span>
            </div>

            <span
              v-if="selectedBranchId === branch.id"
              class="flex items-center justify-center w-4 h-4 rounded-full bg-indigo-600 text-white flex-shrink-0 ml-2 shadow-xs"
            >
              <Check class="w-2.5 h-2.5" />
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
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';

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
  return filteredBranches.value.filter(
    b =>
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
const applyBranch = branchId => {
  switchBranch(branchId);
  isOpen.value = false;
};

// When school changes (super_admin), reload branches for that school
const onSchoolChange = async () => {
  loadingBranches.value = true;
  try {
    const school = schoolOptions.value.find(s => s.id === localSchoolId.value);
    switchSchool(school ? { id: school.id, name: school.name } : null);
    const params = localSchoolId.value
      ? { school_id: localSchoolId.value, status: 'active' }
      : { status: 'active' };
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
const handleClickOutside = event => {
  if (!event.target) return;
  if (!event.target.closest('.branch-selector-wrapper')) {
    isOpen.value = false;
  }
};

const handleKeyDown = event => {
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
  val => {
    localSchoolId.value = val || '';
  }
);
</script>
