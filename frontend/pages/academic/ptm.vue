<template>
  <div class="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
          Parent–Teacher Meetings
        </h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Schedule meetings, record attendance, and share student-specific remarks.
        </p>
      </div>
      <button
        v-if="canManage"
        class="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        @click="showForm = !showForm"
      >
        {{ showForm ? 'Close form' : 'Schedule meeting' }}
      </button>
    </header>

    <section
      v-if="showForm && canManage"
      class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Schedule a meeting</h2>
      <p
        v-if="!branchId"
        class="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
      >
        Choose one branch before scheduling. Whole-school means all active students in that branch.
      </p>
      <form class="mt-4 grid gap-4 sm:grid-cols-2" @submit.prevent="createMeeting">
        <label class="text-sm text-gray-700 dark:text-gray-300"
          >Meeting title
          <input v-model.trim="form.title" required maxlength="160" class="input-field mt-1" />
        </label>
        <label class="text-sm text-gray-700 dark:text-gray-300"
          >Audience
          <select v-model="form.class_id" class="input-field mt-1">
            <option value="">Whole branch</option>
            <option v-for="item in classes" :key="item.id" :value="item.id">{{ item.name }}</option>
          </select>
        </label>
        <label v-if="form.class_id" class="text-sm text-gray-700 dark:text-gray-300"
          >Section <span class="text-gray-500">(optional)</span>
          <select v-model="form.section_id" class="input-field mt-1">
            <option value="">All sections</option>
            <option v-for="item in sections" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select>
        </label>
        <label class="text-sm text-gray-700 dark:text-gray-300"
          >Date
          <input
            v-model="form.meeting_date"
            type="date"
            :min="today"
            required
            class="input-field mt-1"
          />
        </label>
        <div class="grid grid-cols-2 gap-3">
          <label class="text-sm text-gray-700 dark:text-gray-300"
            >Starts
            <input v-model="form.start_time" type="time" required class="input-field mt-1" />
          </label>
          <label class="text-sm text-gray-700 dark:text-gray-300"
            >Ends
            <input v-model="form.end_time" type="time" required class="input-field mt-1" />
          </label>
        </div>
        <label class="text-sm text-gray-700 dark:text-gray-300"
          >Meeting mode
          <select v-model="form.mode" class="input-field mt-1">
            <option value="in_person">In person</option>
            <option value="online">Online</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </label>
        <label v-if="form.mode !== 'online'" class="text-sm text-gray-700 dark:text-gray-300"
          >Venue
          <input v-model.trim="form.venue" maxlength="200" class="input-field mt-1" />
        </label>
        <label v-if="form.mode !== 'in_person'" class="text-sm text-gray-700 dark:text-gray-300"
          >HTTPS meeting link
          <input
            v-model.trim="form.online_url"
            type="url"
            required
            placeholder="https://…"
            class="input-field mt-1"
          />
        </label>
        <label class="text-sm text-gray-700 dark:text-gray-300 sm:col-span-2"
          >Agenda <span class="text-gray-500">(optional)</span>
          <textarea v-model.trim="form.agenda" maxlength="5000" rows="3" class="input-field mt-1" />
        </label>
        <div class="sm:col-span-2 flex flex-wrap items-center justify-between gap-3">
          <p v-if="formError" class="text-sm text-red-600 dark:text-red-400">{{ formError }}</p>
          <button
            :disabled="saving || !branchId"
            class="ml-auto rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {{ saving ? 'Scheduling…' : 'Schedule & invite active students' }}
          </button>
        </div>
      </form>
    </section>

    <p
      v-if="errorMessage"
      class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
    >
      {{ errorMessage }} <button class="ml-2 underline" @click="load">Retry</button>
    </p>
    <p
      v-if="successMessage"
      class="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
    >
      {{ successMessage }}
    </p>
    <p v-if="loading" class="py-8 text-center text-sm text-gray-500">Loading meetings…</p>
    <p
      v-else-if="!meetings.length"
      class="rounded-xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500 dark:border-gray-700"
    >
      No meetings in this branch yet.
    </p>
    <section v-else class="space-y-4">
      <article
        v-for="meeting in meetings"
        :key="meeting.id"
        class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <div
          class="flex flex-col gap-3 border-b border-gray-100 p-4 dark:border-gray-700 sm:flex-row sm:items-start sm:justify-between sm:p-5"
        >
          <div>
            <h2 class="font-semibold text-gray-900 dark:text-white">{{ meeting.title }}</h2>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {{ formatDate(meeting.meeting_date) }} · {{ meeting.start_time }}–{{
                meeting.end_time
              }}
              · {{ meeting.class?.name || 'Whole branch'
              }}<span v-if="meeting.section?.name"> · {{ meeting.section.name }}</span>
              <span v-if="!branchId"> · {{ branchName(meeting.branch_id) }}</span>
            </p>
            <p
              v-if="meeting.agenda"
              class="mt-2 whitespace-pre-line text-sm text-gray-600 dark:text-gray-300"
            >
              {{ meeting.agenda }}
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="rounded-full px-2.5 py-1 text-xs font-semibold"
              :class="statusClass(meeting.status)"
              >{{ meeting.status }}</span
            >
            <button
              v-if="canManage && meeting.status === 'scheduled'"
              class="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 dark:border-gray-600 dark:text-gray-200"
              @click="changeStatus(meeting, 'completed')"
            >
              Complete
            </button>
            <button
              v-if="canManage && meeting.status === 'scheduled'"
              class="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 dark:border-red-900 dark:text-red-300"
              @click="changeStatus(meeting, 'cancelled')"
            >
              Cancel
            </button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Student
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Attendance
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Teacher remarks
                </th>
                <th
                  v-if="canManage"
                  class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500"
                >
                  Parent feedback
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-for="attendee in meeting.attendees || []" :key="attendee.id">
                <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                  {{ studentName(attendee.student) }}
                  <span class="text-xs text-gray-500">{{
                    attendee.student?.admission_number
                  }}</span>
                </td>
                <td class="px-4 py-3">
                  <select
                    v-if="canRecord && meeting.status === 'scheduled'"
                    v-model="drafts[attendee.id].attendance_status"
                    class="input-field min-w-32"
                  >
                    <option v-for="value in attendanceStatuses" :key="value" :value="value">
                      {{ value }}
                    </option></select
                  ><span v-else class="text-sm text-gray-600 dark:text-gray-300">{{
                    attendee.attendance_status
                  }}</span>
                </td>
                <td class="min-w-64 px-4 py-3">
                  <textarea
                    v-if="canRecord && meeting.status === 'scheduled'"
                    v-model="drafts[attendee.id].teacher_remarks"
                    maxlength="2000"
                    rows="2"
                    class="input-field min-w-64"
                  /><span v-else class="text-sm text-gray-600 dark:text-gray-300">{{
                    attendee.teacher_remarks || '—'
                  }}</span>
                </td>
                <td
                  v-if="canManage"
                  class="min-w-48 px-4 py-3 text-sm text-gray-600 dark:text-gray-300"
                >
                  {{ attendee.parent_rating ? `${attendee.parent_rating}/5` : '—'
                  }}<span v-if="attendee.parent_feedback"> · {{ attendee.parent_feedback }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div
          v-if="canRecord && meeting.status === 'scheduled'"
          class="flex justify-end border-t border-gray-100 p-4 dark:border-gray-700"
        >
          <button
            :disabled="savingAttendanceId === meeting.id"
            class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            @click="saveAttendance(meeting)"
          >
            {{ savingAttendanceId === meeting.id ? 'Saving…' : 'Save attendance & remarks' }}
          </button>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { ParentTeacherMeetings } from '~/api/academic/parent-teacher-meetings';
import { Classes } from '~/api/academic/classes';
import { Sections } from '~/api/academic/sections';
import { useAuth } from '~/composables/useAuth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useToast } from '~/composables/useToast';
import { extractList, apiErrorMessage } from '~/utils/list-response';

const { user } = useAuth();
const { showToast } = useToast();
const { selectedBranchId, currentSchool, availableBranches } = useGlobalBranch();
const canManage = computed(() =>
  ['super_admin', 'admin', 'branch_admin'].includes(user.value?.role || '')
);
const canRecord = computed(() => canManage.value || user.value?.role === 'teacher');
const branchId = computed(() => selectedBranchId.value);
const branchName = (id: string) =>
  availableBranches.value.find(branch => branch.id === id)?.name || 'Branch';
const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
  .toISOString()
  .slice(0, 10);
const meetings = ref<any[]>([]);
const classes = ref<any[]>([]);
const sections = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const savingAttendanceId = ref('');
const showForm = ref(false);
const errorMessage = ref('');
const formError = ref('');
const successMessage = ref('');
const drafts = ref<Record<string, { attendance_status: string; teacher_remarks: string }>>({});
const attendanceStatuses = ['pending', 'present', 'absent', 'rescheduled'];
const form = ref({
  title: '',
  agenda: '',
  meeting_date: '',
  start_time: '09:00',
  end_time: '10:00',
  mode: 'in_person',
  venue: '',
  online_url: '',
  class_id: '',
  section_id: ''
});
const branchParams = computed(() => ({
  ...(currentSchool.value?.id || user.value?.school_id
    ? { school_id: currentSchool.value?.id || user.value?.school_id }
    : {}),
  ...(branchId.value ? { branch_id: branchId.value } : {})
}));

const load = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response: any = await ParentTeacherMeetings.list(branchParams.value);
    meetings.value = extractList(response);
    const nextDrafts: Record<string, { attendance_status: string; teacher_remarks: string }> = {};
    for (const meeting of meetings.value)
      for (const attendee of meeting.attendees || []) {
        nextDrafts[attendee.id] = {
          attendance_status: attendee.attendance_status || 'pending',
          teacher_remarks: attendee.teacher_remarks || ''
        };
      }
    drafts.value = nextDrafts;
  } catch (error: any) {
    errorMessage.value = apiErrorMessage(error);
  } finally {
    loading.value = false;
  }
};

