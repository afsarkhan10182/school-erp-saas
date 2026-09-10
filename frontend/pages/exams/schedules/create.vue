<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <button
              @click="closeCreatePage"
              class="mr-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft class="h-5 w-5" />
            </button>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ isEditMode ? 'Edit Schedule' : 'Add Schedule' }}
            </h1>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Selection Ground Section -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Select Exam Details
        </h2>

        <div class="flex items-end gap-6 mb-6">


          <!-- Exam Selection -->
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Exam <span class="text-red-500">*</span>
            </label>
            <EnhancedDropdown
              v-model="selectionForm.exam_id"
              :options="examOptions"
              placeholder="Select exam"
              :loading="examsLoading"
              @change="onExamSelectionChange"
            />
          </div>

          <!-- Class Selection -->
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Class <span class="text-red-500">*</span>
            </label>
            <EnhancedDropdown
              v-model="selectionForm.class_id"
              :options="classOptions"
              placeholder="Select class"
              :loading="classesLoading"
              @change="onClassSelectionChange"
            />
          </div>

          <!-- Filter Button -->
          <div>
            <button
              @click="applyFilter"
              :disabled="!canApplyFilter"
              class="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw class="h-5 w-5 mr-2" />
              Filter
            </button>
          </div>
        </div>

        <!-- Section and Stream Selection Row -->
        <div
          v-if="
            (showSectionField && sectionOptions.length > 0) ||
            (showStreamField && streamOptions.length > 0)
          "
          class="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <!-- Section Selection -->
          <div v-if="showSectionField && sectionOptions.length > 0">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Section <span class="text-red-500">*</span>
            </label>
            <EnhancedDropdown
              v-model="selectionForm.section_id"
              :options="sectionOptions"
              placeholder="Select section"
              :loading="sectionsLoading"
              @change="onSectionSelectionChange"
            />
          </div>

          <!-- Stream Selection -->
          <div v-if="showStreamField && streamOptions.length > 0">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Stream <span class="text-red-500">*</span>
            </label>
            <EnhancedDropdown
              v-model="selectionForm.stream_id"
              :options="streamOptions"
              placeholder="Select stream"
              @change="onStreamSelectionChange"
            />
          </div>
        </div>
      </div>

      <!-- Set Parameters Section -->
      <div v-if="canProceedToStep2" class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Set Parameters To Quickly Create Schedule
          </h2>
          <div class="flex items-center space-x-4">
            <!-- Selected Exam Info -->
            <div v-if="selectedExam" class="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
              <div class="text-sm text-blue-700 dark:text-blue-300">
                <span class="font-medium">{{ selectedExam.name }}</span>
                <span class="text-xs ml-2">({{ selectedExam.max_marks }} marks)</span>
              </div>
            </div>
            <!-- Mark Distribution Info -->
            <div
              v-if="availableMarkDistributions.length > 0"
              class="bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg"
            >
              <div class="text-sm text-green-700 dark:text-green-300">
                <span class="font-medium">Mark Distribution</span>
                <span class="text-xs ml-2">
                  {{ availableMarkDistributions.map(dist => dist.name).join(', ') }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Basic Schedule Parameters -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <!-- Starting Date -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Starting Date <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <input
                v-model="scheduleParams.starting_date"
                type="date"
                class="w-full px-4 py-3 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 appearance-none cursor-pointer hover:border-gray-400 dark:hover:border-gray-500"
                placeholder="Select date"
              />
              <div class="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg
                  class="h-5 w-5 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
            <p v-if="scheduleParams.starting_date" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Selected: {{ formatDate(scheduleParams.starting_date) }}
            </p>
          </div>

          <!-- Starting Time -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Starting Time <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <input
                v-model="scheduleParams.starting_time"
                type="time"
                class="w-full px-4 py-3 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 appearance-none cursor-pointer hover:border-gray-400 dark:hover:border-gray-500"
                placeholder="--:--"
              />
              <div class="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <Clock class="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
            <p v-if="scheduleParams.starting_time" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Selected: {{ formatTime(scheduleParams.starting_time) }}
            </p>
          </div>

          <!-- Exam Duration -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Exam Duration (Minutes) <span class="text-red-500">*</span>
            </label>
            <input
              v-model="scheduleParams.duration"
              type="number"
              min="30"
              class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <!-- Hall Room -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hall Room <span class="text-red-500">*</span>
            </label>
            <EnhancedDropdown
              v-model="scheduleParams.hall_id"
              :options="hallOptions"
              placeholder="Select hall"
              :loading="hallsLoading"
            />
          </div>
        </div>

        <!-- Mark Distribution Fields -->
        <div v-if="selectedExam && availableMarkDistributions.length > 0" class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Mark Distribution</h3>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              {{ availableMarkDistributions.map(dist => dist.name).join(', ') }}
            </div>
          </div>

          <div
            v-if="markDistributionsLoading"
            class="mb-4 text-sm text-gray-500 dark:text-gray-400"
          >
            Loading mark distributions...
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Dynamic Mark Distribution Fields -->
            <div v-for="field in dynamicMarkFields" :key="field.id" class="space-y-3">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ field.name }}
              </h4>
              <div class="space-y-3">
                <input
                  v-model="scheduleParams[field.fullMarkKey]"
                  type="number"
                  placeholder="Full Mark"
                  class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <input
                  v-model="scheduleParams[field.passMarkKey]"
                  type="number"
                  placeholder="Pass Mark"
                  class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="mt-8 flex justify-end">
          <button
            @click="applyParameters"
            :disabled="!canApplyParameters"
            class="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw class="h-5 w-5 mr-2" />
            Apply Parameters
          </button>
        </div>
      </div>

      <!-- Schedule Listing Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div class="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Schedule Listing</h3>
        </div>

        <div class="overflow-x-auto overflow-y-visible w-full">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th
                  class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Subject
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Starting Time
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Ending Time
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Hall Room
                </th>
                <th
                  v-for="field in dynamicMarkFields"
                  :key="`header-${field.id}`"
                  class="px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[140px]"
                  :title="field.name"
                >
                  <div class="truncate max-w-[120px]" :title="field.name">
                    {{ field.name }}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-if="generatedSchedules.length === 0">
                <td
                  :colspan="5 + dynamicMarkFields.length"
                  class="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  <div class="flex flex-col items-center justify-center">
                    <p class="mb-2">No schedules generated yet.</p>
                    <p class="text-xs">
                      Please select Branch, Exam, Class, and click "Filter" to load subjects, then
                      fill in parameters and click "Apply Parameters".
                    </p>
                    <p
                      v-if="subjects.length > 0"
                      class="text-xs mt-2 text-green-600 dark:text-green-400"
                    >
                      ✓ {{ subjects.length }} subject(s) loaded
                    </p>
                    <p
                      v-else-if="filterApplied"
                      class="text-xs mt-2 text-orange-600 dark:text-orange-400"
                    >
                      ⚠ No subjects found for selected class/section
                    </p>
                  </div>
                </td>
              </tr>
              <tr v-for="(schedule, index) in generatedSchedules" :key="index">
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"
                >
                  {{ schedule.subject_name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <input
                    v-model="schedule.date"
                    type="date"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <input
                    v-model="schedule.starting_time"
                    type="time"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <input
                    v-model="schedule.ending_time"
                    type="time"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <EnhancedDropdown
                    v-model="schedule.hall_id"
                    :options="hallOptions"
                    placeholder="Select hall"
                    :loading="hallsLoading"
                    class="min-w-[160px]"
                  />
                </td>
                <td
                  v-for="field in dynamicMarkFields"
                  :key="`row-${index}-${field.id}`"
                  class="px-4 py-4 min-w-[140px]"
                >
                  <div class="space-y-3 min-w-[120px]">
                    <div>
                      <label
                        class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                      >
                        Full Mark
                      </label>
                      <input
                        v-model="schedule[field.fullMarkKey]"
                        type="number"
                        min="0"
                        placeholder="Full Mark"
                        class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      />
                    </div>
                    <div>
                      <label
                        class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                      >
                        Pass Mark
                      </label>
                      <input
                        v-model="schedule[field.passMarkKey]"
                        type="number"
                        min="0"
                        placeholder="Pass Mark"
                        class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      />
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Save Button -->
      <div class="mt-8 flex justify-end">
        <button
          type="button"
          @click="saveSchedules"
          :disabled="saving || generatedSchedules.length === 0"
          class="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          <Plus class="h-5 w-5 mr-2" />
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { navigateTo, useRoute } from '#app';
import { ArrowLeft, Clock, RotateCcw, Plus } from 'lucide-vue-next';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { useToast } from '~/composables/useToast';
import { useAcademics } from '~/composables/useAcademics';
import { useExams } from '~/composables/useExams';
import { useAuth } from '~/composables/useAuth';
import { useBranches } from '~/composables/useBranches';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useExamHalls } from '~/composables/useExamHalls';
import { useMarkDistributions } from '~/composables/useMarkDistributions';
import { classSubjectAssignmentApi } from '~/api/academic/class-subject-assignment';
import { examScheduleApi } from '~/api/academic/exam-schedules';

// Composables
const route = useRoute();
const { showToast } = useToast();
const { user } = useAuth();
const { selectedBranchId } = useGlobalBranch();
const { branches, fetchBranches, loading: branchesLoading } = useBranches();
const {
  classes,
  classOptions,
  sectionOptions,
  sectionsLoading,
  streamOptions,
  fetchClasses,
  fetchSections,
  fetchStreams,
  subjects,
  subjectsLoading,
  subjectOptions,
  fetchSubjects,
  getSubjectName
} = useAcademics();
const { exams, isLoading: examsLoading, loadExams } = useExams();
const { halls, hallOptions, loading: hallsLoading, loadExamHalls: loadHalls } = useExamHalls();

// Reactive data
const saving = ref(false);
const filterApplied = ref(false);
const isEditMode = ref(false);
const existingScheduleIds = ref([]);

// Selection form
const selectionForm = reactive({
  branch_id: selectedBranchId.value || '',
  exam_id: '',
  class_id: '',
  section_id: '',
  stream_id: ''
});

watch(selectedBranchId, async (newBranchId) => {
  selectionForm.branch_id = newBranchId || '';
  selectionForm.exam_id = '';
  selectionForm.class_id = '';
  selectionForm.section_id = '';
  selectionForm.stream_id = '';
  filterApplied.value = false;
  generatedSchedules.value = [];
  if (newBranchId) {
    await Promise.all([
      loadExams({ branch_id: newBranchId }),
      fetchClasses({ branchId: newBranchId })
    ]);
  } else {
    await Promise.all([
      loadExams(),
      fetchClasses()
    ]);
  }
});

// Schedule parameters
const scheduleParams = reactive({
  starting_date: '',
  starting_time: '',
  duration: 180,
  hall_id: ''
  // Mark distribution fields will be added dynamically
});

// Generated schedules
const generatedSchedules = ref([]);

// Selected items for display
const selectedClass = ref(null);
const selectedSection = ref(null);
const selectedExam = ref(null);

// Mark distributions
const {
  distributions: markDistributions,
  loadMarkDistributions,
  loading: markDistributionsLoading
} = useMarkDistributions();

// Computed properties
const branchOptions = computed(() => {
  return branches.value.map(branch => ({
    value: branch.id,
    label: branch.name
  }));
});

const examOptions = computed(() => {
  return exams.value.map(exam => ({
    value: exam.id,
    label: exam.name
  }));
});

// Check if branch dropdown should be shown
const showBranchDropdown = computed(() => {
  return branches.value.length > 1;
});

// Check if section field should be shown
const showSectionField = computed(() => {
  const selectedClass = classes.value.find(cls => cls.id === selectionForm.class_id);
  return selectedClass?.has_sections || false;
});

// Check if stream field should be shown
const showStreamField = computed(() => {
  const selectedClass = classes.value.find(cls => cls.id === selectionForm.class_id);
  return selectedClass?.has_streams || false;
});

const resolvedBranchId = computed(() => {
  return selectedBranchId.value || user.value?.branch_id || branches.value[0]?.id || '';
});

// Check if can proceed to step 2 (now requires filter to be applied)
const canProceedToStep2 = computed(() => {
  return filterApplied.value;
});

// Check if filter button can be enabled
const canApplyFilter = computed(() => {
  const basicRequirements = resolvedBranchId.value && selectionForm.exam_id && selectionForm.class_id;

  if (!basicRequirements) {
    return false;
  }

  // If class has sections AND sections are available, section_id is required
  if (showSectionField.value && sectionOptions.value.length > 0) {
    return !!selectionForm.section_id;
  }

  // If class has streams AND streams are available, stream_id is required
  if (showStreamField.value && streamOptions.value.length > 0) {
    return !!selectionForm.stream_id;
  }

  // If class doesn't have sections/streams or they have no data, only basic requirements needed
  return true;
});

// Mark distribution options for the selected exam
const availableMarkDistributions = computed(() => {
  if (!selectedExam.value?.mark_distribution_ids?.length) {
    return [];
  }

  return markDistributions.value.filter(dist =>
    selectedExam.value.mark_distribution_ids.includes(dist.id)
  );
});

// Dynamic mark fields based on exam's mark_distribution_ids
const dynamicMarkFields = computed(() => {
  if (!selectedExam.value?.mark_distribution_ids?.length) {
    return [];
  }

  // Get the mark distribution types for this exam
  return availableMarkDistributions.value.map(dist => ({
    id: dist.id,
    name: dist.name,
    fullMarkKey: `distribution_${dist.id}_full_mark`,
    passMarkKey: `distribution_${dist.id}_pass_mark`
  }));
});

const clearMarkFieldValues = () => {
  if (!scheduleParams) {
    return;
  }

  try {
    Object.keys(scheduleParams).forEach(key => {
      if (key && key.startsWith('distribution_')) {
        scheduleParams[key] = '';
      }
    });
  } catch (error) {
    console.error('Error clearing mark field values:', error);
  }
};

const getDistributionFullMark = distribution => {
  if (!distribution) return '';

  return (
    distribution.total_marks ??
    distribution.full_mark ??
    distribution.theory_marks ??
    distribution.practical_marks ??
    distribution.viva_marks ??
    distribution.assignment_marks ??
    ''
  );
};

const getDistributionPassMark = distribution => {
  if (!distribution) return '';

  return distribution.pass_marks ?? distribution.pass_mark ?? '';
};

const calculateEndTime = (startTime, durationMinutes) => {
  const duration = Number(durationMinutes);

  if (!startTime || Number.isNaN(duration) || duration <= 0) {
    return '';
  }

  const [hourString = '00', minuteString = '00'] = startTime.split(':');
  const startDate = new Date('1970-01-01T00:00:00');
  startDate.setHours(Number(hourString));
  startDate.setMinutes(Number(minuteString));
  startDate.setMinutes(startDate.getMinutes() + duration);

  const hours = startDate.getHours().toString().padStart(2, '0');
  const minutes = startDate.getMinutes().toString().padStart(2, '0');

  return `${hours}:${minutes}`;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString + 'T00:00:00');
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    return dateString;
  }
};

