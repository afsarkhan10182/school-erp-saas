<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-5xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Online Exams</h1>
          <p v-if="isParent" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Published assessments for your children. Students must sign in to take an exam.
          </p>
        </div>
        <NuxtLink
          to="/portal"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          &larr; Back to Portal
        </NuxtLink>
      </div>

      <p v-if="error && !active" class="mb-4 text-sm text-red-600">{{ error }}</p>
      <p v-if="message && !active" role="status" class="mb-4 text-sm text-green-700">
        {{ message }}
      </p>

      <section v-if="isParent" class="mb-6 rounded-md border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="font-semibold text-gray-900 dark:text-white">Exam progress</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400">Submitted results for one linked child at a time.</p>
          </div>
          <label v-if="parentChildren.length > 1" class="text-sm text-gray-600 dark:text-gray-300">
            Child
            <select v-model="selectedChildId" class="ml-2 rounded border border-gray-300 bg-white px-2 py-1 dark:border-gray-600 dark:bg-gray-900" @change="loadParentProgress(selectedChildId)">
              <option v-for="child in parentChildren" :key="child.id" :value="child.id">
                {{ [child.first_name, child.last_name].filter(Boolean).join(' ') }}
              </option>
            </select>
          </label>
        </div>
        <p v-if="progressError" class="mt-3 text-sm text-red-600" role="alert">{{ progressError }}</p>
        <p v-else-if="progressLoading" class="mt-3 text-sm text-gray-500" role="status">Loading progress…</p>
        <p v-else-if="!progress.length" class="mt-3 text-sm text-gray-500">No exam attempts recorded for this child yet.</p>
        <ul v-else class="mt-3 divide-y divide-gray-100 dark:divide-gray-700">
          <li v-for="attempt in progress" :key="attempt.id" class="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
            <span class="font-medium text-gray-800 dark:text-gray-100">{{ attempt.exam.title }}</span>
            <span v-if="attempt.status === 'submitted' && attempt.score !== null" class="text-gray-600 dark:text-gray-300">
              {{ attempt.score }} / {{ attempt.exam.total_marks }} · {{ attempt.passed === null ? 'Submitted' : attempt.passed ? 'Passed' : 'Needs improvement' }}
              <span v-if="attempt.submitted_at" class="text-xs text-gray-500"> · {{ formatDate(attempt.submitted_at) }}</span>
            </span>
            <span v-else-if="attempt.status === 'submitted'" class="text-gray-500">Submitted · score unavailable</span>
            <span v-else class="text-gray-500">{{ attempt.status === 'in_progress' ? 'In progress' : 'Expired' }}</span>
          </li>
        </ul>
      </section>

      <div v-if="!active" class="mb-3 flex flex-col gap-3 rounded-md bg-white p-3 shadow sm:flex-row sm:items-center dark:bg-gray-800">
        <input
          v-model.trim="listFilters.search"
          type="search"
          aria-label="Search online exams"
          placeholder="Search exams"
          class="min-w-0 flex-1 rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
        />
        <select v-model="listFilters.window" aria-label="Filter by exam schedule" class="rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900">
          <option value="any">Any schedule</option>
          <option value="upcoming">Upcoming</option>
          <option value="open">Open now</option>
          <option value="closed">Closed</option>
        </select>
        <select v-model="listFilters.sort" aria-label="Sort online exams" class="rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900">
          <option value="start_asc">Start time: oldest</option>
          <option value="start_desc">Start time: newest</option>
          <option value="title">Title</option>
        </select>
        <div class="flex gap-1" role="group" aria-label="Online exam view">
          <button type="button" class="rounded border px-3 py-2 text-sm" :class="viewMode === 'list' ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300'" :aria-pressed="viewMode === 'list'" @click="viewMode = 'list'">List</button>
          <button type="button" class="rounded border px-3 py-2 text-sm" :class="viewMode === 'grid' ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300'" :aria-pressed="viewMode === 'grid'" @click="viewMode = 'grid'">Grid</button>
        </div>
      </div>

      <div v-if="!active && viewMode === 'list'" class="bg-white dark:bg-gray-800 rounded-md shadow overflow-x-auto">
        <table class="min-w-full divide-y">
          <thead>
            <tr>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Exam</th>
              <th class="hidden px-4 py-3 text-left text-xs uppercase text-gray-500 sm:table-cell">Class</th>
              <th class="hidden px-4 py-3 text-left text-xs uppercase text-gray-500 sm:table-cell">Duration</th>
              <th class="hidden px-4 py-3 text-left text-xs uppercase text-gray-500 sm:table-cell">Schedule</th>
              <th class="px-4 py-3 text-right text-xs uppercase text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="exam in pagedExams" :key="exam.id" class="border-t">
              <td class="px-3 py-3 text-sm sm:px-4">
                <span class="font-medium">{{ exam.title }}</span>
                <span class="mt-1 block text-xs text-gray-500 sm:hidden">
                  {{ exam.class?.name || 'All classes' }} · {{ exam.duration_minutes }} min · {{ scheduleFor(exam).label }}
                </span>
              </td>
              <td class="hidden px-4 py-3 text-sm sm:table-cell">{{ exam.class?.name || 'All classes' }}</td>
              <td class="hidden px-4 py-3 text-sm sm:table-cell">{{ exam.duration_minutes }} min</td>
              <td class="hidden px-4 py-3 text-sm sm:table-cell">{{ scheduleFor(exam).label }}</td>
              <td class="px-3 py-3 text-right text-sm sm:px-4">
                <span v-if="exam.attempt_status === 'submitted'" class="text-xs text-green-700">Submitted</span>
                <span v-else-if="exam.attempt_status === 'expired'" class="text-xs text-gray-500">Expired</span>
                <button
                  v-else-if="!isParent"
                  class="text-indigo-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                  :disabled="scheduleFor(exam).state !== 'open'"
                  @click="start(exam.id)"
                >{{ exam.attempt_status === 'in_progress' ? 'Resume' : 'Start' }}</button>
                <span v-else-if="isParent" class="text-xs text-gray-500">Student login required</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!filteredExams.length" class="p-6 text-sm text-gray-500">
          {{ exams.length ? 'No exams match your search or schedule filter.' : 'No online exams available.' }}
        </p>
      </div>

      <div v-else-if="!active" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <article v-for="exam in pagedExams" :key="exam.id" class="rounded-md border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 class="font-semibold text-gray-900 dark:text-white">{{ exam.title }}</h2>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">{{ exam.class?.name || 'All classes' }} · {{ exam.duration_minutes }} min</p>
          <p class="mt-1 text-xs text-gray-500">{{ scheduleFor(exam).label }}</p>
          <div class="mt-4 text-right">
            <span v-if="exam.attempt_status === 'submitted'" class="text-xs text-green-700">Submitted</span>
            <span v-else-if="exam.attempt_status === 'expired'" class="text-xs text-gray-500">Expired</span>
            <button v-else-if="!isParent" class="text-sm text-indigo-600 disabled:text-gray-400" :disabled="scheduleFor(exam).state !== 'open'" @click="start(exam.id)">
              {{ exam.attempt_status === 'in_progress' ? 'Resume' : 'Start' }}
            </button>
            <span v-else class="text-xs text-gray-500">Student login required</span>
          </div>
        </article>
        <p v-if="!filteredExams.length" class="rounded-md bg-white p-6 text-sm text-gray-500 shadow dark:bg-gray-800">
          {{ exams.length ? 'No exams match your search or schedule filter.' : 'No online exams available.' }}
        </p>
      </div>
      <Pagination
        v-if="!active && filteredExams.length"
        :pagination="{ page: currentPage, limit: pageSize, total: filteredExams.length }"
        item-label="exams"
        @page-changed="currentPage = $event"
        @page-size-changed="changePageSize"
      />

      <div v-if="active" class="bg-white dark:bg-gray-800 rounded-md shadow p-4 space-y-4">
        <div class="flex justify-between gap-4">
          <h2 class="text-xl font-semibold">{{ active.title }}</h2>
          <span class="text-sm font-medium text-red-600">{{ minutesLeft }} min left</span>
        </div>
        <div v-for="q in active.questions || []" :key="q.id" class="border rounded p-3">
          <div class="text-sm font-medium mb-2">{{ q.question_text }}</div>
          <label
            v-for="(opt, i) in q.options_json"
            :key="i"
            class="flex items-center gap-2 text-sm mb-1"
          >
            <input v-model.number="answers[q.id]" type="radio" :value="i" :disabled="isSubmitting" @change="saveDraft" />
            {{ opt }}
          </label>
        </div>
        <div class="flex items-center gap-3">
          <button class="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm disabled:opacity-50" :disabled="isSubmitting" @click="submit">
            {{ isSubmitting ? 'Submitting…' : 'Submit' }}
          </button>
          <span v-if="draftStatus" class="text-xs text-gray-500" role="status">{{ draftStatus }}</span>
        </div>
        <p v-if="message" class="text-sm text-green-700">{{ message }}</p>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { OnlineExams } from '~/api/academic/cards-exams-reports';
