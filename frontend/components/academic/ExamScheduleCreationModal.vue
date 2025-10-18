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
        class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full"
      >
        <form @submit.prevent="saveSchedule">
          <!-- Header -->
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                {{ isEditing ? 'Edit Exam Schedule' : 'Create Exam Schedule' }}
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
              <!-- Step 1: Select Ground -->
              <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-4">
                  Select Ground
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <!-- Exam Selection -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Exam Name <span class="text-red-500">*</span>
                    </label>
                    <EnhancedDropdown
                      v-model="form.exam_id"
                      :options="examOptions"
                      placeholder="Select Exam"
                      :loading="examsLoading"
                      @update:model-value="onExamChange"
                    />
                  </div>

                  <!-- Class Selection -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Class <span class="text-red-500">*</span>
                    </label>
                    <EnhancedDropdown
                      v-model="form.class_id"
                      :options="classOptions"
                      placeholder="Select Class"
                      :loading="classesLoading"
                      @update:model-value="onClassChange"
                    />
                  </div>

                  <!-- Section Selection -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Section <span class="text-red-500">*</span>
                    </label>
                    <EnhancedDropdown
                      v-model="form.section_id"
                      :options="sectionOptions"
                      placeholder="Select Section"
                      :loading="sectionsLoading"
                      :disabled="!form.class_id"
                    />
                  </div>
                </div>
              </div>

              <!-- Step 2: Quick Schedule Parameters -->
              <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-4">
                  Set Parameters To Quickly Create Schedule
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <!-- Starting Date -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Starting Date <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="quickParams.start_date"
                      type="date"
                      required
                      :min="minDate"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <!-- Starting Time -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Starting Time <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="quickParams.start_time"
                      type="time"
                      required
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <!-- Exam Duration -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Exam Duration (Minutes) <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="quickParams.duration"
                      type="number"
                      min="30"
                      max="480"
                      required
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <!-- Hall Room -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Hall Room <span class="text-red-500">*</span>
                    </label>
                    <EnhancedDropdown
                      v-model="quickParams.hall_id"
                      :options="hallOptions"
                      placeholder="Select Hall"
                      :loading="hallsLoading"
                    />
                  </div>

                  <!-- Practical Marks -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Practical Full Mark
                    </label>
                    <input
                      v-model="quickParams.practical_full_mark"
                      type="number"
                      min="0"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <!-- Written Marks -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Written Full Mark
                    </label>
                    <input
                      v-model="quickParams.written_full_mark"
                      type="number"
                      min="0"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <!-- Apply Button -->
                <div class="mt-4 flex justify-end">
                  <button
                    type="button"
                    @click="applyQuickParams"
                    :disabled="!canApplyQuickParams"
                    class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus class="w-4 h-4 mr-2" />
                    Apply to All Subjects
                  </button>
                </div>
              </div>

              <!-- Step 3: Individual Subject Schedules -->
              <div
                class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                    Individual Subject Schedules
                  </h4>
                </div>
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th
                          class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Subject
                        </th>
                        <th
                          class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Date
                        </th>
                        <th
                          class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Start Time
                        </th>
                        <th
                          class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          End Time
                        </th>
                        <th
                          class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Hall Room
                        </th>
                        <th
                          class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Practical
                        </th>
                        <th
                          class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Written
                        </th>
                      </tr>
                    </thead>
                    <tbody
                      class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
                    >
                      <tr v-for="(schedule, index) in subjectSchedules" :key="index">
                        <td class="px-4 py-3 whitespace-nowrap">
                          <span class="text-sm font-medium text-gray-900 dark:text-white">
                            {{ schedule.subject_name }}
                          </span>
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap">
                          <input
                            v-model="schedule.exam_date"
                            type="date"
                            :min="minDate"
                            class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap">
                          <input
                            v-model="schedule.start_time"
                            type="time"
                            class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap">
                          <input
                            v-model="schedule.end_time"
                            type="time"
                            class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap">
                          <select
                            v-model="schedule.hall_id"
                            class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="">Select Hall</option>
                            <option
                              v-for="hall in hallOptions"
                              :key="hall.value"
                              :value="hall.value"
                            >
                              {{ hall.label }}
                            </option>
                          </select>
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap">
                          <div class="flex space-x-1">
                            <input
                              v-model="schedule.practical_full_mark"
                              type="number"
                              min="0"
                              placeholder="Full"
                              class="w-16 px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                            <input
                              v-model="schedule.practical_pass_mark"
                              type="number"
                              min="0"
                              placeholder="Pass"
                              class="w-16 px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                          </div>
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap">
                          <div class="flex space-x-1">
                            <input
                              v-model="schedule.written_full_mark"
                              type="number"
                              min="0"
                              placeholder="Full"
                              class="w-16 px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                            <input
                              v-model="schedule.written_pass_mark"
                              type="number"
                              min="0"
                              placeholder="Pass"
                              class="w-16 px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Validation Messages -->
              <div
                v-if="validationErrors.length > 0"
                class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
              >
                <div class="flex">
                  <AlertCircle class="h-5 w-5 text-red-400" />
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
                      Please fix the following errors:
                    </h3>
                    <ul class="mt-1 text-sm text-red-700 dark:text-red-300 list-disc list-inside">
                      <li v-for="error in validationErrors" :key="error">{{ error }}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <!-- Conflict Messages -->
              <div
                v-if="conflictErrors.length > 0"
                class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
              >
                <div class="flex">
                  <AlertCircle class="h-5 w-5 text-yellow-400" />
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Schedule Conflicts Detected:
                    </h3>
                    <ul
                      class="mt-1 text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside"
                    >
                      <li v-for="conflict in conflictErrors" :key="conflict.message">
                        {{ conflict.message }}
                        <span
                          v-if="conflict.severity === 'error'"
                          class="text-red-600 dark:text-red-400"
                          >(Error)</span
                        >
                        <span v-else class="text-yellow-600 dark:text-yellow-400">(Warning)</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              :disabled="saving || !canSave"
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
import { X, Plus, AlertCircle } from 'lucide-vue-next';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { useExams } from '~/composables/useExams';
import { useAcademics } from '~/composables/useAcademics';
import { useExamHalls } from '~/composables/useExamHalls';
import { useExamSchedules } from '~/composables/useExamSchedules';
import { useToast } from '~/composables/useToast';
import {
  checkScheduleConflicts,
  validateScheduleData,
  type ScheduleConflict
} from '~/utils/schedule-conflict-detector';

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
const {
  classes,
  sections,
  subjects,
  loading: classesLoading,
  loading: sectionsLoading,
  loading: subjectsLoading,
  fetchClasses,
  fetchSections,
  fetchSubjects
} = useAcademics();
const { halls, loading: hallsLoading, loadExamHalls } = useExamHalls();
const { createSchedule } = useExamSchedules();

