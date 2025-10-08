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
        class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full"
      >
        <form @submit.prevent="saveSchedule">
          <!-- Header -->
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                {{ isEditing ? 'Edit Exam Schedule' : 'Schedule Exam' }}
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
              <!-- Exam Info (Read-only) -->
              <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Exam Details</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-gray-500 dark:text-gray-400">Name:</span>
                    <span class="ml-2 text-gray-900 dark:text-white">{{ exam?.name }}</span>
                  </div>
                  <div>
                    <span class="text-gray-500 dark:text-gray-400">Class:</span>
                    <span class="ml-2 text-gray-900 dark:text-white">{{ exam?.class?.name }}</span>
                  </div>
                  <div>
                    <span class="text-gray-500 dark:text-gray-400">Subject:</span>
                    <span class="ml-2 text-gray-900 dark:text-white">{{
                      exam?.subject?.name || 'All Subjects'
                    }}</span>
                  </div>
                  <div>
                    <span class="text-gray-500 dark:text-gray-400">Max Marks:</span>
                    <span class="ml-2 text-gray-900 dark:text-white">{{ exam?.max_marks }}</span>
                  </div>
                </div>
              </div>

              <!-- Schedule Form -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Exam Date -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Exam Date <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.exam_date"
                    type="date"
                    required
                    :min="minDate"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <!-- Duration Type -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration Type
                  </label>
                  <select
                    v-model="durationType"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="time_range">Start & End Time</option>
                    <option value="duration">Duration in Minutes</option>
                  </select>
                </div>

                <!-- Start Time (if time range) -->
                <div v-if="durationType === 'time_range'">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Time
                  </label>
                  <input
                    v-model="form.start_time"
                    type="time"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <!-- End Time (if time range) -->
                <div v-if="durationType === 'time_range'">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Time
                  </label>
                  <input
                    v-model="form.end_time"
                    type="time"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <!-- Duration (if duration type) -->
                <div v-if="durationType === 'duration'">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    v-model="form.duration_minutes"
                    type="number"
                    min="1"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <!-- Exam Hall -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Exam Hall
                  </label>
                  <div class="flex space-x-2">
                    <select
                      v-model="form.exam_hall_id"
                      class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select Hall</option>
                      <option v-for="hall in hallOptions" :key="hall.value" :value="hall.value">
                        {{ hall.label }}
                      </option>
                    </select>
                    <button
                      v-if="form.exam_hall_id && form.exam_date && form.start_time && form.end_time"
                      type="button"
                      @click="checkAvailability"
                      :disabled="checkingAvailability"
                      class="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {{ checkingAvailability ? 'Checking...' : 'Check' }}
                    </button>
                  </div>
                </div>

                <!-- Invigilator -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Invigilator
                  </label>
                  <select
                    v-model="form.invigilator_id"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Invigilator</option>
                    <option
                      v-for="teacher in teacherOptions"
                      :key="teacher.value"
                      :value="teacher.value"
                    >
                      {{ teacher.label }}
                    </option>
                  </select>
                </div>

                <!-- Status -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status <span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="form.status_id"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Status</option>
                    <option
                      v-for="status in statusOptions"
                      :key="status.value"
                      :value="status.value"
                    >
                      {{ status.label }}
                    </option>
                  </select>
                </div>

                <!-- Special Instructions -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    v-model="form.special_instructions"
                    rows="3"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Any special instructions for this exam..."
                  ></textarea>
                </div>
              </div>

              <!-- Availability Check Result -->
              <div v-if="availabilityResult" class="mt-4">
                <div
                  :class="[
                    'p-4 rounded-lg',
                    availabilityResult.available
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  ]"
                >
                  <div class="flex items-center">
                    <div
                      :class="[
                        'flex-shrink-0 w-5 h-5 rounded-full',
                        availabilityResult.available ? 'bg-green-400' : 'bg-red-400'
                      ]"
                    ></div>
                    <div class="ml-3">
                      <p
                        :class="[
                          'text-sm font-medium',
                          availabilityResult.available
                            ? 'text-green-800 dark:text-green-200'
                            : 'text-red-800 dark:text-red-200'
                        ]"
                      >
                        {{
                          availabilityResult.available
                            ? 'Hall is available'
                            : 'Hall is not available'
                        }}
                      </p>
                      <p
                        v-if="
                          !availabilityResult.available && availabilityResult.conflicting_schedules
                        "
                        class="text-sm text-red-600 dark:text-red-400 mt-1"
                      >
                        Conflicting schedules found
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              :disabled="saving || loading"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {{ saving ? 'Saving...' : isEditing ? 'Update Schedule' : 'Create Schedule' }}
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
import { X } from 'lucide-vue-next';
import { useExamHalls } from '~/composables/useExamHalls';
import { useExamSchedules } from '~/composables/useExamSchedules';
import { useExamOptions } from '~/composables/useExamOptions';
import { useAcademics } from '~/composables/useAcademics';
import { useToast } from '~/composables/useToast';
import type { ExamSchedule } from '~/api/academic/exam-schedules';

