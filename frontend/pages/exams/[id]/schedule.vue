<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Breadcrumb -->
      <nav class="flex mb-6" aria-label="Breadcrumb">
        <ol class="inline-flex items-center space-x-1 md:space-x-3">
          <li class="inline-flex items-center">
            <NuxtLink
              to="/exams"
              class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
            >
              <BookOpen class="w-4 h-4 mr-2" />
              Exams
            </NuxtLink>
          </li>
          <li>
            <div class="flex items-center">
              <ChevronRight class="w-4 h-4 text-gray-400" />
              <span class="ml-1 text-sm font-medium text-gray-500 md:ml-2 dark:text-gray-400">
                {{ exam?.name || 'Loading...' }}
              </span>
            </div>
          </li>
          <li aria-current="page">
            <div class="flex items-center">
              <ChevronRight class="w-4 h-4 text-gray-400" />
              <span class="ml-1 text-sm font-medium text-gray-700 md:ml-2 dark:text-gray-300">
                Schedule
              </span>
            </div>
          </li>
        </ol>
      </nav>

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Schedule Exam</h1>
        <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Schedule this exam for multiple classes, sections, and subjects
        </p>
      </div>

      <!-- Exam Details Card -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Exam Details</h3>
        <div v-if="loading" class="text-center py-4">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
        <div v-else-if="exam" class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Exam Name</span>
            <p class="mt-1 text-sm font-medium text-gray-900 dark:text-white">{{ exam.name }}</p>
          </div>
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Exam Type</span>
            <p class="mt-1 text-sm font-medium text-gray-900 dark:text-white">
              {{ exam.exam_type?.name || 'N/A' }}
            </p>
          </div>
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Academic Year</span>
            <p class="mt-1 text-sm font-medium text-gray-900 dark:text-white">
              {{ exam.academic_year || 'N/A' }}
            </p>
          </div>
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Status</span>
            <span
              :class="[
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                getStatusBadgeClass(exam.status)
              ]"
            >
              {{ getStatusText(exam.status) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Schedule Form -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Add Schedule</h3>

        <form @submit.prevent="addSchedule" class="space-y-6">
          <!-- Select Ground -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Class <span class="text-red-500">*</span>
              </label>
              <EnhancedDropdown
                v-model="scheduleForm.class_id"
                :options="classOptions"
                placeholder="Select class"
                :loading="classesLoading"
                @update:model-value="onClassChange"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Section <span class="text-red-500">*</span>
              </label>
              <EnhancedDropdown
                v-model="scheduleForm.section_id"
                :options="sectionOptions"
                placeholder="Select section"
                :loading="sectionsLoading"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject <span class="text-red-500">*</span>
              </label>
              <EnhancedDropdown
                v-model="scheduleForm.subject_id"
                :options="subjectOptions"
                placeholder="Select subject"
                :loading="subjectsLoading"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Exam Hall
              </label>
              <EnhancedDropdown
                v-model="scheduleForm.hall_id"
                :options="hallOptions"
                placeholder="Select hall"
                :loading="hallsLoading"
              />
            </div>
          </div>

          <!-- Date, Time, Duration -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Exam Date <span class="text-red-500">*</span>
              </label>
              <input
                v-model="scheduleForm.exam_date"
                type="date"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Time <span class="text-red-500">*</span>
              </label>
              <input
                v-model="scheduleForm.start_time"
                type="time"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Time <span class="text-red-500">*</span>
              </label>
              <input
                v-model="scheduleForm.end_time"
                type="time"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration (min)
              </label>
              <input
                v-model.number="scheduleForm.duration"
                type="number"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="120"
              />
            </div>
          </div>

          <!-- Marks Distribution -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Practical Marks
              </label>
              <input
                v-model.number="scheduleForm.practical_marks"
                type="number"
                min="0"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="40"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Written Marks
              </label>
              <input
                v-model.number="scheduleForm.written_marks"
                type="number"
                min="0"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="60"
              />
            </div>
          </div>

          <!-- Add Button -->
          <div class="flex justify-end">
            <button
              type="submit"
              :disabled="saving"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Plus class="w-4 h-4 mr-2" />
              Add Schedule
            </button>
          </div>
        </form>
      </div>

      <!-- Schedules List -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">Exam Schedules</h3>
        </div>

        <div v-if="schedulesLoading" class="p-6 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>

        <div v-else-if="schedules.length === 0" class="p-6 text-center">
          <Calendar class="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No schedules yet</h3>
          <p class="text-gray-500 dark:text-gray-400">Add schedules using the form above.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  Class & Section
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  Subject
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  Date & Time
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  Duration
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  Hall
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  Marks
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="schedule in schedules" :key="schedule.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ schedule.class?.name }} - {{ schedule.section?.name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ schedule.subject?.name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ formatDate(schedule.exam_date) }}<br />
                  {{ schedule.start_time }} - {{ schedule.end_time }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ schedule.duration }} min
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ schedule.hall?.name || 'N/A' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  P: {{ schedule.practical_marks || 0 }}<br />
                  W: {{ schedule.written_marks || 0 }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    @click="deleteSchedule(schedule.id)"
                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Actions -->
        <div
          v-if="schedules.length > 0"
          class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between"
        >
          <button
            @click="navigateTo('/exams')"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            @click="completeScheduling"
            :disabled="saving"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            <CheckCircle class="w-4 h-4 mr-2" />
            Complete Scheduling
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { navigateTo } from '#app';
import { BookOpen, ChevronRight, Calendar, Plus, Trash2, CheckCircle } from 'lucide-vue-next';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { useToast } from '~/composables/useToast';
import { useAcademics } from '~/composables/useAcademics';
import { useExamHalls } from '~/composables/useExamHalls';

const route = useRoute();
const { showToast } = useToast();

// Composables
const {
  classes,
  sections,
  subjects,
  loading: classesLoading,
  sectionsLoading,
  subjectsLoading,
  fetchClasses,
  fetchSections,
  fetchSubjects
} = useAcademics();
const { halls, loading: hallsLoading, loadExamHalls } = useExamHalls();

// State
const exam = ref(null);
const schedules = ref([]);
const loading = ref(false);
const schedulesLoading = ref(false);
const saving = ref(false);

// Form
const scheduleForm = reactive({
  class_id: '',
  section_id: '',
  subject_id: '',
  hall_id: '',
  exam_date: '',
  start_time: '',
  end_time: '',
  duration: 120,
  practical_marks: 0,
  written_marks: 0
});

// Computed
const classOptions = computed(() =>
  classes.value.map(cls => ({
    value: cls.id,
    label: cls.name
  }))
);

const sectionOptions = computed(() =>
  sections.value.map(section => ({
    value: section.id,
    label: section.name
  }))
);

const subjectOptions = computed(() =>
  subjects.value.map(subject => ({
    value: subject.id,
    label: subject.name
  }))
);

const hallOptions = computed(() =>
  halls.value.map(hall => ({
    value: hall.id,
    label: `${hall.name} (${hall.capacity} seats)`
  }))
);

// Methods
const loadExam = async () => {
  loading.value = true;
  try {
    const { examApi } = await import('~/api/academic/exams');
    const response = await examApi.getById(route.params.id);
    exam.value = response.data;
  } catch (error) {
    showToast('Failed to load exam', 'error');
    navigateTo('/exams');
  } finally {
    loading.value = false;
  }
};

const loadSchedules = async () => {
  schedulesLoading.value = true;
  try {
    const { examScheduleApi } = await import('~/api/academic/exam-schedules');
    const response = await examScheduleApi.getByExamId(route.params.id);
    schedules.value = response.data || [];
  } catch (error) {
    showToast('Failed to load schedules', 'error');
  } finally {
    schedulesLoading.value = false;
  }
};

const onClassChange = async () => {
  scheduleForm.section_id = '';
  scheduleForm.subject_id = '';

  if (scheduleForm.class_id) {
    await fetchSections({ classId: scheduleForm.class_id });
    await fetchSubjects({ classId: scheduleForm.class_id });
  }
};

const addSchedule = async () => {
  try {
    saving.value = true;

    if (!scheduleForm.class_id || !scheduleForm.section_id || !scheduleForm.subject_id) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    const { examScheduleApi } = await import('~/api/academic/exam-schedules');
    const response = await examScheduleApi.create({
      exam_id: route.params.id,
      ...scheduleForm
    });

    if (response.success) {
      showToast('Schedule added successfully', 'success');
      await loadSchedules();
      resetForm();
    }
  } catch (error) {
    showToast('Failed to add schedule', 'error');
  } finally {
    saving.value = false;
  }
};

const deleteSchedule = async scheduleId => {
  if (!confirm('Are you sure you want to delete this schedule?')) {
    return;
  }

  try {
    const { examScheduleApi } = await import('~/api/academic/exam-schedules');
    const response = await examScheduleApi.delete(scheduleId);

    if (response.success) {
      showToast('Schedule deleted successfully', 'success');
      await loadSchedules();
    }
  } catch (error) {
    showToast('Failed to delete schedule', 'error');
  }
};

const completeScheduling = async () => {
  try {
    saving.value = true;

    const { examApi } = await import('~/api/academic/exams');
    const response = await examApi.update(route.params.id, { status: 'scheduled' });

    if (response.success) {
      showToast('Exam scheduling completed successfully', 'success');
      navigateTo('/exams');
    }
  } catch (error) {
    showToast('Failed to complete scheduling', 'error');
  } finally {
    saving.value = false;
  }
};

const resetForm = () => {
  scheduleForm.class_id = '';
  scheduleForm.section_id = '';
  scheduleForm.subject_id = '';
  scheduleForm.hall_id = '';
  scheduleForm.exam_date = '';
  scheduleForm.start_time = '';
  scheduleForm.end_time = '';
  scheduleForm.duration = 120;
  scheduleForm.practical_marks = 0;
  scheduleForm.written_marks = 0;
};

const formatDate = date => {
  return new Date(date).toLocaleDateString('en-IN');
};

const getStatusBadgeClass = status => {
  const classes = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    marks_entered: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    grades_calculated: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  };
  return classes[status] || classes.draft;
};

const getStatusText = status => {
  const texts = {
    draft: 'Draft',
    scheduled: 'Scheduled',
    marks_entered: 'Marks Entered',
    grades_calculated: 'Grades Calculated',
    completed: 'Completed'
  };
  return texts[status] || 'Unknown';
};

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadExam(),
    loadSchedules(),
    fetchClasses(),
    fetchSubjects(),
    loadExamHalls()
  ]);
});
</script>
