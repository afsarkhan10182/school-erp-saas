<template>
  <main v-if="canManageMaterials" class="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
    <header>
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Study Center</h1>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Share class materials with students in the selected branch.
      </p>
    </header>

    <p v-if="allBranchesReadOnly" role="status" class="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
      Select a specific branch in the global selector to share materials. All Branches is read-only.
    </p>

    <section class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 class="text-lg font-medium text-gray-900 dark:text-white">Upload new material</h2>
      <form class="mt-4 grid gap-4 sm:grid-cols-2" @submit.prevent="save">
        <label class="text-sm text-gray-700 dark:text-gray-300">
          Grade / class
          <select v-model="form.class_id" class="input-field mt-1" required :disabled="allBranchesReadOnly || classesLoading" @change="loadSubjects">
            <option value="">Select a class</option>
            <option v-for="item in classes" :key="item.id" :value="item.id">{{ item.name }}</option>
          </select>
        </label>
        <label class="text-sm text-gray-700 dark:text-gray-300">
          Learning area / subject
          <select v-model="form.subject_id" class="input-field mt-1" required :disabled="!form.class_id || subjectsLoading">
            <option value="">{{ subjectsLoading ? 'Loading subjects…' : 'Select a subject' }}</option>
            <option v-for="subject in subjects" :key="subject.id" :value="subject.id">{{ subject.name }}</option>
          </select>
        </label>
        <label class="text-sm text-gray-700 dark:text-gray-300">
          Syllabus topic <span class="text-gray-500">(optional)</span>
          <input v-model.trim="form.topic" class="input-field mt-1" maxlength="160" />
        </label>
        <label class="text-sm text-gray-700 dark:text-gray-300">
          Material title
          <input v-model.trim="form.title" class="input-field mt-1" maxlength="180" required />
        </label>
        <label class="text-sm text-gray-700 dark:text-gray-300">
          Resource type
          <select v-model="form.resource_type" class="input-field mt-1" @change="form.external_url = ''; selectedFile = null">
            <option value="file">File</option>
            <option value="video">Video link</option>
            <option value="link">Other link</option>
          </select>
        </label>
        <label v-if="form.resource_type === 'file'" class="text-sm text-gray-700 dark:text-gray-300">
          Choose file <span class="text-gray-500">(PDF, image, Word; max 5 MB)</span>
          <input class="mt-2 block w-full text-sm" type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx" required @change="onFileChange" />
        </label>
        <label v-else class="text-sm text-gray-700 dark:text-gray-300 sm:col-span-2">
          {{ form.resource_type === 'video' ? 'Video URL' : 'Resource URL' }}
          <input v-model.trim="form.external_url" class="input-field mt-1" type="url" placeholder="https://…" required />
        </label>
        <div class="sm:col-span-2">
          <p v-if="errorMessage" role="alert" class="mb-3 text-sm text-red-600">{{ errorMessage }}</p>
          <button class="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50" :disabled="saving || allBranchesReadOnly">
            {{ saving ? 'Uploading…' : 'Share material' }}
          </button>
        </div>
      </form>
    </section>

    <section class="space-y-4">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="text-sm text-gray-700 dark:text-gray-300">
          Grade / class
          <select v-model="filterClassId" class="input-field mt-1">
            <option value="">All assigned classes</option>
            <option v-for="item in classes" :key="item.id" :value="item.id">{{ item.name }}</option>
          </select>
        </label>
        <label class="text-sm text-gray-700 dark:text-gray-300">
          Search materials
          <input v-model.trim="search" class="input-field mt-1" type="search" placeholder="Title, subject, or topic" />
        </label>
      </div>
      <p v-if="listError" role="alert" class="text-sm text-red-600">{{ listError }}</p>
      <div v-if="loading" class="py-8 text-center text-sm text-gray-500">Loading materials…</div>
      <div v-else-if="materials.length" class="grid gap-3 md:grid-cols-2">
        <article v-for="item in materials" :key="item.id" class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 class="font-medium text-gray-900 dark:text-white">{{ item.title }}</h3>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {{ item.subject_name || 'Subject' }}<span v-if="item.topic"> · {{ item.topic }}</span>
              </p>
              <p class="mt-1 text-xs capitalize text-gray-500">{{ item.resource_type }}<span v-if="className(item.class_id)"> · {{ className(item.class_id) }}</span></p>
            </div>
            <button v-if="item.file_available" type="button" class="shrink-0 text-sm font-medium text-indigo-600 hover:underline" @click="download(item)">Download</button>
            <a v-else-if="safeStudyMaterialUrl(item.external_url || item.notes)" :href="safeStudyMaterialUrl(item.external_url || item.notes)" target="_blank" rel="noopener noreferrer" class="shrink-0 text-sm font-medium text-indigo-600 hover:underline">Open link</a>
          </div>
          <button v-if="canDelete(item)" type="button" class="mt-3 text-xs text-red-600 hover:underline" @click="remove(item)">Delete</button>
        </article>
      </div>
      <p v-else class="rounded-xl border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-600">
        {{ search ? 'No materials match your search.' : 'No study materials have been shared for this class yet.' }}
      </p>
      <div v-if="pagination.totalPages > 1" class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
        <span>Page {{ pagination.page }} of {{ pagination.totalPages }} · {{ pagination.total }} materials</span>
        <div class="flex gap-2">
          <button type="button" class="rounded border px-3 py-1.5 disabled:opacity-50" :disabled="pagination.page <= 1 || loading" @click="changePage(-1)">Previous</button>
          <button type="button" class="rounded border px-3 py-1.5 disabled:opacity-50" :disabled="pagination.page >= pagination.totalPages || loading" @click="changePage(1)">Next</button>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { StudyMaterials } from '~/api/shared/dynamic-entities';
