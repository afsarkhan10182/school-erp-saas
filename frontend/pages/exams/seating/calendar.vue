<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-6xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Seating calendar</h1>
      <div class="grid gap-3">
        <div
          v-for="row in rows"
          :key="row.id"
          class="bg-white dark:bg-gray-800 rounded-md shadow p-4"
        >
          <div class="text-sm text-gray-500">{{ slot(row).exam_date || 'No date' }}</div>
          <div class="font-semibold text-gray-900 dark:text-white">
            {{ row.exam?.name || row.exam_id }}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-300">
            {{ slot(row).start_time || '—' }} - {{ slot(row).end_time || '—' }} ·
            {{ row.hall?.name || row.exam_hall_id }}
          </div>
        </div>
        <p v-if="!rows.length" class="text-sm text-gray-500">No seating calendar entries.</p>
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
const slot = (row: any) => row.plan_json?.schedule || {};
const load = async () => {
  const res: any = await ExamSeatings.list(scopeParams.value);
  rows.value = (res.data?.seatings || []).sort((a: any, b: any) =>
    String(slot(a).exam_date || '').localeCompare(String(slot(b).exam_date || ''))
  );
};
onMounted(async () => {
  await load();
});
</script>
