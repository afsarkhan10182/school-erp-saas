<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-5xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Online exams</h1>

      <div v-if="!active" class="bg-white dark:bg-gray-800 rounded-md shadow overflow-x-auto">
        <table class="min-w-full divide-y">
          <thead>
            <tr>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Exam</th>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Class</th>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Duration</th>
              <th class="px-4 py-3 text-right text-xs uppercase text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="exam in exams" :key="exam.id" class="border-t">
              <td class="px-4 py-3 text-sm">{{ exam.title }}</td>
              <td class="px-4 py-3 text-sm">{{ exam.class?.name || 'All classes' }}</td>
              <td class="px-4 py-3 text-sm">{{ exam.duration_minutes }} min</td>
              <td class="px-4 py-3 text-sm text-right"><button class="text-indigo-600" @click="start(exam.id)">Start</button></td>
            </tr>
          </tbody>
        </table>
        <p v-if="!exams.length" class="p-6 text-sm text-gray-500">No online exams available.</p>
      </div>

      <div v-else class="bg-white dark:bg-gray-800 rounded-md shadow p-4 space-y-4">
        <div class="flex justify-between gap-4">
          <h2 class="text-xl font-semibold">{{ active.title }}</h2>
          <span class="text-sm font-medium text-red-600">{{ minutesLeft }} min left</span>
        </div>
        <div v-for="q in active.questions || []" :key="q.id" class="border rounded p-3">
          <div class="text-sm font-medium mb-2">{{ q.question_text }}</div>
          <label v-for="(opt, i) in q.options_json" :key="i" class="flex items-center gap-2 text-sm mb-1">
            <input v-model.number="answers[q.id]" type="radio" :value="i" />
            {{ opt }}
          </label>
        </div>
        <button class="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm" @click="submit">Submit</button>
        <p v-if="message" class="text-sm text-green-700">{{ message }}</p>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { OnlineExams } from '~/api/academic/cards-exams-reports';
import { apiErrorMessage } from '~/utils/list-response';

const exams = ref<any[]>([]);
const active = ref<any>(null);
const endsAt = ref(0);
const now = ref(Date.now());
const answers = reactive<Record<string, number>>({});
const error = ref('');
const message = ref('');
let timer: ReturnType<typeof setInterval> | null = null;

const minutesLeft = computed(() => Math.max(0, Math.ceil((endsAt.value - now.value) / 60000)));

const load = async () => {
  const res: any = await OnlineExams.available();
  exams.value = res.data?.exams || [];
};

const start = async (id: string) => {
  error.value = '';
  const res: any = await OnlineExams.take(id);
  active.value = res.data?.exam;
  endsAt.value = Date.now() + Number(active.value.duration_minutes || 60) * 60000;
  Object.keys(answers).forEach(key => delete answers[key]);
};

const submit = async () => {
  if (!active.value) return;
  try {
    const res: any = await OnlineExams.submit(active.value.id, { answers_json: { ...answers } });
    message.value = `Submitted. Score: ${res.data?.score} / ${res.data?.total_marks}`;
    active.value = null;
    await load();
  } catch (e) {
    error.value = apiErrorMessage(e);
  }
};

onMounted(async () => {
  await load();
  timer = setInterval(() => { now.value = Date.now(); }, 1000);
});
onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>