import { Homeworks } from '~/api/students/academic-services';
import { useAcademics } from '~/composables/useAcademics';
import { useAuth } from '~/composables/useAuth';
import { useCommon } from '~/composables/useCommon';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useToast } from '~/composables/useToast';
import { apiErrorMessage, extractList } from '~/utils/list-response';
import { safeStudyMaterialUrl } from '~/utils/safeStudyMaterialUrl';
import { canManageStudyMaterials } from '~/utils/studyMaterialAccess';
import { homePathForRole } from '~/utils/home-path';

const { user } = useAuth();
const canManageMaterials = computed(() => canManageStudyMaterials(user.value?.role));
const { effectiveBranchId, currentSchool } = useGlobalBranch();
const { classes, currentAcademicYear, fetchAcademicYears, fetchClasses } = useAcademics();
const { downloadFile } = useCommon();
const { showToast } = useToast();
const classesLoading = ref(false);
const subjectsLoading = ref(false);
const loading = ref(false);
const saving = ref(false);
const errorMessage = ref('');
const listError = ref('');
const materials = ref<any[]>([]);
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 });
const subjects = ref<any[]>([]);
const selectedFile = ref<File | null>(null);
const filterClassId = ref('');
const search = ref('');
const form = ref({ class_id: '', subject_id: '', topic: '', title: '', resource_type: 'file', external_url: '' });
const allBranchesReadOnly = computed(() => !effectiveBranchId.value && ['admin', 'super_admin'].includes(user.value?.role || ''));
let searchTimer: ReturnType<typeof setTimeout> | undefined;

const scopeParams = () => ({
  ...(currentSchool.value?.id || user.value?.school_id ? { school_id: currentSchool.value?.id || user.value?.school_id } : {}),
  ...(effectiveBranchId.value ? { branch_id: effectiveBranchId.value } : {})
});

const loadClasses = async () => {
  classesLoading.value = true;
  try {
    const schoolId = currentSchool.value?.id || user.value?.school_id;
    await Promise.all([
      fetchClasses({ schoolId, ...(effectiveBranchId.value ? { branchId: effectiveBranchId.value } : {}) }),
      fetchAcademicYears(schoolId)
    ]);
  } catch (error) {
    showToast(apiErrorMessage(error), 'error');
  } finally {
    classesLoading.value = false;
  }
};

