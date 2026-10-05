<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-6xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Seating overview</h1>
      <div class="bg-white dark:bg-gray-800 shadow rounded-md overflow-x-auto">
        <table class="min-w-full divide-y">
          <thead>
            <tr>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Exam</th>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Hall</th>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Slot</th>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Class</th>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Benches</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id" class="border-t">
              <td class="px-4 py-3 text-sm">{{ row.exam?.name || row.exam_id }}</td>
              <td class="px-4 py-3 text-sm">{{ row.hall?.name || row.exam_hall_id }}</td>
              <td class="px-4 py-3 text-sm">{{ slot(row) }}</td>
              <td class="px-4 py-3 text-sm">{{ row.class?.name || '—' }}</td>
              <td class="px-4 py-3 text-sm">{{ benches(row.plan_json).length }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="!rows.length" class="p-6 text-sm text-gray-500">No saved seating plans.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { ExamSeatings } from '~/api/academic/cards-exams-reports';
import { useGlobalBranch } from '~/composables/useGlobalBranch';

const rows = ref<any[]>([]);
const { selectedBranchId, branchScopeParams: scopeParams } = useGlobalBranch();

watch(selectedBranchId, () => {
  load();
});
const benches = (planJson: any) => (Array.isArray(planJson) ? planJson : planJson?.benches || []);
const slot = (row: any) =>
  row.plan_json?.schedule
    ? [
        row.plan_json.schedule.exam_date,
        row.plan_json.schedule.start_time,
        row.plan_json.schedule.end_time
      ]
        .filter(Boolean)
        .join(' · ')
    : '—';
const load = async () => {
  const res: any = await ExamSeatings.list(scopeParams.value);
  rows.value = res.data?.seatings || [];
};

onMounted(async () => {
  await load();
});
</script>
