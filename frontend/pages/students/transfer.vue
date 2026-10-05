<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Branch transfer</h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Move selected students to another branch of this school.
        </p>
      </div>
      <div class="text-sm text-gray-600 dark:text-gray-400">
        <span class="font-bold text-gray-900 dark:text-white">{{ selected.length }}</span>
        selected
      </div>
    </div>

    <div class="card grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
      <EnhancedDropdown
        v-model="toBranch"
        :options="branchOptions"
        label="Destination branch"
        placeholder="Select branch"
      />
      <p v-if="!branchOptions.length" class="text-sm text-gray-500 md:col-span-2">
        Add another branch before transferring students.
      </p>
      <div>
        <button
          class="btn-primary w-full h-[46px] flex items-center justify-center disabled:opacity-50"
          :disabled="!toBranch || !selected.length || saving"
          @click="transfer"
        >
          {{ saving ? 'Transferring…' : 'Transfer selected' }}
        </button>
      </div>
    </div>

    <div class="table-container">
      <p v-if="loading" class="p-6 text-sm text-gray-500">Loading students…</p>
      <table v-else class="table">
        <thead>
          <tr>
            <th class="w-12 px-4 py-3.5"></th>
            <th>Name</th>
            <th>Admission</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700/60">
          <tr
            v-for="s in students"
            :key="s.id"
            class="table-row-hover"
          >
            <td class="px-4 py-3"><input v-model="selected" type="checkbox" :value="s.id" class="rounded text-indigo-600 focus:ring-indigo-500" /></td>
            <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{{ s.first_name }} {{ s.last_name }}</td>
            <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{{ s.admission_number }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!loading && !students.length" class="p-6 text-sm text-gray-500 text-center">
        No students found.
      </p>
    </div>
    <ConfirmDialog
      :show="showTransferConfirm"
      title="Transfer students?"
      :message="`Transfer ${selected.length} selected students to the destination branch?`"
      confirm-label="Transfer"
      @close="showTransferConfirm = false"
      @confirm="confirmTransfer"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue';
import { Students } from '~/api/students';
import { DynamicEntities } from '~/api/shared/dynamic-entities';
import { useToast } from '~/composables/useToast';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { extractList, apiErrorMessage } from '~/utils/list-response';

const { showToast } = useToast();
const { selectedBranchId, availableBranches } = useGlobalBranch();
const students = ref<any[]>([]);
const selected = ref<string[]>([]);
const toBranch = ref('');
const loading = ref(false);
const saving = ref(false);
const showTransferConfirm = ref(false);

const branchOptions = computed(() =>
  (availableBranches.value || [])
    .filter((b: any) => b.id !== selectedBranchId.value)
    .map((b: any) => ({ label: b.name, value: b.id }))
);

const loadStudents = async () => {
  loading.value = true;
  try {
    const res: any = await Students.getAll({
      limit: 200,
      branch_id: selectedBranchId.value || undefined
    });
    students.value = extractList(res, ['students']);
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  } finally {
    loading.value = false;
  }
};

watch(selectedBranchId, () => {
  toBranch.value = '';
  selected.value = [];
  loadStudents();
});

onMounted(async () => {
  await loadStudents();
});

const transfer = async () => {
  if (!toBranch.value || !selected.value.length) {
    showToast('Select branch and students', 'error');
    return;
  }
  showTransferConfirm.value = true;
};

const confirmTransfer = async () => {
  showTransferConfirm.value = false;
  if (!toBranch.value || !selected.value.length) return;
  saving.value = true;
  try {
    const transferredIds = [...selected.value];
    await DynamicEntities.transferStudents({
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
