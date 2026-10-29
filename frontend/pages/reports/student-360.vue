<template>
  <main class="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Student 360</h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Active-student register with attendance, overdue fees and latest-exam context.
        </p>
      </div>
      <NuxtLink to="/reports/students" class="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-300">
        Student Reports
      </NuxtLink>
      <button type="button" class="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600" @click="copyFilteredLink">
        {{ linkCopied ? 'Link copied' : 'Copy filtered link' }}
      </button>
      <button type="button" class="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-gray-600" :disabled="loading || exporting" @click="exportCsv">
        {{ exporting ? 'Preparing CSV…' : csvExported ? 'CSV downloaded' : 'Export CSV' }}
      </button>
    </header>

    <section class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
      Attendance uses published daily sessions from the selected period; excused days are excluded. Fees use each invoice’s current balance and due date. A failed latest exam follows the school’s active grading scale; absent or ungradable results do not count as a failure. At-risk counts apply your chosen minimum to these three signals. Transport, Hostel, Library loans and the latest result are context only. Library flags use unreturned student loans and their due dates. Latest result uses the latest non-cancelled scheduled exam date for the student’s class/section, including unpublished results. Profile-gap signals are not included until their data rules are reliable.
    </section>

    <form class="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5" @submit.prevent="applyFilters">
      <label class="text-sm text-gray-700 dark:text-gray-200">
        Search students
        <input v-model.trim="filters.search" class="mt-1 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 dark:border-gray-600" placeholder="Name or admission no." />
      </label>
      <label class="text-sm text-gray-700 dark:text-gray-200">
        Attendance from
        <input v-model="filters.from_date" type="date" class="mt-1 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 dark:border-gray-600" />
        <span v-if="summary.attendance_period" class="mt-1 block text-xs text-gray-500 dark:text-gray-400">
          Applied: {{ summary.attendance_period.from }} to {{ summary.attendance_period.to }}
        </span>
      </label>
      <label class="text-sm text-gray-700 dark:text-gray-200">
        Low attendance below (%)
        <input v-model.number="filters.attendance_below" type="number" min="0" max="100" class="mt-1 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 dark:border-gray-600" />
      </label>
      <label class="text-sm text-gray-700 dark:text-gray-200">
        Fees overdue for (days)
        <input v-model.number="filters.overdue_days" type="number" min="1" max="3650" class="mt-1 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 dark:border-gray-600" />
      </label>
      <label class="text-sm text-gray-700 dark:text-gray-200">
        Signals required for at-risk
        <select v-model.number="filters.min_signals" class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800">
          <option :value="1">At least 1</option>
          <option :value="2">At least 2</option>
          <option :value="3">At least 3</option>
        </select>
      </label>
      <label class="text-sm text-gray-700 dark:text-gray-200">
        Class
        <select v-model="filters.class_id" class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800">
          <option value="">All classes</option>
          <option v-for="item in classes" :key="item.id" :value="item.id">{{ item.name }}</option>
        </select>
      </label>
      <label class="text-sm text-gray-700 dark:text-gray-200">
        Section
        <select v-model="filters.section_id" class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800" :disabled="!filters.class_id">
          <option value="">All sections</option>
          <option v-for="item in sections" :key="item.id" :value="item.id">{{ item.name }}</option>
        </select>
      </label>
      <label class="text-sm text-gray-700 dark:text-gray-200">
        Gender
        <select v-model="filters.gender" class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800">
          <option value="">All genders</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label class="text-sm text-gray-700 dark:text-gray-200">
        Student category
        <select v-model="filters.category_id" class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800">
          <option value="">All categories</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
        </select>
      </label>
      <fieldset class="flex flex-col justify-center gap-2 text-sm text-gray-700 dark:text-gray-200">
        <legend>Library loans</legend>
        <label class="flex items-center gap-2"><input v-model="filters.library_out" type="checkbox" class="rounded border-gray-300" /> Has books out</label>
        <label class="flex items-center gap-2"><input v-model="filters.library_overdue" type="checkbox" class="rounded border-gray-300" /> Books overdue</label>
      </fieldset>
      <fieldset class="flex flex-col justify-center gap-2 text-sm text-gray-700 dark:text-gray-200">
        <legend>Services</legend>
        <label class="flex items-center gap-2"><input v-model="filters.has_transport" type="checkbox" class="rounded border-gray-300" /> Has transport</label>
        <label class="flex items-center gap-2"><input v-model="filters.has_hostel" type="checkbox" class="rounded border-gray-300" /> Has hostel allocation</label>
      </fieldset>
      <div class="flex items-end">
        <button type="submit" class="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50" :disabled="loading">{{ loading ? 'Loading…' : 'Apply filters' }}</button>
      </div>
    </form>

    <section class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Risk counts on this page">
      <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"><p class="text-sm text-gray-500">At risk ({{ summary.risk_thresholds?.min_signals || filters.min_signals }}+ signals) on this page</p><p class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{{ summary.page_at_risk || 0 }}</p></div>
      <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"><p class="text-sm text-gray-500">Low attendance</p><p class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{{ summary.low_attendance || 0 }}</p></div>
      <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"><p class="text-sm text-gray-500">Fees overdue</p><p class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{{ summary.fees_overdue || 0 }}</p></div>
      <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"><p class="text-sm text-gray-500">Failed latest exam</p><p class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{{ summary.failed_latest_exam || 0 }}</p></div>
    </section>

    <p v-if="error" role="alert" class="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">{{ error }}</p>
    <section class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <h2 class="font-semibold text-gray-900 dark:text-white">Active students</h2>
        <p class="text-sm text-gray-500">{{ pagination.total || 0 }} matching · page {{ pagination.page || 1 }} of {{ pagination.totalPages || 0 }}</p>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-[1040px] w-full text-left text-sm">
          <thead class="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900/50"><tr><th class="px-4 py-3">Student</th><th class="px-4 py-3">Class / section</th><th class="px-4 py-3">Attendance</th><th class="px-4 py-3">Past-due balance</th><th class="px-4 py-3">Oldest overdue</th><th class="px-4 py-3">Latest result</th><th class="px-4 py-3">Services</th><th class="px-4 py-3">Warning signs</th><th class="px-4 py-3">Report-card archive</th></tr></thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr v-for="student in students" :key="student.id" class="text-gray-700 dark:text-gray-200">
              <td class="px-4 py-3"><NuxtLink :to="`/students/${student.id}`" class="font-medium text-indigo-600 hover:underline dark:text-indigo-300">{{ student.first_name }} {{ student.last_name }}</NuxtLink><div class="text-xs text-gray-500">{{ student.admission_number || 'No admission number' }}</div></td>
              <td class="px-4 py-3">{{ student.class?.name || student.current_class || '—' }}<span v-if="student.sectionInfo?.name"> · {{ student.sectionInfo.name }}</span></td>
              <td class="px-4 py-3">{{ student.risk.attendance_rate === null ? 'Not marked' : `${student.risk.attendance_rate}%` }}<div class="text-xs text-gray-500">{{ student.risk.attendance_marked_days }} marked days</div></td>
              <td class="px-4 py-3">{{ currency(student.risk.overdue_balance) }}</td>
              <td class="px-4 py-3">{{ student.risk.oldest_overdue_days ? `${student.risk.oldest_overdue_days} days` : '—' }}</td>
              <td class="px-4 py-3"><template v-if="student.risk.latest_result"><span class="font-medium">{{ student.risk.latest_result.exam_name }}</span><div class="text-xs text-gray-500">{{ student.risk.latest_result.exam_date }} · {{ student.risk.latest_result.is_absent ? 'Absent' : `${student.risk.latest_result.percentage}% (${student.risk.latest_result.grade || 'Ungraded'})` }}</div><span v-if="!student.risk.latest_result.published || !student.risk.latest_result.result_published" class="text-xs text-amber-700 dark:text-amber-300">Unpublished</span></template><span v-else class="text-gray-500">No scheduled result</span></td>
              <td class="px-4 py-3"><span v-if="!student.risk.service_memberships.transport && !student.risk.service_memberships.hostel && !student.risk.service_memberships.library_books_out" class="text-gray-500">None</span><span v-else class="flex flex-wrap gap-1"><span v-if="student.risk.service_memberships.transport" class="rounded-full bg-sky-100 px-2 py-1 text-xs text-sky-800 dark:bg-sky-900/50 dark:text-sky-200">Transport</span><span v-if="student.risk.service_memberships.hostel" class="rounded-full bg-violet-100 px-2 py-1 text-xs text-violet-800 dark:bg-violet-900/50 dark:text-violet-200">Hostel</span><span v-if="student.risk.service_memberships.library_books_out" class="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">Library<span v-if="student.risk.service_memberships.library_books_overdue"> · overdue</span></span></span></td>
              <td class="px-4 py-3"><span v-if="!student.risk.signals.length" class="text-gray-500">None</span><span v-else class="flex flex-wrap gap-1"><span v-for="signal in student.risk.signals" :key="signal" class="rounded-full bg-rose-100 px-2 py-1 text-xs text-rose-800 dark:bg-rose-900/50 dark:text-rose-200">{{ signalLabel(signal) }}</span></span></td>
              <td class="px-4 py-3"><button type="button" class="text-indigo-600 hover:underline dark:text-indigo-300" @click="openStudentArchives(student)">View cards</button></td>
            </tr>
            <tr v-if="!loading && !students.length"><td colspan="9" class="px-4 py-10 text-center text-gray-500">No active students match these filters.</td></tr>
          </tbody>
        </table>
      </div>
      <footer class="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
        <button class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-gray-600" :disabled="loading || pagination.page <= 1" @click="loadPage(pagination.page - 1)">Previous</button>
        <button class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-gray-600" :disabled="loading || pagination.page >= pagination.totalPages" @click="loadPage(pagination.page + 1)">Next</button>
      </footer>
    </section>

    <Modal :show="Boolean(selectedArchiveStudent)" size="xl" labelled-by="student-archive-title" @close="selectedArchiveStudent = null">
      <template #header>
        <h2 id="student-archive-title" class="text-lg font-semibold text-gray-900 dark:text-white">Report-card archive</h2>
        <p v-if="selectedArchiveStudent" class="text-sm text-gray-500">{{ selectedArchiveStudent.first_name }} {{ selectedArchiveStudent.last_name }}</p>
      </template>
      <template #body>
        <p v-if="archiveLoading" class="text-sm text-gray-500">Loading saved cards…</p>
        <p v-else-if="!archiveRows.length" class="rounded-lg bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-900 dark:text-gray-300">No report cards have been archived for this student.</p>
        <ul v-else class="divide-y divide-gray-200 dark:divide-gray-700">
          <li v-for="archive in archiveRows" :key="archive.id" class="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
            <span>{{ archive.title }}<span v-if="archive.academic_year" class="text-gray-500"> · {{ archive.academic_year }}</span><span class="ml-2 text-xs text-gray-500">{{ new Date(archive.created_at).toLocaleDateString() }}</span></span>
            <button type="button" class="text-indigo-600 hover:underline dark:text-indigo-300" @click="downloadArchive(archive.id)">Open / print PDF</button>
          </li>
        </ul>
      </template>
    </Modal>
  </main>
