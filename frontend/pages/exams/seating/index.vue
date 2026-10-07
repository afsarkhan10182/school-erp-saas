<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-6xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Exam seating</h1>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Bench-wise arrangement: pick hall, exam, class, students/bench — preview then apply.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <EnhancedDropdown v-model="form.exam_id" :options="examOptions" placeholder="Exam" />
        <EnhancedDropdown
          v-model="form.exam_schedule_id"
          :options="scheduleOptions"
          placeholder="Slot (optional)"
          @change="onScheduleChange"
        />
        <EnhancedDropdown v-model="form.exam_hall_id" :options="hallOptions" placeholder="Hall" />
        <EnhancedDropdown v-model="form.class_id" :options="classOptions" placeholder="Class" />
        <EnhancedDropdown
          v-model="form.section_id"
          :options="sectionOptions"
          placeholder="Section (optional)"
        />
        <EnhancedDropdown
          v-model="form.students_per_bench"
          :options="studentsPerBenchOptions"
          placeholder="Students per bench"
        />
        <div class="flex gap-2">
          <button class="flex-1 px-3 py-2 bg-white border rounded-md text-sm" @click="preview">
            Preview
          </button>
          <button
            class="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-md text-sm"
            @click="apply"
          >
            Apply
          </button>
        </div>
      </div>

      <p v-if="error" class="mb-4 text-sm text-red-600">{{ error }}</p>
      <p v-if="msg" class="mb-4 text-sm text-green-700">{{ msg }}</p>

      <div v-if="previewData" class="bg-white dark:bg-gray-800 rounded-md shadow p-4 mb-6">
        <h2 class="font-semibold mb-2">
          Preview — {{ previewData.hall?.name }} · {{ previewData.students_count }} students ·
          {{ previewData.assigned }} seated
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div
            v-for="bench in previewData.plan"
            :key="bench.bench"
            class="border rounded p-3 text-sm"
          >
            <div class="font-medium mb-1">Bench {{ bench.bench }}</div>
            <div
              v-for="seat in bench.seats"
              :key="seat.seat"
              class="text-gray-600 dark:text-gray-300"
            >
              Seat {{ seat.seat }}: {{ seat.name }} ({{ seat.admission_number }})
            </div>
          </div>
        </div>
        <p v-if="previewData.unassigned?.length" class="mt-3 text-xs text-amber-700">
          Unassigned: {{ previewData.unassigned.length }} (hall capacity)
        </p>
      </div>

      <h2 class="text-lg font-semibold mb-3">Saved seating plans</h2>
      <div class="bg-white dark:bg-gray-800 shadow rounded-md overflow-x-auto">
        <table class="min-w-full divide-y">
          <thead>
            <tr>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Exam</th>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Hall</th>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Slot</th>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Class</th>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Benches</th>
              <th class="px-4 py-3 text-right text-xs uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in saved" :key="row.id" class="border-t">
              <td class="px-4 py-3 text-sm">{{ row.exam?.name || row.exam_id }}</td>
              <td class="px-4 py-3 text-sm">{{ row.hall?.name || row.exam_hall_id }}</td>
              <td class="px-4 py-3 text-sm">{{ rowSlot(row) }}</td>
              <td class="px-4 py-3 text-sm">{{ row.class?.name || '—' }}</td>
              <td class="px-4 py-3 text-sm">{{ benches(row.plan_json).length }}</td>
              <td class="px-4 py-3 text-sm text-right space-x-2">
                <button class="text-indigo-600" @click="showOverview(row.id)">
                  Overview / stickers
                </button>
                <button class="text-amber-700" @click="resetPlan(row.id)">Reset</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!saved.length" class="p-6 text-sm text-gray-500">No saved plans.</p>
      </div>

      <div v-if="stickers.length" class="mt-6 bg-white dark:bg-gray-800 rounded-md shadow p-4">
        <h3 class="font-semibold mb-3">Seat stickers</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div v-for="(s, i) in stickers" :key="i" class="border rounded p-3 text-xs text-center">
            <div class="font-medium">{{ s.name }}</div>
            <div>{{ s.admission_number }}</div>
            <div class="text-gray-500">{{ s.hall }} · B{{ s.bench }}-S{{ s.seat }}</div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        :show="Boolean(planToReset)"
        title="Reset seating plan"
        message="Reset this seating plan? Assigned seats will be cleared."
        confirm-label="Reset plan"
        @close="planToReset = ''"
        @confirm="confirmResetPlan"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ExamSeatings } from '~/api/academic/cards-exams-reports';
import { examApi } from '~/api/academic/exams';
import { examHallApi } from '~/api/academic/exam-halls';
import { examScheduleApi } from '~/api/academic/exam-schedules';
import { Classes } from '~/api/academic/classes';
import { Sections } from '~/api/academic/sections';
import { useAuth } from '~/composables/useAuth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { apiErrorMessage, extractList } from '~/utils/list-response';
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';

