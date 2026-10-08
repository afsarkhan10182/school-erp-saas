<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p class="text-sm font-medium text-indigo-600 dark:text-indigo-400">School portal</p>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">{{ pageTitle }}</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Your school records, tasks, fees, and exams in one place.</p>
        </div>
        <NuxtLink
          to="/portal/online-exams"
          class="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Online exams
        </NuxtLink>
      </div>

      <div
        v-if="errorMessage"
        class="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {{ errorMessage }}
        <button class="ml-3 underline" @click="load">Retry</button>
      </div>

      <div v-if="loading" class="text-sm text-gray-500">Loading…</div>

      <div v-else-if="data.kind === 'student'" class="space-y-6">
        <section class="rounded-xl bg-white dark:bg-gray-800 p-5 shadow-sm">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ data.student?.first_name }} {{ data.student?.last_name }}
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ data.student?.admission_number || 'No admission number' }} · {{ data.student?.current_class || 'Class not assigned' }}
          </p>
        </section>
        <div class="grid gap-6 md:grid-cols-2">
          <section class="rounded-xl bg-white dark:bg-gray-800 p-5 shadow-sm">
            <h3 class="font-medium text-gray-900 dark:text-white mb-3">Homework</h3>
            <ul class="text-sm space-y-2">
          <li v-for="h in data.homeworks || []" :key="h.id">
            {{ h.title }} — due {{ h.due_date }}
          </li>
          <li v-if="!(data.homeworks || []).length" class="text-gray-400">No homework</li>
            </ul>
          </section>
          <section class="rounded-xl bg-white dark:bg-gray-800 p-5 shadow-sm">
            <h3 class="font-medium text-gray-900 dark:text-white mb-3">Fee invoices</h3>
            <ul class="text-sm space-y-2">
          <li v-for="inv in data.invoices || []" :key="inv.id">
            {{ inv.invoice_number }} — {{ inv.status || inv.payment_status }}
          </li>
          <li v-if="!(data.invoices || []).length" class="text-gray-400">No invoices</li>
            </ul>
          </section>
        </div>
      </div>

      <div v-else-if="data.kind === 'parent'">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Linked students</h2>
        <div v-if="(data.students || []).length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article v-for="s in data.students" :key="s.id" class="rounded-xl bg-white dark:bg-gray-800 p-5 shadow-sm">
            <h3 class="font-semibold text-gray-900 dark:text-white">{{ s.first_name }} {{ s.last_name }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">{{ s.admission_number || 'No admission number' }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ s.current_class || 'Class not assigned' }}</p>
          </article>
        </div>
        <p v-else class="text-sm text-gray-400">No linked students</p>
      </div>

      <p v-else class="text-sm text-gray-500">
        {{ data.message || 'Staff users should use the main dashboard.' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Portal } from '~/api/shared/dynamic-entities';
import { apiErrorMessage } from '~/utils/list-response';

const data = ref<any>({});
const loading = ref(false);
const errorMessage = ref('');
const pageTitle = computed(() => (data.value.kind === 'parent' ? 'Parent portal' : 'Student portal'));

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