const formatTime = (timeString) => {
  if (!timeString) return '';
  
  try {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  } catch (error) {
    return timeString;
  }
};

const initializeMarkFieldDefaults = () => {
  if (
    !scheduleParams ||
    dynamicMarkFields.value.length === 0 ||
    generatedSchedules.value.length > 0
  ) {
    return;
  }

  dynamicMarkFields.value.forEach(field => {
    if (!field || !field.fullMarkKey || !field.passMarkKey) {
      return;
    }

    const distribution = availableMarkDistributions.value.find(dist => dist.id === field.id);

    if (distribution) {
      try {
        if (!scheduleParams[field.fullMarkKey]) {
          scheduleParams[field.fullMarkKey] =
            getDistributionFullMark(distribution)?.toString() || '';
        }

        if (!scheduleParams[field.passMarkKey]) {
          scheduleParams[field.passMarkKey] =
            getDistributionPassMark(distribution)?.toString() || '';
        }
      } catch (error) {
        console.error('Error initializing mark field defaults:', error);
      }
    }
  });
};

watch(
  () => availableMarkDistributions.value,
  () => {
    initializeMarkFieldDefaults();
  },
  { immediate: true }
);

watch(selectedExam, newVal => {
  if (!newVal) {
    clearMarkFieldValues();
  } else {
    // Reset generated schedules when switching exams
    generatedSchedules.value = [];
    clearMarkFieldValues();
    initializeMarkFieldDefaults();
  }
});