</template>

<script setup lang="ts">
import Modal from '~/components/ui/Modal.vue';
import { onMounted, reactive, ref, watch } from 'vue';
import { Students } from '~/api';
import { useAuthStore } from '~/stores/auth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useAcademics } from '~/composables/useAcademics';
import { StudentCategories } from '~/api/students/academic-services';
import { examReportsApi } from '~/api/academic/exam-reports';
import { useRoute, useRouter } from 'vue-router';
import { collectStudent360ExportRows, mergeStudent360Filters, parseStudent360Number, student360Csv } from '~/utils/student360Query';

type RiskStudent = {
  id: string;
  first_name: string;
  last_name: string;
  admission_number?: string;
  current_class?: string;
  class?: { name: string };
  sectionInfo?: { name: string };
  risk: {
    attendance_rate: number | null;
    attendance_marked_days: number;
    overdue_balance: number;
    oldest_overdue_days: number;
    signals: string[];
    service_memberships: { transport: boolean; hostel: boolean; library_books_out: boolean; library_books_overdue: boolean };
    latest_result: null | {
      exam_name: string;
      exam_date: string;
      percentage: number;
      grade: string | null;
      is_absent: boolean;
      is_passed: boolean | null;
      published: boolean;
      result_published: boolean;
    };
  };
};
type ArchivedReportCard = { id: string; title: string; academic_year: string | null; created_at: string };

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const { selectedBranchId } = useGlobalBranch();
const { classes, sections, fetchClasses, fetchSections } = useAcademics();
const categories = ref<{ id: string; name: string }[]>([]);
const students = ref<RiskStudent[]>([]);
const loading = ref(false);
const exporting = ref(false);
const csvExported = ref(false);
const error = ref('');
const linkCopied = ref(false);
const selectedArchiveStudent = ref<RiskStudent | null>(null);
const archiveLoading = ref(false);
const archiveRows = ref<ArchivedReportCard[]>([]);
const summary = ref<{
  page_at_risk?: number;
  low_attendance?: number;
  fees_overdue?: number;
  failed_latest_exam?: number;
  attendance_period?: { from: string; to: string; basis: string };
  risk_thresholds?: { min_signals: number };
}>({});
const pagination = reactive({ page: 1, limit: 25, total: 0, totalPages: 0 });
const queryValue = (key: string) => typeof route.query[key] === 'string' ? route.query[key] as string : '';
const queryNumber = (key: string, fallback: number) => parseStudent360Number(queryValue(key), fallback);
const filters = reactive({
  search: queryValue('search'),
  from_date: queryValue('from_date'),
  attendance_below: queryNumber('attendance_below', 75),
  overdue_days: queryNumber('overdue_days', 30),
  min_signals: [1, 2, 3].includes(queryNumber('min_signals', 2)) ? queryNumber('min_signals', 2) : 2,
  class_id: queryValue('class_id'),
  section_id: queryValue('section_id'),
  gender: queryValue('gender'),
  category_id: queryValue('category_id'),
  library_out: queryValue('library_out') === 'true',
  library_overdue: queryValue('library_overdue') === 'true',
  has_transport: queryValue('has_transport') === 'true',
  has_hostel: queryValue('has_hostel') === 'true'
});