// State
const saving = ref(false);
const validationErrors = ref<string[]>([]);
const conflictErrors = ref<ScheduleConflict[]>([]);
const existingSchedules = ref<any[]>([]);

// Form data
const form = ref({
  exam_id: '',
  class_id: '',
  section_id: ''
});

// Quick parameters for bulk application
const quickParams = ref({
  start_date: '',
  start_time: '',
  duration: 120,
  hall_id: '',
  practical_full_mark: 0,
  written_full_mark: 0
});

// Individual subject schedules
const subjectSchedules = ref<any[]>([]);

// Computed properties
const examOptions = computed(() =>
  exams.value.map(exam => ({
    value: exam.id,
    label: exam.name
  }))
);

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

const canApplyQuickParams = computed(() => {
  return (
    quickParams.value.start_date &&
    quickParams.value.start_time &&
    quickParams.value.duration &&
    quickParams.value.hall_id
  );
});

const canSave = computed(() => {
  return (
    form.value.exam_id &&
    form.value.class_id &&
    form.value.section_id &&
    subjectSchedules.value.length > 0 &&
    subjectSchedules.value.every(
      schedule => schedule.exam_date && schedule.start_time && schedule.end_time
    )
  );
});

// Methods
const closeModal = () => {
  emit('close');
  resetForm();
};

const resetForm = () => {
  form.value = {
    exam_id: '',
    class_id: '',
    section_id: ''
  };
  quickParams.value = {
    start_date: '',
    start_time: '',
    duration: 120,
    hall_id: '',
    practical_full_mark: 0,
    written_full_mark: 0
  };
  subjectSchedules.value = [];
  validationErrors.value = [];
};

const onExamChange = async () => {
  if (form.value.exam_id && form.value.class_id) {
    await loadSubjects();
  }
};

const onClassChange = async () => {
  form.value.section_id = '';
  if (form.value.class_id) {
    await fetchSections({ branchId: props.branchId, classId: form.value.class_id });
    await loadSubjects();
  }
};