// Check if can apply parameters
const canApplyParameters = computed(() => {
  // Must have subjects loaded first
  if (!subjects.value || subjects.value.length === 0) {
    return false;
  }

  const basicParams =
    scheduleParams.starting_date &&
    scheduleParams.starting_time &&
    scheduleParams.duration &&
    scheduleParams.hall_id;

  // If we have dynamic mark fields, check if at least one is filled
  if (dynamicMarkFields.value.length > 0) {
    const hasMarkData = dynamicMarkFields.value.some(
      field => scheduleParams[field.fullMarkKey] || scheduleParams[field.passMarkKey]
    );
    return basicParams && hasMarkData;
  }

  // If no mark distribution, basic params are enough
  return basicParams;
});

// Methods

const onBranchSelectionChange = async () => {
  selectionForm.exam_id = '';
  selectionForm.class_id = '';
  selectionForm.section_id = '';
  selectionForm.stream_id = '';
  generatedSchedules.value = [];
  filterApplied.value = false;

  if (selectionForm.branch_id) {
    await Promise.all([
      fetchClasses({ branchId: selectionForm.branch_id }),
      loadExams({ branch_id: selectionForm.branch_id })
    ]);
  }
};

const onExamSelectionChange = async () => {
  // Don't clear schedules in edit mode - they will be reloaded
  if (!isEditMode.value) {
    generatedSchedules.value = [];
    filterApplied.value = false;
  }

  // Set selected exam
  if (selectionForm.exam_id) {
    selectedExam.value = exams.value.find(exam => exam.id === selectionForm.exam_id);
  } else {
    selectedExam.value = null;
  }
};