const loadClasses = async () => {
  try {
    await fetchClasses({
      schoolId: authStore.currentSchool?.id || authStore.user?.school_id,
      branchId: selectedBranchId.value || undefined
    });
  } catch {
    classes.value = [];
  }
};

const loadCategories = async () => {
  try {
    const response = await StudentCategories.getAll({
      school_id: authStore.currentSchool?.id || authStore.user?.school_id,
      branch_id: selectedBranchId.value || undefined
    });
    categories.value = response.data?.categories || [];
  } catch {
    categories.value = [];
  }
};

const currency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount || 0);
const signalLabel = (signal: string) => ({
  low_attendance: 'Low attendance',
  fees_overdue: 'Fees overdue',
  failed_latest_exam: 'Failed latest exam'
}[signal] || signal);

const registerRequestFilters = (page: number, limit: number) => ({
  page,
  limit,
  search: filters.search || undefined,
  from_date: filters.from_date || undefined,
  attendance_below: filters.attendance_below,
  overdue_days: filters.overdue_days,
  min_signals: filters.min_signals,
  class_id: filters.class_id || undefined,
  section_id: filters.section_id || undefined,
  gender: filters.gender || undefined,
  category_id: filters.category_id || undefined,
  library_out: filters.library_out || undefined,
  library_overdue: filters.library_overdue || undefined,
  has_transport: filters.has_transport || undefined,
  has_hostel: filters.has_hostel || undefined,
  school_id: authStore.currentSchool?.id || authStore.user?.school_id,
  branch_id: selectedBranchId.value || undefined
});