const loadSubjects = async () => {
  form.value.subject_id = '';
  subjects.value = [];
  if (!form.value.class_id) return;
  const academicYear = currentAcademicYear.value?.code || currentAcademicYear.value?.name;
  if (!academicYear) {
    errorMessage.value = 'No current academic year is configured for this school.';
    return;
  }
  subjectsLoading.value = true;
  try {
    const response: any = await Homeworks.getPlacementOptions({ ...scopeParams(), class_id: form.value.class_id, academic_year: academicYear });
    subjects.value = response.data?.subjects || [];
  } catch (error) {
    errorMessage.value = apiErrorMessage(error);
  } finally {
    subjectsLoading.value = false;
  }
};

const loadMaterials = async () => {
  loading.value = true;
  listError.value = '';
  try {
    const response: any = await StudyMaterials.list({
      ...(effectiveBranchId.value ? { branch_id: effectiveBranchId.value } : {}),
      ...(filterClassId.value ? { class_id: filterClassId.value } : {}),
      ...(search.value ? { search: search.value } : {}),
      page: pagination.value.page,
      limit: pagination.value.limit
    });
    materials.value = extractList(response);
    if (response.pagination) pagination.value = { ...pagination.value, ...response.pagination };
  } catch (error) {
    listError.value = apiErrorMessage(error);
    materials.value = [];
    pagination.value = { ...pagination.value, total: 0, totalPages: 0 };
  } finally {
    loading.value = false;
  }
};

const changePage = (direction: number) => {
  pagination.value.page += direction;
  loadMaterials();
};

const onFileChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0] || null;
  selectedFile.value = file;
  errorMessage.value = file && file.size > 5 * 1024 * 1024 ? 'Choose a file smaller than 5 MB.' : '';
};

const save = async () => {
  errorMessage.value = '';
  if (allBranchesReadOnly.value) return;
  if (form.value.resource_type === 'file' && (!selectedFile.value || selectedFile.value.size > 5 * 1024 * 1024)) {
    errorMessage.value = 'Choose a supported file smaller than 5 MB.';
    return;
  }
  if (form.value.resource_type !== 'file' && !safeStudyMaterialUrl(form.value.external_url)) {
    errorMessage.value = 'Enter a valid HTTPS URL.';
    return;
  }
  const data = new FormData();
  for (const [key, value] of Object.entries({ ...form.value, ...scopeParams() })) data.append(key, String(value));
  if (selectedFile.value) data.append('file', selectedFile.value);
  saving.value = true;
  try {
    await StudyMaterials.create(data);
    form.value = { class_id: '', subject_id: '', topic: '', title: '', resource_type: 'file', external_url: '' };
    subjects.value = [];
    selectedFile.value = null;
    showToast('Study material shared', 'success');
    await loadMaterials();
  } catch (error) {
    errorMessage.value = apiErrorMessage(error);
  } finally {
    saving.value = false;
  }
};

const className = (id: string) => classes.value.find(item => item.id === id)?.name || '';
const canDelete = (item: any) => user.value?.role !== 'teacher' || item.created_by === user.value?.id;
const remove = async (item: any) => {
  if (!window.confirm(`Delete “${item.title}”?`)) return;
  try {
    await StudyMaterials.remove(item.id);
    showToast('Study material deleted', 'success');
    await loadMaterials();
  } catch (error) {
    showToast(apiErrorMessage(error), 'error');
  }
};

const download = async (item: any) => {
  try {
    const response = await StudyMaterials.download(item.id);
    const disposition = response.headers?.['content-disposition'] || '';
    const name = disposition.match(/filename="?([^";]+)"?/i)?.[1] || `${item.title || 'study-material'}`;
    downloadFile(response.data, name, response.headers?.['content-type'] || 'application/octet-stream');
  } catch (error) {
    showToast(apiErrorMessage(error), 'error');
  }
};

watch(search, () => {
  pagination.value.page = 1;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadMaterials, 250);
});
watch(effectiveBranchId, async () => {
  filterClassId.value = '';
  form.value.class_id = '';
  subjects.value = [];
  pagination.value.page = 1;
  await Promise.all([loadClasses(), loadMaterials()]);
});
watch(filterClassId, () => {
  pagination.value.page = 1;
  loadMaterials();
});
onMounted(async () => {
  if (!canManageMaterials.value) {
    await navigateTo(homePathForRole(user.value?.role), { replace: true });
    return;
  }
  await Promise.all([loadClasses(), loadMaterials()]);
});
onUnmounted(() => clearTimeout(searchTimer));
</script>