const loadSubjectsForClass = async (classId, sectionId = null) => {
  if (!classId) {
    return;
  }

  try {
    if (subjectsLoading) {
      subjectsLoading.value = true;
    }

    const params = {
      class_id: classId,
      limit: 1000,
      page: 1
    };

    // Add optional filters
    if (user.value?.school_id) {
      params.school_id = user.value.school_id;
    }
    if (resolvedBranchId.value) {
      params.branch_id = resolvedBranchId.value;
    }
    if (sectionId) {
      params.section_id = sectionId;
    }

    const response = await classSubjectAssignmentApi.getAll(params);

    // apiCall returns response.data, and backend apiResponse.success returns:
    // { success: true, message: "...", data: { assignments: [...], pagination: {...} } }
    // So response should be: { assignments: [...], pagination: {...} }
    let assignments = [];

    // Primary check: direct assignments property (most likely structure)
    if (response && response.assignments && Array.isArray(response.assignments)) {
      assignments = response.assignments;
    }
    // Fallback: nested data structure
    else if (response && response.data) {
      if (response.data.assignments && Array.isArray(response.data.assignments)) {
        assignments = response.data.assignments;
      } else if (Array.isArray(response.data)) {
        assignments = response.data;
      }
    }
    // Fallback: response itself is an array
    else if (Array.isArray(response)) {
      assignments = response;
    }

    // Extract unique subjects from assignments
    if (assignments && Array.isArray(assignments) && assignments.length > 0) {
      const subjectMap = new Map();

      assignments.forEach(assignment => {
        // Backend includes subject with lowercase 'subject' (Sequelize default)
        const subject = assignment.subject || assignment.Subject;

        if (subject && subject.id) {
          const subjectId = subject.id;
          if (!subjectMap.has(subjectId)) {
            subjectMap.set(subjectId, {
              id: subjectId,
              name: subject.name || 'Unknown Subject',
              code: subject.code || '',
              category: subject.category || ''
            });
          }
        }
      });

      const extractedSubjects = Array.from(subjectMap.values());

      if (subjects && extractedSubjects.length > 0) {
        subjects.value = extractedSubjects;
        showToast(`Loaded ${extractedSubjects.length} subject(s)`, 'success');
      } else {
        if (subjects) {
          subjects.value = [];
        }
        showToast('No subjects found in assignments', 'warning');
      }
    } else {
      if (subjects) {
        subjects.value = [];
      }
      showToast('No subject assignments found for this class', 'warning');
    }
  } catch (error) {
    const errorMsg =
      error?.response?.data?.message || error?.message || 'Failed to load subjects for this class';
    showToast(errorMsg, 'error');
    if (subjects) {
      subjects.value = [];
    }
  } finally {
    if (subjectsLoading) {
      subjectsLoading.value = false;
    }
  }
};

