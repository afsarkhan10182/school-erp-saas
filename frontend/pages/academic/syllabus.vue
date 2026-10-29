<template>
  <main class="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
    <header>
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Manage Syllabus</h1>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Organize each subject into chapters and topics.
      </p>
    </header>

    <section class="grid gap-5 lg:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.6fr)]">
      <div class="space-y-5">
        <div
          class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <h2 class="text-lg font-medium text-gray-900 dark:text-white">
            Select Grade &amp; Course
          </h2>
          <label class="mt-4 block text-sm text-gray-700 dark:text-gray-300">
            Grade / class
            <select v-model="classId" class="input-field mt-1" :disabled="loadingClasses">
              <option value="">Select a class</option>
              <option v-if="isTeacher && !loadingClasses && !classOptions.length" disabled>
                No classes assigned for the current academic year
              </option>
              <option v-for="item in classOptions" :key="item.id" :value="item.id">
                {{ item.name }}{{ item.branch?.name ? ` · ${item.branch.name}` : '' }}
              </option>
            </select>
          </label>
          <label class="mt-4 block text-sm text-gray-700 dark:text-gray-300">
            Course / subject
            <select
              v-model="subjectId"
              class="input-field mt-1"
              :disabled="!classId || loadingSubjects"
            >
              <option value="">Select a subject</option>
              <option v-for="item in subjects" :key="item.id" :value="item.id">
                {{ item.name }}
              </option>
            </select>
            <span
              v-if="errorMessage && !subjectId"
              role="alert"
              class="mt-2 block text-sm text-red-600"
              >{{ errorMessage }}</span
            >
          </label>
        </div>

        <form
          v-if="subjectId"
          class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          @submit.prevent="addItem"
        >
          <h2 class="text-lg font-medium text-gray-900 dark:text-white">Add New Syllabus Item</h2>
          <label class="mt-4 block text-sm text-gray-700 dark:text-gray-300">
            Parent Chapter <span class="text-gray-500">(optional)</span>
            <select v-model="form.parent_id" class="input-field mt-1">
              <option value="">None (This is a Chapter/Unit)</option>
              <option v-for="chapter in chapters" :key="chapter.id" :value="chapter.id">
                {{ chapter.title }}
              </option>
            </select>
            <span class="mt-1 block text-xs text-gray-500"
              >Select a parent to add a topic inside a chapter.</span
            >
          </label>
          <label class="mt-4 block text-sm text-gray-700 dark:text-gray-300">
            Title
            <input v-model.trim="form.title" class="input-field mt-1" maxlength="180" required />
          </label>
          <label class="mt-4 block text-sm text-gray-700 dark:text-gray-300">
            Description <span class="text-gray-500">(optional)</span>
            <textarea
              v-model.trim="form.description"
              class="input-field mt-1 min-h-24"
              maxlength="5000"
            />
          </label>
          <p v-if="errorMessage" role="alert" class="mt-3 text-sm text-red-600">
            {{ errorMessage }}
          </p>
          <button
            class="mt-4 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            :disabled="saving || !selectedClass?.branch_id"
          >
            {{ saving ? 'Adding…' : 'Add Item' }}
          </button>
        </form>
      </div>

      <section
        class="min-h-80 rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <h2
          class="border-b border-gray-200 px-5 py-4 text-lg font-medium text-gray-900 dark:border-gray-700 dark:text-white"
        >
          Syllabus Structure
        </h2>
        <div v-if="!classId || !subjectId" class="px-5 py-16 text-center text-sm text-gray-500">
          Please select a class and subject from the filters to load the syllabus structure.
        </div>
        <div v-else-if="loadingItems" class="px-5 py-16 text-center text-sm text-gray-500">
          Loading syllabus…
        </div>
        <div v-else-if="!chapters.length" class="px-5 py-16 text-center">
          <h3 class="font-medium text-gray-700 dark:text-gray-200">No Syllabus Found</h3>
          <p class="mt-1 text-sm text-gray-500">
            No chapters or topics have been added to this subject yet.
          </p>
        </div>
        <ul v-else class="divide-y divide-gray-100 dark:divide-gray-700">
          <li v-for="chapter in chapters" :key="chapter.id" class="px-5 py-4">
            <h3 class="font-medium text-gray-900 dark:text-white">{{ chapter.title }}</h3>
            <p
              v-if="chapter.description"
              class="mt-1 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300"
            >
              {{ chapter.description }}
            </p>
            <ul
              v-if="topicsFor(chapter.id).length"
              class="mt-3 space-y-3 border-l-2 border-indigo-200 pl-4 dark:border-indigo-800"
            >
              <li v-for="topic in topicsFor(chapter.id)" :key="topic.id">
                <h4 class="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {{ topic.title }}
                </h4>
                <p
                  v-if="topic.description"
                  class="mt-1 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300"
                >
                  {{ topic.description }}
                </p>
              </li>
            </ul>
          </li>
        </ul>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { Syllabus } from '~/api/academic/syllabus';
