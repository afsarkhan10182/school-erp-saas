<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Parents</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Guardian contacts and parent portal access.
        </p>
      </div>
      <button
        class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-150"
        @click="openCreate"
      >
        Add Parent
      </button>
    </div>

    <div
      v-if="errorMessage"
      class="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-300"
    >
      {{ errorMessage }}
      <button class="ml-3 font-medium underline" @click="load">Retry</button>
    </div>

    <div
      class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl overflow-hidden"
    >
      <div v-if="loading" class="p-8 text-center text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
        <span class="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
        Loading parents...
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50/80 dark:bg-gray-900/40">
            <tr>
              <th
                class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Guardian
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Contact
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Relation
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Students
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Portal
              </th>
              <th
                class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
            <tr
              v-for="item in items"
              :key="item.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
            >
              <td class="px-4 py-3.5 text-sm font-medium text-gray-900 dark:text-white">
                {{ item.guardian_name }}
              </td>
              <td class="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                <div>{{ item.guardian_phone }}</div>
                <div class="text-xs text-gray-400 dark:text-gray-500">
                  {{ item.guardian_email || item.father_email || item.mother_email || '-' }}
                </div>
              </td>
              <td class="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                {{ item.guardian_relation }}
              </td>
              <td class="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                {{ studentNames(item) }}
              </td>
              <td class="px-4 py-3.5 text-sm">
                <span :class="portalBadgeClass(item)">{{ portalLabel(item) }}</span>
              </td>
              <td class="px-4 py-3.5 text-sm text-right whitespace-nowrap">
                <button
                  v-if="!item.user_id"
                  class="mr-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  @click="createLogin(item)"
                >
                  Create login
                </button>
                <button
                  v-else
                  class="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  @click="toggleLogin(item)"
                >
                  {{ item.user?.status === 'active' ? 'Disable' : 'Enable' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <p
          v-if="!loading && !items.length && !errorMessage"
          class="p-8 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          No parents found.
        </p>
      </div>
    </div>

    <!-- Add Parent Modal -->
    <div
      v-if="showForm"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 w-full max-w-md shadow-xl space-y-4"
      >
        <h2 class="text-lg font-bold text-gray-900 dark:text-white">Add Parent</h2>
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Guardian Name</label>
            <input v-model="form.guardian_name" class="input-field" placeholder="Guardian name" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <input v-model="form.guardian_phone" class="input-field" placeholder="Phone number" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              v-model="form.guardian_email"
              type="email"
              class="input-field"
              placeholder="Email for portal login"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Relation</label>
            <input v-model="form.guardian_relation" class="input-field" placeholder="Relation (e.g., Father, Mother)" />
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            @click="showForm = false"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
            @click="save"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { Parents } from '~/api/students/academic-services';
import { DynamicEntities } from '~/api/shared/dynamic-entities';
import { useAuth } from '~/composables/useAuth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useToast } from '~/composables/useToast';
import { extractList, apiErrorMessage } from '~/utils/list-response';

const { showToast } = useToast();
const { user } = useAuth();
const { selectedBranchId, currentSchool } = useGlobalBranch();
const isSuperAdmin = computed(() => user.value?.role === 'super_admin');
const items = ref<any[]>([]);
const selectedSchoolId = computed(() => currentSchool.value?.id || user.value?.school_id || '');
const showForm = ref(false);
const loading = ref(false);
const errorMessage = ref('');
const form = ref({
  guardian_name: '',
  guardian_phone: '',
  guardian_relation: 'Guardian',
  guardian_email: ''
});

const studentNames = (item: any) =>
  (item.students || []).map((s: any) => `${s.first_name} ${s.last_name || ''}`.trim()).join(', ') ||
  '-';
const portalLabel = (item: any) =>
  !item.user_id ? 'No account' : item.user?.status === 'active' ? 'Active' : 'Disabled';
const portalBadgeClass = (item: any) => [
  'inline-flex rounded-full px-2 py-1 text-xs font-medium',
  !item.user_id
    ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
    : item.user?.status === 'active'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
];

const branchParams = () => {
  return {
    ...(selectedSchoolId.value ? { school_id: selectedSchoolId.value } : {}),
    ...(selectedBranchId.value ? { branch_id: selectedBranchId.value } : {})
  };
};

const load = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response: any = await Parents.getAll(branchParams());
    items.value = extractList(response, ['parents']);
  } catch (error: any) {
    errorMessage.value = apiErrorMessage(error);
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  form.value = {
    guardian_name: '',
    guardian_phone: '',
    guardian_relation: 'Guardian',
    guardian_email: ''
  };
  showForm.value = true;
};

const save = async () => {
  try {
    await Parents.create({ ...form.value, ...branchParams() });
    showForm.value = false;
    await load();
    showToast('Parent saved', 'success');
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  }
};

const createLogin = async (item: any) => {
  try {
    const email =
      item.guardian_email ||
      item.father_email ||
      item.mother_email ||
      window.prompt('Login email for parent');
    if (!email) return;
    const password =
      window.prompt('Password for parent login (blank = auto-generate)') || undefined;
    const res: any = await DynamicEntities.createParentLogin(item.id, { email, password });
    showToast(`Login created: ${res.data?.email} / ${res.data?.password}`, 'success');
    await load();
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  }
};

const toggleLogin = async (item: any) => {
  try {
    const enabled = item.user?.status !== 'active';
    await DynamicEntities.setParentAuthentication(item.id, enabled);
    showToast(enabled ? 'Login enabled' : 'Login disabled', 'success');
    await load();
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  }
};

watch(selectedBranchId, () => {
  load();
});

watch(currentSchool, () => {
  load();
});

onMounted(async () => {
  await load();
});
</script>