const onClassSelectionChange = async () => {
  selectionForm.section_id = '';
  selectionForm.stream_id = '';
  generatedSchedules.value = [];
  filterApplied.value = false;

  if (selectionForm.class_id) {
    const selectedClassData = classes.value.find(cls => cls.id === selectionForm.class_id);
    selectedClass.value = selectedClassData;

    // Fetch sections if the class has sections
    if (selectedClassData?.has_sections) {
      await fetchSections({ classId: selectionForm.class_id });
    }

    // Fetch streams if the class has streams
    if (selectedClassData?.has_streams && user.value?.school_id) {
      await fetchStreams({
        schoolId: user.value.school_id,
        branchId: resolvedBranchId.value || undefined,
        classId: selectionForm.class_id
      });
    }
  } else {
    subjects.value = [];
  }
};

const onSectionSelectionChange = async () => {
  generatedSchedules.value = [];
  filterApplied.value = false;

  // Set selected section for display
  if (selectionForm.section_id) {
    selectedSection.value = sectionOptions.value.find(
      sec => sec.value === selectionForm.section_id
    );
  } else {
    selectedSection.value = null;
  }
};

const onStreamSelectionChange = async () => {
  generatedSchedules.value = [];
  filterApplied.value = false;
};

const applyFilter = async () => {
  if (!canApplyFilter.value) {
    return;
  }

  try {
    filterApplied.value = true;
    generatedSchedules.value = [];

    // Ensure selectedExam is set
    if (selectionForm.exam_id && !selectedExam.value) {
      const foundExam = exams.value.find(exam => exam.id === selectionForm.exam_id);
      if (foundExam) {
        selectedExam.value = foundExam;
      }
    }

    // Load subjects based on selections
    if (selectionForm.class_id) {
      await loadSubjectsForClass(selectionForm.class_id, selectionForm.section_id || null);
    }

    // Load mark distributions for the selected exam
    if (selectionForm.exam_id && selectedExam.value) {
      await loadMarkDistributionsForExam();
    }

    showToast('Filter applied successfully', 'success');
  } catch (error) {
    console.error('Error in applyFilter:', error);
    showToast('Failed to apply filter: ' + (error?.message || 'Unknown error'), 'error');
    filterApplied.value = false;
  }
};

const loadMarkDistributionsForExam = async () => {
  if (!selectedExam.value || !selectedExam.value.mark_distribution_ids?.length) {
    clearMarkFieldValues();
    return;
  }

  if (!user.value || !user.value.school_id) {
    showToast('User information not available', 'error');
    return;
  }

  const branchId =
    resolvedBranchId.value || selectedExam.value?.branch_id || user.value?.branch_id || undefined;

  try {
    clearMarkFieldValues();
    await loadMarkDistributions({
      school_id: user.value.school_id,
      branch_id: branchId,
      is_active: true,
      limit: 100
    });

    await nextTick();
    initializeMarkFieldDefaults();
  } catch (error) {
    console.error('Error loading mark distributions:', error);
    // Error feedback handled inside loadMarkDistributions
  }
};

