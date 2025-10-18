<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 overflow-y-auto"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
    >
      <!-- Background overlay -->
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        aria-hidden="true"
        @click="closeModal"
      ></div>

      <!-- Modal panel -->
      <div
        class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
      >
        <form @submit.prevent="createSchedules">
          <!-- Header -->
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Create Exam Schedules from Template
              </h3>
              <button
                type="button"
                @click="closeModal"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X class="h-6 w-6" />
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="bg-white dark:bg-gray-800 px-4 pb-4 sm:p-6">
            <div class="space-y-6">
              <!-- Template Selection -->
              <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-4">
                  Select Template
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Template Type
                    </label>
                    <select
                      v-model="selectedTemplate"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select Template</option>
                      <option value="weekly">Weekly Schedule</option>
                      <option value="daily">Daily Schedule</option>
                      <option value="custom">Custom Template</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Exam
                    </label>
                    <EnhancedDropdown
                      v-model="form.exam_id"
                      :options="examOptions"
                      placeholder="Select Exam"
                      :loading="examsLoading"
                    />
                  </div>
                </div>
              </div>

              <!-- Template Configuration -->
              <div v-if="selectedTemplate" class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-4">
                  Template Configuration
                </h4>

                <!-- Weekly Template -->
                <div v-if="selectedTemplate === 'weekly'" class="space-y-4">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Start Date
                      </label>
                      <input
                        v-model="templateConfig.start_date"
                        type="date"
                        :min="minDate"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Start Time
                      </label>
                      <input
                        v-model="templateConfig.start_time"
                        type="time"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Duration (minutes)
                      </label>
                      <input
                        v-model="templateConfig.duration"
                        type="number"
                        min="30"
                        max="480"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Hall
                      </label>
                      <EnhancedDropdown
                        v-model="templateConfig.hall_id"
                        :options="hallOptions"
                        placeholder="Select Hall"
                        :loading="hallsLoading"
                      />
                    </div>
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Days Gap Between Subjects
                      </label>
                      <input
                        v-model="templateConfig.days_gap"
                        type="number"
                        min="0"
                        max="7"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <!-- Daily Template -->
                <div v-else-if="selectedTemplate === 'daily'" class="space-y-4">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Exam Date
                      </label>
                      <input
                        v-model="templateConfig.exam_date"
                        type="date"
                        :min="minDate"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Start Time
                      </label>
                      <input
                        v-model="templateConfig.start_time"
                        type="time"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Duration (minutes)
                      </label>
                      <input
                        v-model="templateConfig.duration"
                        type="number"
                        min="30"
                        max="480"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Hall
                      </label>
                      <EnhancedDropdown
                        v-model="templateConfig.hall_id"
                        :options="hallOptions"
                        placeholder="Select Hall"
                        :loading="hallsLoading"
                      />
                    </div>
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Time Gap Between Subjects (minutes)
                      </label>
                      <input
                        v-model="templateConfig.time_gap"
                        type="number"
                        min="0"
                        max="120"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <!-- Custom Template -->
                <div v-else-if="selectedTemplate === 'custom'" class="space-y-4">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Template Name
                      </label>
                      <input
                        v-model="templateConfig.name"
                        type="text"
                        placeholder="Enter template name"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Schedule Pattern
                      </label>
                      <select
                        v-model="templateConfig.pattern"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="sequential">Sequential (one after another)</option>
                        <option value="parallel">Parallel (same time, different halls)</option>
                        <option value="mixed">Mixed (some sequential, some parallel)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Preview -->
              <div
                v-if="previewSchedules.length > 0"
                class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                    Schedule Preview ({{ previewSchedules.length }} schedules)
                  </h4>
                </div>
                <div class="overflow-x-auto max-h-64">
                  <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0">
                      <tr>
                        <th
                          class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                        >
                          Subject
                        </th>
                        <th
                          class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                        >
                          Date
                        </th>
                        <th
                          class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                        >
                          Time
                        </th>
                        <th
                          class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                        >
                          Hall
                        </th>
                      </tr>
                    </thead>
                    <tbody
                      class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
                    >
                      <tr v-for="(schedule, index) in previewSchedules" :key="index">
                        <td class="px-4 py-2 text-sm text-gray-900 dark:text-white">
                          {{ schedule.subject_name }}
                        </td>
                        <td class="px-4 py-2 text-sm text-gray-900 dark:text-white">
                          {{ schedule.exam_date }}
                        </td>
                        <td class="px-4 py-2 text-sm text-gray-900 dark:text-white">
                          {{ schedule.start_time }} - {{ schedule.end_time }}
                        </td>
                        <td class="px-4 py-2 text-sm text-gray-900 dark:text-white">
                          {{ schedule.hall_name }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Generate Preview Button -->
              <div v-if="selectedTemplate && form.exam_id" class="flex justify-end">
                <button
                  type="button"
                  @click="generatePreview"
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Eye class="w-4 h-4 mr-2" />
                  Generate Preview
                </button>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              :disabled="saving || !canCreate"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {{ saving ? 'Creating...' : 'Create Schedules' }}
            </button>
            <button
              type="button"
              @click="closeModal"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { X, Eye } from 'lucide-vue-next';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { useExams } from '~/composables/useExams';
import { useAcademics } from '~/composables/useAcademics';
import { useExamHalls } from '~/composables/useExamHalls';
import { useExamSchedules } from '~/composables/useExamSchedules';
import { useToast } from '~/composables/useToast';

// Props
const props = defineProps<{
  show: boolean;
  branchId: string;
  schoolId: string;
}>();

// Emits
const emit = defineEmits<{
  close: [];
  success: [];
}>();

// Composables
const { showToast } = useToast();
const { exams, loading: examsLoading, fetchExams } = useExams();
const { classes, sections, subjects, fetchClasses, fetchSections, fetchSubjects } = useAcademics();
const { halls, loading: hallsLoading, loadExamHalls } = useExamHalls();
const { createSchedule } = useExamSchedules();

// State
const saving = ref(false);
const selectedTemplate = ref('');
const previewSchedules = ref<any[]>([]);

// Form data
const form = ref({
  exam_id: '',
  class_id: '',
  section_id: ''
});

// Template configuration
const templateConfig = ref({
  start_date: '',
  start_time: '',
  duration: 120,
  hall_id: '',
  exam_date: '',
  days_gap: 1,
  time_gap: 30,
  name: '',
  pattern: 'sequential'
});

// Computed properties
const examOptions = computed(() =>
  exams.value.map(exam => ({
    value: exam.id,
    label: exam.name
  }))
);

const hallOptions = computed(() =>
  halls.value
    .filter(hall => hall.is_active)
    .map(hall => ({
      value: hall.id,
      label: `${hall.name} (${hall.capacity} seats)`
    }))
);

const minDate = computed(() => {
  return new Date().toISOString().split('T')[0];
});

const canCreate = computed(() => {
  return form.value.exam_id && selectedTemplate.value && previewSchedules.value.length > 0;
});

// Methods
const closeModal = () => {
  emit('close');
  resetForm();
};

const resetForm = () => {
  selectedTemplate.value = '';
  previewSchedules.value = [];
  form.value = {
    exam_id: '',
    class_id: '',
    section_id: ''
  };
  templateConfig.value = {
    start_date: '',
    start_time: '',
    duration: 120,
    hall_id: '',
    exam_date: '',
    days_gap: 1,
    time_gap: 30,
    name: '',
    pattern: 'sequential'
  };
};

const generatePreview = async () => {
  if (!form.value.exam_id) {
    showToast('Please select an exam first', 'warning');
    return;
  }

  try {
    // Load subjects for the selected exam
    await fetchSubjects({ branchId: props.branchId });

    const schedules: any[] = [];
    const startDate = new Date(templateConfig.value.start_date || templateConfig.value.exam_date);
    let currentDate = new Date(startDate);
    let currentTime = templateConfig.value.start_time;

    subjects.value.forEach((subject, index) => {
      const schedule: any = {
        subject_id: subject.id,
        subject_name: subject.name,
        exam_date: currentDate.toISOString().split('T')[0],
        start_time: currentTime,
        end_time: calculateEndTime(currentTime, templateConfig.value.duration),
        hall_id: templateConfig.value.hall_id,
        hall_name: halls.value.find(h => h.id === templateConfig.value.hall_id)?.name || 'N/A'
      };

      schedules.push(schedule);

      // Calculate next schedule based on template
      if (selectedTemplate.value === 'weekly') {
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + templateConfig.value.days_gap);
      } else if (selectedTemplate.value === 'daily') {
        const [hours, minutes] = currentTime.split(':').map(Number);
        const startMinutes = hours * 60 + minutes;
        const endMinutes =
          startMinutes + templateConfig.value.duration + templateConfig.value.time_gap;
        const nextHours = Math.floor(endMinutes / 60);
        const nextMins = endMinutes % 60;
        currentTime = `${nextHours.toString().padStart(2, '0')}:${nextMins.toString().padStart(2, '0')}`;
      }
    });

    previewSchedules.value = schedules;
    showToast('Preview generated successfully', 'success');
  } catch (error) {
    showToast('Failed to generate preview', 'error');
  }
};

