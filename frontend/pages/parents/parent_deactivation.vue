<template>
  <div class="space-y-6 max-w-full">
    <!-- Header Banner -->
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm"
    >
      <div>
        <h1
          class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5 tracking-tight"
        >
          <span class="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-xl">
            <ShieldAlert class="w-6 h-6" />
          </span>
          Parents Login Deactivation
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage and toggle parent portal login access and authentication status.
        </p>
      </div>
    </div>

    <!-- Parent List Card -->
    <div
      class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden space-y-4"
    >
      <div class="p-6 pb-0 flex items-center justify-between">
        <h2 class="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Users class="w-5 h-5 text-indigo-500" />
          Parents List
        </h2>
        <span v-if="parents.length" class="text-xs font-medium text-gray-500 dark:text-gray-400">
          Showing {{ parents.length }} parent(s)
        </span>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="p-12 text-center text-gray-500 dark:text-gray-400">
        <div
          class="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3"
        ></div>
        Loading parents list...
      </div>

      <!-- Parents Table -->
      <div v-else-if="parents.length" class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr
              class="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              <th class="px-4 py-3.5 w-10">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  class="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                  @change="toggleSelectAll"
                />
              </th>
              <th class="px-4 py-3.5">Guardian Name</th>
              <th class="px-4 py-3.5">Occupation</th>
              <th class="px-4 py-3.5">Mobile No</th>
              <th class="px-4 py-3.5">Email</th>
              <th class="px-4 py-3.5">Login Status</th>
              <th class="px-4 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700/50 text-sm">
            <tr
              v-for="parent in parents"
              :key="parent.id"
              class="hover:bg-gray-50/50 dark:hover:bg-gray-750 transition-colors"
            >
              <td class="px-4 py-3.5">
                <input
                  v-model="selectedParentIds"
                  type="checkbox"
                  :value="parent.id"
                  class="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                />
              </td>
              <td class="px-4 py-3.5 font-semibold text-gray-900 dark:text-white">
                {{ parent.guardian_name || parent.father_name || parent.name || '—' }}
              </td>
              <td class="px-4 py-3.5 text-gray-600 dark:text-gray-300">
                {{ parent.occupation || '—' }}
              </td>
              <td class="px-4 py-3.5 text-gray-600 dark:text-gray-300 font-mono text-xs">
                {{ parent.mobile_number || parent.mobileno || '—' }}
              </td>
              <td class="px-4 py-3.5 text-gray-600 dark:text-gray-300">
                {{ parent.email || '—' }}
              </td>
              <td class="px-4 py-3.5">
                <span
                  class="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1"
                  :class="
                    parent.user?.status === 'inactive' || parent.status === 'inactive'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  "
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="
                      parent.user?.status === 'inactive' || parent.status === 'inactive'
                        ? 'bg-rose-500'
                        : 'bg-emerald-500'
                    "
                  ></span>
                  {{
                    parent.user?.status === 'inactive' || parent.status === 'inactive'
                      ? 'Deactivated'
                      : 'Active'
                  }}
                </span>
              </td>
              <td class="px-4 py-3.5 text-right">
                <button
                  v-if="parent.user?.status === 'inactive' || parent.status === 'inactive'"
                  class="px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800"
                  @click="toggleParentStatus(parent, 'active')"
                >
                  Activate
                </button>
                <button
                  v-else
                  class="px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg transition-colors border border-rose-200 dark:border-rose-800"
                  @click="toggleParentStatus(parent, 'inactive')"
                >
                  Deactivate
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-else class="p-12 text-center">
        <div class="inline-flex p-4 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 mb-3">
          <Users class="w-8 h-8" />
        </div>
        <p class="text-base font-medium text-gray-900 dark:text-white">No parents found</p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Select a branch above to filter parent records.
        </p>
      </div>

      <!-- Footer Bulk Action Controls -->
      <div
        v-if="parents.length"
        class="p-4 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700/50 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Selected:
          <strong class="text-gray-900 dark:text-white">{{ selectedParentIds.length }}</strong> of
          {{ parents.length }}
        </div>
        <div class="flex items-center gap-3">
          <button
            :disabled="!selectedParentIds.length"
            class="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition-all shadow-sm flex items-center gap-1.5"
            @click="bulkToggleStatus('active')"
          >
            <Unlock class="w-3.5 h-3.5" />
            Authentication Activate
          </button>
          <button
            :disabled="!selectedParentIds.length"
            class="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white transition-all shadow-sm flex items-center gap-1.5"
            @click="bulkToggleStatus('inactive')"
          >
            <Lock class="w-3.5 h-3.5" />
            Authentication Deactivate
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { ShieldAlert, Users, Lock, Unlock } from 'lucide-vue-next';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { Parents } from '~/api/students/academic-services';
import { DynamicEntities } from '~/api/shared/dynamic-entities';
import { extractList } from '~/utils/list-response';

const { selectedBranchId, branchScopeParams: scopeParams } = useGlobalBranch();

const parents = ref<any[]>([]);
const loading = ref(false);
const selectedParentIds = ref<string[]>([]);

watch(selectedBranchId, () => {
  fetchParents();
});

const isAllSelected = computed(() => {
  return parents.value.length > 0 && selectedParentIds.value.length === parents.value.length;
});

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedParentIds.value = [];
  } else {
    selectedParentIds.value = parents.value.map(p => p.id);
  }
};

const fetchParents = async () => {
  loading.value = true;
  try {
    const res: any = await Parents.getAll(scopeParams.value);
    parents.value = extractList(res, ['parents']);
  } catch (error) {
    console.error('Error fetching parents:', error);
    parents.value = [];
  } finally {
    loading.value = false;
  }
};

const toggleParentStatus = async (parent: any, status: 'active' | 'inactive') => {
  try {
    await DynamicEntities.create('parent_deactivation', {
      user_id: parent.id,
      status
    });
    if (parent.user) parent.user.status = status;
    parent.status = status;
  } catch (error) {
    console.error('Failed to update parent status:', error);
  }
};

const bulkToggleStatus = async (status: 'active' | 'inactive') => {
  for (const id of selectedParentIds.value) {
    const parent = parents.value.find(p => p.id === id);
    if (parent) {
      await toggleParentStatus(parent, status);
    }
  }
  selectedParentIds.value = [];
};

onMounted(async () => {
  await fetchParents();
});
</script>
