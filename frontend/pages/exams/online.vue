<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-6xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Online exams</h1>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Create exam, add MCQ questions, publish, preview, and review results.
      </p>

      <form
        class="bg-white dark:bg-gray-800 rounded-md shadow p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3"
        @submit.prevent="createExam"
      >
        <input
          v-model="form.title"
          required
          placeholder="Exam title"
          class="border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-600"
        />
        <EnhancedDropdown
          v-model="form.class_id"
          :options="classOptions"
          placeholder="Class (optional)"
        />
        <input
          v-model.number="form.duration_minutes"
          type="number"
          min="5"
          placeholder="Duration (min)"
          class="border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-600"
        />
        <input
          v-model.number="form.pass_marks"
          type="number"
          min="0"
          placeholder="Pass marks"
          class="border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-600"
        />
        <label class="text-xs text-gray-500 dark:text-gray-300">
          Start at
          <input
            v-model="form.start_at"
            type="datetime-local"
            class="mt-1 w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-600"
          />
        </label>
        <label class="text-xs text-gray-500 dark:text-gray-300">
          End at
          <input
            v-model="form.end_at"
            type="datetime-local"
            class="mt-1 w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-600"
          />
        </label>
        <button
          type="submit"
          class="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm md:col-span-2"
        >
          Create online exam
        </button>
      </form>

      <p v-if="error" class="mb-4 text-sm text-red-600">{{ error }}</p>

      <div
        class="mb-3 grid grid-cols-1 gap-2 rounded-md bg-white p-3 shadow sm:grid-cols-2 lg:grid-cols-5 dark:bg-gray-800"
      >
        <input
          v-model.trim="listFilters.search"
          type="search"
          aria-label="Search online exams"
          placeholder="Search exam title"
          class="min-w-0 rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
        />
        <select
          v-model="listFilters.class_id"
          aria-label="Filter by class"
          class="rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
        >
          <option value="">All classes</option>
          <option v-for="item in classes" :key="item.id" :value="item.id">
            {{ item.name }}
          </option>
        </select>
        <select
          v-model="listFilters.status"
          aria-label="Filter by status"
          class="rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        <select
          v-model="listFilters.window"
          aria-label="Filter by exam window"
          class="rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
        >
          <option value="any">Any time</option>
          <option value="upcoming">Upcoming</option>
          <option value="open">Open now</option>
          <option value="closed">Closed</option>
        </select>
        <select
          v-model="listFilters.sort"
          aria-label="Sort online exams"
          class="rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
        >
          <option value="start_desc">Start time: newest</option>
          <option value="start_asc">Start time: oldest</option>
          <option value="title">Title</option>
        </select>
        <p class="text-xs text-gray-500 sm:col-span-2 lg:col-span-5" aria-live="polite">
          Showing {{ pagedExams.length }} of {{ filteredExams.length }} matching exams
        </p>
      </div>

      <div class="bg-white dark:bg-gray-800 shadow rounded-md overflow-x-auto mb-8">
        <table class="min-w-full divide-y">
          <thead>
            <tr>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Title</th>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Class</th>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Qs</th>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Marks</th>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Status</th>
              <th class="px-4 py-3 text-right text-xs uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in pagedExams" :key="e.id" class="border-t">
              <td class="px-4 py-3 text-sm">{{ e.title }}</td>
              <td class="px-4 py-3 text-sm">{{ e.class?.name || '—' }}</td>
              <td class="px-4 py-3 text-sm">{{ e.question_count }}</td>
              <td class="px-4 py-3 text-sm">{{ e.total_marks }}</td>
              <td class="px-4 py-3 text-sm">{{ e.status }}</td>
              <td class="px-4 py-3 text-sm text-right space-x-2">
                <button class="text-indigo-600" @click="openExam(e.id)">Manage</button>
                <button v-if="e.status !== 'published'" class="text-green-700" @click="publish(e)">
                  Publish
                </button>
                <button class="text-red-600" @click="removeExam(e.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!filteredExams.length" class="p-6 text-sm text-gray-500">
          {{ exams.length ? 'No exams match these filters.' : 'No online exams yet.' }}
        </p>
      </div>
      <Pagination
        :pagination="{ page: currentPage, limit: pageSize, total: filteredExams.length }"
        item-label="exams"
        @page-changed="currentPage = $event"
        @page-size-changed="changeExamPageSize"
      />

      <div v-if="active" class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <h2 class="text-xl font-semibold">{{ active.title }}</h2>
          <div class="flex gap-2">
            <button class="px-3 py-1.5 text-sm border rounded-md" @click="loadResults">
              Results
            </button>
            <button
              v-if="active.status === 'published'"
              class="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md"
              @click="startTake"
            >
              Take (preview)
            </button>
          </div>
        </div>

        <form
          class="bg-white dark:bg-gray-800 rounded-md shadow p-4 space-y-3"
          @submit.prevent="addQuestion"
        >
          <h3 class="font-medium">Add question</h3>
          <div class="flex flex-wrap gap-2">
            <EnhancedDropdown
              v-model="questionBankId"
              :options="questionBankOptions"
              placeholder="Import from question bank"
            />
            <button
              type="button"
              class="px-3 py-2 border rounded-md text-sm"
              :disabled="!questionBankId"
              @click="importQuestion"
            >
              Import
            </button>
          </div>
          <textarea
            v-model="qForm.question_text"
            required
            rows="2"
            placeholder="Question text"
            class="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-600"
          />
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input
              v-for="(opt, i) in qForm.options"
              :key="i"
              v-model="qForm.options[i]"
              :placeholder="`Option ${i + 1}`"
              class="border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-600"
              required
            />
          </div>
          <div class="flex flex-wrap gap-3 items-center">
            <label class="text-sm">Correct option</label>
            <EnhancedDropdown
              v-model="qForm.correct_option"
              :options="correctOptionOptions"
              placeholder="Correct option"
              class="w-32"
            />
            <input
              v-model.number="qForm.marks"
              type="number"
              min="1"
              class="w-20 border rounded-md px-2 py-1 dark:bg-gray-900"
            />
            <label class="text-sm">
              Order
              <input
                v-model.number="qForm.sort_order"
                type="number"
                min="0"
                class="ml-2 w-24 border rounded-md px-2 py-1 dark:bg-gray-900"
              />
            </label>
            <button type="submit" class="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm">
              Add
            </button>
          </div>
        </form>

        <div class="bg-white dark:bg-gray-800 rounded-md shadow divide-y">
          <div
            v-for="q in active.questions || []"
            :key="q.id"
            class="p-4 flex justify-between gap-4"
          >
            <div>
              <div class="font-medium text-sm">{{ q.question_text }}</div>
              <div class="text-xs text-gray-500 mt-1">
                {{ (q.options_json || []).join(' · ') }} · marks {{ q.marks }} · correct #{{
                  Number(q.correct_option) + 1
                }}
              </div>
            </div>
            <button class="text-red-600 text-sm shrink-0" @click="deleteQuestion(q.id)">
              Delete
            </button>
          </div>
          <p v-if="!(active.questions || []).length" class="p-4 text-sm text-gray-500">
            No questions.
          </p>
        </div>

        <div v-if="takeMode" class="bg-white dark:bg-gray-800 rounded-md shadow p-4 space-y-4">
          <h3 class="font-medium">Take exam (staff preview)</h3>
          <p class="text-sm text-gray-500">Duration: {{ active.duration_minutes }} minutes</p>
          <EnhancedDropdown
            v-model="takeStudentId"
            :options="studentOptions"
            placeholder="Select student"
            class="w-full md:w-80"
          />
          <div v-for="q in paperQuestions" :key="q.id" class="border rounded p-3">
            <div class="text-sm font-medium mb-2">{{ q.question_text }}</div>
            <label
              v-for="(opt, i) in q.options_json"
              :key="i"
              class="flex items-center gap-2 text-sm mb-1"
            >
              <input v-model.number="answers[q.id]" type="radio" :value="i" />
              {{ opt }}
            </label>
          </div>
          <button
            class="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm disabled:opacity-50"
            :disabled="!takeStudentId"
            @click="submitTake"
          >
            Submit answers
          </button>
          <p v-if="submitResult" class="text-sm text-green-700">
            Score: {{ submitResult.score }} / {{ submitResult.total_marks }} ({{
              submitResult.passed ? 'Passed' : 'Failed'
            }})
          </p>
        </div>

        <div
          v-if="results.length"
          class="bg-white dark:bg-gray-800 rounded-md shadow overflow-x-auto"
        >
          <table class="min-w-full divide-y">
            <thead>
              <tr>
                <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">#</th>
                <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Student</th>
                <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Score</th>
                <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Passed</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in results" :key="r.student_id" class="border-t">
                <td class="px-4 py-3 text-sm">{{ r.position }}</td>
                <td class="px-4 py-3 text-sm">{{ r.student_name }}</td>
                <td class="px-4 py-3 text-sm">{{ r.score }}</td>
                <td class="px-4 py-3 text-sm">{{ r.passed ? 'Yes' : 'No' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        :show="Boolean(examToDelete)"
        title="Delete online exam"
        message="Delete this online exam? This cannot be undone."
        confirm-label="Delete exam"
        @close="examToDelete = ''"
        @confirm="confirmRemoveExam"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { OnlineExams } from '~/api/academic/cards-exams-reports';
import { Classes } from '~/api/academic/classes';
import { Students } from '~/api/students';
import { DynamicEntities } from '~/api/shared/dynamic-entities';
import { useAuth } from '~/composables/useAuth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { apiErrorMessage, extractList } from '~/utils/list-response';
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import Pagination from '~/components/ui/Pagination.vue';
import { filterOnlineExams, paginateOnlineExams } from '~/utils/filterOnlineExams.js';

const { user } = useAuth();
const { selectedBranchId } = useGlobalBranch();
const exams = ref<any[]>([]);
const classes = ref<any[]>([]);
const students = ref<any[]>([]);
const questionBank = ref<any[]>([]);
const active = ref<any>(null);
const error = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const listFilters = reactive({
  search: '',
  class_id: '',
  status: '',
  window: 'any',
  sort: 'start_desc'
});
const takeMode = ref(false);
const paperQuestions = ref<any[]>([]);
const answers = reactive<Record<string, number>>({});
const takeStudentId = ref('');
const questionBankId = ref('');
const submitResult = ref<any>(null);
const results = ref<any[]>([]);
const examToDelete = ref('');
const classOptions = computed(() => classes.value.map(item => ({ value: item.id, label: item.name })));
const questionBankOptions = computed(() =>
  questionBank.value.map(item => ({ value: item.id, label: item.title }))
);
const filteredExams = computed(() => filterOnlineExams(exams.value, listFilters, new Date()));
const pagedExams = computed(() =>
  paginateOnlineExams(filteredExams.value, currentPage.value, pageSize.value)
);
const studentOptions = computed(() =>
  students.value.map(item => ({
    value: item.id,
    label: `${item.first_name} ${item.last_name} (${item.admission_number})`
  }))
);
const correctOptionOptions = [
  { value: 0, label: '1' },
  { value: 1, label: '2' },
  { value: 2, label: '3' },
  { value: 3, label: '4' }
];

watch(selectedBranchId, async () => {
  currentPage.value = 1;
  form.class_id = '';
  active.value = null;
  await loadLookups();
  await loadList();
});

watch(listFilters, () => {
  currentPage.value = 1;
});

const changeExamPageSize = (limit: number) => {
  pageSize.value = Number(limit) || 10;
  currentPage.value = 1;
};

const form = reactive({
  title: '',
  class_id: '',
  duration_minutes: 60,
  pass_marks: 0,
  start_at: '',
  end_at: ''
});

const qForm = reactive({
  question_text: '',
  options: ['', '', '', ''],
  correct_option: 0,
  marks: 1,
  sort_order: 0
});

const branchParams = () => (selectedBranchId.value ? { branch_id: selectedBranchId.value } : {});

const loadLookups = async () => {
  const qs = new URLSearchParams();
  if (selectedBranchId.value) qs.set('branch_id', selectedBranchId.value);
  const [cRes, sRes]: any[] = await Promise.all([
    Classes.getDropdown(qs.toString()),
    Students.getAll({ limit: 200, ...branchParams() })
  ]);
  classes.value = extractList(cRes, ['classes', 'rows']);
  students.value = extractList(sRes, ['students', 'rows']);
  const qRes: any = await DynamicEntities.list('exam_question', branchParams());
  questionBank.value = extractList(qRes, ['records', 'rows']);
};

const loadList = async () => {
  const res: any = await OnlineExams.list(branchParams());
  exams.value = res.data?.exams || [];
  currentPage.value = 1;
};

const createExam = async () => {
  try {
    await OnlineExams.create({ ...form, ...branchParams() });
    form.title = '';
    form.start_at = '';
    form.end_at = '';
    await loadList();
  } catch (e) {
    error.value = apiErrorMessage(e);
  }
};

const openExam = async (id: string) => {
  takeMode.value = false;
  results.value = [];
  submitResult.value = null;
  const res: any = await OnlineExams.get(id, branchParams());
  active.value = res.data?.exam;
};

const publish = async (e: any) => {
  try {
    await OnlineExams.update(e.id, { status: 'published' }, branchParams());
    await loadList();
    if (active.value?.id === e.id) await openExam(e.id);
  } catch (err) {
    error.value = apiErrorMessage(err);
  }
};

const removeExam = async (id: string) => {
  examToDelete.value = id;
};

const confirmRemoveExam = async () => {
  const id = examToDelete.value;
  examToDelete.value = '';
  if (!id) return;
  try {
    await OnlineExams.remove(id, branchParams());
    if (active.value?.id === id) active.value = null;
    await loadList();
  } catch (e) {
    error.value = apiErrorMessage(e);
  }
};

const addQuestion = async () => {
  if (!active.value) return;
  try {
    await OnlineExams.addQuestion(active.value.id, {
      question_text: qForm.question_text,
      options_json: [...qForm.options],
      correct_option: qForm.correct_option,
      marks: qForm.marks,
      sort_order: qForm.sort_order
    }, branchParams());
    qForm.question_text = '';
    qForm.options = ['', '', '', ''];
    qForm.correct_option = 0;
    qForm.marks = 1;
    qForm.sort_order = 0;
    await openExam(active.value.id);
    await loadList();
  } catch (e) {
    error.value = apiErrorMessage(e);
  }
};

const importQuestion = async () => {
  const record = questionBank.value.find(q => q.id === questionBankId.value);
  if (!record || !active.value) return;
  const lines = String(record.notes || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
  await OnlineExams.addQuestion(active.value.id, {
    question_text: record.title,
    options_json:
      lines.length >= 2 ? lines.slice(0, 4) : ['Option A', 'Option B', 'Option C', 'Option D'],
    correct_option: 0,
    marks: 1,
    sort_order: (active.value.questions || []).length
  }, branchParams());
  questionBankId.value = '';
  await openExam(active.value.id);
  await loadList();
};

const deleteQuestion = async (qid: string) => {
  if (!active.value) return;
  try {
    await OnlineExams.deleteQuestion(active.value.id, qid, branchParams());
    await openExam(active.value.id);
    await loadList();
  } catch (e) {
    error.value = apiErrorMessage(e);
  }
};

const startTake = async () => {
  if (!active.value) return;
  try {
    const res: any = await OnlineExams.take(active.value.id, branchParams());
    paperQuestions.value = res.data?.exam?.questions || [];
    Object.keys(answers).forEach(k => delete answers[k]);
    takeMode.value = true;
    submitResult.value = null;
  } catch (e) {
    error.value = apiErrorMessage(e);
  }
};

const submitTake = async () => {
  if (!active.value || !takeStudentId.value) return;
  try {
    const res: any = await OnlineExams.submit(active.value.id, {
      student_id: takeStudentId.value,
      answers_json: { ...answers }
    }, branchParams());
    submitResult.value = res.data;
    await loadResults();
  } catch (e) {
    error.value = apiErrorMessage(e);
  }
};

const loadResults = async () => {
  if (!active.value) return;
  try {
    const res: any = await OnlineExams.results(active.value.id, branchParams());
    results.value = res.data?.results || [];
  } catch (e) {
    error.value = apiErrorMessage(e);
  }
};

onMounted(async () => {
  try {
    await loadLookups();
    await loadList();
  } catch (e) {
    error.value = apiErrorMessage(e);
  }
});
</script>
