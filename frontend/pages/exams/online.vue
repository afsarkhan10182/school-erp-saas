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
        <select v-if="branchOptions.length > 1" v-model="selectedBranchId" class="border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-600" @change="onBranchChange">
          <option value="">Branch</option>
          <option v-for="b in branchOptions" :key="b.value" :value="b.value">{{ b.label }}</option>
        </select>
        <input
          v-model="form.title"
          required
          placeholder="Exam title"
          class="border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-600"
        />
        <select v-model="form.class_id" class="border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-600">
          <option value="">Class (optional)</option>
          <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
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
        <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm md:col-span-2">
          Create online exam
        </button>
      </form>

      <p v-if="error" class="mb-4 text-sm text-red-600">{{ error }}</p>

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
            <tr v-for="e in exams" :key="e.id" class="border-t">
              <td class="px-4 py-3 text-sm">{{ e.title }}</td>
              <td class="px-4 py-3 text-sm">{{ e.class?.name || '—' }}</td>
              <td class="px-4 py-3 text-sm">{{ e.question_count }}</td>
              <td class="px-4 py-3 text-sm">{{ e.total_marks }}</td>
              <td class="px-4 py-3 text-sm">{{ e.status }}</td>
              <td class="px-4 py-3 text-sm text-right space-x-2">
                <button class="text-indigo-600" @click="openExam(e.id)">Manage</button>
                <button
                  v-if="e.status !== 'published'"
                  class="text-green-700"
                  @click="publish(e)"
                >
                  Publish
                </button>
                <button class="text-red-600" @click="removeExam(e.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!exams.length" class="p-6 text-sm text-gray-500">No online exams yet.</p>
      </div>

      <div v-if="active" class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <h2 class="text-xl font-semibold">{{ active.title }}</h2>
          <div class="flex gap-2">
            <button class="px-3 py-1.5 text-sm border rounded-md" @click="loadResults">Results</button>
            <button
              v-if="active.status === 'published'"
              class="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md"
              @click="startTake"
            >
              Take (preview)
            </button>
          </div>
        </div>

        <form class="bg-white dark:bg-gray-800 rounded-md shadow p-4 space-y-3" @submit.prevent="addQuestion">
          <h3 class="font-medium">Add question</h3>
          <div class="flex flex-wrap gap-2">
            <select v-model="questionBankId" class="border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-600">
              <option value="">Import from question bank</option>
              <option v-for="question in questionBank" :key="question.id" :value="question.id">{{ question.title }}</option>
            </select>
            <button type="button" class="px-3 py-2 border rounded-md text-sm" :disabled="!questionBankId" @click="importQuestion">
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
            <select v-model.number="qForm.correct_option" class="border rounded-md px-2 py-1 dark:bg-gray-900">
              <option :value="0">1</option>
              <option :value="1">2</option>
              <option :value="2">3</option>
              <option :value="3">4</option>
            </select>
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
          <div v-for="q in active.questions || []" :key="q.id" class="p-4 flex justify-between gap-4">
            <div>
              <div class="font-medium text-sm">{{ q.question_text }}</div>
              <div class="text-xs text-gray-500 mt-1">
                {{ (q.options_json || []).join(' · ') }} · marks {{ q.marks }} · correct #{{
                  Number(q.correct_option) + 1
                }}
              </div>
            </div>
            <button class="text-red-600 text-sm shrink-0" @click="deleteQuestion(q.id)">Delete</button>
          </div>
          <p v-if="!(active.questions || []).length" class="p-4 text-sm text-gray-500">No questions.</p>
        </div>

        <div v-if="takeMode" class="bg-white dark:bg-gray-800 rounded-md shadow p-4 space-y-4">
          <h3 class="font-medium">Take exam (staff preview)</h3>
          <p class="text-sm text-gray-500">Duration: {{ active.duration_minutes }} minutes</p>
          <select v-model="takeStudentId" class="border rounded-md px-3 py-2 dark:bg-gray-900 w-full md:w-80">
            <option value="">Select student</option>
            <option v-for="s in students" :key="s.id" :value="s.id">
              {{ s.first_name }} {{ s.last_name }} ({{ s.admission_number }})
            </option>
          </select>
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
            Score: {{ submitResult.score }} / {{ submitResult.total_marks }}
            ({{ submitResult.passed ? 'Passed' : 'Failed' }})
          </p>
        </div>

        <div v-if="results.length" class="bg-white dark:bg-gray-800 rounded-md shadow overflow-x-auto">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { OnlineExams } from '~/api/academic/cards-exams-reports';
