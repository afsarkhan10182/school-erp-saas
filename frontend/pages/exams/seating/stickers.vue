<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-6xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Seat stickers</h1>
      <select v-model="selectedId" class="border rounded-md px-3 py-2 mb-6 dark:bg-gray-900 dark:border-gray-600" @change="loadStickers">
        <option value="">Select seating plan</option>
        <option v-for="row in rows" :key="row.id" :value="row.id">{{ row.exam?.name || row.exam_id }} · {{ row.hall?.name || row.exam_hall_id }}</option>
      </select>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div v-for="(s, i) in stickers" :key="i" class="bg-white dark:bg-gray-800 border rounded p-3 text-xs text-center">
          <div class="font-medium">{{ s.name }}</div>
          <div>{{ s.admission_number }}</div>
          <div class="text-gray-500">{{ s.hall }} · B{{ s.bench }}-S{{ s.seat }}</div>
        </div>
      </div>
      <p v-if="selectedId && !stickers.length" class="text-sm text-gray-500">No stickers found.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { ExamSeatings } from '~/api/academic/cards-exams-reports';
import { useSchoolBranchScope } from '~/composables/useSchoolBranchScope';

const rows = ref<any[]>([]);
const selectedId = ref('');
const stickers = ref<any[]>([]);
const { branchOptions, selectedBranchId, scopeParams, loadScope } = useSchoolBranchScope();

watch(selectedBranchId, () => {
  loadRows();
});
const loadRows = async () => {
  selectedId.value = '';
  stickers.value = [];
  const res: any = await ExamSeatings.list(scopeParams.value);
  rows.value = res.data?.seatings || [];
};
const loadStickers = async () => {
  stickers.value = [];
  if (!selectedId.value) return;
  const res: any = await ExamSeatings.overview(selectedId.value);
  stickers.value = res.data?.stickers || [];
};

onMounted(async () => {
  await loadScope();
  await loadRows();
});
</script>
