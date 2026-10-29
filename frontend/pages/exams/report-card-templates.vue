<template>
  <div class="space-y-6 p-4 sm:p-6">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Report Card Templates</h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Copy a template for this school, then configure the options used by the current PDF
          report-card renderer.
        </p>
      </div>
      <button
        class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        :disabled="!schoolId || !templates.length"
        @click="startCopy(templates[0])"
      >
        Copy a template
      </button>
    </header>

    <aside class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
      PDF cards currently support rank, remarks, and footer text. Saved HTML, CSS, and header markup
      are not applied by this PDF renderer.
    </aside>

    <div
      v-if="!schoolId"
      class="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
    >
      Select a school from the global school selector to manage its report-card templates.
    </div>

    <div
      v-else-if="loading"
      class="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
    >
      Loading templates…
    </div>

    <div
      v-else-if="error"
      role="alert"
      class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200"
    >
      {{ error }}
      <button class="ml-2 font-semibold underline" @click="load">Retry</button>
    </div>

    <div v-else-if="!templates.length" class="rounded-xl border border-gray-200 p-8 text-center dark:border-gray-700">
      <p class="text-sm text-gray-600 dark:text-gray-300">No active report-card templates are available.</p>
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="template in templates"
        :key="template.id"
        class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="font-semibold text-gray-900 dark:text-white">{{ template.name }}</h2>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ template.school_id === schoolId ? 'School template' : 'Global template · read-only' }}
              <span v-if="template.is_default"> · Default</span>
            </p>
          </div>
          <span class="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200">
            {{ template.report_type === 'detailed' ? 'Detailed' : 'Student-wise' }}
          </span>
        </div>
        <p class="mt-3 min-h-10 text-sm text-gray-600 dark:text-gray-300">
          {{ template.description || 'No description' }}
        </p>
        <dl class="mt-4 space-y-1 text-xs text-gray-500 dark:text-gray-400">
          <div class="flex justify-between"><dt>Rank</dt><dd>{{ template.config?.show_rank ? 'Shown' : 'Hidden' }}</dd></div>
          <div class="flex justify-between"><dt>Remarks</dt><dd>{{ template.config?.show_remarks === false ? 'Hidden' : 'Shown' }}</dd></div>
        </dl>
        <div class="mt-5 flex justify-end gap-2">
          <button
            v-if="template.school_id === schoolId"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            @click="startEdit(template)"
          >
            Edit PDF options
          </button>
          <button
            v-else
            class="rounded-lg border border-indigo-300 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
            @click="startCopy(template)"
          >
            Copy to school
          </button>
        </div>
      </article>
    </div>

    <div
      v-if="formMode"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="closeForm"
    >
      <form
        class="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800"
        @submit.prevent="save"
      >
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ formMode === 'copy' ? 'Copy report-card template' : 'Edit PDF options' }}
          </h2>
          <p v-if="sourceTemplate" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Source: {{ sourceTemplate.name }} · {{ sourceTemplate.report_type }}
          </p>
        </div>

        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Template name
          <input v-model="form.name" required maxlength="255" class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
        </label>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Description
          <textarea v-model="form.description" rows="2" class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
        </label>
        <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
          <input v-model="form.show_rank" type="checkbox" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
          Show student rank
        </label>
        <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
          <input v-model="form.show_remarks" type="checkbox" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
          Show teacher remarks
        </label>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Footer text
          <textarea v-model="form.footer_template" maxlength="1000" rows="2" class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
        </label>

        <p v-if="formError" role="alert" class="text-sm text-red-600 dark:text-red-300">{{ formError }}</p>
        <div class="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
          <button type="button" class="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:text-gray-200" :disabled="saving" @click="closeForm">Cancel</button>
          <button type="submit" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50" :disabled="saving">
            {{ saving ? 'Saving…' : formMode === 'copy' ? 'Copy template' : 'Save options' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { reportTemplateApi, type ReportTemplate } from '~/api/academic/report-templates';
import { useAuth } from '~/composables/useAuth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useToast } from '~/composables/useToast';

definePageMeta({
  requiresRole: ['admin', 'super_admin']
});

const { user } = useAuth();
const { currentSchool } = useGlobalBranch();
const { showToast } = useToast();
const schoolId = computed(() => currentSchool.value?.id || user.value?.school_id || '');
const templates = ref<ReportTemplate[]>([]);
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const formError = ref('');
const formMode = ref<'copy' | 'edit' | ''>('');
const sourceTemplate = ref<ReportTemplate | null>(null);
const form = reactive({ name: '', description: '', show_rank: false, show_remarks: true, footer_template: '' });

const responseRows = (response: any): ReportTemplate[] =>
  Array.isArray(response?.data) ? response.data : Array.isArray(response?.data?.templates) ? response.data.templates : [];

async function load() {
  if (!schoolId.value) {
    templates.value = [];
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    const response = await reportTemplateApi.getAll({ school_id: schoolId.value });
    templates.value = responseRows(response);
  } catch (cause: any) {
    error.value = cause?.response?.data?.message || cause?.message || 'Could not load templates';
    templates.value = [];
  } finally {
    loading.value = false;
  }
}

function setForm(template: ReportTemplate) {
  sourceTemplate.value = template;
  form.name = template.name;
  form.description = template.description || '';
  form.show_rank = Boolean(template.config?.show_rank);
  form.show_remarks = template.config?.show_remarks !== false;
  form.footer_template = template.footer_template || '';
  formError.value = '';
}

function startCopy(template: ReportTemplate) {
  setForm(template);
  formMode.value = 'copy';
  form.name = `${template.name} (Copy)`;
}

function startEdit(template: ReportTemplate) {
  setForm(template);
  formMode.value = 'edit';
}

function closeForm() {
  formMode.value = '';
  sourceTemplate.value = null;
  formError.value = '';
}

async function save() {
  if (!sourceTemplate.value || !schoolId.value) return;
  saving.value = true;
  formError.value = '';
  const payload = {
    name: form.name,
    description: form.description || null,
    footer_template: form.footer_template || null,
    config: { show_rank: form.show_rank, show_remarks: form.show_remarks },
    school_id: schoolId.value
  };
  try {
    if (formMode.value === 'copy') {
      await reportTemplateApi.create({ ...payload, source_template_id: sourceTemplate.value.id });
      showToast('Template copied to this school', 'success');
    } else {
      await reportTemplateApi.update({ ...payload, id: sourceTemplate.value.id });
      showToast('Report-card PDF options saved', 'success');
    }
    closeForm();
    await load();
  } catch (cause: any) {
    formError.value = cause?.response?.data?.message || cause?.message || 'Could not save template';
  } finally {
    saving.value = false;
  }
}

watch(schoolId, load);
onMounted(load);
</script>