import { useAcademics } from '~/composables/useAcademics';
import { useAuth } from '~/composables/useAuth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { apiErrorMessage, extractList } from '~/utils/list-response';

const { user } = useAuth();
const { currentSchool, effectiveBranchId } = useGlobalBranch();
const { classes, fetchClasses } = useAcademics();
const classOptions = ref<any[]>([]);
const isTeacher = computed(() => user.value?.role === 'teacher');
const classId = ref('');
const subjectId = ref('');
const subjects = ref<any[]>([]);
const units = ref<any[]>([]);
const loadingClasses = ref(false);
const loadingSubjects = ref(false);
const loadingItems = ref(false);
const saving = ref(false);
const errorMessage = ref('');
const form = reactive({ parent_id: '', title: '', description: '' });
const selectedClass = computed(() => classOptions.value.find(item => item.id === classId.value));
const chapters = computed(() => units.value.filter(item => !item.parent_id));
const topicsFor = (id: string) => units.value.filter(item => item.parent_id === id);

const loadClasses = async () => {
  loadingClasses.value = true;
  try {
    if (isTeacher.value) {
      const response: any = await Syllabus.classes();
      classOptions.value = extractList(response);
    } else {
      await fetchClasses({
        schoolId: currentSchool.value?.id || user.value?.school_id,
        ...(effectiveBranchId.value ? { branchId: effectiveBranchId.value } : {})
      });
      classOptions.value = classes.value;
    }
  } catch (error) {
    classOptions.value = [];
    errorMessage.value = apiErrorMessage(error);
  } finally {
    loadingClasses.value = false;
  }
};

const loadItems = async () => {
  units.value = [];
  if (!classId.value || !subjectId.value || !selectedClass.value?.branch_id) return;
  loadingItems.value = true;
  try {
    const response: any = await Syllabus.list({
      class_id: classId.value,
      subject_id: subjectId.value,
      branch_id: selectedClass.value.branch_id
    });
    units.value = extractList(response);
  } catch (error) {
    errorMessage.value = apiErrorMessage(error);
  } finally {
    loadingItems.value = false;
  }
};

watch(classId, async value => {
  subjectId.value = '';
  subjects.value = [];
  units.value = [];
  form.parent_id = '';
  if (!value) return;
  loadingSubjects.value = true;
  errorMessage.value = '';
  try {
    const response: any = await Syllabus.subjects({
      branch_id: selectedClass.value?.branch_id,
      class_id: value
    });
    subjects.value = extractList(response);
  } catch (error) {
    errorMessage.value = apiErrorMessage(error);
  } finally {
    loadingSubjects.value = false;
  }
});
watch(subjectId, () => {
  form.parent_id = '';
  void loadItems();
});
watch([effectiveBranchId, currentSchool], () => {
  classId.value = '';
  subjectId.value = '';
  void loadClasses();
});
onMounted(loadClasses);

const addItem = async () => {
  if (!selectedClass.value?.branch_id) return;
  saving.value = true;
  errorMessage.value = '';
  try {
    await Syllabus.create({
      branch_id: selectedClass.value.branch_id,
      class_id: classId.value,
      subject_id: subjectId.value,
      parent_id: form.parent_id,
      title: form.title,
      description: form.description
    });
    form.title = '';
    form.description = '';
    form.parent_id = '';
    await loadItems();
  } catch (error) {
    errorMessage.value = apiErrorMessage(error);
  } finally {
    saving.value = false;
  }
};
</script>