const applyParameters = () => {
  const generated = generateSchedules();
  if (generated) {
    showToast('Schedule generated successfully!', 'success');
  }
};

const generateSchedules = () => {
  const durationMinutes = Number(scheduleParams.duration);

  if (
    !scheduleParams.starting_date ||
    !scheduleParams.starting_time ||
    Number.isNaN(durationMinutes) ||
    durationMinutes <= 0 ||
    !scheduleParams.hall_id
  ) {
    showToast('Please fill in all required parameters', 'error');
    return false;
  }

  if (!subjects.value || subjects.value.length === 0) {
    showToast('No subjects found for the selected class/section', 'error');
    generatedSchedules.value = [];
    return false;
  }

  generatedSchedules.value = subjects.value.map((subject, index) => {
    const subjectId = subject.id || subject.subject_id || subject.value;
    const subjectName =
      subject.name ||
      subject.subject_name ||
      subject.label ||
      subject.text ||
      getSubjectName(subjectId);
    const resolvedSubjectName = subjectName || 'Subject';

    const startDate = new Date(scheduleParams.starting_date);
    startDate.setDate(startDate.getDate() + index);

    const startTime = scheduleParams.starting_time;
    const scheduleRow = {
      subject_id: subjectId,
      subject_name: resolvedSubjectName,
      date: startDate.toISOString().split('T')[0],
      starting_time: startTime,
      ending_time: calculateEndTime(startTime, durationMinutes),
      hall_id: scheduleParams.hall_id
    };

    dynamicMarkFields.value.forEach(field => {
      scheduleRow[field.fullMarkKey] = scheduleParams[field.fullMarkKey] ?? '';
      scheduleRow[field.passMarkKey] = scheduleParams[field.passMarkKey] ?? '';
    });

    return scheduleRow;
  });

  return generatedSchedules.value.length > 0;
};

const closeCreatePage = () => {
  navigateTo('/exams/schedules');
};

const saveSchedules = async () => {
  if (generatedSchedules.value.length === 0) {
    showToast('No schedules to save', 'error');
    return;
  }

  if (!user.value?.school_id) {
    showToast('User information not available', 'error');
    return;
  }

  if (!selectionForm.exam_id || !selectionForm.class_id) {
    showToast('Please select exam and class', 'error');
    return;
  }

  // In edit mode, delete existing schedules first
  if (isEditMode.value && existingScheduleIds.value.length > 0) {
    try {
      const deletePromises = existingScheduleIds.value.map(id => examScheduleApi.delete(id));
      await Promise.all(deletePromises);
      existingScheduleIds.value = [];
    } catch (error) {
      console.error('Error deleting existing schedules:', error);
      showToast('Failed to delete existing schedules', 'error');
      return;
    }
  }

  // Validate all schedules before saving
  const validationErrors = [];
  generatedSchedules.value.forEach((schedule, index) => {
    const subjectName = schedule.subject_name || `Subject ${index + 1}`;
    
    if (!schedule.date || schedule.date.trim() === '') {
      validationErrors.push(`${subjectName}: Date is required`);
    }
    
    if (!schedule.starting_time || schedule.starting_time.trim() === '') {
      validationErrors.push(`${subjectName}: Starting time is required`);
    }
    
    if (!schedule.ending_time || schedule.ending_time.trim() === '') {
      validationErrors.push(`${subjectName}: Ending time is required`);
    }
    
    if (!schedule.hall_id || schedule.hall_id.trim() === '') {
      validationErrors.push(`${subjectName}: Hall room is required`);
    }
  });

  if (validationErrors.length > 0) {
    showToast(validationErrors[0] + (validationErrors.length > 1 ? ` (and ${validationErrors.length - 1} more)` : ''), 'error');
    console.error('Validation errors:', validationErrors);
    return;
  }

  saving.value = true;

  try {
    const branchId = resolvedBranchId.value || user.value.branch_id;
    const durationMinutes = Number(scheduleParams.duration) || 0;

    // Prepare all schedules data for bulk create
    const schedulesData = [];

    for (const schedule of generatedSchedules.value) {
      // Validate this specific schedule
      if (!schedule.date || !schedule.starting_time || !schedule.ending_time || !schedule.hall_id) {
        const subjectName = schedule.subject_name || 'Unknown';
        showToast(`${subjectName}: Missing required fields (date, time, or hall)`, 'error');
        return;
      }

      // Calculate total marks and pass marks from mark distribution fields
      let totalMarks = 0;
      let passMarks = 0;
      const markDistribution = {};

      // Extract mark distribution values
      dynamicMarkFields.value.forEach(field => {
        const fullMark = Number(schedule[field.fullMarkKey]) || 0;
        const passMark = Number(schedule[field.passMarkKey]) || 0;

        totalMarks += fullMark;
        passMarks += passMark;

        // Map mark distribution based on field name
        const fieldName = field.name.toLowerCase();
        if (fieldName.includes('theory') || fieldName.includes('written')) {
          markDistribution.theory_marks = fullMark;
        } else if (fieldName.includes('practical')) {
          markDistribution.practical_marks = fullMark;
        } else if (fieldName.includes('viva')) {
          markDistribution.viva_marks = fullMark;
        } else if (fieldName.includes('assignment')) {
          markDistribution.assignment_marks = fullMark;
        }
      });

      // Prepare schedule data
      const scheduleData = {
        exam_id: selectionForm.exam_id,
        class_id: selectionForm.class_id,
        section_id: selectionForm.section_id || undefined,
        subject_id: schedule.subject_id || undefined,
        exam_hall_id: schedule.hall_id,
        exam_date: schedule.date,
        start_time: schedule.starting_time,
        end_time: schedule.ending_time,
        duration_minutes: durationMinutes,
        ...markDistribution,
        total_marks: totalMarks || undefined,
        pass_marks: passMarks || undefined,
        school_id: user.value.school_id,
        branch_id: branchId
      };

      schedulesData.push(scheduleData);
    }

    // Bulk create all schedules in one API call
    console.log('Bulk saving schedules:', schedulesData);
    const response = await examScheduleApi.bulkCreate(schedulesData);
    
    // Handle response - could be direct result or nested in data
    const result = response.data || response;

    if (result.error_count === 0) {
      const successCount = result.success_count || result.created_schedules?.length || schedulesData.length;
      showToast(`All ${successCount} schedules saved successfully!`, 'success');
      closeCreatePage();
    } else if (result.error_count < schedulesData.length) {
      const successCount = result.success_count || result.created_schedules?.length || 0;
      showToast(
        `Saved ${successCount} schedules. ${result.error_count} failed.`,
        'warning'
      );
      if (result.errors && result.errors.length > 0) {
        console.error('Partial save errors:', result.errors);
      }
    } else {
      const firstError = result.errors?.[0]?.error || result.errors?.[0] || 'Failed to save schedules';
      showToast(`Failed to save schedules: ${firstError}`, 'error');
      console.error('Save errors:', result.errors);
    }
  } catch (error) {
    const errorMsg = error?.response?.data?.message || error?.message || 'Failed to save schedules';
    showToast(errorMsg, 'error');
    console.error('Error in saveSchedules:', error);
  } finally {
    saving.value = false;
  }
};