const loadPage = async (page = 1) => {
  if (authStore.isSuperAdmin && !authStore.currentSchool?.id) {
    error.value = 'Select a school from the global selector to view its student register.';
    students.value = [];
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    const response = await Students.getRiskRegister(registerRequestFilters(page, pagination.limit));
    students.value = response.data || [];
    summary.value = response.summary || {};
    Object.assign(pagination, response.pagination || { page: 1, total: 0, totalPages: 0 });
  } catch (cause: any) {
    error.value = cause?.response?.data?.message || cause?.message || 'Could not load the Student 360 register.';
  } finally {
    loading.value = false;
  }
};

const exportCsv = async () => {
  const schoolId = authStore.currentSchool?.id || authStore.user?.school_id;
  if (authStore.isSuperAdmin && !schoolId) {
    error.value = 'Select a school from the global selector before exporting.';
    return;
  }
  if (loading.value || exporting.value) return;

  exporting.value = true;
  error.value = '';
  try {
    const context = { userId: authStore.user?.id, schoolId, branchId: selectedBranchId.value };
    const contextChanged = () => context.userId !== authStore.user?.id || context.schoolId !== (authStore.currentSchool?.id || authStore.user?.school_id) || context.branchId !== selectedBranchId.value;
    const request = registerRequestFilters(1, 100);
    // shortcut: fetches the existing 100-row endpoint sequentially; use a server-side stream if large-school exports become slow.
    const allStudents = await collectStudent360ExportRows(async page => {
      if (contextChanged()) {
        throw new Error('School or branch changed during export. Please try again.');
      }
      return Students.getRiskRegister({ ...request, page });
    });
    if (contextChanged()) throw new Error('School or branch changed during export. Please try again.');

    const url = URL.createObjectURL(new Blob([student360Csv(allStudents)], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `student-360-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    csvExported.value = true;
    window.setTimeout(() => { csvExported.value = false; }, 2500);
  } catch (cause: any) {
    error.value = cause?.response?.data?.message || cause?.message || 'Could not export the Student 360 register.';
  } finally {
    exporting.value = false;
  }
};

const syncFiltersToUrl = async () => {
  const query = mergeStudent360Filters(route.query, filters);
  await router.replace({ query });
};
const applyFilters = async () => {
  await syncFiltersToUrl();
  await loadPage(1);
};
const copyFilteredLink = async () => {
  try {
    await syncFiltersToUrl();
    await navigator.clipboard.writeText(window.location.href);
    linkCopied.value = true;
    window.setTimeout(() => { linkCopied.value = false; }, 2000);
  } catch {
    error.value = 'Could not copy the filtered link. You can copy it from the address bar.';
  }
};
const openStudentArchives = async (student: RiskStudent) => {
  selectedArchiveStudent.value = student;
  archiveRows.value = [];
  archiveLoading.value = true;
  try {
    const response = await examReportsApi.getStudentArchives(student.id) as { data?: ArchivedReportCard[] };
    archiveRows.value = response.data || [];
  } catch (cause: any) {
    error.value = cause?.response?.data?.message || cause?.message || 'Could not load archived report cards.';
    selectedArchiveStudent.value = null;
  } finally {
    archiveLoading.value = false;
  }
};
const downloadArchive = async (archiveId: string) => {
  try {
    const response = await examReportsApi.downloadArchive(archiveId);
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-card-${archiveId}.pdf`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (cause: any) {
    error.value = cause?.response?.data?.message || cause?.message || 'Could not download archived report card.';
  }
};
const onClassChange = async () => {
  filters.section_id = '';
  sections.value = [];
  if (filters.class_id) {
    await fetchSections({
      schoolId: authStore.currentSchool?.id || authStore.user?.school_id,
      branchId: selectedBranchId.value || undefined,
      classId: filters.class_id
    });
  }
};
watch(selectedBranchId, async () => {
  filters.class_id = '';
  filters.section_id = '';
  filters.category_id = '';
  sections.value = [];
  await syncFiltersToUrl();
  await Promise.all([loadClasses(), loadCategories()]);
  await loadPage(1);
});
watch(() => authStore.currentSchool?.id, async () => {
  filters.class_id = '';
  filters.section_id = '';
  filters.category_id = '';
  sections.value = [];
  await syncFiltersToUrl();
  await Promise.all([loadClasses(), loadCategories()]);
  await loadPage(1);
});
onMounted(async () => {
  await Promise.all([loadClasses(), loadCategories()]);
  if (filters.class_id) {
    await fetchSections({
      schoolId: authStore.currentSchool?.id || authStore.user?.school_id,
      branchId: selectedBranchId.value || undefined,
      classId: filters.class_id
    });
  }
  await loadPage();
});
watch(() => filters.class_id, onClassChange);
</script>
