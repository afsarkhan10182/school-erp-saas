<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Branch transfer</h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Move selected students to another branch of this school.</p>
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400"><span class="font-medium text-gray-900 dark:text-white">{{ selected.length }}</span> selected</div>
      </div>
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <EnhancedDropdown
          v-model="toBranch"
          :options="branchOptions"
          label="Destination branch"
          placeholder="Select branch"
        />
        <p v-if="!branchOptions.length" class="text-sm text-gray-500 md:col-span-2">Add another branch before transferring students.</p>
        <div class="flex items-end">
          <button
            class="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm disabled:opacity-50"
            :disabled="!toBranch || !selected.length || saving"
            @click="transfer"
          >
            {{ saving ? 'Transferring…' : 'Transfer selected' }}
          </button>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg overflow-x-auto">
        <p v-if="loading" class="p-6 text-sm text-gray-500">Loading students…</p>
        <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700/60">
            <tr>
              <th class="px-4 py-3"></th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Name</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Admission</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="s in students" :key="s.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/40">
              <td class="px-4 py-3"><input v-model="selected" type="checkbox" :value="s.id" /></td>
              <td class="px-4 py-3 text-sm">{{ s.first_name }} {{ s.last_name }}</td>
              <td class="px-4 py-3 text-sm">{{ s.admission_number }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="!loading && !students.length" class="p-6 text-sm text-gray-500">No students found.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { Students } from '~/api/students';
import { SchoolOps } from '~/api/shared/school-ops';
import { useBranches } from '~/composables/useBranches';
import { useToast } from '~/composables/useToast';
import { useAuth } from '~/composables/useAuth';
import { extractList, apiErrorMessage } from '~/utils/list-response';

const { availableBranches, fetchBranchesForUser } = useBranches();
const { showToast } = useToast();
const { user } = useAuth();
const students = ref<any[]>([]);
const selected = ref<string[]>([]);
const toBranch = ref('');
const loading = ref(false);
const saving = ref(false);
const branchOptions = computed(() =>
  (availableBranches.value || [])
    .filter((b: any) => b.id !== user.value?.branch_id)
    .map((b: any) => ({ label: b.name, value: b.id }))
);

onMounted(async () => {
  loading.value = true;
  try {
    await fetchBranchesForUser();
    const res: any = await Students.getAll({ limit: 200, branch_id: user.value?.branch_id });
    students.value = extractList(res, ['students']);
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  } finally {
    loading.value = false;
  }
});

const transfer = async () => {
  if (!toBranch.value || !selected.value.length) {
    showToast('Select branch and students', 'error');
    return;
  }
  if (!window.confirm(`Transfer ${selected.value.length} selected students?`)) return;
  saving.value = true;
  try {
    const transferredIds = [...selected.value];
    await SchoolOps.transferStudents({
      student_ids: transferredIds,
      to_branch_id: toBranch.value
    });
    showToast('Transferred', 'success');
    students.value = students.value.filter(student => !transferredIds.includes(student.id));
    selected.value = [];
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  } finally {
    saving.value = false;
  }
};
</script>
