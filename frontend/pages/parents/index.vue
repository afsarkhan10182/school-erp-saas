<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Parents</h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Guardian contacts and parent portal access.</p>
        </div>
        <button class="px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700" @click="openCreate">
          Add parent
        </button>
      </div>

      <section class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 max-w-md space-y-3">
        <EnhancedDropdown v-if="isSuperAdmin" v-model="selectedSchoolId" :options="schoolOptions" label="School" placeholder="Select school" @change="onSchoolChange" />
        <EnhancedDropdown v-if="branchOptions.length > 1 || isSuperAdmin" v-model="selectedBranchId" :options="branchOptions" label="Branch" placeholder="Select branch" @change="load" />
      </section>

      <div v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
        {{ errorMessage }}
        <button class="ml-3 underline" @click="load">Retry</button>
      </div>

      <section class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg overflow-x-auto">
        <div v-if="loading" class="p-6 text-sm text-gray-500 dark:text-gray-400">Loading parents...</div>
        <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700/60">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Guardian</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Contact</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Relation</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Students</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Portal</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="item in items" :key="item.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/40">
              <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{{ item.guardian_name }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                <div>{{ item.guardian_phone }}</div>
                <div class="text-xs text-gray-500">{{ item.guardian_email || item.father_email || item.mother_email || '-' }}</div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ item.guardian_relation }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ studentNames(item) }}</td>
              <td class="px-4 py-3 text-sm">
                <span :class="portalBadgeClass(item)">{{ portalLabel(item) }}</span>
              </td>
              <td class="px-4 py-3 text-sm text-right whitespace-nowrap">
                <button v-if="!item.user_id" class="mr-3 text-sm font-medium text-indigo-600 hover:text-indigo-700" @click="createLogin(item)">Create login</button>
                <button v-else class="text-sm font-medium text-indigo-600 hover:text-indigo-700" @click="toggleLogin(item)">
                  {{ item.user?.status === 'active' ? 'Disable' : 'Enable' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!loading && !items.length && !errorMessage" class="p-6 text-sm text-gray-500 dark:text-gray-400">No parents yet.</p>
      </section>

      <div v-if="showForm" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 w-full max-w-md shadow-xl">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add parent</h2>
          <input v-model="form.guardian_name" class="input" placeholder="Guardian name" />
          <input v-model="form.guardian_phone" class="input" placeholder="Phone" />
          <input v-model="form.guardian_email" type="email" class="input" placeholder="Email for portal login" />
          <input v-model="form.guardian_relation" class="input" placeholder="Relation" />
          <div class="flex justify-end gap-2 mt-4">
            <button class="px-3 py-2 text-sm text-gray-700 dark:text-gray-200" @click="showForm = false">Cancel</button>
            <button class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg" @click="save">Save</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { Branches } from '~/api/administration/branches';
import { Schools } from '~/api/administration/schools';
import { Parents } from '~/api/students/school-ops';
import { SchoolOps } from '~/api/shared/school-ops';
import { useAuth } from '~/composables/useAuth';
import { useToast } from '~/composables/useToast';
import { extractList, apiErrorMessage } from '~/utils/list-response';

const { showToast } = useToast();
const { user } = useAuth();
const isSuperAdmin = computed(() => user.value?.role === 'super_admin');
const items = ref<any[]>([]);
const schoolOptions = ref<any[]>([]);
const selectedSchoolId = ref('');
const branchOptions = ref<any[]>([]);
const selectedBranchId = ref('');
const showForm = ref(false);
const loading = ref(false);
const errorMessage = ref('');
const form = ref({ guardian_name: '', guardian_phone: '', guardian_relation: 'Guardian', guardian_email: '' });

const studentNames = (item: any) => (item.students || []).map((s: any) => `${s.first_name} ${s.last_name || ''}`.trim()).join(', ') || '-';
const portalLabel = (item: any) => !item.user_id ? 'No account' : item.user?.status === 'active' ? 'Active' : 'Disabled';
const portalBadgeClass = (item: any) => [
  'inline-flex rounded-full px-2 py-1 text-xs font-medium',
  !item.user_id ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200' : item.user?.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
];

const branchParams = () => ({
  ...(selectedSchoolId.value ? { school_id: selectedSchoolId.value } : {}),
  ...(selectedBranchId.value ? { branch_id: selectedBranchId.value } : {})
});

const loadSchools = async () => {
  if (!isSuperAdmin.value) return;
  const response: any = await Schools.getAll({ limit: 200, status: 'active' });
  schoolOptions.value = extractList(response, ['schools']).map((s: any) => ({ value: s.id, label: s.name }));
  selectedSchoolId.value = selectedSchoolId.value || schoolOptions.value[0]?.value || '';
};

const loadBranches = async () => {
  const response: any = await Branches.getForDropdown({ status: 'active', ...(selectedSchoolId.value ? { school_id: selectedSchoolId.value } : {}) });
  const branches = extractList(response, ['branches']);
  branchOptions.value = branches.map((b: any) => ({ value: b.id, label: b.name || b.code || b.id }));
  selectedBranchId.value = user.value?.branch_id || (branchOptions.value.length === 1 ? branchOptions.value[0].value : '');
};

const onSchoolChange = async () => {
  selectedBranchId.value = '';
  await loadBranches();
  await load();
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
  form.value = { guardian_name: '', guardian_phone: '', guardian_relation: 'Guardian', guardian_email: '' };
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
    const email = item.guardian_email || item.father_email || item.mother_email || window.prompt('Login email for parent');
    if (!email) return;
    const password = window.prompt('Password for parent login (blank = auto-generate)') || undefined;
    const res: any = await SchoolOps.createParentLogin(item.id, { email, password });
    showToast(`Login created: ${res.data?.email} / ${res.data?.password}`, 'success');
    await load();
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  }
};

const toggleLogin = async (item: any) => {
  try {
    const enabled = item.user?.status !== 'active';
    await SchoolOps.setParentAuthentication(item.id, enabled);
    showToast(enabled ? 'Login enabled' : 'Login disabled', 'success');
    await load();
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  }
};

onMounted(async () => {
  await loadSchools();
  await loadBranches();
  await load();
});
</script>

<style scoped>
.input {
  @apply w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 mb-3 dark:bg-gray-900 dark:text-white;
}
</style>