const { user } = useAuth();
const exams = ref<any[]>([]);
const halls = ref<any[]>([]);
const classes = ref<any[]>([]);
const sections = ref<any[]>([]);
const schedules = ref<any[]>([]);
const saved = ref<any[]>([]);
const { selectedBranchId } = useGlobalBranch();
const previewData = ref<any>(null);
const stickers = ref<any[]>([]);
const error = ref('');
const msg = ref('');
const planToReset = ref('');
const examOptions = computed(() => exams.value.map(e => ({ value: e.id, label: e.name })));
const scheduleOptions = computed(() =>
  schedules.value.map(slot => ({ value: slot.id, label: scheduleLabel(slot) }))
);
const hallOptions = computed(() =>
  halls.value.map(hall => ({ value: hall.id, label: `${hall.name} (cap ${hall.capacity})` }))
);
const classOptions = computed(() => classes.value.map(item => ({ value: item.id, label: item.name })));
const sectionOptions = computed(() =>
  sections.value.map(item => ({ value: item.id, label: item.name }))
);
const studentsPerBenchOptions = [
  { value: 1, label: '1 / bench' },
  { value: 2, label: '2 / bench' },
  { value: 3, label: '3 / bench' }
];

const form = reactive({
  exam_id: '',
  exam_schedule_id: '',
  exam_hall_id: '',
  class_id: '',
  section_id: '',
  students_per_bench: 2
});

const branchParams = () => (selectedBranchId.value ? { branch_id: selectedBranchId.value } : {});
const benches = (planJson: any) => (Array.isArray(planJson) ? planJson : planJson?.benches || []);
const scheduleLabel = (slot: any) =>
  [
    slot.exam_date,
    [slot.start_time, slot.end_time].filter(Boolean).join('-'),
    slot.class?.name,
    slot.section?.name,
    slot.examHall?.name || slot.hall?.name
  ]
    .filter(Boolean)
    .join(' · ');
const rowSlot = (row: any) =>
  row.plan_json?.schedule ? scheduleLabel(row.plan_json.schedule) : '—';

const loadLookups = async () => {
  const qs = new URLSearchParams();
  if (selectedBranchId.value) qs.set('branch_id', selectedBranchId.value);
  const [eRes, hRes, cRes]: any[] = await Promise.all([
    examApi.getAll({ limit: 100, ...branchParams() }),
    examHallApi.getAll({ limit: 100, ...branchParams() }),
    Classes.getDropdown(qs.toString())
  ]);
  exams.value = extractList(eRes, ['exams', 'rows']);
  halls.value = extractList(hRes, ['halls', 'examHalls', 'rows']);
  classes.value = extractList(cRes, ['classes', 'rows']);
  await loadSchedules();
};

const loadSchedules = async () => {
  if (!form.exam_id) {
    schedules.value = [];
    return;
  }
  const res: any = await examScheduleApi.getAll({
    exam_id: form.exam_id,
    limit: 100,
    ...branchParams()
  });
  schedules.value = extractList(res, ['schedules', 'rows']);
};

const onScheduleChange = () => {
  const slot = schedules.value.find(s => s.id === form.exam_schedule_id);
  if (!slot) return;
  form.exam_hall_id = slot.exam_hall_id || slot.hall_id || '';
  form.class_id = slot.class_id || '';
  form.section_id = slot.section_id || '';
};

const loadSaved = async () => {
  const res: any = await ExamSeatings.list({
    ...(form.exam_id ? { exam_id: form.exam_id } : {}),
    ...branchParams()
  });
  saved.value = res.data?.seatings || [];
};

watch(selectedBranchId, async () => {
  form.exam_id = '';
  form.exam_schedule_id = '';
  form.exam_hall_id = '';
  form.class_id = '';
  form.section_id = '';
  previewData.value = null;
  stickers.value = [];
  await loadLookups();
  await loadSaved();
});

const preview = async () => {
  error.value = '';
  msg.value = '';
  try {
    const res: any = await ExamSeatings.preview({ ...form, ...branchParams() });
    previewData.value = res.data;
  } catch (e) {
    error.value = apiErrorMessage(e);
  }
};

const apply = async () => {
  error.value = '';
  msg.value = '';
  try {
    await ExamSeatings.apply({
      ...form,
      ...branchParams(),
      plan_json: previewData.value?.plan
    });
    msg.value = 'Seating applied to hall.';
    await loadSaved();
  } catch (e) {
    error.value = apiErrorMessage(e);
  }
};

const showOverview = async (id: string) => {
  try {
    const res: any = await ExamSeatings.overview(id);
    stickers.value = res.data?.stickers || [];
    previewData.value = {
      hall: res.data?.seating?.hall,
      students_count: stickers.value.length,
      assigned: stickers.value.length,
      plan: benches(res.data?.seating?.plan_json),
      unassigned: []
    };
  } catch (e) {
    error.value = apiErrorMessage(e);
  }
};

const resetPlan = async (id: string) => {
  planToReset.value = id;
};

const confirmResetPlan = async () => {
  const id = planToReset.value;
  planToReset.value = '';
  if (!id) return;
  try {
    await ExamSeatings.reset(id);
    stickers.value = [];
    await loadSaved();
  } catch (e) {
    error.value = apiErrorMessage(e);
  }
};

watch(
  () => form.exam_id,
  async () => {
    form.exam_schedule_id = '';
    await loadSchedules();
  }
);

watch(
  () => form.class_id,
  async cid => {
    form.section_id = '';
    sections.value = [];
    if (!cid) return;
    try {
      const res: any = await Sections.getAll({ class_id: cid, limit: 100, ...branchParams() });
      sections.value = extractList(res, ['sections', 'rows']);
    } catch {
      sections.value = [];
    }
  }
);

onMounted(async () => {
  try {
    await loadLookups();
    await loadSaved();
  } catch (e) {
    error.value = apiErrorMessage(e);
  }
});
</script>
