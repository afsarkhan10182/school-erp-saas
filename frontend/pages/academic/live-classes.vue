<template>
  <main class="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Live Classes</h1>
        <p class="mt-1 text-sm text-gray-500">
          Schedule online lessons and record session attendance.
        </p>
      </div>
      <button
        v-if="!showForm"
        :disabled="!branchId"
        class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        @click="openForm"
      >
        {{ branchId ? 'Schedule live class' : 'Select a branch to schedule' }}
      </button>
    </header>

    <section
      v-if="showForm"
      class="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6"
    >
      <h2 class="mb-4 text-lg font-semibold">
        {{ editingId ? 'Edit scheduled class' : 'Schedule a live class' }}
      </h2>
      <p v-if="!branchId" class="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
        Select one branch before scheduling. Sessions are always branch-specific.
      </p>
      <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="save">
        <label class="text-sm"
          >Title<input
            v-model.trim="form.title"
            required
            maxlength="180"
            class="mt-1 w-full rounded-lg border p-2.5 dark:border-gray-600 dark:bg-gray-900"
        /></label>
        <label class="text-sm"
          >Class<select
            v-model="form.class_id"
            required
            class="mt-1 w-full rounded-lg border p-2.5 dark:border-gray-600 dark:bg-gray-900"
            @change="loadPlacement"
          >
            <option value="">Select class</option>
            <option v-for="item in classes" :key="item.id" :value="item.id">{{ item.name }}</option>
          </select></label
        >
        <label class="text-sm"
          >Section<select
            v-model="form.section_id"
            class="mt-1 w-full rounded-lg border p-2.5 dark:border-gray-600 dark:bg-gray-900"
          >
            <option value="">All sections</option>
            <option v-for="item in sections" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select></label
        >
        <label class="text-sm"
          >Subject<select
            v-model="form.subject_id"
            class="mt-1 w-full rounded-lg border p-2.5 dark:border-gray-600 dark:bg-gray-900"
          >
            <option value="">Select subject</option>
            <option v-for="item in subjects" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select></label
        >
        <label v-if="!isTeacher" class="text-sm"
          >Teacher<select
            v-model="form.teacher_id"
            required
            class="mt-1 w-full rounded-lg border p-2.5 dark:border-gray-600 dark:bg-gray-900"
          >
            <option value="">Select assigned teacher</option>
            <option v-for="item in teachersForBranch" :key="item.id" :value="item.id">
              {{ item.first_name }} {{ item.last_name }} · {{ item.email }}
            </option>
          </select></label
        >
        <label class="text-sm"
          >Start date and time<input
            v-model="form.scheduled_at"
            type="datetime-local"
            required
            class="mt-1 w-full rounded-lg border p-2.5 dark:border-gray-600 dark:bg-gray-900"
        /></label>
        <label class="text-sm"
          >Duration (minutes)<input
            v-model.number="form.duration_minutes"
            type="number"
            min="5"
            max="600"
            required
            class="mt-1 w-full rounded-lg border p-2.5 dark:border-gray-600 dark:bg-gray-900"
        /></label>
        <label class="text-sm sm:col-span-2"
          >HTTPS meeting link<input
            v-model.trim="form.meeting_url"
            type="url"
            required
            placeholder="https://…"
            class="mt-1 w-full rounded-lg border p-2.5 dark:border-gray-600 dark:bg-gray-900"
          /><span class="mt-1 block text-xs text-gray-500"
            >External link scheduling is enabled. Provider credentials and automatic join tracking
            are not configured.</span
          ></label
        >
        <label class="text-sm sm:col-span-2"
          >Description<textarea
            v-model.trim="form.description"
            rows="2"
            maxlength="2000"
            class="mt-1 w-full rounded-lg border p-2.5 dark:border-gray-600 dark:bg-gray-900"
          />
        </label>
        <p v-if="error" class="text-sm text-red-600 sm:col-span-2" role="alert">{{ error }}</p>
        <div class="flex gap-2 sm:col-span-2">
          <button
            :disabled="saving || !branchId"
            class="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {{ saving ? 'Saving…' : 'Save schedule' }}</button
          ><button type="button" class="rounded-lg border px-4 py-2 text-sm" @click="closeForm">
            Cancel
          </button>
        </div>
      </form>
    </section>

    <section
      class="space-y-4 rounded-xl border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6"
    >
      <div class="flex flex-wrap items-center justify-end gap-2">
        <button
          v-for="mode in ['list', 'calendar']"
          :key="mode"
          type="button"
          class="rounded-lg border px-3 py-1.5 text-sm capitalize"
          :class="viewMode === mode ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : ''"
          :aria-pressed="viewMode === mode"
          @click="setViewMode(mode)"
        >
          {{ mode }} view
        </button>
      </div>
      <div class="flex flex-col gap-3 sm:flex-row">
        <input
          v-model.trim="search"
          placeholder="Search sessions"
          class="min-w-0 flex-1 rounded-lg border p-2.5 dark:border-gray-600 dark:bg-gray-900"
          @keyup.enter="searchSessions"
        /><select
          v-model="statusFilter"
          class="rounded-lg border p-2.5 dark:border-gray-600 dark:bg-gray-900"
          @change="searchSessions"
        >
          <option value="">All sessions</option>
          <option value="live">Live</option>
          <option value="scheduled">Scheduled</option>
          <option value="past">Past</option>
          <option value="cancelled">Cancelled</option></select
        ><button class="rounded-lg border px-4 py-2 text-sm" @click="searchSessions">Search</button>
      </div>
      <p v-if="listError" class="text-sm text-red-600" role="alert">{{ listError }}</p>
      <div v-if="loading" class="py-8 text-center text-sm text-gray-500">Loading sessions…</div>
      <template v-else-if="viewMode === 'calendar'">
        <div class="flex items-center justify-between gap-3">
          <button
            type="button"
            aria-label="Previous month"
            class="rounded border px-3 py-1.5"
            @click="moveCalendarMonth(-1)"
          >
            Previous
          </button>
          <h2 class="font-semibold" aria-live="polite">{{ calendarHeading }}</h2>
          <button
            type="button"
            aria-label="Next month"
            class="rounded border px-3 py-1.5"
            @click="moveCalendarMonth(1)"
          >
            Next
          </button>
        </div>
        <div class="overflow-x-auto">
          <div role="grid" :aria-label="calendarHeading" class="min-w-[700px]">
            <div role="row" class="grid grid-cols-7">
              <div
                v-for="weekday in calendarWeekdays"
                :key="weekday"
                role="columnheader"
                class="border-b p-2 text-center text-xs font-semibold text-gray-500"
              >
                {{ weekday }}
              </div>
            </div>
            <div
              v-for="week in calendarWeeks"
              :key="week[0].key"
              role="row"
              class="grid grid-cols-7"
            >
              <div
                v-for="day in week"
                :key="day.key"
                role="gridcell"
                class="min-h-24 border-b border-r p-2"
                :class="day.inMonth ? '' : 'bg-gray-50 text-gray-400 dark:bg-gray-900/50'"
              >
                <div class="mb-1 text-xs font-medium">{{ day.day }}</div>
                <div
                  v-for="item in sessionsForDay(day.key)"
                  :key="item.id"
                  class="mb-1 truncate rounded bg-indigo-50 px-1.5 py-1 text-xs text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-100"
                  :title="`${new Date(item.scheduled_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · ${item.title}`"
                >
                  {{ new Date(item.scheduled_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }}
                  · {{ item.title }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <div v-else-if="sessions.length" class="overflow-x-auto">
        <table class="min-w-[760px] w-full text-left text-sm">
          <thead class="border-b text-xs uppercase text-gray-500">
            <tr>
              <th class="py-3 pr-4">Session</th>
              <th class="py-3 pr-4">Class</th>
              <th class="py-3 pr-4">Teacher</th>
              <th class="py-3 pr-4">Starts</th>
              <th class="py-3 pr-4">Status</th>
              <th class="py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in sessions" :key="item.id" class="border-b last:border-0">
              <td class="py-3 pr-4">
                <div class="font-medium">{{ item.title }}</div>
                <div class="text-xs text-gray-500">
                  {{ item.duration_minutes }} min · {{ item.provider }}
                </div>
              </td>
              <td class="py-3 pr-4">
                {{ item.class?.name || '—'
                }}<span v-if="item.section?.name"> · {{ item.section.name }}</span>
              </td>
              <td class="py-3 pr-4">
                {{
                  [item.teacher?.first_name, item.teacher?.last_name].filter(Boolean).join(' ') ||
                  item.teacher?.email ||
                  '—'
                }}
              </td>
              <td class="py-3 pr-4 whitespace-nowrap">{{ dateLabel(item.scheduled_at) }}</td>
              <td class="py-3 pr-4">
                <span class="rounded-full px-2 py-1 text-xs" :class="statusClass(item)">{{
                  displayStatus(item)
                }}</span>
              </td>
              <td class="py-3 whitespace-nowrap">
                <button class="mr-3 text-indigo-600 hover:underline" @click="openAttendance(item)">
                  Attendance</button
                ><a
                  :href="item.meeting_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mr-3 text-indigo-600 hover:underline"
                  >Join</a
                ><button
                  v-if="item.status === 'scheduled'"
                  class="mr-3 text-indigo-600 hover:underline"
                  @click="edit(item)"
                >
                  Edit</button
                ><button
                  v-if="item.status === 'scheduled'"
                  class="text-red-600 hover:underline"
                  @click="cancel(item)"
                >
                  Cancel
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="!loading && !sessions.length" class="rounded-lg border border-dashed p-8 text-center text-sm text-gray-500">
        No live classes match these filters.
      </p>
      <div v-if="pagination.totalPages > 1" class="flex items-center justify-between text-sm">
        <span
          >Page {{ pagination.page }} of {{ pagination.totalPages }} ·
          {{ pagination.total }} sessions</span
        >
        <div class="flex gap-2">
          <button
            class="rounded border px-3 py-1.5 disabled:opacity-40"
            :disabled="pagination.page <= 1"
            @click="changePage(-1)"
          >
            Previous</button
          ><button
            class="rounded border px-3 py-1.5 disabled:opacity-40"
            :disabled="pagination.page >= pagination.totalPages"
            @click="changePage(1)"
          >
            Next
          </button>
        </div>
      </div>
    </section>

    <section
      v-if="attendanceSession"
      class="space-y-4 rounded-xl border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6"
    >
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-lg font-semibold">Attendance · {{ attendanceSession.title }}</h2>
          <p class="text-sm text-gray-500">
            {{ attendanceData?.total || 0 }} students · Manually recorded for external-link sessions
          </p>
        </div>
        <div class="flex gap-2">
          <button class="rounded-lg border px-3 py-2 text-sm" @click="exportCsv">Export CSV</button
          ><button class="rounded-lg border px-3 py-2 text-sm" @click="attendanceSession = null">
            Close
          </button>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <div
          v-for="(count, key) in attendanceData?.counts"
          :key="key"
          class="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-900"
        >
          <div class="text-lg font-semibold">{{ count }}</div>
          <div class="text-xs capitalize text-gray-500">{{ String(key).replace('_', ' ') }}</div>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-[720px] w-full text-left text-sm">
          <thead class="border-b text-xs uppercase text-gray-500">
            <tr>
              <th class="py-3 pr-3">Student</th>
              <th class="py-3 pr-3">Admission no.</th>
              <th class="py-3 pr-3">Status</th>
              <th class="py-3 pr-3">First joined</th>
              <th class="py-3 pr-3">Last left</th>
              <th class="py-3">Minutes</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in attendanceData?.attendance || []"
              :key="row.id"
              class="border-b last:border-0"
            >
              <td class="py-3 pr-3">{{ row.student?.first_name }} {{ row.student?.last_name }}</td>
              <td class="py-3 pr-3">{{ row.student?.admission_number }}</td>
              <td class="py-3 pr-3">
                <select
                  v-model="row.status"
                  class="rounded border p-1.5 dark:border-gray-600 dark:bg-gray-900"
                  @change="saveAttendance(row)"
                >
                  <option v-for="status in attendanceStatuses" :key="status" :value="status">
                    {{ status.replace('_', ' ') }}
                  </option>
                </select>
              </td>
              <td class="py-3 pr-3">
                <input
                  v-model="row.first_joined_at"
                  type="datetime-local"
                  class="max-w-44 rounded border p-1.5 dark:border-gray-600 dark:bg-gray-900"
                  @change="saveAttendance(row)"
                />
              </td>
              <td class="py-3 pr-3">
                <input
                  v-model="row.last_left_at"
                  type="datetime-local"
                  class="max-w-44 rounded border p-1.5 dark:border-gray-600 dark:bg-gray-900"
                  @change="saveAttendance(row)"
                />
              </td>
              <td class="py-3">
                <input
                  v-model.number="row.duration_minutes"
                  type="number"
                  min="0"
                  max="600"
                  class="w-20 rounded border p-1.5 dark:border-gray-600 dark:bg-gray-900"
                  @change="saveAttendance(row)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="attendanceError" class="text-sm text-red-600" role="alert">{{ attendanceError }}</p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { LiveClasses } from '~/api/academic/live-classes';
import { Homeworks } from '~/api/students/academic-services';
import { Users } from '~/api/administration/users';
import { useAuth } from '~/composables/useAuth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useAcademics } from '~/composables/useAcademics';
import { extractList, apiErrorMessage } from '~/utils/list-response';
import {
  getLiveClassMonthDays,
  getLiveClassMonthRange,
  getLocalCalendarDateKey
} from '~/utils/liveClassCalendar';

const { user } = useAuth();
const { currentSchool, effectiveBranchId } = useGlobalBranch();
const { classes, currentAcademicYear, fetchClasses, fetchAcademicYears } = useAcademics();
const isTeacher = computed(() => user.value?.role === 'teacher');
const branchId = computed(
  () =>
    effectiveBranchId.value ||
    (['branch_admin', 'teacher'].includes(user.value?.role || '') ? user.value?.branch_id : '') ||
    ''
);
const scopeParams = () => ({
  ...(currentSchool.value?.id ? { school_id: currentSchool.value.id } : {}),
  ...(effectiveBranchId.value ? { branch_id: effectiveBranchId.value } : {})
});
const sessions = ref<any[]>([]);
const sections = ref<any[]>([]);
const subjects = ref<any[]>([]);
const teachersForBranch = ref<any[]>([]);
const attendanceData = ref<any>(null);
const attendanceSession = ref<any>(null);
const loading = ref(false);
const saving = ref(false);
const showForm = ref(false);
const editingId = ref('');
const error = ref('');
const listError = ref('');
const attendanceError = ref('');
const search = ref('');
const statusFilter = ref('');
const viewMode = ref<'list' | 'calendar'>('list');
const calendarCursor = ref(new Date());
const calendarWeekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const calendarHeading = computed(() =>
  calendarCursor.value.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
);
const calendarDays = computed(() =>
  getLiveClassMonthDays(calendarCursor.value.getFullYear(), calendarCursor.value.getMonth())
);
const calendarWeeks = computed(() =>
  Array.from({ length: 6 }, (_, index) => calendarDays.value.slice(index * 7, index * 7 + 7))
);
const sessionsForDay = (date: string) =>
  sessions.value.filter(item => getLocalCalendarDateKey(item.scheduled_at) === date);
const pagination = ref({ page: 1, limit: 25, total: 0, totalPages: 0 });
const attendanceStatuses = ['present', 'late', 'left_early', 'insufficient', 'absent'];
const emptyForm = () => ({
  title: '',
  class_id: '',
  section_id: '',
  subject_id: '',
  teacher_id: '',
  scheduled_at: '',
  duration_minutes: 40,
  meeting_url: '',
  description: ''
});
const form = ref(emptyForm());
const loadSessions = async () => {
  loading.value = true;
  listError.value = '';
  try {
    const params: Record<string, string | number> = {
      ...scopeParams(),
      status: statusFilter.value,
      search: search.value,
      page: pagination.value.page,
      limit: pagination.value.limit
    };
    if (viewMode.value === 'calendar') {
      Object.assign(
        params,
        getLiveClassMonthRange(calendarCursor.value.getFullYear(), calendarCursor.value.getMonth())
      );
    }
    const response: any = await LiveClasses.list({
      ...params
    });
    sessions.value = extractList(response);
    if (response.pagination) pagination.value = { ...pagination.value, ...response.pagination };
  } catch (cause) {
    listError.value = apiErrorMessage(cause);
  } finally {
    loading.value = false;
  }
};
const loadPlacement = async () => {
  sections.value = [];
  subjects.value = [];
  form.value.section_id = '';
  form.value.subject_id = '';
  if (!form.value.class_id) return;
  try {
    const year = currentAcademicYear.value?.code || currentAcademicYear.value?.name;
    const response: any = await Homeworks.getPlacementOptions({
      ...scopeParams(),
      class_id: form.value.class_id,
      academic_year: year
    });
    sections.value = response.data?.sections || [];
    subjects.value = response.data?.subjects || [];
  } catch (cause) {
    error.value = apiErrorMessage(cause);
  }
};
const openForm = async () => {
  showForm.value = true;
  error.value = '';
  form.value = emptyForm();
  if (!isTeacher.value)
    teachersForBranch.value =
      (
        (await Users.getAll({
          role: 'teacher',
          limit: 1000,
          ...(currentSchool.value?.id ? { school_id: currentSchool.value.id } : {}),
          ...(branchId.value ? { branch_id: branchId.value } : {})
        })) as any
      ).data?.users || [];
};
const closeForm = () => {
  showForm.value = false;
  editingId.value = '';
  error.value = '';
};
const save = async () => {
  saving.value = true;
  error.value = '';
  try {
    const payload = {
      ...form.value,
      ...scopeParams(),
      scheduled_at: new Date(form.value.scheduled_at).toISOString()
    };
    if (editingId.value) await LiveClasses.update(editingId.value, payload);
    else await LiveClasses.create(payload);
    closeForm();
    await loadSessions();
  } catch (cause) {
    error.value = apiErrorMessage(cause);
  } finally {
    saving.value = false;
  }
};
const edit = async (item: any) => {
  editingId.value = item.id;
  showForm.value = true;
  teachersForBranch.value =
    (
      (await Users.getAll({
        role: 'teacher',
        limit: 1000,
        ...(currentSchool.value?.id ? { school_id: currentSchool.value.id } : {}),
        ...(branchId.value ? { branch_id: branchId.value } : {})
      })) as any
    ).data?.users || [];
  form.value = {
    title: item.title,
    class_id: item.class_id,
    section_id: item.section_id || '',
    subject_id: item.subject_id || '',
    teacher_id: item.teacher_id,
    scheduled_at: new Date(item.scheduled_at).toISOString().slice(0, 16),
    duration_minutes: item.duration_minutes,
    meeting_url: item.meeting_url,
    description: item.description || ''
  };
  await loadPlacement();
  form.value.section_id = item.section_id || '';
  form.value.subject_id = item.subject_id || '';
};
const cancel = async (item: any) => {
  if (!window.confirm(`Cancel “${item.title}”?`)) return;
  try {
    await LiveClasses.cancel(item.id);
    await loadSessions();
  } catch (cause) {
    listError.value = apiErrorMessage(cause);
  }
};
const openAttendance = async (item: any) => {
  attendanceError.value = '';
  attendanceSession.value = item;
  try {
    const response: any = await LiveClasses.attendance(item.id);
    attendanceData.value = response.data;
    attendanceData.value.attendance.forEach((row: any) => {
      row.first_joined_at = row.first_joined_at
        ? new Date(row.first_joined_at).toISOString().slice(0, 16)
        : '';
      row.last_left_at = row.last_left_at
        ? new Date(row.last_left_at).toISOString().slice(0, 16)
        : '';
    });
  } catch (cause) {
    attendanceError.value = apiErrorMessage(cause);
  }
};
const saveAttendance = async (row: any) => {
  if (!attendanceSession.value) return;
  try {
    const response: any = await LiveClasses.updateAttendance(
      attendanceSession.value.id,
      row.student_id,
      {
        status: row.status,
        first_joined_at: row.first_joined_at ? new Date(row.first_joined_at).toISOString() : null,
        last_left_at: row.last_left_at ? new Date(row.last_left_at).toISOString() : null,
        duration_minutes: row.duration_minutes
      }
    );
    Object.assign(row, response.data);
    row.first_joined_at = row.first_joined_at
      ? new Date(row.first_joined_at).toISOString().slice(0, 16)
      : '';
    row.last_left_at = row.last_left_at
      ? new Date(row.last_left_at).toISOString().slice(0, 16)
      : '';
    await openAttendance(attendanceSession.value);
  } catch (cause) {
    attendanceError.value = apiErrorMessage(cause);
  }
};
const exportCsv = async () => {
  if (!attendanceSession.value) return;
  try {
    const response = await LiveClasses.exportAttendance(attendanceSession.value.id);
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `live-class-${attendanceSession.value.id}-attendance.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (cause) {
    attendanceError.value = apiErrorMessage(cause);
  }
};
const isPast = (item: any) =>
  new Date(item.scheduled_at).getTime() + Number(item.duration_minutes) * 60000 < Date.now();
const isLive = (item: any) => new Date(item.scheduled_at).getTime() <= Date.now() && !isPast(item);
const displayStatus = (item: any) =>
  item.status === 'cancelled'
    ? 'Cancelled'
    : isLive(item)
      ? 'Live'
      : isPast(item)
        ? 'Past'
        : 'Scheduled';
const statusClass = (item: any) =>
  item.status === 'cancelled'
    ? 'bg-gray-100 text-gray-600'
    : isLive(item)
      ? 'bg-red-50 text-red-700'
      : isPast(item)
        ? 'bg-emerald-50 text-emerald-700'
        : 'bg-indigo-50 text-indigo-700';
const dateLabel = (value: string) => new Date(value).toLocaleString();
const searchSessions = () => {
  pagination.value.page = 1;
  loadSessions();
};
const setViewMode = (mode: 'list' | 'calendar') => {
  viewMode.value = mode;
  pagination.value.page = 1;
  loadSessions();
};
const moveCalendarMonth = (amount: number) => {
  calendarCursor.value = new Date(
    calendarCursor.value.getFullYear(),
    calendarCursor.value.getMonth() + amount,
    1
  );
  pagination.value.page = 1;
  loadSessions();
};
const changePage = (delta: number) => {
  pagination.value.page += delta;
  loadSessions();
};
watch([effectiveBranchId, currentSchool], async () => {
  await loadSessions();
});
onMounted(async () => {
  await fetchAcademicYears(currentSchool.value?.id);
  await fetchClasses({ schoolId: currentSchool.value?.id, branchId: branchId.value || undefined });
  if (!isTeacher.value)
    teachersForBranch.value =
      (
        (await Users.getAll({
          role: 'teacher',
          limit: 1000,
          ...(currentSchool.value?.id ? { school_id: currentSchool.value.id } : {}),
          ...(branchId.value ? { branch_id: branchId.value } : {})
        })) as any
      ).data?.users || [];
  await loadSessions();
});
</script>
