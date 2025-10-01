<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div
      class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
    >
      <!-- Background overlay -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="close"></div>

      <!-- Modal panel -->
      <div
        class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
      >
        <form @submit.prevent="handleSubmit">
          <!-- Header -->
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                {{ isEdit ? 'Edit Time Slot' : 'Add Time Slot' }}
              </h3>
              <button
                type="button"
                @click="close"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X class="w-6 h-6" />
              </button>
            </div>

            <!-- Form fields -->
            <div class="space-y-4">
              <!-- Day of Week -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Day of Week *
                </label>
                <EnhancedDropdown
                  v-model="form.day_of_week"
                  :options="weekDays"
                  placeholder="Select Day"
                />
              </div>

              <!-- Period Number -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Period Number *
                </label>
                <input
                  v-model.number="form.period_number"
                  type="number"
                  min="1"
                  max="20"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter period number"
                />
              </div>

              <!-- Time Range -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Time *
                  </label>
                  <input
                    v-model="form.start_time"
                    type="time"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Time *
                  </label>
                  <input
                    v-model="form.end_time"
                    type="time"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <!-- Subject -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject
                </label>
                <EnhancedDropdown
                  v-model="form.subject_id"
                  :options="subjects"
                  placeholder="Select Subject (Optional)"
                />
              </div>

              <!-- Teacher -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Teacher
                </label>
                <EnhancedDropdown
                  v-model="form.teacher_id"
                  :options="teachers"
                  placeholder="Select Teacher (Optional)"
                />
              </div>

              <!-- Room Number -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Room Number
                </label>
                <input
                  v-model="form.room_number"
                  type="text"
                  maxlength="20"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter room number (optional)"
                />
              </div>

              <!-- Slot Type -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Slot Type *
                </label>
                <EnhancedDropdown
                  v-model="form.slot_type"
                  :options="[
                    { value: 'regular', label: 'Regular Class' },
                    { value: 'break', label: 'Break' },
                    { value: 'lunch', label: 'Lunch' },
                    { value: 'assembly', label: 'Assembly' },
                    { value: 'free', label: 'Free Period' },
                    { value: 'exam', label: 'Exam' }
                  ]"
                  placeholder="Select Slot Type"
                />
              </div>

              <!-- Notes -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  v-model="form.notes"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter notes (optional)"
                ></textarea>
              </div>

              <!-- Status -->
              <div class="flex items-center space-x-4">
                <label class="flex items-center">
                  <input
                    v-model="form.is_active"
                    type="checkbox"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              :disabled="loading"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div
                v-if="loading"
                class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
              ></div>
              {{ isEdit ? 'Update' : 'Create' }}
            </button>
            <button
              type="button"
              @click="close"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-white dark:border-gray-500 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { X } from 'lucide-vue-next';
import { useToast } from '~/composables/useToast';
import { useAcademics } from '~/composables/useAcademics';
import { Timetables } from '~/api/academic/timetables';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';

// Props
const props = defineProps({
  slot: {
    type: Object,
    default: null
  },
  timetable: {
    type: Object,
    default: null
  },
  day: {
    type: String,
    default: ''
  },
  period: {
    type: Number,
    default: null
  }
});

// Emits
const emit = defineEmits(['close', 'saved']);

// Composables
const { showToast } = useToast();
const {
  subjectOptions: subjects,
  teacherOptions: teachers,
  fetchSubjects,
  fetchTeachers
} = useAcademics();

// State
const loading = ref(false);
const form = ref({
  day_of_week: '',
  period_number: null,
  start_time: '',
  end_time: '',
  subject_id: '',
  teacher_id: '',
  room_number: '',
  slot_type: 'regular',
  is_active: true,
  notes: ''
});

// Week days (using numeric values as expected by backend)
const weekDays = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' }
];

// Helper functions
const dayNameToNumber = dayName => {
  const dayMap = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 7
  };
  return dayMap[dayName] || 1;
};

const numberToDayName = dayNumber => {
  const dayMap = {
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
    7: 'sunday'
  };
  return dayMap[dayNumber] || 'monday';
};

// Computed
const isEdit = computed(() => !!props.slot);

// Methods
const handleSubmit = async () => {
  try {
    loading.value = true;

    const formData = {
      ...form.value,
      timetable_id: props.timetable.id,
      subject_id:
        form.value.subject_id && form.value.subject_id.trim() !== '' ? form.value.subject_id : null,
      teacher_id:
        form.value.teacher_id && form.value.teacher_id.trim() !== '' ? form.value.teacher_id : null,
      room_number:
        form.value.room_number && form.value.room_number.trim() !== ''
          ? form.value.room_number
          : null,
      notes: form.value.notes && form.value.notes.trim() !== '' ? form.value.notes : null
    };

    let response;
    if (isEdit.value && props.slot) {
      response = await Timetables.updateSlot(props.timetable.id, props.slot.id, formData);
    } else {
      response = await Timetables.createSlot(formData);
    }

    if (response.success) {
      showToast(
        isEdit.value ? 'Time slot updated successfully' : 'Time slot created successfully',
        'success'
      );
      emit('saved');
    } else {
      showToast(response.message || 'Failed to save time slot', 'error');
    }
  } catch (error) {
    console.error('Error saving time slot:', error);
    showToast('Error saving time slot', 'error');
  } finally {
    loading.value = false;
  }
};

const close = () => {
  emit('close');
};

// Initialize form data
const initializeForm = () => {
  if (props.slot) {
    // Convert day_of_week from string to number if needed
    const dayOfWeek =
      typeof props.slot.day_of_week === 'string'
        ? dayNameToNumber(props.slot.day_of_week)
        : props.slot.day_of_week;

    form.value = {
      day_of_week: dayOfWeek,
      period_number: props.slot.period_number,
      start_time: props.slot.start_time,
      end_time: props.slot.end_time,
      subject_id: props.slot.subject_id || '',
      teacher_id: props.slot.teacher_id || '',
      room_number: props.slot.room_number || '',
      slot_type: props.slot.slot_type,
      is_active: props.slot.is_active,
      notes: props.slot.notes || ''
    };
  } else {
    // Convert day prop from string to number if needed
    const dayOfWeek = props.day ? dayNameToNumber(props.day) : 1;

    form.value = {
      day_of_week: dayOfWeek,
      period_number: props.period || null,
      start_time: '',
      end_time: '',
      subject_id: '',
      teacher_id: '',
      room_number: '',
      slot_type: 'regular',
      is_active: true,
      notes: ''
    };
  }
};

// Watchers
watch(() => props.slot, initializeForm, { immediate: true });
watch(() => props.day, initializeForm, { immediate: true });
watch(() => props.period, initializeForm, { immediate: true });

// Initialize
onMounted(async () => {
  await Promise.all([fetchSubjects(), fetchTeachers()]);
  initializeForm();
});
</script>