import { Branches } from '~/api/administration/branches';
import { Classes } from '~/api/academic/classes';
import { Students } from '~/api/students';
import { SchoolOps } from '~/api/shared/school-ops';
import { useAuth } from '~/composables/useAuth';
import { apiErrorMessage, extractList } from '~/utils/list-response';

const { user } = useAuth();
const exams = ref<any[]>([]);
const classes = ref<any[]>([]);
const students = ref<any[]>([]);
const questionBank = ref<any[]>([]);
const branchOptions = ref<any[]>([]);
const selectedBranchId = ref('');
const active = ref<any>(null);
const error = ref('');
const takeMode = ref(false);
const paperQuestions = ref<any[]>([]);
const answers = reactive<Record<string, number>>({});
const takeStudentId = ref('');
const questionBankId = ref('');
const submitResult = ref<any>(null);
const results = ref<any[]>([]);

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

const branchParams = () => selectedBranchId.value ? { branch_id: selectedBranchId.value } : {};

const loadBranches = async () => {
  const response: any = await Branches.getForDropdown({ status: 'active' });
  const branches = extractList(response, ['branches']);
  branchOptions.value = branches.map((b: any) => ({ value: b.id, label: b.name || b.code || b.id }));
  selectedBranchId.value = user.value?.branch_id || (branchOptions.value.length === 1 ? branchOptions.value[0].value : '');
};

const loadLookups = async () => {
  const qs = new URLSearchParams();
  if (selectedBranchId.value) qs.set('branch_id', selectedBranchId.value);
  const [cRes, sRes]: any[] = await Promise.all([
    Classes.getDropdown(qs.toString()),
    Students.getAll({ limit: 200, ...branchParams() })
  ]);
  classes.value = extractList(cRes, ['classes', 'rows']);
  students.value = extractList(sRes, ['students', 'rows']);
  const qRes: any = await SchoolOps.list('exam_question', branchParams());
  questionBank.value = extractList(qRes, ['records', 'rows']);
};

const loadList = async () => {
  const res: any = await OnlineExams.list(branchParams());
  exams.value = res.data?.exams || [];
};

const onBranchChange = async () => {
  form.class_id = '';
  active.value = null;
  await loadLookups();
  await loadList();
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
  const res: any = await OnlineExams.get(id);
  active.value = res.data?.exam;
};

const publish = async (e: any) => {
  try {
    await OnlineExams.update(e.id, { status: 'published' });
    await loadList();
    if (active.value?.id === e.id) await openExam(e.id);
  } catch (err) {
    error.value = apiErrorMessage(err);
  }
};

const removeExam = async (id: string) => {
  if (!confirm('Delete this online exam?')) return;
  try {
    await OnlineExams.remove(id);
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
    });
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
  const lines = String(record.notes || '').split('\n').map(line => line.trim()).filter(Boolean);
  await OnlineExams.addQuestion(active.value.id, {
    question_text: record.title,
    options_json: lines.length >= 2 ? lines.slice(0, 4) : ['Option A', 'Option B', 'Option C', 'Option D'],
    correct_option: 0,
    marks: 1,
    sort_order: (active.value.questions || []).length
  });
  questionBankId.value = '';
  await openExam(active.value.id);
  await loadList();
};

const deleteQuestion = async (qid: string) => {
  if (!active.value) return;
  try {
    await OnlineExams.deleteQuestion(active.value.id, qid);
    await openExam(active.value.id);
    await loadList();
  } catch (e) {
    error.value = apiErrorMessage(e);
  }
};

const startTake = async () => {
  if (!active.value) return;
  try {
    const res: any = await OnlineExams.take(active.value.id);
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
    });
    submitResult.value = res.data;
    await loadResults();
  } catch (e) {
    error.value = apiErrorMessage(e);
  }
};

const loadResults = async () => {
  if (!active.value) return;
  try {
    const res: any = await OnlineExams.results(active.value.id);
    results.value = res.data?.results || [];
  } catch (e) {
    error.value = apiErrorMessage(e);
  }
};

onMounted(async () => {
  try {
    await loadBranches();
    await loadLookups();
    await loadList();
  } catch (e) {
    error.value = apiErrorMessage(e);
  }
});
</script>