import { Portal } from '~/api/shared/dynamic-entities';
import Pagination from '~/components/ui/Pagination.vue';
import { filterOnlineExams, paginateOnlineExams } from '~/utils/filterOnlineExams.js';
import { apiErrorMessage } from '~/utils/list-response';
import { formatDate } from '~/utils/formatters';
import { useAuth } from '~/composables/useAuth';

const exams = ref<any[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);
const viewMode = ref<'list' | 'grid'>('list');
const listFilters = reactive({ search: '', window: 'any', sort: 'start_asc' });
const active = ref<any>(null);
const endsAt = ref(0);
const now = ref(Date.now());
const answers = reactive<Record<string, number>>({});
const error = ref('');
const message = ref('');
const draftStatus = ref('');
const isSubmitting = ref(false);
const { user } = useAuth();
const isParent = computed(() => user.value?.role === 'parent');
const parentChildren = ref<any[]>([]);
const selectedChildId = ref('');
const progress = ref<any[]>([]);
const progressError = ref('');
const progressLoading = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;
let pendingSave: Promise<void> = Promise.resolve();
let draftRevision = 0;
let progressRequest = 0;

const minutesLeft = computed(() => Math.max(0, Math.ceil((endsAt.value - now.value) / 60000)));
const filteredExams = computed(() => filterOnlineExams(exams.value, listFilters, new Date(now.value)));
const pagedExams = computed(() => paginateOnlineExams(filteredExams.value, currentPage.value, pageSize.value));

