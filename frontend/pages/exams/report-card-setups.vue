<template>
  <main class="min-h-screen bg-gray-50 px-4 py-6 dark:bg-gray-900 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-6xl space-y-6">
      <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Report Card Setups</h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Configure weighted exams and the template used for report cards in this branch.
          </p>
        </div>
        <button
          class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          :disabled="!branchId"
          @click="startNew"
        >
          New setup
        </button>
      </header>

      <p
        v-if="!branchId"
        class="rounded-md bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-100"
      >
        Select a school and one branch from the global selectors to manage report-card setups.
      </p>
      <p
        v-else-if="error"
        role="alert"
        class="rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200"
      >
        {{ error }}
      </p>

      <section v-if="showForm" class="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ editingId ? 'Edit setup' : 'Create setup' }}
          </h2>
          <button class="text-sm text-gray-600 underline dark:text-gray-300" @click="cancelEdit">
            Cancel
          </button>
        </div>
        <form class="space-y-4" @submit.prevent="save">
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200"
              >Setup name
              <input
                v-model.trim="form.name"
                required
                maxlength="255"
                class="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-900"
              />
            </label>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200"
              >Report-card template
              <select
                v-model="form.template_id"
                required
                class="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-900"
              >
                <option value="" disabled>Select template</option>
                <option v-for="item in templates" :key="item.id" :value="item.id">
                  {{ item.name }}
                </option>
              </select>
            </label>
          </div>
          <label class="block max-w-xs text-sm font-medium text-gray-700 dark:text-gray-200"
            >Page orientation
            <select
              v-model="form.orientation"
              class="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-900"
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </label>

          <div class="space-y-3">
            <div class="flex items-center justify-between gap-2">
              <h3 class="font-medium text-gray-900 dark:text-white">Exams and weightage</h3>
              <button
                type="button"
                class="rounded border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600"
                @click="addExam"
              >
                Add exam
              </button>
            </div>
            <div
              v-for="(entry, index) in form.exam_entries"
              :key="index"
              class="grid grid-cols-[1fr_7rem_auto] gap-2"
            >
              <select
                v-model="entry.exam_id"
                required
                class="min-w-0 rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-900"
              >
                <option value="" disabled>Select exam</option>
                <option
                  v-for="exam in availableExams(entry.exam_id)"
                  :key="exam.id"
                  :value="exam.id"
                >
                  {{ exam.name }}
                </option>
              </select>
              <label class="sr-only" :for="`weight-${index}`">Weightage percent</label>
              <input
                :id="`weight-${index}`"
                v-model.number="entry.weightage"
                type="number"
                min="0.01"
                max="100"
                step="0.01"
                required
                aria-label="Weightage percent"
                class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-900"
              />
              <button
                type="button"
                class="rounded border border-gray-300 px-3 text-sm text-red-700 disabled:opacity-40 dark:border-gray-600 dark:text-red-300"
                :disabled="form.exam_entries.length === 1"
                aria-label="Remove exam"
                @click="form.exam_entries.splice(index, 1)"
              >
                Remove
              </button>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Weights are relative contributions; each must be above 0 and at most 100.
            </p>
          </div>
          <div class="flex justify-end">
            <button
              type="submit"
              :disabled="saving || !templates.length || !exams.length"
              class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {{ saving ? 'Saving…' : 'Save setup' }}
            </button>
          </div>
        </form>
      </section>

      <section class="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
        <div v-if="loading" class="p-6 text-sm text-gray-500">Loading report-card setups…</div>
        <div v-else-if="!branchId" class="p-6 text-sm text-gray-500">
          Branch selection is required.
        </div>
        <div v-else-if="!setups.length" class="p-6 text-sm text-gray-600 dark:text-gray-300">
          No setups yet. Create one to combine exams into a report card.
        </div>
        <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
          <article
            v-for="setup in setups"
            :key="setup.id"
            class="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
          >
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="font-semibold text-gray-900 dark:text-white">{{ setup.name }}</h2>
                <span
                  class="rounded-full px-2 py-0.5 text-xs"
                  :class="
                    setup.is_published
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                  "
                  >{{ setup.is_published ? 'Published' : 'Draft' }}</span
                >
              </div>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {{ setup.template?.name || 'Template unavailable' }} · {{ setup.orientation }} ·
                {{ setup.examEntries?.length || 0 }} exams
              </p>
              <ul
                class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400"
              >
                <li v-for="item in setup.examEntries || []" :key="item.exam_id">
                  {{ item.exam?.name || 'Exam' }} — {{ item.weightage }}%
                </li>
              </ul>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                class="rounded border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600"
                @click="edit(setup)"
              >
                Edit
              </button>
              <button
                class="rounded border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-gray-600"
                :disabled="saving"
                @click="togglePublication(setup)"
              >
                {{ setup.is_published ? 'Unpublish' : 'Publish' }}
              </button>
              <button
                class="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700 dark:text-red-300"
                @click="removeSetup(setup)"
              >
                Delete
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { examApi, type Exam } from '~/api/academic/exams';
import { examReportsApi, type ReportCardTemplate } from '~/api/academic/exam-reports';
import { reportCardSetupApi, type ReportCardSetupInput } from '~/api/academic/report-card-setups';
import { useAuth } from '~/composables/useAuth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useToast } from '~/composables/useToast';

