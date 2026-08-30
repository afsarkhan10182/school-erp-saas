<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Due Invoices</h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Unpaid and overdue student invoices.</p>
      </div>

      <section v-if="branchOptions.length > 1" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 max-w-md">
        <EnhancedDropdown v-model="selectedBranchId" :options="branchOptions" label="Branch" placeholder="Select branch" @change="load" />
      </section>

      <div v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ errorMessage }}
        <button class="ml-3 underline" @click="load">Retry</button>
      </div>

      <section class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg overflow-x-auto">
        <div v-if="loading" class="p-6 text-sm text-gray-500 dark:text-gray-400">Loading due invoices...</div>
        <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700/60">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Invoice</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Student</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Status</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Balance</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="item in items" :key="item.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/40">
              <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{{ item.invoice_number || item.id }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ item.student?.first_name }} {{ item.student?.last_name }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 capitalize">{{ item.status || item.payment_status }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ item.balance_amount }}</td>
              <td class="px-4 py-3 text-sm text-right">
                <NuxtLink to="/fees/invoices" class="text-sm font-medium text-indigo-600 hover:text-indigo-700">Open invoices</NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!items.length && !loading && !errorMessage" class="p-6 text-sm text-gray-500 dark:text-gray-400">No due invoices for this scope.</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { Branches } from '~/api/administration/branches';
import { Invoices } from '~/api/students/invoices';
import { useAuth } from '~/composables/useAuth';
import { extractList, apiErrorMessage } from '~/utils/list-response';

const { user } = useAuth();
const items = ref<any[]>([]);
const branchOptions = ref<any[]>([]);
const selectedBranchId = ref('');
const loading = ref(false);
const errorMessage = ref('');

const branchParams = () => selectedBranchId.value ? { branch_id: selectedBranchId.value } : {};

const loadBranches = async () => {
  const response: any = await Branches.getForDropdown({ status: 'active' });
  const branches = extractList(response, ['branches']);
  branchOptions.value = branches.map((b: any) => ({ value: b.id, label: b.name || b.code || b.id }));
  selectedBranchId.value = user.value?.branch_id || (branchOptions.value.length === 1 ? branchOptions.value[0].value : '');
};

const load = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const params = { limit: 100, ...branchParams() };
    const overdue: any = await Invoices.getAll({ ...params, status: 'overdue' });
    const unpaid: any = await Invoices.getAll({ ...params, status: 'sent' });
    const a = extractList(overdue, ['invoices', 'ungrouped_invoices']);
    const b = extractList(unpaid, ['invoices', 'ungrouped_invoices']);
    items.value = [...a, ...b.filter((x: any) => !a.find((y: any) => y.id === x.id))];
  } catch (error: any) {
    errorMessage.value = apiErrorMessage(error);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await loadBranches();
  await load();
});
</script>
