<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Homework</h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Assign class work within the selected branch.
          </p>
        </div>
        <div class="flex flex-wrap gap-2 sm:justify-end">
          <div class="relative">
            <button type="button" class="rounded-lg border border-gray-300 px-3 py-2.5 text-xs text-gray-700 dark:border-gray-600 dark:text-gray-200" :aria-expanded="showExportColumns" @click="showExportColumns = !showExportColumns">
              Export columns
            </button>
            <div v-if="showExportColumns" class="absolute right-0 z-20 mt-2 w-56 rounded-md border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-600 dark:bg-gray-800">
              <label v-for="column in homeworkExportColumns" :key="column.key" class="flex items-center gap-2 py-1 text-sm text-gray-700 dark:text-gray-200">
                <input v-model="column.visible" type="checkbox" :disabled="column.visible && selectedHomeworkExportColumns.length === 1" />
                {{ column.label }}
              </label>
            </div>
          </div>
          <button v-for="format in ['csv', 'excel', 'pdf']" :key="format" type="button" class="rounded-lg border border-gray-300 px-3 py-2.5 text-xs text-gray-700 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200" :disabled="!pagination.total || isGenerating" @click="exportHomeworks(format)">
            {{ isGenerating ? 'Preparing…' : format.toUpperCase() }}
          </button>
          <button
            class="px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
            :disabled="allBranchesReadOnly"
            :class="{ 'cursor-not-allowed opacity-50': allBranchesReadOnly }"
            @click="openCreate"
          >
            Add homework
          </button>
        </div>
      </div>

      <p
        v-if="allBranchesReadOnly"
        role="status"
        class="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200"
      >
        All Branches is read-only. Select a specific branch in the global selector to add, edit, review, or delete homework.
      </p>

      <section class="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Homework overview">
        <div v-for="stat in homeworkStats" :key="stat.label" class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ stat.label }}</p>
          <p class="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{{ stat.value }}</p>
        </div>
      </section>

      <section
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4"
      >
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label class="block text-sm text-gray-700 dark:text-gray-300">
            Academic year
            <select v-model="selectedAcademicYear" class="input-field mt-1" @change="applyFilters">
              <option value="all">All sessions</option>
              <option v-for="year in academicYearOptions" :key="year.value" :value="year.value">
                {{ year.label }}
              </option>
            </select>
          </label>
          <EnhancedDropdown
            v-model="filterClassId"
            :options="classOptions"
            label="Class"
            placeholder="All classes"
            @change="applyFilters"
          />
          <label class="block text-sm text-gray-700 dark:text-gray-300">
            Search assignments
            <input v-model.trim="searchQuery" type="search" class="input-field mt-1" placeholder="Title, class, or subject" />
          </label>
        </div>
      </section>

      <div
        v-if="errorMessage"
        class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {{ errorMessage }}
        <button class="ml-3 underline" @click="load">Retry</button>
      </div>

      <section
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg overflow-x-auto"
      >
        <div v-if="loading" class="p-6 text-sm text-gray-500 dark:text-gray-400">
          Loading homework...
        </div>
        <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700/60">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                <button class="inline-flex items-center gap-1" @click="toggleSort('title')">
                  Title <span v-if="sortBy === 'title'" aria-hidden="true">{{ sortOrder === 'ASC' ? '↑' : '↓' }}</span>
                </button>
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400"
              >
                Class
              </th>
              <th v-if="allBranchesReadOnly" class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Branch
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Subject
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Academic year
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                <button class="inline-flex items-center gap-1" @click="toggleSort('due_date')">
                  Due <span v-if="sortBy === 'due_date'" aria-hidden="true">{{ sortOrder === 'ASC' ? '↑' : '↓' }}</span>
                </button>
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Submissions
              </th>
              <th
                class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="item in items"
              :key="item.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/40"
            >
              <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                {{ item.title }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                {{ item.class?.name || '-' }}<span v-if="item.section?.name"> · {{ item.section.name }}</span>
              </td>
              <td v-if="allBranchesReadOnly" class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                {{ availableBranches.find(branch => branch.id === item.branch_id)?.name || '-' }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                {{ item.subject?.name || '-' }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                {{ item.academic_year || 'Legacy / unassigned' }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                <span>{{ item.due_date }}</span>
                <span
                  class="ml-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="isPastDue(item.due_date) ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'"
                >{{ isPastDue(item.due_date) ? 'Past due' : 'Open' }}</span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                <span v-if="item.submission_progress?.total_enrolled" class="block">
                  {{ item.submission_progress.submitted || 0 }} / {{ item.submission_progress.total_enrolled }} submitted
                </span>
                <span v-else class="block">No active students</span>
                <span v-if="item.submission_progress?.total_enrolled" class="text-xs text-gray-500 dark:text-gray-400">
                  {{ item.submission_progress?.evaluated || 0 }} evaluated
                  <template v-if="item.submission_progress?.pending_evaluation"> · {{ item.submission_progress.pending_evaluation }} awaiting review</template>
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-right">
                <template v-if="!allBranchesReadOnly">
                  <button
                    v-if="canReview(item)"
                    class="text-sm font-medium text-indigo-600 hover:text-indigo-700 mr-3"
                    @click="openSubmissions(item)"
                  >
                    Submissions
                  </button>
                  <button
                    class="text-sm font-medium text-indigo-600 hover:text-indigo-700 mr-3"
                    @click="openEdit(item)"
                  >
                    Edit
                  </button>
                  <button
                    class="text-sm font-medium text-red-600 hover:text-red-700"
                    @click="requestRemove(item.id)"
                  >
                    Delete
                  </button>
                </template>
                <span v-else class="text-xs text-gray-500 dark:text-gray-400">Select a branch to manage</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p
          v-if="!loading && !items.length && !errorMessage"
          class="p-6 text-sm text-gray-500 dark:text-gray-400"
        >
          {{ searchQuery ? 'No assignments match your filters.' : 'No homework for this scope.' }}
        </p>
      </section>
      <Pagination
        :pagination="pagination"
        item-label="assignments"
        @page-changed="changePage"
        @page-size-changed="changePageSize"
      />

      <div
        v-if="showForm"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <div
          class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto shadow-xl"
        >
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {{ editingId ? 'Edit homework' : 'Add homework' }}
          </h2>
          <input v-model.trim="form.title" class="input-field mb-3" placeholder="Title" />
          <textarea
            v-model.trim="form.description"
            class="input-field min-h-24 mb-3"
            placeholder="Description"
          />
          <label class="mb-3 block text-sm text-gray-700 dark:text-gray-300">
            Resource link <span class="text-gray-500">(optional; use a link or upload)</span>
            <input
              v-model.trim="form.attachment_url"
              type="text"
              class="input-field mt-1"
              placeholder="https://… or keep the current uploaded file"
              @input="clearSelectedAttachment(); selectedStudyMaterialId = ''"
            />
          </label>
          <label class="mb-3 block text-sm text-gray-700 dark:text-gray-300">
            Use an existing Study Center link <span class="text-gray-500">(optional)</span>
            <select v-model="selectedStudyMaterialId" class="input-field mt-1" :disabled="!form.class_id || loadingStudyMaterials" @change="applyStudyMaterial">
              <option value="">Choose a shared link resource</option>
              <option v-for="material in homeworkStudyMaterials" :key="material.id" :value="material.id">
                {{ material.title }}{{ material.subject_name ? ` · ${material.subject_name}` : '' }}
              </option>
            </select>
            <span v-if="loadingStudyMaterials" class="mt-1 block text-xs text-gray-500">Loading shared resources…</span>
            <span v-else-if="studyMaterialsError" role="status" class="mt-1 block text-xs text-amber-700">{{ studyMaterialsError }} You can still enter a link or upload a file.</span>
            <span v-else-if="form.class_id && !homeworkStudyMaterials.length" class="mt-1 block text-xs text-gray-500">No shared link resources are available for this class and subject.</span>
            <span v-else class="mt-1 block text-xs text-gray-500">Only safe HTTPS links and videos are listed; upload files with the file control below.</span>
          </label>
          <label class="mb-3 block text-sm text-gray-700 dark:text-gray-300">
            Attach a file <span class="text-gray-500">(optional)</span>
            <input
              ref="attachmentInput"
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif"
              class="input-field mt-1"
              :disabled="saving"
              @change="selectHomeworkAttachment"
            />
          </label>
          <p v-if="selectedAttachmentFile" class="-mt-2 mb-3 text-xs text-gray-500">
            Selected: {{ selectedAttachmentFile.name }}
            <button type="button" class="ml-2 underline" @click="clearSelectedAttachment">
              Remove
            </button>
          </p>
          <EnhancedDropdown
            v-model="form.class_id"
            :options="classOptions"
            label="Class"
            placeholder="Select class"
            class="mb-3"
            @update:model-value="onPlacementClassChange"
          />
          <EnhancedDropdown
            v-model="form.subject_id"
            :options="homeworkSubjectOptions"
            label="Subject"
            placeholder="Select assigned subject"
            class="mb-3"
            :disabled="placementOptionsLoading || !form.class_id"
          />
          <EnhancedDropdown
            v-model="form.section_id"
            :options="homeworkSectionOptions"
            label="Section"
            placeholder="All assigned sections"
            class="mb-3"
            :disabled="placementOptionsLoading || !form.class_id"
          />
          <p v-if="placementOptionsLoading" class="mb-3 text-xs text-gray-500">
            Loading assigned subjects and sections...
          </p>
          <p v-else-if="placementOptionsError" class="mb-3 text-xs text-red-600">
            {{ placementOptionsError }}
          </p>
          <label class="block text-sm text-gray-700 dark:text-gray-300">
            Academic year
            <select v-model="form.academic_year" class="input-field mt-1" @change="onPlacementClassChange">
              <option v-if="user?.role !== 'teacher'" value="">No session assigned</option>
              <option v-for="year in academicYearOptions" :key="year.value" :value="year.value">
                {{ year.label }}
              </option>
            </select>
          </label>
          <input v-model="form.due_date" type="date" class="input-field mb-3" />
          <div class="flex justify-end gap-2 mt-4">
            <button
              class="px-3 py-2 text-sm text-gray-700 dark:text-gray-200"
              @click="showForm = false"
            >
              Cancel
            </button>
            <button
              class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg disabled:opacity-50"
              :disabled="saving"
              @click="save"
            >
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>

      <Modal :show="Boolean(activeHomework)" size="4xl" @close="activeHomework = null">
        <template #header>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Submissions{{ activeHomework ? `: ${activeHomework.title}` : '' }}
          </h2>
        </template>
        <template #body>
          <div v-if="loadingSubmissions" class="p-4 text-sm text-gray-500">Loading submissions...</div>
          <div v-else-if="submissionError" class="p-4 text-sm text-red-600">{{ submissionError }}</div>
          <div v-else-if="!submissions.length" class="p-4 text-sm text-gray-500">No student submissions yet.</div>
          <div v-else class="space-y-4 max-h-[65vh] overflow-y-auto">
            <p class="text-sm text-gray-600 dark:text-gray-300">
              {{ submissionSummary.submitted }} submitted · {{ submissionSummary.evaluated }} evaluated ·
              {{ submissionSummary.pending_evaluation }} awaiting review
            </p>
            <article
              v-for="submission in submissions"
              :key="submission.id"
              class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3"
            >
              <div class="flex items-center justify-between gap-3">
                <div>
                  <h3 class="font-medium text-gray-900 dark:text-white">
                    {{ submission.student?.first_name }} {{ submission.student?.last_name }}
                  </h3>
                  <p class="text-xs text-gray-500">{{ submission.student?.admission_number }} · {{ formatDate(submission.submitted_at) }}</p>
                </div>
                <span v-if="submission.evaluated_at" class="text-xs font-medium text-emerald-700">Evaluated</span>
                <span v-else class="text-xs font-medium text-amber-700">Pending evaluation</span>
              </div>
              <p class="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">{{ submission.submission_text }}</p>
              <div v-if="canReviewGrade" class="grid gap-3 sm:grid-cols-[9rem_1fr_auto] sm:items-end">
                <label class="text-xs text-gray-600 dark:text-gray-300">
                  Marks
                  <input v-model.number="gradeDrafts[submission.id].marks" type="number" min="0" step="0.01" class="input-field mt-1" />
                </label>
                <label class="text-xs text-gray-600 dark:text-gray-300">
                  Teacher remarks
                  <input v-model="gradeDrafts[submission.id].remarks" maxlength="5000" class="input-field mt-1" />
                </label>
                <button class="btn-primary" :disabled="savingGradeId === submission.id" @click="saveGrade(submission)">
                  {{ savingGradeId === submission.id ? 'Saving…' : 'Save grade' }}
                </button>
              </div>
              <p v-else-if="submission.evaluated_at" class="text-sm text-gray-600 dark:text-gray-300">
                Mark: {{ submission.marks }}<span v-if="submission.remarks"> · {{ submission.remarks }}</span>
              </p>
            </article>
          </div>
        </template>
      </Modal>

      <Modal :show="Boolean(pendingDeleteId)" size="sm" @close="pendingDeleteId = ''">
        <template #header>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Delete homework?</h2>
        </template>
        <template #body>
          <p class="text-sm text-gray-600 dark:text-gray-300">
            This homework record will be permanently removed.
          </p>
        </template>
        <template #footer>
          <div class="flex justify-end gap-2">
            <button class="btn-secondary" @click="pendingDeleteId = ''">Cancel</button>
            <button class="btn-danger" @click="confirmRemove">Delete</button>
          </div>
        </template>
      </Modal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, reactive } from 'vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import Modal from '~/components/ui/Modal.vue';
import Pagination from '~/components/ui/Pagination.vue';
import { Homeworks } from '~/api/students/academic-services';
import { StudyMaterials } from '~/api/shared/dynamic-entities';
import { useAcademics } from '~/composables/useAcademics';
import { useAuth } from '~/composables/useAuth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useToast } from '~/composables/useToast';
import { extractList, apiErrorMessage } from '~/utils/list-response';
import { useExportService } from '~/composables/useExportService';
import { safeStudyMaterialUrl } from '~/utils/safeStudyMaterialUrl';
import { getHomeworkStudyMaterials } from '~/utils/homeworkStudyMaterials';

const { showToast } = useToast();
const { generateReport, isGenerating } = useExportService();
const { user } = useAuth();
const { effectiveBranchId, currentSchool, availableBranches } = useGlobalBranch();
const allBranchesReadOnly = computed(() =>
  !effectiveBranchId.value && ['admin', 'super_admin'].includes(user.value?.role)
);
const { classOptions, academicYears, currentAcademicYear, fetchAcademicYears, fetchClasses } = useAcademics();
const items = ref<any[]>([]);
const showExportColumns = ref(false);
const homeworkExportColumns = ref([
  { key: 'title', label: 'Title', visible: true },
  { key: 'class_name', label: 'Class', visible: true },
  { key: 'section_name', label: 'Section', visible: true },
  { key: 'subject_name', label: 'Subject', visible: true },
  { key: 'academic_year', label: 'Academic year', visible: true },
  { key: 'due_date', label: 'Due date', visible: true },
  { key: 'branch_name', label: 'Branch', visible: true }
]);
const selectedHomeworkExportColumns = computed(() => homeworkExportColumns.value.filter(column => column.visible));
const pagination = reactive({ page: 1, limit: 10, total: 0, totalPages: 0 });
const sortBy = ref<'title' | 'due_date'>('due_date');
const sortOrder = ref<'ASC' | 'DESC'>('DESC');
const filterClassId = ref('');
const searchQuery = ref('');
const selectedAcademicYear = ref('');
const showForm = ref(false);
const loading = ref(false);
const saving = ref(false);
const errorMessage = ref('');
const editingId = ref('');
const pendingDeleteId = ref('');
const selectedAttachmentFile = ref<File | null>(null);
const selectedStudyMaterialId = ref('');
const studyMaterials = ref<any[]>([]);
const loadingStudyMaterials = ref(false);
const studyMaterialsError = ref('');
const attachmentInput = ref<HTMLInputElement | null>(null);
const form = ref<any>({
  title: '',
  description: '',
  class_id: '',
  section_id: '',
  subject_id: '',
  attachment_url: '',
  due_date: '',
  academic_year: ''
});
const placementOptions = ref<any>({ subjects: [], sections: [], assignments: [], can_assign_general: true });
const placementOptionsLoading = ref(false);
const placementOptionsError = ref('');
const activeHomework = ref<any>(null);
const submissions = ref<any[]>([]);
const submissionSummary = ref<any>({ submitted: 0, evaluated: 0, pending_evaluation: 0 });
const loadingSubmissions = ref(false);
const submissionError = ref('');
const savingGradeId = ref('');
const gradeDrafts = ref<Record<string, { marks: number | null; remarks: string }>>({});
let searchTimeout: ReturnType<typeof setTimeout> | undefined;
const formatDate = (value: string) => value ? new Date(value).toLocaleString() : '—';
const academicYearOptions = computed(() => academicYears.value.map(year => ({
  value: year.name,
  label: `${year.name}${year.is_current ? ' (Current)' : ''}`
})));
const homeworkStudyMaterials = computed(() => getHomeworkStudyMaterials(studyMaterials.value, form.value.subject_id));
const isPastDue = (dueDate: string) => {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return Boolean(dueDate && dueDate < today);
};
const homeworkStats = computed(() => [
  { label: 'Matching assignments', value: pagination.total },
  { label: 'Open (this page)', value: items.value.filter(item => !isPastDue(item.due_date)).length },
  { label: 'Past due (this page)', value: items.value.filter(item => isPastDue(item.due_date)).length },
  { label: 'Unassigned session (this page)', value: items.value.filter(item => !item.academic_year).length }
]);

const canReview = (item: any) =>
  ['admin', 'super_admin', 'branch_admin'].includes(user.value?.role) || item.created_by === user.value?.id;
const canReviewGrade = computed(() => ['admin', 'super_admin', 'branch_admin', 'teacher'].includes(user.value?.role));
const homeworkSubjectOptions = computed(() => [
  ...(placementOptions.value.can_assign_general ? [{ value: '', label: 'General / no subject' }] : []),
  ...placementOptions.value.subjects.map((subject: any) => ({ value: subject.id, label: subject.name }))
]);
const homeworkSectionOptions = computed(() => {
  if (user.value?.role !== 'teacher') {
    return [{ value: '', label: 'All sections' }, ...placementOptions.value.sections.map((section: any) => ({ value: section.id, label: section.name }))];
  }
  const eligibleAssignments = placementOptions.value.assignments.filter((assignment: any) =>
    form.value.subject_id
      ? assignment.subject_id === form.value.subject_id
      : !assignment.subject_id
  );
  if (eligibleAssignments.some((assignment: any) => !assignment.section_id)) {
    return [{ value: '', label: 'All assigned sections' }, ...placementOptions.value.sections.map((section: any) => ({ value: section.id, label: section.name }))];
  }
  const allowedIds = new Set(eligibleAssignments.map((assignment: any) => assignment.section_id));
  return placementOptions.value.sections
    .filter((section: any) => allowedIds.has(section.id))
    .map((section: any) => ({ value: section.id, label: section.name }));
});

const openSubmissions = async (item: any) => {
  activeHomework.value = item;
  loadingSubmissions.value = true;
  submissionError.value = '';
  try {
    const response: any = await Homeworks.getSubmissions(item.id);
    submissions.value = response.data?.submissions || [];
    submissionSummary.value = response.data || { submitted: 0, evaluated: 0, pending_evaluation: 0 };
    gradeDrafts.value = Object.fromEntries(submissions.value.map(submission => [submission.id, {
      marks: submission.marks === null ? null : Number(submission.marks),
      remarks: submission.remarks || ''
    }]));
  } catch (error: any) {
    submissionError.value = apiErrorMessage(error);
  } finally {
    loadingSubmissions.value = false;
  }
};

const saveGrade = async (submission: any) => {
  const draft = gradeDrafts.value[submission.id];
  if (!draft || typeof draft.marks !== 'number' || !Number.isFinite(draft.marks) || draft.marks < 0) {
    showToast('Enter a valid non-negative mark', 'error');
    return;
  }
  savingGradeId.value = submission.id;
  try {
    await Homeworks.gradeSubmission(submission.id, draft);
    showToast('Grade saved', 'success');
    if (activeHomework.value) await openSubmissions(activeHomework.value);
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  } finally {
    savingGradeId.value = '';
  }
};

watch(effectiveBranchId, () => {
  onBranchChange();
});

watch(currentSchool, () => {
  selectedAcademicYear.value = '';
  onBranchChange();
});

watch(searchQuery, () => {
  pagination.page = 1;
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(load, 250);
});

onUnmounted(() => clearTimeout(searchTimeout));

const branchParams = () => ({
  ...(currentSchool.value?.id || user.value?.school_id
    ? { school_id: currentSchool.value?.id || user.value?.school_id }
    : {}),
  ...(effectiveBranchId.value ? { branch_id: effectiveBranchId.value } : {})
});

const loadPlacementOptions = async () => {
  if (!form.value.class_id) {
    placementOptions.value = { subjects: [], sections: [], assignments: [], can_assign_general: true };
    return;
  }
  placementOptionsLoading.value = true;
  placementOptionsError.value = '';
  try {
    const response: any = await Homeworks.getPlacementOptions({
      ...branchParams(),
      class_id: form.value.class_id,
      ...(form.value.academic_year ? { academic_year: form.value.academic_year } : {})
    });
    placementOptions.value = response.data || {
      subjects: [], sections: [], assignments: [], can_assign_general: false
    };
  } catch (error: any) {
    placementOptions.value = { subjects: [], sections: [], assignments: [], can_assign_general: false };
    placementOptionsError.value = apiErrorMessage(error);
  } finally {
    placementOptionsLoading.value = false;
  }
};

const loadStudyMaterials = async () => {
  selectedStudyMaterialId.value = '';
  studyMaterialsError.value = '';
  if (!form.value.class_id) {
    studyMaterials.value = [];
    return;
  }
  loadingStudyMaterials.value = true;
  try {
    const response: any = await StudyMaterials.list({
      ...branchParams(),
      class_id: form.value.class_id,
      page: 1,
      limit: 100
    });
    studyMaterials.value = extractList(response);
  } catch (error: any) {
    studyMaterials.value = [];
    studyMaterialsError.value = apiErrorMessage(error);
  } finally {
    loadingStudyMaterials.value = false;
  }
};

const applyStudyMaterial = () => {
  const material = homeworkStudyMaterials.value.find(item => item.id === selectedStudyMaterialId.value);
  if (!material) return;
  form.value.attachment_url = safeStudyMaterialUrl(material.external_url || material.notes);
  clearSelectedAttachment();
};

const onPlacementClassChange = () => {
  form.value.subject_id = '';
  form.value.section_id = '';
  void Promise.all([loadPlacementOptions(), loadStudyMaterials()]);
};

const loadClasses = async () => {
  await fetchClasses({
    schoolId: currentSchool.value?.id || user.value?.school_id,
    ...(effectiveBranchId.value ? { branchId: effectiveBranchId.value } : {})
  });
};

const load = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response: any = await Homeworks.getAll({
      ...branchParams(),
      ...(selectedAcademicYear.value && selectedAcademicYear.value !== 'all'
        ? { academic_year: selectedAcademicYear.value }
        : {}),
      ...(filterClassId.value ? { class_id: filterClassId.value } : {}),
      ...(searchQuery.value ? { search: searchQuery.value } : {}),
      page: pagination.page,
      limit: pagination.limit,
      sort_by: sortBy.value,
      sort_order: sortOrder.value
    });
    const nextPagination = response.data?.pagination;
    if (nextPagination && pagination.page > Math.max(nextPagination.totalPages, 1)) {
      pagination.page = Math.max(nextPagination.totalPages, 1);
      await load();
      return;
    }
    items.value = extractList(response, ['homeworks']);
    Object.assign(pagination, nextPagination || {
      page: 1, limit: pagination.limit, total: items.value.length, totalPages: 1
    });
  } catch (error: any) {
    errorMessage.value = apiErrorMessage(error);
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  pagination.page = 1;
  load();
};

const toggleSort = (field: 'title' | 'due_date') => {
  sortOrder.value = sortBy.value === field && sortOrder.value === 'ASC' ? 'DESC' : 'ASC';
  sortBy.value = field;
  applyFilters();
};

const changePage = (page: number) => {
  pagination.page = page;
  load();
};

const changePageSize = (limit: number) => {
  pagination.limit = limit;
  applyFilters();
};

const exportHomeworks = async (format: string) => {
  try {
    await generateReport({
      report_type: 'homeworks',
      format,
      filters: {
        ...branchParams(),
        ...(selectedAcademicYear.value && selectedAcademicYear.value !== 'all'
          ? { academic_year: selectedAcademicYear.value }
          : {}),
        ...(filterClassId.value ? { class_id: filterClassId.value } : {}),
        ...(searchQuery.value ? { search: searchQuery.value } : {}),
        sort_by: sortBy.value,
        sort_order: sortOrder.value
      },
      columns: selectedHomeworkExportColumns.value.map(({ key, label }) => ({ key, header: label }))
    });
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  }
};

const onBranchChange = async () => {
  showForm.value = false;
  pendingDeleteId.value = '';
  activeHomework.value = null;
  submissions.value = [];
  filterClassId.value = '';
  pagination.page = 1;
  await loadClasses();
  await fetchAcademicYears(currentSchool.value?.id || user.value?.school_id);
  if (!selectedAcademicYear.value) {
    selectedAcademicYear.value = currentAcademicYear.value?.name || academicYears.value[0]?.name || 'all';
  }
  await load();
};

const openCreate = () => {
  if (allBranchesReadOnly.value) return;
  clearSelectedAttachment();
  editingId.value = '';
  form.value = {
    title: '', description: '', class_id: '', section_id: '', subject_id: '', attachment_url: '', due_date: '',
    academic_year: selectedAcademicYear.value === 'all'
      ? currentAcademicYear.value?.name || ''
      : selectedAcademicYear.value
  };
  placementOptions.value = { subjects: [], sections: [], assignments: [], can_assign_general: true };
  placementOptionsError.value = '';
  studyMaterials.value = [];
  studyMaterialsError.value = '';
  showForm.value = true;
};

const openEdit = (item: any) => {
  if (allBranchesReadOnly.value) return;
  clearSelectedAttachment();
  editingId.value = item.id;
  form.value = {
    title: item.title || '',
    description: item.description || '',
    class_id: item.class_id || '',
    section_id: item.section_id || '',
    subject_id: item.subject_id || '',
    attachment_url: item.attachment_url || '',
    due_date: item.due_date || '',
    academic_year: item.academic_year || ''
  };
  showForm.value = true;
  void Promise.all([loadPlacementOptions(), loadStudyMaterials()]);
};

const clearSelectedAttachment = () => {
  selectedAttachmentFile.value = null;
  if (attachmentInput.value) attachmentInput.value.value = '';
};

const selectHomeworkAttachment = (event: Event) => {
  const input = event.target as HTMLInputElement;
  selectedAttachmentFile.value = input.files?.[0] || null;
  selectedStudyMaterialId.value = '';
  if (selectedAttachmentFile.value) form.value.attachment_url = '';
};

const save = async () => {
  if (allBranchesReadOnly.value) return;
  if (!form.value.title.trim() || !form.value.class_id || !form.value.due_date) {
    showToast('Title, class and due date are required', 'error');
    return;
  }
  if (user.value?.role === 'teacher' && !placementOptions.value.can_assign_general && !form.value.subject_id) {
    showToast('Select one of your assigned subjects', 'error');
    return;
  }
  if (
    user.value?.role === 'teacher' &&
    homeworkSectionOptions.value.length &&
    !homeworkSectionOptions.value.some((option: any) => !option.value) &&
    !form.value.section_id
  ) {
    showToast('Select your assigned section', 'error');
    return;
  }

  saving.value = true;
  try {
    const payload = {
      ...form.value,
      subject_id: form.value.subject_id || null,
      section_id: form.value.section_id || null,
      attachment_url: form.value.attachment_url.trim() || null,
      ...branchParams()
    };
    let requestData: any = payload;
    if (selectedAttachmentFile.value) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, value == null ? '' : String(value));
      });
      formData.append('attachment', selectedAttachmentFile.value);
      requestData = formData;
    }
    if (editingId.value) await Homeworks.update(editingId.value, requestData);
    else await Homeworks.create(requestData);
    showForm.value = false;
    clearSelectedAttachment();
    await load();
    showToast('Homework saved', 'success');
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  } finally {
    saving.value = false;
  }
};

const requestRemove = (id: string) => {
  if (allBranchesReadOnly.value) return;
  pendingDeleteId.value = id;
};

const confirmRemove = async () => {
  if (!pendingDeleteId.value) return;
  const id = pendingDeleteId.value;
  pendingDeleteId.value = '';
  try {
    await Homeworks.remove(id);
    await load();
    showToast('Deleted', 'success');
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  }
};

onMounted(async () => {
  await onBranchChange();
});
</script>
