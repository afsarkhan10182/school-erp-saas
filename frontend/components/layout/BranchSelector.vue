<template>
  <!-- Hidden for branch_admin / teachers / students / single-branch schools -->
  <div v-if="showBranchSelector" class="relative branch-selector-wrapper">
    <!-- Trigger Button matching screenshot -->
    <button
      @click="toggleOpen"
      class="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 focus:outline-none"
      :aria-expanded="isOpen"
    >
      <!-- Branch avatar bubble with magenta/purple outline -->
      <span
        class="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-gray-900 border-2 border-fuchsia-500 text-fuchsia-600 dark:text-fuchsia-400 text-sm font-bold flex-shrink-0 shadow-sm"
      >
        {{ branchInitial }}
      </span>
      <!-- Branch name -->
      <span class="hidden sm:block text-sm font-semibold text-gray-800 dark:text-gray-100 max-w-[130px] truncate">
        {{ currentBranchLabel }}
      </span>
      <ChevronDown
        class="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 transition-transform duration-200 flex-shrink-0"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <!-- Dropdown Panel matching screenshot -->
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
        class="absolute right-0 mt-2 w-72 z-[200] bg-gray-900 text-white rounded-xl shadow-2xl border border-gray-800 overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div class="px-5 py-3.5 border-b border-gray-800/80">
          <h3 class="text-sm font-bold text-white tracking-wide">
            Branches
          </h3>
        </div>

        <!-- School Selector (super_admin only) -->
        <div v-if="isSuperAdmin && schoolOptions.length > 1" class="px-4 pt-3 pb-2 border-b border-gray-800/50">
          <label class="block text-xs font-medium text-gray-400 mb-1">School</label>
          <select
            v-model="localSchoolId"
            class="w-full text-xs bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-fuchsia-500/30 focus:border-fuchsia-500"
            @change="onSchoolChange"
          >
            <option value="">All Schools</option>
            <option v-for="school in schoolOptions" :key="school.id" :value="school.id">
              {{ school.name }}
            </option>
          </select>
        </div>

        <!-- Branch List -->
        <div class="max-h-80 overflow-y-auto divide-y divide-gray-800/60">
          <!-- All Branches option -->
          <div
            class="flex items-center justify-between px-5 py-3.5 hover:bg-gray-800/60 transition-colors"
            :class="{ 'bg-gradient-to-r from-fuchsia-950/40 to-transparent border-l-2 border-fuchsia-500': !selectedBranchId }"
          >
            <div class="flex items-center gap-3.5 min-w-0">
              <span
                class="flex items-center justify-center w-8 h-8 rounded-full bg-white text-gray-800 border-2 border-fuchsia-500 text-sm font-bold flex-shrink-0 shadow"
              >
                A
              </span>
              <span
                class="text-sm font-semibold truncate"
                :class="!selectedBranchId ? 'text-white' : 'text-gray-200'"
              >
                All Branches
              </span>
            </div>
            <button
              v-if="selectedBranchId !== ''"
              @click="applyBranch('')"
              class="text-xs font-semibold px-4 py-1.5 rounded-md bg-[#a22b78] hover:bg-[#b83289] text-white transition-all duration-150 shadow-sm flex-shrink-0 ml-2"
            >
              Apply
            </button>
            <span
              v-else
              class="text-xs font-semibold text-fuchsia-400 flex-shrink-0 ml-2"
            >
              Active
            </span>
          </div>

          <!-- Individual branches -->
          <div
            v-for="branch in filteredBranches"
            :key="branch.id"
            class="flex items-center justify-between px-5 py-3.5 hover:bg-gray-800/60 transition-colors"
            :class="{ 'bg-gradient-to-r from-fuchsia-950/40 to-transparent border-l-2 border-fuchsia-500': selectedBranchId === branch.id }"
          >
            <div class="flex items-center gap-3.5 min-w-0">
              <span
                class="flex items-center justify-center w-8 h-8 rounded-full bg-white text-gray-800 border-2 border-fuchsia-500 text-sm font-bold flex-shrink-0 shadow"
              >
                {{ (branch.name || branch.code || 'B')[0].toUpperCase() }}
              </span>
              <span
                class="text-sm font-semibold truncate"
                :class="selectedBranchId === branch.id ? 'text-white' : 'text-gray-200'"
              >
                {{ branch.name || branch.code }}
              </span>
            </div>
            <button
              v-if="selectedBranchId !== branch.id"
              @click="applyBranch(branch.id)"
              class="text-xs font-semibold px-4 py-1.5 rounded-md bg-[#a22b78] hover:bg-[#b83289] text-white transition-all duration-150 shadow-sm flex-shrink-0 ml-2"
            >
              Apply
            </button>
            <span
              v-else
              class="text-xs font-semibold text-fuchsia-400 flex-shrink-0 ml-2"
            >
              Active
            </span>
          </div>

          <!-- Empty state -->
          <div v-if="filteredBranches.length === 0 && !loadingBranches" class="px-5 py-6 text-center text-xs text-gray-400">
            No branches available
          </div>
          <div v-if="loadingBranches" class="px-5 py-6 text-center text-xs text-gray-400">
            Loading branches…
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { ChevronDown } from 'lucide-vue-next';
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
};

// Apply a branch selection and close the panel
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
    // Reload branches for this school
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

// Close on click outside
const handleClickOutside = (event) => {
  if (!event.target) return;
  if (!event.target.closest('.branch-selector-wrapper')) {
    isOpen.value = false;
  }
};

onMounted(async () => {
  document.addEventListener('click', handleClickOutside);
  if (isSuperAdmin.value) {
    await loadSchools();
    // Sync local school id
    localSchoolId.value = authStore.currentSchool?.id || '';
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// Keep localSchoolId in sync when authStore school changes
watch(
  () => authStore.currentSchool?.id,
  (val) => { localSchoolId.value = val || ''; }
);
</script>
