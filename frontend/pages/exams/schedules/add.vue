<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Add Exam Schedule</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Create exam schedules following standards
          </p>
        </div>
        <div class="mt-4 sm:mt-0">
          <button
            @click="goBack"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeft class="h-4 w-4 mr-2" />
            Back to Schedules
          </button>
        </div>
      </div>

      <!-- Schedule Type Selection -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Schedule Type</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            @click="setScheduleType('quick')"
            :class="[
              'p-4 border-2 rounded-lg text-left transition-colors',
              scheduleType === 'quick'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            ]"
          >
            <div class="flex items-center">
              <Zap class="h-6 w-6 text-indigo-600 dark:text-indigo-400 mr-3" />
              <div>
                <h4 class="font-medium text-gray-900 dark:text-white">Quick Schedule</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Create schedule for all subjects at once
                </p>
              </div>
            </div>
          </button>

          <button
            @click="setScheduleType('individual')"
            :class="[
              'p-4 border-2 rounded-lg text-left transition-colors',
              scheduleType === 'individual'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            ]"
          >
            <div class="flex items-center">
              <Calendar class="h-6 w-6 text-indigo-600 dark:text-indigo-400 mr-3" />
              <div>
                <h4 class="font-medium text-gray-900 dark:text-white">
                  Individual Subject Schedule
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Create schedule for each subject separately
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Quick Schedule Form -->
      <div v-if="scheduleType === 'quick'" class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-6">Quick Schedule</h3>
        <form @submit.prevent="saveQuickSchedule" class="space-y-6">
          <!--  - Exactly 4 fields as per specification -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Starting Date () -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Starting Date <span class="text-red-500">*</span>
              </label>
              <input
                v-model="quickForm.starting_date"
                type="date"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <!-- Starting Time () -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Starting Time <span class="text-red-500">*</span>
              </label>
              <input
                v-model="quickForm.starting_time"
                type="time"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <!-- Duration () -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration (minutes) <span class="text-red-500">*</span>
              </label>
              <input
                v-model="quickForm.duration"
                type="number"
                min="1"
                required
                placeholder="120"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <!-- Hall Room () -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hall Room <span class="text-red-500">*</span>
              </label>
              <EnhancedDropdown
                v-model="quickForm.hall_room"
                :options="hallOptions"
                placeholder="Select hall room"
                :loading="hallsLoading"
              />
            </div>
          </div>

          <!-- Form Actions -->
          <div
            class="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700"
          >
            <button
              type="button"
              @click="goBack"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="px-4 py-2 border border-transparent text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ saving ? 'Creating...' : 'Create Quick Schedule' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Individual Subject Schedule Form -->
      <div
        v-if="scheduleType === 'individual'"
        class="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
      >
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Individual Subject Schedule
        </h3>

        <!-- Subject Schedule List -->
        <div v-if="subjectSchedules.length > 0" class="space-y-4 mb-6">
          <div
            v-for="(schedule, index) in subjectSchedules"
            :key="index"
            class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <div class="flex items-center justify-between mb-4">
              <h4 class="font-medium text-gray-900 dark:text-white">
                Subject {{ index + 1 }}: {{ schedule.subject_name || 'Select Subject' }}
              </h4>
              <button
                @click="removeSubjectSchedule(index)"
                class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>

            <!--  - 6+ fields per subject as per specification -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <!-- Subject () -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject <span class="text-red-500">*</span>
                </label>
                <EnhancedDropdown
                  v-model="schedule.subject_id"
                  :options="subjectOptions"
                  placeholder="Select subject"
                  :loading="subjectsLoading"
                  @change="updateSubjectName(index, $event)"
                />
              </div>

              <!-- Date () -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="schedule.date"
                  type="date"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <!-- Starting Time () -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Starting Time <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="schedule.starting_time"
                  type="time"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <!-- Ending Time () -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ending Time <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="schedule.ending_time"
                  type="time"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <!-- Hall Room () -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hall Room <span class="text-red-500">*</span>
                </label>
                <EnhancedDropdown
                  v-model="schedule.hall_room"
                  :options="hallOptions"
                  placeholder="Select hall room"
                  :loading="hallsLoading"
                />
              </div>

              <!-- Mark Distribution () -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mark Distribution <span class="text-red-500">*</span>
                </label>
                <EnhancedDropdown
                  v-model="schedule.mark_distribution"
                  :options="markDistributionOptions"
                  placeholder="Select mark distribution"
                  :loading="markDistributionsLoading"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Add Subject Button -->
        <div class="mb-6">
          <button
            @click="addSubjectSchedule"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus class="h-4 w-4 mr-2" />
            Add Subject Schedule
          </button>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            @click="goBack"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            @click="saveIndividualSchedules"
            :disabled="saving || subjectSchedules.length === 0"
            class="px-4 py-2 border border-transparent text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ saving ? 'Creating...' : 'Create Individual Schedules' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ArrowLeft, Zap, Calendar, Plus, Trash2 } from 'lucide-vue-next';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { useToast } from '~/composables/useToast';
import { useAuth } from '~/composables/useAuth';
import { useBranches } from '~/composables/useBranches';

// Composables
const { showToast } = useToast();
const { user } = useAuth();
const { branches, fetchBranches, loading: branchesLoading } = useBranches();