// Props
const props = defineProps<{
  show: boolean;
  exam: any;
  schedule?: ExamSchedule;
  branchId: string;
  schoolId: string;
}>();

// Emits
const emit = defineEmits<{
  close: [];
  success: [schedule: ExamSchedule];
}>();

// Composables
const { showToast } = useToast();
const { hallOptions, loadHallsForDropdown, checkHallAvailability } = useExamHalls();
const { createSchedule, updateSchedule } = useExamSchedules();
const { examStatusOptions, loadExamStatuses } = useExamOptions();
const { teacherOptions, fetchTeachers } = useAcademics();

// State
const saving = ref(false);
const loading = ref(false);
const checkingAvailability = ref(false);
const availabilityResult = ref<any>(null);
const durationType = ref<'time_range' | 'duration'>('time_range');

// Form
const form = ref({
  exam_date: '',
  start_time: '',
  end_time: '',
  duration_minutes: 120,
  exam_hall_id: '',
  invigilator_id: '',
  status_id: '',
  special_instructions: ''
});

// Computed
const isEditing = computed(() => !!props.schedule);
const minDate = computed(() => {
  return new Date().toISOString().split('T')[0];
});

// Methods
const closeModal = () => {
  emit('close');
  resetForm();
};

const resetForm = () => {
  form.value = {
    exam_date: '',
    start_time: '',
    end_time: '',
    duration_minutes: 120,
    exam_hall_id: '',
    invigilator_id: '',
    status_id: '',
    special_instructions: ''
  };
  availabilityResult.value = null;
  durationType.value = 'time_range';
};

const loadFormData = async () => {
  try {
    loading.value = true;

    await Promise.all([
      loadHallsForDropdown(props.branchId),
      loadExamStatuses(),
      fetchTeachers({ branchId: props.branchId })
    ]);

    if (props.schedule) {
      // Editing existing schedule
      form.value = {
        exam_date: props.schedule.exam_date,
        start_time: props.schedule.start_time || '',
        end_time: props.schedule.end_time || '',
        duration_minutes: props.schedule.duration_minutes || 120,
        exam_hall_id: props.schedule.exam_hall_id || '',
        invigilator_id: props.schedule.invigilator_id || '',
        status_id: props.schedule.status_id,
        special_instructions: props.schedule.special_instructions || ''
      };
    }
  } catch (error) {
    showToast('Failed to load form data', 'error');
  } finally {
    loading.value = false;
  }
};

const checkAvailability = async () => {
  if (
    !form.value.exam_hall_id ||
    !form.value.exam_date ||
    !form.value.start_time ||
    !form.value.end_time
  ) {
    showToast('Please fill in all required fields to check availability', 'warning');
    return;
  }

  try {
    checkingAvailability.value = true;
    const result = await checkHallAvailability({
      hall_id: form.value.exam_hall_id,
      exam_date: form.value.exam_date,
      start_time: form.value.start_time,
      end_time: form.value.end_time,
      exclude_schedule_id: props.schedule?.id
    });
    availabilityResult.value = result;
  } catch (error) {
    showToast('Failed to check hall availability', 'error');
  } finally {
    checkingAvailability.value = false;
  }
};

const saveSchedule = async () => {
  if (!form.value.exam_date || !form.value.status_id) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  try {
    saving.value = true;

    const scheduleData = {
      exam_id: props.exam.id,
      exam_date: form.value.exam_date,
      start_time: form.value.start_time || undefined,
      end_time: form.value.end_time || undefined,
      duration_minutes: form.value.duration_minutes || undefined,
      exam_hall_id: form.value.exam_hall_id || undefined,
      invigilator_id: form.value.invigilator_id || undefined,
      status_id: form.value.status_id,
      special_instructions: form.value.special_instructions || undefined,
      branch_id: props.branchId,
      school_id: props.schoolId
    };

    let schedule: ExamSchedule;
    if (isEditing.value && props.schedule) {
      schedule = await updateSchedule({ ...scheduleData, id: props.schedule.id });
    } else {
      schedule = await createSchedule(scheduleData);
    }

    emit('success', schedule);
    closeModal();
  } catch (error) {
    showToast('Failed to save exam schedule', 'error');
  } finally {
    saving.value = false;
  }
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

watch([() => form.value.start_time, () => form.value.end_time], () => {
  if (form.value.start_time && form.value.end_time) {
    const start = new Date(`2000-01-01T${form.value.start_time}`);
    const end = new Date(`2000-01-01T${form.value.end_time}`);
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    if (diffMinutes > 0) {
      form.value.duration_minutes = diffMinutes;
    }
  }
});

// Lifecycle
onMounted(() => {
  if (props.show) {
    loadFormData();
  }
});
</script>