const calculateEndTime = (startTime: string, duration: number) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + duration;
  const endHours = Math.floor(endMinutes / 60);
  const endMins = endMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
};

const createSchedules = async () => {
  if (!canCreate.value) {
    showToast('Please complete all required fields', 'warning');
    return;
  }

  try {
    saving.value = true;

    // Create schedules for each subject
    const schedulePromises = previewSchedules.value.map(schedule =>
      createSchedule({
        exam_id: form.value.exam_id,
        class_id: form.value.class_id,
        section_id: form.value.section_id,
        subject_id: schedule.subject_id,
        exam_date: schedule.exam_date,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        duration_minutes: calculateDuration(schedule.start_time, schedule.end_time),
        exam_hall_id: schedule.hall_id,
        branch_id: props.branchId,
        school_id: props.schoolId
      })
    );

    await Promise.all(schedulePromises);

    showToast('Exam schedules created successfully', 'success');
    emit('success');
    closeModal();
  } catch (error) {
    showToast('Failed to create exam schedules', 'error');
    console.error('Error creating schedules:', error);
  } finally {
    saving.value = false;
  }
};

const calculateDuration = (startTime: string, endTime: string) => {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  const startTotal = startHours * 60 + startMinutes;
  const endTotal = endHours * 60 + endMinutes;
  return endTotal - startTotal;
};

// Watchers
watch(
  () => props.show,
  show => {
    if (show) {
      loadFormData();
    }
  }
);

// Lifecycle
const loadFormData = async () => {
  try {
    await Promise.all([
      fetchExams({ branch_id: props.branchId }),
      fetchClasses({ branchId: props.branchId }),
      loadExamHalls({ branch_id: props.branchId })
    ]);
  } catch (error) {
    showToast('Failed to load form data', 'error');
  }
};

onMounted(() => {
  if (props.show) {
    loadFormData();
  }
});
</script>