// Reactive data
const scheduleType = ref('quick');
const saving = ref(false);

// Quick Schedule Form
const quickForm = reactive({
  starting_date: '',
  starting_time: '',
  duration: '',
  hall_room: ''
});

// Individual Subject Schedules
const subjectSchedules = ref([]);

// Options data
const halls = ref([]);
const hallsLoading = ref(false);
const subjects = ref([]);
const subjectsLoading = ref(false);
const markDistributions = ref([]);
const markDistributionsLoading = ref(false);

// Computed properties
const hallOptions = computed(() =>
  halls.value.map(hall => ({
    value: hall.id,
    label: hall.name
  }))
);

const subjectOptions = computed(() =>
  subjects.value.map(subject => ({
    value: subject.id,
    label: subject.name
  }))
);

const markDistributionOptions = computed(() =>
  markDistributions.value.map(distribution => ({
    value: distribution.id,
    label: distribution.name
  }))
);

// Methods
const setScheduleType = type => {
  scheduleType.value = type;
  if (type === 'individual' && subjectSchedules.value.length === 0) {
    addSubjectSchedule();
  }
};

const addSubjectSchedule = () => {
  subjectSchedules.value.push({
    subject_id: '',
    subject_name: '',
    date: '',
    starting_time: '',
    ending_time: '',
    hall_room: '',
    mark_distribution: ''
  });
};

const removeSubjectSchedule = index => {
  subjectSchedules.value.splice(index, 1);
};

const updateSubjectName = (index, subjectId) => {
  const subject = subjects.value.find(s => s.id === subjectId);
  if (subject) {
    subjectSchedules.value[index].subject_name = subject.name;
  }
};

const saveQuickSchedule = async () => {
  if (
    !quickForm.starting_date ||
    !quickForm.starting_time ||
    !quickForm.duration ||
    !quickForm.hall_room
  ) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  try {
    saving.value = true;

    // TODO: Replace with actual API call
    // await examScheduleApi.createQuickSchedule(quickForm);

    showToast('Quick schedule created successfully', 'success');
    goBack();
  } catch (error) {
    showToast('Failed to create quick schedule', 'error');
  } finally {
    saving.value = false;
  }
};

const saveIndividualSchedules = async () => {
  if (subjectSchedules.value.length === 0) {
    showToast('Please add at least one subject schedule', 'error');
    return;
  }

  // Validate all subject schedules
  for (const schedule of subjectSchedules.value) {
    if (
      !schedule.subject_id ||
      !schedule.date ||
      !schedule.starting_time ||
      !schedule.ending_time ||
      !schedule.hall_room ||
      !schedule.mark_distribution
    ) {
      showToast('Please fill in all required fields for all subjects', 'error');
      return;
    }
  }

  try {
    saving.value = true;

    // TODO: Replace with actual API call
    // await examScheduleApi.createIndividualSchedules(subjectSchedules.value);

    showToast('Individual schedules created successfully', 'success');
    goBack();
  } catch (error) {
    showToast('Failed to create individual schedules', 'error');
  } finally {
    saving.value = false;
  }
};

const loadHalls = async () => {
  try {
    hallsLoading.value = true;
    // TODO: Replace with actual API call
    // const response = await hallApi.getAll({
    //   school_id: user.value.school_id,
    //   branch_id: user.value.branch_id
    // });
    // halls.value = response.data || [];

    // Mock data for now
    halls.value = [
      { id: '1', name: 'Hall A' },
      { id: '2', name: 'Hall B' },
      { id: '3', name: 'Lab 1' }
    ];
  } catch (error) {
    showToast('Failed to load halls', 'error');
  } finally {
    hallsLoading.value = false;
  }
};

const loadSubjects = async () => {
  try {
    subjectsLoading.value = true;
    // TODO: Replace with actual API call
    // const response = await subjectApi.getAll({
    //   school_id: user.value.school_id,
    //   branch_id: user.value.branch_id
    // });
    // subjects.value = response.data || [];

    // Mock data for now
    subjects.value = [
      { id: '1', name: 'Mathematics' },
      { id: '2', name: 'Physics' },
      { id: '3', name: 'Chemistry' }
    ];
  } catch (error) {
    showToast('Failed to load subjects', 'error');
  } finally {
    subjectsLoading.value = false;
  }
};

const loadMarkDistributions = async () => {
  try {
    markDistributionsLoading.value = true;
    // TODO: Replace with actual API call
    // const response = await markDistributionApi.getAll({
    //   school_id: user.value.school_id,
    //   branch_id: user.value.branch_id
    // });
    // markDistributions.value = response.data || [];

    // Mock data for now
    markDistributions.value = [
      { id: '1', name: 'Standard Theory Exam' },
      { id: '2', name: 'Practical Exam' },
      { id: '3', name: 'Combined Exam' }
    ];
  } catch (error) {
    showToast('Failed to load mark distributions', 'error');
  } finally {
    markDistributionsLoading.value = false;
  }
};

const goBack = () => {
  // Navigate back to schedules listing
  navigateTo('/exams/schedules');
};

// Load initial data
onMounted(async () => {
  await Promise.all([fetchBranches(), loadHalls(), loadSubjects(), loadMarkDistributions()]);
});
</script>