// Load existing schedules for edit mode
const loadExistingSchedules = async () => {
  if (!isEditMode.value || !selectionForm.exam_id || !selectionForm.class_id) {
    return;
  }

  try {
    const branchId = resolvedBranchId.value || user.value?.branch_id;
    const response = await examScheduleApi.getAll({
      school_id: user.value.school_id,
      branch_id: branchId,
      exam_id: selectionForm.exam_id,
      class_id: selectionForm.class_id,
      section_id: selectionForm.section_id || undefined
    });

    let schedulesList = [];
    if (response?.data?.schedules && Array.isArray(response.data.schedules)) {
      schedulesList = response.data.schedules;
    } else if (response?.schedules && Array.isArray(response.schedules)) {
      schedulesList = response.schedules;
    } else if (Array.isArray(response?.data)) {
      schedulesList = response.data;
    } else if (Array.isArray(response)) {
      schedulesList = response;
    }

    if (schedulesList.length > 0) {
      // Convert existing schedules to generatedSchedules format
      generatedSchedules.value = schedulesList.map(schedule => {
        const subject = schedule.subject || schedule.Subject;
        existingScheduleIds.value.push(schedule.id);

        // Extract mark distribution values
        const scheduleRow = {
          subject_id: schedule.subject_id,
          subject_name: subject?.name || 'Unknown Subject',
          date: schedule.exam_date || '',
          starting_time: schedule.start_time || '',
          ending_time: schedule.end_time || '',
          hall_id: schedule.exam_hall_id || schedule.exam_hall?.id || ''
        };

        // Add mark distribution fields
        dynamicMarkFields.value.forEach(field => {
          const fieldName = field.name.toLowerCase();
          if (fieldName.includes('theory') || fieldName.includes('written')) {
            scheduleRow[field.fullMarkKey] = schedule.theory_marks?.toString() || '';
            scheduleRow[field.passMarkKey] = '';
          } else if (fieldName.includes('practical')) {
            scheduleRow[field.fullMarkKey] = schedule.practical_marks?.toString() || '';
            scheduleRow[field.passMarkKey] = '';
          } else if (fieldName.includes('viva')) {
            scheduleRow[field.fullMarkKey] = schedule.viva_marks?.toString() || '';
            scheduleRow[field.passMarkKey] = '';
          } else if (fieldName.includes('assignment')) {
            scheduleRow[field.fullMarkKey] = schedule.assignment_marks?.toString() || '';
            scheduleRow[field.passMarkKey] = '';
          }
        });

        return scheduleRow;
      });

      // Set schedule parameters from first schedule
      if (schedulesList.length > 0) {
        const firstSchedule = schedulesList[0];
        scheduleParams.starting_date = firstSchedule.exam_date || '';
        scheduleParams.starting_time = firstSchedule.start_time || '';
        scheduleParams.duration = firstSchedule.duration_minutes || 180;
        scheduleParams.hall_id = firstSchedule.exam_hall_id || firstSchedule.exam_hall?.id || '';
      }

      filterApplied.value = true;
      showToast(`Loaded ${schedulesList.length} existing schedule(s) for editing`, 'success');
    }
  } catch (error) {
    console.error('Error loading existing schedules:', error);
    showToast('Failed to load existing schedules', 'error');
  }
};