const loadClasses = async () => {
  if (!branchId.value) {
    classes.value = [];
    return;
  }
  try {
    const response: any = await Classes.getAll({
      ...branchParams.value,
      limit: 200,
      is_active: 'true'
    });
    classes.value = extractList(response, ['classes']);
  } catch {
    classes.value = [];
  }
};

const loadSections = async () => {
  if (!form.value.class_id) {
    sections.value = [];
    return;
  }
  try {
    const response: any = await Sections.getAll({
      ...branchParams.value,
      class_id: form.value.class_id,
      limit: 200
    });
    sections.value = extractList(response, ['sections']);
  } catch {
    sections.value = [];
  }
};

const createMeeting = async () => {
  saving.value = true;
  formError.value = '';
  successMessage.value = '';
  try {
    const response: any = await ParentTeacherMeetings.create({
      ...form.value,
      ...branchParams.value
    });
    successMessage.value = `Meeting scheduled; ${response.data?.invited_count ?? 0} active students invited.`;
    form.value = {
      title: '',
      agenda: '',
      meeting_date: '',
      start_time: '09:00',
      end_time: '10:00',
      mode: 'in_person',
      venue: '',
      online_url: '',
      class_id: '',
      section_id: ''
    };
    await load();
  } catch (error: any) {
    formError.value = apiErrorMessage(error);
  } finally {
    saving.value = false;
  }
};

