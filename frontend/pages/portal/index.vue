<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-5xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">My portal</h1>
      <p class="text-sm text-gray-500 mb-6">Homework, fees and linked records for this login.</p>

      <div
        v-if="errorMessage"
        class="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {{ errorMessage }}
        <button class="ml-3 underline" @click="load">Retry</button>
      </div>

      <div v-if="loading" class="text-sm text-gray-500">Loading…</div>

      <div v-else-if="data.kind === 'student'">
        <h2 class="text-lg font-semibold mb-2">
          {{ data.student?.first_name }} {{ data.student?.last_name }}
        </h2>
        <p class="text-sm mb-4">
          {{ data.student?.admission_number }} · {{ data.student?.current_class }}
        </p>
        <h3 class="font-medium mb-2">Homework</h3>
        <ul class="mb-6 text-sm space-y-1">
          <li v-for="h in data.homeworks || []" :key="h.id">
            {{ h.title }} — due {{ h.due_date }}
          </li>
          <li v-if="!(data.homeworks || []).length" class="text-gray-400">No homework</li>
        </ul>
        <h3 class="font-medium mb-2">Fee invoices</h3>
        <ul class="text-sm space-y-1">
          <li v-for="inv in data.invoices || []" :key="inv.id">
            {{ inv.invoice_number }} — {{ inv.status || inv.payment_status }}
          </li>
          <li v-if="!(data.invoices || []).length" class="text-gray-400">No invoices</li>
        </ul>
      </div>

      <div v-else-if="data.kind === 'parent'">
        <h2 class="text-lg font-semibold mb-4">Children</h2>
        <ul class="text-sm space-y-2">
          <li v-for="s in data.students || []" :key="s.id">
            {{ s.first_name }} {{ s.last_name }} ({{ s.admission_number }})
          </li>
          <li v-if="!(data.students || []).length" class="text-gray-400">No linked students</li>
        </ul>
      </div>

      <p v-else class="text-sm text-gray-500">{{ data.message || 'Staff users should use the main dashboard.' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Portal } from '~/api/shared/dynamic-entities';
import { apiErrorMessage } from '~/utils/list-response';

const data = ref<any>({});
const loading = ref(false);
const errorMessage = ref('');

const load = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const res: any = await Portal.dashboard();
    data.value = res.data || {};
  } catch (error: any) {
    errorMessage.value = apiErrorMessage(error);
  } finally {
    loading.value = false;
  }
};

onMounted(load);
</script>