const loadSubjects = async () => {
  if (form.value.class_id) {
    await fetchSubjects({ branchId: props.branchId, classId: form.value.class_id });
    generateSubjectSchedules();
  }
};

const generateSubjectSchedules = () => {
  subjectSchedules.value = subjects.value.map(subject => ({
    subject_id: subject.id,
    subject_name: subject.name,
    exam_date: quickParams.value.start_date,
    start_time: quickParams.value.start_time,
    end_time: calculateEndTime(quickParams.value.start_time, quickParams.value.duration),
    hall_id: quickParams.value.hall_id,
    practical_full_mark: quickParams.value.practical_full_mark,
    practical_pass_mark: Math.round(quickParams.value.practical_full_mark * 0.4),
    written_full_mark: quickParams.value.written_full_mark,
    written_pass_mark: Math.round(quickParams.value.written_full_mark * 0.4)
  }));
};

const calculateEndTime = (startTime: string, duration: number) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + duration;
  const endHours = Math.floor(endMinutes / 60);
  const endMins = endMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
};

const applyQuickParams = () => {
  if (!canApplyQuickParams.value) {
    showToast('Please fill in all quick parameters first', 'warning');
    return;
  }

  subjectSchedules.value.forEach(schedule => {
    schedule.exam_date = quickParams.value.start_date;
    schedule.start_time = quickParams.value.start_time;
    schedule.end_time = calculateEndTime(quickParams.value.start_time, quickParams.value.duration);
    schedule.hall_id = quickParams.value.hall_id;
    schedule.practical_full_mark = quickParams.value.practical_full_mark;
    schedule.practical_pass_mark = Math.round(quickParams.value.practical_full_mark * 0.4);
    schedule.written_full_mark = quickParams.value.written_full_mark;
    schedule.written_pass_mark = Math.round(quickParams.value.written_full_mark * 0.4);
  });

  showToast('Quick parameters applied to all subjects', 'success');
};

const validateForm = () => {
  validationErrors.value = [];
  conflictErrors.value = [];

  if (!form.value.exam_id) {
    validationErrors.value.push('Please select an exam');
  }
  if (!form.value.class_id) {
    validationErrors.value.push('Please select a class');
  }
  if (!form.value.section_id) {
    validationErrors.value.push('Please select a section');
  }

  // Validate individual schedules
  subjectSchedules.value.forEach((schedule, index) => {
    const scheduleData = {
      exam_date: schedule.exam_date,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      exam_hall_id: schedule.hall_id,
      invigilator_id: schedule.invigilator_id,
      subject_id: schedule.subject_id,
      class_id: form.value.class_id,
      section_id: form.value.section_id
    };

    const errors = validateScheduleData(scheduleData);
    errors.forEach(error => {
      validationErrors.value.push(`Subject ${index + 1}: ${error}`);
    });
  });

  // Check for conflicts
  if (validationErrors.value.length === 0) {
    const scheduleData = subjectSchedules.value.map(schedule => ({
      exam_date: schedule.exam_date,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      exam_hall_id: schedule.hall_id,
      invigilator_id: schedule.invigilator_id,
      subject_id: schedule.subject_id,
      class_id: form.value.class_id,
      section_id: form.value.section_id
    }));

    conflictErrors.value = checkScheduleConflicts(scheduleData, existingSchedules.value);
  }

  return validationErrors.value.length === 0 && conflictErrors.value.length === 0;
};

const saveSchedule = async () => {
  if (!validateForm()) {
    return;
  }

  try {
    saving.value = true;

    // Create schedules for each subject
    const schedulePromises = subjectSchedules.value.map(schedule =>
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
        practical_full_mark: schedule.practical_full_mark,
        practical_pass_mark: schedule.practical_pass_mark,
        written_full_mark: schedule.written_full_mark,
        written_pass_mark: schedule.written_pass_mark,
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
      loadExamHalls({ branch_id: props.branchId }),
      loadExistingSchedules()
    ]);
  } catch (error) {
    showToast('Failed to load form data', 'error');
  }
};

const loadExistingSchedules = async () => {
  try {
    // Load existing schedules for conflict detection
    const { examScheduleApi } = await import('~/api/academic/exam-schedules');
    const response = await examScheduleApi.getAll({ branch_id: props.branchId });
    existingSchedules.value = response.data || [];
  } catch (error) {
    console.warn('Failed to load existing schedules for conflict detection:', error);
    existingSchedules.value = [];
  }
};

onMounted(() => {
  if (props.show) {
    loadFormData();
  }
});
</script>