// Initialize data
onMounted(async () => {
  try {
    await Promise.all([fetchBranches(), loadHalls()]);

    // If no halls loaded, show a message
    if (halls.value.length === 0) {
      showToast('No exam halls found. Please create exam halls first.', 'warning');
    }
  } catch (error) {
    showToast('Failed to load initial data', 'error');
  }

  // Check for edit mode from query params
  const query = route.query;
  if (query.edit_mode === 'true' && query.exam_id && query.class_id) {
    isEditMode.value = true;
    
    // Set branch first if provided, otherwise use default
    if (query.branch_id) {
      selectionForm.branch_id = query.branch_id;
    } else if (branches.value.length === 1) {
      selectionForm.branch_id = branches.value[0].id;
    } else if (user.value?.branch_id) {
      selectionForm.branch_id = user.value.branch_id;
    }

    // Load data based on branch first
    const branchId = selectionForm.branch_id || user.value?.branch_id;
    if (branchId) {
      await Promise.all([
        loadExams({ branch_id: branchId }),
        fetchClasses({ branchId: branchId })
      ]);

      // Now set the form values after data is loaded
      // Wait for nextTick to ensure reactive updates
      await nextTick();
      
      // Set form values - these will auto-populate the dropdowns via v-model
      selectionForm.exam_id = query.exam_id;
      selectionForm.class_id = query.class_id;
      
      // Set selected exam object for mark distribution loading
      if (selectionForm.exam_id) {
        selectedExam.value = exams.value.find(exam => exam.id === selectionForm.exam_id);
      }

      // Load sections if class has sections
      if (selectionForm.class_id) {
        const selectedClassData = classes.value.find(cls => cls.id === selectionForm.class_id);
        selectedClass.value = selectedClassData;
        
        if (selectedClassData?.has_sections) {
          await fetchSections({ classId: selectionForm.class_id });
          // Wait for sections to load before setting section_id
          await nextTick();
          // Set section_id after sections are loaded - this will auto-populate dropdown
          if (query.section_id) {
            selectionForm.section_id = query.section_id;
            // Set selected section for display
            selectedSection.value = sectionOptions.value.find(
              sec => sec.value === selectionForm.section_id
            );
          }
        } else if (query.section_id) {
          selectionForm.section_id = query.section_id;
        }
      }

      // Wait for all dropdowns to update
      await nextTick();

      // Load subjects and mark distributions
      await loadSubjectsForClass(selectionForm.class_id, selectionForm.section_id || null);
      await loadMarkDistributionsForExam();
      
      // Then load existing schedules (needs mark distributions to be loaded)
      await loadExistingSchedules();
      
      // Auto-apply filter to show the schedule table
      filterApplied.value = true;
    }
  } else {
    // Auto-set branch if only one branch
    if (branches.value.length === 1) {
      selectionForm.branch_id = branches.value[0].id;
    }

    // Load data based on branch
    const branchId = selectionForm.branch_id || user.value?.branch_id;
    if (branchId) {
      await Promise.all([loadExams({ branch_id: branchId }), fetchClasses({ branchId: branchId })]);
    }

    // Load initial mark distributions
    await loadMarkDistributionsForExam();
  }
});
</script>

<style scoped>
/* Improve date and time input styling */
input[type="date"],
input[type="time"] {
  color-scheme: light dark;
}

/* Hide default browser calendar/time picker icons and make entire input clickable */
input[type="date"]::-webkit-calendar-picker-indicator,
input[type="time"]::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0;
  position: absolute;
  right: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* For Firefox */
input[type="date"]::-moz-calendar-picker-indicator,
input[type="time"]::-moz-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0;
}

/* Improve dark mode appearance */
.dark input[type="date"],
.dark input[type="time"] {
  color-scheme: dark;
}

/* Smooth transitions */
input[type="date"]:focus,
input[type="time"]:focus {
  outline: none;
}

/* Make relative container ensure proper z-index stacking */
.relative {
  position: relative;
}

.relative input[type="date"],
.relative input[type="time"] {
  z-index: 0;
}

.relative > div.absolute {
  z-index: 0;
  pointer-events: none;
}
</style>