interface Setup extends ReportCardSetupInput {
  id: string;
  is_published: boolean;
  template?: { name: string };
  examEntries?: Array<{ exam_id: string; weightage: number; exam?: { name: string } }>;
}

const { user } = useAuth();
const { selectedBranchId, currentBranch, currentSchool } = useGlobalBranch();
const { showToast } = useToast();
const branchId = computed(
  () => currentBranch.value?.id || selectedBranchId.value || user.value?.branch_id || ''
);
const schoolId = computed(() => currentSchool.value?.id || user.value?.school_id || '');
const setups = ref<Setup[]>([]);
const templates = ref<ReportCardTemplate[]>([]);
const exams = ref<Exam[]>([]);
const loading = ref(false);
const saving = ref(false);
const showForm = ref(false);
const error = ref('');
const editingId = ref('');
const form = reactive<ReportCardSetupInput>({
  name: '',
  template_id: '',
  orientation: 'portrait',
  exam_entries: [{ exam_id: '', weightage: 100 }]
});

const rows = (response: any) =>
  Array.isArray(response?.data)
    ? response.data
    : response?.data?.exams || response?.data?.rows || [];
const availableExams = (selectedId: string) =>
  exams.value.filter(
    item => item.id === selectedId || !form.exam_entries.some(entry => entry.exam_id === item.id)
  );

async function load() {
  if (!branchId.value || !schoolId.value) {
    setups.value = [];
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    const [setupResponse, templateResponse, examResponse] = await Promise.all([
      reportCardSetupApi.getAll(branchId.value),
      examReportsApi.getTemplates({ school_id: schoolId.value, branch_id: branchId.value }),
      examApi.getAll({ school_id: schoolId.value, branch_id: branchId.value, limit: 200 })
    ]);
    setups.value = rows(setupResponse);
    templates.value = rows(templateResponse);
    exams.value = rows(examResponse).filter((exam: Exam) => exam.is_active);
  } catch (cause: any) {
    error.value =
      cause?.response?.data?.message || cause?.message || 'Could not load report-card setup data';
  } finally {
    loading.value = false;
  }
}

function clearForm() {
  editingId.value = '';
  form.name = '';
  form.template_id = '';
  form.orientation = 'portrait';
  form.exam_entries = [{ exam_id: '', weightage: 100 }];
}
function startNew() {
  clearForm();
  showForm.value = true;
}
function cancelEdit() {
  showForm.value = false;
  clearForm();
}
function addExam() {
  form.exam_entries.push({ exam_id: '', weightage: 100 });
}
function edit(setup: Setup) {
  editingId.value = setup.id;
  form.name = setup.name;
  form.template_id = setup.template_id;
  form.orientation = setup.orientation;
  form.exam_entries = (setup.examEntries || []).map(({ exam_id, weightage }) => ({
    exam_id,
    weightage
  }));
  showForm.value = true;
}
async function save() {
  if (new Set(form.exam_entries.map(entry => entry.exam_id)).size !== form.exam_entries.length) {
    showToast('Choose each exam only once', 'error');
    return;
  }
  saving.value = true;
  try {
    if (editingId.value)
      await reportCardSetupApi.update(
        editingId.value,
        { ...form, exam_entries: form.exam_entries.map(entry => ({ ...entry })) },
        branchId.value
      );
    else
      await reportCardSetupApi.create(
        { ...form, exam_entries: form.exam_entries.map(entry => ({ ...entry })) },
        branchId.value
      );
    showToast('Report-card setup saved', 'success');
    showForm.value = false;
    clearForm();
    await load();
  } catch (cause: any) {
    showToast(cause?.response?.data?.message || 'Could not save setup', 'error');
  } finally {
    saving.value = false;
  }
}
async function togglePublication(setup: Setup) {
  saving.value = true;
  try {
    await reportCardSetupApi.setPublished(setup.id, !setup.is_published, branchId.value);
    showToast('Publication updated', 'success');
    await load();
  } catch (cause: any) {
    showToast(cause?.response?.data?.message || 'Could not update publication', 'error');
  } finally {
    saving.value = false;
  }
}
async function removeSetup(setup: Setup) {
  if (!window.confirm(`Delete “${setup.name}”?`)) return;
  try {
    await reportCardSetupApi.delete(setup.id, branchId.value);
    showToast('Setup deleted', 'success');
    await load();
  } catch (cause: any) {
    showToast(cause?.response?.data?.message || 'Could not delete setup', 'error');
  }
}

watch([branchId, schoolId], () => {
  showForm.value = false;
  clearForm();
  void load();
});
onMounted(load);
</script>