watch(listFilters, () => {
  currentPage.value = 1;
});

const changePageSize = (limit: number) => {
  pageSize.value = Number(limit) || 10;
  currentPage.value = 1;
};

const scheduleFor = (exam: any) => {
  if (exam.start_at && Date.parse(exam.start_at) > now.value) {
    return { state: 'upcoming', label: `Opens ${formatDate(exam.start_at, 'time')}` };
  }
  if (exam.end_at && Date.parse(exam.end_at) < now.value) return { state: 'closed', label: 'Closed' };
  return { state: 'open', label: 'Open now' };
};

const load = async () => {
  const res: any = await OnlineExams.available();
  exams.value = res.data?.exams || [];
  currentPage.value = 1;
};

const loadParentProgress = async (studentId: string) => {
  const requestId = ++progressRequest;
  progressLoading.value = true;
  progress.value = [];
  progressError.value = '';
  try {
    const response: any = await OnlineExams.parentProgress(studentId);
    if (requestId === progressRequest) progress.value = response.data?.attempts || [];
  } catch (e) {
    if (requestId === progressRequest) progressError.value = apiErrorMessage(e);
  } finally {
    if (requestId === progressRequest) progressLoading.value = false;
  }
};

const start = async (id: string) => {
  error.value = '';
  message.value = '';
  draftRevision += 1;
  draftStatus.value = '';
  try {
    const res: any = await OnlineExams.take(id);
    active.value = res.data?.exam;
    endsAt.value = Date.now() + Number(res.data?.remaining_seconds || 0) * 1000;
    Object.keys(answers).forEach(key => delete answers[key]);
    Object.assign(answers, res.data?.answers_json || {});
    draftStatus.value = '';
  } catch (e) {
    error.value = apiErrorMessage(e);
  }
};

const saveDraft = () => {
  if (!active.value) return;
  error.value = '';
  const revision = ++draftRevision;
  const examId = active.value.id;
  const snapshot = { ...answers };
  draftStatus.value = 'Saving answers…';
  pendingSave = pendingSave
    .catch(() => undefined)
    .then(() => OnlineExams.saveAnswers(examId, { answers_json: snapshot }))
    .then(() => {
      if (revision === draftRevision) draftStatus.value = 'Answers saved';
    })
    .catch(e => {
      if (revision === draftRevision) {
        draftStatus.value = 'Save failed';
        error.value = apiErrorMessage(e);
      }
    });
};

const submit = async () => {
  if (!active.value || isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    await pendingSave;
    const res: any = await OnlineExams.submit(active.value.id, { answers_json: { ...answers } });
    message.value = `Submitted. Score: ${res.data?.score} / ${res.data?.total_marks}`;
    active.value = null;
    await load();
  } catch (e) {
    error.value = apiErrorMessage(e);
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(async () => {
  await load();
  if (isParent.value) {
    try {
      const response: any = await Portal.dashboard();
      parentChildren.value = response.data?.students || [];
      selectedChildId.value = response.data?.activeStudentId || parentChildren.value[0]?.id || '';
      if (selectedChildId.value) await loadParentProgress(selectedChildId.value);
      else progress.value = [];
    } catch (e) {
      progressError.value = apiErrorMessage(e);
    }
  }
  timer = setInterval(() => {
    now.value = Date.now();
  }, 1000);
});
onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>