const saveAttendance = async (meeting: any) => {
  savingAttendanceId.value = meeting.id;
  successMessage.value = '';
  try {
    await ParentTeacherMeetings.recordAttendance(
      meeting.id,
      (meeting.attendees || []).map((attendee: any) => ({
        student_id: attendee.student_id,
        ...drafts.value[attendee.id]
      }))
    );
    successMessage.value = 'Attendance and remarks saved.';
    await load();
  } catch (error: any) {
    errorMessage.value = apiErrorMessage(error);
  } finally {
    savingAttendanceId.value = '';
  }
};

const changeStatus = async (meeting: any, status: 'completed' | 'cancelled') => {
  if (
    status === 'cancelled' &&
    !window.confirm('Cancel this meeting? Parents will no longer be able to submit feedback.')
  )
    return;
  try {
    await ParentTeacherMeetings.updateStatus(meeting.id, status);
    successMessage.value = `Meeting ${status}.`;
    await load();
  } catch (error: any) {
    errorMessage.value = apiErrorMessage(error);
  }
};

const formatDate = (value: string) =>
  value ? new Date(`${value}T00:00:00`).toLocaleDateString() : '—';
const studentName = (student: any) =>
  [student?.first_name, student?.middle_name, student?.last_name].filter(Boolean).join(' ') ||
  'Student';
const statusClass = (status: string) =>
  status === 'cancelled'
    ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
    : status === 'completed'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';

watch(branchId, async () => {
  form.value.class_id = '';
  form.value.section_id = '';
  await Promise.all([loadClasses(), load()]);
});
watch(() => form.value.class_id, loadSections);
onMounted(async () => {
  await Promise.all([loadClasses(), load()]);
});
</script>
